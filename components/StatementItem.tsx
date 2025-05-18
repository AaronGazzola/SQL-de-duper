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
  const [currentPage, setCurrentPage] = useState(1);
  const siblingCount = 1; // Controls number of pages shown before truncation

  // We use the versions array passed as a prop instead of recalculating
  const sortedVersions = versions.sort((a, b) => b.timestamp - a.timestamp); // Ensure newest first
  console.log("Sorted versions:", sortedVersions);
  const totalVersions = sortedVersions.length;
  const currentVersionIndex = currentPage - 1; // Convert page to 0-based index
  const currentStatement = sortedVersions[currentVersionIndex] || statement;

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers with configurable truncation
  const generatePageNumbers = () => {
    // If few enough pages, show all of them
    if (totalVersions <= 3 + siblingCount * 2) {
      return Array.from({ length: totalVersions }, (_, i) => i + 1);
    }

    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalVersions
    );

    // Determine whether to show ellipses
    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalVersions - 1;

    const pageNumbers = [];

    // Always show page 1
    pageNumbers.push(1);

    // Add left ellipsis if needed
    if (showLeftEllipsis) {
      pageNumbers.push("leftEllipsis");
    } else if (leftSiblingIndex > 1) {
      for (let i = 2; i < leftSiblingIndex; i++) {
        pageNumbers.push(i);
      }
    }

    // Add pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalVersions) {
        // Skip if already included
        pageNumbers.push(i);
      }
    }

    // Add right ellipsis if needed
    if (showRightEllipsis) {
      pageNumbers.push("rightEllipsis");
    } else if (rightSiblingIndex < totalVersions) {
      for (let i = rightSiblingIndex + 1; i < totalVersions; i++) {
        pageNumbers.push(i);
      }
    }

    // Always show last page
    if (totalVersions > 1) {
      pageNumbers.push(totalVersions);
    }

    return pageNumbers;
  };

  return (
    <AccordionItem
      value={statement.id}
      className="border rounded-lg mb-2 overflow-hidden"
    >
      <div className="relative">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 flex-1 border-b rounded-lg">
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
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>

                {generatePageNumbers().map((page, index) => {
                  if (page === "leftEllipsis" || page === "rightEllipsis") {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return (
                    <PaginationItem key={`page-${page}`}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(Number(page));
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalVersions)
                        handlePageChange(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalVersions}
                    tabIndex={currentPage === totalVersions ? -1 : undefined}
                    className={
                      currentPage === totalVersions
                        ? "pointer-events-none opacity-50"
                        : undefined
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
                  <span className="font-semibold">Version:</span> {currentPage}{" "}
                  of {totalVersions}
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
