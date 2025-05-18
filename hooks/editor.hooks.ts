// hooks/editor.hooks.ts
import { $createStatementTextNode } from "@/components/StatementTextNode";
import { useStore } from "@/providers/store";
import { Statement } from "@/types/app.types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createId } from "@paralleldrive/cuid2";
import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setState,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  createState,
  LexicalCommand,
} from "lexical";
import { useCallback, useEffect } from "react";

// Create NodeState for parsed status
export const isParsedState = createState("isParsed", {
  parse: (v) => (typeof v === "boolean" ? v : false),
});

// Create a command for applying statement to text selection
export const APPLY_STATEMENT_COMMAND: LexicalCommand<string> = createCommand(
  "APPLY_STATEMENT_COMMAND"
);

export function useStatementEditor() {
  const [editor] = useLexicalComposerContext();
  const parseResults = useStore((state) => state.parseResults);
  const statements = useStore((state) => state.statements);
  const selectedFile = useStore((state) => state.selectedFile);
  const setParseProgress = useStore((state) => state.setParseProgress);

  // Register command listener for applying statement to selected text
  useEffect(() => {
    return editor.registerCommand<string>(
      APPLY_STATEMENT_COMMAND,
      (statementType) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const selectedText = selection.getTextContent();
        if (!selectedText.trim()) {
          return false;
        }

        // Calculate statement name based on content and type
        const nameRegex = new RegExp(
          `(CREATE|ALTER)\\s+${statementType}\\s+([\\w\\.]+)`,
          "i"
        );
        const match = selectedText.match(nameRegex);
        let statementName = "";

        if (match && match[2]) {
          statementName = match[2];
        } else {
          // Fallback for when statement name cannot be extracted from SQL
          statementName = `Unnamed_${statementType}_${Math.floor(
            Math.random() * 1000
          )}`;
        }

        // Get current file from store
        const currentFile = parseResults.find(
          (file) => file.filename === selectedFile
        );

        if (!currentFile) {
          return false;
        }

        const timestamp = currentFile.timestamp || Date.now();
        const fileName = currentFile.filename;

        // Create statement object
        const statement: Statement = {
          id: createId(),
          type: statementType,
          name: statementName,
          content: selectedText,
          fileName,
          timestamp,
          hash: `${statementType}_${statementName}_${timestamp}`,
          parsed: true,
        };

        // Check if there's an existing statement group with the same type and name
        const existingGroupIndex = statements.findIndex(
          (group) =>
            group.content.type === statementType &&
            group.content.name === statementName
        );

        // Create a StatementTextNode to replace the selected text
        const statementNode = $createStatementTextNode(
          selectedText,
          statement.type,
          statement.name,
          true
        );

        // Set the isParsed state on the node using NodeState API
        $setState(statementNode, isParsedState, true);

        selection.insertNodes([statementNode]);

        // Update store with the new statement or add it as a version to existing statement
        if (existingGroupIndex !== -1) {
          // Add as a version to existing statement group
          const updatedStatements = [...statements];
          updatedStatements[existingGroupIndex].versions.push(statement);
          useStore.setState({ statements: updatedStatements });
        } else {
          // Create a new statement group
          const newStatementGroup = {
            id: createId(),
            content: statement,
            versions: [],
          };
          useStore.setState({
            statements: [...statements, newStatementGroup],
            statementTypes: Array.from(
              new Set([...useStore.getState().statementTypes, statementType])
            ),
          });
        }

        // Update parsed lines count for the current file
        if (currentFile) {
          const lineCount = selectedText.split("\n").length;
          // Update parse progress in the store
          setParseProgress(
            currentFile.filename,
            currentFile.stats.parsed + lineCount
          );
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, parseResults, statements, selectedFile, setParseProgress]);

  // Function to toggle all content as parsed/unparsed
  const toggleAllParsed = useCallback(
    (isParsed: boolean) => {
      editor.update(() => {
        const root = $getRoot();

        // Traverse all nodes in the editor
        root.getChildren().forEach((paragraphNode) => {
          if ($isElementNode(paragraphNode)) {
            paragraphNode.getChildren().forEach((node) => {
              // If it's a StatementTextNode, update its parsed status using NodeState
              if (node.getType() === "statement-text") {
                // Use NodeState API instead of direct property access
                $setState(node, isParsedState, isParsed);
              }
            });
          }
        });
      });
    },
    [editor]
  );

  return {
    toggleAllParsed,
  };
}
