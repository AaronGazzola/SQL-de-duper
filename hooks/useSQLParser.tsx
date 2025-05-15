// hooks/useSQLParser.ts

import { useStore } from "@/Providers/store";
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
    unparsedSQL,
  } = useStore();

  // Modified to handle the new array of patterns
  const getPattern = useCallback(
    (type: string) => sqlPatterns[type] || null,
    [sqlPatterns]
  );

  // Modified to handle adding a new pattern to the array
  const updatePattern = useCallback(
    (type: string, pattern: RegExp) => {
      setSqlPattern(type, pattern);
    },
    [setSqlPattern]
  );

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

  const overallSuccessRate = useMemo(() => {
    const { total, parsed } = aggregatedStats;
    return total > 0 ? Math.round((parsed / total) * 100) : 0;
  }, [aggregatedStats]);

  const statementTypes = useMemo(() => {
    const types = new Set<string>();
    parseResults.forEach((file) => {
      file.statements.forEach((statement) => {
        types.add(statement.type);
      });
    });
    return Array.from(types);
  }, [parseResults]);

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
    getPattern,
    updatePattern,
    patterns: sqlPatterns,
    unparsedSQL,
  };
}

export default useSQLParser;
