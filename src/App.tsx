import { useState, useEffect } from 'react';
import type { Composition, AlbumPage, LayoutId } from '@/types';
import { loadAlbum, saveAlbum } from '@/lib/storage';
import { useFloatingHearts, useClickSparkles } from '@/lib/sparkle';
import { useYouTubeMusic } from '@/lib/music';
import { Home } from '@/components/Home';
import { Editor } from '@/components/Editor';
import { AlbumView } from '@/components/AlbumView';
import { PageViewer } from '@/components/PageViewer';
import { ExportModal } from '@/components/ExportModal';
import { RoomScreen } from '@/components/RoomScreen';
import { LayoutPicker } from '@/components/LayoutPicker';
import { addRoomPage, loadSoloPages, addSoloPage, deleteSoloPage, type Room } from '@/lib/roomService';
import { renderToDataURL } from '@/lib/render';

type View = 'home' | 'layout-picker' | 'editor' | 'album' | 'room' | 'room-editor';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [pages, setPages] = useState<AlbumPage[]>(() => loadAlbum());
  const [names, setNames] = useState(() => localStorage.getItem('lovebooth:names') || '');
  const [viewer, setViewer] = useState<AlbumPage | null>(null);
  const [exportComp, setExportComp] = useState<Composition | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  // room context for when editing within a room
  const [roomCtx, setRoomCtx] = useState<{ room: Room; identity: 'p1' | 'p2' | 'p3' | 'p4' } | null>(null);
  const [pickedLayout, setPickedLayout] = useState<LayoutId>('strip');

  useFloatingHearts(true);
  useClickSparkles(true);
  useYouTubeMusic(musicOn);

  // Load saved solo photos directly from Neon Postgres DB on launch
  useEffect(() => {
    loadSoloPages().then((dbPages) => {
      if (dbPages && dbPages.length > 0) {
        setPages(dbPages);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('lovebooth:names', names);
  }, [names]);

  useEffect(() => {
    saveAlbum(pages);
  }, [pages]);

  // Save completed Solo Photobooth strip into Neon Postgres Database
  const handleSave = async (title: string, section: string, comp: Composition) => {
    const thumb = await renderToDataURL(comp, 0.4);
    try {
      const newDbPage = await addSoloPage(title, section, { ...comp, names: names || comp.names }, thumb);
      setPages((prev) => [newDbPage, ...prev]);
    } catch (e: any) {
      console.error('Failed to save solo page to database:', e);
      const fallbackPage: AlbumPage = {
        id: crypto.randomUUID(),
        title,
        section,
        createdAt: Date.now(),
        paper: comp.paper,
        thumb,
        composition: { ...comp, names: names || comp.names },
      };
      setPages((prev) => [fallbackPage, ...prev]);
    }
    setView('album');
  };

  // Save into a shared room album in Neon Postgres Database
  const handleRoomSave = async (title: string, section: string, comp: Composition) => {
    if (!roomCtx) return;
    const thumb = await renderToDataURL(comp, 0.4);
    const p1Name = roomCtx.room.members?.find((m) => m.id === 'p1')?.name || roomCtx.room.partner1_name || 'Partner 1';
    const p2Name = roomCtx.room.members?.find((m) => m.id === 'p2')?.name || roomCtx.room.partner2_name || 'Partner 2';
    const author = roomCtx.identity === 'p1' ? p1Name : p2Name;
    try {
      await addRoomPage(roomCtx.room.id, author, title, section, comp, thumb);
    } catch (e: any) {
      console.error('Room save failed:', e.message);
    }
    setView('room');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSoloPage(id);
    } catch {
      // silent
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExportPage = (page: AlbumPage) => {
    setViewer(null);
    setExportComp(page.composition);
  };

  return (
    <>
      {view === 'home' && (
        <Home
          pages={pages}
          onNew={() => {
            setRoomCtx(null); // Solo Photobooth mode
            setView('layout-picker');
          }}
          onOpenAlbum={() => setView('album')}
          onOpenRoom={() => setView('room')} // Private Room mode
          musicOn={musicOn}
          onToggleMusic={() => setMusicOn((m) => !m)}
          names={names}
          setNames={setNames}
        />
      )}

      {view === 'layout-picker' && (
        <LayoutPicker
          isRoom={!!roomCtx}
          onPick={(l) => {
            setPickedLayout(l);
            setView(roomCtx ? 'room-editor' : 'editor');
          }}
          onBack={() => setView(roomCtx ? 'room' : 'home')}
        />
      )}

      {view === 'editor' && (
        <Editor
          onSave={handleSave}
          onBack={() => setView('home')}
          initialLayout={pickedLayout}
          names={names}
        />
      )}

      {view === 'room-editor' && roomCtx && (
        <Editor
          onSave={handleRoomSave}
          onBack={() => setView('room')}
          initialLayout={pickedLayout}
          names={roomCtx.room.names}
        />
      )}

      {view === 'album' && (
        <AlbumView
          pages={pages}
          onDelete={handleDelete}
          onNew={() => {
            setRoomCtx(null);
            setView('layout-picker');
          }}
          onView={(p) => setViewer(p)}
        />
      )}

      {view === 'room' && (
        <RoomScreen
          onNewPhoto={(room, identity) => {
            setRoomCtx({ room, identity });
            setView('layout-picker');
          }}
          onBack={() => setView('home')}
        />
      )}

      {viewer && (
        <PageViewer page={viewer} onClose={() => setViewer(null)} onExport={handleExportPage} />
      )}

      {exportComp && (
        <ExportModal comp={exportComp} onClose={() => setExportComp(null)} />
      )}
    </>
  );
}
