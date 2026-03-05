import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Settings, Tag } from "lucide-react";
import DatasetList from "@/components/DatasetList";
import CreateDatasetDialog from "@/components/CreateDatasetDialog";
import UploadItemsDialog from "@/components/UploadItemsDialog";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateDataset, setShowCreateDataset] = useState(false);
  const [showUploadItems, setShowUploadItems] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);

  const { data: datasets, isLoading } = trpc.dataset.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>Sign in to access the data labeling platform</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Grid background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent),
                          linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)`,
        backgroundSize: "50px 50px"
      }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-baseline gap-4 mb-4">
            <h1 className="text-5xl font-black text-black tracking-tight">DATA LABELING</h1>
            <span className="text-sm font-mono text-cyan-600">v1.0</span>
          </div>
          <p className="text-lg text-slate-600 font-light">
            Automated annotation for text, images, and audio datasets
          </p>
          <div className="mt-4 flex gap-2">
            <div className="w-12 h-1 bg-cyan-500"></div>
            <div className="w-8 h-1 bg-pink-400"></div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="datasets" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
            <TabsTrigger value="tasks">Labeling Tasks</TabsTrigger>
            <TabsTrigger value="api">Batch API</TabsTrigger>
          </TabsList>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="space-y-6">
            <div className="flex gap-4">
              <Button
                onClick={() => setShowCreateDataset(true)}
                className="gap-2 bg-black hover:bg-slate-800 text-white"
              >
                <Plus className="w-4 h-4" />
                New Dataset
              </Button>
              <Button
                onClick={() => {
                  if (selectedDatasetId) setShowUploadItems(true);
                }}
                disabled={!selectedDatasetId}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Items
              </Button>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading datasets...</p>
                </CardContent>
              </Card>
            ) : datasets && datasets.length > 0 ? (
              <DatasetList
                datasets={datasets}
                selectedId={selectedDatasetId}
                onSelect={setSelectedDatasetId}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No datasets yet. Create one to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Taxonomy Tab */}
          <TabsContent value="taxonomy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Label Taxonomy Management
                </CardTitle>
                <CardDescription>
                  Define and manage label categories for your AI labeling tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/taxonomy")}
                  className="gap-2 bg-black hover:bg-slate-800 text-white"
                >
                  <Settings className="w-4 h-4" />
                  Go to Taxonomy Manager
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Labeling Tasks</CardTitle>
                <CardDescription>
                  Create and manage automated labeling tasks for your datasets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Task management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>Batch API</CardTitle>
                <CardDescription>
                  Submit large batches of data for automated labeling via REST API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 font-mono text-sm">
                  <p className="text-slate-600">POST /api/trpc/batch.submitBatch</p>
                </div>
                <p className="text-slate-600">API documentation and examples coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateDatasetDialog open={showCreateDataset} onOpenChange={setShowCreateDataset} />
      {selectedDatasetId && (
        <UploadItemsDialog
          open={showUploadItems}
          onOpenChange={setShowUploadItems}
          datasetId={selectedDatasetId}
        />
      )}
    </div>
  );
}
