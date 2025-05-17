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
import { useStore } from "@/providers/store";
import { Menu, RefreshCw } from "lucide-react";

export default function Sidebar() {
  const { open, isMobile } = useSidebar();
  const { parseResults, resetStore, totalLines, parsedLines } = useStore();

  const isExpanded = isMobile || open;

  // Calculate progress percentage
  const progress =
    totalLines > 0 ? Math.round((parsedLines / totalLines) * 100) : 0;

  const handleReset = () => {
    resetStore();
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
