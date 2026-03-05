import { Dataset } from "@shared/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, Music, Zap } from "lucide-react";

interface DatasetListProps {
  datasets: Dataset[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const dataTypeIcons = {
  text: <FileText className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  mixed: <Zap className="w-5 h-5" />,
};

export default function DatasetList({ datasets, selectedId, onSelect }: DatasetListProps) {
  return (
    <div className="grid gap-4">
      {datasets.map((dataset) => (
        <Card
          key={dataset.id}
          className={`cursor-pointer transition-all ${
            selectedId === dataset.id
              ? "border-cyan-500 bg-cyan-50 shadow-lg"
              : "hover:border-slate-300 hover:shadow-md"
          }`}
          onClick={() => onSelect(dataset.id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-cyan-600">
                  {dataTypeIcons[dataset.dataType as keyof typeof dataTypeIcons]}
                </div>
                <div>
                  <CardTitle className="text-lg">{dataset.name}</CardTitle>
                  <CardDescription>{dataset.description}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {dataset.dataType}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Items:</span>
                <span className="ml-2 font-mono font-semibold">{dataset.itemCount}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <span className="ml-2 capitalize font-mono text-cyan-600">{dataset.status}</span>
              </div>
              <div>
                <span className="text-slate-500">Created:</span>
                <span className="ml-2 font-mono text-slate-600">
                  {new Date(dataset.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
