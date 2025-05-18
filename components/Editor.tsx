// components/Editor.tsx
"use client";
import ProgressBar from "@/components/EditorProgressBar";
import EditorToolbar from "@/components/EditorToolbar";
import ExampleTheme from "@/components/ExampleTheme";
import StatementProvider from "@/components/StatementProvider";
import {
  $createStatementTextNode,
  StatementTextNode,
} from "@/components/StatementTextNode";
import { useStore } from "@/providers/store";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createParagraphNode,
  $getRoot,
  ParagraphNode,
  TextNode,
} from "lexical";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";

const placeholder = "Enter SQL statement...";

// Define the editorConfig with explicit node registration and node replacement
const editorConfig = {
  namespace: "SQLEditor",
  // Register our custom StatementTextNode along with standard nodes
  nodes: [
    ParagraphNode,
    StatementTextNode,
    {
      replace: TextNode,
      with: (node: TextNode) => {
        return $createStatementTextNode(node.getTextContent());
      },
      withKlass: StatementTextNode,
    },
  ],
  onError(error: Error) {
    console.error(error);
  },
  theme: ExampleTheme,
};

// File Navigation component for showing current file and navigation controls
const FileNavigation: React.FC = () => {
  const parseResults = useStore((state) => state.parseResults);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [editor] = useLexicalComposerContext();

  const fileCount = parseResults.length;
  const currentFile = parseResults[currentFileIndex] || {
    filename: "No file loaded",
  };

  const navigateToPreviousFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  const navigateToNextFile = () => {
    if (currentFileIndex < fileCount - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  // Load file content into editor when the selected file changes
  useEffect(() => {
    if (parseResults.length > 0) {
      const file = parseResults[currentFileIndex];

      // Update the editor content with the file contents
      editor.update(() => {
        const root = $getRoot();

        // Clear existing content
        root.clear();

        // Create a new paragraph with the file's actual content
        const paragraphNode = $createParagraphNode();

        // Use the file content if available, otherwise fallback to filename
        const fileContent = file.content || file.filename;

        // Count total lines for progress bar
        const totalLines = fileContent
          .split("\n")
          .filter((line) => line.trim()).length;

        // Update store with total lines count
        useStore.setState({
          totalLines,
          parsedLines: file.stats?.parsed || 0,
        });

        // Update parse results with total line count if not already set
        if (!file.stats || file.stats.total === 0) {
          const updatedParseResults = [...parseResults];
          updatedParseResults[currentFileIndex].stats = {
            total: totalLines,
            parsed: file.stats?.parsed || 0,
          };
          useStore.setState({ parseResults: updatedParseResults });
        }

        // Use our custom StatementTextNode instead of TextNode
        const textNode = $createStatementTextNode(fileContent);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      });
    }
  }, [currentFileIndex, parseResults, editor]);

  return (
    <div className="flex items-center justify-between rounded-lg border-b px-4 py-2">
      <button
        onClick={navigateToPreviousFile}
        disabled={currentFileIndex === 0 || fileCount === 0}
        className={`p-1 rounded hover:bg-gray-200 ${
          currentFileIndex === 0 || fileCount === 0
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        aria-label="Previous file"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="text-center font-medium">
        {fileCount > 0
          ? `${currentFile.filename} (${currentFileIndex + 1}/${fileCount})`
          : "No files loaded"}
      </div>

      <button
        onClick={navigateToNextFile}
        disabled={currentFileIndex === fileCount - 1 || fileCount === 0}
        className={`p-1 rounded hover:bg-gray-200 ${
          currentFileIndex === fileCount - 1 || fileCount === 0
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        aria-label="Next file"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// EditorContent component for rendering the editor with parsed status
const EditorContent: React.FC = () => {
  const [isParsed, setIsParsed] = useState(false);
  const parseResults = useStore((state) => state.parseResults);

  // Update isParsed state when current file changes or parsed status changes
  useEffect(() => {
    if (parseResults.length > 0) {
      const currentFile = parseResults[0];
      setIsParsed(
        currentFile.stats.total > 0 &&
          currentFile.stats.parsed === currentFile.stats.total
      );
    }
  }, [parseResults]);

  return (
    <div className={`flex-1 relative ${isParsed ? "bg-blue-50" : ""}`}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="px-2 overflow-auto focus:outline-none font-mono inset-0 absolute p-2"
            aria-placeholder={placeholder}
            placeholder={
              <div className="absolute top-2 left-2 -z-10 text-gray-400">
                {placeholder}
              </div>
            }
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <AutoFocusPlugin />
    </div>
  );
};

const Editor: React.FC = () => {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <StatementProvider>
        <div className="flex flex-col flex-grow overflow-hidden h-full">
          <FileNavigation />
          <EditorToolbar />
          <ProgressBar />
          <EditorContent />
        </div>
      </StatementProvider>
    </LexicalComposer>
  );
};

export default Editor;
