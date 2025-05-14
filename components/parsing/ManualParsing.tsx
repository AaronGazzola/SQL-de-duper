// Do not delete this comment: Filename: @/components/parsing/ManualParsing.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ParsedFile, Selection, UnparsedSection } from "@/types/app.types";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FloatingToolbar } from "./FloatingToolbar";
import { SQLEditor } from "./SQLEditor";
import { UnparsedNavigation } from "./UnparsedNavigation";

export function ManualParsing() {
  const router = useRouter();
  const [parseResults, setParseResults] = useState<ParsedFile[]>([]);
  const [unparsedSections, setUnparsedSections] = useState<UnparsedSection[]>(
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const storedResults = localStorage.getItem("parseResults");
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults) as ParsedFile[];
        setParseResults(results);

        // Extract all unparsed sections from all files
        const allUnparsedSections = results
          .flatMap((file) => file.unparsedSections)
          .filter((section) => !section.parsed);

        setUnparsedSections(allUnparsedSections);
      } catch (error) {
        console.error("Failed to parse stored results:", error);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleSelectionChange = useCallback(
    (newSelection: Selection, rect: DOMRect) => {
      setSelection(newSelection);

      // Position the toolbar above the selection
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + rect.width / 2 - 100,
      });
    },
    []
  );

  const handleParse = useCallback(
    (type: string, name: string) => {
      if (!selection) return;

      // Update the unparsed sections
      setUnparsedSections((prev) => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...updated[currentIndex],
          parsed: true,
        };
        return updated;
      });

      // Here you would normally update the ParseResults with the new parsed statement
      // For demo purposes, we're just marking the section as parsed

      // Clear selection
      setSelection(null);

      // Move to the next unparsed section if available
      if (currentIndex < unparsedSections.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [selection, currentIndex, unparsedSections.length]
  );

  const handleGenerateRegex = useCallback(() => {
    if (!selection) return;

    // Generate regex from selection and store for future use
    const regex = `\\b${selection.text.replace(
      /[-\/\\^$*+?.()|[\]{}]/g,
      "\\$&"
    )}\\b`;

    // Store in localStorage
    const storedPatterns = localStorage.getItem("sqlPatterns") || "{}";
    try {
      const patterns = JSON.parse(storedPatterns);
      patterns[`custom_${Date.now()}`] = regex;
      localStorage.setItem("sqlPatterns", JSON.stringify(patterns));

      // Show a success message (in a real app you'd use a toast)
      alert("Regex pattern saved for future use");
    } catch (error) {
      console.error("Failed to store regex pattern:", error);
    }
  }, [selection]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setSelection(null);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(unparsedSections.length - 1, prev + 1));
    setSelection(null);
  };

  const handleContinueToStatements = () => {
    router.push("/statements");
  };

  const allParsed = unparsedSections.every((section) => section.parsed);

  if (unparsedSections.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No unparsed statements</AlertTitle>
          <AlertDescription>
            All statements have been successfully parsed. You can continue to
            the statement list.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center mt-8">
          <Button onClick={handleContinueToStatements}>
            Continue to Statements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Manual Parsing</h1>

      <div className="flex flex-col gap-4 mb-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Manual parsing required</AlertTitle>
          <AlertDescription>
            Select SQL statements, provide type and name, then click "Parse
            Selection".
          </AlertDescription>
        </Alert>

        <div className="relative border rounded-lg bg-gray-50 p-2">
          <div className="editor-container min-h-[400px] relative">
            {unparsedSections.length > 0 &&
              currentIndex < unparsedSections.length && (
                <SQLEditor
                  content={unparsedSections[currentIndex].content}
                  onSelectionChange={handleSelectionChange}
                />
              )}

            {selection && (
              <FloatingToolbar
                selection={selection}
                position={toolbarPosition}
                onParse={handleParse}
                onGenerateRegex={handleGenerateRegex}
              />
            )}
          </div>
        </div>

        <UnparsedNavigation
          current={currentIndex + 1}
          total={unparsedSections.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleContinueToStatements}
          disabled={!allParsed}
        >
          <span>Continue to Statements</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ManualParsing;
