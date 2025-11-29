import { Shield } from "lucide-react";

export default function AdminPage() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <div className="flex flex-col items-center gap-1 text-center">
                <Shield className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">Admin Panel</h3>
                <p className="text-sm text-muted-foreground">
                    This section is for moderators and admins to manage reports and users.
                </p>
            </div>
        </div>
    )
}
