// components/FileUploadDialog.tsx
"use client";
import { FileUpload } from "@/components/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/store/store";

export function FileUploadDialog() {
  const { isUploadDialogOpen, setUploadDialogOpen } = useStore();

  return (
    <Dialog
      open={isUploadDialogOpen}
      onOpenChange={setUploadDialogOpen}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>File upload</DialogTitle>
        </DialogHeader>
        <FileUpload onComplete={() => setUploadDialogOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
