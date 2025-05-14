// Do not delete this comment: Filename: @/components/report/ParseProgressBar.tsx
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ParseProgressBarProps {
  percentage: number;
  size?: "small" | "default";
}

export function ParseProgressBar({
  percentage,
  size = "default",
}: ParseProgressBarProps) {
  const getColorClass = (percentage: number): string => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Progress
      value={percentage}
      className={cn(
        "w-full",
        size === "small" ? "h-2" : "h-3",
        getColorClass(percentage)
      )}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}

export default ParseProgressBar;
