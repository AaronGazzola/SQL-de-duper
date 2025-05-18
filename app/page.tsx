// app/page.tsx
"use client";
import Editor from "@/components/Editor";
import FileDropZone from "@/components/FileDropZone";
import { StatementAccordion } from "@/components/StatementAccordion";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/store";
import { Menu, Upload } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("editor");
  const { files } = useStore();

  return (
    <div className="flex h-screen w-full relative">
      <SidebarTrigger className="absolute top-4 left-4 z-10 md:hidden">
        <Button
          variant="ghost"
          size="icon"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SidebarTrigger>
      <FileDropZone />
      <div className="flex-1 overflow-auto w-full">
        <div className="container py-6 w-full h-full">
          {!files.length ? (
            <div className="text-center py-8 flex flex-col items-center gap-6">
              <h2 className="text-2xl font-bold ">Welcome to SQL Squasher</h2>
              <p className="text-gray-500">Drop SQL files here</p>
              <Upload className="h-16 w-16 text-gray-500 mx-auto mb-6" />
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full max-w-4xl mx-auto flex flex-col items-center h-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 max-w-xl">
                <TabsTrigger value="editor">SQL Editor</TabsTrigger>
                <TabsTrigger value="statements">Statements</TabsTrigger>
              </TabsList>

              <TabsContent
                value="editor"
                className="w-full mx-auto relative h-full"
              >
                <Editor />
              </TabsContent>

              <TabsContent
                value="statements"
                className="w-full mx-auto relative h-full"
              >
                <StatementAccordion />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
