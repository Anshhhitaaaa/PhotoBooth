import { useEffect, useRef } from 'react';

const VIDEO_IDS = [
  'rtOvBOTyX00',
  'HpphFd_mzXE',
  'tcVmxb33X1w',
  'RlimRbVcv_o',
  'XfC6xNwHi2Q',
];

let apiReady: Promise<void> | null = null;
let apiResolve: (() => void) | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve) => {
    apiResolve = resolve;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  (window as any).onYouTubeIframeAPIReady = () => apiResolve?.();
  return apiReady;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function useYouTubeMusic(enabled: boolean) {
  const playerRef = useRef<any>(null);
  const orderRef = useRef<string[]>([]);
  const idxRef = useRef(0);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadYouTubeAPI();
  }, []);

  useEffect(() => {
    if (!enabled) {
      playerRef.current?.pauseVideo?.();
      return;
    }

    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled) return;

      if (!hostRef.current) {
        hostRef.current = document.createElement('div');
        hostRef.current.style.position = 'fixed';
        hostRef.current.style.top = '0';
        hostRef.current.style.left = '0';
        hostRef.current.style.width = '1px';
        hostRef.current.style.height = '1px';
        hostRef.current.style.opacity = '0';
        hostRef.current.style.pointerEvents = 'none';
        hostRef.current.style.zIndex = '-1';
        document.body.appendChild(hostRef.current);
      }

      if (orderRef.current.length === 0) {
        orderRef.current = shuffle(VIDEO_IDS);
        idxRef.current = 0;
      }

      const playCurrent = () => {
        const id = orderRef.current[idxRef.current];
        playerRef.current?.loadVideoById?.(id);
      };

      if (!playerRef.current) {
        playerRef.current = new (window as any).YT.Player(hostRef.current, {
          width: '1',
          height: '1',
          videoId: orderRef.current[0],
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            mute: 1,
          },
          events: {
            onReady: (e: any) => {
              e.target.unMute();
              e.target.playVideo();
            },
            onStateChange: (e: any) => {
              if (e.data === 0) {
                idxRef.current = (idxRef.current + 1) % orderRef.current.length;
                playCurrent();
              }
            },
            onError: () => {
              idxRef.current = (idxRef.current + 1) % orderRef.current.length;
              playCurrent();
            },
          },
        });
      } else {
        playerRef.current.unMute?.();
        playerRef.current.playVideo?.();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
