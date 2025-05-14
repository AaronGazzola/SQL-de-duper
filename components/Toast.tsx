import { cn } from "@/lib/utils"; // Assuming you have this utility
import { AlertCircle, Bug, CheckCircle, Info } from "lucide-react";
import React from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastProps {
  variant: ToastVariant;
  message: string;
  "data-cy"?: string;
}

export const Toast: React.FC<ToastProps> = ({
  variant,
  message,
  "data-cy": dataCy,
  ...props
}) => {
  // Get icon based on variant
  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <Bug className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Dynamic background and border colors based on variant
  const getBgAndBorderClasses = () => {
    switch (variant) {
      case "success":
        return "border-green-800 bg-green-950 text-green-100";
      case "error":
        return "border-red-800 bg-red-950 text-red-100";
      case "warning":
        return "border-amber-800 bg-amber-950 text-amber-100";
      case "info":
      default:
        return "border-blue-800 bg-blue-950 text-blue-100";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border p-4 shadow-md",
        getBgAndBorderClasses()
      )}
      data-cy={dataCy}
      {...props}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div>
        <p>{message}</p>
      </div>
    </div>
  );
};
