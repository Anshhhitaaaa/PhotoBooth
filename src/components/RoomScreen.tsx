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
  type Room,
  type RoomPage,
} from '@/lib/roomService';
import type { Composition, AlbumPage, RoomMode } from '@/types';
import { Button } from '@/components/ui/Button';
import { AlbumView } from '@/components/AlbumView';
import { PageViewer } from '@/components/PageViewer';
import { ExportModal } from '@/components/ExportModal';
import { DualDistanceBooth } from '@/components/DualDistanceBooth';
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
  const [inDualBooth, setInDualBooth] = useState(false);
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

    const unsub = subscribeRoomPages(session.room.id, (payload) => {
      if (payload.eventType === 'room_update') {
        const updated = payload.newPage as unknown as Room;
        if (updated) {
          setSession((s) => (s ? { ...s, room: updated } : s));
          if (updated.partner2_name || (updated.members && updated.members.length > 1)) {
            setPartnerOnline(true);
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
  }, [session?.room.id]);

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

  const handleLeave = () => {
    subRef.current?.();
    clearRoomSession();
    setSession(null);
    setPages([]);
    setPartnerOnline(false);
    setInDualBooth(false);
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
    <div className="min-h-screen bg-romance">
      <div className="sticky top-0 z-30 border-b border-pink-100 bg-cream-100/85 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft size={16} /> Home
            </Button>
            <div className="hidden sm:block">
              <h2 className="font-display text-lg text-pink-600">
                {session.room.names || 'Our Room'}
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-stone-400">
                {partnerOnline ? (
                  <>
                    <Circle size={8} className="fill-green-400 text-green-400 animate-pulse" />
                    Long-distance partners connected
                  </>
                ) : (
                  <>
                    <Circle size={8} className="fill-amber-400 text-amber-400" />
                    Share code with your partner/friends to connect
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CopyCode code={session.room.code} />
            <Button
              size="sm"
              onClick={() => setInDualBooth(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              <Zap size={14} className="fill-white" /> Live Distance Booth
            </Button>
            <Button variant="soft" size="sm" onClick={() => onNewPhoto(session.room, session.identity)}>
              <Camera size={14} /> Add photo
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLeave}>
              Leave
            </Button>
          </div>
        </div>
      </div>

      {inDualBooth ? (
        <div className="py-6 px-4">
          <DualDistanceBooth
            room={session.room}
            identity={session.identity}
            slots={4}
            filter="warm"
            adjustments={{ brightness: 1, contrast: 1, saturate: 1 }}
            onComplete={() => setInDualBooth(false)}
            onCancel={() => setInDualBooth(false)}
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
          onNew={() => onNewPhoto(session.room, session.identity)}
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-romance px-4 py-8">
      <button onClick={onBack} className="absolute left-4 top-4 text-stone-400 hover:text-pink-500">
        <ArrowLeft size={20} />
      </button>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
          <Users className="text-pink-500" size={30} />
        </div>
        <h1 className="font-display text-3xl text-pink-600">Long Distance & Friends Room</h1>
        <p className="mt-1 max-w-sm text-stone-500">
          Create a private room for you & your partner or friends. Take synchronized photos together live across any distance!
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {mode === 'choose' && (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button size="lg" onClick={() => setMode('create')}>
            <Heart size={18} /> Create a new room
          </Button>
          <Button size="lg" variant="soft" onClick={() => setMode('join')}>
            <LogIn size={18} /> Join existing room code
          </Button>
        </div>
      )}

      {mode === 'create' && (
        <div className="w-full max-w-sm space-y-4 bg-white/80 p-6 rounded-2xl shadow-sm border border-pink-100 backdrop-blur">
          <div>
            <label className="mb-1 block text-xs font-bold text-pink-600">Room Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRoomType('couple')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  roomType === 'couple'
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                <Heart size={14} /> Couple Room
              </button>
              <button
                type="button"
                onClick={() => setRoomType('friends')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  roomType === 'friends'
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                <UserPlus size={14} /> Friends Group
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-pink-600">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-xl border-2 border-stone-200 px-3 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={busy || !name.trim()}
            onClick={() => {
              setBusy(true);
              onCreate(name, roomType).finally(() => setBusy(false));
            }}
          >
            {busy ? 'Creating…' : 'Create Room & Generate Code'}
          </Button>

          <button onClick={() => setMode('choose')} className="w-full text-xs text-stone-400 hover:text-pink-500">
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="w-full max-w-sm space-y-4 bg-white/80 p-6 rounded-2xl shadow-sm border border-pink-100 backdrop-blur">
          <div>
            <label className="mb-1 block text-xs font-bold text-pink-600">Enter Room Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="6-letter code"
              maxLength={6}
              className="w-full rounded-xl border-2 border-stone-200 px-3 py-2.5 text-center text-lg font-bold tracking-widest focus:border-pink-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-pink-600">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sam"
              className="w-full rounded-xl border-2 border-stone-200 px-3 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={busy || !code.trim() || !name.trim()}
            onClick={() => {
              setBusy(true);
              onJoin(code, name).finally(() => setBusy(false));
            }}
          >
            {busy ? 'Joining…' : 'Join Room'}
          </Button>

          <button onClick={() => setMode('choose')} className="w-full text-xs text-stone-400 hover:text-pink-500">
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
      className="flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-xs font-bold text-pink-600 transition-all hover:bg-pink-200"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {code}
    </button>
  );
}
