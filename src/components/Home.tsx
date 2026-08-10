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
  Key,
  type LucideIcon,
} from 'lucide-react';
import type { AlbumPage } from '@/types';
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

const FLOATING_STICKERS = [
  { char: '💫', left: '6%', top: '12%', anim: 'floatGentle', duration: '5s', delay: '0s', size: 'text-2xl sm:text-3xl' },
  { char: '💖', left: '23%', top: '2%', anim: 'floatSlowBob', duration: '6s', delay: '0.8s', size: 'text-2xl sm:text-3xl' },
  { char: '🌙', left: '52%', top: '20%', anim: 'floatGentle', duration: '5.5s', delay: '0.2s', size: 'text-xl sm:text-2xl' },
  { char: '💌', left: '28%', top: '26%', anim: 'floatSlowBob', duration: '5.8s', delay: '1.2s', size: 'text-xl sm:text-2xl' },
  { char: '🌼', left: '22%', top: '36%', anim: 'floatGentle', duration: '6.2s', delay: '0.4s', size: 'text-2xl sm:text-3xl' },
  { char: '🌸', left: '76%', top: '28%', anim: 'floatSlowBob', duration: '5.4s', delay: '1.0s', size: 'text-2xl sm:text-3xl' },
  { char: '✨', left: '64%', top: '39%', anim: 'floatGentle', duration: '4.8s', delay: '0.6s', size: 'text-xl sm:text-2xl' },
  { char: '💖', left: '54%', top: '44%', anim: 'floatSlowBob', duration: '5.6s', delay: '1.4s', size: 'text-2xl sm:text-3xl' },
  { char: '💕', left: '93%', top: '30%', anim: 'floatGentle', duration: '6.5s', delay: '0.3s', size: 'text-2xl sm:text-3xl' },
  { char: '🦋', left: '90%', top: '50%', anim: 'floatSlowBob', duration: '7.0s', delay: '0.9s', size: 'text-2xl sm:text-3xl' },
  { char: '🌷', left: '95%', top: '70%', anim: 'floatGentle', duration: '5.2s', delay: '1.1s', size: 'text-xl sm:text-2xl' },
  { char: '🎀', left: '53%', top: '66%', anim: 'floatSlowBob', duration: '6.0s', delay: '0.5s', size: 'text-2xl sm:text-3xl' },
  { char: '✨', left: '23%', top: '86%', anim: 'floatGentle', duration: '4.6s', delay: '1.3s', size: 'text-xl sm:text-2xl' },
  { char: '💌', left: '1%', top: '95%', anim: 'floatSlowBob', duration: '5.5s', delay: '0.7s', size: 'text-2xl sm:text-3xl' },
];

const FAQS = [
  {
    q: 'Is this free to use?',
    a: 'Yes! Love Booth is 100% free with no account, no signup, and no watermarks. Open the site and start taking photos instantly.',
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
    a: 'Your solo photos never leave your device. Room photos are synced through a private database that only you and your partner can access with your code.',
  },
  {
    q: 'Can I add stickers and filters?',
    a: 'Absolutely. Choose from doodle hearts, cute expressions, flowers, coquette bows, and more. Drag, resize, and rotate freely.',
  },
  {
    q: 'What can I do with my finished photos?',
    a: 'Download as a high-res PNG, print directly from your browser, or share via your phone\'s share sheet.',
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
    <div className="min-h-screen overflow-x-hidden bg-[#fdfbf7] text-[#5c4a52] selection:bg-pink-100 selection:text-pink-600">
      {/* Top Header Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#fdfbf7]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={20} className="fill-[#ff4d79] text-[#ff4d79]" />
            <span className="font-script text-2xl font-bold text-[#2b1820]">Us Booth</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onToggleMusic}
              className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#ff4d79] shadow-sm ring-1 ring-pink-100 transition-all hover:scale-105"
            >
              {musicOn ? <Music2 size={13} className="animate-pulse" /> : <Music size={13} />}
              <span className="hidden sm:inline">{musicOn ? 'Music on' : 'Music off'}</span>
            </button>
            <button
              onClick={onOpenRoom}
              className="flex items-center gap-1.5 text-xs font-bold text-[#ff4d79] bg-[#ffeef4] px-4 py-2 rounded-full hover:bg-pink-100 transition-all"
            >
              <Users size={14} /> Pvt Room
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16 text-center overflow-hidden">
        {/* Ambient Floating Stickers Scattered in Background */}
        {FLOATING_STICKERS.map((s, i) => (
          <span
            key={i}
            className={`pointer-events-none absolute ${s.size} opacity-60 select-none`}
            style={{
              left: s.left,
              top: s.top,
              animation: `${s.anim} ${s.duration} ease-in-out infinite alternate`,
              animationDelay: s.delay,
            }}
          >
            {s.char}
          </span>
        ))}

        <div className="soft-in relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          {/* Pink Pill Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#fce7f0] border border-pink-200/70 px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#e11d63] shadow-sm transition-transform hover:scale-105">
            <Sparkles size={15} /> A photobooth for long-distance love
          </div>

          {/* Main Title Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#2b1820] tracking-tight leading-tight">
            A photobooth for two,
          </h1>
          <h2 className="font-script text-4xl sm:text-5xl lg:text-6xl text-[#ff4d79] font-normal italic mt-1 sm:mt-2">
            no matter the distance
          </h2>

          {/* Description Text */}
          <p className="mt-6 text-sm sm:text-base text-[#5c4a52] font-normal leading-relaxed max-w-lg">
            Step inside the internet's cutest photobooth — built for couples who are far apart but close at heart. Take photo strips together, in real time, and keep them in a shared album.
          </p>

          {/* Action Buttons (Matching Image 1) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onNew}
              className="flex items-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold text-base px-8 py-3.5 shadow-lg shadow-pink-200 transition-all hover:scale-105 active:scale-95"
            >
              <Camera size={18} /> Start Solo Booth <ArrowRight size={18} />
            </button>
            <button
              onClick={onOpenRoom}
              className="flex items-center gap-2 rounded-full border-2 border-[#ff4d79] hover:bg-pink-50 text-[#ff4d79] font-bold text-base px-8 py-3.5 transition-all hover:scale-105 active:scale-95 bg-white"
            >
              <Users size={18} /> Pvt Room
            </button>
          </div>

          {/* Names Input for Strip Header */}
          <div className="mt-8 flex flex-col items-center">
            <label className="mb-2 text-xs font-semibold text-[#8c7680]">
              Your names (printed on your photo strips)
            </label>
            <input
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="e.g. Alex & Sam"
              maxLength={30}
              className="w-64 rounded-full border-2 border-pink-200 bg-white px-5 py-2.5 text-center text-sm text-[#2b1820] shadow-sm focus:border-[#ff4d79] focus:outline-none"
            />
          </div>
        </div>

        {/* Scroll Arrow */}
        <button
          onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#ff4d79] transition-all hover:scale-110"
        >
          <ChevronDown className="animate-bounce" size={28} />
        </button>
      </section>

      {/* "How it works" Section (Matching Image 2 Exact Cards & Layout) */}
      <section id="how" className="relative mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="font-script text-4xl sm:text-5xl text-[#ff4d79] font-normal">
          How it works
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#5c4a52]">
          Three little steps to a memory you'll keep forever.
        </p>

        {/* 3 Soft Floating White Cards (Matching Image 2) */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative flex flex-col items-center rounded-3xl bg-white p-8 text-center shadow-lg shadow-pink-100/50 ring-1 ring-pink-100/60 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffeef4] text-[#ff4d79]">
              <Users size={28} />
            </div>
            <span className="font-script text-xl text-[#ff4d79] italic mb-1">Step 1</span>
            <h3 className="text-lg font-bold text-[#2b1820]">Join together</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#7c6670]">
              One of you creates a room, the other joins with a 6-letter code. You're connected in seconds.
            </p>
          </div>

          {/* Step 2 */}
          <div className="group relative flex flex-col items-center rounded-3xl bg-white p-8 text-center shadow-lg shadow-pink-100/50 ring-1 ring-pink-100/60 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffeef4] text-[#ff4d79]">
              <Camera size={28} />
            </div>
            <span className="font-script text-xl text-[#ff4d79] italic mb-1">Step 2</span>
            <h3 className="text-lg font-bold text-[#2b1820]">Strike a pose</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#7c6670]">
              A synced countdown fires on both screens. Smile, laugh, be silly — the photos are captured at the same moment.
            </p>
          </div>

          {/* Step 3 */}
          <div className="group relative flex flex-col items-center rounded-3xl bg-white p-8 text-center shadow-lg shadow-pink-100/50 ring-1 ring-pink-100/60 transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffeef4] text-[#ff4d79]">
              <Sparkles size={28} />
            </div>
            <span className="font-script text-xl text-[#ff4d79] italic mb-1">Step 3</span>
            <h3 className="text-lg font-bold text-[#2b1820]">Keep forever</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#7c6670]">
              Decorate with stickers, filters, and captions. Save your strip to a shared album you both can revisit.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white/60 border-t border-b border-pink-100/60">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4d79] mb-2">Features</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2b1820]">
            Everything you need to <em className="font-script not-italic text-[#ff4d79]">look iconic</em>
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Globe} title="Works in your browser" desc="Compatible with all modern browsers. Snap photos on iPhone, Android, or laptop — zero installation required." />
            <FeatureCard icon={Sticker} title="Aesthetic stickers" desc="Hearts, LDR-themed planes, clocks, moon doodles, flowers, and more. Drag, resize, rotate, and layer them your way." />
            <FeatureCard icon={Film} title="Vintage film filters" desc="Apply high-quality film grain, light leaks, and nostalgia-soaked filters. B&W, warm film, 90s tones — all one click." />
            <FeatureCard icon={Users} title="Room for Two" desc="Create a private room, share the code with your partner, and build a shared album together — even across the world." />
            <FeatureCard icon={Download} title="Instant download" desc="Download as full-resolution PNG. No watermarks, no compression. Print at home or share anywhere." />
            <FeatureCard icon={Lock} title="100% private" desc="Solo photos never leave your device. Room photos are synced through a private database only you two can access." />
          </div>
        </div>
      </section>

      {/* Community Scrapbook Wall */}
      <section id="community" className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#ff4d79] mb-2">Community Scrapbook</p>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#2b1820]">
          Real photos from <em className="font-script not-italic text-[#ff4d79]">real couples</em>
        </h2>

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
      </section>

      {/* Memory of the day */}
      {memory && memUrl && (
        <section className="mx-auto max-w-2xl px-4 pb-16">
          <div className="rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-pink-100">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#ff4d79]">
              Memory of the day
            </p>
            <img src={memUrl} alt={memory.title} className="mx-auto max-h-80 rounded-xl shadow-lg" />
            <p className="mt-4 font-script text-2xl text-[#2b1820]">{memory.title}</p>
            {memory.section && (
              <p className="text-sm font-semibold text-[#ff4d79]">{memory.section}</p>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="bg-white/60 py-20 border-t border-pink-100/60">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4d79] mb-2">FAQ</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2b1820]">
            Questions? <em className="font-script not-italic text-[#ff4d79]">We've got you</em>
          </h2>

          <div className="mt-10 space-y-3 text-left">
            {FAQS.map((f, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-pink-100">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-bold text-[#2b1820]"
                >
                  <span className="text-sm">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#ff4d79] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="soft-in px-5 pb-4 text-sm text-[#7c6670]">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-serif text-4xl text-[#2b1820] sm:text-5xl">
            Your next moment is one click away
          </h2>
          <p className="mt-3 text-[#7c6670]">
            Join couples everywhere who create and share their love story with Us Booth.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={onNew}
              className="flex items-center gap-2 rounded-full bg-[#ff4d79] hover:bg-[#e03d67] text-white font-bold text-base px-8 py-3.5 shadow-lg shadow-pink-200 transition-all hover:scale-105"
            >
              <Camera size={20} /> Open the Booth
            </button>
            <button
              onClick={onOpenAlbum}
              className="flex items-center gap-2 rounded-full border-2 border-[#ff4d79] hover:bg-pink-50 text-[#ff4d79] font-bold text-base px-8 py-3.5 transition-all hover:scale-105 bg-white"
            >
              <BookOpen size={20} /> Your Album
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pink-100 py-10 text-center">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Heart size={18} className="fill-[#ff4d79] text-[#ff4d79]" />
            <span className="font-script text-xl text-[#2b1820]">Us Booth</span>
          </div>
          <p className="text-xs text-[#8c7680]">
            Made with <Heart size={11} className="inline fill-[#ff4d79] text-[#ff4d79]" /> for couples everywhere · 100% free, no watermark
          </p>
        </div>
      </footer>
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
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-pink-100 transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffeef4] text-[#ff4d79]">
        <Icon size={22} />
      </div>
      <h3 className="mb-1.5 text-sm font-bold text-[#2b1820]">{title}</h3>
      <p className="text-xs text-[#7c6670] leading-relaxed">{desc}</p>
    </div>
  );
}
