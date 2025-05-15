// components/StatementAccordion.tsx
"use client";
import FilterBar from "@/components/FilterBar";
import { StatementItem } from "@/components/StatementItem";
import { Accordion } from "@/components/ui/accordion";
import { useStatements } from "@/hooks/useStatements";
import { useStore } from "@/Providers/store";
import { useMemo } from "react";

export function StatementAccordion() {
  const { filters } = useStore();
  const { statementGroups, filteredStatements } = useStatements();

  // Create a grouped view of statements
  const groupedItems = useMemo(() => {
    if (filters.showUnparsed) {
      return []; // We don't show unparsed content in the accordion anymore
    }

    // If we're not showing latest only, use filtered statements directly
    if (!filters.latestOnly) {
      return filteredStatements.map((statement) => ({
        id: statement.id,
        statement,
        versions: [statement],
      }));
    }

    // Otherwise, get statement groups that match the filter criteria
    return statementGroups
      .filter((group) => {
        // Filter by type if types filter is active
        if (filters.types.length > 0 && !filters.types.includes(group.type)) {
          return false;
        }

        // Filter by search term
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          // Check if any statement in the group matches the search term
          return group.statements.some(
            (stmt) =>
              stmt.name.toLowerCase().includes(searchLower) ||
              stmt.content.toLowerCase().includes(searchLower)
          );
        }

        return true;
      })
      .map((group) => ({
        id: group.statements[0].id,
        statement: group.statements[0], // Use the latest statement as the primary
        versions: group.statements, // All versions for pagination
      }));
  }, [statementGroups, filteredStatements, filters]);

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <FilterBar />
      <Accordion
        type="single"
        collapsible
        className="w-full"
      >
        {groupedItems.length > 0 ? (
          groupedItems.map((item) => (
            <StatementItem
              key={item.id}
              statement={item.statement}
              versions={item.versions}
            />
          ))
        ) : (
          <div className="p-8 text-center border rounded-lg">
            <p className="text-gray-500">
              {filters.showUnparsed
                ? "Unparsed content is now shown in a separate view."
                : "No matching statements found."}
            </p>
          </div>
        )}
      </Accordion>
    </div>
  );
}
