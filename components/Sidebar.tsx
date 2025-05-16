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
import { useStore } from "@/Providers/store";
import {
  ClipboardCopy,
  Copy,
  Download,
  FileCode,
  Home,
  Menu,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const { open, isMobile } = useSidebar();
  const {
    parseResults,
    generateSQL,
    resetStore,
    resetSqlPatterns,
    setUploadDialogOpen,
    totalLines,
    parsedLines,
    unparsedSQL,
  } = useStore();
  const isExpanded = isMobile || open;

  // Calculate progress percentage
  const progress =
    totalLines > 0 ? Math.round((parsedLines / totalLines) * 100) : 0;

  const handleDownloadParsedSQL = () => {
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

  const handleCopyParsedSQL = () => {
    const generatedSQL = generateSQL();
    navigator.clipboard
      .writeText(generatedSQL)
      .catch((err) => console.error("Failed to copy parsed SQL:", err));
  };

  const handleDownloadUnparsedSQL = () => {
    // Create a download for unparsed SQL
    const blob = new Blob([unparsedSQL], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unparsed.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyUnparsedSQL = () => {
    navigator.clipboard
      .writeText(unparsedSQL)
      .catch((err) => console.error("Failed to copy unparsed SQL:", err));
  };

  const handleReset = () => {
    resetStore();
    setUploadDialogOpen(true);
  };

  const handleResetPatterns = () => {
    resetSqlPatterns();
  };

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarContent className="h-full bg-gray-100 dark:bg-gray-900 border-r dark:border-gray-800 overflow-x-hidden gap-0">
        <SidebarHeader className="p-4">
          <div
            className={cn(
              "flex items-center",
              isExpanded ? "justify-between" : "justify-center"
            )}
          >
            {isExpanded && <h2 className="font-bold text-lg">SQL Squasher</h2>}
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
                <Link
                  href="/"
                  className="w-full"
                >
                  <SidebarMenuButton
                    tooltip="Home"
                    className="cursor-pointer w-full"
                  >
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Link
                  href="/regex"
                  className="w-full"
                >
                  <SidebarMenuButton
                    tooltip="Regex"
                    className="cursor-pointer w-full"
                  >
                    <FileCode className="h-5 w-5" />
                    <span>Regex</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

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
          <SidebarGroupContent className={cn(!isExpanded && "h-32")}>
            <div className={cn(isExpanded ? "" : " rotate-90")}>
              <Progress
                value={progress}
                className={cn("h-2", isExpanded ? "w-full" : "w-32")}
              />
              {isExpanded && (
                <p className="text-xs text-gray-500 mt-1">
                  {progress}% Complete ({parsedLines}/{totalLines} lines)
                </p>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={cn(isExpanded ? "p-4" : "p-1.5")}>
          <SidebarGroupLabel>SQL Downloads</SidebarGroupLabel>

          <div className="flex flex-row gap-2 mb-2">
            {isExpanded && (
              <Button
                disabled={progress < 100}
                onClick={handleDownloadParsedSQL}
                className="flex items-center gap-2 flex-grow cursor-pointer"
              >
                <Download className="h-5 w-5" />
                <span>Parsed SQL</span>
              </Button>
            )}
            <Button
              disabled={progress < 100}
              onClick={handleCopyParsedSQL}
              variant="outline"
              size="icon"
              className="flex-shrink-0 cursor-pointer"
            >
              <ClipboardCopy className="h-5 w-5" />
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>

          <div className="flex flex-row gap-2">
            {isExpanded && (
              <Button
                disabled={!unparsedSQL}
                onClick={handleDownloadUnparsedSQL}
                className="flex items-center gap-2 flex-grow cursor-pointer hover:bg-gray-200"
                variant="secondary"
              >
                <Download className="h-5 w-5" />
                <span>Unparsed SQL</span>
              </Button>
            )}
            <Button
              disabled={!unparsedSQL}
              onClick={handleCopyUnparsedSQL}
              variant="outline"
              size="icon"
              className="flex-shrink-0 cursor-pointer hover:bg-gray-200"
            >
              <Copy className="h-5 w-5" />
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>
        </SidebarGroup>

        {isExpanded && (
          <SidebarGroup className="p-4 flex-grow relative">
            <SidebarGroupLabel>Uploaded Files</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1 overflow-y-auto absolute inset-3 top-12">
                {parseResults.map((file, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm truncate p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
                          {file.filename} ({file.stats.parsed}/
                          {file.stats.total} lines)
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {file.filename} - {file.stats.parsed} of{" "}
                          {file.stats.total} lines parsed
                        </p>
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
    </ShadcnSidebar>
  );
}
