// components/EditorToolbar.tsx
"use client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { APPLY_STATEMENT_COMMAND } from "@/hooks/editor.hooks";
import { cn } from "@/lib/utils";
import { useStore } from "@/providers/store";
import { Statement } from "@/types/app.types";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createId } from "@paralleldrive/cuid2";
import { $getSelection, $isRangeSelection } from "lexical";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";

const EditorToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const statements = useStore((state) => state.statements);
  const parseResults = useStore((state) => state.parseResults);
  const selectedFile = useStore((state) => state.selectedFile);

  // Get unique statement names from the store
  const statementNames = Array.from(
    new Set(statements.map((group) => group.content.name))
  );

  // Check if there's a text selection
  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        setHasSelection(
          $isRangeSelection(selection) && !selection.isCollapsed()
        );
      });
    });

    return removeListener;
  }, [editor]);

  // Handle statement name selection or creation
  const handleSelectName = (selectedName: string) => {
    setValue(selectedName);
    setOpen(false);

    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        return;
      }

      const selectedText = selection.getTextContent();
      if (!selectedText.trim()) {
        return;
      }

      // Get current file timestamp
      const currentFile = parseResults.find(
        (file) => file.filename === selectedFile
      );

      let timestamp = Date.now();
      if (currentFile?.filename) {
        const fileNameTimestampMatch = currentFile.filename.match(/^(\d+)/);
        if (fileNameTimestampMatch && fileNameTimestampMatch[1]) {
          timestamp = parseInt(fileNameTimestampMatch[1], 10);
        } else if (currentFile.timestamp) {
          timestamp = currentFile.timestamp;
        }
      }

      // Create statement object
      const statement: Statement = {
        id: createId(),
        type: "SQL", // Using a generic type since we're simplifying
        name: selectedName,
        content: selectedText,
        fileName: selectedFile || "",
        timestamp,
        hash: `SQL_${selectedName}_${timestamp}`,
        parsed: true,
      };

      // Check if there's an existing statement group with the same name
      const existingGroupIndex = statements.findIndex(
        (group) => group.content.name === selectedName
      );

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
        });
      }

      // Apply the statement name to the selection
      editor.dispatchCommand(APPLY_STATEMENT_COMMAND, selectedName);
    });
  };

  // Handle input blur (to create a new statement if needed)
  const handleInputBlur = () => {
    if (value && value.trim() !== "") {
      handleSelectName(value);
    }
  };

  return (
    <div className="border-b px-4 py-3 flex items-center gap-4">
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={!hasSelection}
            className={cn(
              "w-full justify-between",
              !hasSelection && "bg-gray-100 cursor-not-allowed"
            )}
          >
            {value
              ? value
              : hasSelection
              ? "Select or enter statement name..."
              : "Select text to identify statement"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search statement name or create new..."
              value={value}
              onValueChange={setValue}
              onBlur={handleInputBlur}
            />
            <CommandEmpty>
              {value.trim()
                ? `Press enter to create "${value.trim()}"`
                : "No statement names found"}
            </CommandEmpty>
            {statementNames.length > 0 && (
              <CommandGroup>
                {statementNames.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => handleSelectName(name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EditorToolbar;
