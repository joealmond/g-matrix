'use client';

import {
  ArrowLeft,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { useEffect, useState } from 'react';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  const handleProductIdentified = (productName: string, imageUrl?: string) => {
    setDialogOpen(false);
    
    // Store data in sessionStorage to avoid long URLs
    const productData = { name: productName, imageUrl: imageUrl || '' };
    sessionStorage.setItem('identifiedProduct', JSON.stringify(productData));

    const url = `/vibe-check/${encodeURIComponent(productName)}`;
    router.push(url);
  }

  const isSpecialPage = pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/');

  const handleScanClick = () => {
    setDialogOpen(true);
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6 z-40">
        <nav className="flex items-center w-full text-lg font-medium">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
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
           <div className="flex items-center gap-4">
              {!hasMounted ? null : isSpecialPage ? (
                 <Button asChild>
                    <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Link>
                 </Button>
              ) : (
                <ImageUploadDialog open={isDialogOpen} onOpenChange={setDialogOpen} onProductIdentified={handleProductIdentified}>
                  <Button onClick={handleScanClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Scan Product</span>
                  </Button>
                </ImageUploadDialog>
              )}
          </div>
        </nav>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        {children}
      </main>
    </div>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutContent>{children}</AppLayoutContent>
}
