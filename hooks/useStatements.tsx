// hooks/useStatements.ts
import { useStore } from "@/Providers/store";
import { StatementManager } from "@/services/StatementManager";
import { Statement } from "@/types/app.types";
import { useCallback, useMemo } from "react";

export function useStatements() {
  const {
    parseResults,
    filters,
    setFilters,
    addStatement,
    updateStatement,
    removeStatement,
    unparsedSQL,
  } = useStore();

  // Get all statements from all parsed files
  const allStatements = useMemo(() => {
    return parseResults.flatMap((file) => file.statements);
  }, [parseResults]);

  // Get statement groups (statements with same name and type)
  const statementGroups = useMemo(() => {
    return StatementManager.groupByNameAndType(allStatements);
  }, [allStatements]);

  // Get filtered statements based on current filters
  const filteredStatements = useMemo(() => {
    return StatementManager.filterStatements(allStatements, filters);
  }, [allStatements, filters]);

  // Get statements grouped by type
  const statementsByType = useMemo(() => {
    return StatementManager.groupByType(filteredStatements);
  }, [filteredStatements]);

  // Get statements in execution order
  const statementsInOrder = useMemo(() => {
    return StatementManager.orderForExecution(filteredStatements);
  }, [filteredStatements]);

  // Get the latest version of each statement
  const latestVersions = useMemo(() => {
    return StatementManager.getLatestVersions(allStatements);
  }, [allStatements]);

  // Generate SQL from filtered statements
  const generateSQL = useCallback(() => {
    return StatementManager.generateSQL(filteredStatements);
  }, [filteredStatements]);

  // Find dependencies for a statement
  const findDependencies = useCallback(
    (objectName: string) => {
      return StatementManager.findDependencies(allStatements, objectName);
    },
    [allStatements]
  );

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters({ ...filters, ...newFilters });
    },
    [filters, setFilters]
  );

  // Find statements with the same name and type
  const findStatementVersions = useCallback(
    (statement: Statement) => {
      return allStatements
        .filter((s) => s.name === statement.name && s.type === statement.type)
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first
    },
    [allStatements]
  );

  return {
    allStatements,
    filteredStatements,
    statementsByType,
    statementsInOrder,
    latestVersions,
    statementGroups,
    unparsedSQL,
    filters,
    updateFilters,
    addStatement,
    updateStatement,
    removeStatement,
    generateSQL,
    findDependencies,
    findStatementVersions,
  };
}

export default useStatements;
