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
} from 'recharts';

export const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--accent))',
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
  highlightedProduct?: string;
  onPointClick?: (productName: string) => void;
};


export function MatrixChart({ chartData, highlightedProduct, onPointClick }: MatrixChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">G-Matrix</CardTitle>
        <CardDescription>Product Safety vs. Taste Ratings</CardDescription>
      </CardHeader>
      <CardContent>
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
                      <text x={cx + width/4} y={cy - height/4} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50">The Holy Grail</text>
                      <text x={cx - width/4} y={cy - height/4} fill="hsl(var(--accent-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50">Survivor Food</text>
                      <text x={cx - width/4} y={cy + height/4} fill="hsl(var(--foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50">The Bin</text>
                      <text x={cx + width/4} y={cy + height/4} fill="hsl(var(--destructive-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50">Russian Roulette</text>
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
                    formatter={(value, name) => [
                      value,
                      name === 'taste' ? 'Taste' : 'Safety',
                    ]}
                    indicator="dot"
                  />
                }
              />
              <ZAxis dataKey="product" name="product" />
              <Scatter
                name="Products"
                data={chartData}
                onClick={(data) => onPointClick?.(data.product)}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => {
                  const isHighlighted = highlightedProduct === entry.product;
                   return (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartColors[index % chartColors.length]}
                      stroke={isHighlighted ? 'white' : 'transparent'}
                      strokeWidth={isHighlighted ? 3 : 0}
                      className={isHighlighted ? 'animate-pulse' : ''}
                    />
                  );
                })}
                </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
