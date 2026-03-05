import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function BatchAPIPage() {
  const { isAuthenticated, user } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // TODO: Implement API key management via tRPC
  const apiKeys: any[] = [];

  const generateMutation = {
    isPending: false,
    mutate: () => {
      toast.success("API key management coming soon");
    },
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>Sign in to access the Batch API</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const apiKey = apiKeys?.[0]?.key || "YOUR_API_KEY";

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
            <h1 className="text-5xl font-black text-black tracking-tight">BATCH API</h1>
            <span className="text-sm font-mono text-cyan-600">DOCUMENTATION</span>
          </div>
          <p className="text-lg text-slate-600 font-light">
            Submit large datasets for automated labeling via REST API
          </p>
          <div className="mt-4 flex gap-2">
            <div className="w-12 h-1 bg-cyan-500"></div>
            <div className="w-8 h-1 bg-pink-400"></div>
          </div>
        </div>

        {/* API Keys Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage your API keys for batch operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKeys.length > 0 ? (
              <div className="space-y-3">
                {apiKeys.map((key: any) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div>
                      <p className="font-mono text-sm text-slate-700">
                        {key.key.substring(0, 20)}...
                      </p>
                      <p className="text-xs text-slate-500">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No API keys yet. Generate one to get started.</p>
            )}
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="gap-2 bg-black hover:bg-slate-800 text-white"
            >
              Generate New API Key
            </Button>
          </CardContent>
        </Card>

        {/* Documentation Tabs */}
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submit">Submit Batch</TabsTrigger>
            <TabsTrigger value="status">Check Status</TabsTrigger>
            <TabsTrigger value="retrieve">Retrieve Results</TabsTrigger>
          </TabsList>

          {/* Submit Batch */}
          <TabsContent value="submit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submit Batch for Labeling</CardTitle>
                <CardDescription>
                  Submit a batch of items to be automatically labeled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Endpoint</h4>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                    POST {baseUrl}/api/batch/submit
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Headers</h4>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                    Authorization: Bearer {apiKey}
                    <br />
                    Content-Type: application/json
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "datasetName": "Customer Reviews",
  "dataType": "text",
  "items": [
    {
      "id": "item_1",
      "content": "Great product!"
    },
    {
      "id": "item_2", 
      "content": "Not satisfied"
    }
  ],
  "taxonomyLabels": ["positive", "negative", "neutral"],
  "labelingType": "sentiment"
}`}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopyCode(
                          `{
  "datasetName": "Customer Reviews",
  "dataType": "text",
  "items": [
    {
      "id": "item_1",
      "content": "Great product!"
    },
    {
      "id": "item_2", 
      "content": "Not satisfied"
    }
  ],
  "taxonomyLabels": ["positive", "negative", "neutral"],
  "labelingType": "sentiment"
}`,
                          "submit-body"
                        )
                      }
                    >
                      {copiedCode === "submit-body" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "batchId": "batch_123abc",
  "status": "submitted",
  "itemCount": 2,
  "createdAt": "2026-03-05T08:00:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Check Status */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Check Batch Status</CardTitle>
                <CardDescription>
                  Check the processing status of a submitted batch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Endpoint</h4>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                    GET {baseUrl}/api/batch/status/:batchId
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`curl -X GET \\
  ${baseUrl}/api/batch/status/batch_123abc \\
  -H "Authorization: Bearer ${apiKey}"`}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopyCode(
                          `curl -X GET \\
  ${baseUrl}/api/batch/status/batch_123abc \\
  -H "Authorization: Bearer ${apiKey}"`,
                          "status-curl"
                        )
                      }
                    >
                      {copiedCode === "status-curl" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "batchId": "batch_123abc",
  "status": "processing",
  "processedCount": 1,
  "totalCount": 2,
  "progress": 50,
  "createdAt": "2026-03-05T08:00:00Z",
  "estimatedCompletionTime": "2026-03-05T08:05:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retrieve Results */}
          <TabsContent value="retrieve" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Retrieve Labeling Results</CardTitle>
                <CardDescription>
                  Download labeled results once batch processing is complete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Endpoint</h4>
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                    GET {baseUrl}/api/batch/results/:batchId
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Query Parameters</h4>
                  <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                    <div>
                      <span className="font-mono text-cyan-700">format</span>
                      <span className="text-slate-600"> - Output format: "json" or "csv" (default: json)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`curl -X GET \\
  "${baseUrl}/api/batch/results/batch_123abc?format=json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -o results.json`}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        handleCopyCode(
                          `curl -X GET \\
  "${baseUrl}/api/batch/results/batch_123abc?format=json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -o results.json`,
                          "results-curl"
                        )
                      }
                    >
                      {copiedCode === "results-curl" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response (JSON)</h4>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "batchId": "batch_123abc",
  "status": "completed",
  "results": [
    {
      "itemId": "item_1",
      "content": "Great product!",
      "label": "positive",
      "confidence": 0.95,
      "metadata": {}
    },
    {
      "itemId": "item_2",
      "content": "Not satisfied",
      "label": "negative",
      "confidence": 0.87,
      "metadata": {}
    }
  ],
  "completedAt": "2026-03-05T08:05:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Handling */}
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg">Error Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>
              <strong>401 Unauthorized:</strong> Invalid or missing API key. Generate a new key and include it in
              the Authorization header.
            </p>
            <p>
              <strong>400 Bad Request:</strong> Invalid request body. Check that all required fields are present
              and properly formatted.
            </p>
            <p>
              <strong>404 Not Found:</strong> Batch ID not found. Verify the batch ID is correct.
            </p>
            <p>
              <strong>429 Too Many Requests:</strong> Rate limit exceeded. Wait before making additional requests.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
