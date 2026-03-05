import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface LabelingTask {
  id: number;
  name: string;
  description: string | null;
  status: "pending" | "running" | "completed" | "failed" | "processing";
  processedItems?: number;
  progress?: number;
  totalItems?: number;
  createdAt: Date;
  completedAt?: Date | null;
  updatedAt?: Date;
  datasetId?: number;
  taxonomyId?: number;
  createdBy?: number;
}

interface LabelingTaskListProps {
  tasks: LabelingTask[];
  status: "active" | "completed" | "failed";
}

export default function LabelingTaskList({ tasks, status }: LabelingTaskListProps) {
  const getStatusIcon = (taskStatus: string) => {
    switch (taskStatus) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (taskStatus: string) => {
    switch (taskStatus) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "running":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-500">
            No {status} tasks yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className={`${getStatusColor(task.status)} border`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {task.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-mono text-slate-700">
                    {task.processedItems || 0} / {task.totalItems || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        (task.totalItems || 0) > 0
                          ? ((task.processedItems || 0) / (task.totalItems || 0)) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                {task.completedAt && (
                  <span>Completed {new Date(task.completedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
