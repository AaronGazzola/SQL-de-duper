"use client";
import useSQLParser from "@/hooks/useSQLParser";
import { SQLPattern } from "@/types/app.types";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";

export default function PatternList() {
  const { patternTypes, getPatterns, patterns, parseResults, deletePattern } =
    useSQLParser();
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>(
    {}
  );

  // Calculate which patterns have been successfully used to parse statements
  const parsedPatterns = useCallback(() => {
    const result: Record<string, Set<string>> = {};
    parseResults.forEach((file) => {
      file.statements.forEach((statement) => {
        if (!result[statement.type]) {
          result[statement.type] = new Set();
        }
        // We'll use the regex string representation as a unique identifier
        const typePatterns = patterns[statement.type] || [];
        typePatterns.forEach((pattern) => {
          // Try to match the statement content with this pattern
          pattern.regex.lastIndex = 0; // Reset regex state
          if (pattern.regex.test?.(statement.content)) {
            result[statement.type].add(pattern.regex.toString());
          }
        });
      });
    });
    return result;
  }, [parseResults, patterns]);

  const parsedPatternSets = parsedPatterns();

  const toggleExpand = useCallback((type: string) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const isPatternParsed = useCallback(
    (type: string, pattern: SQLPattern): boolean => {
      if (!parsedPatternSets[type]) return false;
      return parsedPatternSets[type].has(pattern.regex.toString());
    },
    [parsedPatternSets]
  );

  console.log(patterns);

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full max-h-screen overflow-y-auto ">
      <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-white py-2 z-10">
        SQL Pattern Types
      </h2>
      <div className="space-y-4">
        {patternTypes.map((type) => {
          const patternsForType = getPatterns(type);
          const isExpanded = expandedTypes[type] || false;

          return (
            <div
              key={type}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between bg-gray-50 p-3 cursor-pointer"
                onClick={() => toggleExpand(type)}
              >
                <div className="flex items-center">
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  <h3 className="font-medium ml-2">
                    {type}{" "}
                    <span className="text-gray-500 text-sm">
                      ({patternsForType.length})
                    </span>
                  </h3>
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 space-y-3">
                  {patternsForType.map((pattern, index) => {
                    const isParsed = isPatternParsed(type, pattern);
                    return (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex justify-between items-start">
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
                            <div className="flex-1">
                              <p className="text-sm font-mono break-all">
                                {pattern.regex.toString()}
                              </p>
                              {pattern.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {pattern.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            className="text-xs text-red-600 hover:text-red-800 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePattern(type, index);
                            }}
                            disabled={pattern.isDefault}
                            title={
                              pattern.isDefault
                                ? "Default patterns cannot be deleted"
                                : "Delete pattern"
                            }
                          >
                            {!pattern.isDefault && "Delete"}
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {pattern.isDefault
                            ? "Default pattern"
                            : `Added: ${new Date(
                                pattern.createdAt
                              ).toLocaleString()}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
