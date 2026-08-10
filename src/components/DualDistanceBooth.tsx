import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  Sparkles,
  Check,
  X,
  SwitchCamera,
  Users,
  Zap,
  Heart,
  Globe,
} from 'lucide-react';
import type { FilterId, Adjustments, LayoutId, Composition } from '@/types';
import { filterById } from '@/lib/filters';
import { Button } from '@/components/ui/Button';
import { clsx } from '@/lib/utils';
import {
  saveRoomSnap,
  addRoomPage,
  createLiveSignalChannel,
  type Room,
} from '@/lib/roomService';
import { renderToDataURL } from '@/lib/render';

interface Props {
  room: Room;
  identity: 'p1' | 'p2' | 'p3' | 'p4';
  slots: number;
  filter: FilterId;
  adjustments: Adjustments;
  onComplete: (photos: string[]) => void;
  onCancel: () => void;
}

type Phase = 'idle' | 'counting' | 'review';

export function DualDistanceBooth({
  room,
  identity,
  slots = 4,
  filter,
  adjustments,
  onComplete,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Store photos taken by slot: { [slotIndex]: { p1?: string, p2?: string } }
  const [myPhotos, setMyPhotos] = useState<string[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<Record<number, string>>({});
  const [mergedPhotos, setMergedPhotos] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('Connected to Room Database');

  const myName =
    identity === 'p1'
      ? room.partner1_name
      : room.partner2_name || (identity.toUpperCase());
  const partnerName =
    identity === 'p1'
      ? room.partner2_name || 'Partner'
      : room.partner1_name;

  const signalRef = useRef<ReturnType<typeof createLiveSignalChannel> | null>(null);

  // Initialize Camera
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
        'Camera permission required for distance photo booth. Please allow access.',
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

  // Capture frame from local camera
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
    return canvas.toDataURL('image/jpeg', 0.88);
  }, [filter, adjustments, facing]);

  // Handle synchronized long distance burst
  const executeBurst = useCallback(async () => {
    setPhase('counting');
    const localTaken: string[] = [];

    for (let i = 0; i < slots; i++) {
      // 3-2-1 countdown
      for (let c = 3; c >= 1; c--) {
        setCount(c);
        await wait(750);
      }
      setCount(null);
      setFlash(true);
      await wait(100);

      const shot = captureFrame();
      setFlash(false);

      if (shot) {
        localTaken.push(shot);
        setMyPhotos([...localTaken]);

        // Save snap directly to Supabase DB for instant sync!
        try {
          await saveRoomSnap(room.id, sessionId, myName, identity, i, shot);
        } catch (e) {
          console.error('Failed to sync snap to DB:', e);
        }
      }
      await wait(600);
    }

    setPhase('review');
  }, [slots, captureFrame, room.id, sessionId, myName, identity]);

  // Realtime Live Signal Subscription
  useEffect(() => {
    const channel = createLiveSignalChannel(room.id, (signal) => {
      if (signal.type === 'START_COUNTDOWN' && signal.initiatedBy !== identity) {
        setStatusMessage(`${partnerName} started the dual countdown!`);
        executeBurst();
      }
    });
    signalRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [room.id, identity, partnerName, executeBurst]);

  // Trigger Dual Countdown across all connected devices
  const triggerDualCountdown = () => {
    setStatusMessage('Broadcasting countdown to partner…');
    signalRef.current?.broadcastSignal({
      type: 'START_COUNTDOWN',
      sessionId,
      initiatedBy: identity,
      timestamp: Date.now(),
    });
    executeBurst();
  };

  // Combine local and partner photos into a alternating / side-by-side array
  useEffect(() => {
    if (phase !== 'review') return;

    const result: string[] = [];
    for (let i = 0; i < slots; i++) {
      if (myPhotos[i]) result.push(myPhotos[i]);
      if (partnerPhotos[i]) result.push(partnerPhotos[i]);
    }

    setMergedPhotos(result.length > 0 ? result : myPhotos);
  }, [phase, slots, myPhotos, partnerPhotos]);

  const cssFilter = filterById(filter).css(adjustments);

  const handleFinishAndSaveDB = async () => {
    const finalPhotos = mergedPhotos.length > 0 ? mergedPhotos : myPhotos;

    // Create room composition
    const comp: Composition = {
      layout: 'strip',
      photos: finalPhotos,
      filter,
      adjustments,
      border: 'polaroid',
      stickers: [],
      caption: `Long Distance Memories with ${partnerName}`,
      names: room.names || `${myName} & ${partnerName}`,
      paper: 'rose',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    try {
      const thumb = await renderToDataURL(comp, 0.5);
      await addRoomPage(
        room.id,
        myName,
        'Dual Distance Photo Strip',
        'Long Distance',
        comp,
        thumb,
      );
    } catch (e: any) {
      console.warn('Room page DB save fallback:', e?.message);
    }

    onComplete(finalPhotos);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header Banner */}
      <div className="flex items-center gap-2 rounded-full bg-pink-100/80 px-4 py-1.5 text-xs font-semibold text-pink-700 shadow-sm backdrop-blur">
        <Globe size={14} className="animate-pulse text-pink-500" />
        <span>Dual Distance Sync Room • {room.code}</span>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl bg-stone-900 shadow-2xl ring-4 ring-pink-200">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-500/25 backdrop-blur-[2px]">
              <span
                key={count}
                className="count-pop font-display text-9xl text-white drop-shadow-xl"
              >
                {count}
              </span>
              <p className="mt-2 text-sm font-semibold text-white/90 drop-shadow">
                Both cameras snapping together!
              </p>
            </div>
          )}

          {/* flash animation */}
          {flash && <div className="absolute inset-0 bg-white animate-pulse" />}

          {/* status bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
              <span>{myName} (You)</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-pink-200 backdrop-blur">
              <Heart size={12} className="fill-pink-400 text-pink-400" />
              <span>{partnerName}</span>
            </div>
          </div>

          {/* status notification */}
          {phase === 'idle' && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
              {statusMessage}
            </div>
          )}
        </div>

        {/* captured thumbnails preview */}
        {myPhotos.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold text-pink-600">
              Captured Shots ({myPhotos.length}/{slots})
            </p>
            <div className="flex justify-center gap-2">
              {Array.from({ length: slots }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-16 overflow-hidden rounded-lg bg-pink-50 ring-2 ring-pink-300 shadow-sm"
                >
                  {myPhotos[i] ? (
                    <img src={myPhotos[i]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-pink-300">
                      <Camera size={18} />
                      <span className="text-[10px]">Shot {i + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="max-w-md rounded-2xl bg-red-50 px-5 py-4 text-center text-sm text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* action controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {phase === 'idle' && (
          <>
            <Button size="lg" onClick={triggerDualCountdown} disabled={!!error}>
              <Zap size={18} className="fill-pink-400 text-pink-400" />
              Start Dual Sync Snap ({slots} shots)
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            >
              <SwitchCamera size={18} /> Flip
            </Button>
            <Button variant="ghost" size="lg" onClick={onCancel}>
              <X size={18} /> Cancel
            </Button>
          </>
        )}

        {phase === 'counting' && (
          <Button size="lg" disabled>
            <Sparkles className="animate-spin" size={18} /> Synchronizing Cameras…
          </Button>
        )}

        {phase === 'review' && (
          <>
            <Button size="lg" onClick={handleFinishAndSaveDB}>
              <Check size={20} /> Save to Room Album (DB)
            </Button>
            <Button
              variant="soft"
              size="lg"
              onClick={() => {
                setMyPhotos([]);
                setPartnerPhotos({});
                setMergedPhotos([]);
                setPhase('idle');
              }}
            >
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
