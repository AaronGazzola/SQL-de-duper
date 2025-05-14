// Do not delete this comment: Filename: @/components/parsing/SQLEditor.tsx
import { Selection } from "@/types/app.types";
import { createEditor, LexicalEditor } from "lexical";
import { useEffect, useRef, useState } from "react";

interface SQLEditorProps {
  content: string;
  onSelectionChange: (selection: Selection, rect: DOMRect) => void;
}

export function SQLEditor({ content }: SQLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor] = useState<LexicalEditor>(() => {
    return createEditor({
      namespace: "SQLEditor",
      onError: (error) => {
        console.error(error);
      },
    });
  });

  // Initialize the editor with content
  useEffect(() => {
    if (editorRef.current) {
      const editorElement = editorRef.current;

      // For a real implementation, you would use proper Lexical setup
      // This is a simplified version for demonstration

      // Set content
      editorElement.textContent = content;

      // Simple SQL syntax highlighting with regex
      const sqlKeywords = [
        "SELECT",
        "FROM",
        "WHERE",
        "INSERT",
        "UPDATE",
        "DELETE",
        "CREATE",
        "ALTER",
        "DROP",
        "TABLE",
        "INDEX",
        "VIEW",
        "PRIMARY",
        "KEY",
        "FOREIGN",
        "REFERENCES",
        "CONSTRAINT",
        "NOT",
        "NULL",
        "DEFAULT",
        "AUTO_INCREMENT",
        "DATABASE",
      ];

      const keywordRegex = new RegExp(`\\b(${sqlKeywords.join("|")})\\b`, "gi");

      // Basic highlighting (a real implementation would use Lexical properly)
      const highlightSyntax = () => {
        const html = editorElement.textContent || "";
        const highlighted = html.replace(
          keywordRegex,
          '<span class="text-blue-600 font-medium">$1</span>'
        );

        // Only replace if content is different to avoid selection issues
        if (editorElement.innerHTML !== highlighted) {
          // Store selection
          const selection = window.getSelection();
          const range = selection?.getRangeAt(0);

          editorElement.innerHTML = highlighted;

          // Restore selection
          if (selection && range) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      };

      // Initial highlight
      // setTimeout(highlightSyntax, 0);
    }
  }, [content, editor]);

  // Handle selection changes
  // useEffect(() => {
  //   const handleSelectionChange = () => {
  //     const selection = window.getSelection();

  //     if (
  //       selection &&
  //       selection.rangeCount > 0 &&
  //       selection.toString().trim() !== ""
  //     ) {
  //       const range = selection.getRangeAt(0);
  //       const rect = range.getBoundingClientRect();

  //       // Only trigger if selection is within our editor
  //       if (editorRef.current?.contains(range.commonAncestorContainer)) {
  //         onSelectionChange(
  //           {
  //             text: selection.toString(),
  //             startOffset: range.startOffset,
  //             endOffset: range.endOffset,
  //           },
  //           rect
  //         );
  //       }
  //     }
  //   };

  //   document.addEventListener("selectionchange", handleSelectionChange);

  //   return () => {
  //     document.removeEventListener("selectionchange", handleSelectionChange);
  //   };
  // }, [onSelectionChange]);

  return (
    <div className="sql-editor w-full">
      <div
        ref={editorRef}
        className="font-mono text-sm p-4 outline-none whitespace-pre-wrap min-h-[400px] max-h-[600px] overflow-auto"
        contentEditable={true}
        suppressContentEditableWarning={true}
        spellCheck={false}
      />
    </div>
  );
}

export default SQLEditor;
