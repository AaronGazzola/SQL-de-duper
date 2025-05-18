// hooks/editor.hooks.ts
import {
  $createStatementTextNode,
  StatementTextNode,
} from "@/components/StatementTextNode";
import { useStore } from "@/providers/store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { useEffect } from "react";

// Create a command for applying statement to text selection
export const APPLY_STATEMENT_COMMAND: LexicalCommand<string> = createCommand(
  "APPLY_STATEMENT_COMMAND"
);

export function useStatementEditor() {
  const [editor] = useLexicalComposerContext();
  const parseResults = useStore((state) => state.parseResults);
  const statements = useStore((state) => state.statements);
  const selectedFile = useStore((state) => state.selectedFile);

  // Register node transform for StatementTextNode
  useEffect(() => {
    return editor.registerNodeTransform(StatementTextNode, (node) => {
      // Apply a faint green background to any StatementTextNode that has a name value
      if (node.getStatementName().trim()) {
        const element = editor.getElementByKey(node.getKey());
        if (element) {
          element.style.backgroundColor = "rgba(0, 255, 0, 0.1)";
        }
      }
    });
  }, [editor]);

  // Register command listener for applying statement name to selected text
  useEffect(() => {
    return editor.registerCommand<string>(
      APPLY_STATEMENT_COMMAND,
      (statementName) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        const selectedText = selection.getTextContent();
        if (!selectedText.trim()) {
          return false;
        }

        // Get current file from store
        const currentFile = parseResults.find(
          (file) => file.filename === selectedFile
        );
        if (!currentFile) {
          return false;
        }

        // Get timestamp from filename or use current time
        let timestamp = currentFile.timestamp || Date.now();
        const fileName = currentFile.filename;
        const fileNameTimestampMatch = fileName.match(/^(\d+)/);
        if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
          timestamp = parseInt(fileNameTimestampMatch[1], 10);
        }

        // Create a StatementTextNode to replace the selected text
        const statementNode = $createStatementTextNode(
          selectedText,
          statementName,
          timestamp
        );
        selection.insertNodes([statementNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, parseResults, statements, selectedFile]);
}
