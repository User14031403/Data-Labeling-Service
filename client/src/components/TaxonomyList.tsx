import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";

interface Taxonomy {
  id: number;
  name: string;
  description: string | null;
  labels: string;
  dataType: "text" | "image" | "audio";
  createdAt: Date;
}

interface TaxonomyListProps {
  taxonomies: Taxonomy[];
  dataType: "text" | "image" | "audio";
}

export default function TaxonomyList({ taxonomies, dataType }: TaxonomyListProps) {
  return (
    <div className="grid gap-4">
      {taxonomies.map((taxonomy) => {
        let labels: string[] = [];
        try {
          labels = JSON.parse(taxonomy.labels);
        } catch {
          labels = [];
        }

        return (
          <Card key={taxonomy.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-cyan-600">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{taxonomy.name}</CardTitle>
                    <CardDescription>{taxonomy.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {dataType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 mb-2">Labels ({labels.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label, idx) => (
                      <Badge key={idx} variant="secondary" className="font-mono text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Created {new Date(taxonomy.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
