"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { Download, Home, MenuIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function Sidebar() {
  const {
    parseResults,
    isSidebarOpen,
    toggleSidebar,
    generateSQL,
    resetStore,
    setUploadDialogOpen,
  } = useStore();

  // Calculate total progress
  const progress = useMemo(() => {
    if (parseResults.length > 0) {
      const totalStats = parseResults.reduce(
        (acc, file) => {
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

  return (
    <div
      className={`h-full bg-gray-100 border-r transition-all duration-300 ${
        isSidebarOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          {isSidebarOpen && <h2 className="font-bold text-lg">SQL Parser</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>

        <div
          className={cn(!isSidebarOpen ? "flex-col" : "flex-row", "mb-6 flex")}
        >
          <Link href="/">
            <Button variant="ghost">
              <Home className="h-5 w-5" />
              {isSidebarOpen && <span>Home</span>}
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleReset}
          >
            <RefreshCw className="h-5 w-5 ml-2" />
            {isSidebarOpen && <span>Reset</span>}
          </Button>
        </div>

        <div className="mb-6">
          {isSidebarOpen && (
            <p className="text-sm text-gray-500 mb-2">Parsing Progress</p>
          )}
          <Progress
            value={progress}
            className="h-2"
          />
          {isSidebarOpen && (
            <p className="text-xs text-gray-500 mt-1">{progress}% Complete</p>
          )}
        </div>

        <Button
          disabled={progress < 100}
          onClick={handleDownload}
        >
          <Download className="h-5 w-5" />
          {isSidebarOpen && <span className="ml-2">Download SQL</span>}
        </Button>

        {isSidebarOpen && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Uploaded Files</p>
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-240px)]">
              {parseResults.map((file, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-sm truncate p-2 hover:bg-gray-200 rounded">
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
          </div>
        )}
      </div>
    </div>
  );
}
