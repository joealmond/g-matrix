import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <div className="flex flex-col items-center gap-1 text-center">
                <Settings className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your application preferences and settings.
                </p>
            </div>
        </div>
    )
}
