'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  ArrowLeft,
  BarChart,
  HelpCircle,
  Home,
  Settings,
  Shield,
  Upload,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { Fab } from '@/components/layout/fab';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary"
                >
                  <path
                    d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 7L12 12L22 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12V22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </Button>
            <h1 className="font-headline text-lg font-semibold truncate">
              G-Matrix
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'}>
                <Link href="/">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="md:hidden">
              <ImageUploadDialog>
                <SidebarMenuButton>
                  <Upload />
                  <span>Scan Product</span>
                </SidebarMenuButton>
              </ImageUploadDialog>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                <Link href="/admin">
                  <Shield />
                  <span>Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/analytics'}>
                <Link href="/analytics">
                  <BarChart />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/support'}>
                <Link href="/support">
                  <HelpCircle />
                  <span>Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/settings'}>
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/account'}>
                <Link href="/account" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://picsum.photos/seed/user/100/100"
                      data-ai-hint="user avatar"
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className="truncate">User Account</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">{/* Could add breadcrumbs here */}</div>
          <div className="hidden md:flex items-center gap-4">
            <ImageUploadDialog>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                <span>Scan Product</span>
              </Button>
            </ImageUploadDialog>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User />
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        {isMobile && (
          <ImageUploadDialog>
            <Fab>
              <Upload />
            </Fab>
          </ImageUploadDialog>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleProductIdentified = (productName: string) => {
    setDialogOpen(false);
    router.push(`/product/${encodeURIComponent(productName)}`);
  }

  const isProductPage = pathname.startsWith('/product/');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6 z-40">
        <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 w-full">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
             <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary h-6 w-6"
              >
                <path
                  d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 7L12 12L22 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            <span className="sr-only">G-Matrix</span>
          </Link>
          <div className="flex-1" />
           <div className="hidden md:flex items-center gap-4">
              {isProductPage ? (
                 <Button asChild>
                    <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Link>
                 </Button>
              ) : (
                <ImageUploadDialog open={isDialogOpen} onOpenChange={setDialogOpen} onProductIdentified={handleProductIdentified}>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Scan Product</span>
                  </Button>
                </ImageUploadDialog>
              )}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User />
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        {children}
      </main>
       {isMobile && (
          <ImageUploadDialog open={isDialogOpen} onOpenChange={setDialogOpen} onProductIdentified={handleProductIdentified}>
            <Fab>
              <Upload />
            </Fab>
          </ImageUploadDialog>
        )}
    </div>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if(pathname.startsWith('/admin')) {
    return <AdminLayout>{children}</AdminLayout>
  }

  return <UserLayout>{children}</UserLayout>
}
