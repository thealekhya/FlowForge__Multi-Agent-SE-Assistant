'use client';

import Link from "next/link";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  FileDown,
  ChevronDown,
  Trash2,
  FileText,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Cpu,
  GitBranch,
  FileCheck,
  Code2,
  ListTodo,
  Workflow,
  Download,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MermaidViewer } from "@/components/MermaidViewer";

interface StageResult {
  id?: string;
  stage_name: string;
  order_index?: number;
  status: string;
  input_context?: string;
  output?: string;
  error_message?: string | null;
  duration_seconds?: number | null;
  completed_at?: string | null;
}

interface WorkflowData {
  id: string;
  user_id?: string;
  feature_request: string;
  status: string;
  created_at: string;
  updated_at: string;
  stages: StageResult[];
}

const STAGE_CONFIG: Record<
  string,
  {
    order: number;
    label: string;
    title: string;
    icon: any;
    badgeVariant: "cyan" | "indigo" | "violet" | "success";
    colorClass: string;
  }
> = {
  requirements: {
    order: 1,
    label: "Stage 01",
    title: "Requirements Analysis",
    icon: FileCheck,
    badgeVariant: "cyan",
    colorClass: "text-signal-cyan border-signal-cyan/30 bg-signal-cyan/10",
  },
  design: {
    order: 2,
    label: "Stage 02",
    title: "Solution Architecture",
    icon: Cpu,
    badgeVariant: "indigo",
    colorClass: "text-signal-indigo border-signal-indigo/30 bg-signal-indigo/10",
  },
  implementation: {
    order: 3,
    label: "Stage 03",
    title: "Implementation Planning",
    icon: GitBranch,
    badgeVariant: "violet",
    colorClass: "text-signal-violet border-signal-violet/30 bg-signal-violet/10",
  },
  review: {
    order: 4,
    label: "Stage 04",
    title: "Code Review & Quality Audit",
    icon: ShieldCheck,
    badgeVariant: "success",
    colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { userId } = useAuth();

  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [stages, setStages] = useState<StageResult[]>([]);
  const [status, setStatus] = useState<string>("connecting");
  const [rawViewStages, setRawViewStages] = useState<Record<string, boolean>>({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getApiBase = () => API_BASE_URL;

  const fetchWorkflowDetails = async () => {
    try {
      const headers: Record<string, string> = {};
      if (userId) {
        headers["X-User-Id"] = userId;
      }

      let res = await fetch(`/api/workflows/${id}`, { headers }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${getApiBase()}/api/workflows/${id}`, { headers });
      }
      if (!res.ok) throw new Error("Workflow not found");
      const data: WorkflowData = await res.json();
      setWorkflow(data);
      setStatus(data.status);
      if (data.stages && data.stages.length > 0) {
        setStages(data.stages);
      }
      return data;
    } catch (err) {
      console.error(err);
      setStatus("error");
      return null;
    }
  };

  useEffect(() => {
    let sse: EventSource | null = null;

    fetchWorkflowDetails().then((wf) => {
      if (!wf) return;

      if (wf.status === "completed" || wf.status === "failed") {
        setStatus(wf.status);
        return;
      }

      setStatus("running");
      const sseUrl = `${getApiBase()}/api/workflows/${id}/stream`;
      sse = new EventSource(sseUrl);

      const handleStageUpdate = (rawEventData: string) => {
        try {
          const ev: StageResult = JSON.parse(rawEventData);
          setStages((prev) => {
            const idx = prev.findIndex((s) => s.stage_name === ev.stage_name);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...ev };
              return updated;
            }
            return [...prev, ev];
          });

          if (ev.stage_name === "review" && ev.status === "completed") {
            setStatus("completed");
            fetchWorkflowDetails();
          }
        } catch (e) {
          console.error("Error parsing SSE stage update:", e);
        }
      };

      sse.addEventListener("stage_update", (e: MessageEvent) => {
        handleStageUpdate(e.data);
      });

      sse.addEventListener("complete", (e: MessageEvent) => {
        let finalEvent: { status?: string } = {};
        try {
          finalEvent = JSON.parse(e.data || "{}");
        } catch {
          finalEvent = {};
        }
        setStatus(finalEvent.status || "completed");
        fetchWorkflowDetails();
        if (sse) sse.close();
      });

      sse.onmessage = (e: MessageEvent) => {
        handleStageUpdate(e.data);
      };

      sse.onerror = () => {
        fetchWorkflowDetails().then((latest) => {
          if (latest && (latest.status === "completed" || latest.status === "failed")) {
            setStatus(latest.status);
          }
        });
      };
    });

    return () => {
      if (sse) sse.close();
    };
  }, [id, userId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workflow and all its artifacts?")) return;
    setIsDeleting(true);

    const headers: Record<string, string> = {};
    if (userId) {
      headers["X-User-Id"] = userId;
    }

    try {
      let res = await fetch(`/api/workflows/${id}`, { method: "DELETE", headers }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${getApiBase()}/api/workflows/${id}`, { method: "DELETE", headers });
      }
      if (res.ok) {
        router.push("/history");
      } else {
        alert("Failed to delete workflow.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting workflow.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRaw = (stageName: string) => {
    setRawViewStages((prev) => ({ ...prev, [stageName]: !prev[stageName] }));
  };

  const parseStageOutput = (rawOutput?: string, stageName?: string) => {
    if (!rawOutput) return null;
    try {
      const parsed = JSON.parse(rawOutput);
      if (
        stageName &&
        parsed &&
        typeof parsed === "object" &&
        parsed[stageName] &&
        typeof parsed[stageName] === "object"
      ) {
        return parsed[stageName];
      }
      return parsed;
    } catch {
      return { raw: rawOutput };
    }
  };

  const parseStageContext = (
    rawContext?: string
  ): { provider?: string; fallback_reason?: string | null } | null => {
    if (!rawContext) return null;
    try {
      return JSON.parse(rawContext);
    } catch {
      return null;
    }
  };

  if (!workflow && status === "connecting") {
    return (
      <div className="w-full max-w-4xl px-4 mx-auto py-24 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/15 flex items-center justify-center shadow-2xl">
          <Workflow className="w-8 h-8 text-signal-cyan animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Connecting to Workflow Engine</h2>
        <p className="text-sm font-mono text-outline">
          Initializing telemetry stream for #{id.substring(0, 8)}...
        </p>
      </div>
    );
  }

  if (!workflow && status === "error") {
    return (
      <div className="w-full max-w-2xl px-4 mx-auto py-24 text-center">
        <Card variant="prominent" className="p-8 text-center flex flex-col items-center gap-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mb-1" />
          <h2 className="text-2xl font-bold text-white">Workflow Not Found or Unauthorized</h2>
          <p className="text-sm text-outline max-w-md">
            Workflow ID &quot;{id.substring(0, 8)}&quot; does not exist, belongs to another authenticated user account, or the backend service is offline.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/create">
              <Button size="sm">Create New Workflow</Button>
            </Link>
            <Link href="/history">
              <Button variant="secondary" size="sm">
                View History
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const completedStagesCount = stages.filter((s) => s.status === "completed").length;

  return (
    <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col gap-8">
      {/* Top Breadcrumb & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/history"
            className="text-signal-cyan text-xs font-semibold flex items-center gap-1.5 hover:gap-2 transition-all w-fit font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Registry History</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Pipeline Run</span>
              <span className="font-mono text-signal-cyan">#{id.substring(0, 8)}</span>
            </h1>

            <button
              onClick={handleCopyId}
              title="Copy Workflow UUID"
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-outline hover:text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <Badge
              variant={
                status === "completed"
                  ? "success"
                  : status === "failed" || status === "error"
                  ? "destructive"
                  : "cyan"
              }
              dot
              pulse={status === "running"}
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1"
            >
              {status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Multi-Format Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Deliverable</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showExportMenu ? "rotate-180" : ""
                }`}
              />
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 flex flex-col gap-1 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-outline border-b border-white/[0.08] mb-1">
                  Choose Format
                </div>

                <a
                  href={`/api/workflows/${id}/export.md`}
                  download={`flowforge_report_${id.substring(0, 8)}.md`}
                  onClick={() => setShowExportMenu(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan shrink-0 mt-0.5">
                    <FileCode2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-signal-cyan transition-colors">
                      Markdown (.md)
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 leading-snug">
                      Plaintext documentation with markdown tables &amp; code blocks.
                    </p>
                  </div>
                </a>

                <a
                  href={`/api/workflows/${id}/export.pdf`}
                  download={`flowforge_report_${id.substring(0, 8)}.pdf`}
                  onClick={() => setShowExportMenu(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                      PDF Dossier (.pdf)
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 leading-snug">
                      Formatted architectural document with tables &amp; checklists.
                    </p>
                  </div>
                </a>

                <a
                  href={`/api/workflows/${id}/export.docx`}
                  download={`flowforge_report_${id.substring(0, 8)}.docx`}
                  onClick={() => setShowExportMenu(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-signal-indigo/10 border border-signal-indigo/30 text-signal-indigo shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-signal-indigo transition-colors">
                      Word Document (.docx)
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 leading-snug">
                      Editable Microsoft Word document with headings &amp; tables.
                    </p>
                  </div>
                </a>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete this workflow"
            className="text-outline hover:text-rose-400 hover:bg-rose-500/10 h-9 px-2.5"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Delete</span>
          </Button>
        </div>
      </div>

      {/* Feature Request Specification Banner */}
      <Card variant="prominent" className="p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-signal-indigo via-signal-violet to-signal-cyan" />
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-outline mb-2">
          <span className="flex items-center gap-1.5 text-signal-violet font-bold">
            <Terminal className="w-4 h-4" />
            <span>Product Feature Request</span>
          </span>
          <span className="font-mono text-outline/80">
            {workflow?.created_at ? new Date(workflow.created_at).toLocaleString() : ""}
          </span>
        </div>
        <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
          {workflow?.feature_request}
        </p>
      </Card>

      {/* Pipeline 4-Stage Topology Stepper */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono text-outline">
          <span className="uppercase tracking-wider font-bold text-white/90">
            4-Stage Multi-Agent Topology
          </span>
          <span className="text-signal-cyan font-semibold">
            {completedStagesCount} / 4 Stages Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(STAGE_CONFIG).map(([key, config]) => {
            const stage = stages.find((s) => s.stage_name === key);
            const isDone = stage?.status === "completed";
            const isRunning = stage?.status === "running";
            const isFailed = stage?.status === "failed";
            const Icon = config.icon;

            return (
              <div
                key={key}
                onClick={() => setActiveTab(activeTab === key ? "all" : key)}
                className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                  isDone
                    ? "bg-zinc-950/70 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : isRunning
                    ? "bg-zinc-950/90 border-signal-cyan shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-signal-cyan/60"
                    : isFailed
                    ? "bg-zinc-950/70 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                    : "bg-black/30 border-white/[0.06] opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isDone
                        ? "text-emerald-400"
                        : isRunning
                        ? "text-signal-cyan"
                        : "text-outline"
                    }`}
                  >
                    {config.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {typeof stage?.duration_seconds === "number" && stage.duration_seconds > 0 ? (
                      <span className="text-[11px] font-mono text-outline">
                        {stage.duration_seconds.toFixed(1)}s
                      </span>
                    ) : null}
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDone
                          ? "bg-emerald-400 shadow-[0_0_8px_#34D399]"
                          : isRunning
                          ? "bg-signal-cyan animate-ping shadow-[0_0_8px_#06B6D4]"
                          : isFailed
                          ? "bg-rose-400 shadow-[0_0_8px_#F43F5E]"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isDone
                        ? "bg-emerald-500/10 text-emerald-400"
                        : isRunning
                        ? "bg-signal-cyan/10 text-signal-cyan"
                        : "bg-white/[0.04] text-outline"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight">{config.title}</h3>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-outline pt-2 border-t border-white/[0.06]">
                  <span>
                    {isDone
                      ? "Completed"
                      : isRunning
                      ? "Synthesizing..."
                      : isFailed
                      ? "Failed"
                      : "Queued"}
                  </span>
                  <span className="text-signal-cyan hover:underline">
                    {activeTab === key ? "Show all" : "Focus view"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Structured Content Cards */}
      <div className="space-y-6">
        {Object.entries(STAGE_CONFIG).map(([key, config]) => {
          if (activeTab !== "all" && activeTab !== key) return null;

          const stage = stages.find((s) => s.stage_name === key);
          const parsedData = stage?.output ? parseStageOutput(stage.output, key) : null;
          const stageContext = parseStageContext(stage?.input_context);
          const showRaw = rawViewStages[key];
          const Icon = config.icon;

          return (
            <Card key={key} id={`stage-${key}`} variant="prominent" className="overflow-hidden">
              {/* Stage Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.08] bg-black/40">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${config.colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-outline uppercase tracking-wider font-bold">
                        {config.label}
                      </span>
                      <span className="text-outline/40">&bull;</span>
                      <h2 className="text-base sm:text-lg font-bold text-white">{config.title}</h2>
                    </div>
                    {typeof stage?.duration_seconds === "number" && stage.duration_seconds > 0 ? (
                      <span className="text-[11px] font-mono text-outline">
                        Execution time: {stage.duration_seconds.toFixed(2)}s
                      </span>
                    ) : null}
                    {stageContext?.provider && (
                      <span className="text-[11px] font-mono text-outline/80 block">
                        Provider: {stageContext.provider}
                        {stageContext.fallback_reason ? ` (${stageContext.fallback_reason})` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {stage?.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRaw(key)}
                      className="h-7 text-xs border-white/10"
                    >
                      {showRaw ? "Structured View" : "Raw JSON"}
                    </Button>
                  )}
                  <Badge
                    variant={
                      stage?.status === "completed"
                        ? "success"
                        : stage?.status === "running"
                        ? "cyan"
                        : stage?.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                    dot
                    pulse={stage?.status === "running"}
                    className="font-mono text-xs"
                  >
                    {stage?.status?.toUpperCase() || "PENDING"}
                  </Badge>
                </div>
              </div>

              {/* Stage Card Body */}
              <CardContent className="p-6">
                {stage?.status === "failed" && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <p className="font-bold flex items-center gap-1.5 text-sm mb-1 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Agent Execution Error</span>
                    </p>
                    <p className="font-mono text-xs leading-relaxed">
                      {stage.error_message || "Unknown pipeline error occurred."}
                    </p>
                  </div>
                )}

                {stage?.status === "running" && (
                  <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-signal-cyan border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-white">
                      Agent is synthesizing architectural specification...
                    </p>
                    <p className="text-xs font-mono text-outline">Streaming AST validation</p>
                  </div>
                )}

                {(!stage || stage.status === "pending") && (
                  <div className="p-10 text-center text-outline text-xs font-mono">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-outline/50" />
                    <p>Pending execution. Will trigger automatically once dependencies complete.</p>
                  </div>
                )}

                {stage?.status === "completed" && (
                  <>
                    {showRaw ? (
                      <pre className="p-4 rounded-xl bg-black/80 border border-white/[0.08] font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                        {JSON.stringify(parsedData, null, 2)}
                      </pre>
                    ) : (
                      <StageStructuredView stageName={key} data={parsedData} />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4-Stage Completion Bottom Deck with Direct Downloads */}
      {(completedStagesCount === 4 || status === "completed") && (
        <Card variant="prominent" className="p-6 sm:p-8 relative overflow-hidden border-emerald-500/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-signal-cyan via-signal-violet to-emerald-400" />
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="success" dot className="font-mono text-xs">
                  All 4 Stages Verified
                </Badge>
                <span className="text-outline text-xs font-mono">&bull; Ready for Production</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Download Complete Architectural Dossier
              </h3>
              <p className="text-xs sm:text-sm text-outline max-w-2xl leading-relaxed">
                System architecture, database schemas, sprint planning tickets, and adversarial security audits are verified. Choose your export format:
              </p>
            </div>
          </div>

          {/* 3 Download Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
            {/* Markdown */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] hover:border-signal-cyan/40 transition-all flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-signal-cyan/10 text-signal-cyan">
                    <FileCode2 className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    .md
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-signal-cyan transition-colors">
                    Markdown Document
                  </h4>
                  <p className="text-xs text-outline mt-1 leading-snug">
                    Raw GitHub-flavored markdown with code blocks, schemas, and tables for READMEs or PRDs.
                  </p>
                </div>
              </div>
              <a
                href={`/api/workflows/${id}/export.md`}
                download={`flowforge_report_${id.substring(0, 8)}.md`}
                className="w-full"
              >
                <Button variant="secondary" size="sm" className="w-full text-xs font-bold border-white/10">
                  <Download className="w-3.5 h-3.5 mr-1 text-signal-cyan" />
                  <span>Download .md</span>
                </Button>
              </a>
            </div>

            {/* PDF */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] hover:border-rose-500/40 transition-all flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant="destructive" className="font-mono text-[10px]">
                    .pdf
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                    Executive PDF Dossier
                  </h4>
                  <p className="text-xs text-outline mt-1 leading-snug">
                    Professional, formatted architectural dossier with styling, tables, and audit breakdown.
                  </p>
                </div>
              </div>
              <a
                href={`/api/workflows/${id}/export.pdf`}
                download={`flowforge_report_${id.substring(0, 8)}.pdf`}
                className="w-full"
              >
                <Button variant="secondary" size="sm" className="w-full text-xs font-bold border-white/10">
                  <Download className="w-3.5 h-3.5 mr-1 text-rose-400" />
                  <span>Download .pdf</span>
                </Button>
              </a>
            </div>

            {/* DOCX */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.08] hover:border-signal-indigo/40 transition-all flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-signal-indigo/10 text-signal-indigo">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant="indigo" className="font-mono text-[10px]">
                    .docx
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-signal-indigo transition-colors">
                    Word Document (DOCX)
                  </h4>
                  <p className="text-xs text-outline mt-1 leading-snug">
                    Fully editable Microsoft Word document with tables, bullet lists, and formatted sections.
                  </p>
                </div>
              </div>
              <a
                href={`/api/workflows/${id}/export.docx`}
                download={`flowforge_report_${id.substring(0, 8)}.docx`}
                className="w-full"
              >
                <Button variant="secondary" size="sm" className="w-full text-xs font-bold border-white/10">
                  <Download className="w-3.5 h-3.5 mr-1 text-signal-indigo" />
                  <span>Download .docx</span>
                </Button>
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Verified Web Citations Component ──────────────────────────────────────

function WebSourcesSection({ sources }: { sources?: any[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <Card variant="subtle" className="mt-4 p-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
        <h4 className="text-xs font-bold text-signal-cyan flex items-center gap-2 uppercase tracking-wider font-mono">
          <ExternalLink className="w-4 h-4" />
          <span>Verified Web Sources ({sources.length})</span>
        </h4>
        <span className="text-[11px] font-mono text-outline">Autonomous Research Engine</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((s, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-signal-cyan/40 transition-all flex flex-col justify-between gap-2"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {s.domain || "web"}
                </Badge>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-signal-cyan hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Visit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h5 className="text-xs font-bold text-white line-clamp-1">{s.title}</h5>
              {s.snippet && <p className="text-[11px] text-outline line-clamp-2 mt-1">{s.snippet}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Structured View Component for Each Stage ──────────────────────────────

function StageStructuredView({ stageName, data }: { stageName: string; data: any }) {
  if (!data) return <p className="text-outline text-xs font-mono">No structured data available.</p>;
  const resolved =
    data && typeof data === "object" && data[stageName] && typeof data[stageName] === "object"
      ? data[stageName]
      : data;
  data = resolved;

  // Stage 1: Requirements Analysis
  if (stageName === "requirements") {
    return (
      <div className="flex flex-col gap-6">
        {data.summary && (
          <div className="p-4 rounded-xl bg-signal-cyan/5 border border-signal-cyan/20">
            <span className="text-xs font-mono text-signal-cyan uppercase font-bold tracking-wider block mb-1">
              Executive Summary
            </span>
            <p className="text-sm text-white/90 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {data.priority_classification && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <span className="text-xs font-mono text-outline uppercase">Priority:</span>
            <Badge variant="indigo" className="text-xs font-mono">
              {data.priority_classification}
            </Badge>
          </div>
        )}

        {/* Functional Requirements */}
        {data.functional_requirements && data.functional_requirements.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <FileCheck className="w-4 h-4 text-signal-cyan" />
              <span>Functional Requirements ({data.functional_requirements.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.functional_requirements.map((fr: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-black/40 border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-signal-cyan px-2 py-0.5 rounded bg-signal-cyan/10 border border-signal-cyan/20">
                      {fr.id || `FR-${i + 1}`}
                    </span>
                    <Badge
                      variant={
                        fr.priority === "High" || fr.priority === "Critical"
                          ? "destructive"
                          : fr.priority === "Medium"
                          ? "warning"
                          : "cyan"
                      }
                      className="text-[10px] font-mono uppercase"
                    >
                      {fr.priority || "Normal"}
                    </Badge>
                  </div>
                  <h5 className="text-sm font-bold text-white">{fr.title}</h5>
                  <p className="text-xs text-outline leading-relaxed">{fr.description}</p>
                  {fr.acceptance_criteria && fr.acceptance_criteria.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/[0.06]">
                      <span className="text-[11px] text-outline uppercase font-mono font-bold block mb-1.5">
                        Acceptance Criteria:
                      </span>
                      <ul className="space-y-1.5">
                        {fr.acceptance_criteria.map((c: string, ci: number) => (
                          <li key={ci} className="text-xs text-outline flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-white/80">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Stories */}
        {data.user_stories && data.user_stories.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-signal-indigo" />
              <span>User Stories</span>
            </h4>
            <div className="space-y-2">
              {data.user_stories.map((story: string, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-black/30 border border-white/[0.06] text-xs text-slate-300 flex items-center gap-3"
                >
                  <span className="font-mono text-signal-indigo font-bold shrink-0">{i + 1}.</span>
                  <span>{story}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {data.risk_assessment && data.risk_assessment.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Risk Assessment &amp; Mitigations</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-outline text-[11px] uppercase tracking-wider font-mono">
                  <tr>
                    <th className="p-3">Identified Risk</th>
                    <th className="p-3 w-28">Impact</th>
                    <th className="p-3">Mitigation Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {data.risk_assessment.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-medium text-white">{r.risk}</td>
                      <td className="p-3">
                        <Badge
                          variant={r.impact === "High" ? "destructive" : "warning"}
                          className="text-[10px] uppercase font-mono"
                        >
                          {r.impact}
                        </Badge>
                      </td>
                      <td className="p-3 text-outline">{r.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verified Web Citations */}
        <WebSourcesSection sources={data.web_sources} />
      </div>
    );
  }

  // Stage 2: Solution Design
  if (stageName === "design") {
    return (
      <div className="flex flex-col gap-6">
        {data.summary && (
          <div className="p-4 rounded-xl bg-signal-indigo/5 border border-signal-indigo/20">
            <span className="text-xs font-mono text-signal-indigo uppercase font-bold tracking-wider block mb-1">
              Architecture Overview
            </span>
            <p className="text-sm text-white/90 leading-relaxed">{data.summary}</p>
            {data.architecture_pattern && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-xs font-mono text-outline uppercase">Pattern:</span>
                <Badge variant="indigo" className="text-xs font-mono">
                  {data.architecture_pattern}
                </Badge>
              </div>
            )}
            {data.architecture_rationale && (
              <p className="mt-2 text-xs text-outline italic">Rationale: {data.architecture_rationale}</p>
            )}
          </div>
        )}

        {/* Technology Stack Grid */}
        {data.technology_stack && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Layers className="w-4 h-4 text-signal-indigo" />
              <span>Technology Stack Matrix</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(data.technology_stack).map(([cat, details]: [string, any], i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col gap-2.5"
                >
                  <span className="text-xs font-mono font-bold uppercase text-signal-indigo tracking-wider">
                    {cat}
                  </span>
                  {typeof details === "object" ? (
                    <div className="space-y-1.5 text-xs">
                      {Object.entries(details).map(([k, v]: [string, any], ki) => (
                        <div key={ki} className="flex justify-between border-b border-white/[0.04] pb-1">
                          <span className="text-outline capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="font-mono text-white text-[11px]">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white">{String(details)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Contracts */}
        {data.api_contracts && data.api_contracts.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Code2 className="w-4 h-4 text-signal-cyan" />
              <span>API Contracts ({data.api_contracts.length})</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-outline text-[11px] uppercase tracking-wider font-mono">
                  <tr>
                    <th className="p-3 w-24">Method</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-mono text-xs">
                  {data.api_contracts.map((api: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <Badge
                          variant={
                            api.method === "GET"
                              ? "cyan"
                              : api.method === "POST"
                              ? "success"
                              : api.method === "PUT"
                              ? "warning"
                              : "destructive"
                          }
                          className="font-mono text-[10px] font-bold"
                        >
                          {api.method}
                        </Badge>
                      </td>
                      <td className="p-3 text-white font-medium">{api.endpoint}</td>
                      <td className="p-3 text-outline font-sans text-xs">{api.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visual Component Architecture Diagram & Download */}
        {data.component_diagram && (
          <div className="mt-2">
            <MermaidViewer
              chart={data.component_diagram}
              title="Component Architecture Diagram"
              filename="flowforge-feature-architecture"
            />
          </div>
        )}

        {/* Verified Web Citations */}
        <WebSourcesSection sources={data.web_sources} />
      </div>
    );
  }

  // Stage 3: Implementation Planning
  if (stageName === "implementation") {
    return (
      <div className="flex flex-col gap-6">
        {data.summary && (
          <div className="p-4 rounded-xl bg-signal-violet/5 border border-signal-violet/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-signal-violet uppercase font-bold tracking-wider block mb-1">
                Implementation Roadmap
              </span>
              <p className="text-sm text-white/90 leading-relaxed">{data.summary}</p>
            </div>
            {data.total_estimated_effort && (
              <div className="px-3.5 py-2 rounded-xl bg-signal-violet/20 border border-signal-violet/30 text-center shrink-0">
                <span className="text-[10px] font-mono text-outline uppercase block">Est. Effort</span>
                <span className="text-lg font-bold text-signal-violet font-mono">
                  {data.total_estimated_effort}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Milestones & Tasks */}
        {data.milestones && data.milestones.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <ListTodo className="w-4 h-4 text-signal-violet" />
              <span>Sprint Milestones &amp; Tasks</span>
            </h4>
            <div className="space-y-4">
              {data.milestones.map((m: any, mi: number) => (
                <div key={mi} className="rounded-xl bg-black/40 border border-white/[0.08] p-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-signal-violet/20 text-signal-violet font-bold">
                        {m.id || `M${mi + 1}`}
                      </span>
                      <h5 className="text-sm font-bold text-white">{m.title}</h5>
                    </div>
                    {m.target && (
                      <span className="text-xs text-outline font-mono">{m.target}</span>
                    )}
                  </div>

                  {m.tasks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {m.tasks.map((t: any, ti: number) => (
                        <div
                          key={ti}
                          className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-outline">{t.id}</span>
                            <Badge
                              variant={t.priority === "Critical" ? "destructive" : "indigo"}
                              className="text-[10px] font-mono uppercase"
                            >
                              {t.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-white font-medium">{t.title}</p>
                          <div className="flex items-center justify-between text-[11px] text-outline font-mono pt-1 border-t border-white/[0.04]">
                            <span>
                              Effort: <strong className="text-signal-cyan">{t.effort}</strong>
                            </span>
                            {t.dependencies && t.dependencies.length > 0 && (
                              <span>Deps: {t.dependencies.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testing Strategy */}
        {data.testing_strategy && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Testing Strategy Matrix</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(data.testing_strategy).map(([k, v]: [string, any], i) => (
                <div key={i} className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                  <span className="text-xs font-mono font-bold uppercase text-outline block mb-1">
                    {k.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-white leading-relaxed">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stage 4: Code Review
  if (stageName === "review") {
    return (
      <div className="flex flex-col gap-6">
        {data.summary && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider block mb-1">
              Audit Verdict &amp; Quality Assessment
            </span>
            <p className="text-sm text-white/90 leading-relaxed font-medium">{data.summary}</p>
            {data.overall_assessment && (
              <p className="mt-2 text-xs text-outline leading-relaxed">{data.overall_assessment}</p>
            )}
          </div>
        )}

        {/* Quality Checklist */}
        {data.code_quality_checklist && data.code_quality_checklist.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Code Quality Checklist ({data.code_quality_checklist.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.code_quality_checklist.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] flex items-start justify-between gap-3"
                >
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.item}</h5>
                    <p className="text-[11px] text-outline mt-0.5">{item.details}</p>
                  </div>
                  <Badge
                    variant={
                      item.status === "Pass"
                        ? "success"
                        : item.status === "Review"
                        ? "warning"
                        : "destructive"
                    }
                    className="text-[10px] font-mono uppercase shrink-0"
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Review & Anti-Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.security_review && (
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Security Review</span>
              </h4>
              <div className="space-y-2">
                {data.security_review.map((sec: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-black/40 border border-rose-500/20 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{sec.concern}</span>
                      <Badge variant="destructive" className="text-[10px] font-mono uppercase">
                        {sec.severity}
                      </Badge>
                    </div>
                    <p className="text-outline text-[11px] leading-relaxed">{sec.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.potential_anti_patterns && (
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Anti-Pattern Audits</span>
              </h4>
              <div className="space-y-2">
                {data.potential_anti_patterns.map((ap: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{ap.pattern}</span>
                      <Badge variant="warning" className="text-[10px] font-mono uppercase">
                        {ap.risk} Risk
                      </Badge>
                    </div>
                    <p className="text-outline text-[11px] leading-relaxed">{ap.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback if schema is unrecognized
  return (
    <pre className="p-4 rounded-xl bg-black/80 border border-white/[0.08] font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
