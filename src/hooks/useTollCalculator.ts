import { useState, useCallback } from 'react';
import { generateTollEstimate, extractRouteDetailsFromImage } from '../services/geminiService';
import toast from 'react-hot-toast';

export function useTollCalculator() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [time, setTime] = useState('');
  const [image, setImage] = useState<{data: string, mimeType: string, objectUrl: string} | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapRoute, setMapRoute] = useState<{pickup: string, dropoff: string} | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result?.toString().split(',')[1];
      if (base64Data) {
        const imagePayload = {
          data: base64Data,
          mimeType: file.type,
        };
        
        setImage({
          ...imagePayload,
          objectUrl: URL.createObjectURL(file)
        });
        setError(null);
        
        try {
          const details = await extractRouteDetailsFromImage(imagePayload);
          if (details && details.pickup && details.dropoff) {
            setPickup(details.pickup);
            setDropoff(details.dropoff);
            setMapRoute({ pickup: details.pickup, dropoff: details.dropoff });
            toast.success("Route extracted from image successfully");
          } else {
            toast.error("Could not automatically extract locations from image");
          }
        } catch (err) {
          console.error("Extraction error:", err);
          toast.error("Failed to extract route details");
        } finally {
          setIsExtracting(false);
        }
      } else {
        setIsExtracting(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setIsExtracting(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    if (image?.objectUrl) {
      URL.revokeObjectURL(image.objectUrl);
    }
    setImage(null);
  }, [image]);

  const resetAll = useCallback(() => {
    setPickup('');
    setDropoff('');
    setTime('');
    setResult(null);
    setError(null);
    setMapRoute(null);
    if (image?.objectUrl) {
      URL.revokeObjectURL(image.objectUrl);
    }
    setImage(null);
  }, [image]);

  const calculate = useCallback(async () => {
    if (!pickup || !dropoff || !time) {
      setError('Please fill in all fields (pickup, drop-off, and time).');
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResult(null);
    setMapRoute({ pickup, dropoff });

    try {
      const imgPayload = image ? { data: image.data, mimeType: image.mimeType } : null;
      await generateTollEstimate(pickup, dropoff, time, imgPayload, (chunk: string) => {
        setResult(chunk);
      });
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        setError('API quota exceeded. Please wait a minute and try again, or add your own API key in Settings.');
      } else {
        setError(errorMessage || 'Failed to calculate toll estimate. Please try again.');
      }
    } finally {
      setIsCalculating(false);
    }
  }, [pickup, dropoff, time, image]);

  return {
    pickup, setPickup,
    dropoff, setDropoff,
    time, setTime,
    image, handleImageUpload, removeImage,
    isCalculating,
    isExtracting,
    result,
    error,
    mapRoute,
    calculate,
    resetAll
  };
}
