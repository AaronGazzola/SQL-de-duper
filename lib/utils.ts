// lib/utils.ts
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine class names with Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format timestamp
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

// Get human-readable display name for statement types
export function getDisplayName(type: string): string {
  const displayNames: { [key: string]: string } = {
    CREATE_TABLE: "Create Table",
    ALTER_TABLE: "Alter Table",
    DROP_TABLE: "Drop Table",
    CREATE_INDEX: "Create Index",
    DROP_INDEX: "Drop Index",
    INSERT: "Insert",
    UPDATE: "Update",
    DELETE: "Delete",
    SELECT: "Select",
    OTHER: "Other",
    UNPARSED: "Unparsed",
  };

  return displayNames[type] || type;
}
