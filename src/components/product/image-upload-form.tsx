'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { handleImageAnalysis, type ImageAnalysisState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useFirebaseApp } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

const initialState: ImageAnalysisState = {
  productName: null,
  error: null,
};

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
  );
}

export function ImageUploadForm({ onProductIdentified }: ImageUploadFormProps) {
  const [state, formAction] = useActionState(handleImageAnalysis, initialState);
  const router = useRouter();
  const app = useFirebaseApp();
  const { toast } = useToast();

  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.productName && selectedFile && app) {
      const uploadAndRedirect = async () => {
        setIsUploading(true);
        try {
          const storage = getStorage(app);
          const storageRef = ref(storage, `products/${state.productName}-${Date.now()}`);
          await uploadBytes(storageRef, selectedFile);
          const imageUrl = await getDownloadURL(storageRef);

          if (onProductIdentified) {
            onProductIdentified(state.productName!, imageUrl);
          } else {
             router.push(`/product/${encodeURIComponent(state.productName!)}?imageUrl=${encodeURIComponent(imageUrl)}`);
          }
        } catch (uploadError: any) {
           console.error("Image upload failed:", uploadError);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Could not upload image: ${uploadError.message}`
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      uploadAndRedirect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.productName, selectedFile, app, router, onProductIdentified]);
  

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
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        formAction(formData);
    }
  }


  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="photo">Product Photo</Label>
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
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
            ref={fileInputRef}
            className="sr-only"
          />
        </div>
      </div>

      {preview && (
        <div className="relative h-48 w-full overflow-hidden rounded-md border">
          <Image
            src={preview}
            alt="Image preview"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}

      {isUploading ? (
        <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
        </Button>
      ) : (
        <SubmitButton />
      )}


      {state.error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
