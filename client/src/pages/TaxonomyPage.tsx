import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CreateTaxonomyDialog from "@/components/CreateTaxonomyDialog";
import TaxonomyList from "@/components/TaxonomyList";

export default function TaxonomyPage() {
  const { isAuthenticated } = useAuth();
  const [showCreateTaxonomy, setShowCreateTaxonomy] = useState(false);
  const [activeDataType, setActiveDataType] = useState<"text" | "image" | "audio">("text");

  const { data: textTaxonomies } = trpc.taxonomy.getByDataType.useQuery(
    { dataType: "text" },
    { enabled: isAuthenticated }
  );

  const { data: imageTaxonomies } = trpc.taxonomy.getByDataType.useQuery(
    { dataType: "image" },
    { enabled: isAuthenticated }
  );

  const { data: audioTaxonomies } = trpc.taxonomy.getByDataType.useQuery(
    { dataType: "audio" },
    { enabled: isAuthenticated }
  );

  const taxonomies = {
    text: textTaxonomies || [],
    image: imageTaxonomies || [],
    audio: audioTaxonomies || [],
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>Sign in to manage label taxonomies</CardDescription>
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
            <h1 className="text-5xl font-black text-black tracking-tight">LABEL TAXONOMY</h1>
            <span className="text-sm font-mono text-cyan-600">MANAGEMENT</span>
          </div>
          <p className="text-lg text-slate-600 font-light">
            Define and manage label categories for your AI labeling tasks
          </p>
          <div className="mt-4 flex gap-2">
            <div className="w-12 h-1 bg-cyan-500"></div>
            <div className="w-8 h-1 bg-pink-400"></div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowCreateTaxonomy(true)}
            className="gap-2 bg-black hover:bg-slate-800 text-white"
          >
            <Plus className="w-4 h-4" />
            Create New Taxonomy
          </Button>
        </div>

        {/* Taxonomy Tabs */}
        <Tabs value={activeDataType} onValueChange={(value: any) => setActiveDataType(value)}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="text">Text Labels</TabsTrigger>
            <TabsTrigger value="image">Image Labels</TabsTrigger>
            <TabsTrigger value="audio">Audio Labels</TabsTrigger>
          </TabsList>

          {/* Text Taxonomies */}
          <TabsContent value="text" className="space-y-6">
            {taxonomies.text.length > 0 ? (
              <TaxonomyList taxonomies={taxonomies.text} dataType="text" />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">
                    No text taxonomies yet. Create one to get started with text labeling.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Image Taxonomies */}
          <TabsContent value="image" className="space-y-6">
            {taxonomies.image.length > 0 ? (
              <TaxonomyList taxonomies={taxonomies.image} dataType="image" />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">
                    No image taxonomies yet. Create one to get started with image labeling.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Audio Taxonomies */}
          <TabsContent value="audio" className="space-y-6">
            {taxonomies.audio.length > 0 ? (
              <TaxonomyList taxonomies={taxonomies.audio} dataType="audio" />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">
                    No audio taxonomies yet. Create one to get started with audio labeling.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-12 border-cyan-200 bg-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg">How to Create Taxonomies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              <strong>Text:</strong> Create taxonomies for sentiment (positive, negative, neutral), intent
              classification, topic detection, or any custom categories.
            </p>
            <p>
              <strong>Image:</strong> Define object types, scene categories, quality levels, or content
              classifications.
            </p>
            <p>
              <strong>Audio:</strong> Create categories for audio events, speaker roles, emotion detection, or
              content types.
            </p>
            <p className="pt-2 text-cyan-700">
              Once created, use these taxonomies when setting up labeling tasks to guide the AI labeling engine.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Taxonomy Dialog */}
      <CreateTaxonomyDialog open={showCreateTaxonomy} onOpenChange={setShowCreateTaxonomy} />
    </div>
  );
}
