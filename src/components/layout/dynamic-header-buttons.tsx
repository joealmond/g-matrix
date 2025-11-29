'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';

export function DynamicHeaderButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleProductIdentified = (productName: string, imageUrl?: string) => {
    setDialogOpen(false);
    const productData = { name: productName, imageUrl: imageUrl || '' };
    sessionStorage.setItem('identifiedProduct', JSON.stringify(productData));
    const url = `/vibe-check/${encodeURIComponent(productName)}`;
    router.push(url);
  };

  const handleScanClick = () => {
    setDialogOpen(true);
  };

  if (!hasMounted) {
    // On the server and during initial client render, render a placeholder
    // or nothing to prevent hydration mismatch. A div with the same height
    // can prevent layout shifts.
    return <div className="w-[150px]" />;
  }

  const isSpecialPage =
    pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/');

  return (
    <div className="flex items-center gap-4 w-[150px] justify-end">
      {isSpecialPage ? (
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      ) : (
        <ImageUploadDialog
          open={isDialogOpen}
          onOpenChange={setDialogOpen}
          onProductIdentified={handleProductIdentified}
        >
          <Button onClick={handleScanClick}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Scan Product</span>
          </Button>
        </ImageUploadDialog>
      )}
    </div>
  );
}
