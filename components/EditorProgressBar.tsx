// components/ProgressBar.tsx
"use client";
import { useStatementEditor } from "@/hooks/editor.hooks";
import { useStore } from "@/providers/store";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

const ProgressBar: React.FC = () => {
  const parseResults = useStore((state) => state.parseResults);
  const { toggleAllParsed } = useStatementEditor();
  const [allParsed, setAllParsed] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Get current file
  const currentFile = parseResults[currentFileIndex] || {
    stats: { total: 0, parsed: 0 },
  };

  // Calculate progress percentage
  const progressPercentage =
    currentFile.stats.total > 0
      ? (currentFile.stats.parsed / currentFile.stats.total) * 100
      : 0;

  // Update allParsed state when file changes or parsed status changes
  useEffect(() => {
    const isParsed =
      currentFile.stats.total > 0 &&
      currentFile.stats.parsed === currentFile.stats.total;
    setAllParsed(isParsed);
  }, [
    currentFile.stats.parsed,
    currentFile.stats.total,
    currentFileIndex,
    parseResults,
  ]);

  // Handle toggle all parsed
  const handleToggleAllParsed = () => {
    const newParsedState = !allParsed;
    setAllParsed(newParsedState);
    toggleAllParsed(newParsedState);
  };

  // Update current file index when it changes in store
  useEffect(() => {
    const storeFileIndex = 0; // This should match with what you use in Editor.tsx
    if (storeFileIndex !== currentFileIndex) {
      setCurrentFileIndex(storeFileIndex);
    }
  }, [currentFileIndex, parseResults]);

  if (parseResults.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600">
        {currentFile.stats.parsed}/{currentFile.stats.total} parsed
      </div>
      <button
        onClick={handleToggleAllParsed}
        className={`p-1 rounded-full ${
          allParsed ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
        } hover:bg-blue-200`}
        title={allParsed ? "Mark as unparsed" : "Mark all as parsed"}
      >
        <Check size={18} />
      </button>
    </div>
  );
};

export default ProgressBar;
