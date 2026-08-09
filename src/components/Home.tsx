import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  BookOpen,
  Heart,
  Sparkles,
  Music,
  Music2,
  Users,
  ChevronDown,
  Lock,
  Download,
  Sticker,
  Film,
  Globe,
  Zap,
  ArrowRight,
  Star,
  type LucideIcon,
} from 'lucide-react';
import type { AlbumPage } from '@/types';
import { Button } from '@/components/ui/Button';
import { renderToDataURL } from '@/lib/render';

interface Props {
  pages: AlbumPage[];
  onNew: () => void;
  onOpenAlbum: () => void;
  onOpenRoom: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
  names: string;
  setNames: (n: string) => void;
}

const COMMUNITY_PHOTOS = [
  'https://images.pexels.com/photos/6273879/pexels-photo-6273879.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/4551839/pexels-photo-4551839.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/12084380/pexels-photo-12084380.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/8974258/pexels-photo-8974258.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/6429521/pexels-photo-6429521.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/6030227/pexels-photo-6030227.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/7337028/pexels-photo-7337028.jpeg?auto=compress&cs=tinysrgb&h=400',
  'https://images.pexels.com/photos/8334771/pexels-photo-8334771.jpeg?auto=compress&cs=tinysrgb&h=400',
];

const FLOATING_STICKERS = ['✨', '🌸', '💕', '🎀', '📸', '💫', '❤️', '🌷'];

const FAQS = [
  {
    q: 'Is this free to use?',
    a: 'Yes! Love Booth is 100% free with no account, no signup, and no download. Open the site and start taking photos instantly.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. It runs entirely in your browser on iPhone, Android, iPad, and desktop — nothing to install.',
  },
  {
    q: 'How do we use it as a long-distance couple?',
    a: 'Create a "Room for Two" and share the 6-letter code with your partner. You both get the same shared album — take photos on your own cameras and they appear in one scrapbook together, in real time.',
  },
  {
    q: 'Are my photos private?',
    a: 'Your solo photos never leave your device. Room photos are synced through a private database that only you and your partner can access with the room code.',
  },
  {
    q: 'Can I add stickers and filters?',
    a: 'Absolutely. Choose from hearts, LDR-themed stickers (planes, clocks, moon), cute doodles, flowers, and more. Drag, resize, rotate, and layer them freely. Plus 6 vintage filters and adjustable brightness, contrast, and saturation.',
  },
  {
    q: 'What can I do with my finished photos?',
    a: 'Download as a high-res PNG, print directly from your browser, or share via your phone\'s share sheet. Save them into your album scrapbook with captions and themes.',
  },
];

export function Home({ pages, onNew, onOpenAlbum, onOpenRoom, musicOn, onToggleMusic, names, setNames }: Props) {
  const [memory, setMemory] = useState<AlbumPage | null>(null);
  const [memUrl, setMemUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pages.length === 0) return;
    const idx = Math.floor(Math.random() * pages.length);
    setMemory(pages[idx]);
  }, [pages.length]);

  useEffect(() => {
    if (!memory) return;
    renderToDataURL(memory.composition, 0.4).then(setMemUrl).catch(() => {});
  }, [memory]);

  return (
    <div className="bg-romance min-h-screen overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-pink-100/50 bg-cream-100/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💕</span>
            <span className="font-display text-xl text-pink-600">Love Booth</span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <NavLink label="How it works" target="how" />
            <NavLink label="Features" target="features" />
            <NavLink label="Community" target="community" />
            <NavLink label="FAQ" target="faq" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMusic}
              className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-pink-600 shadow-sm ring-1 ring-pink-100 transition-all hover:scale-105"
            >
              {musicOn ? <Music2 size={13} className="animate-pulse" /> : <Music size={13} />}
              <span className="hidden sm:inline">{musicOn ? 'Music on' : 'Music off'}</span>
            </button>
            <Button size="sm" onClick={onNew}>
              <Camera size={14} /> <span className="hidden sm:inline">Start the Booth</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
        {/* floating stickers */}
        {FLOATING_STICKERS.map((s, i) => (
          <span
            key={i}
            className="pointer-events-none absolute text-3xl opacity-60 sm:text-4xl"
            style={{
              left: `${8 + i * 11}%`,
              top: `${15 + (i % 4) * 18}%`,
              animation: `floatUp ${8 + i}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {s}
          </span>
        ))}

        <div className="soft-in relative z-10 flex flex-col items-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-pink-500 shadow-sm ring-1 ring-pink-100">
            <Sparkles size={12} /> 100% Free · No sign-up · Made for couples
          </div>

          <h1 className="font-display text-5xl leading-tight text-pink-600 sm:text-7xl">
            Capture the moment,
            <br />
            cherish the love
          </h1>

          <p className="mt-5 max-w-lg text-base text-stone-500 sm:text-lg">
            Step into the internet's cutest photobooth for couples. Snap photo strips with your
            webcam, decorate with stickers and vintage filters, and build a shared scrapbook —
            even when you're miles apart.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={onNew} className="text-base">
              <Camera size={20} /> Start the Booth
            </Button>
            <Button size="lg" variant="soft" onClick={onOpenRoom} className="text-base">
              <Users size={20} /> Room for Two
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1.5"><Lock size={12} /> Private</span>
            <span className="flex items-center gap-1.5"><Zap size={12} /> Instant</span>
            <span className="flex items-center gap-1.5"><Globe size={12} /> Works on any device</span>
            <span className="flex items-center gap-1.5"><Star size={12} className="fill-gold-400 text-gold-400" /> No watermark</span>
          </div>

          {/* names input */}
          <div className="mt-8">
            <label className="mb-1.5 block text-xs font-semibold text-stone-400">
              Your names (shows on photo strips)
            </label>
            <input
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Alex & Sam"
              maxLength={30}
              className="w-64 rounded-full border-2 border-pink-100 bg-white/80 px-5 py-2.5 text-center text-sm text-stone-700 shadow-sm focus:border-pink-400 focus:outline-none"
            />
          </div>
        </div>

        {/* scroll hint */}
        <button
          onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-pink-400 transition-all hover:text-pink-600"
        >
          <ChevronDown className="animate-bounce" size={28} />
        </button>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-20">
        <SectionTitle
          eyebrow="How it works"
          title={<>Ready in <em className="font-display not-italic text-pink-500">under 2 minutes</em></>}
          subtitle="From snap to download — it's that simple."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StepCard
            num={1}
            icon={Camera}
            title="Strike a pose"
            desc="Allow camera access. Grab your partner (or your phone), fix your hair, and get ready for the countdown flash."
          />
          <StepCard
            num={2}
            icon={Film}
            title="Pick a vibe"
            desc="Choose from classic strip, Polaroid, or grid layouts. Apply vintage film, B&W, warm glow, or dreamy soft-focus filters."
          />
          <StepCard
            num={3}
            icon={Sticker}
            title="Decorate"
            desc="Add cute stickers, hearts, LDR-themed doodles, washi tape, and handwritten captions. Drag, resize, and rotate freely."
          />
          <StepCard
            num={4}
            icon={Download}
            title="Keep forever"
            desc="Download your high-res PNG, print it, or share it. Save it to your album scrapbook and build your story over time."
          />
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="bg-white/40 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionTitle
            eyebrow="Features"
            title={<>Everything you need to <em className="font-display not-italic text-pink-500">look iconic</em></>}
            subtitle="Packed with features that make your photos unforgettable."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Globe} title="Works in your browser" desc="Compatible with all modern browsers. Snap photos on iPhone, Android, or laptop — zero installation required." />
            <FeatureCard icon={Sticker} title="Aesthetic stickers" desc="Hearts, LDR-themed planes, clocks, moon doodles, flowers, and more. Drag, resize, rotate, and layer them your way." />
            <FeatureCard icon={Film} title="Vintage film filters" desc="Apply high-quality film grain, light leaks, and nostalgia-soaked filters. B&W, warm film, 90s tones — all one click." />
            <FeatureCard icon={Users} title="Room for Two" desc="Create a private room, share the code with your partner, and build a shared album together — even across the world." />
            <FeatureCard icon={Download} title="Instant download" desc="Download as full-resolution PNG. No watermarks, no compression. Print at home or share anywhere." />
            <FeatureCard icon={Lock} title="100% private" desc="Solo photos never leave your device. Room photos are synced through a private database only you two can access." />
          </div>
        </div>
      </section>

      {/* Community scrapbook wall */}
      <section id="community" className="mx-auto max-w-5xl px-4 py-20">
        <SectionTitle
          eyebrow="Community Scrapbook"
          title={<>Real photos from <em className="font-display not-italic text-pink-500">real couples</em></>}
          subtitle="Beautiful moments captured right here in the booth."
        />
        <div className="mt-12 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {COMMUNITY_PHOTOS.map((src, i) => (
            <div
              key={i}
              className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-md ring-1 ring-pink-100 transition-all hover:shadow-xl hover:ring-pink-300"
            >
              <img
                src={src}
                alt={`Community photo ${i + 1}`}
                className="w-full transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-3xl bg-pink-100/50 p-6 text-center ring-1 ring-pink-200">
          <p className="font-script text-xl text-pink-600">
            Take a photo, share it, and your memory could be featured here too.
          </p>
          <div className="mt-4">
            <Button onClick={onNew}>
              <Camera size={16} /> Take your photo
            </Button>
          </div>
        </div>
      </section>

      {/* Memory of the day */}
      {memory && memUrl && (
        <section className="mx-auto max-w-2xl px-4 pb-16">
          <div className="rounded-3xl bg-white/70 p-8 text-center shadow-lg ring-1 ring-pink-100">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-pink-500">
              Memory of the day
            </p>
            <img src={memUrl} alt={memory.title} className="mx-auto max-h-80 rounded-xl shadow-lg" />
            <p className="mt-4 font-script text-2xl text-stone-600">{memory.title}</p>
            {memory.section && (
              <p className="text-sm font-semibold text-pink-400">{memory.section}</p>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="bg-white/40 py-20">
        <div className="mx-auto max-w-2xl px-4">
          <SectionTitle
            eyebrow="FAQ"
            title={<>Questions? <em className="font-display not-italic text-pink-500">We've got you</em></>}
          />
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-pink-100">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-stone-700">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-pink-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="soft-in px-5 pb-4 text-sm text-stone-500">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-display text-4xl text-pink-600 sm:text-5xl">
            Your next moment is one click away
          </h2>
          <p className="mt-3 text-stone-500">
            Join thousands of couples who create and share their love story with Love Booth.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={onNew} className="text-base">
              <Camera size={20} /> Open the Booth
            </Button>
            <Button size="lg" variant="soft" onClick={onOpenAlbum} className="text-base">
              <BookOpen size={20} /> Your Album
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pink-100 py-10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-xl">💕</span>
            <span className="font-display text-lg text-pink-600">Love Booth</span>
          </div>
          <p className="text-xs text-stone-400">
            Made with <Heart size={11} className="inline fill-pink-400 text-pink-400" /> for couples everywhere · 100% free, no watermark
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ label, target }: { label: string; target: string }) {
  return (
    <button
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })}
      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-500 transition-colors hover:bg-pink-100 hover:text-pink-600"
    >
      {label}
    </button>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-400">{eyebrow}</p>
      <h2 className="font-display text-3xl text-stone-700 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-stone-400">{subtitle}</p>}
    </div>
  );
}

function StepCard({
  num,
  icon: Icon,
  title,
  desc,
}: {
  num: number;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative rounded-3xl bg-white/70 p-6 text-center shadow-sm ring-1 ring-pink-100 transition-all hover:shadow-lg hover:ring-pink-300">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-500 transition-transform group-hover:scale-110">
        <Icon size={26} />
      </div>
      <div className="absolute right-4 top-4 font-display text-2xl text-pink-200">{num}</div>
      <h3 className="mb-2 text-sm font-bold text-stone-700">{title}</h3>
      <p className="text-xs text-stone-400">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-pink-100 transition-all hover:shadow-lg hover:ring-pink-300">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-500">
        <Icon size={22} />
      </div>
      <h3 className="mb-1.5 text-sm font-bold text-stone-700">{title}</h3>
      <p className="text-xs text-stone-400">{desc}</p>
    </div>
  );
}
