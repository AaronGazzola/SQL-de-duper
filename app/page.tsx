// app/page.tsx
"use client";
import { EditorDialog } from "@/components/EditorDialog";
import { FileUploadDialog } from "@/components/FileUploadDialog";
import { StatementAccordion } from "@/components/StatementAccordion";
import { useStore } from "@/store/store";
import { useEffect } from "react";

export default function HomePage() {
  const { parseResults, setUploadDialogOpen } = useStore();

  useEffect(() => {
    // Check if any files have been uploaded previously
    const storedResults = localStorage.getItem("parseResults");
    if (!storedResults) {
      // If no files uploaded, show the dialog
      setUploadDialogOpen(true);
    } else {
      try {
        const parsedResults = JSON.parse(storedResults);
        useStore.getState().updateParseResults(parsedResults);
      } catch (error) {
        console.error("Failed to parse stored results:", error);
      }
    }
  }, []);

  return (
    <div className="container py-8">
      <FileUploadDialog />
      <EditorDialog />

      {parseResults.length > 0 ? (
        <StatementAccordion />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No SQL statements available.</p>
          <button
            className="text-primary underline"
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload SQL files
          </button>
        </div>
      )}
    </div>
  );
}
