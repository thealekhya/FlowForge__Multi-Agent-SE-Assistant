'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('flowforge_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('flowforge_theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
    window.dispatchEvent(new CustomEvent('flowforge-theme-change', { detail: { theme: next } }));
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-white/30 text-outline hover:text-white transition-all cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle dark/light mode"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-300 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-signal-indigo group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
