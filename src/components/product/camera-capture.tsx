'use client';

import { useState, useRef, useEffect } from 'react';
import { handleImageAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTransition } from 'react';

type CameraCaptureProps = {
  onProductIdentified?: (productName: string, imageUrl: string) => void;
};

export function CameraCapture({ onProductIdentified }: CameraCaptureProps) {
  const router = useRouter();
  const { app } = useFirebase();
  const { toast } = useToast();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const analyzeAndUpload = async () => {
    if (!capturedFile) {
        setError('No captured file to analyze.');
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
        formData.append('photo', capturedFile);
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
        const snapshot = await uploadBytes(storageRef, capturedFile, {
            contentType: capturedFile.type,
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
    setError(null);
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
            <Button onClick={analyzeAndUpload} disabled={isProcessing} className="w-full" type="button">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Processing...' : 'Analyze Captured Image'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
