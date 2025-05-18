// components/Editor.tsx
"use client";
import EditorProgressBar from "@/components/EditorProgressBar";
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
import React, { useEffect } from "react";

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
  const selectedFile = useStore((state) => state.selectedFile);
  const selectFile = useStore((state) => state.selectFile);
  const [editor] = useLexicalComposerContext();

  const fileCount = parseResults.length;
  const currentFileIndex = parseResults.findIndex(
    (file) => file.filename === selectedFile
  );
  const currentFile = parseResults[currentFileIndex] || {
    filename: "No file loaded",
  };

  const navigateToPreviousFile = () => {
    if (currentFileIndex > 0) {
      selectFile(parseResults[currentFileIndex - 1].filename);
    }
  };

  const navigateToNextFile = () => {
    if (currentFileIndex < fileCount - 1) {
      selectFile(parseResults[currentFileIndex + 1].filename);
    }
  };

  // Load file content into editor when the selected file changes
  useEffect(() => {
    if (parseResults.length > 0 && selectedFile) {
      const file = parseResults.find((file) => file.filename === selectedFile);

      if (!file) return;

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

        // Update parse results with total line count if not already set
        if (!file.stats || file.stats.total === 0) {
          useStore
            .getState()
            .setFileStats(file.filename, totalLines, file.stats?.parsed || 0);
        }

        // Extract timestamp from filename if possible, or use file timestamp
        let timestamp = file.timestamp || Date.now();
        const fileNameTimestampMatch = file.filename.match(/^(\d+)/);
        if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
          timestamp = parseInt(fileNameTimestampMatch[1], 10);
        }

        // Use our custom StatementTextNode instead of TextNode
        const textNode = $createStatementTextNode(
          fileContent,
          "",
          "",
          false,
          timestamp
        );
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      });
    }
  }, [selectedFile, parseResults, editor]);

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
  return (
    <div className="flex-1 relative">
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
          <EditorProgressBar />
          <EditorContent />
        </div>
      </StatementProvider>
    </LexicalComposer>
  );
};

export default Editor;
