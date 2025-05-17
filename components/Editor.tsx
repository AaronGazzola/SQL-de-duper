// components/Editor.tsx
"use client";
import ExampleTheme from "@/components/ExampleTheme";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/providers/store";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  ParagraphNode,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from "lexical";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

const placeholder = "Enter SQL statement...";

// Define the editorConfig with explicit node registration
const editorConfig = {
  namespace: "SQLEditor",
  // Register our custom AnimatedTextNode here explicitly along with standard nodes
  nodes: [ParagraphNode, TextNode],
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

        const textNode = $createTextNode(fileContent);

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

// SQL Selection Toolbar that appears when text is selected
const SelectionToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [statementType, setStatementType] = useState("");
  const [statementName, setStatementName] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);

  // SQL statement types
  const sqlTypes = [
    "FUNCTION",
    "PROCEDURE",
    "TRIGGER",
    "VIEW",
    "POLICY",
    "RULE",
    "TABLE",
    "INDEX",
    "CONSTRAINT",
  ];

  const updateToolbar = useCallback(() => {
    const selection = window.getSelection();

    if (selection && !selection.isCollapsed) {
      // Get the bounding rectangle of the selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        setShow(true);

        // Position the toolbar above the selection
        if (toolbarRef.current) {
          const toolbarHeight = toolbarRef.current.offsetHeight;

          // Calculate position to center the toolbar above the selection
          setPosition({
            top: rect.top - toolbarHeight - 10, // 10px above the selection
            left: rect.left + rect.width / 2,
          });
        }
      } else {
        setShow(false);
      }
    } else {
      setShow(false);
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  if (!show) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 100,
        transform: "translateX(-50%)",
      }}
      className="bg-white border rounded-md shadow-md p-3 flex gap-2 items-center"
    >
      <Select
        value={statementType}
        onValueChange={setStatementType}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {sqlTypes.map((type) => (
            <SelectItem
              key={type}
              value={type}
            >
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="text"
        placeholder="Statement name"
        className="w-48"
        value={statementName}
        onChange={(e) => setStatementName(e.target.value)}
      />
    </div>
  );
};

const Editor: React.FC = () => {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="flex flex-col flex-grow overflow-hidden h-full">
        <FileNavigation />
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
          <SelectionToolbar />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default Editor;
