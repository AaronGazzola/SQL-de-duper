// components/EditorProgressBar.tsx
"use client";
import { useStore } from "@/providers/store";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const EditorProgressBar: React.FC = () => {
  const parseResults = useStore((state) => state.parseResults);
  const selectedFile = useStore((state) => state.selectedFile);
  const statements = useStore((state) => state.statements);
  const files = useStore((state) => state.files);
  const toggleFileParsed = useStore((state) => state.toggleFileParsed);
  const [parsedPercentage, setParsedPercentage] = useState(0);

  // Find current file in parse results
  const currentFile = useMemo(
    () =>
      parseResults.find((file) => file.filename === selectedFile) || {
        filename: "No file loaded",
        content: "",
        stats: { total: 0, parsed: 0 },
      },
    [parseResults, selectedFile]
  );

  // Get current file parsed status
  const currentFileMeta = useMemo(
    () => files.find((file) => file.filename === selectedFile),
    [files, selectedFile]
  );

  const isParsed = currentFileMeta?.isParsed || false;

  // Calculate progress by comparing file content with statements content
  useEffect(() => {
    if (selectedFile && currentFile.content) {
      // If file is marked as parsed, show 100%
      if (isParsed) {
        setParsedPercentage(100);
        return;
      }

      // Get all statement content
      const allStatementContent = statements
        .map((group) => group.content.content)
        .join("\n");

      // Compare with file content
      const fileContent = currentFile.content || "";

      // Calculate how much of the file content is covered by statements
      const statementWords = new Set(
        allStatementContent.split(/\s+/).filter(Boolean)
      );
      const fileWords = fileContent.split(/\s+/).filter(Boolean);
      let coveredWords = 0;
      fileWords.forEach((word) => {
        if (statementWords.has(word)) {
          coveredWords++;
        }
      });

      const percentage =
        fileWords.length > 0
          ? Math.min(100, (coveredWords / fileWords.length) * 100)
          : 0;
      setParsedPercentage(percentage);
    } else {
      setParsedPercentage(0);
    }
  }, [selectedFile, statements, currentFile, isParsed]);

  // Handle toggle all parsed
  const handleToggleAllParsed = () => {
    if (selectedFile) {
      toggleFileParsed(selectedFile, !isParsed);
    }
  };

  if (!selectedFile) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-b">
      <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${parsedPercentage}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600">
        {Math.round(parsedPercentage)}% parsed
      </div>
      <button
        onClick={handleToggleAllParsed}
        className={`p-1 rounded-full ${
          isParsed ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
        } hover:bg-blue-200`}
        title={isParsed ? "Mark as unparsed" : "Mark as fully parsed"}
      >
        <Check size={18} />
      </button>
    </div>
  );
};

export default EditorProgressBar;
