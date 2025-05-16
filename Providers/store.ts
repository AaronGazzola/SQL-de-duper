// Providers/store.ts
import sqlPatterns from "@/constants/SQLPatterns";
import { SQLParser } from "@/services/SQLParser";
import {
  File as FileType,
  Filter,
  ParsedFile,
  SQLPattern,
  Statement,
  UploadProgress,
} from "@/types/app.types";
import { create } from "zustand";

interface StoreState {
  isUploadDialogOpen: boolean;
  isEditorDialogOpen: boolean;
  rawEditorSQL: string;

  parseResults: ParsedFile[];
  isProcessing: boolean;
  uploadProgress: Record<string, UploadProgress>;
  unparsedSQL: string;
  totalLines: number;
  parsedLines: number;

  // Changed from Record<string, SQLPattern[]> to SQLPattern[]
  sqlPatterns: SQLPattern[];
  initialSqlPatterns: SQLPattern[];
  patternUsageStats: Record<string, Record<string, boolean>>;

  filters: Filter;

  setUploadDialogOpen: (isOpen: boolean) => void;
  setEditorDialogOpen: (isOpen: boolean) => void;
  setRawEditorSQL: (sql: string) => void;
  addFile: (file: FileType) => void;
  removeFile: (index: number) => void;
  parseFiles: (files?: FileType[]) => Promise<void>;
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
  updatePatternUsage: (
    type: string,
    patternStr: string,
    isUsed: boolean
  ) => void;
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

// Load stored patterns if they exist
const loadStoredPatterns = (): SQLPattern[] => {
  if (typeof window === "undefined") return sqlPatterns;

  try {
    const storedPatterns = localStorage.getItem("sqlPatterns");
    if (storedPatterns) {
      // Convert stored patterns back to SQLPattern objects with RegExp
      const parsedPatterns = JSON.parse(storedPatterns);
      return Array.isArray(parsedPatterns)
        ? parsedPatterns.map((p) => {
            const regexMatch = p.regex.match(/\/(.*)\/([gimuy]*)/);
            if (regexMatch) {
              const [, pattern, flags] = regexMatch;
              return {
                ...p,
                regex: new RegExp(pattern, flags),
              };
            }
            return p;
          })
        : sqlPatterns;
    }
    return sqlPatterns;
  } catch (error) {
    console.error("Error loading stored patterns:", error);
    return sqlPatterns;
  }
};

// Load stored pattern usage if it exists
const loadPatternUsage = (): Record<string, Record<string, boolean>> => {
  if (typeof window === "undefined") return {};

  try {
    const storedUsage = localStorage.getItem("patternUsage");
    return storedUsage ? JSON.parse(storedUsage) : {};
  } catch (error) {
    console.error("Error loading pattern usage:", error);
    return {};
  }
};

export const useStore = create<StoreState>((set, get) => ({
  isUploadDialogOpen: false,
  isEditorDialogOpen: false,
  rawEditorSQL: "",

  parseResults: loadStoredData(),
  isProcessing: false,
  uploadProgress: {},
  unparsedSQL: "",
  totalLines: 0,
  parsedLines: 0,

  // Changed from object of arrays to a single array
  sqlPatterns: loadStoredPatterns(),
  initialSqlPatterns: [...sqlPatterns],
  patternUsageStats: loadPatternUsage(),

  filters: {
    types: [],
    latestOnly: true,
    searchTerm: "",
    showUnparsed: false,
  },

  setUploadDialogOpen: (isOpen) => set({ isUploadDialogOpen: isOpen }),

  setEditorDialogOpen: (isOpen) => {
    set({ isEditorDialogOpen: isOpen });
  },

  setRawEditorSQL: (sql) => set({ rawEditorSQL: sql }),

  addFile: (file) => {
    set((state) => ({
      parseResults: [
        ...state.parseResults,
        {
          filename: file.name,
          originalContent: "",
          statements: [],
          stats: {
            total: 0,
            parsed: 0,
            percentage: 0,
          },
        },
      ],
    }));
  },

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
      let filesToParse = files;
      const currentResults = get().parseResults;

      // If no files are provided, use the files from existing results
      if (!filesToParse) {
        // Create a new array of FileType objects from the current parse results
        filesToParse = await Promise.all(
          currentResults.map(async (result) => {
            // Create a new FileType object with the existing data
            const fileData = new Blob([result.originalContent], {
              type: "text/plain",
            });
            const file = new File([fileData], result.filename, {
              type: "text/plain",
            });
            return file;
          })
        );
      }

      // Ensure we have files to parse
      if (!filesToParse || filesToParse.length === 0) {
        set({ isProcessing: false });
        return;
      }

      const parseResults: ParsedFile[] = await Promise.all(
        filesToParse.map(async (file) => {
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

          const { parsedFile, unparsedSQL, usedPatterns } = sqlParser.parse(
            fileContent,
            file.name,
            patterns
          );

          // Update pattern usage stats
          Object.entries(usedPatterns).forEach(([type, patternStrings]) => {
            patternStrings.forEach((patternStr) => {
              get().updatePatternUsage(type, patternStr, true);
            });
          });

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

      // If we're reparsing existing files, replace them instead of adding new ones
      let updatedResults: ParsedFile[];
      if (!files) {
        // Reparsing - replace existing files with the same names
        updatedResults = [...currentResults];
        parseResults.forEach((newResult) => {
          const existingIndex = updatedResults.findIndex(
            (r) => r.filename === newResult.filename
          );
          if (existingIndex >= 0) {
            updatedResults[existingIndex] = newResult;
          } else {
            updatedResults.push(newResult);
          }
        });
      } else {
        // New files - just append to existing results
        updatedResults = [...currentResults, ...parseResults];
      }

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

  updatePatternUsage: (type, patternStr, isUsed) =>
    set((state) => {
      const updatedUsage = { ...state.patternUsageStats };

      if (!updatedUsage[type]) {
        updatedUsage[type] = {};
      }

      updatedUsage[type][patternStr] = isUsed;

      if (typeof window !== "undefined") {
        localStorage.setItem("patternUsage", JSON.stringify(updatedUsage));
      }

      return {
        patternUsageStats: updatedUsage,
      };
    }),

  setSqlPattern: (key, pattern, description) =>
    set((state) => {
      // Create new pattern object
      const newPattern: SQLPattern = {
        regex: pattern,
        isDefault: false,
        description: description || `Custom pattern`,
        createdAt: Date.now(),
      };

      // Check if pattern already exists in the array
      const patternExists = state.sqlPatterns.some(
        (p) => p.regex.toString() === pattern.toString()
      );

      if (!patternExists) {
        const updatedPatterns = [...state.sqlPatterns, newPattern];

        // Store the updated patterns in localStorage
        if (typeof window !== "undefined") {
          // Convert RegExp to string for storage
          const serializablePatterns = updatedPatterns.map((p) => ({
            ...p,
            regex: p.regex.toString(),
          }));
          localStorage.setItem(
            "sqlPatterns",
            JSON.stringify(serializablePatterns)
          );
        }

        return {
          sqlPatterns: updatedPatterns,
        };
      }

      return { sqlPatterns: state.sqlPatterns };
    }),

  removePattern: (key, index) =>
    set((state) => {
      // Make sure we have at least one pattern (can be a default pattern)
      if (state.sqlPatterns.length <= 1) {
        return { sqlPatterns: state.sqlPatterns };
      }

      // Remove the pattern at the specified index
      const updatedPatterns = state.sqlPatterns.filter((_, i) => i !== index);

      // Store the updated patterns in localStorage
      if (typeof window !== "undefined") {
        // Convert RegExp to string for storage
        const serializablePatterns = updatedPatterns.map((p) => ({
          ...p,
          regex: p.regex.toString(),
        }));
        localStorage.setItem(
          "sqlPatterns",
          JSON.stringify(serializablePatterns)
        );
      }

      return {
        sqlPatterns: updatedPatterns,
      };
    }),

  resetSqlPatterns: () =>
    set((state) => {
      // Keep only default patterns
      const defaultPatterns = state.sqlPatterns.filter((p) => p.isDefault);

      // Store the reset patterns in localStorage
      if (typeof window !== "undefined") {
        // Convert RegExp to string for storage
        const serializablePatterns = defaultPatterns.map((p) => ({
          ...p,
          regex: p.regex.toString(),
        }));
        localStorage.setItem(
          "sqlPatterns",
          JSON.stringify(serializablePatterns)
        );
      }

      return {
        sqlPatterns: defaultPatterns,
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
      patternUsageStats: {},
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("parseResults");
      localStorage.removeItem("patternUsage");
    }
  },
}));
