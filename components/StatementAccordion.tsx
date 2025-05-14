"use client";

import FilterBar from "@/components/FilterBar";
import { StatementItem } from "@/components/StatementItem";
import { Accordion } from "@/components/ui/accordion";
import { useStore } from "@/store/store";
import { Statement, UnparsedSection } from "@/types/app.types";
import { useMemo } from "react";

export function StatementAccordion() {
  const { parseResults, filters } = useStore();

  // Extract all statement types from the parsed results
  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>();
    parseResults.forEach((file) => {
      file.statements.forEach((statement) => {
        if (statement.type) {
          typeSet.add(statement.type);
        }
      });
    });
    return Array.from(typeSet);
  }, [parseResults]);

  // Combine all statements and unparsed sections
  const allItems = useMemo(() => {
    const items: Array<Statement | UnparsedSection> = [];
    parseResults.forEach((file) => {
      // Add parsed statements
      file.statements.forEach((statement) => {
        items.push({
          ...statement,
          fileName: file.filename,
        });
      });

      // Add unparsed sections
      file.unparsedSections.forEach((section) => {
        items.push({
          ...section,
          fileName: file.filename,
        });
      });
    });
    return items;
  }, [parseResults]);

  // Apply filters to get filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // For unparsed sections, we always show them
      if ("parsed" in item) {
        // Filter by search term on content
        if (
          filters.searchTerm &&
          !item.content.toLowerCase().includes(filters.searchTerm.toLowerCase())
        ) {
          return false;
        }
        return true;
      }

      // For parsed statements
      // Filter by type
      if (filters.types.length > 0 && !filters.types.includes(item.type)) {
        return false;
      }

      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.content.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [allItems, filters]);

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <FilterBar availableTypes={availableTypes} />

      <Accordion
        type="single"
        collapsible
        className="w-full"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <StatementItem
              key={index}
              item={item}
              index={index}
            />
          ))
        ) : (
          <div className="p-8 text-center border rounded-lg">
            <p className="text-gray-500">No matching statements found.</p>
          </div>
        )}
      </Accordion>
    </div>
  );
}
