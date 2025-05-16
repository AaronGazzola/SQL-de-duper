// components/FileUpload.tsx
"use client";
import FileDropZone from "@/components/FileDropZone";
import FileList from "@/components/FileList";
import useSQLParser from "@/hooks/useSQLParser";
import { File as AppFile } from "@/types/app.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function FileUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<AppFile[]>([]);
  const { isProcessing, parseFiles } = useSQLParser();

  const handleFilesDrop = useCallback(
    async (newFiles: AppFile[]) => {
      // Add only new files, avoiding duplicates
      const updatedFiles = [...files];
      newFiles.forEach((newFile) => {
        const fileExists = updatedFiles.some(
          (file) =>
            file.name === newFile.name &&
            file.size === newFile.size &&
            file.lastModified === newFile.lastModified
        );
        if (!fileExists) {
          updatedFiles.push(newFile);
        }
      });
      setFiles(updatedFiles);
      // Automatically parse the files as soon as they're dropped
      if (updatedFiles.length > 0 && !isProcessing) {
        try {
          await parseFiles(updatedFiles);
          // Force a refresh
          router.refresh();
          // Clear the file list
          setFiles([]);
          toast.success(`Successfully uploaded ${updatedFiles.length} file(s)`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Could not parse files";
          toast.error(errorMessage);
        }
      }
    },
    [files, isProcessing, parseFiles, router]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <h1 className="text-2xl font-bold text-center">Upload SQL Files</h1>
      <p className="text-center text-gray-500">
        Upload SQL migration files to parse and organize SQL statements
      </p>
      <FileDropZone onFilesDrop={handleFilesDrop} />
      {files.length > 0 && (
        <>
          <FileList
            files={files}
            onRemove={handleRemoveFile}
          />
          {isProcessing && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Parsing...</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FileUpload;
