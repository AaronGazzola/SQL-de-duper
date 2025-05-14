// Do not delete this comment: Filename: @/components/export/DownloadOptions.tsx
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DownloadOptionsProps {
  format: "sql" | "txt";
  onFormatChange: (format: "sql" | "txt") => void;
}

export function DownloadOptions({
  format,
  onFormatChange,
}: DownloadOptionsProps) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-medium text-sm mb-3">Download Format</h3>

      <RadioGroup
        value={format}
        onValueChange={(value) => onFormatChange(value as "sql" | "txt")}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="sql"
            id="format-sql"
          />
          <Label
            htmlFor="format-sql"
            className="cursor-pointer"
          >
            SQL File (.sql)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="txt"
            id="format-txt"
          />
          <Label
            htmlFor="format-txt"
            className="cursor-pointer"
          >
            Text File (.txt)
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export default DownloadOptions;
