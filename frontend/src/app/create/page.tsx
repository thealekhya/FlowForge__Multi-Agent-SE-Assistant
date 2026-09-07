'use client';

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Terminal,
  Rocket,
  Cpu,
  History,
  ArrowRight,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Code2,
  Workflow,
  AlertCircle,
  X,
  FileCode2,
  Zap,
  Lock,
} from "lucide-react";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    icon: ShieldCheck,
    tag: "Security",
    tagVariant: "cyan" as const,
    title: "Passkey & WebAuthn Integration",
    prompt:
      "Implement FIDO2 / WebAuthn passwordless biometric authentication with Redis session fallback, rate-limiting, and automated audit logging for zero-trust security compliance.",
  },
  {
    icon: Zap,
    tag: "Billing",
    tagVariant: "violet" as const,
    title: "Multi-tenant Stripe Subscriptions",
    prompt:
      "Migrate our billing infrastructure to multi-tenant Stripe subscriptions with usage-based metered billing, automated invoice reconciliation, and customer self-service portal.",
  },
  {
    icon: Cpu,
    tag: "Realtime",
    tagVariant: "indigo" as const,
    title: "Real-time Event Streaming Bus",
    prompt:
      "Build a real-time event distribution bus using WebSockets, Redis Pub/Sub, and distributed client presence tracking with automatic reconnection and message deduplication.",
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";

function CreatePageInner() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentWorkflows, setRecentWorkflows] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Pre-fill prompt from URL query params (e.g. from Web Research Hub)
  useEffect(() => {
    const qPrompt = searchParams.get("prompt");
    if (qPrompt) {
      setPrompt(qPrompt);
    }
  }, [searchParams]);

  // Fetch recent workflows for sidebar (isolated by user)
  useEffect(() => {
    const headers: Record<string, string> = {};
    if (userId) {
      headers["X-User-Id"] = userId;
    }

    fetch("/api/workflows?limit=4", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch recent workflows");
        return res.json();
      })
      .then((data) => {
        setRecentWorkflows(data.slice(0, 4));
        setLoadingRecent(false);
      })
      .catch(() => {
        fetch(`${API_BASE_URL}/api/workflows?limit=4`, { headers })
          .then((r) => r.json())
          .then((data) => {
            setRecentWorkflows(data.slice(0, 4));
            setLoadingRecent(false);
          })
          .catch(() => setLoadingRecent(false));
      });
  }, [userId]);

  const handleSubmit = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      setError("Please describe a feature request with at least 10 characters.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (userId) {
      headers["X-User-Id"] = userId;
    }

    try {
      let res = await fetch("/api/workflows", {
        method: "POST",
        headers,
        body: JSON.stringify({ feature_request: prompt.trim() }),
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${API_BASE_URL}/api/workflows`, {
          method: "POST",
          headers,
          body: JSON.stringify({ feature_request: prompt.trim() }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      router.push(`/workflows/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to trigger workflow. Ensure backend server is running.");
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Show when="signed-out">
        <div className="w-full max-w-xl mx-auto py-16 px-4">
          <Card variant="prominent" className="relative overflow-hidden text-center p-8 sm:p-10 border-border-prominent bg-surface-panel/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-signal-violet/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-signal-violet/15 border border-signal-violet/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.35)]">
              <Lock className="w-7 h-7 text-signal-violet" />
            </div>

            <Badge variant="violet" dot pulse className="mb-4 text-xs font-mono uppercase tracking-wider">
              Authentication Required
            </Badge>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              Sign in to Start Workflow
            </h2>

            <p className="text-sm text-outline max-w-md mx-auto mb-8 leading-relaxed">
              Authentication via Clerk is required to compose feature requests and trigger our autonomous multi-agent pipeline.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <SignInButton mode="modal" forceRedirectUrl="/create">
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
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex flex-col items-start gap-2 relative">
            <Badge variant="indigo" dot pulse className="mb-1 font-mono uppercase tracking-wider text-[11px]">
              LangGraph Orchestration v4.2
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-header text-white tracking-tight flex items-center gap-3">
              <span>New Workflow Pipeline</span>
              <span className="w-2.5 h-2.5 rounded-full bg-signal-violet shadow-[0_0_12px_#A855F7] animate-pulse" />
            </h1>
            <p className="text-sm sm:text-base text-slate-300/85 max-w-2xl leading-relaxed font-normal">
              State your product specifications. Four specialized autonomous agents will research, architect, plan, and audit your production feature.
            </p>
            <div className="h-0.5 w-32 bg-gradient-to-r from-signal-indigo via-signal-violet to-transparent mt-1 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>

          {/* 2-COLUMN SPLIT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* PRIMARY INTAKE STUDIO CARD (Col 1-8) */}
            <div className="lg:col-span-8 metallic-card rounded-2xl border border-white/[0.12] relative overflow-hidden shadow-xl">
              {/* Subtle Ambient Top Corner Glow */}
              <div className="absolute -top-24 -left-24 w-60 h-60 bg-signal-indigo/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-signal-cyan/10 rounded-full blur-3xl pointer-events-none" />

              <div className="border-b border-white/[0.08] p-5 sm:p-6 flex flex-row items-center justify-between gap-2 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-signal-violet/15 border border-signal-violet/30 flex items-center justify-center text-signal-violet shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-header font-bold text-base sm:text-lg text-white tracking-tight leading-none">
                      Feature Specification Composer
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-normal">
                      Natural language feature requirements &amp; system constraints
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping" />
                  AST Engine Active
                </span>
              </div>

              <div className="p-5 sm:p-6 flex flex-col gap-6">
                {/* Error Notification */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-outline hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Main Textarea Container */}
                <div className="flex flex-col gap-2 relative">
                  <Textarea
                    id="feature-spec"
                    placeholder="e.g. Design a high-throughput multi-tier subscription and checkout system with Stripe integration, automated billing retries, discount coupon validation, and webhook idempotency..."
                    rows={8}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-sm font-mono leading-relaxed bg-[#07080D]/90 border-white/[0.14] focus-visible:border-signal-cyan focus-visible:ring-signal-cyan/25 text-slate-200 rounded-xl p-4 shadow-inner"
                  />

                  {/* Character Counter & Keyboard Hint */}
                  <div className="flex flex-wrap items-center justify-between px-1 text-xs text-slate-400 font-mono gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          prompt.length >= 10 ? "text-emerald-400" : "text-slate-500"
                        }`}
                      />
                      <span>
                        {prompt.length >= 10
                          ? "Prompt specification valid"
                          : "Minimum 10 characters required"}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline text-slate-400 text-[11px]">
                        Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Enter</kbd>
                      </span>
                      {prompt.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPrompt("")}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      <span className="text-white/80 font-bold">{prompt.length} / 5,000 chars</span>
                    </div>
                  </div>
                </div>

                {/* Quick Starter Templates */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-header font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-signal-cyan" />
                      <span>Curated Production Starters</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">click to apply</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TEMPLATES.map((tmpl, idx) => {
                      const Icon = tmpl.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPrompt(tmpl.prompt)}
                          className="p-3.5 rounded-xl metallic-card border border-white/[0.08] hover:border-signal-cyan/40 hover:shadow-[0_8px_20px_-4px_rgba(6,182,212,0.15)] text-left transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col gap-2.5 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-signal-cyan group-hover:text-white group-hover:bg-signal-cyan/20 group-hover:border-signal-cyan/30 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
                              {tmpl.tag}
                            </span>
                          </div>
                          <div>
                            <div className="font-header font-bold text-xs sm:text-[13px] text-white group-hover:text-signal-cyan transition-colors leading-snug">
                              {tmpl.title}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                              {tmpl.prompt}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* Sleek Minimal Metallic Animated Action Button */}
            <div className="pt-2">
              <button
                type="button"
                id="launch-pipeline-btn"
                onClick={handleSubmit}
                disabled={isSubmitting || prompt.trim().length < 10}
                className={cn(
                  "relative w-full group overflow-hidden rounded-xl p-[1px] transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-signal-cyan/40",
                  prompt.trim().length >= 10 && !isSubmitting
                    ? "cursor-pointer hover:shadow-[0_0_35px_rgba(6,182,212,0.35)] active:scale-[0.995]"
                    : "opacity-45 cursor-not-allowed"
                )}
              >
                {/* Metallic Animated Border Shimmer */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r from-signal-cyan via-signal-violet to-signal-indigo transition-opacity duration-300",
                    prompt.trim().length >= 10
                      ? "opacity-75 group-hover:opacity-100 animate-text-shimmer"
                      : "opacity-20"
                  )}
                />

                {/* Inner Metallic Button Body */}
                <div className="relative flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 rounded-[11px] bg-gradient-to-b from-[#141520] via-[#0E0F16] to-[#07080C] group-hover:from-[#1b1c2b] group-hover:to-[#0a0b12] border border-white/[0.14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_10px_25px_-5px_rgba(0,0,0,0.7)] transition-all duration-300">
                  {/* Diagonal Metallic Sheen Sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent pointer-events-none" />

                  {/* Left: Status beacon & Title */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all duration-300",
                          isSubmitting
                            ? "bg-signal-cyan animate-ping"
                            : prompt.trim().length >= 10
                            ? "bg-signal-cyan shadow-[0_0_10px_#06b6d4] animate-pulse"
                            : "bg-white/25"
                        )}
                      />
                    </div>

                    <span className="font-header font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2 group-hover:text-signal-cyan transition-colors">
                      {isSubmitting ? (
                        <span>Synthesizing Multi-Agent Pipeline...</span>
                      ) : (
                        <span>Synthesize &amp; Launch Pipeline</span>
                      )}
                    </span>
                  </div>

                  {/* Right: Key Combo Badge & Animated Icon */}
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-slate-300/70 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
                      <span>Ctrl</span>+<span>Enter</span>
                    </span>

                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/90 group-hover:text-signal-cyan group-hover:border-signal-cyan/40 group-hover:bg-signal-cyan/15 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300",
                        isSubmitting && "animate-spin"
                      )}
                    >
                      {isSubmitting ? (
                        <Cpu className="w-4 h-4 text-signal-cyan" />
                      ) : (
                        <Rocket className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* 4-Stage Multi-Agent Topology Preview (Connected DAG Hierarchy) */}
            <div className="pt-5 border-t border-white/[0.08] flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white font-header font-bold tracking-tight">
                  <Workflow className="w-4 h-4 text-signal-cyan" />
                  <span>Autonomous Agent DAG Hierarchy</span>
                </span>
                <span className="font-mono text-[11px] text-signal-cyan font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-signal-cyan/10 border border-signal-cyan/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping" />
                  EST. SYNTHESIS ~ 15-25s
                </span>
              </div>

              {/* Connected Stage Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                {[
                  {
                    num: "01",
                    name: "Requirements Analyst",
                    contract: "AST Invariants",
                    sub: "Spec & Boundary Synthesis",
                    badge: "bg-signal-cyan/15 text-signal-cyan border-signal-cyan/35",
                    accent: "from-signal-cyan/20 to-transparent",
                  },
                  {
                    num: "02",
                    name: "System Architect",
                    contract: "Postgres & OpenAPI",
                    sub: "Relational DDL & Contracts",
                    badge: "bg-signal-indigo/15 text-signal-indigo border-signal-indigo/35",
                    accent: "from-signal-indigo/20 to-transparent",
                  },
                  {
                    num: "03",
                    name: "Sprint Planner",
                    contract: "Task DAG & Tests",
                    sub: "Atomic Sub-PR Branches",
                    badge: "bg-signal-violet/15 text-signal-violet border-signal-violet/35",
                    accent: "from-signal-violet/20 to-transparent",
                  },
                  {
                    num: "04",
                    name: "Security Auditor",
                    contract: "OWASP & QA Gates",
                    sub: "Synthetic Verification",
                    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
                    accent: "from-emerald-500/20 to-transparent",
                  },
                ].map((st, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl metallic-card border border-white/[0.1] hover:border-white/25 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-2.5 relative group overflow-hidden shadow-sm"
                  >
                    {/* Top ambient color bleed */}
                    <div
                      className={cn(
                        "absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-75 group-hover:opacity-100 transition-opacity",
                        st.accent
                      )}
                    />

                    {/* Top Row: Stage index chip & status dot */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md border",
                          st.badge
                        )}
                      >
                        STAGE {st.num}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-signal-cyan group-hover:shadow-[0_0_6px_#06b6d4] transition-all" />
                    </div>

                    {/* Middle: Agent Title & Subtitle */}
                    <div>
                      <h4 className="font-header font-bold text-xs sm:text-[13px] text-white tracking-tight leading-tight group-hover:text-signal-cyan transition-colors">
                        {st.name}
                      </h4>
                      <p className="text-[11px] text-slate-300/75 mt-0.5 leading-snug font-normal">
                        {st.sub}
                      </p>
                    </div>

                    {/* Bottom: Artifact Contract Chip */}
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08] truncate">
                        {st.contract}
                      </span>
                      {i < 3 && (
                        <ArrowRight className="w-3 h-3 text-white/30 hidden sm:block group-hover:translate-x-0.5 group-hover:text-signal-cyan transition-all shrink-0 ml-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: RECENT WORKFLOWS & TELEMETRY (Col 9-12) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Recent Workflows Card */}
          <div className="metallic-card rounded-2xl border border-white/[0.1] overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-signal-cyan/15 border border-signal-cyan/30 flex items-center justify-center text-signal-cyan">
                  <History className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-header font-bold text-sm text-white tracking-tight leading-none">
                    Recent Pipeline Runs
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400">Authenticated Session Scoped</span>
                </div>
              </div>
              <Link
                href="/history"
                className="text-xs font-mono font-semibold text-signal-cyan hover:text-white transition-colors flex items-center gap-1 group px-2 py-1 rounded-md hover:bg-white/[0.04]"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="p-3.5 flex flex-col gap-2.5">
              {loadingRecent ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2.5">
                  <span className="material-symbols-outlined text-signal-cyan animate-spin text-xl">
                    progress_activity
                  </span>
                  <span className="font-mono">Loading previous runs...</span>
                </div>
              ) : recentWorkflows.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <FileCode2 className="w-8 h-8 text-slate-500 mb-1" />
                  <span className="font-header font-bold text-sm text-white">No previous workflows</span>
                  <span className="text-[11px] text-slate-400">Your newly synthesized plans will appear here.</span>
                </div>
              ) : (
                recentWorkflows.map((wf) => (
                  <Link
                    key={wf.id}
                    href={`/workflows/${wf.id}`}
                    className="p-3.5 rounded-xl metallic-card border border-white/[0.08] hover:border-signal-cyan/40 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-4px_rgba(6,182,212,0.2)] transition-all duration-200 flex flex-col gap-2 group relative overflow-hidden"
                  >
                    {/* Accent left highlight beacon on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-signal-cyan to-signal-violet opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    <div className="flex items-start justify-between gap-2.5">
                      <span className="font-header font-bold text-[13px] text-white group-hover:text-signal-cyan transition-colors line-clamp-2 leading-snug tracking-tight">
                        {wf.feature_request}
                      </span>
                      <div className="w-5 h-5 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-signal-cyan/30 group-hover:bg-signal-cyan/10 transition-colors mt-0.5">
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-signal-cyan group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-[11px] font-mono">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 border",
                          wf.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : wf.status === "failed"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            wf.status === "completed"
                              ? "bg-emerald-400"
                              : wf.status === "failed"
                              ? "bg-rose-400"
                              : "bg-signal-cyan animate-pulse"
                          )}
                        />
                        {wf.status}
                      </span>
                      <span className="font-mono text-[10px] text-slate-300/80 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                        #{wf.id.substring(0, 8)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Telemetry Status Card */}
          <div className="metallic-card p-4 rounded-2xl border border-white/[0.1] flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-signal-cyan" />
                <span className="font-header text-xs font-bold uppercase tracking-wider text-white">
                  Cluster Orchestration
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Model Engine:</span>
                <span className="text-signal-cyan font-bold">Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Graph Framework:</span>
                <span className="text-signal-indigo font-bold">LangGraph Async DAG</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Active Agents:</span>
                <span className="text-signal-violet font-bold">4 Core Agents</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Stream Protocol:</span>
                <span className="text-emerald-400 font-bold">SSE Live Bus</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </Show>
</>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-outline font-mono text-xs">Loading feature studio...</div>}>
      <CreatePageInner />
    </Suspense>
  );
}
