// Do not delete this comment: Filename: @/components/parsing/UnparsedNavigation.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UnparsedNavigationProps {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function UnparsedNavigation({
  current,
  total,
  onPrevious,
  onNext,
}: UnparsedNavigationProps) {
  return (
    <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={current <= 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <div className="flex items-center">
        <span className="text-sm font-medium mx-2">
          {current} of {total}
        </span>

        <div className="flex space-x-1 ml-2">
          {Array.from({ length: Math.min(total, 5) }).map((_, i) => {
            const isCurrent = i + 1 === current;
            const isInRange =
              i + 1 <= Math.min(total, 5) &&
              (total <= 5 ||
                (current <= 3 && i + 1 <= 5) ||
                (current > total - 3 && i + 1 > Math.max(0, total - 5)) ||
                (i + 1 >= current - 2 && i + 1 <= current + 2));

            // Adjust index based on where we are in the sequence
            let adjustedIndex = i + 1;
            if (total > 5 && current > 3 && current <= total - 3) {
              adjustedIndex = i + current - 2;
            } else if (total > 5 && current > total - 3) {
              adjustedIndex = total - 4 + i;
            }

            if (!isInRange) return null;

            return (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full",
                  adjustedIndex === current
                    ? "bg-primary"
                    : adjustedIndex < current
                    ? "bg-primary/40"
                    : "bg-gray-300"
                )}
              />
            );
          })}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={current >= total}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

export default UnparsedNavigation;
