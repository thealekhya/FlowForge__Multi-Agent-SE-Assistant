'use client';

import { BubbleBackground, BubbleBackgroundDemo } from '@/components/animate-ui/components/backgrounds/bubble';

export function BackgroundAtmosphere() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <BubbleBackground
        interactive={true}
        className="absolute inset-0 opacity-40 pointer-events-none"
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
    </div>
  );
}

export { BubbleBackground, BubbleBackgroundDemo };
