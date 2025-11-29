'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { handleImageUpload } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CameraCaptureProps = {
  onProductIdentified?: (productName: string) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Analyzing...' : 'Analyze Captured Image'}
    </Button>
  );
}

export function CameraCapture({ onProductIdentified }: CameraCaptureProps) {
  const [state, formAction] = useActionState(handleImageUpload, {
    productName: null,
    error: null,
  });

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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
      // Cleanup: stop the stream when component unmounts or dialog closes
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  useEffect(() => {
    if (state.productName && onProductIdentified) {
      onProductIdentified(state.productName);
    }
  }, [state.productName, onProductIdentified]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      // Ensure video has dimensions before capturing
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error("Video dimensions are not available yet.");
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
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (capturedImage) {
      const file = dataURLtoFile(capturedImage, 'capture.png');
      if (file) {
        const formData = new FormData();
        formData.append('photo', file);
        formAction(formData);
      }
    }
  };

  if (hasCameraPermission === null) {
     return <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
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

  return (
    <div className="space-y-4">
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
          </div>
          <Button onClick={handleCapture} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Capture Photo
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured" className="w-full" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleRetake} type="button">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <SubmitButton />
          </div>
        </form>
      )}
      
      {state.error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
