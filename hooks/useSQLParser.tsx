// hooks/useSQLParser.ts
"use client";
import { useStore } from "@/Providers/store";
import { File as FileType } from "@/types/app.types";
import { useCallback } from "react";

export default function useSQLParser() {
  const {
    parseResults,
    isProcessing,
    uploadProgress,
    unparsedSQL,
    totalLines,
    parsedLines,
    sqlPatterns,
    addFile,
    removeFile,
    updateParseResults,
    parseFiles: storeParseFiles,
    setSqlPattern,
    removePattern,
    updatePatternUsage,
  } = useStore();

  const parseFiles = useCallback(
    async (files?: FileType[]) => {
      return storeParseFiles(files);
    },
    [storeParseFiles]
  );

  const addPattern = useCallback(
    (pattern: RegExp, description?: string) => {
      setSqlPattern(pattern, description);
    },
    [setSqlPattern]
  );

  const deletePattern = useCallback(
    (index: number) => {
      removePattern(index);
    },
    [removePattern]
  );

  return {
    // State
    parseResults,
    isProcessing,
    uploadProgress,
    unparsedSQL,
    totalLines,
    parsedLines,
    sqlPatterns,
    // Methods
    parseFiles,
    addFile,
    removeFile,
    updateParseResults,
    addPattern,
    deletePattern,
    updatePatternUsage,
  };
}
