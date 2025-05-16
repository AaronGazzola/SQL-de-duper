// components/FilterBar.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn, getDisplayName } from "@/lib/utils";
import { useStore } from "@/Providers/store";
import { Filter } from "@/types/app.types";
import { Menu, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export function FilterBar() {
  const { filters, setFilters, parseResults } = useStore();

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

  const handleFilterChange = (newFilters: Partial<Filter>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    handleFilterChange({
      types: newTypes,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({
      searchTerm: searchInput,
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    handleFilterChange({
      searchTerm: "",
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({
      types: [],
      latestOnly: true,
      searchTerm: "",
      showUnparsed: false,
    });
  };

  const filtersActive =
    filters.types.length > 0 ||
    filters.searchTerm !== "" ||
    filters.showUnparsed;

  return (
    <div className="border rounded-lg p-4 mb-6 bg-white sticky top-0 z-50">
      <div className="flex flex-col gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="relative"
        >
          <div className="flex items-center gap-2">
            <div className="md:hidden flex items-center">
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
              </SidebarTrigger>
            </div>

            <Input
              placeholder="Search statements..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <div className="absolute inset-y-0 md:left-0 left-9 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>

          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </form>

        {availableTypes.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Filter by Type</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className={cn(
                  "text-sm text-gray-500",
                  !filtersActive && "opacity-0"
                )}
              >
                Clear all filters
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableTypes.map((type) => (
                <Badge
                  key={type}
                  variant={filters.types.includes(type) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleTypeToggle(type)}
                >
                  {getDisplayName(type)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
