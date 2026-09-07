'use client';

import React, { useEffect, useState } from 'react';
import { MermaidViewer } from '@/components/MermaidViewer';

interface PipelineDagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PipelineDagModal({ isOpen, onClose }: PipelineDagModalProps) {
  const [dagData, setDagData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/architecture/dag')
      .then((res) => res.json())
      .then((data) => {
        setDagData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load pipeline DAG:', err);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090A10]/95 border border-white/[0.18] shadow-[0_30px_100px_-10px_rgba(6,182,212,0.35),0_0_50px_rgba(99,102,241,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
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
              <span className="text-body-sm font-bold text-white tracking-tight">
                LangGraph Multi-Agent Architecture &amp; DAG
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-signal-indigo/10 via-signal-violet/10 to-transparent border border-signal-indigo/20">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-signal-cyan font-semibold">
                Autonomous StateGraph Topology
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                4-Stage Sequential Agent Pipeline
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Compiled LangGraph state machine with shared typed state, SSE event streaming, DuckDuckGo live web intelligence, and adversarial security gating.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-signal-success/15 border border-signal-success/30 text-signal-success text-xs font-mono font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-success animate-ping"></span>
                Engine Operational
              </span>
            </div>
          </div>

          {/* Visual Interactive Architecture Diagram */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-black/50 border border-white/10 gap-3">
              <span className="material-symbols-outlined text-signal-cyan text-3xl animate-spin">progress_activity</span>
              <span className="text-xs font-mono text-outline">Extracting LangGraph DAG Architecture...</span>
            </div>
          ) : (
            <MermaidViewer
              chart={dagData?.mermaid || `graph TD
  __start__([__start__]) --> requirements
  requirements[Stage 1: Requirements Decomposition] --> design
  design[Stage 2: Solution Architecture] --> implementation
  implementation[Stage 3: Sprint DAG Planning] --> review
  review[Stage 4: Adversarial Security Gate] --> __end__([__end__])`}
              title="Global Multi-Agent Orchestration DAG"
              filename="flowforge-langgraph-orchestration-dag"
            />
          )}

          {/* Agent Stage Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                step: "01",
                name: "Requirements Agent",
                color: "border-signal-cyan/40 bg-signal-cyan/5 text-signal-cyan",
                desc: "Pydantic parsing, functional specs & live DuckDuckGo web crawling for OWASP standards."
              },
              {
                step: "02",
                name: "Solutions Architect",
                color: "border-signal-indigo/40 bg-signal-indigo/5 text-signal-indigo",
                desc: "Component DAG synthesis, data models, technology stack matrix & REST contracts."
              },
              {
                step: "03",
                name: "Lead Engineer",
                color: "border-signal-violet/40 bg-signal-violet/5 text-signal-violet",
                desc: "Sprint DAG planning, atomic PR task decomposition (<250 LOC) & test strategy."
              },
              {
                step: "04",
                name: "Security Gate",
                color: "border-signal-success/40 bg-signal-success/5 text-signal-success",
                desc: "Adversarial inspection, race condition checks, N+1 query flags & quality score."
              }
            ].map((s) => (
              <div key={s.step} className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-outline">STAGE {s.step}</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${s.color}`}>
                      Active
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{s.name}</h4>
                  <p className="text-[11px] text-outline mt-1 leading-normal">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3.5 bg-black/60 border-t border-white/[0.08] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-outline">
            Image Export: PNG (2x Retina) &bull; Vector SVG &bull; Mermaid Code
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-medium text-xs transition-all"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
