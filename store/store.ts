// store/store.ts
import { SQLParser } from "@/services/SQLParser";
import {
  File,
  Filter,
  ParsedFile,
  Statement,
  UnparsedSection,
  UploadProgress,
} from "@/types/app.types";
import { create } from "zustand";

// Define the store state interface
interface StoreState {
  isSidebarOpen: boolean;
  isUploadDialogOpen: boolean;
  isEditorDialogOpen: boolean;
  rawEditorSQL: string;

  // Parse State
  parseResults: ParsedFile[];
  isProcessing: boolean;
  uploadProgress: Record<string, UploadProgress>;

  // Statement State
  filters: Filter;

  toggleSidebar: () => void;
  setUploadDialogOpen: (isOpen: boolean) => void;
  setEditorDialogOpen: (isOpen: boolean) => void;
  setRawEditorSQL: (sql: string) => void;
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  parseFiles: (files: File[]) => Promise<void>;
  updateParseResults: (results: ParsedFile[]) => void;
  setFilters: (filters: Filter) => void;
  addStatement: (statement: Statement) => void;
  updateStatement: (id: string, statement: Partial<Statement>) => void;
  removeStatement: (id: string) => void;
  generateSQL: () => string;
  updateUnparsedSection: (
    id: string,
    updatedSection: Partial<UnparsedSection>
  ) => void;
  resetStore: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial UI State
  currentView: "upload",
  isSidebarOpen: true,
  isUploadDialogOpen: false,
  isEditorDialogOpen: false,
  rawEditorSQL: "",

  // Initial Parse State
  parseResults: [],
  isProcessing: false,
  uploadProgress: {},

  // Initial Statement State
  filters: {
    types: [],
    latestOnly: true,
    searchTerm: "",
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setUploadDialogOpen: (isOpen) => set({ isUploadDialogOpen: isOpen }),

  setEditorDialogOpen: (isOpen) => {
    set({ isEditorDialogOpen: isOpen });
  },

  setRawEditorSQL: (sql) => set({ rawEditorSQL: sql }),

  addFile: () => {
    // This would be implemented in the parseFiles function
  },

  removeFile: (index) =>
    set((state) => ({
      parseResults: state.parseResults.filter((_, i) => i !== index),
    })),

  parseFiles: async (files) => {
    set({ isProcessing: true });
    const sqlParser = new SQLParser();

    try {
      const parseResults: ParsedFile[] = await Promise.all(
        files.map(async (file) => {
          // Update upload progress
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [file.name]: {
                loaded: 0,
                total: file.size,
                percentage: 0,
              },
            },
          }));

          const fileContent = await file.text();

          // Use SQLParser to parse the file
          const parsedFile = sqlParser.parse(fileContent, file.name);

          // Update to 100% when done
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [file.name]: {
                loaded: file.size,
                total: file.size,
                percentage: 100,
              },
            },
          }));

          return parsedFile;
        })
      );

      set((state) => ({
        parseResults: [...state.parseResults, ...parseResults],
        isProcessing: false,
      }));

      // Persist to localStorage if needed
      localStorage.setItem("parseResults", JSON.stringify(get().parseResults));

      return Promise.resolve();
    } catch (error) {
      set({ isProcessing: false });
      return Promise.reject(error);
    }
  },

  updateParseResults: (results) => set({ parseResults: results }),

  setFilters: (filters) => set({ filters }),

  addStatement: (statement) =>
    set((state) => {
      // Find the file this statement belongs to
      const updatedResults = state.parseResults.map((file) => {
        if (file.filename === statement.fileName) {
          return {
            ...file,
            statements: [...file.statements, statement],
            stats: {
              ...file.stats,
              parsed: file.stats.parsed + 1,
              percentage: Math.round(
                ((file.stats.parsed + 1) / file.stats.total) * 100
              ),
            },
          };
        }
        return file;
      });

      return { parseResults: updatedResults };
    }),

  updateStatement: (id, updatedStatement) =>
    set((state) => {
      const updatedResults = state.parseResults.map((file) => {
        return {
          ...file,
          statements: file.statements.map((statement) =>
            statement.id === id
              ? { ...statement, ...updatedStatement }
              : statement
          ),
        };
      });

      return { parseResults: updatedResults };
    }),

  removeStatement: (id) =>
    set((state) => {
      const updatedResults = state.parseResults.map((file) => {
        const statementToRemove = file.statements.find((s) => s.id === id);

        if (statementToRemove) {
          return {
            ...file,
            statements: file.statements.filter((s) => s.id !== id),
            stats: {
              ...file.stats,
              parsed: file.stats.parsed - 1,
              percentage: Math.round(
                ((file.stats.parsed - 1) / file.stats.total) * 100
              ),
            },
          };
        }

        return file;
      });

      return { parseResults: updatedResults };
    }),

  updateUnparsedSection: (id, updatedSection) =>
    set((state) => {
      const updatedResults = state.parseResults.map((file) => {
        return {
          ...file,
          unparsedSections: file.unparsedSections.map((section) =>
            section.id === id ? { ...section, ...updatedSection } : section
          ),
        };
      });

      return { parseResults: updatedResults };
    }),

  generateSQL: () => {
    const { parseResults } = get();
    let generatedSQL = "-- Generated SQL\n\n";

    // Organize statements by type
    const statementsByType: Record<string, Statement[]> = {};

    parseResults.forEach((file) => {
      file.statements.forEach((statement) => {
        if (!statementsByType[statement.type]) {
          statementsByType[statement.type] = [];
        }
        statementsByType[statement.type].push(statement);
      });
    });

    // Add statements by type
    Object.entries(statementsByType).forEach(([type, statements]) => {
      generatedSQL += `-- ${type} Statements\n`;
      statements.forEach((statement) => {
        generatedSQL += `${statement.content}\n\n`;
      });
      generatedSQL += "\n";
    });

    return generatedSQL;
  },

  resetStore: () => {
    set({
      parseResults: [],
      isProcessing: false,
      uploadProgress: {},
      filters: {
        types: [],
        latestOnly: true,
        searchTerm: "",
      },
      rawEditorSQL: "",
      isEditorDialogOpen: false,
    });
  },
}));
