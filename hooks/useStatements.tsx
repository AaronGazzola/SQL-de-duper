// hooks/useStatements.ts
import { StatementManager } from "@/services/StatementManager";
import { useStore } from "@/store/store";
import { UnparsedSection } from "@/types/app.types";
import { useCallback, useMemo } from "react";

export function useStatements() {
  const {
    parseResults,
    filters,
    setFilters,
    addStatement,
    updateStatement,
    removeStatement,
    updateUnparsedSection,
  } = useStore();

  // Get all statements from all parsed files
  const allStatements = useMemo(() => {
    return parseResults.flatMap((file) => file.statements);
  }, [parseResults]);

  // Get all unparsed sections
  const allUnparsedSections = useMemo(() => {
    return parseResults.flatMap((file) => file.unparsedSections);
  }, [parseResults]);

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

  // Try parsing an unparsed section
  const tryParseUnparsedSection = useCallback(
    (section: UnparsedSection) => {
      // This could be implemented to try to parse an unparsed section
      // For now, just mark it as parsed
      updateUnparsedSection(section.id, { parsed: true });
    },
    [updateUnparsedSection]
  );

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      setFilters({ ...filters, ...newFilters });
    },
    [filters, setFilters]
  );

  return {
    allStatements,
    filteredStatements,
    statementsByType,
    statementsInOrder,
    latestVersions,
    allUnparsedSections,
    filters,
    updateFilters,
    addStatement,
    updateStatement,
    removeStatement,
    generateSQL,
    findDependencies,
    tryParseUnparsedSection,
  };
}

export default useStatements;
