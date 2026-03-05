import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TaskResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
}

export default function TaskResultsDialog({ open, onOpenChange, taskId }: TaskResultsDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: results, isLoading } = trpc.labeling.getTaskResults.useQuery(
    { taskId },
    { enabled: open && taskId > 0 }
  );

  const handleCopyLabel = (label: string, id: string) => {
    navigator.clipboard.writeText(label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const extractLabel = (label: any): string => {
    if (label === null || label === undefined) return "";
    if (typeof label === "string") return label;
    if (typeof label === "boolean") return String(label);
    if (typeof label === "number") return String(label);
    if (typeof label === "object") {
      // Check for classification.category (from AI labeling result)
      if (label.classification && typeof label.classification === "object" && label.classification.category) {
        return label.classification.category;
      }
      // Check for direct category field
      if (label.category) return label.category;
      // Check for label field (from image classification)
      if (label.label) return label.label;
      // Fallback to sentiment
      if (label.sentiment) return label.sentiment;
      // Fallback: return first non-object value
      for (const [key, value] of Object.entries(label)) {
        if (typeof value === "string") return value;
      }
      return JSON.stringify(label);
    }
    return String(label);
  };

  const handleExportJSON = () => {
    if (!results) return;
    const json = JSON.stringify(
      results.results.map((r: any) => ({
        itemId: r.itemId,
        content: r.content || r.fileUrl || "",
        label: extractLabel(r.manualLabel || r.predictedLabel),
        manualLabel: r.manualLabel || null,
      })),
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-${taskId}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported as JSON");
  };

  const handleExportCSV = () => {
    if (!results) return;
    const headers = ["Item ID", "Content", "Label"];
    const rows = results.results.map((r: any) => [
      r.itemId,
      r.content || r.fileUrl || "",
      extractLabel(r.manualLabel || r.predictedLabel),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-${taskId}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported as CSV");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Results</DialogTitle>
          <DialogDescription>
            {results && `${results.results.length} items labeled`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-slate-500">Loading results...</p>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{results.task.name}</CardTitle>
                <CardDescription>{results.task.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Items</p>
                    <p className="text-2xl font-bold">{results.results.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Labeled</p>
                    <p className="text-2xl font-bold">
                      {results.results.filter((r: any) => r.predictedLabel || r.manualLabel).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleExportJSON} className="gap-2 bg-black hover:bg-slate-800 text-white">
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            {/* Results Table */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">Labeled Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Item</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Content</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Label</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((result: any, index: number) => {
                      const label = extractLabel(result.manualLabel || result.predictedLabel);
                      return (
                        <tr key={result.itemId} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-2 text-slate-600">#{index + 1}</td>
                          <td className="px-4 py-2 text-slate-700 truncate max-w-xs">
                            {result.content || result.fileUrl || "—"}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className="font-mono">
                              {label || "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {label && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyLabel(label, `label-${result.itemId}`)}
                              >
                                {copiedId === `label-${result.itemId}` ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-slate-500">No results found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
