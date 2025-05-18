// components/EditorProgressBar.tsx
"use client";
import { $isStatementTextNode } from "@/components/StatementTextNode";
import { useStatementEditor } from "@/hooks/editor.hooks";
import { useStore } from "@/providers/store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

const EditorProgressBar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const parseResults = useStore((state) => state.parseResults);
  const selectedFile = useStore((state) => state.selectedFile);
  const setParseProgress = useStore((state) => state.setParseProgress);
  const [overrideParsed, setOverrideParsed] = useState(false);
  const { toggleAllParsed } = useStatementEditor();

  // Find current file in parse results
  const currentFile = parseResults.find(
    (file) => file.filename === selectedFile
  ) || {
    filename: "No file loaded",
    stats: { total: 0, parsed: 0 },
  };

  // Calculate progress percentage
  const progressPercentage =
    currentFile.stats.total > 0
      ? (currentFile.stats.parsed / currentFile.stats.total) * 100
      : 0;

  const allParsed = currentFile.stats.parsed === currentFile.stats.total;

  // Calculate actual parsed lines from editor content
  useEffect(() => {
    // Only calculate if we're not overriding the parsed status
    if (!overrideParsed && selectedFile) {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        let parsedLines = 0;

        // Traverse all nodes in the editor
        root.getChildren().forEach((paragraphNode) => {
          paragraphNode.getChildren().forEach((node) => {
            if ($isStatementTextNode(node) && node.getIsParsed()) {
              // Count lines in parsed statement nodes
              const content = node.getTextContent();
              const lines = content.split("\n").length;
              parsedLines += lines;
            }
          });
        });

        // Update the store with the calculated parsed lines
        if (selectedFile) {
          setParseProgress(selectedFile, parsedLines);
        }
      });
    }
  }, [editor, selectedFile, overrideParsed, setParseProgress]);

  // Handle toggle all parsed
  const handleToggleAllParsed = () => {
    if (allParsed && overrideParsed) {
      // Revert to calculating from editor content
      setOverrideParsed(false);
      toggleAllParsed(false);
    } else {
      // Mark all as parsed
      setOverrideParsed(true);
      toggleAllParsed(true);

      // Update store directly
      if (selectedFile) {
        setParseProgress(selectedFile, currentFile.stats.total);
      }
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

export default EditorProgressBar;
