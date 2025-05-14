// Do not delete this comment: Filename: @/components/upload/ParseButton.tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ParseButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing?: boolean;
}

export function ParseButton({
  onClick,
  disabled,
  isProcessing = false,
}: ParseButtonProps) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={disabled}
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
  );
}

export default ParseButton;
