// Do not delete this comment: Filename: @/components/export/SQLPreview.tsx
import { Button } from "@/components/ui/button";
import { MaximizeIcon, MinimizeIcon } from "lucide-react";
import { useState } from "react";

interface SQLPreviewProps {
  sql: string;
}

export function SQLPreview({ sql }: SQLPreviewProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

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

    const commentRegex = /^--.*$/gm;

    // Split the SQL to process line by line
    const lines = sql.split("\n");

    return (
      <>
        {lines.map((line, lineIndex) => {
          // Check if this is a comment line
          if (line.trim().startsWith("--")) {
            return (
              <div
                key={lineIndex}
                className="text-gray-400"
              >
                {line}
              </div>
            );
          }

          // Process regular SQL line with keyword highlighting
          const keywordRegex = new RegExp(
            `\\b(${sqlKeywords.join("|")})\\b`,
            "gi"
          );
          const parts = line.split(keywordRegex);

          return (
            <div key={lineIndex}>
              {parts.map((part, partIndex) => {
                if (
                  sqlKeywords.some(
                    (kw) => kw.toLowerCase() === part.toLowerCase()
                  )
                ) {
                  return (
                    <span
                      key={partIndex}
                      className="text-blue-500 font-medium"
                    >
                      {part}
                    </span>
                  );
                }
                return <span key={partIndex}>{part}</span>;
              })}
            </div>
          );
        })}
      </>
    );
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div
      className={`
      relative border rounded-lg overflow-hidden
      ${isFullScreen ? "fixed inset-6 z-50 bg-white shadow-2xl" : ""}
    `}
    >
      <div className="flex justify-between items-center bg-gray-100 px-3 py-2 border-b">
        <h3 className="font-medium text-sm">SQL Preview</h3>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={toggleFullScreen}
        >
          {isFullScreen ? (
            <MinimizeIcon className="h-4 w-4" />
          ) : (
            <MaximizeIcon className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isFullScreen ? "Exit Full Screen" : "Full Screen"}
          </span>
        </Button>
      </div>

      <div
        className={`
        bg-gray-900 text-gray-50 
        overflow-auto font-mono text-sm whitespace-pre
        ${isFullScreen ? "h-[calc(100%-40px)]" : "max-h-96"}
      `}
      >
        <div className="p-4">{formatSQL(sql)}</div>
      </div>
    </div>
  );
}

export default SQLPreview;
