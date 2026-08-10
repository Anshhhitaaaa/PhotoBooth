<div align="center">

# 💕 Love Booth — Real-Time Long Distance & Friends Photobooth

<p align="center">
  <b>A real-time, 50/50 split-screen online photobooth app for long-distance couples & friends!</b>
  <br />
  <span>Snap photos together live across any distance, customize with filters & stickers, and save shared scrapbook memories.</span>
</p>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-Serverless-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[🌐 Live Demo](https://photo-booth-psi-three.vercel.app/) • [⚡ Neon DB Schema](neon_schema.sql) • [🐞 Report Bug](https://github.com/Anshhhitaaaa/PhotoBooth/issues)

---

</div>

## ✨ What Makes Love Booth Special?

> *Distance means so little when someone means so much.* 💖

**Love Booth** lets couples and friends capture instant, side-by-side photobooth memories together—no matter how many miles apart they are.

- 👯 **Dual Split-Screen Camera**: 50/50 split screen showing your live camera feed alongside your partner's live feed.
- ⚡ **Synchronized 3-2-1 Countdown**: Trigger simultaneous photo captures on both devices with synchronized countdowns.
- 🔑 **Instant Private Rooms**: Create Couple Rooms or Friends Group Rooms with 6-letter room access codes.
- 🎨 **Pro Photo Filters & Adjustments**: Vintage, Warm, Sepia, Black & White, and Polaroid presets with dynamic brightness/contrast sliders.
- 🎀 **Interactive Drag & Drop Sticker Studio**: Layer, rotate, and scale emoji stickers onto custom paper canvas themes (*Rose, Cream, Mint, Sky*).
- 📖 **Live Cloud Scrapbook**: Completed photo strips are automatically saved to Neon Postgres and synced to all room members in real time.

---

## 🛠️ Tech Stack & Architecture

### **Frontend & UX**
- **React 18** + **TypeScript**: Strict type checking across room sessions, compositions, and hardware buffers.
- **Vite 5**: Blazing fast HMR and lightweight production bundle.
- **TailwindCSS**: Glassmorphism, smooth animations, and custom theme tokens.
- **HTML5 Canvas 2D Engine**: High-res client-side canvas rendering for downloadable photo strips.

### **Backend & Real-Time Sync**
- **Neon Postgres**: Serverless PostgreSQL communicating over HTTPS via `@neondatabase/serverless`.
- **Zero-Latency Polling & Signal Broadcaster**: Synchronizes room session state (`active_session`) and split-screen captures.

---

## 📁 Repository Directory Map

```
PhotoBooth/
├── src/
│   ├── components/
│   │   ├── DualDistanceBooth.tsx  # 50/50 split-screen live camera engine
│   │   ├── RoomScreen.tsx         # Room lobby, member status & album scrapbook
│   │   ├── Editor.tsx             # Photo strip editor & sticker compositor
│   │   ├── Photobooth.tsx         # Single camera photo burst
│   │   ├── Home.tsx               # Main hero section & features navbar
│   │   ├── AlbumView.tsx          # Saved scrapbook gallery
│   │   └── ExportModal.tsx        # High-res photo strip PNG downloader
│   ├── lib/
│   │   ├── db.ts                  # Neon Postgres connection driver
│   │   ├── roomService.ts         # Real-time room, snap & album page services
│   │   └── render.ts              # Canvas 2D rendering pipeline
│   ├── types.ts                   # Centralized TypeScript definitions
│   └── App.tsx                    # Top-level view routing controller
├── public/
│   ├── favicon.svg                # Custom Love Booth SVG logo
│   └── og-image.svg               # OpenGraph preview banner
├── neon_schema.sql                # PostgreSQL database schema & migration script
├── vercel.json                    # Vercel SPA routing rules
└── package.json                   # Project dependencies & scripts
```

---

## ⚡ Quickstart & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Anshhhitaaaa/PhotoBooth.git
cd PhotoBooth

# 2. Install dependencies
npm install

# 3. Create environment configuration (.env)
echo "VITE_NEON_DATABASE_URL=postgresql://your-neon-db-url?sslmode=require" > .env

# 4. Initialize database schema
# Run neon_schema.sql in your Neon Console (https://console.neon.tech)

# 5. Launch local server
npm run dev
```

---

## 🚀 Deployment (Vercel)

1. Import this repository into your **[Vercel Dashboard](https://vercel.com/new)**.
2. Add Environment Variable:
   - `VITE_NEON_DATABASE_URL` = `your-neon-postgres-connection-string`
3. Click **Deploy**!

---

## 📄 License

Distributed under the **MIT License**. Created with ❤️ by [Anshhita](https://github.com/Anshhhitaaaa).
