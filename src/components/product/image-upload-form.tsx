'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useState, useRef, useEffect } from 'react';
import { handleImageUpload } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import Image from 'next/image';

const initialState = {
  productName: null,
  error: null,
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

export function ImageUploadForm() {
  const [state, formAction] = useActionState(handleImageUpload, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  useEffect(() => {
    if (state.productName || state.error) {
      // Don't reset form immediately to allow user to see result
      // It will reset when they re-open the dialog or select a new file
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="photo">Product Photo</Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          required
          onChange={handleFileChange}
          ref={fileInputRef}
        />
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

      <SubmitButton />

      {state.productName && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Product Identified!</AlertTitle>
          <AlertDescription>
            We think this is:{' '}
            <span className="font-bold">{state.productName}</span>. You can now
            search for it.
          </AlertDescription>
        </Alert>
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
