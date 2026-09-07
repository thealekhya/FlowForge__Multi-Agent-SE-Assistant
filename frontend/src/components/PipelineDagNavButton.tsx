'use client';

import React, { useState } from 'react';
import { PipelineDagModal } from '@/components/PipelineDagModal';

export function PipelineDagNavButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="nav-link text-on-surface-variant font-medium pb-space-xs hover:text-white transition-colors duration-150 flex items-center gap-1.5 cursor-pointer group"
        title="Inspect and download the LangGraph Multi-Agent Architecture DAG"
      >
        <span className="material-symbols-outlined text-sm text-signal-violet group-hover:rotate-180 transition-transform duration-300">
          account_tree
        </span>
        <span>Architecture DAG</span>
      </button>

      <PipelineDagModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
