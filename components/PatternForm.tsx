// components/PatternForm.tsx
"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import useSQLParser from "@/hooks/useSQLParser";
import { useStore } from "@/Providers/store";
import { SQLPattern } from "@/types/app.types";
import { ClipboardCopy, Download } from "lucide-react";
import { useCallback, useState } from "react";

export default function PatternForm() {
  const [regexInput, setRegexInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { addPattern } = useSQLParser();
  const { unparsedSQL, sqlPatterns } = useStore();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!regexInput.trim()) {
        setError("Please enter a pattern in JSON format");
        return;
      }

      try {
        // Try to parse the JSON input
        const patternsObj = JSON.parse(regexInput.trim()) as Record<
          string,
          SQLPattern[]
        >;

        // Add each pattern to the store
        Object.entries(patternsObj).forEach(([type, patterns]) => {
          patterns.forEach((patternObj) => {
            try {
              // Extract regex pattern from the string representation
              const patternStr = patternObj.regex.toString();
              const regexMatch = patternStr.match(/\/(.*)\/([gimuy]*)/);

              if (regexMatch) {
                const [, pattern, flags] = regexMatch;
                const regex = new RegExp(pattern, flags);

                // Add the pattern to the store
                addPattern(
                  type,
                  regex,
                  patternObj.description || `Generated pattern for ${type}`
                );
              }
            } catch (err) {
              console.error(`Failed to add pattern for ${type}:`, err);
            }
          });
        });

        // Clear the input
        setRegexInput("");

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Invalid JSON format. Please check your input.");
      }
    },
    [regexInput, addPattern]
  );

  const handleDownloadUnparsedSQL = () => {
    // Create a download for unparsed SQL
    const blob = new Blob([unparsedSQL], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unparsed.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyUnparsedSQL = () => {
    navigator.clipboard
      .writeText(unparsedSQL)
      .catch((err) => console.error("Failed to copy unparsed SQL:", err));
  };

  const handleDownloadPatterns = () => {
    // Create a stringified version of the patterns that can be parsed back into RegExp objects
    const serializablePatterns: Record<
      string,
      {
        regex: string;
        isDefault: boolean;
        description?: string;
        createdAt: number;
      }[]
    > = {};

    Object.entries(sqlPatterns).forEach(([type, patterns]) => {
      serializablePatterns[type] = patterns.map((pattern) => ({
        regex: pattern.regex.toString(),
        isDefault: pattern.isDefault,
        description: pattern.description,
        createdAt: pattern.createdAt,
      }));
    });

    const patternsJson = JSON.stringify(serializablePatterns, null, 2);
    const blob = new Blob([patternsJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sql-patterns.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPatterns = () => {
    // Create a stringified version of the patterns
    const serializablePatterns: Record<
      string,
      {
        regex: string;
        isDefault: boolean;
        description?: string;
        createdAt: number;
      }[]
    > = {};

    Object.entries(sqlPatterns).forEach(([type, patterns]) => {
      serializablePatterns[type] = patterns.map((pattern) => ({
        regex: pattern.regex.toString(),
        isDefault: pattern.isDefault,
        description: pattern.description,
        createdAt: pattern.createdAt,
      }));
    });

    const patternsJson = JSON.stringify(serializablePatterns, null, 2);
    navigator.clipboard
      .writeText(patternsJson)
      .catch((err) => console.error("Failed to copy patterns:", err));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Add New Regex Patterns</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="regexInput"
            className="block text-sm font-medium mb-1"
          >
            Patterns in JSON Format
          </label>
          <textarea
            id="regexInput"
            className="w-full p-2 border border-gray-300 rounded-md h-40 font-mono"
            value={regexInput}
            onChange={(e) => setRegexInput(e.target.value)}
            placeholder={`{
  "function": [
    {
      "regex": "/CREATE\\\\s+TABLE\\\\s+(?:IF\\\\s+NOT\\\\s+EXISTS\\\\s+)?(?:public\\\\.)?([a-zA-Z0-9_]+)/gi",
      "isDefault": false,
      "description": "Create table pattern",
      "createdAt": 1713278589000
    }
  ]
}`}
          />
        </div>
        <div className="mb-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Add Patterns
          </button>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </form>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Download Data</h3>
        <div className="flex space-x-6">
          <div className="flex flex-col items-start gap-3">
            <h4 className="text-sm">Unparsed SQL</h4>
            <div className="flex flex-row gap-2 mb-2">
              <Button
                disabled={!unparsedSQL}
                onClick={handleDownloadUnparsedSQL}
                className="flex items-center gap-2 flex-grow cursor-pointer"
                variant="secondary"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                disabled={!unparsedSQL}
                onClick={handleCopyUnparsedSQL}
                variant="outline"
                size="icon"
                className="flex-shrink-0 cursor-pointer"
              >
                <ClipboardCopy className="h-5 w-5" />
                <span className="sr-only">Copy to clipboard</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2">
            <h4 className="text-sm">Regex Patterns</h4>
            <div className="flex flex-row gap-2 mb-2">
              <Button
                onClick={handleDownloadPatterns}
                className="flex items-center gap-2 flex-grow cursor-pointer"
                variant="secondary"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleCopyPatterns}
                variant="outline"
                size="icon"
                className="flex-shrink-0 cursor-pointer"
              >
                <ClipboardCopy className="h-5 w-5" />
                <span className="sr-only">Copy to clipboard</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200 mb-4">
        <AlertDescription>
          To improve pattern matching for unparsed SQL, please download or copy
          both the unparsed SQL and your existing regex patterns using the
          buttons above. Attach them to the prompt below.
        </AlertDescription>
      </Alert>

      <Alert className="bg-amber-50 border-amber-200">
        <AlertDescription className="whitespace-pre-wrap">
          {"The attached SQL could not be parsed by the attached regex patterns. " +
            'Generate a JSON object with arrays containing regex patterns, skip any that are included in the attached JSON. Your output regex patterns should match the statements in the unparsed SQL. The format should be:\n\n```json\n{\n  "type (eg. function/trigger/policy)": [\n    {\n      "regex": "/pattern/flags",\n      "isDefault": false,\n      "description": "Description of the pattern",\n      "createdAt": ' +
            Date.now() +
            "\n    }\n  ]\n}\n```\n\n"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
