// components/StatementAccordion.tsx
"use client";
import FilterBar from "@/components/FilterBar";
import { StatementItem } from "@/components/StatementItem";
import { Accordion } from "@/components/ui/accordion";
import { useStatements } from "@/hooks/useStatements";
import { useStore } from "@/Providers/store";
import { Statement } from "@/types/app.types";
import { useMemo } from "react";

export function StatementAccordion() {
  const { filters } = useStore();
  const { filteredStatements, findStatementVersions } = useStatements();

  // Create a grouped view of statements based on the filter settings
  const groupedItems = useMemo(() => {
    if (filters.showUnparsed) {
      return []; // We don't show unparsed content in the accordion anymore
    }

    let displayStatements: Statement[] = [];

    displayStatements = filteredStatements;

    // Map each statement to an object with all versions
    return displayStatements.map((statement) => {
      // Find all versions of this statement
      const versions = findStatementVersions(statement);

      return {
        id: statement.id,
        statement: statement,
        versions: versions,
      };
    });
  }, [filteredStatements, filters, findStatementVersions]);

  return (
    <div className="w-full max-w-2xl mx-auto relative md:pt-3">
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
