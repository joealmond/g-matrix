'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { handleImageAnalysis } from '@/app/actions';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const initialState: ImageAnalysisState = {
  productName: null,
  error: null,
};

type CameraCaptureProps = {
  onProductIdentified?: (productName: string, imageUrl: string) => void;
};

export function CameraCapture({ onProductIdentified }: CameraCaptureProps) {
  const router = useRouter();
  const { app } = useFirebase();
  const { toast } = useToast();

  const [state, formAction, isProcessing] = useActionState(handleImageAnalysis, initialState);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description:
              'Please enable camera permissions in your browser settings.',
          });
        }
      } else {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
   useEffect(() => {
    if (state.error) {
        toast({
            variant: "destructive",
            title: "Analysis Error",
            description: state.error,
        });
        return;
    }

    if (state.productName && capturedFile && app) {
      const uploadAndRedirect = async () => {
        setIsUploading(true);
        console.log(`Starting upload for: ${state.productName}`);
        try {
          const storage = getStorage(app);
          const storageRef = ref(storage, `uploads/${Date.now()}-${capturedFile.name}`);
          
          console.log("Uploading file to Firebase Storage...");
          const snapshot = await uploadBytes(storageRef, capturedFile, {
            contentType: capturedFile.type,
          });
          console.log("Upload complete. Getting download URL...");
          
          const imageUrl = await getDownloadURL(snapshot.ref);
          console.log("Download URL obtained:", imageUrl);

          toast({
            title: 'Product Identified!',
            description: `Found: ${state.productName}`,
          });

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
  }, [state.productName, state.error, capturedFile, app, onProductIdentified, router, toast]);


  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({
          variant: 'destructive',
          title: 'Capture Failed',
          description: 'Could not capture image. Please try again.',
        });
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/png');
        setCapturedImage(dataUri);
        const file = dataURLtoFile(dataUri, 'capture.png');
        setCapturedFile(file);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!capturedFile) {
        toast({
            variant: 'destructive',
            title: 'No Image',
            description: 'Please capture an image first.',
        });
        return;
      }
      const formData = new FormData(formRef.current!);
      formData.set('photo', capturedFile);
      formAction(formData);
  }


  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  if (hasCameraPermission === null) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Camera Access Required</AlertTitle>
        <AlertDescription>
          Please allow camera access to use this feature. You may need to
          refresh the page after granting permissions.
        </AlertDescription>
      </Alert>
    );
  }
  
  const isBusy = isProcessing || isUploading;
  const buttonText = isProcessing ? 'Analyzing...' : isUploading ? 'Uploading...' : 'Analyze Captured Image';


  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {!capturedImage ? (
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-md border">
            <video
              ref={videoRef}
              className="w-full aspect-video rounded-md"
              autoPlay
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <Button onClick={handleCapture} className="w-full" type="button">
            <Camera className="mr-2 h-4 w-4" />
            Capture Photo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured" className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleRetake} type="button" disabled={isBusy}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button type="submit" disabled={isBusy || !capturedFile} className="w-full">
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
