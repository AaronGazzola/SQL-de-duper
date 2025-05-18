// components/EditorProgressBar.tsx
"use client";

import { Progress } from "@/components/ui/progress";
import { useStore } from "@/providers/store";
import { Check, RotateCcw } from "lucide-react";
import { useMemo } from "react";

const EditorProgressBar: React.FC = () => {
  const editorFiles = useStore((state) => state.editorFiles);
  const selectedFile = useStore((state) => state.selectedFile);
  const toggleFileParsed = useStore((state) => state.toggleFileParsed);
  const resetFile = useStore((state) => state.resetFile);

  // Find current file in editor files
  const currentEditorFile = useMemo(
    () =>
      editorFiles.find((file) => file.filename === selectedFile) || {
        filename: "No file loaded",
        content: "",
        stats: { total: 0, parsed: 0 },
      },
    [editorFiles, selectedFile]
  );

  const fileProgress =
    currentEditorFile.stats.total > 0
      ? Math.round(
          (currentEditorFile.stats.parsed / currentEditorFile.stats.total) * 100
        )
      : 0;

  // Get current file parsed status
  const isParsed = currentEditorFile?.isParsed || false;

  // Handle toggle all parsed
  const handleToggleAllParsed = () => {
    if (selectedFile) {
      toggleFileParsed(selectedFile, !isParsed);
    }
  };

  // Handle reset file
  const handleResetFile = () => {
    if (selectedFile) {
      resetFile(selectedFile);
    }
  };

  if (!selectedFile) {
    return null;
  }

  return (
    <div className="flex items-center gap-7 px-4 py-2 border-t border-b">
      <button
        onClick={handleResetFile}
        className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        title="Reset file to original state"
      >
        <RotateCcw size={18} />
      </button>
      <Progress
        value={fileProgress}
        className="h-1 w-full"
      />
      <div className="text-sm text-gray-600">
        <p className="whitespace-nowrap">{fileProgress}% parsed</p>

        {currentEditorFile.stats.total > 0 && (
          <p className="ml-1 text-xs text-gray-500 whitespace-nowrap">
            ({currentEditorFile.stats.parsed}/{currentEditorFile.stats.total}{" "}
            lines)
          </p>
        )}
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
