"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDisplayName } from "@/lib/utils";
import { useStore } from "@/store/store";
import { Statement, UnparsedSection } from "@/types/app.types";
import { Edit } from "lucide-react";
import { useMemo } from "react";

export function StatementItem({
  item,
  index,
}: {
  item: Statement | UnparsedSection;
  index: number;
}) {
  const { setEditorDialogOpen, setRawEditorSQL } = useStore();

  // Determine if this is a parsed statement or unparsed section
  const isParsed = !("parsed" in item);

  // Format content for display
  const displayContent = useMemo(() => {
    // Limit to first few lines
    const lines = item.content.split("\n").slice(0, 5);
    return (
      lines.join("\n") +
      (lines.length < item.content.split("\n").length ? "..." : "")
    );
  }, [item.content]);

  const handleEdit = () => {
    setRawEditorSQL((item as Statement).content);
    setEditorDialogOpen(true);
  };

  return (
    <AccordionItem
      value={`item-${index}`}
      className="border rounded-lg mb-2 overflow-hidden"
    >
      <div className="relative">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 flex-1">
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-1">
              {isParsed ? (
                <>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {getDisplayName((item as Statement).type)}
                  </Badge>
                  <span className="font-medium">
                    {(item as Statement).name}
                  </span>
                </>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  Unparsed
                </Badge>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-500 truncate max-w-[300px]">
                    {item.fileName}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.fileName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </AccordionTrigger>

        <div className="flex gap-2 absolute right-4 top-1/2 transform -translate-y-1/2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AccordionContent className="p-4 border-t bg-gray-50">
        <pre className="text-sm overflow-x-auto p-2 bg-white border rounded-md">
          {displayContent}
        </pre>
      </AccordionContent>
    </AccordionItem>
  );
}
