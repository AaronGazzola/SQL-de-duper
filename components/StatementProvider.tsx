// components/StatementProvider.tsx
"use client";

import { $isStatementTextNode } from "@/components/StatementTextNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import React, { createContext, useContext, useEffect, useState } from "react";

interface StatementContextType {
  hasSelection: boolean;
  selectedStatementName: string | null;
  setSelectedStatementName: (name: string | null) => void;
}

const StatementContext = createContext<StatementContextType>({
  hasSelection: false,
  selectedStatementName: null,
  setSelectedStatementName: () => {},
});

export const useStatement = () => useContext(StatementContext);

const StatementProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [editor] = useLexicalComposerContext();
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedStatementName, setSelectedStatementName] = useState<
    string | null
  >(null);

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
            );

            if (statementNode && $isStatementTextNode(statementNode)) {
              setSelectedStatementName(
                statementNode.getStatementName() || null
              );
            } else {
              setSelectedStatementName(null);
            }
          } else {
            setHasSelection(false);
            setSelectedStatementName(null);
          }
        });

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  const contextValue = {
    hasSelection,
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
