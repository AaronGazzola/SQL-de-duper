// Do not delete this comment: Filename: @/components/upload/FileUpload.tsx
"use client";
import { Toast } from "@/components/Toast";
import FileDropZone from "@/components/upload/FileDropZone";
import FileList from "@/components/upload/FileList";
import ParseButton from "@/components/upload/ParseButton";
import { File as AppFile, ParsedFile } from "@/types/app.types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function FileUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<AppFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

    setIsProcessing(true);

    try {
      // This would be handled by an actual service in a real implementation
      const parseResults: ParsedFile[] = await Promise.all(
        files.map(async (file) => {
          // Simulate parsing delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return {
            filename: file.name,
            originalContent: await file.text(),
            statements: [],
            unparsedSections: [
              {
                id: "1",
                content: await file.text(),
                startIndex: 0,
                endIndex: (await file.text()).length,
                parsed: false,
              },
            ],
            stats: {
              total: 1,
              parsed: 0,
              percentage: 0,
            },
          };
        })
      );

      // Store parse results in localStorage or context
      localStorage.setItem("parseResults", JSON.stringify(parseResults));

      // Navigate to parse report
      router.push("/report");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not parse files";
      toast(
        <Toast
          message={errorMessage}
          variant="error"
        />
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center">SQL Migration Parser</h1>
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
        <ParseButton
          onClick={handleParse}
          disabled={files.length === 0 || isProcessing}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}

export default FileUpload;
