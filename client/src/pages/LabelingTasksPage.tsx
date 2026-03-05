import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import CreateLabelingTaskDialog from "@/components/CreateLabelingTaskDialog";
import LabelingTaskList from "@/components/LabelingTaskList";

export default function LabelingTasksPage() {
  const { isAuthenticated } = useAuth();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const { data: datasets } = trpc.dataset.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>Sign in to manage labeling tasks</CardDescription>
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

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-baseline gap-4 mb-4">
            <h1 className="text-5xl font-black text-black tracking-tight">LABELING TASKS</h1>
            <span className="text-sm font-mono text-cyan-600">AUTOMATION</span>
          </div>
          <p className="text-lg text-slate-600 font-light">
            Create and manage AI labeling tasks for your datasets
          </p>
          <div className="mt-4 flex gap-2">
            <div className="w-12 h-1 bg-cyan-500"></div>
            <div className="w-8 h-1 bg-pink-400"></div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowCreateTask(true)}
            className="gap-2 bg-black hover:bg-slate-800 text-white"
          >
            <Plus className="w-4 h-4" />
            Create New Task
          </Button>
        </div>

        {/* Task Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Failed
            </TabsTrigger>
          </TabsList>

          {/* Active Tasks */}
          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-slate-500">
                  Active tasks will appear here. Create a new task to get started.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Tasks */}
          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-slate-500">
                  Completed tasks will appear here with their results.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failed Tasks */}
          <TabsContent value="failed" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-slate-500">
                  Failed tasks will appear here with error details.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-12 border-cyan-200 bg-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg">How Labeling Tasks Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              <strong>1. Create Task:</strong> Select a dataset and label taxonomy to define your labeling job.
            </p>
            <p>
              <strong>2. Run AI Labeling:</strong> The system automatically processes all items in your dataset using the selected AI models.
            </p>
            <p>
              <strong>3. Review Results:</strong> View AI predictions with confidence scores and manually edit labels as needed.
            </p>
            <p>
              <strong>4. Export:</strong> Download labeled data in JSON or CSV format for model training.
            </p>
            <p className="pt-2 text-cyan-700">
              Tasks run asynchronously in the background. You'll be notified when labeling is complete.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Task Dialog */}
      <CreateLabelingTaskDialog open={showCreateTask} onOpenChange={setShowCreateTask} />
    </div>
  );
}
