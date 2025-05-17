// Providers/store.ts
import { SQLParser } from "@/services/SQLParser";
import {
  File as FileType,
  Filter,
  ParsedFile,
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

  sqlPatterns: RegExp[];
  initialSqlPatterns: RegExp[];
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
  setSqlPattern: (pattern: RegExp, description?: string) => void;
  removePattern: (index: number) => void;
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
const loadStoredPatterns = (): RegExp[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedPatterns = localStorage.getItem("sqlPatterns");
    if (storedPatterns) {
      // Convert stored patterns back to RegExp objects
      const parsedPatterns = JSON.parse(storedPatterns);
      return Array.isArray(parsedPatterns)
        ? parsedPatterns.map((p) => {
            if (typeof p === "string") {
              const regexMatch = p.match(/\/(.*)\/([gimuy]*)/);
              if (regexMatch) {
                const [, pattern, flags] = regexMatch;
                return new RegExp(pattern, flags);
              }
              return new RegExp(p);
            }
            return p;
          })
        : [];
    }
    return [];
  } catch (error) {
    console.error("Error loading stored patterns:", error);
    return [];
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

  sqlPatterns: loadStoredPatterns(),
  initialSqlPatterns: [],
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

      // Recalculate total and parsed lines based on file stats
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

      // Calculate total and parsed lines from file stats
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
    // Calculate total and parsed lines from file stats
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

          // Calculate the number of lines in the statement
          const statementLineCount = statement.content.split("\n").length;

          // Calculate new stats
          const updatedStats = {
            ...file.stats,
            parsed: file.stats.parsed + statementLineCount,
          };

          // Ensure parsed doesn't exceed total
          updatedStats.parsed = Math.min(updatedStats.parsed, file.stats.total);

          // Recalculate percentage
          updatedStats.percentage = Math.round(
            (updatedStats.parsed / file.stats.total) * 100
          );

          return {
            ...file,
            statements,
            stats: updatedStats,
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
      let lineCountDifference = 0;

      const updatedResults = state.parseResults.map((file) => {
        const statements = file.statements.map((statement) => {
          if (statement.id === id) {
            if (
              updatedStatement.content &&
              updatedStatement.content !== statement.content
            ) {
              const oldLines = statement.content.split("\n").length;
              const newLines = updatedStatement.content.split("\n").length;
              lineCountDifference = newLines - oldLines;
            }

            return { ...statement, ...updatedStatement };
          }
          return statement;
        });

        if (statements.some((s) => s.id === id)) {
          // Update file stats
          const updatedParsed = file.stats.parsed + lineCountDifference;
          const parsed = Math.min(updatedParsed, file.stats.total); // Ensure parsed doesn't exceed total
          const percentage = Math.round((parsed / file.stats.total) * 100);

          return {
            ...file,
            statements,
            stats: {
              ...file.stats,
              parsed,
              percentage,
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
      const updatedResults = state.parseResults.map((file) => {
        const statementToRemove = file.statements.find((s) => s.id === id);

        if (statementToRemove) {
          const lineCount = statementToRemove.content.split("\n").length;
          const statements = file.statements.filter((s) => s.id !== id);

          // Calculate new stats
          const parsed = Math.max(0, file.stats.parsed - lineCount);
          const percentage = Math.round((parsed / file.stats.total) * 100);

          return {
            ...file,
            statements,
            stats: {
              ...file.stats,
              parsed,
              percentage,
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

  setSqlPattern: (pattern) =>
    set((state) => {
      // Check if pattern already exists in the array
      const patternExists = state.sqlPatterns.some(
        (p) => p.toString() === pattern.toString()
      );

      if (!patternExists) {
        const updatedPatterns = [...state.sqlPatterns, pattern];

        // Store the updated patterns in localStorage
        if (typeof window !== "undefined") {
          // Convert RegExp to string for storage
          const serializablePatterns = updatedPatterns.map((p) => p.toString());
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

  removePattern: (index) =>
    set((state) => {
      // Make sure we have at least one pattern
      if (state.sqlPatterns.length <= 1) {
        return { sqlPatterns: state.sqlPatterns };
      }

      // Remove the pattern at the specified index
      const updatedPatterns = state.sqlPatterns.filter((_, i) => i !== index);

      // Store the updated patterns in localStorage
      if (typeof window !== "undefined") {
        // Convert RegExp to string for storage
        const serializablePatterns = updatedPatterns.map((p) => p.toString());
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
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sqlPatterns");
      }

      return {
        sqlPatterns: [],
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
