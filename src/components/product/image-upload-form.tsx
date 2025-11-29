'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';
import { useFormState, useFormStatus } from 'react-dom';
import { analyzeAndUploadProduct } from '@/app/actions';
import { initialState } from '@/lib/actions-types';
import { useRouter } from 'next/navigation';

type ImageUploadFormProps = {
  onProductIdentified?: (productName: string, imageUrl: string) => void;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Analyzing...' : 'Analyze Image'}
        </Button>
    )
}

export function ImageUploadForm({ onProductIdentified }: ImageUploadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [state, formAction] = useFormState(analyzeAndUploadProduct, initialState);

  useEffect(() => {
    if (state.success && state.productName && state.imageUrl) {
        if (onProductIdentified) {
            onProductIdentified(state.productName, state.imageUrl);
        } else {
            // Fallback navigation if the callback is not provided
            const productData = { name: state.productName, imageUrl: state.imageUrl };
            sessionStorage.setItem('identifiedProduct', JSON.stringify(productData));
            const url = `/vibe-check/${encodeURIComponent(state.productName)}?imageUrl=${encodeURIComponent(state.imageUrl)}`;
            router.push(url);
        }
        // Reset form after success
        formRef.current?.reset();
        setPreview(null);
    } else if (state.error) {
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: state.error,
        });
    }
  }, [state, onProductIdentified, router, toast]);

  const handleFile = (file: File | null | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please upload an image smaller than 5MB.'
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
        <Label htmlFor="photo-upload">Product Photo</Label>
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
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
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
          <img src={preview} alt="Image preview" className="object-contain w-full h-full" />
        </div>
      )}

      <SubmitButton />

    </form>
  );
}
