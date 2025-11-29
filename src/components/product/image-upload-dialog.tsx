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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CameraCapture } from './camera-capture';

export function ImageUploadDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Scan a Product</DialogTitle>
          <DialogDescription>
            Upload a photo or use your camera to scan a product, and we'll try
            to identify it for you.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Photo</TabsTrigger>
            <TabsTrigger value="camera">Use Camera</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <ImageUploadForm />
          </TabsContent>
          <TabsContent value="camera" className="pt-4">
            <CameraCapture />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
