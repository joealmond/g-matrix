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
} from 'recharts';

const chartData = [
  { product: 'Udis Gluten Free Bread', safety: 85, taste: 70 },
  { product: 'Canyon Bakehouse Bread', safety: 95, taste: 90 },
  { product: 'King Arthur Flour', safety: 98, taste: 95 },
  { product: 'Bobs Red Mill Flour', safety: 92, taste: 88 },
  { product: 'Cheerios', safety: 40, taste: 80 },
  { product: 'Snyders GF Pretzels', safety: 75, taste: 92 },
  { product: 'Katz Donuts', safety: 88, taste: 85 },
  { product: 'Oreo Gluten Free', safety: 60, taste: 98 },
];

const chartConfig = {
  safety: {
    label: 'Safety',
  },
  taste: {
    label: 'Taste',
  },
  product: {
    label: 'Product'
  }
};

export function MatrixChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">G-Matrix</CardTitle>
        <CardDescription>Product Safety vs. Taste Ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-video h-[400px] w-full"
        >
          <ResponsiveContainer>
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 40,
                left: 20,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="taste"
                type="number"
                name="Taste"
                unit="%"
                domain={[0, 100]}
                stroke="hsl(var(--foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              >
                <Label
                  value="Taste Vibe"
                  offset={-25}
                  position="insideBottom"
                  fill="hsl(var(--foreground))"
                />
              </XAxis>
              <YAxis
                dataKey="safety"
                type="number"
                name="Safety"
                unit="%"
                domain={[0, 100]}
                stroke="hsl(var(--foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              >
                <Label
                  value="Safety Vibe"
                  angle={-90}
                  offset={-5}
                  position="insideLeft"
                  fill="hsl(var(--foreground))"
                />
              </YAxis>
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
              <Scatter
                name="Products"
                data={chartData}
                fill="hsl(var(--primary))"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
