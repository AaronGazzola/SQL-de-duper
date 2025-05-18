// providers/store.ts
"use client";

import { File, Filter, ParseResult, StatementGroup } from "@/types/app.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_FILTERS: Filter = {
  types: [],
  latestOnly: true,
  searchTerm: "",
  showUnparsed: false,
};

export const useStore = create<{
  statements: StatementGroup[];
  filters: Filter;
  statementTypes: string[];
  parseResults: ParseResult[];
  totalLines: number;
  parsedLines: number;
  selectedFile: string | null;
  files: {
    filename: string;
    timestamp: number;
    isParsed: boolean;
  }[];
  onFilesDrop: (files: File[]) => Promise<void>;
  setFilters: (filters: Filter) => void;
  resetStore: () => void;
  selectFile: (filename: string) => void;
  copyParsedSQL: () => Promise<void>;
  downloadParsedSQL: () => void;
  setFileStats: (filename: string, total: number, parsed: number) => void;
  setParseProgress: (filename: string, parsed: number) => void;
  toggleFileParsed: (filename: string, isParsed: boolean) => void;
}>()(
  persist(
    (set, get) => ({
      statements: [],
      filters: DEFAULT_FILTERS,
      statementTypes: [],
      parseResults: [],
      totalLines: 0,
      parsedLines: 0,
      selectedFile: null,
      files: [],

      // Handle file drops
      onFilesDrop: async (files: File[]) => {
        const { parseResults: existingParseResults, files: existingFiles } =
          get();
        const newParseResults: ParseResult[] = [...existingParseResults];
        const newFiles = [...existingFiles];
        let totalLinesCount = 0;
        const parsedLinesCount = 0;

        // Process each file
        for (const file of files) {
          try {
            // Read the file content as text
            const fileContent = await file.text();
            const lineCount = fileContent.split("\n").length;

            // Extract timestamp from filename if possible, or use current time
            let timestamp = Date.now();
            const fileNameTimestampMatch = file.name.match(/^(\d+)/);
            if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
              timestamp = parseInt(fileNameTimestampMatch[1], 10);
            }

            // Create parse result with filename, file contents, and timestamp
            const newParseResult: ParseResult = {
              filename: file.name,
              content: fileContent, // Store the file content for later use
              timestamp: timestamp,
              stats: {
                total: lineCount,
                parsed: 0, // Initially parsed is 0
              },
            };

            // Add file metadata to files array
            if (!newFiles.some((f) => f.filename === file.name)) {
              newFiles.push({
                filename: file.name,
                timestamp: timestamp,
                isParsed: false,
              });
            }

            // Update total lines count
            totalLinesCount += lineCount;

            // Add to parse results
            newParseResults.push(newParseResult);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }

        // Update state with the processed files
        set((state) => ({
          parseResults: newParseResults,
          files: newFiles,
          totalLines: state.totalLines + totalLinesCount,
          parsedLines: state.parsedLines + parsedLinesCount,
          selectedFile:
            state.selectedFile ||
            (newParseResults.length > 0 ? newParseResults[0].filename : null),
        }));
      },

      // Set filters
      setFilters: (filters: Filter) => {
        set({ filters });
      },

      // Reset store
      resetStore: () => {
        set({
          statements: [],
          filters: DEFAULT_FILTERS,
          statementTypes: [],
          parseResults: [],
          totalLines: 0,
          parsedLines: 0,
          selectedFile: null,
          files: [],
        });
      },

      // Select file
      selectFile: (filename: string) => {
        set({ selectedFile: filename });
      },

      // Set file statistics
      setFileStats: (filename: string, total: number, parsed: number) => {
        set((state) => {
          const updatedParseResults = [...state.parseResults];
          const fileIndex = updatedParseResults.findIndex(
            (file) => file.filename === filename
          );

          if (fileIndex !== -1) {
            updatedParseResults[fileIndex].stats = {
              total,
              parsed,
            };

            // Calculate total lines and parsed lines across all files
            const totalLinesAcrossFiles = updatedParseResults.reduce(
              (sum, file) => sum + file.stats.total,
              0
            );
            const parsedLinesAcrossFiles = updatedParseResults.reduce(
              (sum, file) => sum + file.stats.parsed,
              0
            );

            return {
              parseResults: updatedParseResults,
              totalLines: totalLinesAcrossFiles,
              parsedLines: parsedLinesAcrossFiles,
            };
          }
          return state;
        });
      },

      // Set parse progress for a specific file
      setParseProgress: (filename: string, parsed: number) => {
        set((state) => {
          const updatedParseResults = [...state.parseResults];
          const fileIndex = updatedParseResults.findIndex(
            (file) => file.filename === filename
          );

          if (fileIndex !== -1) {
            // Get current total lines for this file
            const total = updatedParseResults[fileIndex].stats.total;

            // Ensure parsed doesn't exceed total
            const validatedParsed = Math.min(parsed, total);

            // Calculate difference in parsed lines
            const oldParsed = updatedParseResults[fileIndex].stats.parsed;
            const parsedDifference = validatedParsed - oldParsed;

            // Update file stats
            updatedParseResults[fileIndex].stats.parsed = validatedParsed;

            return {
              parseResults: updatedParseResults,
              parsedLines: state.parsedLines + parsedDifference,
            };
          }
          return state;
        });
      },

      // Toggle file parsed status
      toggleFileParsed: (filename: string, isParsed: boolean) => {
        set((state) => {
          // Update files array with isParsed flag
          const updatedFiles = [...state.files];
          const fileIndex = updatedFiles.findIndex(
            (file) => file.filename === filename
          );

          if (fileIndex !== -1) {
            updatedFiles[fileIndex].isParsed = isParsed;
          } else if (filename) {
            // If file doesn't exist in files array but we have a filename, add it
            let timestamp = Date.now();
            const fileNameTimestampMatch = filename.match(/^(\d+)/);
            if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
              timestamp = parseInt(fileNameTimestampMatch[1], 10);
            }

            updatedFiles.push({
              filename,
              timestamp,
              isParsed,
            });
          }

          // Update parse progress to match total lines if isParsed is true
          const updatedParseResults = [...state.parseResults];
          const parseResultIndex = updatedParseResults.findIndex(
            (result) => result.filename === filename
          );

          if (parseResultIndex !== -1) {
            const total = updatedParseResults[parseResultIndex].stats.total;
            const oldParsed =
              updatedParseResults[parseResultIndex].stats.parsed;
            const newParsed = isParsed ? total : 0;
            const parsedDifference = newParsed - oldParsed;

            updatedParseResults[parseResultIndex].stats.parsed = newParsed;

            return {
              files: updatedFiles,
              parseResults: updatedParseResults,
              parsedLines: state.parsedLines + parsedDifference,
            };
          }

          return {
            files: updatedFiles,
          };
        });
      },

      // Copy parsed SQL to clipboard
      copyParsedSQL: async () => {
        const { statements } = get();
        if (statements.length === 0) return;

        const parsedSQL = statements
          .map((group) => group.content.content)
          .join("\n\n");

        try {
          await navigator.clipboard.writeText(parsedSQL);
          console.log("SQL copied to clipboard");
        } catch (error) {
          console.error("Failed to copy SQL:", error);
        }
      },

      // Download parsed SQL
      downloadParsedSQL: () => {
        const { statements } = get();
        if (statements.length === 0) return;

        const parsedSQL = statements
          .map((group) => group.content.content)
          .join("\n\n");

        const blob = new Blob([parsedSQL], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "parsed_sql.sql";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: "sql-squasher-storage", // name of the item in localStorage
      partialize: (state) => ({
        statements: state.statements,
        filters: state.filters,
        statementTypes: state.statementTypes,
        parseResults: state.parseResults,
        totalLines: state.totalLines,
        parsedLines: state.parsedLines,
        selectedFile: state.selectedFile,
        files: state.files,
      }),
    }
  )
);
