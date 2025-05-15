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

  // SQL Patterns
  sqlPatterns: Record<string, RegExp>;
  initialSqlPatterns: Record<string, RegExp>;

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
  resetSqlPatterns: () => void;
  setSqlPattern: (key: string, pattern: RegExp) => void;
}

// Initialize store with saved data if available
const loadStoredData = (): ParsedFile[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedData = localStorage.getItem("parseResults");
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error("Error loading stored data:", error);
    return [];
  }
};

// Initial SQL patterns
const initialPatterns = {
  function:
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\(/i,
  trigger: /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([a-zA-Z0-9_]+)\s/i,
  policy: /CREATE\s+POLICY\s+(?:")?([a-zA-Z0-9_\s]+)(?:")?\s+ON\s+/i,
  index: /CREATE\s+(?:UNIQUE\s+)?INDEX\s+([a-zA-Z0-9_]+)\s+ON\s+/i,
  type: /CREATE\s+TYPE\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+/i,
  table:
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(/i,
  view: /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?([a-zA-Z0-9_]+)\s+AS\s+/i,
  constraint: /ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+/i,
  grant:
    /GRANT\s+(\w+(?:\s*,\s*\w+)*)\s+ON\s+(?:TABLE\s+)?(?:FUNCTION\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
  revoke:
    /REVOKE\s+(\w+(?:\s*,\s*\w+)*)\s+ON\s+(?:TABLE\s+)?(?:FUNCTION\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i,
  comment:
    /COMMENT\s+ON\s+(?:TABLE|COLUMN|FUNCTION|TYPE|POLICY)\s+(?:public\.)?([a-zA-Z0-9_]+)/i,
  alter: /ALTER\s+(?:TABLE|COLUMN|TYPE)\s+(?:public\.)?([a-zA-Z0-9_]+)/i,
  extension: /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
  plpgsql: /DO\s+\$\$/i,
  dropPolicy:
    /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:")?([a-zA-Z0-9_\s]+)(?:")?/i,
  dropTrigger: /DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i,
};

export const useStore = create<StoreState>((set, get) => ({
  // Initial UI State
  currentView: "upload",
  isSidebarOpen: true,
  isUploadDialogOpen: false,
  isEditorDialogOpen: false,
  rawEditorSQL: "",

  // Initial Parse State
  parseResults: loadStoredData(),
  isProcessing: false,
  uploadProgress: {},

  // Initial SQL Patterns from the script file
  sqlPatterns: { ...initialPatterns },
  initialSqlPatterns: { ...initialPatterns },

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
    set((state) => {
      const updatedResults = state.parseResults.filter((_, i) => i !== index);

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

      return { parseResults: updatedResults };
    }),

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

          // Get current patterns from store and pass to parser
          const patterns = get().sqlPatterns;

          // Use SQLParser to parse the file
          const parsedFile = sqlParser.parse(fileContent, file.name, patterns);

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

      const updatedResults = [...get().parseResults, ...parseResults];

      set({
        parseResults: updatedResults,
        isProcessing: false,
      });

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

      return Promise.resolve();
    } catch (error) {
      set({ isProcessing: false });
      return Promise.reject(error);
    }
  },

  updateParseResults: (results) => {
    set({ parseResults: results });

    // Update localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("parseResults", JSON.stringify(results));
    }
  },

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

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

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

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

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

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

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

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

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

  setSqlPattern: (key, pattern) =>
    set((state) => ({
      sqlPatterns: {
        ...state.sqlPatterns,
        [key]: pattern,
      },
    })),

  resetSqlPatterns: () =>
    set((state) => ({
      sqlPatterns: { ...state.initialSqlPatterns },
    })),

  resetStore: () => {
    // Clear in-memory state
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

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("parseResults");
    }
  },
}));
