// Do not delete this comment: Filename: @/components/statements/StatementCard.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Statement } from "@/types/app.types";
import { ChevronDown, ChevronUp, Copy, FileText } from "lucide-react";
import { useState } from "react";

interface StatementCardProps {
  statement: Statement;
}

export function StatementCard({ statement }: StatementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(statement.content);
    // In a real app, you'd show a toast notification
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeColor = (type: string): string => {
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

  const displayType = (type: string): string => {
    // Convert SNAKE_CASE to Display Text
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Format SQL with syntax highlighting
  // In a real implementation, this would use a proper SQL formatter
  const formatSQL = (sql: string) => {
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

    // This is a simple approach for demo purposes
    // A real implementation would use a proper syntax highlighter
    const parts = sql.split(keywordRegex);

    return (
      <>
        {parts.map((part, index) => {
          if (
            sqlKeywords.some((kw) => kw.toLowerCase() === part.toLowerCase())
          ) {
            return (
              <span
                key={index}
                className="text-blue-600 font-medium"
              >
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center p-4">
        <div className="flex-grow">
          <div className="flex items-center">
            <Badge
              variant="secondary"
              className={cn("mr-2", getTypeColor(statement.type))}
            >
              {displayType(statement.type)}
            </Badge>

            <h3 className="font-medium">{statement.name}</h3>
          </div>

          <div className="flex items-center text-sm text-gray-500 mt-1">
            <FileText className="h-3 w-3 mr-1" />
            <span className="truncate max-w-xs">{statement.fileName}</span>
            <span className="mx-2">•</span>
            <span>{formatTimestamp(statement.timestamp)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy SQL</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">{expanded ? "Collapse" : "Expand"}</span>
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 bg-gray-50">
          <pre className="bg-gray-900 text-gray-50 p-3 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
            <code>{formatSQL(statement.content)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default StatementCard;
