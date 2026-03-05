import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface UploadItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetId: number;
}

export default function UploadItemsDialog({
  open,
  onOpenChange,
  datasetId,
}: UploadItemsDialogProps) {
  const [textContent, setTextContent] = useState("");
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text");

  const utils = trpc.useUtils();
  const uploadMutation = trpc.dataset.uploadItems.useMutation({
    onSuccess: () => {
      toast.success("Items uploaded successfully");
      utils.dataset.getItems.invalidate({ datasetId });
      setTextContent("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload items");
    },
  });

  const handleTextUpload = () => {
    if (!textContent.trim()) {
      toast.error("Please enter some text");
      return;
    }

    // Split by newlines and create items
    const items = textContent
      .split("\n")
      .filter((line) => line.trim())
      .map((content) => ({ content: content.trim() }));

    uploadMutation.mutate({ datasetId, items });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    // For now, just show a placeholder
    toast.info("File upload coming soon. Use text mode to add items.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Dataset Items</DialogTitle>
          <DialogDescription>
            Add text items to your dataset (one per line)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="textContent">Text Items</Label>
            <Textarea
              id="textContent"
              placeholder="Enter one item per line..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              disabled={uploadMutation.isPending}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Each line will be treated as a separate item
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTextUpload}
              className="gap-2 bg-black hover:bg-slate-800"
              disabled={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4" />
              {uploadMutation.isPending ? "Uploading..." : "Upload Items"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
