import { BarChart } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <div className="flex flex-col items-center gap-1 text-center">
                <BarChart className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                    Key metrics and user engagement data will be displayed here.
                </p>
            </div>
        </div>
    )
}
