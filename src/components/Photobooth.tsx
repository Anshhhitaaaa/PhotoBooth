import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RotateCcw, Sparkles, Check, X, SwitchCamera } from 'lucide-react';
import type { FilterId, Adjustments } from '@/types';
import { FILTERS, DEFAULT_ADJUSTMENTS, filterById } from '@/lib/filters';
import { Button } from '@/components/ui/Button';
import { clsx } from '@/lib/utils';

interface Props {
  slots: number;
  filter: FilterId;
  adjustments: Adjustments;
  onComplete: (photos: string[]) => void;
  onCancel: () => void;
}

type Phase = 'idle' | 'counting' | 'review';

export function Photobooth({ slots, filter, adjustments, onComplete, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);
  const photosRef = useRef<string[]>([]);
  photosRef.current = photos;

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setError('');
    } catch (e) {
      setError(
        'Could not access your camera. Please allow camera permission in your browser, then try again.',
      );
    }
  }, [facing]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = filterById(filter).css(adjustments);
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [filter, adjustments, facing]);

  const runBurst = useCallback(async () => {
    setPhase('counting');
    const taken: string[] = [];
    for (let i = 0; i < slots; i++) {
      // countdown 3..2..1
      for (let c = 3; c >= 1; c--) {
        setCount(c);
        await wait(800);
      }
      setCount(null);
      setFlash(true);
      await wait(120);
      const shot = captureFrame();
      setFlash(false);
      if (shot) taken.push(shot);
      setPhotos([...taken]);
      await wait(500);
    }
    setPhase('review');
  }, [slots, captureFrame]);

  const retake = () => {
    setPhotos([]);
    setPhase('idle');
  };

  const cssFilter = filterById(filter).css(adjustments);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl bg-stone-900 shadow-xl ring-4 ring-white/80">
          <video
            ref={videoRef}
            playsInline
            muted
            className={clsx(
              'w-full aspect-[4/3] object-cover transition-all',
              facing === 'user' && 'scale-x-[-1]',
            )}
            style={{ filter: cssFilter }}
          />
          {/* countdown overlay */}
          {phase === 'counting' && count !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20 backdrop-blur-[1px]">
              <span
                key={count}
                className="count-pop font-display text-8xl text-white drop-shadow-lg"
              >
                {count}
              </span>
            </div>
          )}
          {/* flash */}
          {flash && <div className="absolute inset-0 bg-white animate-pulse" />}
          {/* idle hint */}
          {phase === 'idle' && !error && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              Ready? Press capture for a {slots}-photo burst
            </div>
          )}
        </div>

        {/* captured thumbnails */}
        {photos.length > 0 && (
          <div className="mt-3 flex justify-center gap-2">
            {Array.from({ length: slots }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-16 w-12 overflow-hidden rounded-md ring-2 ring-pink-200 bg-pink-50',
                )}
              >
                {photos[i] ? (
                  <img src={photos[i]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-pink-300">
                    <Camera size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="max-w-md rounded-2xl bg-red-50 px-5 py-4 text-center text-sm text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {phase === 'idle' && (
          <>
            <Button size="lg" onClick={runBurst} disabled={!!error}>
              <Camera size={20} /> Capture {slots} photos
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}>
              <SwitchCamera size={18} /> Flip
            </Button>
            <Button variant="ghost" size="lg" onClick={onCancel}>
              <X size={18} /> Cancel
            </Button>
          </>
        )}
        {phase === 'counting' && (
          <Button size="lg" disabled>
            <Sparkles className="animate-spin" size={18} /> Smiling…
          </Button>
        )}
        {phase === 'review' && (
          <>
            <Button size="lg" onClick={() => onComplete(photos)}>
              <Check size={20} /> Use these photos
            </Button>
            <Button variant="soft" size="lg" onClick={retake}>
              <RotateCcw size={18} /> Retake
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
