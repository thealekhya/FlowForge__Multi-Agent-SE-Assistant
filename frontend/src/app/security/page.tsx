import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Server,
  Terminal,
  Cpu,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Mail,
  Fingerprint,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Security Posture — FlowForge AI",
  description: "Overview of FlowForge AI's multi-layered security controls, Clerk authentication, zero-trust isolation, and agent sandboxing.",
};

export default function SecurityPage() {
  return (
    <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 mx-auto py-12 flex flex-col gap-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-outline font-mono">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-signal-violet font-semibold">Security Posture</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-8">
        <div className="flex items-center gap-2">
          <Badge variant="violet" dot className="text-xs uppercase font-mono tracking-wider font-semibold">
            Zero-Trust Engineering Baseline
          </Badge>
          <span className="text-xs text-outline font-mono">Continuous Compliance — 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Security &amp; Architecture Posture
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
          FlowForge AI orchestrates complex autonomous engineering workflows across multiple AI agents. 
          Security is built directly into every layer of our stack—from user authentication and proxy edge routing 
          to LLM gateway sandboxing and telemetry isolation.
        </p>
      </div>

      {/* 4 Security Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-violet/10 border border-signal-violet/30 flex items-center justify-center text-signal-violet">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Cryptographic Multi-Tenant Isolation</h3>
          <p className="text-xs text-outline leading-relaxed">
            Every pipeline run and database record is tagged with an immutable Clerk user identity. Query filters enforce zero cross-tenant visibility; unauthorized probes trigger opaque 404 responses.
          </p>
        </Card>

        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-cyan/10 border border-signal-cyan/30 flex items-center justify-center text-signal-cyan">
            <Fingerprint className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Next-Gen Authentication via Clerk</h3>
          <p className="text-xs text-outline leading-relaxed">
            Biometric Passkeys (FIDO2 / WebAuthn), OAuth 2.0 with leading enterprise identity providers, automatic session rotation, and CSRF token verification protect your account.
          </p>
        </Card>

        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-indigo/10 border border-signal-indigo/30 flex items-center justify-center text-signal-indigo">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Autonomous Agent Sandboxing</h3>
          <p className="text-xs text-outline leading-relaxed">
            Our LangGraph nodes execute with isolated, structured Pydantic schemas. System prompts strictly delineate agent roles and prevent unconstrained execution or prompt injection traversal.
          </p>
        </Card>

        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">End-to-End Transport Encryption</h3>
          <p className="text-xs text-outline leading-relaxed">
            All network communication—including browser-to-Next.js proxy, Next.js-to-FastAPI backend, and backend-to-frontier LLM endpoints—is strictly enforced over modern TLS 1.3.
          </p>
        </Card>
      </div>

      {/* Deep-Dive Technical Sections */}
      <div className="flex flex-col gap-8 text-on-surface-variant text-sm leading-relaxed">
        {/* Deep Dive 1: Auth & Edge Protection */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-signal-violet" />
            <span>Edge Middleware &amp; Route Protection</span>
          </h2>
          <p>
            FlowForge AI leverages Next.js 16 Edge proxy middleware (<code className="text-signal-cyan font-mono">proxy.ts</code>) coupled with Clerk server authentication:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1.5">
              <span className="font-bold text-white font-mono uppercase text-[11px] text-signal-cyan">Edge Guard</span>
              <p className="text-outline">
                All protected paths (<code className="text-white">/create</code>, <code className="text-white">/history</code>, <code className="text-white">/research</code>, <code className="text-white">/workflows/*</code>) are intercepted prior to page hydration.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1.5">
              <span className="font-bold text-white font-mono uppercase text-[11px] text-signal-violet">Identity Forwarding</span>
              <p className="text-outline">
                Authenticated sessions automatically inject validated <code className="text-white font-mono">X-User-Id</code> headers into upstream backend rewrites, preventing client spoofing.
              </p>
            </div>
          </div>
        </section>

        {/* Deep Dive 2: LLM Gateway Security */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-signal-indigo" />
            <span>Multi-Agent LangGraph Security Boundary</span>
          </h2>
          <p>
            The FlowForge AI pipeline decomposes feature delivery into four autonomous stages (Requirements, Architecture Design, Implementation Planning, Code Review):
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-outline">
            <li><strong className="text-white">Structured Output Validation:</strong> All LLM responses are parsed strictly through Pydantic V2 schemas. Any payload that violates the schema fails validation and triggers an automated correction step.</li>
            <li><strong className="text-white">Zero Data Retention (ZDR) APIs:</strong> API calls to Anthropic Claude 3.7 and OpenAI GPT-4o are routed through enterprise contracts guaranteeing that customer data is neither logged nor retained.</li>
            <li><strong className="text-white">Prompt Injection Defense:</strong> System prompts use delimiters, type constraints, and task-specific instruction encapsulation to minimize indirect prompt injection risks.</li>
          </ul>
        </section>

        {/* Deep Dive 3: Data at Rest & Deletion SLA */}
        <section className="flex flex-col gap-4 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>Data Storage &amp; Cascading Purge SLA</span>
          </h2>
          <p>
            Database entries are stored locally within our SQLite async SQLAlchemy engine:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 text-xs text-outline">
            <li><strong className="text-white">Foreign Key Cascades:</strong> Workflows use <code className="text-white font-mono">ON DELETE CASCADE</code> constraints. Deleting a workflow purges all four stages, token usage metrics, error logs, and generated artifacts in a single atomic transaction.</li>
            <li><strong className="text-white">No Hidden Backups:</strong> Once deleted by a user, deleted workflow records are immediately wiped from active disk storage.</li>
          </ul>
        </section>

        {/* Vulnerability Reporting Section */}
        <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-panel to-surface-panel-hover flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-signal-violet" />
              <span>Responsible Vulnerability Disclosure</span>
            </h3>
            <p className="text-xs text-outline">
              Found a security bug or potential vulnerability? We prioritize security reports with an initial response SLA of under 24 hours.
            </p>
          </div>
          <a
            href="mailto:security@flowforge.ai"
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-signal-violet text-xs font-semibold text-white transition-all"
          >
            security@flowforge.ai
          </a>
        </div>
      </div>
    </div>
  );
}
