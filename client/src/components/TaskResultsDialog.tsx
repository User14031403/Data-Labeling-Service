import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleExportJSON = () => {
    if (!results) return;
    const json = JSON.stringify(results.results, null, 2);
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
    const headers = ["Item ID", "Content", "Predicted Label", "Confidence", "Manual Label", "Source"];
    const rows = results.results.map((r: any) => [
      r.itemId,
      r.content || r.fileUrl || "",
      typeof r.predictedLabel === "object" ? r.predictedLabel.label || JSON.stringify(r.predictedLabel) : r.predictedLabel,
      r.confidence || "",
      r.manualLabel || "",
      r.source || "",
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Items</p>
                    <p className="text-2xl font-bold">{results.results.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">AI Labeled</p>
                    <p className="text-2xl font-bold">
                      {results.results.filter((r: any) => r.source === "ai").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Manually Reviewed</p>
                    <p className="text-2xl font-bold">
                      {results.results.filter((r: any) => r.manualLabel).length}
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
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Labeled Items</h3>
              {results.results.map((result: any, index: number) => (
                <Card key={result.itemId} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-600">Item {index + 1}</p>
                        <p className="font-mono text-sm text-slate-700 break-words">
                          {result.content || result.fileUrl || `Item #${result.itemId}`}
                        </p>
                      </div>
                      <Badge variant="outline">{result.source === "ai" ? "AI" : "Manual"}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Predicted Label */}
                      <div>
                        <p className="text-xs text-slate-600 font-semibold mb-1">PREDICTED LABEL</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-mono bg-slate-50 p-2 rounded border border-slate-200">
                              {typeof result.predictedLabel === "object"
                                ? result.predictedLabel.label || JSON.stringify(result.predictedLabel)
                                : result.predictedLabel || "—"}
                            </p>
                          </div>
                          {result.predictedLabel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleCopyLabel(
                                  typeof result.predictedLabel === "object"
                                    ? result.predictedLabel.label || JSON.stringify(result.predictedLabel)
                                    : result.predictedLabel,
                                  `pred-${result.itemId}`
                                )
                              }
                            >
                              {copiedId === `pred-${result.itemId}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {result.confidence && (
                          <p className="text-xs text-slate-500 mt-1">
                            Confidence: {Math.round(result.confidence * 100)}%
                          </p>
                        )}
                      </div>

                      {/* Manual Label */}
                      <div>
                        <p className="text-xs text-slate-600 font-semibold mb-1">MANUAL LABEL</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-mono bg-slate-50 p-2 rounded border border-slate-200">
                              {result.manualLabel || "—"}
                            </p>
                          </div>
                          {result.manualLabel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyLabel(result.manualLabel, `manual-${result.itemId}`)}
                            >
                              {copiedId === `manual-${result.itemId}` ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {result.reviewedAt && (
                          <p className="text-xs text-slate-500 mt-1">
                            Reviewed {new Date(result.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
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
