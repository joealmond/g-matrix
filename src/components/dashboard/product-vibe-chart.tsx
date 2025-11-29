'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  ChartContainer,
} from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
  ResponsiveContainer,
  ReferenceArea,
  ScatterChart,
} from 'recharts';


export function ProductVibeChart() {
  const isMobile = useIsMobile();
  
  const chartConfig = {
    safety: {
      label: 'Safety',
    },
    taste: {
      label: 'Taste',
    },
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className={'cursor-grab'}>
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
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
