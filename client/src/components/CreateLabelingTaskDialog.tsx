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
import { Loader2 } from "lucide-react";

interface CreateLabelingTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateLabelingTaskDialog({
  open,
  onOpenChange,
}: CreateLabelingTaskDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [datasetId, setDatasetId] = useState<string>("");
  const [dataType, setDataType] = useState<"text" | "image" | "audio">("text");
  const [taxonomyId, setTaxonomyId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);

  const { data: datasets } = trpc.dataset.list.useQuery();
  const { data: taxonomies } = trpc.taxonomy.getByDataType.useQuery(
    { dataType },
    { enabled: open }
  );

  const utils = trpc.useUtils();
  const createMutation = trpc.labeling.createTask.useMutation({
    onSuccess: (result) => {
      toast.success("Labeling task created successfully");
      utils.labeling.getTask.invalidate();
      setName("");
      setDescription("");
      setDatasetId("");
      setTaxonomyId("");
      onOpenChange(false);

      // Auto-run the task
      if (result.taskId) {
        handleRunLabeling(result.taskId);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  const runMutation = trpc.labeling.runLabeling.useMutation({
    onSuccess: (result) => {
      toast.success(`Labeling complete! Processed ${result.processedCount} items`);
      utils.labeling.getTask.invalidate();
      setIsRunning(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to run labeling");
      setIsRunning(false);
    },
  });

  const handleRunLabeling = (taskId: number) => {
    setIsRunning(true);
    runMutation.mutate({ taskId });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Task name is required");
      return;
    }
    if (!datasetId) {
      toast.error("Please select a dataset");
      return;
    }
    if (!taxonomyId) {
      toast.error("Please select a taxonomy");
      return;
    }

    createMutation.mutate({
      datasetId: parseInt(datasetId),
      taxonomyId: parseInt(taxonomyId),
      name,
      description,
    });
  };

  const selectedDataset = datasets?.find((d) => d.id === parseInt(datasetId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Labeling Task</DialogTitle>
          <DialogDescription>
            Set up an AI labeling task for your dataset
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              placeholder="e.g., Customer Sentiment Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending || isRunning}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending || isRunning}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="dataset">Select Dataset</Label>
            <Select value={datasetId} onValueChange={(value) => {
              setDatasetId(value);
              const dataset = datasets?.find((d) => d.id === parseInt(value));
              if (dataset) {
                setDataType(dataset.dataType as any);
              }
            }}>
              <SelectTrigger id="dataset">
                <SelectValue placeholder="Choose a dataset..." />
              </SelectTrigger>
              <SelectContent>
                {datasets?.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id.toString()}>
                    {dataset.name} ({dataset.dataType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDataset && (
              <p className="text-xs text-slate-500 mt-1">
                Items: {selectedDataset.itemCount} | Type: {selectedDataset.dataType}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="taxonomy">Select Label Taxonomy</Label>
            <Select value={taxonomyId} onValueChange={setTaxonomyId}>
              <SelectTrigger id="taxonomy">
                <SelectValue placeholder="Choose a taxonomy..." />
              </SelectTrigger>
              <SelectContent>
                {taxonomies?.map((taxonomy) => (
                  <SelectItem key={taxonomy.id} value={taxonomy.id.toString()}>
                    {taxonomy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!taxonomies || taxonomies.length === 0 && datasetId && (
              <p className="text-xs text-amber-600 mt-1">
                No taxonomies available for {dataType}. Create one first.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending || isRunning}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-black hover:bg-slate-800"
              disabled={createMutation.isPending || isRunning}
            >
              {createMutation.isPending || isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Create & Run Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
