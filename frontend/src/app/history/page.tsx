'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  History,
  Search,
  RefreshCw,
  PlusCircle,
  FileDown,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  X,
  FileText,
  Workflow,
  Lock,
} from "lucide-react";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";

interface WorkflowItem {
  id: string;
  user_id?: string;
  feature_request: string;
  status: string;
  created_at: string;
  updated_at: string;
  stage_count?: number;
}

export default function HistoryPage() {
  const { userId, isLoaded } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportMenuWfId, setExportMenuWfId] = useState<string | null>(null);

  const loadWorkflows = (uid?: string | null) => {
    const currentUid = uid !== undefined ? uid : userId;
    setLoading(true);
    const headers: Record<string, string> = {};
    if (currentUid) {
      headers["X-User-Id"] = currentUid;
    }

    fetch("/api/workflows", { headers, cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Proxy error");
        return r.json();
      })
      .then((data) => {
        setWorkflows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        fetch(`${API_BASE_URL}/api/workflows`, { headers, cache: "no-store" })
          .then((r) => r.json())
          .then((data) => {
            setWorkflows(Array.isArray(data) ? data : []);
            setLoading(false);
          })
          .catch(() => {
            setWorkflows([]);
            setLoading(false);
          });
      });
  };

  useEffect(() => {
    if (!isLoaded) return;
    loadWorkflows(userId);

    const handleDocumentClick = () => setExportMenuWfId(null);
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [userId, isLoaded]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete workflow #${id.substring(0, 8)}?`)) return;

    setDeletingId(id);
    const headers: Record<string, string> = {};
    if (userId) {
      headers["X-User-Id"] = userId;
    }

    try {
      let res = await fetch(`/api/workflows/${id}`, { method: "DELETE", headers }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${API_BASE_URL}/api/workflows/${id}`, { method: "DELETE", headers });
      }
      if (res.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      } else {
        alert("Failed to delete workflow");
      }
    } catch {
      alert("Error deleting workflow");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = (e: React.MouseEvent, id: string, format: "md" | "pdf" | "docx") => {
    e.preventDefault();
    e.stopPropagation();
    setExportMenuWfId(null);
    window.open(`${API_BASE_URL}/api/workflows/${id}/export?format=${format}`, "_blank");
  };

  const filtered = workflows.filter((w) => {
    const matchesSearch =
      w.feature_request.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || w.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // KPI Metrics calculation
  const totalCount = workflows.length;
  const completedCount = workflows.filter((w) => w.status === "completed").length;
  const runningCount = workflows.filter((w) => w.status === "running").length;
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

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
              Sign in to Access Pipeline History
            </h2>

            <p className="text-sm text-outline max-w-md mx-auto mb-8 leading-relaxed">
              Authentication via Clerk is required to review past architectural breakdowns, inspect execution telemetry, and download exported project artifacts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <SignInButton mode="modal" forceRedirectUrl="/history">
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Badge variant="violet" dot pulse className="font-mono uppercase tracking-widest text-[11px] w-fit">
                Workflow Registry
              </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Execution History &amp; Pipeline Traces
          </h1>
          <p className="text-sm text-outline max-w-xl leading-relaxed">
            Query past architectural breakdowns, live LangGraph DAG executions, and export production-ready Markdown, PDF, or Word deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadWorkflows()}
            isLoading={loading}
            className="flex items-center gap-2 border-white/10"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/create">
            <Button size="sm" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>New Workflow</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="subtle" className="p-4 flex flex-col gap-1 border-white/[0.08]">
          <span className="text-xs font-mono text-outline uppercase tracking-wider flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5 text-signal-cyan" />
            <span>Total Pipelines</span>
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
            {totalCount}
          </span>
          <span className="text-[11px] text-outline">All recorded synthesis runs</span>
        </Card>

        <Card variant="subtle" className="p-4 flex flex-col gap-1 border-white/[0.08]">
          <span className="text-xs font-mono text-outline uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed Plans</span>
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {completedCount}
          </span>
          <span className="text-[11px] text-outline">100% 4-stage deliverables</span>
        </Card>

        <Card variant="subtle" className="p-4 flex flex-col gap-1 border-white/[0.08]">
          <span className="text-xs font-mono text-outline uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-signal-indigo" />
            <span>Success Rate</span>
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
            {successRate}%
          </span>
          <span className="text-[11px] text-outline">Reliable AI delivery rate</span>
        </Card>

        <Card variant="subtle" className="p-4 flex flex-col gap-1 border-white/[0.08]">
          <span className="text-xs font-mono text-outline uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-signal-violet" />
            <span>Active Agents</span>
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-signal-violet font-mono mt-1">
            4 / run
          </span>
          <span className="text-[11px] text-outline">Requirements to Audit</span>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card variant="default" className="p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by feature or UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: "all", label: "All", count: totalCount },
              { id: "completed", label: "Completed", count: completedCount },
              { id: "running", label: "Running", count: runningCount },
              { id: "failed", label: "Failed", count: workflows.filter((w) => w.status === "failed").length },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  filterStatus === st.id
                    ? "bg-white/[0.14] text-white border border-white/20 shadow-sm"
                    : "text-outline hover:text-white hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Workflows Table Card */}
      <Card variant="prominent" className="overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-outline flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-signal-cyan animate-spin text-3xl">
              progress_activity
            </span>
            <p className="text-sm font-mono">Querying workflow cluster registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-outline flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-1">
              <History className="w-6 h-6 text-outline" />
            </div>
            <h3 className="text-base font-bold text-white">No workflows match your query</h3>
            <p className="text-xs text-outline max-w-sm">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search query or switching your status filter filter."
                : "You haven't launched any feature planning workflows yet."}
            </p>
            <Link href="/create" className="mt-2">
              <Button size="sm">Launch First Workflow</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/40 text-[11px] font-mono uppercase tracking-wider text-outline">
                  <th className="px-6 py-3.5 font-bold w-32">Pipeline ID</th>
                  <th className="px-6 py-3.5 font-bold">Feature Request Specification</th>
                  <th className="px-6 py-3.5 font-bold w-36">Status</th>
                  <th className="px-6 py-3.5 font-bold w-40">Created</th>
                  <th className="px-6 py-3.5 font-bold text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs">
                {filtered.map((wf) => (
                  <tr
                    key={wf.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 font-mono">
                      <Link
                        href={`/workflows/${wf.id}`}
                        className="text-signal-cyan font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>#{wf.id.substring(0, 8)}</span>
                      </Link>
                    </td>

                    {/* Specification */}
                    <td className="px-6 py-4 max-w-md">
                      <Link href={`/workflows/${wf.id}`} className="block">
                        <span className="font-medium text-white group-hover:text-signal-indigo transition-colors line-clamp-2 leading-relaxed">
                          {wf.feature_request}
                        </span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          wf.status === "completed"
                            ? "success"
                            : wf.status === "failed"
                            ? "destructive"
                            : "cyan"
                        }
                        dot
                        pulse={wf.status === "running"}
                        className="text-[11px] font-mono"
                      >
                        {wf.status.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 font-mono text-outline text-[11px]">
                      {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        {/* Open Detail */}
                        <Link href={`/workflows/${wf.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-white"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3 ml-1 text-outline" />
                          </Button>
                        </Link>

                        {/* Export Dropdown Trigger */}
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExportMenuWfId(exportMenuWfId === wf.id ? null : wf.id);
                            }}
                            className="h-7 px-2 text-xs border-white/10"
                            title="Export options"
                          >
                            <FileDown className="w-3.5 h-3.5 text-signal-cyan" />
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          </Button>

                          {/* Dropdown Menu */}
                          {exportMenuWfId === wf.id && (
                            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-zinc-950/95 border border-white/15 shadow-2xl backdrop-blur-2xl py-1 z-50 text-left animate-fade-in">
                              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-outline tracking-wider border-b border-white/[0.08]">
                                Download Plan
                              </div>
                              <button
                                onClick={(e) => handleExport(e, wf.id, "pdf")}
                                className="w-full px-3 py-2 text-xs text-white hover:bg-white/[0.08] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-rose-400" />
                                <span>PDF Document</span>
                              </button>
                              <button
                                onClick={(e) => handleExport(e, wf.id, "docx")}
                                className="w-full px-3 py-2 text-xs text-white hover:bg-white/[0.08] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                <span>Word (DOCX)</span>
                              </button>
                              <button
                                onClick={(e) => handleExport(e, wf.id, "md")}
                                className="w-full px-3 py-2 text-xs text-white hover:bg-white/[0.08] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Markdown File</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, wf.id)}
                          disabled={deletingId === wf.id}
                          className="h-7 w-7 text-outline hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete workflow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </Card>
      </div>
    </Show>
  </>
);
}
