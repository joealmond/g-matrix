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
import React from 'react';
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
  showTooltip?: boolean;
};


const CustomDot = (props: any) => {
  const {
    cx,
    cy,
    payload,
    index,
    highlightedProduct,
  } = props;
  const isHighlighted = highlightedProduct === payload.product;
  const dotColor = chartColors[index % chartColors.length];

  // This prevents rendering if the coordinates are invalid, which can happen during chart initialization.
  if (isNaN(cx) || isNaN(cy)) {
    return null;
  }
  
  return (
    <g>
       <Dot
        cx={cx}
        cy={cy}
        r={isHighlighted ? 10 : 6}
        fill={dotColor}
        strokeWidth={0}
        className={cn(
          'cursor-pointer drop-shadow-lg',
          'transition-all'
        )}
      />
      {isHighlighted && <Dot cx={cx} cy={cy} r={12} fill="transparent" stroke={dotColor} strokeWidth={2} className="animate-pulse" />}
    </g>
  );
};


export function MatrixChart({
  chartData,
  highlightedProduct,
  onPointClick,
  showTooltip = true,
}: MatrixChartProps) {
  const isMobile = useIsMobile();
  const showDots = chartData.length > 0 && chartData.some(d => d.taste !== undefined && d.safety !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">G-Matrix</CardTitle>
        <CardDescription>Product Safety vs. Taste Ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={'cursor-default'}
        >
          <ChartContainer
            config={chartConfig}
            className="w-full aspect-square sm:aspect-video h-auto"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
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
                {showDots && (
                  <Scatter
                    name="Products"
                    data={chartData}
                    shape={(props) => (
                      <CustomDot
                        {...props}
                        highlightedProduct={highlightedProduct}
                      />
                    )}
                    onClick={(data) => {
                       onPointClick?.(data.product);
                    }}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
