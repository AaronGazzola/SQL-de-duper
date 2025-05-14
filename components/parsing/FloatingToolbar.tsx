// Do not delete this comment: Filename: @/components/parsing/FloatingToolbar.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Selection } from "@/types/app.types";
import { Check, Wand2 } from "lucide-react";
import { useState } from "react";

interface FloatingToolbarProps {
  selection: Selection;
  position: { top: number; left: number };
  onParse: (type: string, name: string) => void;
  onGenerateRegex: () => void;
}

export function FloatingToolbar({
  selection,
  position,
  onParse,
  onGenerateRegex,
}: FloatingToolbarProps) {
  const [type, setType] = useState("");
  const [name, setName] = useState("");

  const handleParseClick = () => {
    if (type && name) {
      onParse(type, name);
    }
  };

  return (
    <div
      className={cn(
        "absolute z-50 bg-white border rounded-lg shadow-lg p-3",
        "flex flex-col gap-2 w-[300px]"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center gap-2">
        <Select
          onValueChange={setType}
          value={type}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Statement type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CREATE_TABLE">CREATE TABLE</SelectItem>
            <SelectItem value="ALTER_TABLE">ALTER TABLE</SelectItem>
            <SelectItem value="CREATE_INDEX">CREATE INDEX</SelectItem>
            <SelectItem value="DROP_TABLE">DROP TABLE</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="CUSTOM">CUSTOM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        placeholder="Object name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex justify-between gap-2 mt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onGenerateRegex}
        >
          <Wand2 className="h-4 w-4 mr-1" />
          <span>Generate Regex</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={handleParseClick}
          disabled={!type || !name}
        >
          <Check className="h-4 w-4 mr-1" />
          <span>Parse</span>
        </Button>
      </div>

      {selection.text.length > 20 && (
        <div className="text-xs text-gray-500 mt-1 italic">
          Selected: {selection.text.slice(0, 20)}...
        </div>
      )}
    </div>
  );
}

export default FloatingToolbar;
