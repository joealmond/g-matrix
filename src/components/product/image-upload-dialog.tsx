'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUploadForm } from './image-upload-form';
import type { ReactNode } from 'react';

export function ImageUploadDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Scan a Product</DialogTitle>
          <DialogDescription>
            Upload a photo of a product, and we'll try to identify it for you.
          </DialogDescription>
        </DialogHeader>
        <ImageUploadForm />
      </DialogContent>
    </Dialog>
  );
}
