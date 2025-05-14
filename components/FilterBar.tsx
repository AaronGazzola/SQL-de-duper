"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getDisplayName } from "@/lib/utils";
import { useStore } from "@/store/store";
import { Filter } from "@/types/app.types";
import { Search, X } from "lucide-react";
import { useState } from "react";

export function FilterBar({ availableTypes }: { availableTypes: string[] }) {
  const { filters, setFilters } = useStore();

  const handleFilterChange = (newFilters: Filter) => {
    setFilters(newFilters);
  };

  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    handleFilterChange({
      ...filters,
      types: newTypes,
    });
  };

  const handleLatestOnlyToggle = () => {
    handleFilterChange({
      ...filters,
      latestOnly: !filters.latestOnly,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({
      ...filters,
      searchTerm: searchInput,
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    handleFilterChange({
      ...filters,
      searchTerm: "",
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    handleFilterChange({
      types: [],
      latestOnly: true,
      searchTerm: "",
    });
  };

  const filtersActive = filters.types.length > 0 || filters.searchTerm !== "";

  return (
    <div className="border rounded-lg p-4 mb-6 bg-white sticky top-0 z-50">
      <div className="flex flex-col gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="relative"
        >
          <Input
            placeholder="Search statements..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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
            <h3 className="text-sm font-medium">Filter by Type</h3>

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

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Switch
              id="latest-switch"
              checked={filters.latestOnly}
              onCheckedChange={handleLatestOnlyToggle}
            />
            <Label htmlFor="latest-switch">Show latest version only</Label>
          </div>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-sm text-gray-500"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
