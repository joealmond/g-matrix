'use client';

import { Shield, ShieldAlert, Loader2, Database } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();
    const { user, loading: isUserLoading } = useUser();
    const router = useRouter();

    const isLoading = isAdminLoading || isUserLoading;

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isLoading, isAdmin, router]);

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAdmin) {
       return (
         <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <div className="flex flex-col items-center gap-1 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">Access Denied</h3>
                <p className="text-sm text-muted-foreground">
                    You do not have permission to view this page. Redirecting...
                </p>
            </div>
        </div>
       )
    }

    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <div className="flex flex-col items-center gap-4 text-center">
                <Shield className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">Admin Panel</h3>
                <p className="text-sm text-muted-foreground">
                    Welcome, admin! Manage your application from here.
                </p>
                <Button asChild>
                    <Link href="/admin/dashboard">
                        <Database className="mr-2 h-4 w-4" />
                        Manage Products
                    </Link>
                </Button>
            </div>
        </div>
    )
}
