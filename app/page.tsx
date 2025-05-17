// app/page.tsx
"use client";
import Editor from "@/components/Editor";
import FileDropZone from "@/components/FileDropZone";
import { StatementAccordion } from "@/components/StatementAccordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/providers/store";
import { Upload } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("editor");
  const { parseResults } = useStore();

  return (
    <div className="flex h-screen">
      <FileDropZone />
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          {!parseResults.length ? (
            <div className="text-center py-8 flex flex-col items-center gap-6">
              <h2 className="text-2xl font-bold ">Welcome to SQL Squasher</h2>
              <p className="text-gray-500">Drop SQL files here</p>
              <Upload className="h-16 w-16 text-gray-500 mx-auto mb-6" />
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full max-w-2xl mx-auto"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="editor">SQL Editor</TabsTrigger>
                <TabsTrigger value="statements">Statements</TabsTrigger>
              </TabsList>

              <TabsContent value="editor">
                <Editor />
              </TabsContent>

              <TabsContent value="statements">
                <StatementAccordion />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
