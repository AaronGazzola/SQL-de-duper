// providers/store.ts
"use client";
import { File, Filter, ParseResult, StatementGroup } from "@/types/app.types";
import { create } from "zustand";

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
  onFilesDrop: (files: File[]) => Promise<void>;
  setFilters: (filters: Filter) => void;
  resetStore: () => void;
}>((set, get) => ({
  statements: [],
  filters: DEFAULT_FILTERS,
  statementTypes: [],
  parseResults: [],
  totalLines: 0,
  parsedLines: 0,
  // Handle file drops
  onFilesDrop: async (files: File[]) => {
    const { parseResults: existingParseResults } = get();
    const newParseResults: ParseResult[] = [...existingParseResults];

    // Process each file
    for (const file of files) {
      try {
        // Read the file content as text
        const fileContent = await file.text();

        // Create parse result with filename, file contents, and timestamp
        const newParseResult: ParseResult = {
          filename: file.name,
          content: fileContent, // Store the file content for later use
          timestamp: Date.now(),
          stats: {
            total: 0,
            parsed: 0,
          },
        };

        // Add to parse results
        newParseResults.push(newParseResult);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    // Update state with the processed files
    set({
      parseResults: newParseResults,
      statements: [],
      statementTypes: [],
      totalLines: 0,
      parsedLines: 0,
    });
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
    });
  },
}));
