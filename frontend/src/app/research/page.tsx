'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Search,
  Sparkles,
  Lightbulb,
  Layers,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  CheckCircle2,
  FileCode2,
  Rocket,
  X,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Show, SignInButton } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";

interface WebSource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

interface RecommendedTool {
  name: string;
  category: string;
  why: string;
}

interface ResearchData {
  query: string;
  summary: string;
  key_findings: string[];
  recommended_stack: RecommendedTool[];
  architecture_insights: string[];
  suggested_workflow_prompt: string;
  web_sources: WebSource[];
}

const TRENDING_QUERIES = [
  { label: "CRDT & Real-time Collab", query: "Real-time collaborative editing using Yjs CRDT and WebSockets architecture" },
  { label: "Next.js 15 Server Actions", query: "Next.js 15 Server Actions authentication and data validation patterns" },
  { label: "Passkeys / WebAuthn", query: "FIDO2 WebAuthn biometric passwordless authentication implementation" },
  { label: "FastAPI High Concurrency", query: "FastAPI async websocket high throughput pub sub redis architecture" },
  { label: "RAG & pgvector", query: "Retrieval Augmented Generation with pgvector and LangChain best practices" },
];

export default function ResearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResearchData | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q || q.length < 2) {
      setError("Please enter a search topic with at least 2 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, max_results: 5 }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${API_BASE_URL}/api/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, max_results: 5 }),
        });
      }

      if (!res.ok) {
        throw new Error(`Research request failed (${res.status})`);
      }

      const result: ResearchData = await res.json();
      setData(result);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to query the live web. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (targetQuery: string) => {
    setQuery(targetQuery);
    handleSearch(targetQuery);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const launchWorkflow = () => {
    if (!data?.suggested_workflow_prompt) return;
    const encoded = encodeURIComponent(data.suggested_workflow_prompt);
    router.push(`/create?prompt=${encoded}`);
  };

  return (
    <>
      <Show when="signed-out">
        <div className="w-full max-w-xl mx-auto py-16 px-4">
          <Card variant="prominent" className="relative overflow-hidden text-center p-8 sm:p-10 border-border-prominent bg-surface-panel/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-signal-cyan/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-signal-cyan/15 border border-signal-cyan/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.35)]">
              <Lock className="w-7 h-7 text-signal-cyan" />
            </div>

            <Badge variant="cyan" dot pulse className="mb-4 text-xs font-mono uppercase tracking-wider">
              Authentication Required
            </Badge>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              Sign in to Access Web Research
            </h2>

            <p className="text-sm text-outline max-w-md mx-auto mb-8 leading-relaxed">
              Authentication via Clerk is required to run live autonomous web research, explore technical citations, and synthesize architecture briefs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <SignInButton mode="modal" forceRedirectUrl="/research">
                <Button variant="default" size="lg" className="w-full sm:w-auto bg-purple-700 hover:bg-purple-600 text-white font-semibold shadow-[0_0_20px_rgba(147,51,234,0.4)] cursor-pointer">
                  <Sparkles className="w-4 h-4 mr-2 text-signal-cyan" />
                  Sign In with Clerk
                </Button>
              </SignInButton>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Return to Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10 relative z-10">
          {/* Hero Header */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-3">
            <Badge variant="cyan" dot pulse className="font-mono uppercase tracking-wider text-[11px]">
              <Globe className="w-3.5 h-3.5 mr-1" />
              Autonomous Live Web Intelligence
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Live Web Technical Research
            </h1>
            <p className="text-sm sm:text-base text-outline max-w-2xl leading-relaxed">
              Search the live web for production libraries, architecture benchmarks, and security advisories. Real-time synthesis with verified source citations.
            </p>
          </div>

      {/* Interactive Search Bar Deck */}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex items-center rounded-2xl glass-card-prominent p-2 shadow-2xl focus-within:border-signal-cyan focus-within:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all duration-300"
        >
          <Search className="w-5 h-5 text-outline ml-3 mr-2 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any tech stack, framework, API, or architecture challenge..."
            className="w-full bg-transparent border-0 text-sm text-white placeholder:text-outline focus:outline-none focus:ring-0 px-2 py-2"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-outline hover:text-white mr-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            size="sm"
            className="shrink-0 font-bold px-4"
          >
            {loading ? "Crawling..." : "Search"}
          </Button>
        </form>

        {/* Trending Chips */}
        <div className="flex flex-wrap items-center gap-2 justify-center text-xs">
          <span className="text-outline font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-signal-cyan" />
            <span>Trending:</span>
          </span>
          {TRENDING_QUERIES.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip.query)}
              className="px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-signal-cyan/10 border border-white/[0.08] hover:border-signal-cyan/40 text-outline hover:text-signal-cyan transition-all duration-150 cursor-pointer select-none text-[11px]"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton Indicator */}
      {loading && (
        <Card variant="prominent" className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-signal-cyan/10 border border-signal-cyan/40 flex items-center justify-center">
            <Globe className="w-7 h-7 text-signal-cyan animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Crawling Live Web Sources</h3>
            <p className="text-xs text-outline mt-1 font-mono">
              Synthesizing real-time documentation, RFCs, GitHub repos, and benchmarks...
            </p>
          </div>
          <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <div className="w-full h-full bg-gradient-to-r from-signal-cyan via-signal-indigo to-signal-violet animate-pulse" />
          </div>
        </Card>
      )}

      {/* Research Output Presentation */}
      {data && !loading && (
        <div className="flex flex-col gap-8">
          {/* Executive Synthesis Card */}
          <Card variant="prominent" className="p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-signal-cyan/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Autonomous Technical Synthesis
                  </h2>
                  <p className="text-xs text-outline font-mono">
                    Topic: &quot;{data.query}&quot;
                  </p>
                </div>
              </div>
              <Badge variant="cyan" dot className="font-mono text-[11px]">
                {data.web_sources.length} Sources Indexed
              </Badge>
            </div>

            {/* Executive Summary */}
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-normal mb-8 bg-black/30 p-4 rounded-xl border border-white/[0.06]">
              {data.summary}
            </p>

            {/* 2-Column Grid: Key Discoveries & Architecture Best Practices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Key Discoveries */}
              {data.key_findings && data.key_findings.length > 0 && (
                <Card variant="subtle" className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-signal-cyan font-bold text-sm border-b border-white/[0.06] pb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Discoveries</span>
                  </div>
                  <ul className="space-y-2.5">
                    {data.key_findings.map((item, i) => (
                      <li key={i} className="text-xs text-outline flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan mt-1.5 shrink-0" />
                        <span className="text-white/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Architecture & Pitfalls */}
              {data.architecture_insights && data.architecture_insights.length > 0 && (
                <Card variant="subtle" className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-signal-indigo font-bold text-sm border-b border-white/[0.06] pb-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Architecture Insights &amp; Pitfalls</span>
                  </div>
                  <ul className="space-y-2.5">
                    {data.architecture_insights.map((item, i) => (
                      <li key={i} className="text-xs text-outline flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-signal-indigo mt-1.5 shrink-0" />
                        <span className="text-white/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Recommended Tech Stack Grid */}
            {data.recommended_stack && data.recommended_stack.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                  <Layers className="w-4 h-4 text-signal-violet" />
                  <span>Recommended Production Stack</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.recommended_stack.map((tool, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-1.5 hover:border-signal-violet/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono">{tool.name}</span>
                        <Badge variant="violet" className="text-[10px] px-1.5 py-0">
                          {tool.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-outline leading-relaxed">{tool.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Workflow Launch Callout */}
            {data.suggested_workflow_prompt && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-signal-indigo/15 via-signal-violet/10 to-transparent border border-signal-indigo/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase">
                    <Rocket className="w-4 h-4 text-signal-cyan" />
                    <span>Suggested Feature Prompt</span>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-2 max-w-xl font-mono">
                    &quot;{data.suggested_workflow_prompt}&quot;
                  </p>
                </div>
                <Button onClick={launchWorkflow} className="shrink-0">
                  <span>Synthesize Plan</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            )}
          </Card>

          {/* Verified Web Citations Deck */}
          {data.web_sources && data.web_sources.length > 0 && (
            <Card variant="default" className="p-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Globe className="w-4 h-4 text-signal-cyan" />
                  <span>Verified Web Sources &amp; Citations</span>
                </div>
                <span className="text-xs text-outline font-mono">
                  {data.web_sources.length} sources crawled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.web_sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.15] transition-all flex flex-col justify-between gap-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {src.domain || "Web Citation"}
                        </Badge>
                        <button
                          onClick={() => copyToClipboard(src.url)}
                          className="text-outline hover:text-white transition-colors cursor-pointer p-1"
                          title="Copy source link"
                        >
                          {copiedUrl === src.url ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-signal-cyan transition-colors line-clamp-1">
                        {src.title}
                      </h4>
                      <p className="text-[11px] text-outline line-clamp-2 mt-1 leading-relaxed">
                        {src.snippet}
                      </p>
                    </div>

                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-signal-cyan hover:underline mt-1 font-mono"
                    >
                      <span>Visit Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  </Show>
</>
  );
}
