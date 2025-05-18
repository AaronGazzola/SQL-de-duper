// providers/store.ts
"use client";

import { File, FileData, Filter, StatementGroup } from "@/types/app.types";
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
  files: FileData[]; // Original uploaded files
  editorFiles: FileData[]; // Editable copies for the editor
  totalLines: number;
  parsedLines: number;
  selectedFile: string | null;
  onFilesDrop: (files: File[]) => Promise<void>;
  setFilters: (filters: Filter) => void;
  resetStore: () => void;
  selectFile: (filename: string) => void;
  copyParsedSQL: () => Promise<void>;
  downloadParsedSQL: () => void;
  setFileStats: (filename: string, total: number, parsed: number) => void;
  setParseProgress: (filename: string, parsed: number) => void;
  toggleFileParsed: (filename: string, isParsed: boolean) => void;
  addStatement: (name: string, content: string, fileName: string) => void;
  resetFile: (filename: string) => void;
  updateFileContent: (filename: string, content: string) => void;
}>()(
  persist(
    (set, get) => ({
      statements: [],
      filters: DEFAULT_FILTERS,
      statementTypes: [],
      files: [], // Original files
      editorFiles: [], // Editable copies
      totalLines: 0,
      parsedLines: 0,
      selectedFile: null,

      // Handle file drops
      onFilesDrop: async (files: File[]) => {
        const { files: existingFiles, editorFiles: existingEditorFiles } =
          get();
        const newFiles: FileData[] = [...existingFiles];
        const newEditorFiles: FileData[] = [...existingEditorFiles];
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

            // Create file data object for both original and editor files
            const newFileData: FileData = {
              filename: file.name,
              content: fileContent,
              timestamp: timestamp,
              stats: {
                total: lineCount,
                parsed: 0, // Initially parsed is 0
              },
            };

            // Add to original files array if not already present
            if (!newFiles.some((f) => f.filename === file.name)) {
              newFiles.push(newFileData);
            }

            // Add to editor files array if not already present (clone of the original)
            if (!newEditorFiles.some((f) => f.filename === file.name)) {
              newEditorFiles.push({ ...newFileData });
            }

            // Update total lines count
            totalLinesCount += lineCount;
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }

        // Update state with the processed files
        set((state) => ({
          files: newFiles,
          editorFiles: newEditorFiles,
          totalLines: state.totalLines + totalLinesCount,
          parsedLines: state.parsedLines + parsedLinesCount,
          selectedFile:
            state.selectedFile ||
            (newFiles.length > 0 ? newFiles[0].filename : null),
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
          files: [],
          editorFiles: [],
          totalLines: 0,
          parsedLines: 0,
          selectedFile: null,
        });
      },

      // Select file
      selectFile: (filename: string) => {
        set({ selectedFile: filename });
      },

      // Set file statistics
      setFileStats: (filename: string, total: number, parsed: number) => {
        set((state) => {
          const updatedFiles = [...state.files];
          const updatedEditorFiles = [...state.editorFiles];

          // Update original files
          const fileIndex = updatedFiles.findIndex(
            (file) => file.filename === filename
          );

          if (fileIndex !== -1 && updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].stats = {
              total,
              parsed,
            };
          }

          // Update editor files
          const editorFileIndex = updatedEditorFiles.findIndex(
            (file) => file.filename === filename
          );

          if (editorFileIndex !== -1) {
            updatedEditorFiles[editorFileIndex].stats = {
              total,
              parsed,
            };
          }

          // Calculate total lines and parsed lines across all files
          const totalLinesAcrossFiles = updatedFiles.reduce(
            (sum, file) => sum + file.stats.total,
            0
          );
          const parsedLinesAcrossFiles = updatedFiles.reduce(
            (sum, file) => sum + file.stats.parsed,
            0
          );

          return {
            files: updatedFiles,
            editorFiles: updatedEditorFiles,
            totalLines: totalLinesAcrossFiles,
            parsedLines: parsedLinesAcrossFiles,
          };
        });
      },

      // Set parse progress for a specific file
      setParseProgress: (filename: string, parsed: number) => {
        set((state) => {
          const updatedFiles = [...state.files];
          const updatedEditorFiles = [...state.editorFiles];

          // Update original files
          const fileIndex = updatedFiles.findIndex(
            (file) => file.filename === filename
          );

          let parsedDifference = 0;

          if (fileIndex !== -1) {
            // Get current total lines for this file
            const total = updatedFiles[fileIndex].stats.total;

            // Ensure parsed doesn't exceed total
            const validatedParsed = Math.min(parsed, total);

            // Calculate difference in parsed lines
            const oldParsed = updatedFiles[fileIndex].stats.parsed;
            parsedDifference = validatedParsed - oldParsed;

            // Update file stats
            updatedFiles[fileIndex].stats.parsed = validatedParsed;
          }

          // Update editor files
          const editorFileIndex = updatedEditorFiles.findIndex(
            (file) => file.filename === filename
          );

          if (editorFileIndex !== -1) {
            const total = updatedEditorFiles[editorFileIndex].stats.total;
            const validatedParsed = Math.min(parsed, total);
            updatedEditorFiles[editorFileIndex].stats.parsed = validatedParsed;
          }

          return {
            files: updatedFiles,
            editorFiles: updatedEditorFiles,
            parsedLines: state.parsedLines + parsedDifference,
          };
        });
      },

      // Toggle file parsed status
      toggleFileParsed: (filename: string, isParsed: boolean) => {
        set((state) => {
          // Update both original and editor files
          const updatedFiles = [...state.files];
          const updatedEditorFiles = [...state.editorFiles];

          let parsedDifference = 0;

          // Update original files' stats
          const fileIndex = updatedFiles.findIndex(
            (file) => file.filename === filename
          );

          if (fileIndex !== -1) {
            const total = updatedFiles[fileIndex].stats.total;
            const oldParsed = updatedFiles[fileIndex].stats.parsed;
            const newParsed = isParsed ? total : 0;
            parsedDifference = newParsed - oldParsed;

            updatedFiles[fileIndex].stats.parsed = newParsed;
            updatedFiles[fileIndex].isParsed = isParsed;
          }

          // Update editor files' stats
          const editorFileIndex = updatedEditorFiles.findIndex(
            (file) => file.filename === filename
          );

          if (editorFileIndex !== -1) {
            const total = updatedEditorFiles[editorFileIndex].stats.total;
            updatedEditorFiles[editorFileIndex].stats.parsed = isParsed
              ? total
              : 0;
            updatedEditorFiles[editorFileIndex].isParsed = isParsed;
          }

          return {
            files: updatedFiles,
            editorFiles: updatedEditorFiles,
            parsedLines: state.parsedLines + parsedDifference,
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

      // Add statement from editor
      addStatement: (name: string, content: string, fileName: string) => {
        set((state) => {
          const { statements, editorFiles } = state;

          if (!name || !content || !fileName) return state;

          // Get current file timestamp
          const currentFile = state.files.find(
            (file) => file.filename === fileName
          );

          let timestamp = Date.now();
          if (currentFile?.timestamp) {
            timestamp = currentFile.timestamp;
          } else if (currentFile?.filename) {
            const fileNameTimestampMatch = currentFile.filename.match(/^(\d+)/);
            if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
              timestamp = parseInt(fileNameTimestampMatch[1], 10);
            }
          }

          // Create statement object
          const newStatement = {
            id: Math.random().toString(36).substring(2, 9),
            type: "SQL",
            name,
            content,
            fileName,
            timestamp,
            hash: `SQL_${name}_${timestamp}`,
            parsed: true,
          };

          // Check if there's an existing statement group with the same name
          const existingGroupIndex = statements.findIndex(
            (group) => group.content.name === name
          );

          let updatedStatements = [...statements];

          if (existingGroupIndex !== -1) {
            // Add as a version to existing statement group
            updatedStatements[existingGroupIndex].versions.push(newStatement);
          } else {
            // Create a new statement group
            const newStatementGroup = {
              id: Math.random().toString(36).substring(2, 9),
              content: newStatement,
              versions: [],
            };
            updatedStatements = [...statements, newStatementGroup];
          }

          // Update the editor file content by removing the extracted content
          const updatedEditorFiles = [...editorFiles];
          const editorFileIndex = updatedEditorFiles.findIndex(
            (f) => f.filename === fileName
          );

          if (editorFileIndex !== -1) {
            const originalContent =
              updatedEditorFiles[editorFileIndex].content || "";
            const newContent = originalContent.replace(content, "");
            updatedEditorFiles[editorFileIndex].content = newContent;

            // Update parse progress based on the removed content
            const originalLineCount = originalContent.split("\n").length;
            const newLineCount = newContent.split("\n").length;
            const removedLines = originalLineCount - newLineCount;

            // Update file stats
            const parsedLines =
              updatedEditorFiles[editorFileIndex].stats.parsed + removedLines;
            updatedEditorFiles[editorFileIndex].stats.parsed = Math.min(
              parsedLines,
              updatedEditorFiles[editorFileIndex].stats.total
            );

            // Check if the content is now empty or contains only whitespace
            const isEmptyContent = !newContent.trim();

            // If content is empty or only whitespace, mark the file as parsed
            if (isEmptyContent) {
              updatedEditorFiles[editorFileIndex].isParsed = true;

              // Also update the original file's parsed status
              const originalFileIndex = state.files.findIndex(
                (file) => file.filename === fileName
              );
              if (originalFileIndex !== -1) {
                state.files[originalFileIndex].isParsed = true;
              }
            }

            // Calculate the total parsed lines across all files
            const totalParsedLines = updatedEditorFiles.reduce(
              (sum, file) => sum + file.stats.parsed,
              0
            );

            return {
              statements: updatedStatements,
              editorFiles: updatedEditorFiles,
              files: [...state.files], // Include the updated original files
              parsedLines: totalParsedLines,
            };
          }

          return { statements: updatedStatements };
        });
      },

      // Reset file to original state
      resetFile: (filename: string) => {
        set((state) => {
          if (!filename) return state;

          // Find the original file data
          const originalFile = state.files.find(
            (file) => file.filename === filename
          );
          if (!originalFile) return state;

          // Reset the editor file with content from the original file
          const updatedEditorFiles = [...state.editorFiles];
          const editorFileIndex = updatedEditorFiles.findIndex(
            (file) => file.filename === filename
          );

          if (editorFileIndex !== -1 && originalFile) {
            // Reset content and stats
            updatedEditorFiles[editorFileIndex] = {
              ...originalFile,
              stats: {
                total: originalFile.stats.total,
                parsed: 0,
              },
              isParsed: false,
            };
          }

          // Calculate new total parsed lines
          const totalParsedLines = updatedEditorFiles.reduce(
            (sum, file) => sum + file.stats.parsed,
            0
          );

          // Remove statements related to this file
          const filteredStatements = state.statements.filter(
            (group) => group.content.fileName !== filename
          );

          return {
            editorFiles: updatedEditorFiles,
            statements: filteredStatements,
            parsedLines: totalParsedLines,
          };
        });
      },

      // Update file content in store
      updateFileContent: (filename: string, content: string) => {
        set((state) => {
          const updatedEditorFiles = [...state.editorFiles];
          const fileIndex = updatedEditorFiles.findIndex(
            (file) => file.filename === filename
          );

          if (fileIndex !== -1) {
            updatedEditorFiles[fileIndex].content = content;
            return { editorFiles: updatedEditorFiles };
          }
          return state;
        });
      },
    }),
    {
      name: "sql-squasher-storage", // name of the item in localStorage
      partialize: (state) => ({
        statements: state.statements,
        filters: state.filters,
        statementTypes: state.statementTypes,
        files: state.files,
        editorFiles: state.editorFiles,
        totalLines: state.totalLines,
        parsedLines: state.parsedLines,
        selectedFile: state.selectedFile,
      }),
    }
  )
);
