'use client';
import Link from "next/link";
import { useState, useEffect } from "react";
import { Show, SignInButton } from "@clerk/nextjs";
import { BubbleBackground, BubbleBackgroundDemo } from '@/components/animate-ui/components/backgrounds/bubble';
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";

const TOUR_STEPS = [
  {
    step: "00",
    badge: "GLOBAL TOPOLOGY",
    title: "LangGraph Multi-Agent Orchestration",
    badgeColor: "text-signal-cyan bg-signal-cyan/10 border-signal-cyan/30",
    summary: "FlowForge AI compiles a directed acyclic graph (StateGraph) where 4 specialized AI agents execute sequentially with shared typed state, SSE streaming, and live web browser intelligence.",
    bullets: [
      "StateGraph Pipeline: requirements → design → implementation → review → END",
      "Live DuckDuckGo Web Search: Gathers modern libraries and benchmarks in real time",
      "Real-time Telemetry: SSE event bus publishes per-node state transitions directly to the UI",
      "Persistent Storage: SQLite database with async SQLAlchemy ORM captures complete run history",
    ],
    codePreview: {
      lang: "python",
      label: "langgraph_pipeline/graph.py",
      code: `graph = StateGraph(WorkflowState)
graph.add_node("requirements", requirements_node)
graph.add_node("design", design_node)
graph.add_node("implementation", implementation_node)
graph.add_node("review", review_node)

graph.set_entry_point("requirements")
graph.add_edge("requirements", "design")
graph.add_edge("design", "implementation")
graph.add_edge("implementation", "review")
graph.add_edge("review", END)`
    }
  },
  {
    step: "01",
    badge: "STAGE 01 // ANALYSIS",
    title: "Autonomous Requirements Decomposition",
    badgeColor: "text-signal-cyan bg-signal-cyan/10 border-signal-cyan/30",
    summary: "Deconstructs unstructured user product intent into verified functional specifications, non-functional security/performance requirements, user stories, and a risk mitigation matrix.",
    bullets: [
      "Autonomous Web Crawling: Discovers domain-specific compliance standards and OWASP baselines",
      "Pydantic Validation: Guarantees strict typed output contracts with zero hallucination drift",
      "Risk Mitigation: Automatically generates failure-mode defenses and fallback architectures",
    ],
    codePreview: {
      lang: "json",
      label: "requirements_output.json",
      code: `{
  "summary": "Real-time collaborative document editor with CRDT sync",
  "functional_requirements": [
    { "id": "FR-001", "title": "WebSocket Connection Lifecycle", "priority": "High" },
    { "id": "FR-002", "title": "CRDT Conflict-Free State Merging", "priority": "Critical" }
  ],
  "priority_classification": "High - Core Multi-user Infrastructure",
  "web_sources": [
    { "title": "Yjs CRDT Docs", "domain": "github.com", "url": "https://github.com/yjs/yjs" }
  ]
}`
    }
  },
  {
    step: "02",
    badge: "STAGE 02 // ARCHITECTURE",
    title: "Relational Schema & System Design",
    badgeColor: "text-signal-indigo bg-signal-indigo/10 border-signal-indigo/30",
    summary: "Synthesizes production architecture patterns, technology stack layers (frontend, backend, database, AI), type-safe REST API contracts, and Mermaid component diagrams.",
    bullets: [
      "Living Tech Stack Matrix: Maps frameworks, databases, and communication protocols",
      "API Contracts: Formal HTTP methods, routes, and response schemas",
      "Mermaid Diagram Synthesis: Generates visual graph diagrams rendered live in the browser",
    ],
    codePreview: {
      lang: "mermaid",
      label: "component_diagram.mmd",
      code: `graph TD
  Client[React / Next.js Client] -->|WebSocket & REST| Gateway[FastAPI ASGI Gateway]
  Gateway -->|State Sync| YjsCRDT[CRDT Sync Engine]
  Gateway -->|Async ORM| SQLite[(SQLite / PostgreSQL DB)]
  Gateway -->|Telemetry| SSEBus[SSE Event Stream]`
    }
  },
  {
    step: "03",
    badge: "STAGE 03 // ROADMAP",
    title: "Implementation Planning & Sprint DAG",
    badgeColor: "text-signal-violet bg-signal-violet/10 border-signal-violet/30",
    summary: "Organizes engineering execution into prioritized sprint milestones, atomic tasks (<250 LOC targets), realistic effort estimations, and testing strategies.",
    bullets: [
      "Topological Ordering: Ensures foundational schema migrations precede service integrations",
      "Atomic Task Sizing: Prevents massive PR blockers by decomposing features into reviewable chunks",
      "Comprehensive Testing Strategy: Outlines unit, integration, and end-to-end test coverage targets",
    ],
    codePreview: {
      lang: "json",
      label: "implementation_plan.json",
      code: `{
  "milestones": [
    {
      "id": "M1",
      "title": "Core Protocol & State Synchronization",
      "tasks": [
        { "id": "T-101", "title": "WebSocket Gateway Handler", "effort": "4h", "priority": "Critical" },
        { "id": "T-102", "title": "Yjs In-Memory Doc Store", "effort": "6h", "priority": "High" }
      ]
    }
  ],
  "total_estimated_effort": "38h"
}`
    }
  },
  {
    step: "04",
    badge: "STAGE 04 // SECURITY GATE",
    title: "Adversarial Code Review & Security Audit",
    badgeColor: "text-signal-success bg-signal-success/10 border-signal-success/30",
    summary: "Acts as an adversarial Staff Security Engineer reviewing the complete workflow for OWASP vulnerabilities, architecture anti-patterns, performance bottlenecks, and compliance issues.",
    bullets: [
      "Adversarial Inspection: Proactively probes for authentication bypasses and race conditions",
      "Anti-Pattern Detection: Flags unbounded memory leaks, N+1 queries, and tight coupling",
      "Actionable Mitigations: Recommends specific remediation steps before writing production code",
    ],
    codePreview: {
      lang: "json",
      label: "security_audit.json",
      code: `{
  "code_quality_checklist": [
    { "item": "WebSocket Connection Auth", "status": "Pass", "details": "JWT ticket validated on handshake" },
    { "item": "Document State Concurrency", "status": "Review", "details": "Add write throttle for bursty edits" }
  ],
  "security_review": [
    { "concern": "Cross-Site WebSocket Hijacking", "severity": "Medium", "recommendation": "Enforce Origin header check" }
  ]
}`
    }
  },
];

export default function Home() {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Keyboard navigation for architecture tour modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTourOpen(false);
      if (isTourOpen) {
        if (e.key === "ArrowRight") setTourStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
        if (e.key === "ArrowLeft") setTourStep((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourOpen]);

  // IntersectionObserver for scroll-triggered timeline reveals
  useEffect(() => {
    const timelineStops = document.querySelectorAll('.timeline-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          const node = entry.target.querySelector('.timeline-node');
          if (node) node.classList.add('active-node');
        }
      });
    }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0.2 });
    timelineStops.forEach(stop => observer.observe(stop));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ============================================================ */}
      {/* HERO SECTION (Ultra-Premium Apple-Style Presentation)        */}
      {/* ============================================================ */}
      <section className="w-full max-w-7xl px-gutter-canvas mx-auto flex flex-col items-center text-center mt-6 relative">
        {/* Sleek Bubble Ambient Glow (Animate UI) */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[520px] pointer-events-none opacity-45 -z-10 overflow-hidden rounded-3xl">
          <BubbleBackgroundDemo interactive={true} />
        </div>

        {/* Crystalline Eyebrow Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.14] backdrop-blur-2xl shadow-[0_0_24px_rgba(168,85,247,0.28),inset_0_1px_1px_rgba(255,255,255,0.3)] mb-space-lg transition-all duration-300 hover:scale-[1.03] hover:border-signal-cyan/80 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer group">
          <span className="w-2 h-2 rounded-full bg-signal-cyan shadow-[0_0_8px_#38bdf8] animate-ping"></span>
          <span className="text-label-md font-label-md text-white/90 font-medium tracking-wider uppercase text-[11px] flex items-center gap-1.5">
            <span className="text-signal-cyan font-bold">FlowForge 3.0</span>
            <span className="text-white/30">&bull;</span>
            <span>Autonomous Feature Delivery Pipeline</span>
          </span>
          <span className="material-symbols-outlined text-xs text-outline group-hover:translate-x-0.5 transition-transform">arrow_forward_ios</span>
        </div>

        {/* Massive Apple-Inspired Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-extrabold tracking-[-0.045em] leading-[1.06] max-w-5xl mx-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]">
          <span className="apple-headline block">Transform Feature Requests into</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#818cf8] via-[#c084fc] via-[#38bdf8] to-[#818cf8] animate-text-shimmer inline-block mt-2 drop-shadow-[0_0_45px_rgba(168,85,247,0.45)]">
            Complete Dev Plans
          </span>
        </h1>

        {/* Cinematic Gradient Subtitle */}
        <p className="mt-7 text-sm sm:text-base md:text-lg font-body-md text-slate-300/85 max-w-3xl mx-auto leading-relaxed font-normal bg-gradient-to-b from-white/95 to-slate-400/80 bg-clip-text text-transparent">
          FlowForge AI bridges the gap between raw product requirements and production code. Accelerate engineering delivery with automated AST analysis, relational schema synthesis, and verified DAG execution roadmaps designed for high-velocity teams.
        </p>

        {/* Apple-Caliber Action Buttons */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/create">
              <button className="btn-shimmer relative group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-b from-white/20 via-white/10 to-white/5 border border-white/30 text-white font-semibold text-sm tracking-tight shadow-[0_0_35px_rgba(168,85,247,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:shadow-[0_0_50px_rgba(168,85,247,0.75),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:border-white/50 backdrop-blur-2xl transition-all duration-300 active:scale-[0.98] cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-signal-cyan shadow-[0_0_8px_#38bdf8]"></div>
                <span>Start Workflow</span>
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link className="btn-shimmer relative group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-b from-white/20 via-white/10 to-white/5 border border-white/30 text-white font-semibold text-sm tracking-tight shadow-[0_0_35px_rgba(168,85,247,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:shadow-[0_0_50px_rgba(168,85,247,0.75),inset_0_1px_2px_rgba(255,255,255,0.9)] hover:border-white/50 backdrop-blur-2xl transition-all duration-300 active:scale-[0.98]" href="/create">
              <div className="w-2 h-2 rounded-full bg-signal-cyan shadow-[0_0_8px_#38bdf8]"></div>
              <span>Start Workflow</span>
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </Show>
          <button
            onClick={() => {
              setIsTourOpen(true);
              setTourStep(0);
            }}
            className="btn-shimmer inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-black/50 hover:bg-white/[0.06] text-white font-medium text-sm border border-white/[0.14] hover:border-signal-cyan/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-200 active:scale-[0.98] backdrop-blur-2xl group cursor-pointer"
          >
            <span className="material-symbols-outlined text-signal-cyan text-lg group-hover:scale-110 transition-transform">play_circle</span>
            <span>Interactive Architecture Tour</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* 3D PERSPECTIVE HARDWARE/SOFTWARE VIEWPORT MOCK               */}
        {/* ============================================================ */}
        <div className="hardware-stage-wrapper w-full max-w-6xl mt-12 mb-4 px-2 sm:px-4">
          <div className="hardware-viewport relative rounded-2xl bg-[#090A10]/95 border border-white/[0.16] shadow-[0_30px_100px_-20px_rgba(99,102,241,0.35),0_0_60px_-10px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden text-left">
            {/* Window Titlebar with macOS Traffic Lights */}
            <div className="h-11 px-4 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between backdrop-blur-xl select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 inline-block shadow-[0_0_8px_rgba(255,95,86,0.6)]"></span>
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 inline-block shadow-[0_0_8px_rgba(255,189,46,0.5)]"></span>
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 inline-block shadow-[0_0_8px_rgba(39,201,63,0.6)]"></span>
                <div className="h-4 w-[1px] bg-white/10 ml-2"></div>
                <span className="text-xs text-white/50 font-mono tracking-tight flex items-center gap-1.5 ml-1">
                  <span className="material-symbols-outlined text-sm text-signal-cyan">terminal</span>
                  flowforge://canvas/feature-passkey-auth.dag
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-signal-cyan/10 border border-signal-cyan/20 text-[10px] text-signal-cyan font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse"></span>
                  <span>
                    STREAMING AST: <AnimatedCounter target={48210} suffix=" tokens/s" />
                  </span>
                </div>
                <span className="text-[11px] text-white/40 font-mono">DAG Execution Engine v3.4</span>
              </div>
            </div>

            {/* Holographic Code Viewport */}
            <div className="relative w-full h-[380px] sm:h-[440px] overflow-hidden bg-[#06070B] font-mono text-xs">
              <div className="waterfall-mask absolute inset-0 z-20 pointer-events-none"></div>

              {/* Live Holographic Cursor Beacons */}
              <div className="absolute top-[28%] left-[8%] sm:left-[14%] z-30 flex items-center gap-2 pointer-events-auto group cursor-pointer transition-all hover:scale-105">
                <div className="w-3.5 h-3.5 rounded-full bg-signal-cyan border-2 border-white animate-beacon flex items-center justify-center shadow-[0_0_15px_#38bdf8]">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-black/85 border border-signal-cyan/50 text-signal-cyan font-mono text-[11px] backdrop-blur-md shadow-[0_4px_20px_rgba(6,182,212,0.4)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping"></span>
                  <span>Synthesizing relational schema...</span>
                </div>
              </div>
              <div className="absolute top-[58%] right-[10%] sm:right-[18%] z-30 flex items-center gap-2 pointer-events-auto group cursor-pointer transition-all hover:scale-105">
                <div className="w-3.5 h-3.5 rounded-full bg-signal-violet border-2 border-white animate-beacon flex items-center justify-center shadow-[0_0_15px_#a855f7]">
                  <div className="w-1 h-1 rounded-full bg-white"></div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-black/85 border border-signal-violet/50 text-primary font-mono text-[11px] backdrop-blur-md shadow-[0_4px_20px_rgba(168,85,247,0.4)] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">verified</span>
                  <span>DAG edge verified: Passkey ceremony</span>
                </div>
              </div>

              {/* Triple Waterfall Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 h-full select-none opacity-85">
                {/* Column 1: TypeScript AST */}
                <div className="overflow-hidden relative">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-signal-cyan/70 pb-2 border-b border-white/[0.06] mb-3 flex items-center justify-between">
                    <span>auth_service.ast.ts</span>
                    <span className="text-white/30">PARSER_LIVE</span>
                  </div>
                  <div className="waterfall-col-1 space-y-2 text-[11px] text-slate-300 leading-relaxed font-mono">
                    <p className="text-signal-cyan font-semibold">{`import { WebAuthn, Credential } from "@flowforge/crypto";`}</p>
                    <p className="text-purple-300">{`export async function generateChallenge(userId: UUID): Promise<AuthChallenge> {`}</p>
                    <p className="pl-4 text-slate-400">{`const entropy = crypto.getRandomValues(new Uint8Array(32));`}</p>
                    <p className="pl-4 text-slate-400">{`const challengeToken = Base64URL.encode(entropy);`}</p>
                    <p className="pl-4 text-emerald-400">{`await cache.set(\`auth:chal:\${userId}\`, challengeToken, { ttl: 120 });`}</p>
                    <p className="pl-4 text-indigo-300">{`return { rpId: "flowforge.ai", challenge: challengeToken, timeout: 60000 };`}</p>
                    <p className="text-purple-300">{`}`}</p>
                    <p className="text-slate-500">{`// Auto-synthesized cryptographic ceremony spec`}</p>
                    <p className="text-yellow-300/80">{`interface VerifyResponse { verified: boolean; credentialId: string; }`}</p>
                    <p className="text-signal-cyan font-semibold">{`import { WebAuthn, Credential } from "@flowforge/crypto";`}</p>
                    <p className="text-purple-300">{`export async function generateChallenge(userId: UUID): Promise<AuthChallenge> {`}</p>
                    <p className="pl-4 text-slate-400">{`const entropy = crypto.getRandomValues(new Uint8Array(32));`}</p>
                    <p className="pl-4 text-emerald-400">{`await cache.set(\`auth:chal:\${userId}\`, challengeToken, { ttl: 120 });`}</p>
                  </div>
                </div>
                {/* Column 2: PostgreSQL DDL */}
                <div className="overflow-hidden relative hidden md:block">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-signal-violet/70 pb-2 border-b border-white/[0.06] mb-3 flex items-center justify-between">
                    <span>20250428_passkeys.sql</span>
                    <span className="text-white/30">MIGRATION_GEN</span>
                  </div>
                  <div className="waterfall-col-2 space-y-2 text-[11px] text-slate-300 leading-relaxed font-mono">
                    <p className="text-purple-400">CREATE TABLE user_credentials (</p>
                    <p className="pl-4 text-slate-300">id UUID PRIMARY KEY DEFAULT gen_random_uuid(),</p>
                    <p className="pl-4 text-slate-300">user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,</p>
                    <p className="pl-4 text-signal-cyan">public_key BYTEA NOT NULL,</p>
                    <p className="pl-4 text-slate-400">counter BIGINT NOT NULL DEFAULT 0,</p>
                    <p className="pl-4 text-emerald-400">aaguid UUID,</p>
                    <p className="pl-4 text-slate-400">created_at TIMESTAMPTZ DEFAULT NOW(),</p>
                    <p className="pl-4 text-slate-400">last_used_at TIMESTAMPTZ</p>
                    <p className="text-purple-400">);</p>
                    <p className="text-indigo-400">CREATE UNIQUE INDEX idx_cred_user ON user_credentials (user_id, id);</p>
                    <p className="text-slate-500">-- Automated indexing strategy: 0.12ms lookup latency</p>
                    <p className="text-purple-400">CREATE TABLE user_credentials (</p>
                    <p className="pl-4 text-slate-300">id UUID PRIMARY KEY DEFAULT gen_random_uuid(),</p>
                  </div>
                </div>
                {/* Column 3: OpenAPI / DAG Sync */}
                <div className="overflow-hidden relative hidden md:block">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-signal-cyan/70 pb-2 border-b border-white/[0.06] mb-3 flex items-center justify-between">
                    <span>openapi_spec.yaml</span>
                    <span className="text-white/30">DAG_RESOLVER</span>
                  </div>
                  <div className="waterfall-col-3 space-y-2 text-[11px] text-slate-300 leading-relaxed font-mono">
                    <p className="text-yellow-400">/api/v2/auth/passkey/register:</p>
                    <p className="pl-4 text-purple-300">post:</p>
                    <p className="pl-8 text-slate-400">summary: Register new WebAuthn credential</p>
                    <p className="pl-8 text-slate-400">operationId: registerPasskey</p>
                    <p className="pl-8 text-emerald-400">responses:</p>
                    <p className="pl-12 text-slate-300">{`'201':`}</p>
                    <p className="pl-16 text-indigo-300">description: Credential verified &amp; bound</p>
                    <p className="pl-12 text-slate-300">{`'400':`}</p>
                    <p className="pl-16 text-rose-400">description: Attestation signature mismatch</p>
                    <p className="text-slate-500"># DAG node 12/12 fully verified with zero drift</p>
                    <p className="text-signal-cyan">&gt;&gt; Linear Issue #ENG-4890 auto-linked</p>
                    <p className="text-yellow-400">/api/v2/auth/passkey/register:</p>
                    <p className="pl-4 text-purple-300">post:</p>
                  </div>
                </div>
              </div>

              {/* Terminal Footer Status Ribbon */}
              <div className="absolute bottom-0 inset-x-0 h-9 bg-black/80 border-t border-white/[0.08] px-4 flex items-center justify-between text-[11px] z-30 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-signal-success font-semibold">
                    <span className="w-2 h-2 rounded-full bg-signal-success animate-pulse"></span>
                    <span>PIPELINE HEALTHY</span>
                  </span>
                  <span className="text-white/30">&bull;</span>
                  <span className="text-white/60">Branch: <span className="text-white font-mono">feature/webauthn-zero-trust</span></span>
                </div>
                <div className="flex items-center gap-3 text-white/50 font-mono">
                  <span>
                    Coverage: <strong className="text-white"><AnimatedCounter target={99.8} decimals={1} suffix="%" /></strong>
                  </span>
                  <span className="text-white/30">&bull;</span>
                  <span>Deterministic AST: <strong className="text-signal-cyan">Active</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust / Telemetry Metrics Strip (Metallic Glass Style with Animated Counters) */}
        <div className="mt-10 w-full max-w-5xl p-space-md rounded-2xl metallic-card grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          <div className="stat-card px-space-md py-2 flex flex-col items-center rounded-lg cursor-default">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <AnimatedCounter target={4800} suffix="+" />
              <span className="material-symbols-outlined text-signal-success text-base animate-pulse">verified</span>
            </div>
            <span className="text-[11px] font-mono text-outline mt-1 uppercase tracking-wider">Engineers Onboarded</span>
          </div>
          <div className="stat-card px-space-md py-2 flex flex-col items-center rounded-lg cursor-default">
            <div className="text-2xl sm:text-3xl font-extrabold text-signal-cyan tracking-tight">
              <AnimatedCounter target={99.8} decimals={1} suffix="%" />
            </div>
            <span className="text-[11px] font-mono text-outline mt-1 uppercase tracking-wider">Spec &amp; Schema Accuracy</span>
          </div>
          <div className="stat-card px-space-md py-2 flex flex-col items-center rounded-lg cursor-default">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              <AnimatedCounter target={10} suffix="x" />
            </div>
            <span className="text-[11px] font-mono text-outline mt-1 uppercase tracking-wider">RFC to Implementation</span>
          </div>
          <div className="stat-card px-space-md py-2 flex flex-col items-center rounded-lg cursor-default">
            <div className="text-2xl sm:text-3xl font-extrabold text-signal-indigo tracking-tight">
              <AnimatedCounter target={48210} suffix=" tok/s" />
            </div>
            <span className="text-[11px] font-mono text-outline mt-1 uppercase tracking-wider">Line Rate Throughput</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CINEMATIC VERTICAL TIMELINE: 4-STAGE AUTONOMOUS ENGINE       */}
      {/* ============================================================ */}
      <section className="w-full max-w-7xl px-gutter-canvas mx-auto mt-space-3xl pt-space-2xl" id="pipeline">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-3xl border-b border-white/[0.06] pb-8">
          <div>
            <div className="flex items-center gap-space-xs text-signal-cyan text-label-sm font-label-sm uppercase tracking-widest font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-signal-cyan animate-ping"></span>
              Autonomous Delivery Execution Lifecycle
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              The 4-Stage Autonomous Engine
            </h2>
          </div>
          <div className="flex flex-col md:items-end mt-4 md:mt-0">
            <p className="text-body-sm sm:text-body-md font-body-sm text-slate-400 max-w-md md:text-right">
              From ambiguous requirements to fully-tested production PR branches via deterministic directed acyclic graph (DAG) pipelines.
            </p>
            <div className="flex items-center gap-2 mt-3 text-label-sm font-mono text-signal-violet">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-violet animate-pulse"></span>
              Scroll to explore pipeline stages
              <span className="material-symbols-outlined text-sm animate-bounce">arrow_downward</span>
            </div>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative w-full pb-20">
          {/* Central Glowing Rail Spine */}
          <div className="absolute left-6 md:left-1/2 top-4 bottom-12 w-[3px] -translate-x-1/2 bg-gradient-to-b from-signal-cyan/40 via-signal-violet/40 to-signal-success/40 rounded-full overflow-hidden shadow-[0_0_18px_rgba(56,189,248,0.25)]">
            <div className="absolute inset-0 bg-white/10"></div>
            <div className="vertical-laser-pulse"></div>
          </div>

          <div className="space-y-24 md:space-y-36 relative z-10">
            {/* STAGE 01: Requirements Analysis */}
            <div className="timeline-stop relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 timeline-reveal">
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-8 z-30 flex items-center justify-center pointer-events-none">
                <div className="radar-ring-1 absolute w-14 h-14 rounded-full border border-signal-cyan/60 pointer-events-none"></div>
                <div className="radar-ring-2 absolute w-14 h-14 rounded-full border border-signal-cyan/40 pointer-events-none"></div>
                <div className="timeline-node node-reveal w-10 h-10 rounded-full bg-surface-bedrock border-2 border-signal-cyan flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.8),inset_0_0_10px_rgba(6,182,212,0.4)]">
                  <span className="w-3 h-3 rounded-full bg-signal-cyan shadow-[0_0_10px_#38bdf8]"></span>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-0 md:pr-10 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="stage-index-stroke text-5xl md:text-7xl select-none">01</span>
                  <div className="flex flex-col">
                    <span className="text-label-sm font-label-sm text-signal-cyan uppercase tracking-widest font-semibold bg-signal-cyan/10 border border-signal-cyan/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse"></span>
                      STAGE 01 // INGESTION &amp; DECOMPOSITION
                    </span>
                    <span className="text-[11px] font-mono text-outline mt-1">MODULE: flowforge/core/ast-extractor</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug mt-2 mb-4">Deterministic Requirements Analysis</h3>
                <p className="text-body-sm sm:text-body-md text-slate-300/85 leading-relaxed mb-6 font-normal">
                  Transforms fuzzy product briefs, PRDs, and Figma tokens into mathematically rigorous specifications. FlowForge parses natural language user stories into syntax trees (ASTs), flags contradictory edge cases, and calculates invariant boundary criteria before writing code.
                </p>
                <div className="space-y-2.5 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-cyan text-sm">check_circle</span><span>Semantic AST Tokenization &amp; Intent Disambiguation</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-cyan text-sm">check_circle</span><span>Boundary Condition Synthesis &amp; Edge-Case Traps</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-cyan text-sm">rule</span><span>Invariant Acceptance Rules exported to Jest / Vitest</span></div>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-10">
                <div className="rounded-2xl bg-[#0B0C12]/95 border border-signal-cyan/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(6,182,212,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-2xl relative overflow-hidden group hover:border-signal-cyan/60 transition-all duration-300">
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-signal-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-signal-cyan font-semibold"><span className="material-symbols-outlined text-sm">data_object</span><span>ast_spec_extractor.output.json</span></div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/30 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-pulse"></span><span>LEXICAL MATCH: 99.8%</span></div>
                  </div>
                  <div className="space-y-2 font-mono text-[11px] leading-relaxed select-none">
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06] text-slate-300">
                      <span className="text-purple-300 font-semibold">// Raw PRD Sentence Extracted:</span>
                      <p className="text-white mt-1 italic">&quot;Users must be able to authenticate using Passkeys with biometric fallbacks and immediate cross-device sync.&quot;</p>
                    </div>
                    <div className="p-3 rounded bg-black/80 border border-signal-cyan/20 space-y-1.5">
                      <p className="text-signal-cyan font-bold">{`{`}</p>
                      <p className="pl-3 text-slate-400">&quot;actor&quot;: <span className="text-emerald-400">&quot;AuthenticatedUser&quot;</span>,</p>
                      <p className="pl-3 text-slate-400">&quot;protocol&quot;: <span className="text-yellow-300">&quot;FIDO2_WEBAUTHN_L3&quot;</span>,</p>
                      <p className="pl-3 text-slate-400">&quot;invariants&quot;: [</p>
                      <p className="pl-6 text-indigo-300">&quot;challenge_entropy &gt;= 256_bits&quot;,</p>
                      <p className="pl-6 text-indigo-300">&quot;replay_prevention_nonce: verified&quot;,</p>
                      <p className="pl-6 text-indigo-300">&quot;resident_key: REQUIRED&quot;</p>
                      <p className="pl-3 text-slate-400">],</p>
                      <p className="pl-3 text-slate-400">&quot;fallback_recovery&quot;: <span className="text-rose-400">&quot;EncryptedShardedCloudBackup&quot;</span></p>
                      <p className="text-signal-cyan font-bold">{`}`}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-outline">
                    <span className="flex items-center gap-1.5 text-signal-success"><span className="material-symbols-outlined text-sm">verified</span>Spec Synthesized in <AnimatedCounter target={142} suffix="ms" /></span>
                    <span className="text-white/40">Tokens: <AnimatedCounter target={3420} /> AST nodes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 02: Solution Design */}
            <div className="timeline-stop relative flex flex-col md:flex-row-reverse items-center justify-between gap-8 md:gap-12 timeline-reveal">
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-8 z-30 flex items-center justify-center pointer-events-none">
                <div className="radar-ring-1 absolute w-14 h-14 rounded-full border border-signal-indigo/60 pointer-events-none"></div>
                <div className="radar-ring-2 absolute w-14 h-14 rounded-full border border-signal-indigo/40 pointer-events-none"></div>
                <div className="timeline-node node-reveal w-10 h-10 rounded-full bg-surface-bedrock border-2 border-signal-indigo flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.8),inset_0_0_10px_rgba(99,102,241,0.4)]">
                  <span className="w-3 h-3 rounded-full bg-signal-indigo shadow-[0_0_10px_#6366f1]"></span>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-10 md:pr-0 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="stage-index-stroke text-5xl md:text-7xl select-none">02</span>
                  <div className="flex flex-col">
                    <span className="text-label-sm font-label-sm text-signal-indigo uppercase tracking-widest font-semibold bg-signal-indigo/10 border border-signal-indigo/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-signal-indigo animate-pulse"></span>STAGE 02 // ARCHITECTURAL SYNTHESIS</span>
                    <span className="text-[11px] font-mono text-outline mt-1">MODULE: flowforge/synth/schema-generator</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug mt-2 mb-4">Relational Schema &amp; Contract Synthesis</h3>
                <p className="text-body-sm sm:text-body-md text-slate-300/85 leading-relaxed mb-6 font-normal">Converts structured requirements into type-safe relational schemas, SQL DDL migrations with zero-downtime lock strategies, OpenAPI 3.1 contracts, and front-end component state models.</p>
                <div className="space-y-2.5 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-indigo text-sm">storage</span><span>PostgreSQL / MySQL Non-Blocking Migration DDL</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-indigo text-sm">api</span><span>Strict OpenAPI 3.1 Contract &amp; Zod Schema Generation</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-indigo text-sm">account_tree</span><span>Client UI Component Tree &amp; State Hydration Graph</span></div>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-0 md:pr-10">
                <div className="rounded-2xl bg-[#0B0C12]/95 border border-signal-indigo/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(99,102,241,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-2xl relative overflow-hidden group hover:border-signal-indigo/60 transition-all duration-300">
                  <div className="absolute -top-10 -left-10 w-44 h-44 bg-signal-indigo/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-signal-indigo font-semibold"><span className="material-symbols-outlined text-sm">schema</span><span>schema_contract_gen.sql</span></div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-signal-indigo/15 text-signal-indigo border border-signal-indigo/30 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-signal-indigo animate-pulse"></span><span>ZERO-LOCK MIGRATION</span></div>
                  </div>
                  <div className="space-y-2 font-mono text-[11px] leading-relaxed select-none">
                    <div className="p-3 rounded bg-black/80 border border-signal-indigo/20 space-y-1">
                      <p className="text-purple-400">CREATE TABLE <span className="text-white">user_credentials</span> (</p>
                      <p className="pl-4 text-slate-300">id <span className="text-signal-cyan">UUID PRIMARY KEY DEFAULT gen_random_uuid()</span>,</p>
                      <p className="pl-4 text-slate-300">user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,</p>
                      <p className="pl-4 text-emerald-400">public_key BYTEA NOT NULL,</p>
                      <p className="pl-4 text-slate-300">counter BIGINT NOT NULL DEFAULT 0,</p>
                      <p className="pl-4 text-slate-400">created_at TIMESTAMPTZ DEFAULT clock_timestamp()</p>
                      <p className="text-purple-400">);</p>
                      <p className="text-indigo-400 mt-2">-- Concurrent Index to eliminate write contention</p>
                      <p className="text-slate-300">CREATE UNIQUE INDEX CONCURRENTLY idx_creds_lookup</p>
                      <p className="pl-4 text-slate-400">ON user_credentials (user_id, public_key);</p>
                    </div>
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-yellow-300"><span className="material-symbols-outlined text-xs">sync_alt</span><span>POST /v2/auth/webauthn/verify</span></div>
                      <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">200 OK + Zod Verified</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-outline">
                    <span className="flex items-center gap-1.5 text-signal-indigo">
                      <span className="material-symbols-outlined text-sm">speed</span>
                      Query latency: <AnimatedCounter target={0.14} decimals={2} suffix="ms (p99)" />
                    </span>
                    <span className="text-white/40">Drift score: 0.00%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 03: Implementation Planning */}
            <div className="timeline-stop relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 timeline-reveal">
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-8 z-30 flex items-center justify-center pointer-events-none">
                <div className="radar-ring-1 absolute w-14 h-14 rounded-full border border-signal-violet/60 pointer-events-none"></div>
                <div className="radar-ring-2 absolute w-14 h-14 rounded-full border border-signal-violet/40 pointer-events-none"></div>
                <div className="timeline-node node-reveal w-10 h-10 rounded-full bg-surface-bedrock border-2 border-signal-violet flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.8),inset_0_0_10px_rgba(168,85,247,0.4)]">
                  <span className="w-3 h-3 rounded-full bg-signal-violet shadow-[0_0_10px_#a855f7]"></span>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-0 md:pr-10 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="stage-index-stroke text-5xl md:text-7xl select-none">03</span>
                  <div className="flex flex-col">
                    <span className="text-label-sm font-label-sm text-signal-violet uppercase tracking-widest font-semibold bg-signal-violet/10 border border-signal-violet/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-signal-violet animate-pulse"></span>STAGE 03 // DAG DEPENDENCY ORCHESTRATION</span>
                    <span className="text-[11px] font-mono text-outline mt-1">MODULE: flowforge/dag/graph-resolver</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug mt-2 mb-4">Directed Acyclic Graph (DAG) Execution Roadmap</h3>
                <p className="text-body-sm sm:text-body-md text-slate-300/85 leading-relaxed mb-6 font-normal">Complex features require sequenced execution without circular blockers. FlowForge builds topological dependency graphs, splits massive PRs into reviewable atomic micro-PRs, and bi-directionally syncs task trees with Linear, Jira, and GitHub Projects.</p>
                <div className="space-y-2.5 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-violet text-sm">hub</span><span>Topological Sorting &amp; Deadlock Prevention Algorithm</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-violet text-sm">splitscreen</span><span>Atomic Sub-Branch Sizing (&lt;250 LOC per PR target)</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-violet text-sm">sync</span><span>Live Bi-directional Sync with Linear &amp; GitHub Projects</span></div>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-10">
                <div className="rounded-2xl bg-[#0B0C12]/95 border border-signal-violet/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(168,85,247,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-2xl relative overflow-hidden group hover:border-signal-violet/60 transition-all duration-300">
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-signal-violet/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-signal-violet font-semibold"><span className="material-symbols-outlined text-sm">account_tree</span><span>execution_plan.dag.svg</span></div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-signal-violet/15 text-primary border border-signal-violet/30 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-signal-violet animate-pulse"></span><span>TOPOLOGICALLY ORDERED</span></div>
                  </div>
                  <div className="space-y-3 font-mono text-[11px] select-none">
                    <div className="flex items-center justify-between p-2.5 rounded bg-black/75 border border-emerald-500/40 text-white">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span className="font-bold text-emerald-300">NODE 1:</span><span>db/migration-user-creds.sql</span></div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">READY (ROOT)</span>
                    </div>
                    <div className="flex items-center justify-center -my-1 text-white/40"><span className="material-symbols-outlined text-sm">arrow_downward</span><span className="text-[10px] text-signal-cyan ml-1">resolves dependency (schema_up)</span></div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-black/75 border border-signal-violet/40 text-white">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-signal-violet animate-ping"></span><span className="font-bold text-primary">NODE 2:</span><span>services/webauthn-ceremony.ts</span></div>
                      <span className="text-[10px] text-primary bg-signal-violet/15 px-2 py-0.5 rounded border border-signal-violet/30 font-semibold">EXECUTING...</span>
                    </div>
                    <div className="flex items-center justify-center -my-1 text-white/40"><span className="material-symbols-outlined text-sm">arrow_downward</span><span className="text-[10px] text-slate-400 ml-1">awaits ceremony verify</span></div>
                    <div className="flex items-center justify-between p-2.5 rounded bg-black/60 border border-white/[0.08] text-slate-400">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/30"></span><span className="font-bold text-slate-300">NODE 3:</span><span>components/PasskeyPrompt.tsx</span></div>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">QUEUED</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-outline">
                    <span className="flex items-center gap-1.5 text-signal-violet"><span className="material-symbols-outlined text-sm">alt_route</span><AnimatedCounter target={3} /> Atomic PRs Synced to Linear</span>
                    <span className="text-white/40">Eng Hours Saved: ~<AnimatedCounter target={28} suffix="h" /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 04: Code Review & QA */}
            <div className="timeline-stop relative flex flex-col md:flex-row-reverse items-center justify-between gap-8 md:gap-12 timeline-reveal">
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-8 z-30 flex items-center justify-center pointer-events-none">
                <div className="radar-ring-1 absolute w-14 h-14 rounded-full border border-signal-success/60 pointer-events-none"></div>
                <div className="radar-ring-2 absolute w-14 h-14 rounded-full border border-signal-success/40 pointer-events-none"></div>
                <div className="timeline-node node-reveal w-10 h-10 rounded-full bg-surface-bedrock border-2 border-signal-success flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.8),inset_0_0_10px_rgba(16,185,129,0.4)]">
                  <span className="w-3 h-3 rounded-full bg-signal-success shadow-[0_0_10px_#10B981]"></span>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-10 md:pr-0 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <span className="stage-index-stroke text-5xl md:text-7xl select-none">04</span>
                  <div className="flex flex-col">
                    <span className="text-label-sm font-label-sm text-signal-success uppercase tracking-widest font-semibold bg-signal-success/10 border border-signal-success/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-signal-success animate-pulse"></span>STAGE 04 // VERIFICATION &amp; QA GATE</span>
                    <span className="text-[11px] font-mono text-outline mt-1">MODULE: flowforge/qa/synthetic-verifier</span>
                  </div>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug mt-2 mb-4">Autonomous Code Review &amp; Lint Gates</h3>
                <p className="text-body-sm sm:text-body-md text-slate-300/85 leading-relaxed mb-6 font-normal">Before any PR touches human eyes, synthetic QA agents execute simulated edge attacks, run cryptographic boundary test suites, enforce zero regression policies, and confirm 100% strict type safety across all generated endpoints.</p>
                <div className="space-y-2.5 font-mono text-xs text-slate-300">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-success text-sm">security</span><span>OWASP Top 10 &amp; Static Vulnerability Scan Gate</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-success text-sm">fact_check</span><span>Automated Vitest / Playwright Synthetic Test Generation</span></div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]"><span className="material-symbols-outlined text-signal-success text-sm">verified</span><span>Zero Lint Drift: Biome, ESLint &amp; Prettier Compliant</span></div>
                </div>
              </div>
              <div className="w-full md:w-[46%] pl-16 md:pl-0 md:pr-10">
                <div className="rounded-2xl bg-[#0B0C12]/95 border border-signal-success/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.12)] backdrop-blur-2xl relative overflow-hidden group hover:border-signal-success/60 transition-all duration-300">
                  <div className="absolute -top-10 -left-10 w-44 h-44 bg-signal-success/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-signal-success font-semibold"><span className="material-symbols-outlined text-sm">flaky</span><span>ci_pipeline_telemetry.report</span></div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-signal-success/15 text-signal-success border border-signal-success/30 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-signal-success animate-pulse"></span><span>ALL <AnimatedCounter target={42} /> GATES PASSED</span></div>
                  </div>
                  <div className="space-y-2.5 font-mono text-[11px] select-none">
                    <div className="p-2.5 rounded bg-black/80 border border-signal-success/20 flex items-center justify-between"><div className="flex items-center gap-2 text-slate-300"><span className="material-symbols-outlined text-signal-success text-sm">check_circle</span><span>webauthn.challenge.spec.ts (<AnimatedCounter target={14} suffix=" tests" />)</span></div><span className="text-signal-success font-bold text-[10px]">100% PASS</span></div>
                    <div className="p-2.5 rounded bg-black/80 border border-signal-success/20 flex items-center justify-between"><div className="flex items-center gap-2 text-slate-300"><span className="material-symbols-outlined text-signal-success text-sm">check_circle</span><span>replay_attack_fuzzing.spec.ts</span></div><span className="text-signal-success font-bold text-[10px]">0 VULNS</span></div>
                    <div className="p-2.5 rounded bg-black/80 border border-signal-success/20 flex items-center justify-between"><div className="flex items-center gap-2 text-slate-300"><span className="material-symbols-outlined text-signal-success text-sm">check_circle</span><span>strict_typecheck (tsconfig.strict: true)</span></div><span className="text-signal-success font-bold text-[10px]">0 ERRORS</span></div>
                    <div className="p-2.5 rounded bg-black/60 border border-white/[0.06] space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400"><span>Branch Coverage</span><span className="text-signal-success font-bold"><AnimatedCounter target={99.8} decimals={1} suffix="%" /></span></div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-signal-cyan via-signal-violet to-signal-success w-[99.8%] rounded-full"></div></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-outline">
                    <span className="flex items-center gap-1.5 text-signal-success font-semibold"><span className="material-symbols-outlined text-sm">rocket_launch</span>Ready for 1-Click Merge</span>
                    <span className="text-white/40">CI Duration: <AnimatedCounter target={3.8} decimals={1} suffix="s" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3 ADVANCED FEATURE CARDS (Asymmetric Modern Bento Layout)    */}
      {/* ============================================================ */}
      <section className="w-full max-w-7xl px-gutter-canvas mx-auto mt-space-3xl" id="features">
        <div className="text-center max-w-2xl mx-auto mb-space-2xl">
          <span className="text-label-sm font-mono text-signal-cyan uppercase tracking-widest font-semibold flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping"></span>
            ENGINEERED ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-header text-white tracking-tight leading-tight">
            Built for Mission-Critical Engineering
          </h2>
          <p className="text-sm sm:text-base text-slate-300/85 max-w-xl mx-auto mt-2.5 leading-relaxed font-normal">
            Three deterministic pillars engineered to eliminate hallucinations, enforce type-safety, and orchestrate atomic pull requests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Bento Card 1: Wide Showcase (Col 1-7) - Real-Time Streaming Engine */}
          <div className="lg:col-span-7 bento-card p-6 sm:p-8 rounded-2xl metallic-card border border-white/[0.1] relative overflow-hidden group flex flex-col justify-between hover:-translate-y-1 hover:border-signal-cyan/50 hover:shadow-[0_20px_45px_-12px_rgba(6,182,212,0.25)] transition-all duration-300">
            <div className="absolute -right-16 -top-16 w-60 h-60 bg-signal-cyan/15 rounded-full blur-3xl pointer-events-none group-hover:bg-signal-cyan/25 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-signal-cyan/15 border border-signal-cyan/35 flex items-center justify-center text-signal-cyan group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300">
                    <span className="material-symbols-outlined text-xl">dynamic_feed</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-signal-cyan tracking-wider uppercase font-semibold">High-Throughput SSE</span>
                    <h3 className="text-xl sm:text-2xl font-bold font-header text-white group-hover:text-signal-cyan transition-colors">
                      Real-time Streaming Engine
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-signal-cyan/15 text-signal-cyan border border-signal-cyan/35 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping" />
                  &lt;<AnimatedCounter target={200} suffix="ms" /> TTFT
                </span>
              </div>

              <p className="text-sm text-slate-300/90 leading-relaxed max-w-xl font-normal">
                Experience sub-200ms visual plan generation. Live Server-Sent Events (SSE) stream code ASTs, SQL migrations, and OpenAPI definitions at full line rate directly to your workspace.
              </p>
            </div>

            {/* Live Stream Terminal Box */}
            <div className="mt-6 p-4 rounded-xl bg-[#090A10]/90 border border-white/[0.08] group-hover:border-signal-cyan/40 font-mono text-xs overflow-hidden transition-all duration-300 shadow-inner">
              <div className="flex items-center justify-between text-[11px] pb-2 mb-2.5 border-b border-white/[0.06]">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-signal-success animate-pulse" />
                  <span>stream.sse.pipeline // token_bus</span>
                </span>
                <span className="text-signal-success bg-signal-success/15 px-2 py-0.5 rounded border border-signal-success/30 font-semibold text-[10px]">
                  48,210 tok/s
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <p className="text-signal-cyan truncate flex items-center gap-1.5">
                  <span className="text-white/40">&gt;&gt;</span>
                  <span>event: node_chunk_synthesized [ast:auth_guard.ts]</span>
                </p>
                <p className="text-slate-300 truncate flex items-center gap-1.5">
                  <span className="text-white/40">&gt;&gt;</span>
                  <span>schema: migration_v4.up.sql [zero-lock]</span>
                  <span className="inline-block w-1.5 h-3.5 bg-signal-cyan ml-1 animate-cursor" />
                </p>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Vertical Showcase (Col 8-12) - Context-Aware Codebase AI */}
          <div className="lg:col-span-5 bento-card p-6 sm:p-8 rounded-2xl metallic-card border border-white/[0.1] relative overflow-hidden group flex flex-col justify-between hover:-translate-y-1 hover:border-signal-violet/50 hover:shadow-[0_20px_45px_-12px_rgba(168,85,247,0.25)] transition-all duration-300">
            <div className="absolute -right-16 -top-16 w-60 h-60 bg-signal-violet/15 rounded-full blur-3xl pointer-events-none group-hover:bg-signal-violet/25 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-signal-violet/15 border border-signal-violet/35 flex items-center justify-center text-signal-violet group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300">
                  <span className="material-symbols-outlined text-xl">deployed_code</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-signal-violet/15 text-primary border border-signal-violet/35">
                  Monorepo &amp; AST Native
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-header text-white mb-2 group-hover:text-primary transition-colors">
                Context-Aware Codebase AI
              </h3>
              <p className="text-sm text-slate-300/90 leading-relaxed font-normal">
                Ingests organizational conventions, historic PRs, and package boundaries. Produces zero-hallucination plans adhering strictly to dependency graphs.
              </p>
            </div>

            {/* Metric Preview Pill */}
            <div className="mt-6 p-4 rounded-xl bg-[#090A10]/90 border border-white/[0.08] group-hover:border-signal-violet/40 font-mono text-xs overflow-hidden transition-all duration-300 shadow-inner">
              <div className="flex items-center justify-between text-[11px] pb-2 mb-2.5 border-b border-white/[0.06]">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-signal-violet animate-pulse" />
                  <span>context.analyzer</span>
                </span>
                <span className="text-signal-violet bg-signal-violet/15 px-2 py-0.5 rounded border border-signal-violet/30 font-semibold text-[10px]">
                  INDEXED
                </span>
              </div>
              <p className="text-primary truncate">&gt; symbols: <AnimatedCounter target={42891} /> parsed</p>
              <p className="text-slate-300 truncate flex items-center">
                <span>&gt; drift_tolerance: 0.00%</span>
                <span className="inline-block w-1.5 h-3.5 bg-signal-violet ml-1 animate-cursor" />
              </p>
            </div>
          </div>

          {/* Bento Card 3: Horizontal Showcase Banner (Col 1-12) - Export & CI/CD Ecosystem */}
          <div className="lg:col-span-12 bento-card p-6 sm:p-8 rounded-2xl metallic-card border border-white/[0.1] relative overflow-hidden group hover:-translate-y-1 hover:border-signal-indigo/50 hover:shadow-[0_20px_45px_-12px_rgba(99,102,241,0.25)] transition-all duration-300">
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-signal-indigo/15 rounded-full blur-3xl pointer-events-none group-hover:bg-signal-indigo/25 transition-all duration-500" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-signal-indigo/15 border border-signal-indigo/35 flex items-center justify-center text-signal-indigo group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300">
                    <span className="material-symbols-outlined text-xl">hub</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-signal-indigo/15 text-secondary border border-signal-indigo/35">
                    Ecosystem Integration
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-header text-white mb-2 group-hover:text-secondary transition-colors">
                  Export &amp; Continuous Integration Pipeline
                </h3>
                <p className="text-sm text-slate-300/90 leading-relaxed font-normal">
                  Convert synthesized DAG graphs into scoped Linear tasks, Jira issue trees, and draft GitHub Pull Requests with pre-populated Vitest suites and SQL migration files.
                </p>
              </div>

              {/* Interactive Sync Pipeline Badges */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/[0.08] hover:border-signal-cyan/50 hover:bg-black/80 transition-all text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-signal-cyan animate-pulse" />
                  <span className="text-white font-semibold">GitHub PRs</span>
                  <span className="text-[10px] text-signal-cyan bg-signal-cyan/10 px-1.5 py-0.5 rounded border border-signal-cyan/20">#104</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/[0.08] hover:border-signal-violet/50 hover:bg-black/80 transition-all text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-signal-violet animate-pulse" />
                  <span className="text-white font-semibold">Linear Issues</span>
                  <span className="text-[10px] text-primary bg-signal-violet/10 px-1.5 py-0.5 rounded border border-signal-violet/20">ENG-4890</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/[0.08] hover:border-signal-success/50 hover:bg-black/80 transition-all text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-signal-success animate-pulse" />
                  <span className="text-white font-semibold">Markdown / PDF</span>
                  <span className="text-[10px] text-signal-success bg-signal-success/10 px-1.5 py-0.5 rounded border border-signal-success/20">1-Click</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2-COLUMN SPLIT FREQUENTLY ASKED QUESTIONS (SHADCN ACCORDION) */}
      {/* ============================================================ */}
      <section className="w-full max-w-7xl px-gutter-canvas mx-auto mt-space-3xl mb-space-3xl" id="faq">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (5 Cols) - Sticky Header, Trust Badges, CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan text-xs font-mono font-semibold tracking-wider uppercase w-fit shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan animate-ping" />
              Knowledge Repository
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-header text-white tracking-tight leading-[1.12]">
              Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal-cyan via-signal-violet to-signal-indigo">Technical Questions</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300/85 leading-relaxed font-normal">
              Everything you need to know about the deterministic LangGraph multi-agent pipeline, 100% free developer access, multi-tenant isolation, and automated QA gates.
            </p>

            {/* Quick Architecture Trust List */}
            <div className="flex flex-col gap-2.5 pt-2 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <span className="material-symbols-outlined text-signal-success text-sm">verified</span>
                <span>100% Free &amp; Open Access — Zero Paywalls</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <span className="material-symbols-outlined text-signal-cyan text-sm">security</span>
                <span>Cryptographic Multi-Tenant Clerk Identity Scoping</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <span className="material-symbols-outlined text-signal-violet text-sm">hub</span>
                <span>Deterministic AST Invariants &amp; Non-Blocking DDL</span>
              </div>
            </div>

            {/* Direct Workflow Link */}
            <div className="pt-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 text-xs font-mono text-signal-cyan hover:text-white font-semibold group transition-colors"
              >
                <span>Ready to orchestrate your feature? Launch composer</span>
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Right Column (7 Cols) - Floating Separated Accordion Cards */}
          <div className="lg:col-span-7">
            <Accordion variant="separated" type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger index={1}>
                  How does FlowForge transform feature requests into production code?
                </AccordionTrigger>
                <AccordionPanel>
                  <p>
                    FlowForge AI compiles an autonomous 4-stage StateGraph using LangGraph. First, natural language briefs are tokenized into deterministic Abstract Syntax Trees (ASTs) with explicit boundary invariants. Next, relational PostgreSQL DDL schemas and strict OpenAPI 3.1 contracts are synthesized. A topological DAG graph engine resolves execution dependencies into atomic sub-PR branches, and automated QA gates run synthetic security audits and Playwright test suites before generating the final deliverable.
                  </p>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger index={2}>
                  Is FlowForge completely free, or are there paid subscription tiers?
                </AccordionTrigger>
                <AccordionPanel>
                  <p>
                    FlowForge AI is 100% free and developer-first. There are no paid subscriptions, credit card requirements, or locked paywalls. You can compose unlimited feature workflows, trigger multi-agent DAG pipelines, conduct live web technical research, and export deliverables in Markdown, PDF, and DOCX formats without restrictions.
                  </p>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger index={3}>
                  How is user data and workflow history isolated?
                </AccordionTrigger>
                <AccordionPanel>
                  <p>
                    User authentication and tenant scoping are powered by Clerk. Every workflow pipeline run, execution log, and database record is cryptographically scoped to the authenticated user ID (passed via secure Edge proxy headers). Users cannot view, modify, or access workflow histories belonging to other accounts, guaranteeing multi-tenant isolation and complete data privacy.
                  </p>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger index={4}>
                  How does the Web Research Hub gather architecture intelligence?
                </AccordionTrigger>
                <AccordionPanel>
                  <p>
                    The Web Research Hub uses real-time web crawlers to search for live technical documentation, official API benchmarks, npm/PyPI libraries, and security advisories. The gathered intelligence is synthesized with verified source citations, which you can inject directly into the Feature Specification Composer with a single click.
                  </p>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger index={5}>
                  Which export formats and issue tracking systems are supported?
                </AccordionTrigger>
                <AccordionPanel>
                  <p>
                    Every completed pipeline run can be exported immediately as a formatted GitHub Flavored Markdown specification, publication-ready PDF document, or formatted Microsoft Word (.docx) deliverable. In addition, topological DAG nodes can be bi-directionally mapped to Linear issues, Jira epics, or drafted GitHub pull requests.
                  </p>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger index={6}>
                  How does FlowForge guarantee zero hallucinations and schema drift?
                </AccordionTrigger>
                <AccordionPanel>
                  <p>
                    Unlike raw chat prompts, FlowForge enforces typed Pydantic models at every step of the graph. AST tokenization checks edge-case invariants, SQL migrations use concurrent non-blocking indexes to prevent write locks, and synthetic test suites (Jest/Vitest) verify 100% branch and type coverage before any plan is declared complete.
                  </p>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* INTERACTIVE ARCHITECTURE TOUR MODAL DIALOG                   */}
      {/* ============================================================ */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in">
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#090A10]/95 border border-white/[0.18] shadow-[0_30px_100px_-10px_rgba(6,182,212,0.35),0_0_50px_rgba(99,102,241,0.2)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Titlebar */}
            <div className="h-14 px-5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block shadow-[0_0_6px_rgba(255,95,86,0.6)]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block shadow-[0_0_6px_rgba(255,189,46,0.5)]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block shadow-[0_0_6px_rgba(39,201,63,0.6)]"></span>
                </div>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-signal-cyan text-base">account_tree</span>
                  <span className="text-body-sm font-bold text-white tracking-tight">Interactive Architecture Tour</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-outline">
                  Step {tourStep + 1} of {TOUR_STEPS.length}
                </span>
                <button
                  onClick={() => setIsTourOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-outline hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* Quick Step Switcher Tabs */}
            <div className="px-5 py-2.5 bg-black/40 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto select-none shrink-0">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setTourStep(idx)}
                  className={`px-3 py-1 rounded-lg text-label-sm font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    tourStep === idx
                      ? "bg-signal-cyan/20 border border-signal-cyan text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      : "bg-white/[0.02] border border-border-subtle text-outline hover:text-white hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-[11px]">{s.step}</span>
                  <span className="hidden sm:inline text-xs">{s.title.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Context & Bullet Points */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono uppercase tracking-wider mb-2 font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      tourStep === 0 ? "bg-signal-cyan" :
                      tourStep === 1 ? "bg-signal-cyan" :
                      tourStep === 2 ? "bg-signal-indigo" :
                      tourStep === 3 ? "bg-signal-violet" : "bg-signal-success"
                    }`}></span>
                    <span className={TOUR_STEPS[tourStep].badgeColor}>
                      {TOUR_STEPS[tourStep].badge}
                    </span>
                  </div>

                  <h3 className="text-headline-sm font-headline-sm font-extrabold text-white tracking-tight leading-snug">
                    {TOUR_STEPS[tourStep].title}
                  </h3>

                  <p className="text-body-md text-slate-300 leading-relaxed mt-2.5">
                    {TOUR_STEPS[tourStep].summary}
                  </p>
                </div>

                {/* Architectural Highlights */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-2.5">
                  <span className="text-[11px] font-mono text-outline uppercase tracking-wider block font-semibold">
                    Architectural Invariants &amp; Capabilities
                  </span>
                  {TOUR_STEPS[tourStep].bullets.map((b, bi) => (
                    <div key={bi} className="flex items-start gap-2 text-body-sm text-slate-300">
                      <span className="material-symbols-outlined text-signal-cyan text-sm mt-0.5 shrink-0">check_circle</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Mini Navigation Hints */}
                <div className="text-[11px] font-mono text-outline flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10">&larr;</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10">&rarr;</span>
                  <span>Use arrow keys to navigate stages</span>
                </div>
              </div>

              {/* Right Column: Code / Topology Mock */}
              <div className="lg:col-span-6 flex flex-col rounded-xl bg-black/80 border border-white/[0.12] overflow-hidden shadow-inner">
                <div className="px-3 py-2 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-signal-cyan">{TOUR_STEPS[tourStep].codePreview.label}</span>
                  <span className="text-outline uppercase text-[10px]">{TOUR_STEPS[tourStep].codePreview.lang}</span>
                </div>
                <pre className="p-4 font-mono text-[11px] text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap flex-1">
                  {TOUR_STEPS[tourStep].codePreview.code}
                </pre>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-6 py-4 bg-black/60 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTourStep((prev) => Math.max(prev - 1, 0))}
                  disabled={tourStep === 0}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle text-white font-medium text-body-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  &larr; Previous
                </button>
                <button
                  onClick={() => setTourStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1))}
                  disabled={tourStep === TOUR_STEPS.length - 1}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-medium text-body-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next Stage &rarr;
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsTourOpen(false);
                    const el = document.getElementById("pipeline");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-label-sm font-mono text-outline hover:text-white underline cursor-pointer"
                >
                  Scroll to Full Timeline
                </button>
                <Show when="signed-out">
                  <SignInButton mode="modal" forceRedirectUrl="/create">
                    <button
                      onClick={() => setIsTourOpen(false)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-signal-cyan to-signal-indigo text-white font-semibold text-body-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Start Live Workflow</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link
                    href="/create"
                    onClick={() => setIsTourOpen(false)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-signal-cyan to-signal-indigo text-white font-semibold text-body-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Start Live Workflow</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </Show>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
