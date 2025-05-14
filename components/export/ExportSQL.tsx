// Do not delete this comment: Filename: @/components/export/ExportSQL.tsx
"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ParsedFile, Statement } from "@/types/app.types";
import { ArrowLeft, CheckCircle2, Clipboard, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DownloadOptions } from "./DownloadOptions";
import { SQLPreview } from "./SQLPreview";

export function ExportSQL() {
  const router = useRouter();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"sql" | "txt">("sql");

  useEffect(() => {
    const storedResults = localStorage.getItem("parseResults");
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults) as ParsedFile[];

        // Extract all statements from all files
        // In a real implementation, this would be done by StatementManager
        const allStatements: Statement[] = [];

        results.forEach((file) => {
          // Normally these would be populated from the parse results
          // For demo purposes, we'll create some sample statements
          allStatements.push({
            id: `${file.filename}-1`,
            fileName: file.filename,
            type: "CREATE_TABLE",
            name: "users",
            content:
              "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255));",
            timestamp: Date.now() - 10000000,
            hash: "abc123",
          });

          allStatements.push({
            id: `${file.filename}-2`,
            fileName: file.filename,
            type: "CREATE_INDEX",
            name: "idx_users_email",
            content: "CREATE INDEX idx_users_email ON users (email);",
            timestamp: Date.now() - 5000000,
            hash: "def456",
          });

          allStatements.push({
            id: `${file.filename}-3`,
            fileName: file.filename,
            type: "ALTER_TABLE",
            name: "users",
            content: "ALTER TABLE users ADD COLUMN created_at TIMESTAMP;",
            timestamp: Date.now(),
            hash: "ghi789",
          });
        });

        setStatements(allStatements);
      } catch (error) {
        console.error("Failed to parse stored results:", error);
      }
    } else {
      // No stored results, redirect back to upload
      router.push("/");
    }
  }, [router]);

  // Generate SQL with proper ordering and deduplication
  const generatedSQL = useMemo(() => {
    if (statements.length === 0) {
      return "";
    }

    // In a real implementation, this would use StatementManager
    // For demo purposes, we'll do a simple ordering and deduplication

    // Get latest version of each statement
    const latest = new Map<string, Statement>();
    statements.forEach((statement) => {
      const key = `${statement.type}-${statement.name}`;
      if (
        !latest.has(key) ||
        latest.get(key)!.timestamp < statement.timestamp
      ) {
        latest.set(key, statement);
      }
    });

    // Order statements by type priority and then by name
    const ordered = Array.from(latest.values()).sort((a, b) => {
      // Type priority (CREATE before ALTER before CREATE INDEX)
      const typePriority: Record<string, number> = {
        CREATE_TABLE: 1,
        ALTER_TABLE: 2,
        CREATE_INDEX: 3,
        DROP_TABLE: 4,
        INSERT: 5,
        UPDATE: 6,
        DELETE: 7,
      };

      const aPriority = typePriority[a.type] || 999;
      const bPriority = typePriority[b.type] || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort by name
      return a.name.localeCompare(b.name);
    });

    // Generate SQL with comments
    return ordered
      .map((statement) => {
        return `-- From: ${statement.fileName}\n-- Object: ${statement.name}\n${statement.content}\n`;
      })
      .join("\n");
  }, [statements]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSQL], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration.${downloadFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackToStatements = () => {
    router.push("/statements");
  };

  if (statements.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading statements...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Generated SQL</h1>

      {generatedSQL ? (
        <>
          <Alert
            variant="default"
            className="border-green-200 bg-green-50 mb-6"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">
              SQL Generated Successfully
            </AlertTitle>
            <AlertDescription>
              {statements.length} statements have been processed and ordered for
              proper execution.
            </AlertDescription>
          </Alert>

          <div className="mb-6">
            <SQLPreview sql={generatedSQL} />
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <DownloadOptions
              format={downloadFormat}
              onFormatChange={setDownloadFormat}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download SQL
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={handleBackToStatements}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Statements
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p>No SQL statements to export.</p>
          <Button
            variant="ghost"
            onClick={handleBackToStatements}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Statements
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExportSQL;
