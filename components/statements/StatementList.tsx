// Do not delete this comment: Filename: @/components/statements/StatementList.tsx
"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Filter, ParsedFile, Statement } from "@/types/app.types";
import { Download, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FilterBar } from "./FilterBar";
import { StatementCard } from "./StatementCard";

export function StatementList() {
  const router = useRouter();
  const [parseResults, setParseResults] = useState<ParsedFile[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [filters, setFilters] = useState<Filter>({
    types: [],
    latestOnly: true,
    searchTerm: "",
  });

  useEffect(() => {
    const storedResults = localStorage.getItem("parseResults");
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults) as ParsedFile[];
        setParseResults(results);

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

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    statements.forEach((statement) => {
      types.add(statement.type);
    });
    return Array.from(types);
  }, [statements]);

  const filteredStatements = useMemo(() => {
    let filtered = [...statements];

    // Apply type filters
    if (filters.types.length > 0) {
      filtered = filtered.filter((statement) =>
        filters.types.includes(statement.type)
      );
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (statement) =>
          statement.name.toLowerCase().includes(searchLower) ||
          statement.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply latest only filter
    if (filters.latestOnly) {
      const latest = new Map<string, Statement>();

      filtered.forEach((statement) => {
        const key = `${statement.type}-${statement.name}`;
        if (
          !latest.has(key) ||
          latest.get(key)!.timestamp < statement.timestamp
        ) {
          latest.set(key, statement);
        }
      });

      filtered = Array.from(latest.values());
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [statements, filters]);

  const handleExport = () => {
    router.push("/export");
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
      <h1 className="text-3xl font-bold text-center mb-8">SQL Statements</h1>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          {statements.length} statements found across {parseResults.length}{" "}
          files.
        </AlertDescription>
      </Alert>

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        availableTypes={availableTypes}
      />

      <div className="space-y-4 my-6">
        {filteredStatements.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-gray-50">
            <p className="text-gray-500">No statements match your filters</p>
          </div>
        ) : (
          filteredStatements.map((statement) => (
            <StatementCard
              key={statement.id}
              statement={statement}
            />
          ))
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={handleExport}
          disabled={filteredStatements.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export SQL
        </Button>
      </div>
    </div>
  );
}

export default StatementList;
