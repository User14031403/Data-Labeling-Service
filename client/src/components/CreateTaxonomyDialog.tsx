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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

interface CreateTaxonomyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTaxonomyDialog({ open, onOpenChange }: CreateTaxonomyDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState<"text" | "image" | "audio">("text");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const createMutation = trpc.taxonomy.create.useMutation({
    onSuccess: () => {
      toast.success("Taxonomy created successfully");
      utils.taxonomy.getByDataType.invalidate();
      setName("");
      setDescription("");
      setDataType("text");
      setLabels([]);
      setLabelInput("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create taxonomy");
    },
  });

  const handleAddLabel = () => {
    if (!labelInput.trim()) {
      toast.error("Label cannot be empty");
      return;
    }
    if (labels.includes(labelInput.trim())) {
      toast.error("Label already exists");
      return;
    }
    setLabels([...labels, labelInput.trim()]);
    setLabelInput("");
  };

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Taxonomy name is required");
      return;
    }
    if (labels.length === 0) {
      toast.error("Add at least one label");
      return;
    }
    createMutation.mutate({ name, description, dataType, labels });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLabel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Label Taxonomy</DialogTitle>
          <DialogDescription>
            Define a set of labels for your AI labeling tasks
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Taxonomy Name</Label>
            <Input
              id="name"
              placeholder="e.g., Sentiment Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this taxonomy is used for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="dataType">Data Type</Label>
            <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
              <SelectTrigger id="dataType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="labelInput">Add Labels</Label>
            <div className="flex gap-2">
              <Input
                id="labelInput"
                placeholder="Enter a label and press Enter or click Add"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={createMutation.isPending}
              />
              <Button
                type="button"
                onClick={handleAddLabel}
                disabled={createMutation.isPending || !labelInput.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {labels.length > 0 && (
            <div>
              <Label>Labels ({labels.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {labels.map((label, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-cyan-100 text-cyan-900 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(index)}
                      className="hover:text-cyan-700"
                      disabled={createMutation.isPending}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black hover:bg-slate-800"
              disabled={createMutation.isPending || labels.length === 0}
            >
              {createMutation.isPending ? "Creating..." : "Create Taxonomy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
