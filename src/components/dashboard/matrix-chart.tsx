'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState } from 'react';
import {
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  ReferenceArea,
  ZAxis,
  Cell,
  Dot,
} from 'recharts';

export const chartColors = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
];


const chartConfig = {
  safety: {
    label: 'Safety',
  },
  taste: {
    label: 'Taste',
  },
  product: {
    label: 'Product',
  },
};

type MatrixChartProps = {
  chartData: { product: string; safety: number; taste: number }[];
  highlightedProduct?: string | null;
  onPointClick?: (productName: string) => void;
  onVibeChange?: (vibe: { safety: number; taste: number }) => void;
};


export function MatrixChart({ chartData, highlightedProduct, onPointClick, onVibeChange }: MatrixChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getVibeFromCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return null;

    const container = containerRef.current.querySelector('.recharts-surface');
    if (!container) return null;

    const bounds = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - bounds.left;
    const y = clientY - bounds.top;

    // These values might need to be adjusted if margins/paddings change
    const chartLeft = 60;
    const chartRight = bounds.width - 20;
    const chartTop = 20;
    const chartBottom = bounds.height - 40;
    
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    let taste = ((x - chartLeft) / chartWidth) * 100;
    let safety = 100 - ((y - chartTop) / chartHeight) * 100;

    // Clamp values between 0 and 100
    taste = Math.max(0, Math.min(100, Math.round(taste)));
    safety = Math.max(0, Math.min(100, Math.round(safety)));

    return { taste, safety };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onVibeChange) return;
    // Check if the click is on a dot
    const target = e.target as HTMLElement;
    if (target.classList.contains('recharts-dot')) {
       setIsDragging(true);
       e.preventDefault();
    }
  }, [onVibeChange]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging && onVibeChange) {
      const newVibe = getVibeFromCoordinates(e);
      if (newVibe) {
        onVibeChange(newVibe);
      }
      e.preventDefault();
    }
  }, [isDragging, onVibeChange, getVibeFromCoordinates]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">G-Matrix</CardTitle>
        <CardDescription>Product Safety vs. Taste Ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={cn(isDragging ? 'cursor-grabbing' : 'cursor-default', onVibeChange ? 'select-none' : '')}
        >
          <ChartContainer
            config={chartConfig}
            className="w-full aspect-square sm:aspect-video h-auto"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 40,
                  left: 20,
                }}
              >
                {/* Quadrant Backgrounds */}
                <ReferenceArea
                  x1={50}
                  x2={100}
                  y1={50}
                  y2={100}
                  stroke="hsl(var(--primary) / 0.2)"
                  fill="hsl(var(--primary) / 0.1)"
                  ifOverflow="visible"
                />
                <ReferenceArea
                  x1={0}
                  x2={50}
                  y1={50}
                  y2={100}
                  stroke="hsl(var(--accent) / 0.2)"
                  fill="hsl(var(--accent) / 0.1)"
                  ifOverflow="visible"
                />
                <ReferenceArea
                  x1={50}
                  x2={100}
                  y1={0}
                  y2={50}
                  stroke="hsl(var(--destructive) / 0.2)"
                  fill="hsl(var(--destructive) / 0.1)"
                  ifOverflow="visible"
                />
                <ReferenceArea
                  x1={0}
                  x2={50}
                  y1={0}
                  y2={50}
                  stroke="hsl(var(--muted) / 0.3)"
                  fill="hsl(var(--muted) / 0.2)"
                  ifOverflow="visible"
                />

                {/* Quadrant Labels */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="taste"
                  type="number"
                  name="Taste"
                  domain={[0, 100]}
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                >
                  <Label
                    value="Was it good?"
                    offset={-25}
                    position="insideBottom"
                    fill="hsl(var(--foreground))"
                    className="text-sm"
                  />
                </XAxis>
                <YAxis
                  dataKey="safety"
                  type="number"
                  name="Safety"
                  domain={[0, 100]}
                  stroke="hsl(var(--foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                >
                  <Label
                    value="Did you survive?"
                    angle={-90}
                    offset={-5}
                    position="insideLeft"
                    fill="hsl(var(--foreground))"
                    className="text-sm"
                  />
                </YAxis>
                
                {/* Labels positioned with recharts API */}
                <Label content={({ viewBox }) => {
                    if (!viewBox || !viewBox.width || !viewBox.height) return null;
                    const { x, y, width, height } = viewBox;
                    const cx = x + width / 2;
                    const cy = y + height / 2;
                    return (
                      <>
                        <text x={cx + width/4} y={cy - height/4} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">The Holy Grail</text>
                        <text x={cx - width/4} y={cy - height/4} fill="hsl(var(--accent-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">Survivor Food</text>
                        <text x={cx - width/4} y={cy + height/4} fill="hsl(var(--foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">The Bin</text>
                        <text x={cx + width/4} y={cy + height/4} fill="hsl(var(--destructive-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">Russian Roulette</text>
                      </>
                    );
                  }}
                />

                <ChartTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={
                    <ChartTooltipContent
                      labelKey="product"
                      nameKey="product"
                      formatter={(value, name, props) => {
                        const color = chartColors[chartData.findIndex(d => d.product === value) % chartColors.length];
                        if (name === 'product') {
                          return (
                            <span className="font-bold" style={{ color }}>
                              {value}
                            </span>
                          );
                        }
                        return [
                          value,
                          name === 'taste' ? 'Taste' : 'Safety',
                        ];
                      }}
                      indicator="dot"
                      className="min-w-[12rem] text-base"
                    />
                  }
                />
                <ZAxis dataKey="product" name="product" range={[64, 64]} />
                <Scatter
                  name="Products"
                  data={chartData}
                  onClick={(data) => {
                    if (!isDragging) {
                      onPointClick?.(data.product);
                    }
                  }}
                  className={cn(onVibeChange ? "cursor-grab" : "cursor-pointer", isDragging ? 'cursor-grabbing' : '')}
                >
                  {chartData.map((entry, index) => {
                    const isHighlighted = highlightedProduct === entry.product;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                        stroke={isHighlighted ? 'white' : 'transparent'}
                        strokeWidth={isHighlighted ? 3 : 0}
                        className={cn(isHighlighted ? 'animate-pulse' : '', 'transition-all')}
                      />
                    );
                  })}
                  </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
