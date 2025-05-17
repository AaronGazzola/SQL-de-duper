// hooks/editor.hooks.ts
import { $createStatementTextNode } from "@/components/StatementTextNode";
import { useStore } from "@/providers/store";
import { Statement } from "@/types/app.types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createId } from "@paralleldrive/cuid2";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { useCallback, useEffect } from "react";

// Create a command for applying statement to text selection
export const APPLY_STATEMENT_COMMAND: LexicalCommand<string> = createCommand(
  "APPLY_STATEMENT_COMMAND"
);

export function useStatementEditor() {
  const [editor] = useLexicalComposerContext();
  const parseResults = useStore((state) => state.parseResults);
  const statements = useStore((state) => state.statements);

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

        // Get current file timestamp
        const currentFile = parseResults.length > 0 ? parseResults[0] : null;
        const timestamp = currentFile?.timestamp || Date.now();
        const fileName = currentFile?.filename || "Unknown";

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
        const statementNode = $createStatementTextNode(selectedText, statement);
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

        // Update parsed lines count in the current file
        if (currentFile) {
          const lineCount = selectedText.split("\n").length;
          const updatedParseResults = [...parseResults];
          const fileIndex = updatedParseResults.findIndex(
            (file) => file.filename === currentFile.filename
          );

          if (fileIndex !== -1) {
            updatedParseResults[fileIndex].stats.parsed += lineCount;
            useStore.setState({
              parseResults: updatedParseResults,
              parsedLines: useStore.getState().parsedLines + lineCount,
            });
          }
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, parseResults, statements]);

  // Function to toggle all content as parsed/unparsed
  const toggleAllParsed = useCallback(
    (isParsed: boolean) => {
      editor.update(() => {
        if (parseResults.length > 0) {
          const currentFile = parseResults[0];
          const updatedParseResults = [...parseResults];
          const fileIndex = updatedParseResults.findIndex(
            (file) => file.filename === currentFile.filename
          );

          if (fileIndex !== -1) {
            // Update parse results
            if (isParsed) {
              updatedParseResults[fileIndex].stats.parsed =
                updatedParseResults[fileIndex].stats.total;
            } else {
              updatedParseResults[fileIndex].stats.parsed = 0;
            }

            // Update store
            useStore.setState({
              parseResults: updatedParseResults,
              parsedLines: isParsed ? useStore.getState().totalLines : 0,
            });
          }
        }
      });
    },
    [editor, parseResults]
  );

  return {
    toggleAllParsed,
  };
}
