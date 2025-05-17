// components/EditorToolbar.tsx
"use client";
import {
  sqlStatementTypes,
  useStatement,
} from "@/components/StatementProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

const EditorToolbar: React.FC = () => {
  const {
    hasSelection,

    statementType,
    handleTypeChange,
    selectedStatementName,
  } = useStatement();

  return (
    <div className="border-b px-4 py-3 flex items-center gap-4">
      <div className="flex flex-col gap-1 w-48">
        <Label
          htmlFor="statement-type"
          className={!hasSelection ? "text-gray-400" : ""}
        >
          Statement Type
        </Label>
        <Select
          value={statementType}
          onValueChange={handleTypeChange}
          disabled={!hasSelection}
        >
          <SelectTrigger
            id="statement-type"
            className={!hasSelection ? "bg-gray-100" : ""}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {sqlStatementTypes.map((type) => (
              <SelectItem
                key={type}
                value={type}
              >
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <Label
          htmlFor="statement-name"
          className={!hasSelection ? "text-gray-400" : ""}
        >
          Statement Name
        </Label>
        <Input
          id="statement-name"
          value={selectedStatementName || ""}
          readOnly
          disabled
          className={!hasSelection ? "bg-gray-100" : ""}
          placeholder={
            hasSelection
              ? "No name detected"
              : "Select text to identify statement"
          }
        />
      </div>
    </div>
  );
};

export default EditorToolbar;
