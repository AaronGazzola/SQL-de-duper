// components/StatementProvider.tsx
"use client";
import { StatementTextNode } from "@/components/StatementTextNode";
import { APPLY_STATEMENT_COMMAND } from "@/hooks/editor.hooks";
import { Statement } from "@/types/app.types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// SQL statement types
export const sqlStatementTypes = [
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

// Interface for storing selection data
interface SelectionData {
  key: string;
  statement: Statement | null;
}

// Context interface
interface StatementContextType {
  hasSelection: boolean;
  selectedText: string;
  selectionRect: DOMRect | null;
  statementType: string;
  selectedStatementName: string | null;
  setStatementType: (type: string) => void;
  applyStatementToSelection: () => void;
  handleTypeChange: (type: string) => void;
  selectionMap: Map<string, SelectionData>;
}

// Create context with default values
const StatementContext = createContext<StatementContextType>({
  hasSelection: false,
  selectedText: "",
  selectionRect: null,
  statementType: "",
  selectedStatementName: null,
  setStatementType: () => {},
  applyStatementToSelection: () => {},
  handleTypeChange: () => {},
  selectionMap: new Map(),
});

// Create a unique key for a selection
function createSelectionKey(selection: RangeSelection): string {
  const anchorKey = selection.anchor.key;
  const focusKey = selection.focus.key;
  const anchorOffset = selection.anchor.offset;
  const focusOffset = selection.focus.offset;

  return `${anchorKey}:${anchorOffset}-${focusKey}:${focusOffset}`;
}

// Extract statement name from SQL content based on type
function extractStatementName(
  content: string,
  statementType: string
): string | null {
  if (!content || !statementType) return null;

  const nameRegex = new RegExp(
    `(CREATE|ALTER)\\s+${statementType}\\s+([\\w\\.]+)`,
    "i"
  );
  const match = content.match(nameRegex);

  if (match && match[2]) {
    return match[2];
  }

  return null;
}

// Provider component
export const StatementProvider = ({ children }: { children: ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [statementType, setStatementType] = useState("");
  const [selectedStatementName, setSelectedStatementName] = useState<
    string | null
  >(null);
  const [selectionMap, setSelectionMap] = useState<Map<string, SelectionData>>(
    new Map()
  );
  const selectionKeyRef = useRef<string | null>(null);

  // Function to get statement from the current selection
  const getSelectionStatement = useCallback((): Statement | null => {
    let statement: Statement | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return null;
      }

      // Check if selection consists of a single StatementTextNode
      const nodes = selection.getNodes();

      // If there's only one node and it's a StatementTextNode
      if (nodes.length === 1 && nodes[0] instanceof StatementTextNode) {
        const statementNode = nodes[0] as StatementTextNode;
        statement = statementNode.getStatement();
      }
      // Check nodes in selection for StatementTextNode
      else {
        for (const node of nodes) {
          if (node instanceof StatementTextNode) {
            statement = node.getStatement();
            break;
          }
        }
      }
    });

    return statement;
  }, [editor]);

  // Get DOMRect for the current selection
  const getSelectionRect = useCallback((): DOMRect | null => {
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) return null;

    const range = domSelection.getRangeAt(0);
    return range.getBoundingClientRect();
  }, []);

  // Update selection state when the selection changes
  const updateSelectionState = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        const newHasSelection = text.length > 0;

        setHasSelection(newHasSelection);
        setSelectedText(text);

        if (newHasSelection) {
          // Get bounding rectangle of the selection
          const rect = getSelectionRect();
          setSelectionRect(rect);

          // Create a unique key for this selection
          const selectionKey = createSelectionKey(selection);
          selectionKeyRef.current = selectionKey;

          // Get statement settings from the selectionMap or from the current selection
          if (selectionMap.has(selectionKey)) {
            // If we have previously stored settings for this selection, use them
            const data = selectionMap.get(selectionKey);
            if (data?.statement) {
              setStatementType(data.statement.type);
              setSelectedStatementName(data.statement.name);
            }
          } else {
            // Otherwise, check if the selection contains statement nodes
            const selectionStatement = getSelectionStatement();

            if (selectionStatement) {
              setStatementType(selectionStatement.type);
              setSelectedStatementName(selectionStatement.name);
              // Store these settings in the map
              setSelectionMap((prevMap) => {
                const newMap = new Map(prevMap);
                newMap.set(selectionKey, {
                  key: selectionKey,
                  statement: selectionStatement,
                });
                return newMap;
              });
            } else {
              // If no existing statement, reset type and try to detect a name
              setStatementType("");

              // Try to extract statement name from selected text if a type is later selected
              const detectedName = extractStatementName(text, statementType);
              setSelectedStatementName(detectedName);
            }
          }
        } else {
          setSelectionRect(null);
          selectionKeyRef.current = null;
          setSelectedStatementName(null);
        }
      } else {
        setHasSelection(false);
        setSelectedText("");
        setSelectionRect(null);
        selectionKeyRef.current = null;
        setSelectedStatementName(null);
      }
    });
  }, [
    editor,
    getSelectionStatement,
    getSelectionRect,
    selectionMap,
    statementType,
  ]);

  // Register selection change listener
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateSelectionState();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateSelectionState();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateSelectionState]);

  // Apply statement to selected text
  const applyStatementToSelection = useCallback(() => {
    if (hasSelection && statementType) {
      editor.dispatchCommand(APPLY_STATEMENT_COMMAND, statementType);
    }
  }, [editor, hasSelection, statementType]);

  // Handle statement type change
  const handleTypeChange = useCallback(
    (newType: string) => {
      setStatementType(newType);

      // Try to extract statement name based on new type
      if (selectedText) {
        const detectedName = extractStatementName(selectedText, newType);
        setSelectedStatementName(detectedName);
      }

      // Update selectionMap if we have an active selection
      if (selectionKeyRef.current) {
        setSelectionMap((prevMap) => {
          const newMap = new Map(prevMap);
          const existingData = newMap.get(selectionKeyRef.current!) || {
            key: selectionKeyRef.current!,
            statement: null,
          };

          // If there's an existing statement, update its type
          if (existingData.statement) {
            const updatedStatement = {
              ...existingData.statement,
              type: newType,
            };
            newMap.set(selectionKeyRef.current!, {
              ...existingData,
              statement: updatedStatement,
            });
          }

          return newMap;
        });
      }

      // Apply the statement immediately when a type is selected
      if (newType) {
        setTimeout(() => {
          applyStatementToSelection();
        }, 0);
      }
    },
    [applyStatementToSelection, selectedText]
  );

  // Context value
  const contextValue: StatementContextType = {
    hasSelection,
    selectedText,
    selectionRect,
    statementType,
    selectedStatementName,
    setStatementType,
    applyStatementToSelection,
    handleTypeChange,
    selectionMap,
  };

  return (
    <StatementContext.Provider value={contextValue}>
      {children}
    </StatementContext.Provider>
  );
};

// Custom hook to use the statement context
export const useStatement = () => useContext(StatementContext);

export default StatementProvider;
