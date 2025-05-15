// components/FileUpload.tsx
"use client";
import FileDropZone from "@/components/FileDropZone";
import FileList from "@/components/FileList";
import { Button } from "@/components/ui/button";
import { useSQLParser } from "@/hooks/useSQLParser";
import { File as AppFile } from "@/types/app.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
  onComplete?: () => void;
}

export function FileUpload({ onComplete }: FileUploadProps) {
  const router = useRouter();
  const [files, setFiles] = useState<AppFile[]>([]);
  const { isProcessing, parseFiles } = useSQLParser();

  const handleFilesDrop = useCallback((newFiles: AppFile[]) => {
    setFiles((prev) => {
      const updatedFiles = [...prev];
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
      return updatedFiles;
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleParse = async () => {
    if (files.length === 0) return;
    try {
      await parseFiles(files);

      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }

      // Force a refresh
      router.refresh();

      // Clear the file list
      setFiles([]);

      toast.success(`Successfully parsed ${files.length} file(s)`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not parse files";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <h1 className="text-2xl font-bold text-center">Upload SQL Files</h1>
      <p className="text-center text-gray-500">
        Upload SQL migration files to parse and organize SQL statements
      </p>
      <FileDropZone onFilesDrop={handleFilesDrop} />
      {files.length > 0 && (
        <FileList
          files={files}
          onRemove={handleRemoveFile}
        />
      )}
      <div className="flex justify-center mt-4">
        <Button
          size="lg"
          onClick={handleParse}
          disabled={isProcessing || !files.length}
          className="min-w-[160px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            "Parse Files"
          )}
        </Button>
      </div>
    </div>
  );
}

export default FileUpload;
