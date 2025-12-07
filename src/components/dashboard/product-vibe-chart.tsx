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
import { useTranslations } from 'next-intl';


export function ProductVibeChart() {
  const isMobile = useIsMobile();
  const t = useTranslations('MatrixChart');
  
  const chartConfig = {
    safety: {
      label: 'Safety',
    },
    taste: {
      label: 'Taste',
    },
  };

  return (
      <div className={'cursor-grab h-full w-full'}>
        <ChartContainer
          config={chartConfig}
          className="w-full h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: isMobile ? 10 : 20,
                bottom: 20,
                left: isMobile ? -20 : 0,
              }}
            >
              {/* Quadrant Backgrounds */}
              {/* Top-Right: Holy Grail (Green) */}
              <ReferenceArea
                x1={50}
                x2={100}
                y1={50}
                y2={100}
                stroke="hsl(var(--accent) / 0.2)"
                fill="hsl(var(--accent) / 0.1)"
                ifOverflow="visible"
              />
              {/* Top-Left: Survivor Food (Yellow/Muted) */}
              <ReferenceArea
                x1={0}
                x2={50}
                y1={50}
                y2={100}
                stroke="hsl(var(--muted) / 0.3)"
                fill="hsl(var(--muted) / 0.2)"
                ifOverflow="visible"
              />
              {/* Bottom-Right: Russian Roulette (Red) */}
              <ReferenceArea
                x1={50}
                x2={100}
                y1={0}
                y2={50}
                stroke="hsl(var(--destructive) / 0.2)"
                fill="hsl(var(--destructive) / 0.1)"
                ifOverflow="visible"
              />
              {/* Bottom-Left: The Bin (Red) */}
              <ReferenceArea
                x1={0}
                x2={50}
                y1={0}
                y2={50}
                stroke="hsl(var(--destructive) / 0.3)"
                fill="hsl(var(--destructive) / 0.2)"
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
                  value={t('tasteAxisLabel')}
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
                  value={t('safetyAxisLabel')}
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
                      <text x={cx + width/4} y={cy - height/4} fill="hsl(var(--accent-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">{t('holyGrail')}</text>
                      <text x={cx - width/4} y={cy - height/4} fill="hsl(var(--foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">{t('survivorFood')}</text>
                      <text x={cx - width/4} y={cy + height/4} fill="hsl(var(--destructive-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">{t('theBin')}</text>
                      <text x={cx + width/4} y={cy + height/4} fill="hsl(var(--destructive-foreground))" textAnchor="middle" dominantBaseline="middle" className="font-bold opacity-50 pointer-events-none">{t('russianRoulette')}</text>
                    </>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
  );
}
