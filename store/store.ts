// store/store.ts
"use client";

import {
  File,
  FileData,
  Filter,
  Statement,
  StatementGroup,
  StoreState,
} from "@/types/app.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_FILTERS: Filter = {
  types: [],
  latestOnly: true,
  searchTerm: "",
  showUnparsed: false,
};

export const useStore = create<
  StoreState & {
    isDialogOpen: boolean;
    sqlAnalysis: {
      includedStatements: {
        name: string;
        timestamp: number;
        position: number;
      }[];
      omittedStatements: { name: string; timestamp: number }[];
    };
    openDialog: () => void;
    closeDialog: () => void;
    deleteStatement: (versionId: string) => void;
  }
>()(
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
      isDialogOpen: false,
      sqlAnalysis: {
        includedStatements: [],
        omittedStatements: [],
      },

      // Dialog control
      openDialog: () => set({ isDialogOpen: true }),
      closeDialog: () => set({ isDialogOpen: false }),

      // Delete statement version by version ID
      deleteStatement: (versionId: string) => {
        set((state) => {
          const updatedStatements = [...state.statements];

          // Find which statement group contains this version
          let targetGroupIndex = -1;
          let isCurrentContent = false;

          // First check if the version is a current content in any group
          targetGroupIndex = updatedStatements.findIndex(
            (group) => group.content.id === versionId
          );

          if (targetGroupIndex !== -1) {
            isCurrentContent = true;
          } else {
            // If not found in current content, look in versions arrays
            for (let i = 0; i < updatedStatements.length; i++) {
              const versionIndex = updatedStatements[i].versions.findIndex(
                (version) => version.id === versionId
              );
              if (versionIndex !== -1) {
                targetGroupIndex = i;
                break;
              }
            }
          }

          // If version not found in any group, return unchanged state
          if (targetGroupIndex === -1) return state;

          const group = updatedStatements[targetGroupIndex];

          // Handle deletion based on whether it's current content or a version
          if (isCurrentContent) {
            // If there are no other versions, delete the entire group
            if (group.versions.length === 0) {
              updatedStatements.splice(targetGroupIndex, 1);
              return { statements: updatedStatements };
            }

            // Otherwise, promote the most recent version to be the new content
            const sortedVersions = [...group.versions].sort(
              (a, b) => b.timestamp - a.timestamp
            );

            const newContent = sortedVersions[0];

            // Remove the promoted version from versions array
            const updatedVersions = group.versions.filter(
              (v) => v.id !== newContent.id
            );

            // Update the group
            updatedStatements[targetGroupIndex] = {
              ...group,
              content: newContent,
              versions: updatedVersions,
            };
          } else {
            // Just remove the version from the versions array
            const updatedVersions = group.versions.filter(
              (v) => v.id !== versionId
            );

            // Update the group with filtered versions
            updatedStatements[targetGroupIndex] = {
              ...group,
              versions: updatedVersions,
            };
          }

          return { statements: updatedStatements };
        });
      },

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
          isDialogOpen: false,
          sqlAnalysis: {
            includedStatements: [],
            omittedStatements: [],
          },
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
        const { statements, files } = get();
        if (statements.length === 0) return;

        // Track original positions of statements in their files
        const statementsWithPosition = statements.map((group) => {
          // Get the earliest timestamp from all versions including current content
          const allVersions = [group.content, ...group.versions];
          const earliestVersion = allVersions.reduce((earliest, current) =>
            current.timestamp < earliest.timestamp ? current : earliest
          );

          // Find the original file content to determine position
          const file = files.find(
            (f) => f.filename === earliestVersion.fileName
          );
          let position = 0;

          if (file?.content) {
            // Find position of this statement in the original file
            position = file.content.indexOf(earliestVersion.content);
            if (position === -1) position = Infinity; // If not found, put at the end
          }

          return {
            group,
            earliestTimestamp: earliestVersion.timestamp,
            position: position,
            fileName: earliestVersion.fileName,
          };
        });

        // Sort by earliest timestamp (ascending), then by position in file
        statementsWithPosition.sort((a, b) => {
          if (a.earliestTimestamp !== b.earliestTimestamp) {
            return a.earliestTimestamp - b.earliestTimestamp;
          }
          // If same timestamp and same file, sort by position in file
          if (a.fileName === b.fileName) {
            return a.position - b.position;
          }
          // If different files but same timestamp, keep original order
          return 0;
        });

        // Format SQL with comments for each statement
        const formattedSQL = statementsWithPosition
          .map((item) => {
            const group = item.group;
            const allVersions = [group.content, ...group.versions];

            // Sort versions by timestamp (oldest first)
            allVersions.sort((a, b) => a.timestamp - b.timestamp);

            // Create a unique set of versions to prevent duplicate comments
            // This can happen when the current content is also the latest version
            const uniqueVersions: Statement[] = [];
            const seenHashes = new Set<string>();

            allVersions.forEach((version) => {
              // Create a unique identifier for this version
              const versionKey = `${version.timestamp}_${version.fileName}`;
              if (!seenHashes.has(versionKey)) {
                seenHashes.add(versionKey);
                uniqueVersions.push(version);
              }
            });

            // Create comments for the statement including all unique version info
            const comments = uniqueVersions
              .map((version) => {
                const date = new Date(version.timestamp)
                  .toISOString()
                  .split("T")[0];
                return `-- Version from ${date} - File: ${version.fileName}`;
              })
              .join("\n");

            // Return the commented statement with the current content
            return `${comments}\n${group.content.content}`;
          })
          .join("\n\n");

        try {
          await navigator.clipboard.writeText(formattedSQL);
          console.log("SQL copied to clipboard");

          // Create analysis for the dialog
          const analysis = {
            includedStatements: statementsWithPosition.map((item) => ({
              name: item.group.content.name,
              timestamp: item.earliestTimestamp,
              position: item.position,
            })),
            omittedStatements: [],
          };

          set({
            sqlAnalysis: analysis,
            isDialogOpen: true,
          });
        } catch (error) {
          console.error("Failed to copy SQL:", error);
        }
      },

      // Download parsed SQL
      downloadParsedSQL: () => {
        const { statements, files } = get();
        if (statements.length === 0) return;

        // Track original positions of statements in their files
        const statementsWithPosition = statements.map((group) => {
          // Get the earliest timestamp from all versions including current content
          const allVersions = [group.content, ...group.versions];
          const earliestVersion = allVersions.reduce((earliest, current) =>
            current.timestamp < earliest.timestamp ? current : earliest
          );

          // Find the original file content to determine position
          const file = files.find(
            (f) => f.filename === earliestVersion.fileName
          );
          let position = 0;

          if (file?.content) {
            // Find position of this statement in the original file
            position = file.content.indexOf(earliestVersion.content);
            if (position === -1) position = Infinity; // If not found, put at the end
          }

          return {
            group,
            earliestTimestamp: earliestVersion.timestamp,
            position: position,
            fileName: earliestVersion.fileName,
          };
        });

        // Sort by earliest timestamp (ascending), then by position in file
        statementsWithPosition.sort((a, b) => {
          if (a.earliestTimestamp !== b.earliestTimestamp) {
            return a.earliestTimestamp - b.earliestTimestamp;
          }
          // If same timestamp and same file, sort by position in file
          if (a.fileName === b.fileName) {
            return a.position - b.position;
          }
          // If different files but same timestamp, keep original order
          return 0;
        });

        // Format SQL with comments for each statement
        const formattedSQL = statementsWithPosition
          .map((item) => {
            const group = item.group;
            const allVersions = [group.content, ...group.versions];

            // Sort versions by timestamp (oldest first)
            allVersions.sort((a, b) => a.timestamp - b.timestamp);

            // Create a unique set of versions to prevent duplicate comments
            // This can happen when the current content is also the latest version
            const uniqueVersions: Statement[] = [];
            const seenHashes = new Set<string>();

            allVersions.forEach((version) => {
              // Create a unique identifier for this version
              const versionKey = `${version.timestamp}_${version.fileName}`;
              if (!seenHashes.has(versionKey)) {
                seenHashes.add(versionKey);
                uniqueVersions.push(version);
              }
            });

            // Create comments for the statement including all unique version info
            const comments = uniqueVersions
              .map((version) => {
                const date = new Date(version.timestamp)
                  .toISOString()
                  .split("T")[0];
                return `-- Version from ${date} - File: ${version.fileName}`;
              })
              .join("\n");

            // Return the commented statement with the current content
            return `${comments}\n${group.content.content}`;
          })
          .join("\n\n");

        const blob = new Blob([formattedSQL], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "parsed_sql.sql";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Create analysis for the dialog
        const analysis = {
          includedStatements: statementsWithPosition.map((item) => ({
            name: item.group.content.name,
            timestamp: item.earliestTimestamp,
            position: item.position,
          })),
          omittedStatements: [],
        };

        set({
          sqlAnalysis: analysis,
          isDialogOpen: true,
        });
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
          const newStatement: Statement = {
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
            // Get the existing group
            const existingGroup = updatedStatements[existingGroupIndex];

            // For the first version addition, move the current content to versions
            // and then add the new statement as a version as well
            let updatedVersions: Statement[] = [];

            // If it's the first version being added (versions array is empty)
            // We need to preserve the original content by adding it to the versions array
            if (existingGroup.versions.length === 0) {
              // Add the current content as the first version
              updatedVersions = [{ ...existingGroup.content }];
            } else {
              // Copy existing versions
              updatedVersions = [...existingGroup.versions];
            }

            // Add the new statement to versions
            updatedVersions.push(newStatement);

            // Update the group with the new statement as the main content
            // and include all versions (including the previous content)
            const updatedGroup: StatementGroup = {
              ...existingGroup,
              content: newStatement, // Set the newest statement as the main content
              versions: updatedVersions,
            };

            updatedStatements[existingGroupIndex] = updatedGroup;
          } else {
            // Create a new statement group
            const newStatementGroup: StatementGroup = {
              id: Math.random().toString(36).substring(2, 9),
              content: newStatement,
              versions: [], // Empty for the first statement
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
                const updatedFiles = [...state.files];
                updatedFiles[originalFileIndex].isParsed = true;
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
