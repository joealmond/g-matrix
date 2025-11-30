'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { analyzeAndUploadProduct } from '@/app/actions';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { initialState } from '@/lib/actions-types';

type CameraCaptureProps = {
  onProductIdentified?: (result: ImageAnalysisState) => void;
};

export function CameraCapture({ onProductIdentified }: CameraCaptureProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, startTransition] = useTransition();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Use a more generic video request for broader device compatibility.
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
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
        // Draw a white background for JPEG
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        // Use JPEG for better compatibility and smaller size
        const dataUri = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUri);
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!capturedImage) return;

    startTransition(async () => {
      const blob = await fetch(capturedImage).then(res => res.blob());
      // Explicitly set the file type to 'image/jpeg' to match the data URI
      const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', file);

      const result = await analyzeAndUploadProduct(initialState, formData);

      if (result.success && result.productName) {
        if (onProductIdentified) {
            onProductIdentified(result);
        } else {
            console.error("onProductIdentified callback not provided");
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: result.error || 'Could not identify the product from the image.',
        });
      }
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
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
  
  const buttonText = isProcessing ? 'Analyzing...' : 'Analyze Captured Image';

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
            <Button variant="outline" onClick={handleRetake} type="button" disabled={isProcessing}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={handleSubmit} disabled={isProcessing} className="w-full">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
