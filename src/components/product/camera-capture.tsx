'use client';

import { useState, useRef, useEffect } from 'react';
import { handleImageAnalysis, type ImageAnalysisState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useActionState } from 'react';

type CameraCaptureProps = {
  onProductIdentified?: (productName: string, imageUrl: string) => void;
};

const initialState: ImageAnalysisState = {
  productName: null,
  error: null,
};

export function CameraCapture({ onProductIdentified }: CameraCaptureProps) {
  const router = useRouter();
  const { app } = useFirebase();
  const { toast } = useToast();

  const [state, formAction, isProcessing] = useActionState(
    handleImageAnalysis,
    initialState
  );

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
            description: 'Please enable camera permissions in your browser settings.',
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
    const uploadAndRedirect = async () => {
      if (state.productName && capturedFile && app) {
        setIsUploading(true);
        try {
          const storage = getStorage(app);
          const storageRef = ref(
            storage,
            `products/${state.productName}-${Date.now()}`
          );
          const snapshot = await uploadBytes(storageRef, capturedFile, {
            contentType: capturedFile.type,
          });
          const imageUrl = await getDownloadURL(snapshot.ref);

          if (onProductIdentified) {
            onProductIdentified(state.productName, imageUrl);
          } else {
            router.push(
              `/product/${encodeURIComponent(
                state.productName
              )}?imageUrl=${encodeURIComponent(imageUrl)}`
            );
          }
        } catch (e: any) {
          console.error('Image upload failed:', e);
           toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: e.message || 'Could not upload the product image.',
          });
          setIsUploading(false);
        }
      }
    };
    uploadAndRedirect();
  }, [state.productName, capturedFile, app, onProductIdentified, router, toast]);

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
    return <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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

  const processing = isProcessing || isUploading;
  const buttonText = isProcessing
    ? 'Analyzing...'
    : isUploading
    ? 'Uploading...'
    : 'Analyze Captured Image';

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden input to hold the file for the form action */}
      {capturedFile && <input type="file" name="photo" defaultValue={undefined} style={{ display: 'none' }} files={new DataTransfer().files} />}
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
          {capturedFile && (
             <input
              type="file"
              name="photo"
              ref={input => {
                if (input) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(capturedFile);
                  input.files = dataTransfer.files;
                }
              }}
              style={{ display: 'none' }}
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleRetake} type="button">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button type="submit" disabled={processing} className="w-full">
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          </div>
        </div>
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
