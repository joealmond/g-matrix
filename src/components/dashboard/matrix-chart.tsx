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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  isDraggable?: boolean;
  showTooltip?: boolean;
};

const CustomDot = (props: any) => {
  const {
    cx,
    cy,
    payload,
    index,
    isDraggable,
    onMouseDown,
    onTouchStart,
    highlightedProduct,
  } = props;
  const isHighlighted = highlightedProduct === payload.product;
  const dotColor = chartColors[index % chartColors.length];

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isHighlighted ? 10 : 6}
      fill={dotColor}
      stroke={isHighlighted ? 'white' : 'transparent'}
      strokeWidth={isHighlighted ? 3 : 0}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={cn(
        isDraggable ? 'cursor-grab' : 'cursor-pointer',
        isHighlighted && !isDraggable ? 'animate-pulse' : '',
        'transition-all'
      )}
    />
  );
};


export function MatrixChart({
  chartData,
  highlightedProduct,
  onPointClick,
  onVibeChange,
  isDraggable = false,
  showTooltip = true,
}: MatrixChartProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null); // To get access to chart methods
  const [isDragging, setIsDragging] = useState(false);

  const getVibeFromCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
      if (!chartRef.current) return null;
  
      const container = chartRef.current.container;
      const bounds = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const chart = chartRef.current.chart;
      if (!chart) return null;

      const xAxisMap = chart.xAxisMap[0];
      const yAxisMap = chart.yAxisMap[0];

      if (!xAxisMap || !yAxisMap) return null;
      
      // Calculate cursor position relative to the chart plot area
      const x = clientX - bounds.left - xAxisMap.x + container.scrollLeft;
      const y = clientY - bounds.top - yAxisMap.y + container.scrollTop;

      // Convert position to domain values
      let taste = xAxisMap.scale.invert(x);
      let safety = yAxisMap.scale.invert(y);
      
      // Clamp values between 0 and 100
      taste = Math.max(0, Math.min(100, Math.round(taste)));
      safety = Math.max(0, Math.min(100, Math.round(safety)));
      
      return { taste, safety };

    }, []);

  const handlePointerDown = useCallback((e: any) => {
    if (!isDraggable || !onVibeChange) return;
    setIsDragging(true);
    // e.stopPropagation();
  }, [isDraggable, onVibeChange]);


  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (isDragging && onVibeChange) {
      const newVibe = getVibeFromCoordinates(e);
      if (newVibe) {
        onVibeChange(newVibe);
      }
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDraggable) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handlePointerMove(e);
      const upHandler = () => handlePointerUp();

      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
      document.addEventListener('touchmove', moveHandler);
      document.addEventListener('touchend', upHandler);

      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', upHandler);
      };
    }
  }, [isDraggable, onVibeChange, getVibeFromCoordinates, isDragging]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">G-Matrix</CardTitle>
        <CardDescription>Product Safety vs. Taste Ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className={cn(
            isDragging ? 'cursor-grabbing' : 'cursor-default',
            isDraggable ? 'select-none' : ''
          )}
        >
          <ChartContainer
            config={chartConfig}
            className="w-full aspect-square sm:aspect-video h-auto"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                ref={chartRef}
                margin={{
                  top: 20,
                  right: isMobile ? 10 : 20,
                  bottom: 20,
                  left: isMobile ? -20 : 0,
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
                    offset={-15}
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
                    offset={isMobile ? 0 : 10}
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

                {showTooltip && <ChartTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={
                    <ChartTooltipContent
                      labelKey="product"
                      nameKey="product"
                      formatter={(value, name, props) => {
                        const itemIndex = chartData.findIndex(d => d.product === props.payload.product);
                        if (itemIndex === -1) return [value, name];
                        const color = chartColors[itemIndex % chartColors.length];

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
                />}
                <ZAxis dataKey="product" name="product" />
                <Scatter
                  name="Products"
                  data={chartData}
                  shape={(props) => (
                    <CustomDot
                      {...props}
                      isDraggable={isDraggable}
                      onMouseDown={(e: any) => handlePointerDown(e)}
                      onTouchStart={(e: any) => handlePointerDown(e)}
                      highlightedProduct={highlightedProduct}
                    />
                  )}
                  onClick={(data, index, event) => {
                    if (!isDragging && event) {
                      onPointClick?.(data.product);
                      // event.stopPropagation(); // This was causing issues
                    }
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
