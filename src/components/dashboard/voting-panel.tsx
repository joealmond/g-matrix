'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ThumbsUp,
  Meh,
  ThumbsDown,
} from 'lucide-react';

export function VotingPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Vibe Check</CardTitle>
        <CardDescription>Rate the current product</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">Safety</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="group h-20 flex-col gap-2 transition-all hover:border-green-500 hover:bg-green-500/10 active:scale-95"
            >
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <span className="font-semibold group-hover:text-green-400">
                Clean
              </span>
            </Button>
            <Button
              variant="outline"
              className="group h-20 flex-col gap-2 transition-all hover:border-yellow-500 hover:bg-yellow-500/10 active:scale-95"
            >
              <ShieldAlert className="h-8 w-8 text-yellow-500" />
              <span className="font-semibold group-hover:text-yellow-400">
                Sketchy
              </span>
            </Button>
            <Button
              variant="outline"
              className="group h-20 flex-col gap-2 transition-all hover:border-red-500 hover:bg-red-500/10 active:scale-95"
            >
              <ShieldX className="h-8 w-8 text-red-500" />
              <span className="font-semibold group-hover:text-red-400">
                Wrecked
              </span>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Taste</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="group h-20 flex-col gap-2 transition-all hover:border-primary hover:bg-primary/10 active:scale-95"
            >
              <ThumbsUp className="h-8 w-8 text-primary" />
              <span className="font-semibold group-hover:text-primary">
                Yass
              </span>
            </Button>
            <Button
              variant="outline"
              className="group h-20 flex-col gap-2 transition-all hover:bg-secondary/80 active:scale-95"
            >
              <Meh className="h-8 w-8 text-muted-foreground" />
              <span className="font-semibold group-hover:text-foreground">
                Meh
              </span>
            </Button>
            <Button
              variant="outline"
              className="group h-20 flex-col gap-2 transition-all hover:border-destructive hover:bg-destructive/10 active:scale-95"
            >
              <ThumbsDown className="h-8 w-8 text-destructive" />
              <span className="font-semibold group-hover:text-destructive">
                Pass
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
