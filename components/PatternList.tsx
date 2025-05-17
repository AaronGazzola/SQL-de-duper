// components/PatternList.tsx
"use client";
import { Button } from "@/components/ui/button";
import useSQLPattern from "@/hooks/useSQLPattern";
import { Check, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";

export default function PatternList() {
  const { sqlPatterns, deletePattern, deleteAllPatterns, isPatternUsed } =
    useSQLPattern();
  const [expandedPatternIds, setExpandedPatternIds] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (patternId: string) => {
    setExpandedPatternIds((prev) => ({
      ...prev,
      [patternId]: !prev[patternId],
    }));
  };

  // Generate a unique ID for each pattern based on its regex
  const getPatternId = (pattern: RegExp): string => {
    return pattern.toString();
  };

  if (sqlPatterns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500 text-center">No patterns available</p>
        <p className="text-sm text-gray-400 text-center mt-2">
          Add patterns using the form
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white py-2 z-10">
        <h2 className="text-lg font-semibold">SQL Statement Regex Patterns</h2>
        <Button
          variant="destructive"
          size="sm"
          onClick={deleteAllPatterns}
          title="Delete all patterns"
          className="flex items-center gap-1"
        >
          <Trash2 size={16} />
          <span>Clear All</span>
        </Button>
      </div>

      <div className="space-y-4">
        {sqlPatterns.map((pattern, index) => {
          const patternId = getPatternId(pattern);
          const isExpanded = expandedPatternIds[patternId] || false;
          const isParsed = isPatternUsed(pattern);
          if (!isParsed) return <Fragment key={patternId} />;
          return (
            <div
              key={patternId}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between bg-gray-50 p-3">
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => toggleExpand(patternId)}
                >
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  <div className="ml-2 overflow-hidden">
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                          isParsed
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isParsed && <Check size={14} />}
                      </div>
                      <p className="font-mono text-sm truncate">
                        {pattern.toString().length > 40
                          ? `${pattern.toString().substring(0, 40)}...`
                          : pattern.toString()}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePattern("", index);
                  }}
                  title="Delete pattern"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-3 bg-gray-50 border-t border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600">
                      Pattern
                    </h4>
                    <p className="text-sm font-mono break-all mt-1">
                      {pattern.toString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600">
                      Status
                    </h4>
                    <p className="text-sm mt-1 flex items-center">
                      <span className="text-green-600 flex items-center">
                        <Check
                          size={14}
                          className="mr-1"
                        />{" "}
                        Used in parsing
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
