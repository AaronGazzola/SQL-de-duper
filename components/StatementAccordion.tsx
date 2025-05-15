// components/StatementAccordion.tsx
"use client";
import FilterBar from "@/components/FilterBar";
import { StatementItem } from "@/components/StatementItem";
import { Accordion } from "@/components/ui/accordion";
import { useStore } from "@/Providers/store";
import { Statement, UnparsedSection } from "@/types/app.types";
import { useMemo } from "react";

export function StatementAccordion() {
  const { parseResults, filters } = useStore();

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
      // For unparsed sections, we always show them if no filters are applied
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
      <FilterBar />
      <Accordion
        type="single"
        collapsible
        className="w-full"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <StatementItem
              key={item.id}
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
