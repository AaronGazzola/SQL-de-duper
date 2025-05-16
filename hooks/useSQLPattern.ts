// hooks/useSQLPattern.ts
import { useStore } from "@/Providers/store";
import { SQLPattern } from "@/types/app.types";
import { useCallback, useMemo } from "react";

export default function useSQLPattern() {
  const {
    sqlPatterns,
    setSqlPattern,
    removePattern,
    resetSqlPatterns,
    parseResults,
  } = useStore();

  // Get only user-added patterns (non-default patterns)
  const userPatterns = useMemo(() => {
    return sqlPatterns.filter((pattern) => !pattern.isDefault);
  }, [sqlPatterns]);

  // Add a new pattern to the store
  const addPattern = useCallback(
    (type: string, regex: RegExp, description?: string) => {
      setSqlPattern(type, regex, description);
    },
    [setSqlPattern]
  );

  // Delete a pattern from the store
  const deletePattern = useCallback(
    (type: string, index: number) => {
      removePattern(type, index);
    },
    [removePattern]
  );

  // Delete all user-added patterns
  const deleteAllPatterns = useCallback(() => {
    resetSqlPatterns();
  }, [resetSqlPatterns]);

  // Check if a pattern has been used to parse any statements
  const isPatternUsed = useCallback(
    (pattern: SQLPattern): boolean => {
      for (const file of parseResults) {
        for (const statement of file.statements) {
          pattern.regex.lastIndex = 0; // Reset regex state
          if (pattern.regex.test(statement.content)) {
            return true;
          }
        }
      }

      return false;
    },
    [parseResults]
  );

  return {
    patterns: sqlPatterns,
    userPatterns,
    addPattern,
    deletePattern,
    deleteAllPatterns,
    isPatternUsed,
  };
}
