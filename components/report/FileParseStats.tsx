// Do not delete this comment: Filename: @/components/report/FileParseStats.tsx
import ParseProgressBar from "@/components/report/ParseProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ParsedFile } from "@/types/app.types";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";

interface FileParseStatsProps {
  file: ParsedFile;
}

export function FileParseStats({ file }: FileParseStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (percentage: number): string => {
    if (percentage === 100) return "text-green-500";
    if (percentage >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusText = (percentage: number): string => {
    if (percentage === 100) return "Complete";
    if (percentage >= 50) return "Partial";
    return "Needs Review";
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center p-4">
        <FileText className="text-blue-500 mr-3 h-5 w-5 flex-shrink-0" />

        <div className="flex-grow min-w-0">
          <div className="flex items-center">
            <h3 className="font-medium truncate mr-2">{file.filename}</h3>
            <Badge
              variant="outline"
              className={cn("ml-auto", getStatusColor(file.stats.percentage))}
            >
              {getStatusText(file.stats.percentage)}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span>
              {file.stats.parsed} of {file.stats.total} statements parsed
            </span>
            <span className="ml-2 font-medium">({file.stats.percentage}%)</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8 w-8 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle details</span>
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t pt-3 bg-gray-50">
          <div className="mb-3">
            <ParseProgressBar
              percentage={file.stats.percentage}
              size="small"
            />
          </div>

          {file.stats.percentage < 100 && (
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium">
                  {file.stats.total - file.stats.parsed}
                </span>{" "}
                statements need manual parsing
              </p>
            </div>
          )}

          {file.stats.parsed > 0 && (
            <div className="mt-3 text-sm">
              <p className="font-medium mb-1">Parsed Statement Types:</p>
              <div className="flex flex-wrap gap-2">
                {["CREATE TABLE", "ALTER TABLE", "CREATE INDEX"].map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="text-xs"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileParseStats;
