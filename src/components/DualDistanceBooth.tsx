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
  loadRoomSnaps,
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
  const [dualSplitPhotos, setDualSplitPhotos] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('Split-Screen Live Distance Camera Connected');

  const p1Name = room.members?.find((m) => m.id === 'p1')?.name || room.partner1_name || 'Partner 1';
  const p2Name = room.members?.find((m) => m.id === 'p2')?.name || room.partner2_name || 'Partner 2';

  const myName = identity === 'p1' ? p1Name : p2Name;
  const partnerName = identity === 'p1' ? p2Name : p1Name;

  // Initialize Local Webcam with crisp HD 1080p @ 60 FPS
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 60, min: 30 },
        },
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

  // Crisp HD preview frame for smooth, lag-free live distance view
  const capturePreviewFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;
    if (facing === 'user') {
      ctx.translate(240, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = filterById(filter).css(adjustments);
    ctx.drawImage(video, 0, 0, 240, 180);
    return canvas.toDataURL('image/jpeg', 0.25);
  }, [filter, adjustments, facing]);

  // Capture full uncompressed 1080p HD shot for photobooth burst
  const captureHighResFrame = useCallback((): string | null => {
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
    return canvas.toDataURL('image/jpeg', 0.90);
  }, [filter, adjustments, facing]);

  // Smooth HD live preview streaming: upload frame every 1500ms
  useEffect(() => {
    if (phase !== 'camera') return;

    const interval = setInterval(() => {
      const frame = capturePreviewFrame();
      if (frame) {
        uploadLiveCameraFrame(room.id, sessionId, myName, identity, frame);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [phase, capturePreviewFrame, room.id, sessionId, myName, identity]);

  // Fetch partner's live preview frame every 1500ms
  useEffect(() => {
    if (phase !== 'camera') return;

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
      } catch {
        // silent
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [phase, room.id, sessionId, identity]);

  // Listen for remote countdown trigger
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

      const shot = captureHighResFrame();
      setFlash(false);

      if (shot) {
        localTaken.push(shot);
        setMyPhotos([...localTaken]);

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
  }, [slots, captureHighResFrame, room.id, sessionId, myName, identity, activeSession]);

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

  // AUTO-MERGE & TRANSITION DIRECTLY INTO STICKER & LAYOUT DECORATION STUDIO!
  useEffect(() => {
    if (phase !== 'review') return;
    let cancelled = false;

    const buildDualFrames = async () => {
      setStatusMessage('Merging distance split-screen photos...');
      const p1Shots = new Map<number, string>();
      const p2Shots = new Map<number, string>();

      // Poll Neon DB for up to 8 seconds to fetch both p1 and p2 snapped photos
      for (let attempt = 0; attempt < 15; attempt++) {
        if (cancelled) return;
        try {
          const snaps = await loadRoomSnaps(room.id, sessionId);
          snaps.forEach((snap) => {
            if (snap.sender_id === 'p1') {
              p1Shots.set(snap.slot_index, snap.photo_data);
            } else if (snap.sender_id === 'p2') {
              p2Shots.set(snap.slot_index, snap.photo_data);
            }
          });

          // Fallback to local taken photos for self if needed
          myPhotos.forEach((photo, idx) => {
            if (identity === 'p1' && !p1Shots.has(idx)) p1Shots.set(idx, photo);
            if (identity === 'p2' && !p2Shots.has(idx)) p2Shots.set(idx, photo);
          });

          // Check if we have both p1 and p2 for all slots
          let hasAll = true;
          for (let i = 0; i < slots; i++) {
            if (!p1Shots.has(i) || !p2Shots.has(i)) {
              hasAll = false;
              break;
            }
          }

          if (hasAll || attempt === 14) {
            break;
          }
        } catch (e) {
          console.warn('Polling room snaps warning:', e);
        }
        await wait(400);
      }

      if (cancelled) return;

      const mergedList: string[] = [];
      for (let i = 0; i < slots; i++) {
        const p1Shot = p1Shots.get(i);
        const p2Shot = p2Shots.get(i);

        if (p1Shot && p2Shot) {
          const dualFrame = await createDualSplitCanvas(p1Shot, p2Shot);
          mergedList.push(dualFrame);
        } else if (p1Shot || p2Shot) {
          mergedList.push((p1Shot || p2Shot)!);
        } else if (myPhotos[i]) {
          mergedList.push(myPhotos[i]);
        }
      }

      const finalPhotos = mergedList.length > 0 ? mergedList : myPhotos;
      setDualSplitPhotos(finalPhotos);
      onComplete(finalPhotos);
    };

    buildDualFrames();
    return () => {
      cancelled = true;
    };
  }, [phase, slots, myPhotos, room.id, sessionId, identity, onComplete]);

  const cssFilter = filterById(filter).css(adjustments);

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
      <div className="flex items-center gap-2 rounded-full bg-[#ffeef4] px-4 py-1.5 text-xs font-bold text-[#ff4d79] shadow-sm">
        <Globe size={15} className="animate-pulse text-[#ff4d79]" />
        <span>Synchronized Split-Screen Photobooth • Room {room.code}</span>
      </div>

      {/* 50/50 SPLIT SCREEN LIVE CAMERA */}
      <div className="relative w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-stone-950 p-2 shadow-2xl ring-4 ring-pink-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 aspect-[16/9]">
            {/* LEFT HALF (MY CAMERA FEED) */}
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

            {/* RIGHT HALF (PARTNER'S LIVE CAMERA FEED) */}
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

          {/* COUNTDOWN OVERLAY */}
          {phase === 'counting' && count !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-500/30 backdrop-blur-[2px]">
              <span
                key={count}
                className="count-pop font-display text-9xl text-white drop-shadow-2xl"
              >
                {count}
              </span>
              <p className="mt-2 text-base font-bold text-white drop-shadow">
                Both cameras snapping split frames!
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

        {/* CAPTURED DUAL SPLIT SHOTS PREVIEW */}
        {myPhotos.length > 0 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-pink-600">
              Captured Dual Split Shots ({myPhotos.length}/{slots})
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
            <button
              onClick={handleStartDualPhotobooth}
              disabled={!!error}
              className="flex items-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold text-base px-8 py-3.5 shadow-lg shadow-pink-200 transition-all hover:scale-105"
            >
              <Zap size={18} className="fill-white" /> Start Capturing Together ({slots} shots)
            </button>
            <button
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              className="flex items-center gap-2 rounded-full border-2 border-[#ff4d79] bg-white text-[#ff4d79] hover:bg-pink-50 font-bold text-sm px-5 py-3 transition-all"
            >
              <SwitchCamera size={18} /> Flip Camera
            </button>
            <button
              onClick={handleCloseSession}
              className="flex items-center gap-1.5 rounded-full text-xs font-semibold text-[#8c7680] hover:text-[#ff4d79] px-4 py-3 transition-colors"
            >
              <X size={18} /> Exit Booth
            </button>
          </>
        )}

        {phase === 'counting' && (
          <button disabled className="flex items-center gap-2 rounded-full bg-[#ff4d79]/80 text-white font-bold text-base px-8 py-3.5 shadow-lg">
            <Sparkles className="animate-spin" size={18} /> Snapping Split Frames…
          </button>
        )}

        {phase === 'review' && (
          <button disabled className="flex items-center gap-2 rounded-full bg-[#ff4d79]/80 text-white font-bold text-base px-8 py-3.5 shadow-lg">
            <Sparkles className="animate-spin" size={18} /> Loading Decoration Studio…
          </button>
        )}
      </div>
    </div>
  );
}

/** Draws an image onto canvas using cover crop-fill to preserve exact natural aspect ratio without squishing */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  targetW: number,
  targetH: number,
) {
  const imgRatio = img.width / img.height;
  const targetRatio = targetW / targetH;
  let srcX = 0;
  let srcY = 0;
  let srcW = img.width;
  let srcH = img.height;

  if (imgRatio > targetRatio) {
    srcW = img.height * targetRatio;
    srcX = (img.width - srcW) / 2;
  } else {
    srcH = img.width / targetRatio;
    srcY = (img.height - srcH) / 2;
  }

  ctx.drawImage(img, srcX, srcY, srcW, srcH, x, y, targetW, targetH);
}

/** Merges Partner 1 (Left 50%) and Partner 2 (Right 50%) into an optimized crisp HD composite frame */
async function createDualSplitCanvas(leftDataUrl: string, rightDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;

    const imgLeft = new Image();
    const imgRight = new Image();

    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded === 2) {
        // Draw Left partner (0..480) with natural aspect ratio crop-fill
        drawCoverImage(ctx, imgLeft, 0, 0, 480, 640);
        // Draw Right partner (480..960) with natural aspect ratio crop-fill
        drawCoverImage(ctx, imgRight, 480, 0, 480, 640);

        // Draw vertical split divider line down middle
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(480, 0);
        ctx.lineTo(480, 640);
        ctx.stroke();

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      }
    };

    imgLeft.onload = checkDone;
    imgRight.onload = checkDone;
    imgLeft.onerror = () => resolve(leftDataUrl);
    imgRight.onerror = () => resolve(rightDataUrl);

    imgLeft.src = leftDataUrl;
    imgRight.src = rightDataUrl;
  });
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
