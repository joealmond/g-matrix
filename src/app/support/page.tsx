import { HelpCircle } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <div className="flex flex-col items-center gap-1 text-center">
                <HelpCircle className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">Support</h3>
                <p className="text-sm text-muted-foreground">
                    Get help, read FAQs, or contact our support team.
                </p>
            </div>
        </div>
    )
}
