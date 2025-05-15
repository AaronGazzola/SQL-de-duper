// store/store.ts
import { SQLParser } from "@/services/SQLParser";
import {
  File,
  Filter,
  ParsedFile,
  Statement,
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
  unparsedSQL: string;
  totalLines: number;
  parsedLines: number;

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
  unparsedSQL: "",
  totalLines: 0,
  parsedLines: 0,

  // Initial SQL Patterns from the script file
  sqlPatterns: { ...initialPatterns },
  initialSqlPatterns: { ...initialPatterns },

  // Initial Statement State
  filters: {
    types: [],
    latestOnly: true,
    searchTerm: "",
    showUnparsed: false,
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

      // Recalculate total and parsed lines
      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

      return {
        parseResults: updatedResults,
        totalLines,
        parsedLines,
      };
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
          const { parsedFile, unparsedSQL } = sqlParser.parse(
            fileContent,
            file.name,
            patterns
          );

          // Store unparsed SQL in the store
          set((state) => ({
            unparsedSQL: state.unparsedSQL + unparsedSQL,
          }));

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

      // Calculate total and parsed lines from all files
      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

      set({
        parseResults: updatedResults,
        isProcessing: false,
        totalLines,
        parsedLines,
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
    // Calculate total and parsed lines from all files
    const totalLines = results.reduce((sum, file) => sum + file.stats.total, 0);
    const parsedLines = results.reduce(
      (sum, file) => sum + file.stats.parsed,
      0
    );

    set({
      parseResults: results,
      totalLines,
      parsedLines,
    });

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
          const statements = [...file.statements, statement];

          // Count lines in the statement content
          const statementLines = statement.content
            .split("\n")
            .filter((line) => line.trim()).length;

          return {
            ...file,
            statements,
            stats: {
              ...file.stats,
              parsed: file.stats.parsed + statementLines,
              percentage: Math.round(
                ((file.stats.parsed + statementLines) / file.stats.total) * 100
              ),
            },
          };
        }
        return file;
      });

      // Recalculate total and parsed lines
      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

      return {
        parseResults: updatedResults,
        totalLines,
        parsedLines,
      };
    }),

  updateStatement: (id, updatedStatement) =>
    set((state) => {
      // Keep track of line count changes
      let lineCountDelta = 0;

      const updatedResults = state.parseResults.map((file) => {
        const statements = file.statements.map((statement) => {
          if (statement.id === id) {
            // If the content has changed, calculate the line count difference
            if (
              updatedStatement.content &&
              updatedStatement.content !== statement.content
            ) {
              const oldLines = statement.content
                .split("\n")
                .filter((line) => line.trim()).length;
              const newLines = updatedStatement.content
                .split("\n")
                .filter((line) => line.trim()).length;
              lineCountDelta = newLines - oldLines;
            }

            return { ...statement, ...updatedStatement };
          }
          return statement;
        });

        // Only update the stats if this file contains the statement that was updated
        if (statements.some((s) => s.id === id)) {
          return {
            ...file,
            statements,
            stats: {
              ...file.stats,
              parsed: file.stats.parsed + lineCountDelta,
              percentage: Math.round(
                ((file.stats.parsed + lineCountDelta) / file.stats.total) * 100
              ),
            },
          };
        }
        return file;
      });

      // Recalculate total and parsed lines
      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

      return {
        parseResults: updatedResults,
        totalLines,
        parsedLines,
      };
    }),

  removeStatement: (id) =>
    set((state) => {
      let removedLineCount = 0;

      const updatedResults = state.parseResults.map((file) => {
        // Find the statement to be removed
        const statementToRemove = file.statements.find((s) => s.id === id);

        // Calculate lines to be removed if the statement exists in this file
        if (statementToRemove) {
          removedLineCount = statementToRemove.content
            .split("\n")
            .filter((line) => line.trim()).length;
        }

        const statements = file.statements.filter((s) => s.id !== id);

        // Only update stats if this file contained the removed statement
        if (file.statements.length !== statements.length) {
          return {
            ...file,
            statements,
            stats: {
              ...file.stats,
              parsed: file.stats.parsed - removedLineCount,
              percentage: Math.round(
                ((file.stats.parsed - removedLineCount) / file.stats.total) *
                  100
              ),
            },
          };
        }
        return file;
      });

      // Recalculate total and parsed lines
      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("parseResults", JSON.stringify(updatedResults));
      }

      return {
        parseResults: updatedResults,
        totalLines,
        parsedLines,
      };
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
      unparsedSQL: "",
      totalLines: 0,
      parsedLines: 0,
      filters: {
        types: [],
        latestOnly: true,
        searchTerm: "",
        showUnparsed: false,
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
