"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function CustomPagination({
  totalPages,
  currentPage,
  siblingCount = 1, // Default to 1 sibling on each side
  onPageChange,
}: {
  totalPages: number;
  currentPage: number;
  siblingCount?: number; // Controls number of pages shown before truncation
  onPageChange: (pageNumber: number) => void;
}) {
  // Generate page numbers with configurable truncation
  const generatePageNumbers = () => {
    // If few enough pages, show all of them
    if (totalPages <= 5 + siblingCount * 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Determine whether to show ellipses
    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

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
      pageNumbers.push(i);
    }

    // Add right ellipsis if needed
    if (showRightEllipsis) {
      pageNumbers.push("rightEllipsis");
    } else if (rightSiblingIndex < totalPages) {
      for (let i = rightSiblingIndex + 1; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : undefined}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : undefined
            }
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => {
          if (page === "leftEllipsis" || page === "rightEllipsis") {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Number(page));
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
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : undefined}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
