// components/AppSidebar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStore } from "@/Providers/store";
import { ParsedFile } from "@/types/app.types";
import { Code, Download, Menu, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useMemo } from "react";

export default function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const {
    isSidebarOpen,
    parseResults,
    toggleSidebar,
    generateSQL,
    resetStore,
    resetSqlPatterns,
    setUploadDialogOpen,
    setEditorDialogOpen,
  } = useStore();

  // Sync the sidebar state with the store
  useEffect(() => {
    if (isSidebarOpen !== open) {
      toggleSidebar();
    }
  }, [open, isSidebarOpen, toggleSidebar]);

  // Calculate total progress
  const progress = useMemo(() => {
    if (parseResults.length > 0) {
      const totalStats = parseResults.reduce(
        (acc: { total: number; parsed: number }, file: ParsedFile) => {
          acc.total += file.stats.total;
          acc.parsed += file.stats.parsed;
          return acc;
        },
        { total: 0, parsed: 0 }
      );

      return totalStats.total > 0
        ? Math.round((totalStats.parsed / totalStats.total) * 100)
        : 0;
    }
    return 0;
  }, [parseResults]);

  const handleDownload = () => {
    // Generate SQL using the store method
    const generatedSQL = generateSQL();

    // Create a download
    const blob = new Blob([generatedSQL], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "migration.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetStore();
    setUploadDialogOpen(true);
  };

  const handleResetPatterns = () => {
    resetSqlPatterns();
  };

  const handleToggleSidebar = () => {
    setOpen(!open);
    toggleSidebar();
  };

  const handleOpenSQLEditor = () => {
    setEditorDialogOpen(true);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="h-full bg-gray-100 dark:bg-gray-900 border-r dark:border-gray-800 overflow-x-hidden gap-0 ">
        <SidebarHeader className="p-4">
          <div
            className={cn(
              "flex items-center",
              isSidebarOpen ? "justify-between" : "justify-center"
            )}
          >
            {open && <h2 className="font-bold text-lg">SQL Squasher</h2>}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleOpenSQLEditor}
                  tooltip="SQL Editor"
                  className="cursor-pointer"
                >
                  <Code className="h-5 w-5" />
                  <span>SQL Editor</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
                  <span>Reset Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleResetPatterns}
                  tooltip="Reset Patterns"
                  className="cursor-pointer"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Reset Patterns</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-4">
          <SidebarGroupLabel>Parsing Progress</SidebarGroupLabel>
          <SidebarGroupContent className={cn(!isSidebarOpen && "h-32")}>
            <div className={cn(isSidebarOpen ? "" : " rotate-90")}>
              <Progress
                value={progress}
                className={cn("h-2", isSidebarOpen ? "w-full" : "w-32")}
              />
              {open && (
                <p className="text-xs text-gray-500 mt-1">
                  {progress}% Complete
                </p>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={cn(isSidebarOpen ? "p-4" : "p-1.5")}>
          <Button
            disabled={progress < 100}
            onClick={handleDownload}
            className="flex items-center gap-2 w-full"
          >
            <Download className="h-5 w-5" />
            {open && <span>Download SQL</span>}
          </Button>
        </SidebarGroup>

        {open && (
          <SidebarGroup className="p-4 flex-grow relative">
            <SidebarGroupLabel>Uploaded Files</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1 overflow-y-auto absolute inset-3 top-12">
                {parseResults.map((file, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm truncate p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
                          {file.filename}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{file.filename}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {parseResults.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No files uploaded
                  </p>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
