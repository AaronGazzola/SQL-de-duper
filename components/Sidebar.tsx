// components/Sidebar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { Copy, Download, Menu, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const { open, isMobile } = useSidebar();
  const {
    editorFiles,
    resetStore,
    totalLines,
    parsedLines,
    copyParsedSQL,
    downloadParsedSQL,
    selectedFile,
    selectFile,
  } = useStore();

  const isExpanded = isMobile || open;
  const [copying, setCopying] = useState(false);

  // Calculate progress percentage for all files
  const overallProgress =
    totalLines > 0 ? Math.round((parsedLines / totalLines) * 100) : 0;

  const handleReset = () => {
    resetStore();
  };

  const handleCopy = async () => {
    setCopying(true);
    await copyParsedSQL();
    setTimeout(() => setCopying(false), 1000);
  };

  return (
    <>
      <ShadcnSidebar collapsible="icon">
        <SidebarContent className="h-full bg-gray-100 dark:bg-gray-900 border-r dark:border-gray-800 overflow-x-hidden gap-0">
          <SidebarHeader className="p-4">
            <div
              className={cn(
                "flex items-center",
                isExpanded ? "justify-between" : "justify-center"
              )}
            >
              {isExpanded && (
                <div className="flex flex-col w-full">
                  <h2 className="font-bold text-xl">SQL Squasher</h2>
                  <h4 className="font-medium text-base">By Az Anything</h4>
                  <p className="text-sm">(Aaron Gazzola)</p>
                </div>
              )}
              <SidebarTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </SidebarTrigger>
            </div>
          </SidebarHeader>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleReset}
                    tooltip="Reset Data"
                    className="cursor-pointer"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Reset</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="p-4">
            <SidebarGroupLabel>Overall Progress</SidebarGroupLabel>
            <SidebarGroupContent className={cn(!isExpanded && "h-32")}>
              <div className={cn(isExpanded ? "" : " rotate-90")}>
                <Progress
                  value={overallProgress}
                  className={cn("h-2", isExpanded ? "w-full" : "w-32")}
                />
                {isExpanded && (
                  <p className="text-xs text-gray-500 mt-1">
                    {overallProgress}% Complete ({parsedLines}/{totalLines}{" "}
                    lines)
                  </p>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {isExpanded && (
            <>
              <SidebarGroup className="p-4 flex-grow relative">
                <SidebarGroupLabel>Uploaded Files</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-1 overflow-y-auto absolute inset-3 top-12">
                    {editorFiles.map((file, index) => {
                      // Calculate individual file progress
                      const fileProgress =
                        file.stats.total > 0
                          ? Math.round(
                              (file.stats.parsed / file.stats.total) * 100
                            )
                          : 0;

                      return (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "text-sm p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer",
                                  selectedFile === file.filename &&
                                    "bg-gray-200 dark:bg-gray-800"
                                )}
                                onClick={() => selectFile(file.filename)}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="truncate">
                                    {file.filename}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {fileProgress}%
                                  </span>
                                </div>
                                <Progress
                                  value={fileProgress}
                                  className="h-1 w-full"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {file.filename} - {file.stats.parsed} of{" "}
                                {file.stats.total} lines parsed ({fileProgress}
                                %)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {editorFiles.length === 0 && (
                      <p className="text-xs text-gray-400 italic">
                        No files uploaded
                      </p>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup className="p-4">
                <SidebarGroupLabel>
                  Export combined de-duplicated SQL migration:
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={overallProgress < 100}
                            onClick={handleCopy}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {copying ? "Copied!" : "Copy"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy parsed SQL to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={overallProgress < 100}
                            onClick={downloadParsedSQL}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download parsed SQL</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
      </ShadcnSidebar>
    </>
  );
}
