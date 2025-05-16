// store/store.ts
import sqlPatterns from "@/constants/SQLPatterns";
import { SQLParser } from "@/services/SQLParser";
import {
  File,
  Filter,
  ParsedFile,
  SQLPattern,
  Statement,
  UploadProgress,
} from "@/types/app.types";
import { create } from "zustand";

interface StoreState {
  isSidebarOpen: boolean;
  isUploadDialogOpen: boolean;
  isEditorDialogOpen: boolean;
  rawEditorSQL: string;

  parseResults: ParsedFile[];
  isProcessing: boolean;
  uploadProgress: Record<string, UploadProgress>;
  unparsedSQL: string;
  totalLines: number;
  parsedLines: number;

  sqlPatterns: Record<string, SQLPattern[]>;
  initialSqlPatterns: Record<string, SQLPattern[]>;

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
  setSqlPattern: (key: string, pattern: RegExp, description?: string) => void;
  removePattern: (key: string, index: number) => void;
}

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

// Load stored patterns if they exist, otherwise use defaults
const loadStoredPatterns = (): Record<string, SQLPattern[]> => {
  if (typeof window === "undefined") return { ...sqlPatterns };

  try {
    const storedPatterns = localStorage.getItem("sqlPatterns");
    return storedPatterns ? JSON.parse(storedPatterns) : { ...sqlPatterns };
  } catch (error) {
    console.error("Error loading stored patterns:", error);
    return { ...sqlPatterns };
  }
};

export const useStore = create<StoreState>((set, get) => ({
  currentView: "upload",
  isSidebarOpen: true,
  isUploadDialogOpen: false,
  isEditorDialogOpen: false,
  rawEditorSQL: "",

  parseResults: loadStoredData(),
  isProcessing: false,
  uploadProgress: {},
  unparsedSQL: "",
  totalLines: 0,
  parsedLines: 0,

  sqlPatterns: loadStoredPatterns(),
  initialSqlPatterns: { ...sqlPatterns },

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

  addFile: () => {},

  removeFile: (index) =>
    set((state) => {
      const updatedResults = state.parseResults.filter((_, i) => i !== index);

      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

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

          const patterns = get().sqlPatterns;

          const { parsedFile, unparsedSQL } = sqlParser.parse(
            fileContent,
            file.name,
            patterns
          );

          set((state) => ({
            unparsedSQL: state.unparsedSQL + unparsedSQL,
          }));

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

    if (typeof window !== "undefined") {
      localStorage.setItem("parseResults", JSON.stringify(results));
    }
  },

  setFilters: (filters) => set({ filters }),

  addStatement: (statement) =>
    set((state) => {
      const updatedResults = state.parseResults.map((file) => {
        if (file.filename === statement.fileName) {
          const statements = [...file.statements, statement];

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

      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

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
      let lineCountDelta = 0;

      const updatedResults = state.parseResults.map((file) => {
        const statements = file.statements.map((statement) => {
          if (statement.id === id) {
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

      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

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
        const statementToRemove = file.statements.find((s) => s.id === id);

        if (statementToRemove) {
          removedLineCount = statementToRemove.content
            .split("\n")
            .filter((line) => line.trim()).length;
        }

        const statements = file.statements.filter((s) => s.id !== id);

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

      const totalLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.total,
        0
      );
      const parsedLines = updatedResults.reduce(
        (sum, file) => sum + file.stats.parsed,
        0
      );

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

    const statementsByType: Record<string, Statement[]> = {};

    parseResults.forEach((file) => {
      file.statements.forEach((statement) => {
        if (!statementsByType[statement.type]) {
          statementsByType[statement.type] = [];
        }
        statementsByType[statement.type].push(statement);
      });
    });

    Object.entries(statementsByType).forEach(([type, statements]) => {
      generatedSQL += `-- ${type} Statements\n`;
      statements.forEach((statement) => {
        generatedSQL += `${statement.content}\n\n`;
      });
      generatedSQL += "\n";
    });

    return generatedSQL;
  },

  setSqlPattern: (key, pattern, description) =>
    set((state) => {
      // Get the current patterns for this key
      const currentPatterns = [...(state.sqlPatterns[key] || [])];

      // Create new pattern object
      const newPattern: SQLPattern = {
        regex: pattern,
        isDefault: false,
        description: description || `Custom pattern for ${key}`,
        createdAt: Date.now(),
      };

      // Check if pattern already exists in the array
      const patternExists = currentPatterns.some(
        (p) => p.regex.toString() === pattern.toString()
      );

      if (!patternExists) {
        const updatedPatterns = {
          ...state.sqlPatterns,
          [key]: [...currentPatterns, newPattern],
        };

        // Store the updated patterns in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("sqlPatterns", JSON.stringify(updatedPatterns));
        }

        return {
          sqlPatterns: updatedPatterns,
        };
      }

      return { sqlPatterns: state.sqlPatterns };
    }),

  removePattern: (key, index) =>
    set((state) => {
      // Get the current patterns for this key
      const currentPatterns = [...(state.sqlPatterns[key] || [])];

      // Don't allow removing the last pattern
      if (currentPatterns.length <= 1) {
        return { sqlPatterns: state.sqlPatterns };
      }

      // Remove the pattern at the specified index
      const updatedPatterns = currentPatterns.filter((_, i) => i !== index);

      const newPatternState = {
        ...state.sqlPatterns,
        [key]: updatedPatterns,
      };

      // Store the updated patterns in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sqlPatterns", JSON.stringify(newPatternState));
      }

      return {
        sqlPatterns: newPatternState,
      };
    }),

  resetSqlPatterns: () =>
    set((state) => {
      // Store the reset patterns in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "sqlPatterns",
          JSON.stringify(state.initialSqlPatterns)
        );
      }

      return {
        sqlPatterns: { ...state.initialSqlPatterns },
      };
    }),

  resetStore: () => {
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

    if (typeof window !== "undefined") {
      localStorage.removeItem("parseResults");
    }
  },
}));
