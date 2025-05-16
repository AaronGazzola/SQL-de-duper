// hooks/useSQLParser.ts
import { useStore } from "@/Providers/store";
import { SQLPattern } from "@/types/app.types";
import { useCallback, useMemo } from "react";

export function useSQLParser() {
  const {
    parseResults,
    isProcessing,
    uploadProgress,
    parseFiles,
    removeFile,
    sqlPatterns,
    setSqlPattern,
    removePattern,
    resetSqlPatterns,
    unparsedSQL,
  } = useStore();

  // Get all patterns for a specific type
  const getPatterns = useCallback(
    (type: string): SQLPattern[] => sqlPatterns[type] || [],
    [sqlPatterns]
  );

  // Get a specific pattern by type and index
  const getPattern = useCallback(
    (type: string, index: number): SQLPattern | null => {
      const patterns = sqlPatterns[type] || [];
      return patterns[index] || null;
    },
    [sqlPatterns]
  );

  // Add a new pattern to the array
  const addPattern = useCallback(
    (type: string, pattern: RegExp, description?: string) => {
      setSqlPattern(type, pattern, description);
    },
    [setSqlPattern]
  );

  // Delete a pattern at the specified index
  const deletePattern = useCallback(
    (type: string, index: number) => {
      removePattern(type, index);
    },
    [removePattern]
  );

  // Reset all patterns to defaults
  const resetPatterns = useCallback(() => {
    resetSqlPatterns();
  }, [resetSqlPatterns]);

  // Calculate overall progress for file uploads
  const overallProgress = useMemo(() => {
    if (Object.keys(uploadProgress).length === 0) return 0;
    let totalPercentage = 0;
    let count = 0;
    Object.values(uploadProgress).forEach((progress) => {
      totalPercentage += progress.percentage;
      count++;
    });
    return count > 0 ? Math.round(totalPercentage / count) : 0;
  }, [uploadProgress]);

  // Calculate aggregated stats across all parsed files
  const aggregatedStats = useMemo(() => {
    return parseResults.reduce(
      (acc, file) => {
        acc.total += file.stats.total;
        acc.parsed += file.stats.parsed;
        return acc;
      },
      { total: 0, parsed: 0 }
    );
  }, [parseResults]);

  // Calculate overall success rate of parsing
  const overallSuccessRate = useMemo(() => {
    const { total, parsed } = aggregatedStats;
    return total > 0 ? Math.round((parsed / total) * 100) : 0;
  }, [aggregatedStats]);

  // Get all unique statement types from parsed results
  const statementTypes = useMemo(() => {
    const types = new Set<string>();
    parseResults.forEach((file) => {
      file.statements.forEach((statement) => {
        types.add(statement.type);
      });
    });
    return Array.from(types);
  }, [parseResults]);

  // Get all pattern types (categories)
  const patternTypes = useMemo(() => {
    return Object.keys(sqlPatterns);
  }, [sqlPatterns]);

  return {
    parseResults,
    isProcessing,
    uploadProgress,
    parseFiles,
    removeFile,
    overallProgress,
    aggregatedStats,
    overallSuccessRate,
    statementTypes,
    patternTypes,
    getPattern,
    getPatterns,
    addPattern,
    deletePattern,
    resetPatterns,
    patterns: sqlPatterns,
    unparsedSQL,
  };
}

export default useSQLParser;
