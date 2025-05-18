// components/StatementProvider.tsx
"use client";

import {
  $createStatementTextNode,
  $isStatementTextNode,
  StatementTextNode,
} from "@/components/StatementTextNode";
import { useStore } from "@/providers/store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import React, { createContext, useContext, useEffect, useState } from "react";

export const sqlStatementTypes = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE TABLE",
  "ALTER TABLE",
  "DROP TABLE",
  "CREATE INDEX",
  "CREATE VIEW",
  "MERGE",
  "TRUNCATE",
  "BEGIN TRANSACTION",
  "COMMIT",
  "ROLLBACK",
  "GRANT",
  "REVOKE",
  "OTHER",
];

interface StatementContextType {
  hasSelection: boolean;
  statementType: string;
  handleTypeChange: (value: string) => void;
  selectedStatementName: string | null;
  setSelectedStatementName: (name: string | null) => void;
}

const StatementContext = createContext<StatementContextType>({
  hasSelection: false,
  statementType: "",
  handleTypeChange: () => {},
  selectedStatementName: null,
  setSelectedStatementName: () => {},
});

export const useStatement = () => useContext(StatementContext);

const StatementProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [editor] = useLexicalComposerContext();
  const [hasSelection, setHasSelection] = useState(false);
  const [statementType, setStatementType] = useState("");
  const [selectedStatementName, setSelectedStatementName] = useState<
    string | null
  >(null);
  const parseResults = useStore((state) => state.parseResults);

  // Function to update the statement type of the selected text node
  const handleTypeChange = (value: string) => {
    if (!hasSelection) return;

    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        const selectedText = selection.getTextContent();

        // Extract statement name from the text content
        const nameRegex = new RegExp(
          `(CREATE|ALTER)\\s+${value}\\s+([\\w\\.]+)`,
          "i"
        );
        const match = selectedText.match(nameRegex);
        let statementName = "";

        if (match && match[2]) {
          statementName = match[2];
        } else {
          // Fallback for when statement name cannot be extracted from SQL
          statementName = `Unnamed_${value}_${Math.floor(
            Math.random() * 1000
          )}`;
        }

        // Get current file and extract timestamp
        const currentFile = parseResults.length > 0 ? parseResults[0] : null;
        let timestamp = Date.now();

        // Try to extract timestamp from filename (assuming it's at the start)
        if (currentFile?.filename) {
          const fileNameTimestampMatch = currentFile.filename.match(/^(\d+)/);
          if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
            timestamp = parseInt(fileNameTimestampMatch[1], 10);
          } else if (currentFile.timestamp) {
            // Use file timestamp as fallback
            timestamp = currentFile.timestamp;
          }
        }

        // Create a new statement node with the selected text
        const statementNode = $createStatementTextNode(
          selectedText,
          value,
          statementName,
          false, // Not parsed by default
          timestamp
        );

        // Replace the selection with the new statement node
        selection.insertNodes([statementNode]);

        // Update the statement name state
        setSelectedStatementName(statementName);
      }
    });

    setStatementType(value);
  };

  // Register selection change listener
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();

          // Update selection state
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            setHasSelection(true);

            // Check if selection contains StatementTextNode
            const nodes = selection.getNodes();
            const statementNode = nodes.find((node) =>
              $isStatementTextNode(node)
            ) as StatementTextNode | undefined;

            if (statementNode) {
              setStatementType(statementNode.getStatementType() || "");
              setSelectedStatementName(
                statementNode.getStatementName() || null
              );
            } else {
              setStatementType("");
              setSelectedStatementName(null);
            }
          } else {
            setHasSelection(false);
            setStatementType("");
            setSelectedStatementName(null);
          }
        });

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  // Register handler for Enter key to mark statement as parsed
  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();

            // Toggle isParsed state when Enter is pressed with a selection
            nodes.forEach((node) => {
              if ($isStatementTextNode(node) && node.getStatementType()) {
                const isParsed = node.getIsParsed();
                node.setIsParsed(!isParsed);

                // Update parsedLines count in the store
                if (!isParsed) {
                  const lineCount = node
                    .getTextContent()
                    .split("\n")
                    .filter((line) => line.trim()).length;

                  // Update the parsed lines count in store
                  useStore.setState((state) => ({
                    parsedLines: state.parsedLines + lineCount,
                  }));

                  // Update the parsed lines count in the current file
                  const currentFile =
                    parseResults.length > 0 ? parseResults[0] : null;
                  if (currentFile) {
                    const updatedParseResults = [...parseResults];
                    const fileIndex = updatedParseResults.findIndex(
                      (file) => file.filename === currentFile.filename
                    );

                    if (fileIndex !== -1) {
                      updatedParseResults[fileIndex].stats.parsed += lineCount;
                      useStore.setState({
                        parseResults: updatedParseResults,
                      });
                    }
                  }
                }
              }
            });
          }
        });

        // Return false to allow the default Enter key behavior
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, parseResults]);

  const contextValue = {
    hasSelection,
    statementType,
    handleTypeChange,
    selectedStatementName,
    setSelectedStatementName,
  };

  return (
    <StatementContext.Provider value={contextValue}>
      {children}
    </StatementContext.Provider>
  );
};

export default StatementProvider;
