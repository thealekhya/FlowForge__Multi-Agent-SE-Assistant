'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MermaidViewerProps {
  chart: string;
  title?: string;
  filename?: string;
}

/**
 * Cleans and auto-formats Mermaid diagram code:
 * - Unescapes literal \n and \r\n to actual newlines (fixes Next.js console parse error)
 * - Strips outer wrapping quotes
 * - Extracts code from markdown fences
 * - Ensures valid diagram header (graph TD, flowchart TD, etc.)
 * - Quotes unquoted node text containing special characters
 */
function sanitizeMermaidChart(chart: string): string {
  if (!chart || typeof chart !== 'string') return '';

  let cleaned = chart.trim();

  // 1. Unwrap outer quotes if double-stringified
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }

  // 2. Unescape newlines, tabs, and quotes
  cleaned = cleaned
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .replace(/\\"/g, '"');

  // 3. Extract from markdown code fences if present anywhere
  const fenceMatch = cleaned.match(/```(?:mermaid)?([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```\w*\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // 4. Strip any YAML frontmatter (e.g. LangGraph's --- config: ... ---)
  cleaned = cleaned.replace(/^---\s*[\s\S]*?---\s*/, '').trim();

  // 5. Split by newlines only (preserving semicolons inside styles and labels)
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let header = '';
  const body: string[] = [];

  for (let s of lines) {
    // Detect diagram header if not already set
    if (
      !header &&
      /^(graph\s+(?:TD|TB|BT|RL|LR)|flowchart\s+(?:TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(
        s
      )
    ) {
      header = s;
      continue;
    }

    // Cylinder: [ ( inner ) ]
    s = s.replace(/\[\(\s*(.*?)\s*\)\]/g, (m, inner) => {
      const cleanInner = inner.replace(/^"+|"+$/g, '').replace(/"/g, "'");
      return `[("${cleanInner}")]`;
    });

    // Circle: ( ( inner ) )
    s = s.replace(/\(\(\s*(.*?)\s*\)\)/g, (m, inner) => {
      const cleanInner = inner.replace(/^"+|"+$/g, '').replace(/"/g, "'");
      return `(("${cleanInner}"))`;
    });

    // Square brackets: [ inner ]
    s = s.replace(/(\b[\w-]+)\s*\[\s*(.*?)\s*\]/g, (m, nodeId, inner) => {
      if (inner.startsWith('(') && inner.endsWith(')')) return m;
      const cleanInner = inner.replace(/^"+|"+$/g, '').replace(/"/g, "'");
      return `${nodeId}["${cleanInner}"]`;
    });

    // Round brackets: ( inner )
    s = s.replace(/(\b[\w-]+)\s*\((?!\()\s*(.*?)\s*(?<!\))\)/g, (m, nodeId, inner) => {
      if (inner.startsWith('"') && inner.endsWith('"')) return m;
      if (inner.startsWith('(') || inner.endsWith(')')) return m;
      if (s.includes('classDef') || s.includes(':::')) return m;
      const cleanInner = inner.replace(/^"+|"+$/g, '').replace(/"/g, "'");
      return `${nodeId}("${cleanInner}")`;
    });

    body.push(s);
  }

  if (!header) {
    header = 'graph TD';
  }

  return header + '\n  ' + body.join('\n  ');
}

export function MermaidViewer({
  chart,
  title = "Component Architecture Graph",
  filename = "flowforge-architecture-diagram",
}: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const isLight = document.documentElement.classList.contains('light');
        setThemeMode(isLight ? 'light' : 'dark');
      }
    };
    updateTheme();
    window.addEventListener('flowforge-theme-change', updateTheme);
    return () => window.removeEventListener('flowforge-theme-change', updateTheme);
  }, []);

  // Clean and sanitize mermaid chart string
  const cleanChart = React.useMemo(() => {
    return sanitizeMermaidChart(chart);
  }, [chart]);

  // Render diagram with Mermaid
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function renderChart(attempt = 0) {
      if (!cleanChart) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const id = 'mmd_' + Math.random().toString(36).replace(/[^a-z0-9]/g, '').substring(0, 8);

      try {
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready;
        }

        const mermaid = (await import('mermaid')).default;
        const isLight = themeMode === 'light';

        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          flowchart: {
            htmlLabels: false,
            useMaxWidth: true,
          },
          theme: isLight ? 'default' : 'dark',
          themeVariables: isLight
            ? {
                darkMode: false,
                background: '#FFFFFF',
                primaryColor: '#EEF2FF',
                primaryBorderColor: '#4F46E5',
                primaryTextColor: '#0F172A',
                lineColor: '#0284C7',
                secondaryColor: '#F8FAFC',
                tertiaryColor: '#E2E8F0',
                mainBkg: '#FFFFFF',
                nodeBorder: '#4F46E5',
                clusterBkg: '#F8FAFC',
                clusterBorder: '#CBD5E1',
                edgeLabelBackground: '#FFFFFF',
              }
            : {
                darkMode: true,
                background: '#090A10',
                primaryColor: '#1E1B4B',
                primaryBorderColor: '#6366F1',
                primaryTextColor: '#F8FAFC',
                lineColor: '#06B6D4',
                secondaryColor: '#0F172A',
                tertiaryColor: '#1E293B',
                mainBkg: '#090A10',
                nodeBorder: '#6366F1',
                clusterBkg: '#090A10',
                clusterBorder: '#334155',
                edgeLabelBackground: '#090A10',
              },
          fontFamily: 'JetBrains Mono, monospace',
          securityLevel: 'loose',
        });

        // Safe rendering with Mermaid
        const { svg } = await mermaid.render(id, cleanChart);

        if (isMounted) {
          setSvgContent(svg);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        // Safely clean up only this specific render's temporary element if any remained
        if (typeof document !== 'undefined') {
          document.getElementById(`d${id}`)?.remove();
          document.getElementById(id)?.remove();
        }

        // Check if this was a transient DOM / layout race condition
        const isDomRace =
          err?.message?.includes('firstChild') ||
          err?.message?.includes('null') ||
          err?.message?.includes('suitable point');

        if (isDomRace && attempt < 2 && isMounted) {
          timeoutId = setTimeout(() => {
            if (isMounted) renderChart(attempt + 1);
          }, 100);
          return;
        }

        console.warn('Mermaid diagram rendering notice:', err?.message || err);
        if (isMounted) {
          setError(err?.message || 'Architecture diagram contains non-standard syntax');
          setIsLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [cleanChart, themeMode]);

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download PNG (Rasterize SVG to high-res canvas with fallback)
  const handleDownloadPNG = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) {
      handleDownloadSVG();
      return;
    }

    setIsDownloading(true);

    try {
      // Clone SVG and normalize namespaces
      const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Defensive: Replace any foreignObject elements with SVG text to ensure canvas is NEVER tainted
      const foreignObjects = clonedSvg.querySelectorAll('foreignObject');
      foreignObjects.forEach((fo) => {
        const textContent = fo.textContent?.trim() || '';
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.textContent = textContent;
        const x = fo.getAttribute('x') || '0';
        const y = fo.getAttribute('y') || '0';
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('fill', '#F8FAFC');
        textEl.setAttribute('font-family', 'JetBrains Mono, monospace');
        textEl.setAttribute('font-size', '12px');
        fo.parentNode?.replaceChild(textEl, fo);
      });

      // Strip any external @import or external font stylesheets in clonedSvg that could trigger CORS taint
      clonedSvg.querySelectorAll('style').forEach((styleEl) => {
        styleEl.textContent = styleEl.textContent?.replace(/@import\s+url\([^)]+\);?/gi, '') || '';
      });

      const bbox = svgEl.getBoundingClientRect();
      const viewBox = svgEl.viewBox?.baseVal;
      const width = viewBox?.width || bbox.width || 800;
      const height = viewBox?.height || bbox.height || 600;

      // Scale up by 2x for ultra-sharp crisp retina image
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = (width + 40) * scale;
      canvas.height = (height + 40) * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not create canvas 2D context');

      // Dark background matching FlowForge cyber-industrial theme
      ctx.fillStyle = '#090A10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      // UTF-8 safe base64 encoding prevents cross-origin blob security taint in browsers
      const base64Data = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          ctx.drawImage(img, 20 * scale, 20 * scale, width * scale, height * scale);

          // Export PNG safely with fallback if canvas security prevents extraction
          canvas.toBlob((blob) => {
            if (!blob) {
              handleDownloadSVG();
              setIsDownloading(false);
              return;
            }
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
            setIsDownloading(false);
          }, 'image/png');
        } catch (canvasErr) {
          console.warn('Canvas export tainted or restricted, falling back to SVG vector download:', canvasErr);
          setIsDownloading(false);
          handleDownloadSVG();
        }
      };

      img.onerror = (err) => {
        console.warn('Image load error during PNG rasterization, falling back to SVG vector download:', err);
        setIsDownloading(false);
        handleDownloadSVG();
      };

      img.src = base64Data;
    } catch (e) {
      console.error('PNG download exception:', e);
      setIsDownloading(false);
      handleDownloadSVG();
    }
  };

  // Copy raw mermaid code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanChart);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-surface-panel border border-border-subtle overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
      {/* Header with Title and Download Actions */}
      <div className="px-space-md py-space-sm bg-black/40 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-signal-violet text-lg">schema</span>
          <span className="text-body-md font-bold text-white tracking-tight">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 text-signal-cyan font-mono">
            Interactive Visualizer
          </span>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center rounded-lg bg-black/50 border border-white/10 p-0.5 text-xs font-mono">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              className="px-2 py-1 hover:text-signal-cyan text-outline hover:bg-white/[0.05] rounded transition-colors"
              title="Zoom out"
            >
              &minus;
            </button>
            <span className="px-2 text-white/80 min-w-[42px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="px-2 py-1 hover:text-signal-cyan text-outline hover:bg-white/[0.05] rounded transition-colors"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-1.5 py-1 hover:text-white text-outline hover:bg-white/[0.05] rounded transition-colors text-[10px]"
              title="Reset zoom"
            >
              Reset
            </button>
          </div>

          {/* Toggle Code Button */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="btn-shimmer px-2.5 py-1.5 rounded-lg bg-surface-panel-hover border border-border-subtle hover:border-white/20 text-on-surface-variant hover:text-white text-xs font-medium flex items-center gap-1 transition-all"
            title="Toggle Mermaid source code"
          >
            <span className="material-symbols-outlined text-sm">code</span>
            <span className="hidden md:inline">{showCode ? 'View Diagram' : 'View Code'}</span>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="btn-shimmer px-2.5 py-1.5 rounded-lg bg-surface-panel-hover border border-border-subtle hover:border-white/20 text-on-surface-variant hover:text-white text-xs font-medium flex items-center gap-1 transition-all"
            title="Copy Mermaid Code"
          >
            <span className="material-symbols-outlined text-sm">{isCopied ? 'check' : 'content_copy'}</span>
            <span className="hidden md:inline">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download SVG */}
          <button
            onClick={handleDownloadSVG}
            disabled={!svgContent || isLoading}
            className="btn-shimmer px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
            title="Download crisp vector SVG"
          >
            <span className="material-symbols-outlined text-sm text-signal-cyan">file_download</span>
            <span>SVG</span>
          </button>

          {/* Download PNG (Highlighted Primary Action) */}
          <button
            onClick={handleDownloadPNG}
            disabled={!svgContent || isLoading || isDownloading}
            className="btn-shimmer relative group px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-signal-indigo via-signal-violet to-signal-cyan text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95 transition-all disabled:opacity-40"
            title="Download high-resolution PNG image"
          >
            <span className="material-symbols-outlined text-sm text-white">image</span>
            <span>{isDownloading ? 'Generating...' : 'Download Image'}</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="relative min-h-[260px] p-4 bg-black/60 overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-bedrock/80 backdrop-blur-sm gap-2">
            <span className="material-symbols-outlined text-signal-cyan text-3xl animate-spin">progress_activity</span>
            <span className="text-xs font-mono text-outline">Synthesizing Architecture Vectors...</span>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="p-space-md rounded-xl bg-signal-error/10 border border-signal-error/30 text-signal-error mb-3">
            <div className="flex items-center gap-2 font-bold text-xs mb-1">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>Diagram Rendering Notice</span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mb-2">{error}</p>
            <p className="text-xs text-outline">You can view the raw diagram specification below:</p>
            <pre className="mt-2 p-3 rounded bg-black/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
              {cleanChart}
            </pre>
          </div>
        )}

        {/* Raw Code View Mode */}
        {showCode ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-xs font-mono text-outline">
              <span>Mermaid Architecture Specification</span>
              <button
                onClick={handleCopyCode}
                className="hover:text-signal-cyan transition-colors flex items-center gap-1 text-[11px]"
              >
                <span className="material-symbols-outlined text-xs">{isCopied ? 'check' : 'content_copy'}</span>
                <span>{isCopied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-black/90 border border-border-subtle font-mono text-xs text-signal-cyan leading-relaxed overflow-x-auto select-all">
              {cleanChart}
            </pre>
          </div>
        ) : (
          /* Visual SVG Diagram View */
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="w-full flex items-center justify-center overflow-x-auto transition-transform duration-200 py-4 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:filter [&>svg]:drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-space-md py-2 bg-black/50 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-outline">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-success animate-pulse"></span>
          <span>Vector Render Engine Active</span>
        </span>
        <span className="hidden sm:inline text-white/50">
          Click &quot;Download Image&quot; to export 2x high-resolution PNG
        </span>
      </div>
    </div>
  );
}
