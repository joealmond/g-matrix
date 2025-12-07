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
import { useRouter } from 'next/navigation';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { useTranslations } from 'next-intl';

type ImageUploadDialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};


export function ImageUploadDialog({ children, open, onOpenChange }: ImageUploadDialogProps) {
  const router = useRouter();
  const t = useTranslations('ImageUploadDialog');

  const handleProductIdentified = (analysisResult: ImageAnalysisState) => {
    // Close the dialog
    onOpenChange?.(false);
    
    // Store in session storage as a fallback
    sessionStorage.setItem('identifiedProduct', JSON.stringify(analysisResult));

    // Navigate to the vibe check page with the product name and image URL
    const url = `/vibe-check/${encodeURIComponent(analysisResult.productName || 'Unnamed Product')}`;
    router.push(url);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">{t('uploadTab')}</TabsTrigger>
            <TabsTrigger value="camera">{t('cameraTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="pt-4">
            <ImageUploadForm onProductIdentified={handleProductIdentified} />
          </TabsContent>
          <TabsContent value="camera" className="pt-4">
            <CameraCapture onProductIdentified={handleProductIdentified} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
