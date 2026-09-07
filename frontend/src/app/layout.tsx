import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Inter, Geist } from "next/font/google";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
import {
  Workflow,
  Sparkles,
  Compass,
  Clock,
  Search,
  Plus,
  Shield,
  Lock,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

import { BackgroundAtmosphere } from "@/components/BackgroundAtmosphere";
import { ThemeToggle } from "@/components/ThemeToggle";

// Distinct header typography: sharp, geometric, high-tech
const headerFont = Outfit({
  variable: "--font-header",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Distinct footer typography: engineered, precise monospace/micro-sans
const footerFont = JetBrains_Mono({
  variable: "--font-footer",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Primary body typography
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowForge AI — Autonomous Feature Delivery Pipeline",
  description: "Transform Feature Requests into Production-Grade Dev Plans with LangGraph and Claude.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${headerFont.variable} ${footerFont.variable} ${inter.variable} ${geist.variable} font-sans bg-surface-bedrock text-on-surface antialiased overflow-x-hidden relative min-h-screen flex flex-col selection:bg-signal-violet selection:text-white transition-colors duration-200`}
      >
        <ClerkProvider>
          {/* Atmospheric ambient orbs */}
          <BackgroundAtmosphere />

          {/* MINIMAL SLEEK METALLIC HEADER */}
          <header className="sticky top-0 z-50 w-full bg-surface-bedrock/85 backdrop-blur-2xl border-b border-white/[0.12] transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.5)] font-header">
            {/* Top specular brushed metallic line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Brand Logo & Navigation */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/15 via-white/5 to-white/10 border border-white/25 flex items-center justify-center group-hover:border-signal-cyan/60 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] group-hover:shadow-[0_0_16px_rgba(6,182,212,0.4)]">
                    <Workflow className="w-4 h-4 text-signal-cyan group-hover:rotate-45 transition-transform duration-300" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-white group-hover:text-white/90 transition-colors">
                      FlowForge
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-signal-cyan border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                      AI
                    </span>
                  </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm tracking-tight">
                  <Link
                    href="/"
                    className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium"
                  >
                    Home
                  </Link>

                  <Show when="signed-out">
                    <SignInButton mode="modal" forceRedirectUrl="/create">
                      <button className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium cursor-pointer">
                        Feature Composer
                      </button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/create"
                      className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium"
                    >
                      Feature Composer
                    </Link>
                  </Show>

                  <Show when="signed-out">
                    <SignInButton mode="modal" forceRedirectUrl="/research">
                      <button className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium flex items-center gap-1.5 cursor-pointer">
                        <Compass className="w-3.5 h-3.5 text-signal-cyan" />
                        <span>Web Research</span>
                      </button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/research"
                      className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium flex items-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5 text-signal-cyan" />
                      <span>Web Research</span>
                    </Link>
                  </Show>

                  <Show when="signed-out">
                    <SignInButton mode="modal" forceRedirectUrl="/history">
                      <button className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium flex items-center gap-1.5 cursor-pointer">
                        <Clock className="w-3.5 h-3.5 text-signal-indigo" />
                        <span>History</span>
                      </button>
                    </SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/history"
                      className="text-on-surface-variant hover:text-white transition-colors duration-150 font-medium flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-signal-indigo" />
                      <span>History</span>
                    </Link>
                  </Show>
                </nav>
              </div>

              {/* Right Controls: Search, Dark/Light Mode & Sleek Metallic Create Workflow CTA */}
              <div className="flex items-center gap-2.5">
                {/* Search Pill */}
                <Show when="signed-out">
                  <SignInButton mode="modal" forceRedirectUrl="/research">
                    <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg metallic-pill hover:border-white/30 transition-all text-xs text-outline hover:text-white cursor-pointer">
                      <Search className="w-3.5 h-3.5 text-signal-cyan" />
                      <span>Search research...</span>
                      <kbd className="hidden lg:inline-block text-[10px] font-mono text-outline/80 px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 ml-1">
                        ⌘K
                      </kbd>
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link
                    href="/research"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg metallic-pill hover:border-white/30 transition-all text-xs text-outline hover:text-white cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-signal-cyan" />
                    <span>Search research...</span>
                    <kbd className="hidden lg:inline-block text-[10px] font-mono text-outline/80 px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 ml-1">
                      ⌘K
                    </kbd>
                  </Link>
                </Show>

                {/* Dark / Light Mode Switcher */}
                <ThemeToggle />

                {/* Sleek Minimal Metallic Create Workflow Button (Top Right Corner) */}
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="text-xs font-semibold text-on-surface-variant hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignInButton mode="modal" forceRedirectUrl="/create">
                    <button className="metallic-button relative group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white/95 tracking-tight cursor-pointer active:scale-95">
                      <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan shadow-[0_0_8px_#06b6d4]"></span>
                      <span>Create Workflow</span>
                      <Plus className="w-3.5 h-3.5 text-white/70 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </SignInButton>
                </Show>

                <Show when="signed-in">
                  <Link
                    href="/create"
                    className="metallic-button relative group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white/95 tracking-tight active:scale-95"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-signal-cyan shadow-[0_0_8px_#06b6d4]"></span>
                    <span>Create Workflow</span>
                    <Plus className="w-3.5 h-3.5 text-white/70 group-hover:rotate-90 transition-transform duration-300" />
                  </Link>

                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox:
                          "w-8 h-8 rounded-lg border border-white/20 hover:border-signal-violet transition-colors",
                      },
                    }}
                  />
                </Show>
              </div>
            </div>
          </header>

          {/* MAIN PAGE VIEWPORT */}
          <main className="relative z-10 flex-1 flex flex-col items-center py-8">
            {children}
          </main>

          {/* MINIMAL SLEEK METALLIC FOOTER */}
          <footer className="w-full border-t border-white/[0.12] bg-surface-bedrock/95 backdrop-blur-2xl relative z-20 mt-auto font-footer">
            {/* Top specular brushed metallic line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                {/* Brand Info */}
                <div className="md:col-span-1 flex flex-col gap-3">
                  <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                      <Workflow className="w-3.5 h-3.5 text-signal-cyan" />
                    </div>
                    <span className="font-bold text-sm text-white tracking-tight font-header">
                      FlowForge AI
                    </span>
                  </Link>
                  <p className="text-[11px] text-outline leading-relaxed font-sans">
                    Autonomous multi-agent feature delivery pipeline powered by LangGraph, Claude 3.7 Sonnet, and GPT-4o.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-medium tracking-wide">
                      ALL SYSTEMS OPERATIONAL
                    </span>
                  </div>
                </div>

                {/* Product Links */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    // Platform
                  </span>
                  <ul className="flex flex-col gap-2 text-xs text-outline font-sans">
                    <li>
                      <Link href="/" className="hover:text-white transition-colors">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link href="/create" className="hover:text-white transition-colors">
                        Feature Composer
                      </Link>
                    </li>
                    <li>
                      <Link href="/research" className="hover:text-white transition-colors">
                        Web Research Hub
                      </Link>
                    </li>
                    <li>
                      <Link href="/history" className="hover:text-white transition-colors">
                        Execution History
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Trust & Security */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    // Trust &amp; Security
                  </span>
                  <ul className="flex flex-col gap-2 text-xs text-outline font-sans">
                    <li>
                      <Link
                        href="/security"
                        className="hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Shield className="w-3 h-3 text-signal-violet" />
                        <span>Security Posture</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/privacy"
                        className="hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3 text-signal-cyan" />
                        <span>Privacy Policy</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/security" className="hover:text-white transition-colors">
                        Clerk Identity Isolation
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="hover:text-white transition-colors">
                        Zero LLM Data Training
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Engineering Architecture */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    // Engine
                  </span>
                  <ul className="flex flex-col gap-2 text-xs text-outline font-sans">
                    <li>
                      <span className="text-white/60">LangGraph Multi-Agent DAG</span>
                    </li>
                    <li>
                      <span className="text-white/60">DuckDuckGo Realtime Search</span>
                    </li>
                    <li>
                      <span className="text-white/60">Export to PDF, DOCX &amp; MD</span>
                    </li>
                    <li>
                      <span className="font-mono text-[11px] text-signal-cyan">v2.4.0-production</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Copyright & Legal row */}
              <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-outline">
                <p>&copy; {new Date().getFullYear()} FlowForge AI, Inc. Autonomous pipeline orchestration.</p>
                <div className="flex items-center gap-6">
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/security" className="hover:text-white transition-colors">
                    Security Posture
                  </Link>
                  <span className="text-white/20">|</span>
                  <span className="text-outline">TLS 1.3 Encrypted</span>
                </div>
              </div>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
