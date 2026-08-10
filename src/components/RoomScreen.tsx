import { useState, useEffect, useRef } from 'react';
import {
  createRoom,
  joinRoom,
  loadRoomPages,
  deleteRoomPage,
  subscribeRoomPages,
  saveRoomSession,
  loadRoomSession,
  clearRoomSession,
  startRoomSession,
  pickRoomLayout,
  endRoomSession,
  addRoomPage,
  type Room,
  type RoomPage,
} from '@/lib/roomService';
import type { Composition, AlbumPage, RoomMode, LayoutId } from '@/types';
import { Button } from '@/components/ui/Button';
import { AlbumView } from '@/components/AlbumView';
import { PageViewer } from '@/components/PageViewer';
import { ExportModal } from '@/components/ExportModal';
import { DualDistanceBooth } from '@/components/DualDistanceBooth';
import { LayoutPicker } from '@/components/LayoutPicker';
import { Editor } from '@/components/Editor';
import { renderToDataURL } from '@/lib/render';
import {
  Heart,
  Users,
  LogIn,
  Copy,
  Check,
  ArrowLeft,
  Camera,
  Circle,
  Zap,
  UserPlus,
} from 'lucide-react';

interface Props {
  onNewPhoto: (room: Room, identity: 'p1' | 'p2' | 'p3' | 'p4') => void;
  onBack: () => void;
}

export function RoomScreen({ onNewPhoto, onBack }: Props) {
  const [session, setSession] = useState<{
    room: Room;
    identity: 'p1' | 'p2' | 'p3' | 'p4';
  } | null>(() => loadRoomSession());

  const [pages, setPages] = useState<RoomPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [viewer, setViewer] = useState<AlbumPage | null>(null);
  const [exportComp, setExportComp] = useState<Composition | null>(null);

  // Synchronized Room Session UI View State: 'album' | 'layout-picker' | 'camera' | 'editor'
  const [activeStep, setActiveStep] = useState<'album' | 'layout-picker' | 'camera' | 'editor'>('album');
  const [syncedLayout, setSyncedLayout] = useState<LayoutId>('strip');
  const [editorComp, setEditorComp] = useState<Composition | null>(null);

  const subRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);

    loadRoomPages(session.room.id)
      .then((p) => {
        if (!cancelled) setPages(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Real-time synchronization listener across connected devices
    const unsub = subscribeRoomPages(session.room.id, (payload) => {
      if (payload.eventType === 'room_update') {
        const updated = payload.newPage as unknown as Room;
        if (updated) {
          setSession((s) => (s ? { ...s, room: updated } : s));

          if (updated.partner2_name || (updated.members && updated.members.length > 1)) {
            setPartnerOnline(true);
          }

          // SYNCHRONIZED STEP TRANSITIONS ACROSS BOTH DEVICES
          const activeSession = updated.active_session;
          if (activeSession && activeSession.active) {
            if (activeSession.step === 'layout-picker') {
              setActiveStep('layout-picker');
            } else if (activeSession.step === 'camera' || activeSession.step === 'counting') {
              if (activeSession.pickedLayout) {
                setSyncedLayout(activeSession.pickedLayout);
              }
              setActiveStep('camera');
            }
          } else if (!activeSession || activeSession.active === false) {
            if (activeStep !== 'editor') {
              setActiveStep('album');
            }
          }
        }
        return;
      }
      if (payload.eventType === 'INSERT' && payload.newPage) {
        setPages((prev) => {
          if (prev.some((p) => p.id === payload.newPage!.id)) return prev;
          return [payload.newPage!, ...prev];
        });
      } else if (payload.eventType === 'DELETE' && payload.oldPage) {
        setPages((prev) => prev.filter((p) => p.id !== payload.oldPage!.id));
      } else if (payload.eventType === 'UPDATE' && payload.newPage) {
        setPages((prev) =>
          prev.map((p) => (p.id === payload.newPage!.id ? payload.newPage! : p)),
        );
      }
    });

    subRef.current = unsub;

    if (
      session.room.partner2_name ||
      (session.room.members && session.room.members.length > 1)
    ) {
      setPartnerOnline(true);
    }

    return () => {
      cancelled = true;
      unsub();
    };
  }, [session?.room.id, activeStep]);

  const handleCreate = async (name: string, mode: RoomMode) => {
    setError('');
    try {
      const { room, identity } = await createRoom(name, mode);
      saveRoomSession(room, identity);
      setSession({ room, identity });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleJoin = async (code: string, name: string) => {
    setError('');
    try {
      const { room, identity } = await joinRoom(code, name);
      saveRoomSession(room, identity);
      setSession({ room, identity });
    } catch (e: any) {
      setError(e.message);
    }
  };

  // 1. Partner A or B clicks "Start Photobooth" -> Both devices enter Layout Picker!
  const handleStartPhotoboothFlow = async () => {
    if (!session) return;
    try {
      await startRoomSession(session.room.id, session.identity, 'layout-picker');
    } catch (e) {
      console.error('Failed to start room photobooth flow:', e);
    }
    setActiveStep('layout-picker');
  };

  // 2. Either partner picks layout -> Both devices enter Split-Screen Camera!
  const handlePickLayout = async (layout: LayoutId) => {
    if (!session) return;
    setSyncedLayout(layout);
    if (session.room.active_session) {
      try {
        await pickRoomLayout(session.room.id, session.room.active_session, layout);
      } catch (e) {
        console.error('Failed to sync layout pick:', e);
      }
    }
    setActiveStep('camera');
  };

  // 3. When photo capture completes -> Launch Decoration Studio (<Editor />)!
  const handleBoothComplete = (photos: string[]) => {
    if (!session) return;
    const partnerName =
      session.identity === 'p1'
        ? session.room.partner2_name || 'Partner 2'
        : session.room.partner1_name;
    const myName =
      session.identity === 'p1'
        ? session.room.partner1_name
        : session.room.partner2_name || 'Partner';

    setEditorComp({
      layout: syncedLayout,
      photos,
      filter: 'none',
      adjustments: { brightness: 1, contrast: 1, saturate: 1 },
      border: 'polaroid',
      stickers: [],
      caption: `Distance Split-Screen with ${partnerName}`,
      names: session.room.names || `${myName} & ${partnerName}`,
      paper: 'rose',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });

    setActiveStep('editor');
  };

  const handleClosePhotoboothFlow = async () => {
    if (!session) return;
    try {
      await endRoomSession(session.room.id);
    } catch {
      // silent
    }
    setEditorComp(null);
    setActiveStep('album');
  };

  const handleLeave = () => {
    subRef.current?.();
    clearRoomSession();
    setSession(null);
    setPages([]);
    setPartnerOnline(false);
    setEditorComp(null);
    setActiveStep('album');
  };

  const handleDeletePage = async (id: string) => {
    try {
      await deleteRoomPage(id);
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const roomPageToAlbumPage = (rp: RoomPage): AlbumPage => ({
    id: rp.id,
    title: rp.title,
    section: rp.section,
    createdAt: new Date(rp.created_at).getTime(),
    paper: (rp.composition as any)?.paper ?? 'cream',
    thumb: rp.thumb,
    composition: rp.composition,
  });

  if (!session) {
    return <RoomLobby onCreate={handleCreate} onJoin={handleJoin} onBack={onBack} error={error} />;
  }

  const albumPages = pages.map(roomPageToAlbumPage);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#5c4a52]">
      {/* Top Navbar */}
      <div className="sticky top-0 z-30 border-b border-pink-100/60 bg-[#fdfbf7]/85 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-semibold text-[#5c4a52] hover:text-[#ff4d79] transition-colors"
            >
              <ArrowLeft size={16} /> Home
            </button>
            <div className="flex items-center gap-2">
              <Heart size={18} className="fill-[#ff4d79] text-[#ff4d79]" />
              <div>
                <h2 className="font-script text-xl font-bold text-[#2b1820]">
                  {session.room.names ||
                    (session.room.partner2_name
                      ? `${session.room.partner1_name} & ${session.room.partner2_name}`
                      : session.room.partner1_name || 'Our Room')}
                </h2>
                <p className="flex items-center gap-1.5 text-xs text-[#8c7680]">
                  {partnerOnline || !!session.room.partner2_name || (session.room.members && session.room.members.length > 1) ? (
                    <>
                      <Circle size={8} className="fill-green-400 text-green-400 animate-pulse" />
                      Both partners connected
                    </>
                  ) : (
                    <>
                      <Circle size={8} className="fill-amber-400 text-amber-400" />
                      Share code with your partner to connect
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CopyCode code={session.room.code} />
            <button
              onClick={handleStartPhotoboothFlow}
              className="flex items-center gap-1.5 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white text-xs font-bold px-4 py-2 shadow-md shadow-pink-200 transition-all hover:scale-105"
            >
              <Zap size={14} className="fill-white" /> Start Photobooth Together
            </button>
            <button
              onClick={() => onNewPhoto(session.room, session.identity)}
              className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-white text-[#ff4d79] hover:bg-pink-50 text-xs font-bold px-3.5 py-2 transition-all"
            >
              <Camera size={14} /> Add photo
            </button>
            <button onClick={handleLeave} className="text-xs font-semibold text-[#8c7680] hover:text-[#ff4d79] px-2">
              Leave
            </button>
          </div>
        </div>
      </div>

      {activeStep === 'editor' && editorComp ? (
        <Editor
          initial={editorComp}
          initialLayout={syncedLayout}
          onSave={async (title, section, comp) => {
            try {
              const thumb = await renderToDataURL(comp, 0.4);
              const authorName =
                session.identity === 'p1'
                  ? session.room.partner1_name
                  : session.room.partner2_name || 'Partner';
              await addRoomPage(session.room.id, authorName, title, section, comp, thumb);
              await endRoomSession(session.room.id);
            } catch (e: any) {
              console.warn('Save room page warning:', e);
            }
            setEditorComp(null);
            setActiveStep('album');
          }}
          onBack={handleClosePhotoboothFlow}
        />
      ) : activeStep === 'layout-picker' ? (
        <div className="py-6 px-4">
          <LayoutPicker
            isRoom={true}
            onPick={handlePickLayout}
            onBack={handleClosePhotoboothFlow}
          />
        </div>
      ) : activeStep === 'camera' ? (
        <div className="py-6 px-4">
          <DualDistanceBooth
            room={session.room}
            identity={session.identity}
            layout={syncedLayout}
            slots={4}
            filter="warm"
            adjustments={{ brightness: 1, contrast: 1, saturate: 1 }}
            onComplete={handleBoothComplete}
            onCancel={handleClosePhotoboothFlow}
          />
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center text-stone-400">
          Loading shared room album…
        </div>
      ) : (
        <AlbumView
          pages={albumPages}
          onDelete={handleDeletePage}
          onNew={handleStartPhotoboothFlow}
          onView={(p) => setViewer(p)}
        />
      )}

      {viewer && (
        <PageViewer
          page={viewer}
          onClose={() => setViewer(null)}
          onExport={(p) => {
            setExportComp(p.composition);
            setViewer(null);
          }}
        />
      )}
      {exportComp && <ExportModal comp={exportComp} onClose={() => setExportComp(null)} />}
    </div>
  );
}

function RoomLobby({
  onCreate,
  onJoin,
  onBack,
  error,
}: {
  onCreate: (name: string, mode: RoomMode) => Promise<void>;
  onJoin: (code: string, name: string) => Promise<void>;
  onBack: () => void;
  error: string;
}) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [roomType, setRoomType] = useState<RoomMode>('couple');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#fdfbf7] px-4 py-8 text-[#5c4a52]">
      <button onClick={onBack} className="absolute left-6 top-6 text-[#8c7680] hover:text-[#ff4d79] transition-colors">
        <ArrowLeft size={22} />
      </button>

      <div className="mb-6 text-center max-w-sm">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffeef4] text-[#ff4d79]">
          <Heart size={30} className="fill-[#ff4d79]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#2b1820]">Long Distance Room</h1>
        <p className="font-script text-xl text-[#ff4d79] mt-1">A private photobooth for two</p>
        <p className="mt-2 text-xs leading-relaxed text-[#7c6670]">
          Create a room, share the code with your partner, and take synchronized split-screen photos together live!
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {mode === 'choose' && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <button
            onClick={() => setMode('create')}
            className="flex items-center justify-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold py-3.5 shadow-lg shadow-pink-200 transition-all hover:scale-105"
          >
            <Heart size={18} /> Create a new room
          </button>
          <button
            onClick={() => setMode('join')}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-[#ff4d79] bg-white hover:bg-pink-50 text-[#ff4d79] font-bold py-3.5 transition-all hover:scale-105"
          >
            <LogIn size={18} /> Join with room code
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-3xl shadow-lg ring-1 ring-pink-100">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#ff4d79]">Room Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRoomType('couple')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  roomType === 'couple'
                    ? 'border-[#ff4d79] bg-[#ffeef4] text-[#ff4d79]'
                    : 'border-stone-200 text-[#7c6670] hover:border-stone-300'
                }`}
              >
                <Heart size={14} /> Couple Room
              </button>
              <button
                type="button"
                onClick={() => setRoomType('friends')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  roomType === 'friends'
                    ? 'border-[#ff4d79] bg-[#ffeef4] text-[#ff4d79]'
                    : 'border-stone-200 text-[#7c6670] hover:border-stone-300'
                }`}
              >
                <UserPlus size={14} /> Friends Group
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#ff4d79]">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-xl border-2 border-pink-100 px-3 py-2.5 text-sm text-[#2b1820] focus:border-[#ff4d79] focus:outline-none"
            />
          </div>

          <button
            disabled={busy || !name.trim()}
            onClick={() => {
              setBusy(true);
              onCreate(name, roomType).finally(() => setBusy(false));
            }}
            className="w-full rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold py-3 shadow-md shadow-pink-200 transition-all disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create Room & Generate Code'}
          </button>

          <button onClick={() => setMode('choose')} className="w-full text-xs text-[#8c7680] hover:text-[#ff4d79] transition-colors">
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-3xl shadow-lg ring-1 ring-pink-100">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#ff4d79]">Enter Room Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="6-LETTER CODE"
              maxLength={6}
              className="w-full rounded-xl border-2 border-pink-100 px-3 py-2.5 text-center text-lg font-bold tracking-widest text-[#2b1820] focus:border-[#ff4d79] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#ff4d79]">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sam"
              className="w-full rounded-xl border-2 border-pink-100 px-3 py-2.5 text-sm text-[#2b1820] focus:border-[#ff4d79] focus:outline-none"
            />
          </div>

          <button
            disabled={busy || !code.trim() || !name.trim()}
            onClick={() => {
              setBusy(true);
              onJoin(code, name).finally(() => setBusy(false));
            }}
            className="w-full rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold py-3 shadow-md shadow-pink-200 transition-all disabled:opacity-50"
          >
            {busy ? 'Joining…' : 'Join Room'}
          </button>

          <button onClick={() => setMode('choose')} className="w-full text-xs text-[#8c7680] hover:text-[#ff4d79] transition-colors">
            Back
          </button>
        </div>
      )}
    </div>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-full bg-[#ffeef4] px-3.5 py-1.5 text-xs font-bold text-[#ff4d79] transition-all hover:bg-pink-100"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {code}
    </button>
  );
}
