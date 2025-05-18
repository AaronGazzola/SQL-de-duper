// components/Editor.tsx
"use client";
import EditorProgressBar from "@/components/EditorProgressBar";
import EditorToolbar from "@/components/EditorToolbar";
import ExampleTheme from "@/components/ExampleTheme";
import { useStore } from "@/store/store";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  ParagraphNode,
  TextNode,
} from "lexical";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo } from "react";

const placeholder = "Enter SQL statement...";

// Define the editorConfig with explicit node registration and node replacement
const editorConfig = {
  namespace: "SQLEditor",
  // Register our custom StatementTextNode along with standard nodes
  nodes: [ParagraphNode, TextNode],
  onError(error: Error) {
    console.error(error);
  },
  theme: ExampleTheme,
};

// File Navigation component for showing current file and navigation controls
const FileNavigation: React.FC = () => {
  const editorFiles = useStore((state) => state.editorFiles);
  const selectedFile = useStore((state) => state.selectedFile);
  const selectFile = useStore((state) => state.selectFile);
  const [editor] = useLexicalComposerContext();

  const fileCount = editorFiles.length;
  const currentFileIndex = editorFiles.findIndex(
    (file) => file.filename === selectedFile
  );
  const currentFile = editorFiles[currentFileIndex] || {
    filename: "No file loaded",
  };

  const navigateToPreviousFile = () => {
    if (currentFileIndex > 0) {
      selectFile(editorFiles[currentFileIndex - 1].filename);
    }
  };

  const navigateToNextFile = () => {
    if (currentFileIndex < fileCount - 1) {
      selectFile(editorFiles[currentFileIndex + 1].filename);
    }
  };

  // Load file content into editor when the selected file changes
  useEffect(() => {
    if (editorFiles.length > 0 && selectedFile) {
      const file = editorFiles.find((file) => file.filename === selectedFile);

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

        const textNode = $createTextNode(fileContent);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      });
    }
  }, [selectedFile, editorFiles, editor]);

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

// Success Alert component for showing when file is fully parsed
const SuccessAlert: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full bg-green-50 p-6">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          File Successfully Parsed
        </h3>
        <p className="text-sm text-gray-500">
          All content from this file has been processed. You can view the
          results in the sidebar.
        </p>
      </div>
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
  const selectedFile = useStore((state) => state.selectedFile);
  const editorFiles = useStore((state) => state.editorFiles);

  // Check if current file is marked as parsed
  const isParsed = useMemo(() => {
    if (!selectedFile) return false;
    const currentFile = editorFiles.find(
      (file) => file.filename === selectedFile
    );
    return currentFile?.isParsed || false;
  }, [selectedFile, editorFiles]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div
        className={`flex flex-col flex-grow overflow-hidden h-full ${
          isParsed ? "bg-blue-50" : ""
        }`}
      >
        <FileNavigation />
        <EditorToolbar />
        <EditorProgressBar />

        {/* Show success alert when file is marked as parsed, otherwise show editor */}
        {isParsed ? <SuccessAlert /> : <EditorContent />}
      </div>
    </LexicalComposer>
  );
};

export default Editor;
