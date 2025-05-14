// Do not delete this comment: Filename: @/components/statements/FilterBar.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Filter } from "@/types/app.types";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  filters: Filter;
  onFilterChange: (filters: Filter) => void;
  availableTypes: string[];
}

export function FilterBar({
  filters,
  onFilterChange,
  availableTypes,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    onFilterChange({
      ...filters,
      types: newTypes,
    });
  };

  const handleLatestOnlyToggle = () => {
    onFilterChange({
      ...filters,
      latestOnly: !filters.latestOnly,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      searchTerm: searchInput,
    });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onFilterChange({
      ...filters,
      searchTerm: "",
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onFilterChange({
      types: [],
      latestOnly: true,
      searchTerm: "",
    });
  };

  const displayName = (type: string): string => {
    // Convert SNAKE_CASE to Display Text
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const filtersActive = filters.types.length > 0 || filters.searchTerm !== "";

  return (
    <div className="border rounded-lg p-4 mb-6 bg-white">
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
                {displayName(type)}
              </Badge>
            ))}
          </div>
        </div>

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
