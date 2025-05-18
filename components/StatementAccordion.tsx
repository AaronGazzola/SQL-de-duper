// components/StatementAccordion.tsx
"use client";
import FilterBar from "@/components/FilterBar";
import { StatementItem } from "@/components/StatementItem";
import { Accordion } from "@/components/ui/accordion";
import { useStore } from "@/store/store";
import { useMemo } from "react";

export function StatementAccordion() {
  const { filters, statements } = useStore();

  // Apply filters to statements
  const filteredStatements = useMemo(() => {
    return statements.filter((group) => {
      // Filter by type
      if (
        filters.types.length > 0 &&
        !filters.types.includes(group.content.type)
      ) {
        return false;
      }

      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const contentMatches = group.content.content
          .toLowerCase()
          .includes(searchLower);
        const nameMatches = group.content.name
          .toLowerCase()
          .includes(searchLower);
        const typeMatches = group.content.type
          .toLowerCase()
          .includes(searchLower);
        const fileMatches = group.content.fileName
          .toLowerCase()
          .includes(searchLower);

        if (!(contentMatches || nameMatches || typeMatches || fileMatches)) {
          return false;
        }
      }

      // Filter out unparsed statements
      if (!filters.showUnparsed && group.content.type === "UNPARSED") {
        return false;
      }

      return true;
    });
  }, [statements, filters]);

  return (
    <div className="w-full max-w-2xl mx-auto relative md:pt-3">
      <FilterBar />

      {filteredStatements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No statements match your filters</p>
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="w-full"
        >
          {filteredStatements.map((statement) => (
            <StatementItem
              key={statement.id}
              statement={statement.content}
              versions={statement.versions}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
}

export default StatementAccordion;
