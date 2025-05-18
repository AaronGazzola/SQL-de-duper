// components/FileDropZone.tsx
"use client";
import { useStore } from "@/store/store";
import { File } from "@/types/app.types";
import { FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function FileDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { onFilesDrop } = useStore();

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files || []) as File[];
      if (files.length > 0) {
        // Filter for SQL files
        const sqlFiles = files.filter(
          (file) =>
            file.name.toLowerCase().endsWith(".sql") ||
            file.type === "application/sql"
        );
        if (sqlFiles.length > 0) {
          onFilesDrop(sqlFiles);
        }
      }
    },
    [onFilesDrop]
  );

  useEffect(() => {
    // Add global event listeners for the entire window
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      // Clean up
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return (
    <>
      {/* Full screen overlay when dragging */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-xl shadow-2xl border-2 border-dashed border-blue-500 max-w-lg w-full text-center">
            <FileText className="h-16 w-16 text-blue-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Drop SQL Files
            </h3>
            <p className="text-gray-500">
              Release to upload your SQL migration files
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default FileDropZone;
