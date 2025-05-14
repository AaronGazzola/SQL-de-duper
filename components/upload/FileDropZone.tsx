// Do not delete this comment: Filename: @/components/upload/FileDropZone.tsx
import { cn } from "@/lib/utils";
import { File as AppFile } from "@/types/app.types";
import { File as FileIcon, Upload } from "lucide-react";
import { useCallback, useState } from "react";

interface FileDropZoneProps {
  onFilesDrop: (files: AppFile[]) => void;
}

export function FileDropZone({ onFilesDrop }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const sqlFiles = files.filter(
        (file) =>
          file.name.endsWith(".sql") ||
          file.type === "application/sql" ||
          file.type === "text/plain"
      );

      if (sqlFiles.length > 0) {
        onFilesDrop(sqlFiles as AppFile[]);
      }
    },
    [onFilesDrop]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        onFilesDrop(files as AppFile[]);
        e.target.value = ""; // Reset input
      }
    },
    [onFilesDrop]
  );

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center transition-colors",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-gray-300 hover:border-primary/50 bg-gray-50 hover:bg-gray-100",
        "cursor-pointer h-64"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept=".sql,text/plain"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Upload
        className={cn(
          "w-12 h-12 mb-3",
          isDragging ? "text-primary" : "text-gray-400"
        )}
      />

      <h3 className="text-lg font-medium mb-1">Drag and drop SQL files</h3>
      <p className="text-sm text-gray-500 mb-3">or click to browse</p>

      <div className="flex items-center text-xs text-gray-400">
        <FileIcon className="w-4 h-4 mr-1" />
        <span>Supports SQL and text files</span>
      </div>
    </div>
  );
}

export default FileDropZone;
