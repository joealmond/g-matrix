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

  const handleScanClick = () => {
    setDialogOpen(true);
  };

  if (!hasMounted) {
    // On the server and during initial client render, render a placeholder
    // to prevent layout shifts.
    return <div className="w-[150px] h-10" />;
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
