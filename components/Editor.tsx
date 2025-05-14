// components/Editor.tsx
"use client";

import ExampleTheme from "@/components/ExampleTheme";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ParagraphNode, TextNode } from "lexical";
import React from "react";

const placeholder = "Enter SQL statement...";

// Define the editorConfig with explicit node registration
const editorConfig = {
  namespace: "SQLEditor",
  // Register our custom AnimatedTextNode here explicitly along with standard nodes
  nodes: [ParagraphNode, TextNode],
  onError(error: Error) {
    console.error(error);
  },
  theme: ExampleTheme,
};

const Editor: React.FC = () => {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="flex flex-col flex-grow border rounded-md overflow-hidden">
        <div className="flex-1 relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="px-2  overflow-auto focus:outline-none font-mono inset-0 absolute p-2"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="absolute top-2 left-2 -z-10 text-gray-400">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default Editor;
