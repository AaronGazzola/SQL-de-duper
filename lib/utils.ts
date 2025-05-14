// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Function to generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// SQL formatting utilities
export const formatSQL = (sql: string) => {
  const sqlKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "TABLE",
    "INDEX",
    "VIEW",
    "PRIMARY",
    "KEY",
    "FOREIGN",
    "REFERENCES",
    "CONSTRAINT",
    "NOT",
    "NULL",
    "DEFAULT",
    "AUTO_INCREMENT",
    "DATABASE",
  ];

  const keywordRegex = new RegExp(`\\b(${sqlKeywords.join("|")})\\b`, "gi");

  // Simple approach for demo purposes
  const parts = sql.split(keywordRegex);

  return parts
    .map((part) => {
      if (sqlKeywords.some((kw) => kw.toLowerCase() === part.toLowerCase())) {
        return `<span class="text-blue-600 font-medium">${part}</span>`;
      }
      return part;
    })
    .join("");
};

// Get display name for statement type
export const getDisplayName = (type: string): string => {
  // Convert SNAKE_CASE to Display Text
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

// Get color for statement type
export const getTypeColor = (type: string): string => {
  switch (type) {
    case "CREATE_TABLE":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "ALTER_TABLE":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case "CREATE_INDEX":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "DROP_TABLE":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "INSERT":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
    case "UPDATE":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "DELETE":
      return "bg-rose-100 text-rose-800 hover:bg-rose-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};
