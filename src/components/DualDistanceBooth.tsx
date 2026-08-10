import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  Sparkles,
  Check,
  X,
  SwitchCamera,
  Zap,
  Heart,
  Globe,
  User,
} from 'lucide-react';
import type { FilterId, Adjustments, Composition, LayoutId } from '@/types';
import { filterById } from '@/lib/filters';
import { Button } from '@/components/ui/Button';
import { clsx } from '@/lib/utils';
import {
  saveRoomSnap,
  loadLatestPartnerSnap,
  uploadLiveCameraFrame,
  addRoomPage,
  updateRoomSessionState,
  endRoomSession,
  type Room,
} from '@/lib/roomService';
import { renderToDataURL } from '@/lib/render';

interface Props {
  room: Room;
  identity: 'p1' | 'p2' | 'p3' | 'p4';
  layout?: LayoutId;
  slots?: number;
  filter: FilterId;
  adjustments: Adjustments;
  onComplete: (photos: string[]) => void;
  onCancel: () => void;
}

type Phase = 'camera' | 'counting' | 'review';

export function DualDistanceBooth({
  room,
  identity,
  layout = 'strip',
  slots = 4,
  filter,
  adjustments,
  onComplete,
  onCancel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('camera');
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);

  const activeSession = room.active_session;
  const sessionId = activeSession?.sessionId || 'default-session';

  // Split-screen photo states
  const [myPhotos, setMyPhotos] = useState<string[]>([]);
  const [partnerLatestSnap, setPartnerLatestSnap] = useState<string | null>(null);
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const [mergedPhotos, setMergedPhotos] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('Split-Screen Live Distance Camera Connected');

  const myName =
    identity === 'p1'
      ? room.partner1_name
      : room.partner2_name || identity.toUpperCase();

  const partnerName =
    identity === 'p1'
      ? room.partner2_name || 'Partner 2'
      : room.partner1_name;

  // Initialize Local Webcam
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
      setError('Camera access required for distance split screen. Please allow permission.');
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

  // Capture current frame from local camera
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
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [filter, adjustments, facing]);

  // Live video frame streaming: upload local webcam frame every 900ms
  useEffect(() => {
    if (phase !== 'camera') return;

    const interval = setInterval(async () => {
      const frame = captureFrame();
      if (frame) {
        uploadLiveCameraFrame(room.id, sessionId, myName, identity, frame);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [phase, captureFrame, room.id, sessionId, myName, identity]);

  // Fetch partner's live video frame every 900ms to show on right split screen
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latest = await loadLatestPartnerSnap(room.id, sessionId, identity);
        if (latest?.photo_data) {
          setPartnerLatestSnap(latest.photo_data);
          if (latest.slot_index >= 0) {
            setPartnerPhotos((prev) => {
              const updated = [...prev];
              updated[latest.slot_index] = latest.photo_data;
              return updated;
            });
          }
        }
      } catch (e) {
        // silent catch
      }
    }, 900);

    return () => clearInterval(interval);
  }, [room.id, sessionId, identity]);

  // Listen for remote countdown trigger in room session
  useEffect(() => {
    if (activeSession?.step === 'counting' && phase === 'camera') {
      setStatusMessage(`${partnerName} triggered synchronized countdown!`);
      runSynchronizedBurst();
    }
  }, [activeSession?.step, phase, partnerName]);

  // Execute 3-2-1 synchronized burst capture
  const runSynchronizedBurst = useCallback(async () => {
    setPhase('counting');
    const localTaken: string[] = [];

    for (let i = 0; i < slots; i++) {
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

        // Upload captured shot to DB
        try {
          await saveRoomSnap(room.id, sessionId, myName, identity, i, shot);
        } catch (e) {
          console.error('Failed to sync split shot:', e);
        }
      }
      await wait(600);
    }

    setPhase('review');

    if (activeSession) {
      updateRoomSessionState(room.id, {
        ...activeSession,
        step: 'review',
        timestamp: Date.now(),
      });
    }
  }, [slots, captureFrame, room.id, sessionId, myName, identity, activeSession]);

  // Start synchronized dual countdown on both devices
  const handleStartDualPhotobooth = async () => {
    if (activeSession) {
      await updateRoomSessionState(room.id, {
        ...activeSession,
        step: 'counting',
        timestamp: Date.now(),
      });
    }
    setStatusMessage('Broadcasting 3-2-1 countdown to partner…');
    runSynchronizedBurst();
  };

  // Merge split photos side-by-side into alternating strip
  useEffect(() => {
    if (phase !== 'review') return;

    const combined: string[] = [];
    for (let i = 0; i < slots; i++) {
      if (myPhotos[i]) combined.push(myPhotos[i]);
      if (partnerPhotos[i]) combined.push(partnerPhotos[i]);
    }
    setMergedPhotos(combined.length > 0 ? combined : myPhotos);
  }, [phase, slots, myPhotos, partnerPhotos]);

  const cssFilter = filterById(filter).css(adjustments);

  const handleFinishAndSaveDB = async () => {
    const finalPhotos = mergedPhotos.length > 0 ? mergedPhotos : myPhotos;

    const comp: Composition = {
      layout: layout || 'strip',
      photos: finalPhotos,
      filter,
      adjustments,
      border: 'polaroid',
      stickers: [],
      caption: `Distance Couple Split-Screen with ${partnerName}`,
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
        'Distance Split-Screen Memory',
        'Long Distance',
        comp,
        thumb,
      );
      await endRoomSession(room.id);
    } catch (e: any) {
      console.warn('Room page save error:', e?.message);
    }

    onComplete(finalPhotos);
  };

  const handleCloseSession = async () => {
    try {
      await endRoomSession(room.id);
    } catch {
      // silent
    }
    onCancel();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Header Banner */}
      <div className="flex items-center gap-2 rounded-full bg-pink-100/90 px-4 py-1.5 text-xs font-bold text-pink-700 shadow-sm backdrop-blur">
        <Globe size={15} className="animate-pulse text-pink-500" />
        <span>Synchronized Split-Screen Photobooth • Room {room.code}</span>
      </div>

      {/* 50/50 SPLIT SCREEN CAMERA CONTAINER */}
      <div className="relative w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-stone-950 p-2 shadow-2xl ring-4 ring-pink-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 aspect-[16/9]">
            {/* LEFT HALF (YOUR CAMERA FEED) */}
            <div className="relative overflow-hidden rounded-2xl bg-stone-900 border border-stone-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className={clsx(
                  'w-full h-full object-cover transition-all',
                  facing === 'user' && 'scale-x-[-1]',
                )}
                style={{ filter: cssFilter }}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
                <span>{myName} (You)</span>
              </div>
            </div>

            {/* RIGHT HALF (PARTNER'S LIVE CAMERA FEED / SNAP) */}
            <div className="relative overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center">
              {partnerLatestSnap ? (
                <img
                  src={partnerLatestSnap}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20 text-pink-400">
                    <User size={24} />
                  </div>
                  <p className="text-xs font-medium">Connecting to {partnerName}'s live camera…</p>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-pink-200 backdrop-blur">
                <Heart size={12} className="fill-pink-400 text-pink-400" />
                <span>{partnerName}</span>
              </div>
            </div>
          </div>

          {/* COUNTDOWN OVERLAY ON CENTER OF SPLIT SCREEN */}
          {phase === 'counting' && count !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-500/30 backdrop-blur-[2px]">
              <span
                key={count}
                className="count-pop font-display text-9xl text-white drop-shadow-2xl"
              >
                {count}
              </span>
              <p className="mt-2 text-base font-bold text-white drop-shadow">
                Both cameras snapping together!
              </p>
            </div>
          )}

          {/* FLASH ANIMATION */}
          {flash && <div className="absolute inset-0 bg-white animate-pulse" />}

          {/* STATUS NOTIFICATION */}
          {phase === 'camera' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-5 py-2 text-xs font-semibold text-white backdrop-blur">
              {statusMessage}
            </div>
          )}
        </div>

        {/* CAPTURED SHOTS PREVIEW */}
        {myPhotos.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-pink-600">
              Split-Screen Shots ({myPhotos.length}/{slots})
            </p>
            <div className="flex justify-center gap-2">
              {Array.from({ length: slots }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-16 overflow-hidden rounded-xl bg-pink-50 ring-2 ring-pink-300 shadow-md"
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

      {/* CONTROLS */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {phase === 'camera' && (
          <>
            <Button
              size="lg"
              onClick={handleStartDualPhotobooth}
              disabled={!!error}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
            >
              <Zap size={18} className="fill-white" /> Start Capturing Together ({slots} shots)
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            >
              <SwitchCamera size={18} /> Flip Camera
            </Button>
            <Button variant="ghost" size="lg" onClick={handleCloseSession}>
              <X size={18} /> Exit Booth
            </Button>
          </>
        )}

        {phase === 'counting' && (
          <Button size="lg" disabled>
            <Sparkles className="animate-spin" size={18} /> Snapping Split Screen…
          </Button>
        )}

        {phase === 'review' && (
          <>
            <Button size="lg" onClick={handleFinishAndSaveDB}>
              <Check size={20} /> Save Split Strip to Shared Album
            </Button>
            <Button
              variant="soft"
              size="lg"
              onClick={() => {
                setMyPhotos([]);
                setPartnerPhotos([]);
                setPartnerLatestSnap(null);
                setMergedPhotos([]);
                setPhase('camera');
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
