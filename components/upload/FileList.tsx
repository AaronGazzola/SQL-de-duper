// Do not delete this comment: Filename: @/components/upload/FileList.tsx
import { Button } from "@/components/ui/button";
import { File as AppFile } from "@/types/app.types";
import { ChevronDown, ChevronUp, File as FileIcon, X } from "lucide-react";
import { useState } from "react";

interface FileListProps {
  files: AppFile[];
  onRemove: (index: number) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  const [expandedFile, setExpandedFile] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    if (expandedFile === index) {
      setExpandedFile(null);
    } else {
      setExpandedFile(index);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: number): string => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <h3 className="font-medium text-sm p-3 bg-gray-50 border-b">
        Uploaded Files ({files.length})
      </h3>

      <ul className="divide-y">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${index}`}
            className="bg-white"
          >
            <div className="flex items-center p-3">
              <FileIcon className="text-blue-500 w-5 h-5 mr-3 flex-shrink-0" />

              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <div className="flex items-center ml-2 space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleExpand(index)}
                >
                  {expandedFile === index ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle details</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            </div>

            {expandedFile === index && (
              <div className="px-3 pb-3 text-xs text-gray-500 bg-gray-50">
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {file.type || "text/plain"}
                </p>
                <p>
                  <span className="font-medium">Last Modified:</span>{" "}
                  {formatDate(file.lastModified)}
                </p>
                <p>
                  <span className="font-medium">Size:</span>{" "}
                  {formatFileSize(file.size)}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileList;
