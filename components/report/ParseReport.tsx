// Do not delete this comment: Filename: @/components/report/ParseReport.tsx
import FileParseStats from "@/components/report/FileParseStats";
import ParseProgressBar from "@/components/report/ParseProgressBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ParsedFile } from "@/types/app.types";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function ParseReport() {
  const router = useRouter();
  const [parseResults, setParseResults] = useState<ParsedFile[]>([]);

  useEffect(() => {
    const storedResults = localStorage.getItem("parseResults");
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults) as ParsedFile[];
        setParseResults(results);
      } catch (error) {
        console.error("Failed to parse stored results:", error);
      }
    } else {
      // No stored results, redirect back to upload
      router.push("/");
    }
  }, [router]);

  const totalStats = useMemo(() => {
    if (parseResults.length === 0) {
      return { total: 0, parsed: 0, percentage: 0 };
    }

    const total = parseResults.reduce((sum, file) => sum + file.stats.total, 0);
    const parsed = parseResults.reduce(
      (sum, file) => sum + file.stats.parsed,
      0
    );
    const percentage = total > 0 ? Math.round((parsed / total) * 100) : 0;

    return { total, parsed, percentage };
  }, [parseResults]);

  const hasUnparsedStatements = useMemo(() => {
    return totalStats.parsed < totalStats.total;
  }, [totalStats]);

  const handleReviewUnparsed = () => {
    router.push("/manual-parsing");
  };

  const handleContinueToStatements = () => {
    router.push("/statements");
  };

  if (parseResults.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading parse results...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Parse Results</h1>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Overall Progress</h2>
          <span className="text-sm font-medium">
            {totalStats.parsed} of {totalStats.total} statements
          </span>
        </div>

        <ParseProgressBar percentage={totalStats.percentage} />
      </div>

      {hasUnparsedStatements ? (
        <Alert
          variant="default"
          className="mb-6"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Parsing Incomplete</AlertTitle>
          <AlertDescription>
            Some SQL statements could not be automatically parsed. Please review
            them manually.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert
          variant="default"
          className="border-green-200 bg-green-50 mb-6"
        >
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600">Parsing Complete</AlertTitle>
          <AlertDescription>
            All SQL statements were successfully parsed.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">File Details</h2>
        {parseResults.map((file, index) => (
          <FileParseStats
            key={`${file.filename}-${index}`}
            file={file}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        {hasUnparsedStatements && (
          <Button
            onClick={handleReviewUnparsed}
            variant="default"
          >
            Review Unparsed Statements
          </Button>
        )}

        <Button
          onClick={handleContinueToStatements}
          variant="default"
        >
          <span>Continue to Statements</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ParseReport;
