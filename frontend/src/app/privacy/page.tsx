import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  EyeOff,
  Database,
  Trash2,
  FileText,
  Mail,
  ArrowLeft,
  Sparkles,
  Server,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Privacy Policy — FlowForge AI",
  description: "Learn how FlowForge AI protects your code, feature requests, and workflow telemetry with zero LLM training and strict multi-tenant isolation.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 mx-auto py-12 flex flex-col gap-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-outline font-mono">
        <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-signal-cyan font-semibold">Privacy Policy</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-8">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" dot className="text-xs uppercase font-mono tracking-wider font-semibold">
            Enterprise Trust &amp; Privacy
          </Badge>
          <span className="text-xs text-outline font-mono">Last Updated: September 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
          FlowForge AI is built from the ground up on the principle of <strong className="text-white">zero data exploitation</strong>. 
          We believe proprietary software architecture, feature specifications, and implementation plans should remain 
          strictly confidential to you and your engineering team.
        </p>
      </div>

      {/* 3 Core Commitments Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-cyan/10 border border-signal-cyan/30 flex items-center justify-center text-signal-cyan">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Zero Model Training</h3>
          <p className="text-xs text-outline leading-relaxed">
            Your feature requests, architectures, and generated code plans are never used to train or fine-tune public foundation models.
          </p>
        </Card>

        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-violet/10 border border-signal-violet/30 flex items-center justify-center text-signal-violet">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Multi-User Isolation</h3>
          <p className="text-xs text-outline leading-relaxed">
            Strict user-level partitioning ensures Person X can never view, inspect, or delete workflows created by Person Y.
          </p>
        </Card>

        <Card variant="prominent" className="p-6 flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-indigo/10 border border-signal-indigo/30 flex items-center justify-center text-signal-indigo">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Cascading Deletion</h3>
          <p className="text-xs text-outline leading-relaxed">
            When you delete a workflow, all stage outputs, telemetry, and artifacts are permanently expunged from the database immediately.
          </p>
        </Card>
      </div>

      {/* Detailed Policy Sections */}
      <div className="flex flex-col gap-8 text-on-surface-variant text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-signal-cyan font-mono">01.</span> Information We Collect and Process
          </h2>
          <p>
            When utilizing the FlowForge AI platform, we collect only the minimal data strictly required to orchestrate multi-agent workflow pipelines:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-outline">
            <li><strong className="text-white">Account Identification:</strong> An anonymized Clerk user identifier (e.g., <code className="text-signal-cyan font-mono">user_2tX...</code>) associated with your authenticated session. We do not store raw passwords or sensitive credentials.</li>
            <li><strong className="text-white">Feature Requests &amp; Prompts:</strong> The software feature description and technical constraints submitted into the Feature Composer.</li>
            <li><strong className="text-white">Pipeline Deliverables:</strong> Generated stage results including requirements analysis, architecture blueprints, implementation steps, and security audits.</li>
            <li><strong className="text-white">Ephemeral Web Research Queries:</strong> Search queries submitted via the Web Research Hub to discover public technical documentation.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-signal-violet font-mono">02.</span> Multi-Tenant Data Isolation
          </h2>
          <p>
            Every workflow executed on FlowForge AI is stamped with your unique authenticated <code className="text-signal-violet font-mono">user_id</code>. Our backend query engine enforces strict query-level isolation:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-outline">
            <li>All list queries (<code className="text-white font-mono">GET /api/workflows</code>) filter strictly by the authenticated caller&apos;s identity.</li>
            <li>Direct detail lookups (<code className="text-white font-mono">GET /api/workflows/:id</code>) verify ownership and return an opaque <code className="text-white font-mono">404 Not Found</code> if probed by another account.</li>
            <li>Destructive actions (<code className="text-white font-mono">DELETE /api/workflows/:id</code>) require cryptographic identity validation and block unauthorized requests with <code className="text-white font-mono">403 Forbidden</code>.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-signal-indigo font-mono">03.</span> LLM Subprocessors &amp; Zero Retention
          </h2>
          <p>
            FlowForge AI uses frontier AI models (such as Anthropic Claude 3.7 Sonnet and OpenAI GPT-4o) via commercial enterprise APIs. Under our enterprise terms of service with these providers:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-outline">
            <li><strong className="text-white">Zero Data Retention (ZDR):</strong> Customer API payloads are processed in memory and are not logged or retained beyond the inference duration.</li>
            <li><strong className="text-white">No Model Training:</strong> Your intellectual property, proprietary software prompts, and code specifications are excluded from training datasets.</li>
            <li><strong className="text-white">Encrypted Transmission:</strong> All communications between our LangGraph nodes and LLM gateways use TLS 1.3 encryption.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400 font-mono">04.</span> Web Search &amp; Citations Privacy
          </h2>
          <p>
            Our Web Research engine communicates with DuckDuckGo Search over TLS. Search queries do not contain user identifiers, IP tracking cookies, or account metadata. The citations returned in your deliverable are public URLs and documentation references discovered during autonomous reasoning.
          </p>
        </section>

        {/* Section 5 */}
        <section className="flex flex-col gap-3 p-6 rounded-2xl bg-surface-container-lowest/50 border border-white/[0.06]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-amber-400 font-mono">05.</span> Your Rights &amp; Data Deletion
          </h2>
          <p>
            You maintain full sovereignty over your data on FlowForge AI:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-outline">
            <li><strong className="text-white">Export Deliverables:</strong> Download your entire multi-agent dossier as Markdown (<code className="text-white font-mono">.md</code>), PDF (<code className="text-white font-mono">.pdf</code>), or Microsoft Word (<code className="text-white font-mono">.docx</code>) at any time.</li>
            <li><strong className="text-white">Immediate Permanent Purge:</strong> Click the delete button on any workflow in the history registry or detail dashboard to immediately and irreversibly delete the record and all child stage data.</li>
            <li><strong className="text-white">Account Termination:</strong> Closing your Clerk user account disconnects all access credentials permanently.</li>
          </ul>
        </section>

        {/* Section 6 - Contact Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-panel to-surface-panel-hover flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-signal-cyan" />
              <span>Privacy &amp; Data Protection Inquiries</span>
            </h3>
            <p className="text-xs text-outline">
              Questions regarding our data handling or compliance posture? Contact our engineering security desk.
            </p>
          </div>
          <a
            href="mailto:privacy@flowforge.ai"
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-signal-cyan text-xs font-semibold text-white transition-all"
          >
            privacy@flowforge.ai
          </a>
        </div>
      </div>
    </div>
  );
}
