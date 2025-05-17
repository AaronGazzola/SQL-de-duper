// hooks/useSQLPattern.ts
"use client";
import { useStore } from "@/Providers/store";
import { useCallback } from "react";

export default function useSQLPattern() {
  const {
    sqlPatterns,
    patternUsageStats,
    setSqlPattern,
    removePattern,
    resetSqlPatterns,
    updatePatternUsage,
  } = useStore();

  const addPattern = useCallback(
    (pattern: RegExp, description?: string) => {
      setSqlPattern(pattern, description);
    },
    [setSqlPattern]
  );

  const deletePattern = useCallback(
    (_: string, index: number) => {
      removePattern(index);
    },
    [removePattern]
  );

  const deleteAllPatterns = useCallback(() => {
    resetSqlPatterns();
  }, [resetSqlPatterns]);

  const isPatternUsed = useCallback(
    (pattern: RegExp): boolean => {
      const patternStr = pattern.toString();
      // Check if this pattern is used in any statement type
      return Object.values(patternUsageStats).some((typeStats) => {
        return Object.entries(typeStats).some(
          ([storedPattern, isUsed]) => storedPattern === patternStr && isUsed
        );
      });
    },
    [patternUsageStats]
  );

  return {
    sqlPatterns,
    addPattern,
    deletePattern,
    deleteAllPatterns,
    isPatternUsed,
    updatePatternUsage,
  };
}
