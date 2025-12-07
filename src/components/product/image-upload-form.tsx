'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { analyzeAndUploadProduct } from '@/app/actions';
import { initialState, ImageAnalysisState } from '@/lib/actions-types';
import { useTranslations } from 'next-intl';

type ImageUploadFormProps = {
  onProductIdentified?: (result: ImageAnalysisState) => void;
};

function SubmitButton({ t }: { t: (key: string) => string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? t('analyzing') : t('analyzeButton')}
        </Button>
    )
}

export function ImageUploadForm({ onProductIdentified }: ImageUploadFormProps) {
  const { toast } = useToast();
  const t = useTranslations('ImageUploadForm');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [state, formAction] = useActionState(analyzeAndUploadProduct, initialState);

  useEffect(() => {
    if (state.success && state.productName) {
        if (onProductIdentified) {
            onProductIdentified(state);
        } else {
            console.error("onProductIdentified callback not provided");
        }
        // Reset form after success
        formRef.current?.reset();
        setPreview(null);
    } else if (state.error) {
        toast({
            variant: 'destructive',
            title: t('analysisFailed'),
            description: state.error,
        });
    }
  }, [state, onProductIdentified, toast]);

  const handleFile = (file: File | null | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: t('fileTooLarge'),
          description: t('fileTooLargeDesc')
        });
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
    }
    handleFile(file);
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="photo-upload">{t('photoLabel')}</Label>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors',
            isDragging && 'border-primary bg-primary/10'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">{t('clickToUpload')}</span> {t('orDragDrop')}
            </p>
            <p className="text-xs text-muted-foreground">{t('fileTypes')}</p>
          </div>
          <Input
            id="photo-upload"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="sr-only"
            required
          />
        </div>
      </div>

      {preview && (
        <div className="relative h-48 w-full overflow-hidden rounded-md border">
          <img src={preview} alt={t('imagePreview')} className="object-contain w-full h-full" />
        </div>
      )}

      <SubmitButton t={t} />

    </form>
  );
}
