'use client';

import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface DraggableDotProps {
  safety: number;
  taste: number;
  onVibeChange: (vibe: { safety: number; taste: number }) => void;
}

export function DraggableDot({
  safety,
  taste,
  onVibeChange,
}: DraggableDotProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dotRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dotRef.current?.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
      const y = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));

      const newTaste = Math.round((x / containerRect.width) * 100);
      const newSafety = Math.round(100 - (y / containerRect.height) * 100);

      onVibeChange({ safety: newSafety, taste: newTaste });
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
    }
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isDragging, onVibeChange]);

  // This outer div is the reference for positioning
  // It needs to align perfectly with the chart's plot area.
  // The padding values are adjusted to match the recharts plot area.
  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{
        paddingTop: '3.7rem', // Approximates recharts margin + header
        paddingBottom: '3.5rem',// Approximates recharts margin
        paddingLeft: '1.5rem', // Approximates recharts margin
        paddingRight: '3.5rem', // Approximates recharts margin
      }}
    >
      <div
        ref={dotRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={cn(
          'absolute w-6 h-6 rounded-full bg-primary border-4 border-primary-foreground shadow-lg cursor-grab transition-transform',
          isDragging ? 'cursor-grabbing scale-125' : 'scale-100'
        )}
        style={{
          left: `calc(${taste}% - 12px)`, // Center the dot
          top: `calc(${100 - safety}% - 12px)`, // Center the dot
          touchAction: 'none',
        }}
      />
    </div>
  );
}
