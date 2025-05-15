// app/page.tsx
"use client";
import { EditorDialog } from "@/components/EditorDialog";
import { FileUpload } from "@/components/FileUpload";
import { StatementAccordion } from "@/components/StatementAccordion";
import { useStore } from "@/Providers/store";

import { useEffect } from "react";

export default function HomePage() {
  const { parseResults } = useStore();

  useEffect(() => {
    // Check if any files have been uploaded previously
    const storedResults = localStorage.getItem("parseResults");
    if (storedResults) {
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
      <EditorDialog />

      {parseResults.length > 0 ? <StatementAccordion /> : <FileUpload />}
    </div>
  );
}
