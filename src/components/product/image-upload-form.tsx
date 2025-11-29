'use client';

import { useState, useRef } from 'react';
import { handleImageAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type ImageUploadFormProps = {
  onProductIdentified?: (productName: string, imageUrl: string) => void;
};

export function ImageUploadForm({ onProductIdentified }: ImageUploadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { app } = useFirebase();

  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null | undefined) => {
    if (file) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      setSelectedFile(null);
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
    handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
        setError('Please select an image to upload.');
        return;
    }
    if (!app) {
        setError('Firebase is not initialized.');
        return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        // 1. Analyze Image
        const formData = new FormData();
        formData.append('photo', selectedFile);
        const analysisResult = await handleImageAnalysis({}, formData);

        if (analysisResult.error) {
            throw new Error(analysisResult.error);
        }

        const productName = analysisResult.productName;
        if (!productName) {
            throw new Error('Could not identify the product.');
        }

        // 2. Upload Image
        const storage = getStorage(app);
        const storageRef = ref(storage, `products/${productName}-${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, selectedFile, {
            contentType: selectedFile.type,
        });
        const imageUrl = await getDownloadURL(snapshot.ref);

        // 3. Redirect
        if (onProductIdentified) {
            onProductIdentified(productName, imageUrl);
        } else {
            router.push(`/product/${encodeURIComponent(productName)}?imageUrl=${encodeURIComponent(imageUrl)}`);
        }

    } catch (e: any) {
        console.error('Analysis or upload failed:', e);
        const errorMessage = e.message || 'An unexpected error occurred.';
        setError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage,
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            name="photo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="sr-only"
          />
        </div>
      </div>

      {preview && (
        <div className="relative h-48 w-full overflow-hidden rounded-md border">
          <Image src={preview} alt="Image preview" fill style={{ objectFit: 'contain' }} />
        </div>
      )}

      <Button type="submit" disabled={isProcessing || !selectedFile} className="w-full">
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isProcessing ? 'Processing...' : 'Analyze Image'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
