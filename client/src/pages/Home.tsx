import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Brain, Database } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 overflow-hidden">
      {/* Grid background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent),
                          linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)`,
        backgroundSize: "50px 50px"
      }} />

      {/* Decorative elements */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-cyan-500 opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-pink-400 opacity-5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-20">
          <div className="flex items-baseline gap-4 mb-6">
            <h1 className="text-7xl font-black text-black tracking-tighter leading-none">
              DATA
              <br />
              LABELING
            </h1>
            <span className="text-sm font-mono text-cyan-600 self-start mt-2">PLATFORM</span>
          </div>
          <p className="text-xl text-slate-600 font-light max-w-2xl mb-6">
            Automated annotation for text, images, and audio datasets powered by AI
          </p>
          <div className="flex gap-3 mb-8">
            <div className="w-16 h-1 bg-cyan-500"></div>
            <div className="w-12 h-1 bg-pink-400"></div>
            <div className="w-8 h-1 bg-slate-300"></div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 mb-20">
          {isAuthenticated ? (
            <Button
              onClick={() => navigate("/dashboard")}
              className="gap-2 bg-black hover:bg-slate-800 text-white px-8 py-6 text-lg"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="gap-2 bg-black hover:bg-slate-800 text-white px-8 py-6 text-lg"
            >
              Sign In to Start
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card className="border-slate-200 hover:border-cyan-300 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>AI-Powered Labeling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated sentiment analysis, NER, classification, and object detection
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200 hover:border-pink-300 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>Multi-Format Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Handle text, images, and audio in a single unified platform
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-slate-200 hover:border-cyan-300 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>Batch API</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Submit large datasets via REST API for automated processing
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h2 className="text-2xl font-black text-black mb-6">CAPABILITIES</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-cyan-600 font-bold">→</span>
                <span className="text-slate-700">Sentiment analysis and emotion detection</span>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-600 font-bold">→</span>
                <span className="text-slate-700">Named entity recognition (NER)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-600 font-bold">→</span>
                <span className="text-slate-700">Text classification and language identification</span>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-600 font-bold">→</span>
                <span className="text-slate-700">Image classification and object detection</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-pink-600 font-bold">→</span>
                <span className="text-slate-700">Audio transcription using Whisper API</span>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-600 font-bold">→</span>
                <span className="text-slate-700">Speaker diarization and identification</span>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-600 font-bold">→</span>
                <span className="text-slate-700">Data cleaning and deduplication</span>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-600 font-bold">→</span>
                <span className="text-slate-700">Export to JSON and CSV formats</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
