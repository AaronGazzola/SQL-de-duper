// components/StatementAccordion.tsx
"use client";

import FilterBar from "@/components/FilterBar";
import { StatementItem } from "@/components/StatementItem";
import { Accordion } from "@/components/ui/accordion";
import { useStore } from "@/store/store";

import { useMemo } from "react";

export function StatementAccordion() {
  const { filters, statements, files } = useStore();

  // Sort statements by earliest timestamp and original position in file
  const sortedStatements = useMemo(() => {
    const statementsWithMetadata = statements.map((group) => {
      // Get all versions including current content
      const allVersions = [group.content, ...group.versions];

      // Find the earliest version
      const earliestVersion = allVersions.reduce(
        (earliest, current) =>
          current.timestamp < earliest.timestamp ? current : earliest,
        allVersions[0]
      );

      // Find position in original file
      const file = files.find((f) => f.filename === earliestVersion.fileName);
      let position = Infinity;

      if (file?.content) {
        const pos = file.content.indexOf(earliestVersion.content);
        if (pos !== -1) position = pos;
      }

      return {
        group,
        earliestTimestamp: earliestVersion.timestamp,
        position,
        fileName: earliestVersion.fileName,
      };
    });

    // Sort by timestamp, then by position if same timestamp and file
    return statementsWithMetadata
      .sort((a, b) => {
        if (a.earliestTimestamp !== b.earliestTimestamp) {
          return a.earliestTimestamp - b.earliestTimestamp;
        }
        // If same timestamp and same file, sort by position
        if (a.fileName === b.fileName) {
          return a.position - b.position;
        }
        // If different files but same timestamp, maintain order
        return 0;
      })
      .map((item) => item.group);
  }, [statements, files]);

  // Apply filters to statements
  const filteredStatements = useMemo(() => {
    return sortedStatements.filter((group) => {
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
  }, [sortedStatements, filters]);

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
