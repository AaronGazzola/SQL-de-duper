// components/StatementItem.tsx
"use client";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTimestamp, getDisplayName } from "@/lib/utils";
import { Statement } from "@/types/app.types";
import { useState } from "react";

export function StatementItem({
  statement,
  versions,
}: {
  statement: Statement;
  versions: Statement[];
}) {
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  // We use the versions array passed as a prop instead of recalculating
  const sortedVersions = versions.sort((a, b) => b.timestamp - a.timestamp); // Ensure newest first
  const currentStatement = sortedVersions[currentVersionIndex] || statement;
  const totalVersions = sortedVersions.length;

  // Handle pagination
  const handlePreviousVersion = () => {
    setCurrentVersionIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextVersion = () => {
    setCurrentVersionIndex((prev) =>
      prev < totalVersions - 1 ? prev + 1 : prev
    );
  };

  const handleVersionSelect = (index: number) => {
    if (index >= 0 && index < totalVersions) {
      setCurrentVersionIndex(index);
    }
  };

  // Determine which pagination links to show
  const getPaginationItems = () => {
    const items = [];

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          isActive={currentVersionIndex === 0}
          onClick={() => handleVersionSelect(0)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // If there are more than 3 pages and we're not at the beginning,
    // add ellipsis after first page
    if (totalVersions > 3 && currentVersionIndex > 1) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Current page (if not first or last)
    if (currentVersionIndex > 0 && currentVersionIndex < totalVersions - 1) {
      items.push(
        <PaginationItem key={`current-${currentVersionIndex}`}>
          <PaginationLink
            isActive={true}
            onClick={() => {}}
          >
            {currentVersionIndex + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // If there are more than 3 pages and we're not at the end,
    // add ellipsis before last page
    if (totalVersions > 3 && currentVersionIndex < totalVersions - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if there's more than one page
    if (totalVersions > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={currentVersionIndex === totalVersions - 1}
            onClick={() => handleVersionSelect(totalVersions - 1)}
          >
            {totalVersions}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <AccordionItem
      value={statement.id}
      className="border rounded-lg mb-2 overflow-hidden"
    >
      <div className="relative">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 flex-1">
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-xs"
              >
                {getDisplayName(statement.type)}
              </Badge>
              <span className="font-medium">{statement.name}</span>
              {totalVersions > 1 && (
                <Badge
                  variant="secondary"
                  className="ml-2 text-xs"
                >
                  {totalVersions} versions
                </Badge>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-500 truncate max-w-[300px]">
                    {statement.fileName}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statement.fileName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </AccordionTrigger>
      </div>
      <AccordionContent className="border-t bg-gray-50">
        {totalVersions > 1 && (
          <div className="flex justify-center py-2 border-b">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePreviousVersion}
                    className={
                      currentVersionIndex === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  />
                </PaginationItem>

                {getPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={handleNextVersion}
                    className={
                      currentVersionIndex === totalVersions - 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <div className="p-4">
          <div className="mb-4 text-sm space-y-2">
            <div className="flex flex-wrap gap-2">
              <div>
                <span className="font-semibold">Type:</span>{" "}
                {getDisplayName(currentStatement.type)}
              </div>
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {currentStatement.name}
              </div>
              <div>
                <span className="font-semibold">File:</span>{" "}
                {currentStatement.fileName}
              </div>
              <div>
                <span className="font-semibold">Timestamp:</span>{" "}
                {formatTimestamp(currentStatement.timestamp)}
              </div>
              <div>
                <span className="font-semibold">Hash:</span>{" "}
                {currentStatement.hash}
              </div>
              {totalVersions > 1 && (
                <div>
                  <span className="font-semibold">Version:</span>{" "}
                  {currentVersionIndex + 1} of {totalVersions}
                </div>
              )}
            </div>
          </div>

          <pre className="text-sm overflow-x-auto p-2 bg-white border rounded-md">
            {currentStatement.content}
          </pre>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
