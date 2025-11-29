'use client';

import { useState, useRef, useActionState, useEffect } from 'react';
import { handleImageAnalysis } from '@/app/actions';
import { initialState } from '@/lib/actions-types';
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

  const [state, formAction, isProcessing] = useActionState(handleImageAnalysis, initialState);

  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (state.error) {
        toast({
            variant: "destructive",
            title: "Analysis Error",
            description: state.error,
        });
    }

    if (state.productName && selectedFile && app) {
      const uploadAndRedirect = async () => {
        setIsUploading(true);
        console.log(`Starting upload for: ${state.productName}`);
        try {
          const storage = getStorage(app);
          const storageRef = ref(storage, `products/${state.productName}-${Date.now()}`);
          
          console.log("Uploading file to Firebase Storage...");
          const snapshot = await uploadBytes(storageRef, selectedFile, {
            contentType: selectedFile.type,
          });
          console.log("Upload complete. Getting download URL...");

          const imageUrl = await getDownloadURL(snapshot.ref);
          console.log("Download URL obtained:", imageUrl);
          
          if (onProductIdentified) {
            console.log("Calling onProductIdentified callback.");
            onProductIdentified(state.productName!, imageUrl);
          } else {
            const url = `/product/${encodeURIComponent(state.productName!)}?imageUrl=${encodeURIComponent(imageUrl)}`;
            console.log("Redirecting to:", url);
            router.push(url);
          }
        } catch (uploadError: any) {
          console.error("FIREBASE STORAGE UPLOAD FAILED:", uploadError);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: uploadError.message || "Could not upload the product image.",
          });
          setIsUploading(false); // Reset on failure
        }
      };
      uploadAndRedirect();
    }
  }, [state.productName, state.error, selectedFile, app, router, toast, onProductIdentified]);

  const handleFile = (file: File | null | undefined) => {
    if (file) {
      setSelectedFile(file);
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
  
  const isBusy = isProcessing || isUploading;
  const buttonText = isProcessing ? 'Analyzing...' : isUploading ? 'Uploading...' : 'Analyze Image';

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

      <Button type="submit" disabled={isBusy || !selectedFile} className="w-full">
        {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonText}
      </Button>

    </form>
  );
}
