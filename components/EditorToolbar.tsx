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
import { cn } from "@/lib/utils";
import { useStore } from "@/providers/store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";

const EditorToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const statements = useStore((state) => state.statements);
  const selectedFile = useStore((state) => state.selectedFile);
  const addStatement = useStore((state) => state.addStatement);
  const editorFiles = useStore((state) => state.editorFiles);

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
  };

  // Handle adding statement
  const handleAddStatement = () => {
    if (!value || !selectedFile) return;

    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        return;
      }

      const selectedText = selection.getTextContent();
      if (!selectedText.trim()) {
        return;
      }

      // Add statement to store
      addStatement(value, selectedText, selectedFile);

      // Get the current file from the store after the statement has been added
      // This ensures we're working with the updated content where the statement text has been removed
      const updatedFile = editorFiles.find(
        (file) => file.filename === selectedFile
      );

      if (updatedFile && updatedFile.content) {
        // Reset the editor content to match what's in the store
        const root = $getRoot();
        root.clear();

        // Create a new paragraph with the updated content
        const paragraphNode = $createParagraphNode();
        const textNode = $createTextNode(updatedFile.content);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      }

      // Reset the value
      setValue("");
    });
  };

  // Handle input blur (to create a new statement if needed)
  const handleInputBlur = () => {
    if (value && value.trim() !== "") {
      handleSelectName(value.trim());
    }
  };

  return (
    <div className="border-b px-4 py-3 flex items-center gap-4 ">
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
              "justify-between flex-grow",
              !hasSelection && "bg-gray-100  cursor-not-allowed"
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

      <Button
        variant="outline"
        size="icon"
        disabled={!hasSelection || !value}
        onClick={handleAddStatement}
        className={cn(
          (!hasSelection || !value) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Add Statement</span>
      </Button>
    </div>
  );
};

export default EditorToolbar;
