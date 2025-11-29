import { Card, CardContent } from '@/components/ui/card';

export function AdSlot() {
  return (
    <Card className="flex min-h-[120px] items-center justify-center border-dashed">
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground">Future Ad Slot</p>
      </CardContent>
    </Card>
  );
}
