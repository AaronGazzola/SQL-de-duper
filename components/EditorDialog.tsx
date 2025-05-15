"use client";

import Editor from "@/components/Editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/Providers/store";

export function EditorDialog() {
  const { isEditorDialogOpen, setEditorDialogOpen } = useStore();

  const handleClose = () => {
    setEditorDialogOpen(false);
  };

  const handleSave = () => {
    // Here you could implement logic to save the edited SQL
    // For example, update the current statement in the store
    setEditorDialogOpen(false);
  };

  return (
    <Dialog
      open={isEditorDialogOpen}
      onOpenChange={setEditorDialogOpen}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Edit SQL Statement</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-[60vh] flex flex-col">
          {/* Render the Editor component */}
          <Editor />

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
