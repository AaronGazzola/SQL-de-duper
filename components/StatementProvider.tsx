// components/StatementProvider.tsx
"use client";

import {
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

  // Function to update the statement type of the selected text node
  const handleTypeChange = (value: string) => {
    if (!hasSelection) return;

    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();

        // Update all statement text nodes in the selection
        nodes.forEach((node) => {
          if ($isStatementTextNode(node)) {
            node.setStatementType(value);

            // Generate a statement name if not already set
            if (!node.getStatementName()) {
              const statementText = node.getTextContent().trim();
              const firstLine = statementText.split("\n")[0];
              const shortName =
                firstLine.substring(0, 30) +
                (firstLine.length > 30 ? "..." : "");
              node.setStatementName(shortName);
              setSelectedStatementName(shortName);
            }
          }
        });
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
                  useStore.setState((state) => ({
                    parsedLines: state.parsedLines + lineCount,
                  }));
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
  }, [editor]);

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
