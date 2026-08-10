<div align="center">

# 💕 Love Booth — Real-Time Long Distance & Friends Photobooth

<p align="center">
  <b>A real-time 50/50 split-screen online photobooth app for long-distance couples & friends!</b>
  <br />
  <span>Snap photos together live across any distance, customize with cute emojis, doodle stickers & paper designs, and save shared scrapbook memories.</span>
</p>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-Serverless-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[🌐 Live Demo App](https://photo-booth-psi-three.vercel.app/) • [⚡ Neon Database Schema](neon_schema.sql) • [🐞 Report Issue](https://github.com/Anshhhitaaaa/PhotoBooth/issues)

---

</div>

## ✨ Key Features & Highlights

> *Distance means so little when someone means so much.* 💖

**Love Booth** lets couples and friends capture instant, side-by-side photobooth memories together—no matter how many miles apart they are.

### 👯 **Real-Time 50/50 Split-Screen Camera**
- Displays your webcam feed on the left half alongside your partner's live feed on the right half.
- Optimized 60 FPS video performance powered by 1.5KB low-bandwidth micro snapshots.

### ⚡ **Synchronized Room State Machine**
- When either partner clicks **"Start Photobooth Together"**, both screens transition simultaneously into the **Layout Picker**.
- Either partner can select the layout (**Photo Strip**, **Polaroid**, or **2x2 Grid**) to navigate both devices to the camera screen at the exact same millisecond.
- Triggering the countdown launches a synchronized **3-2-1 burst capture** across both cameras.

### 📸 **Dual Split Photo Compositing (`drawCoverImage`)**
- Merges Partner 1 (Left 50%) and Partner 2 (Right 50%) side-by-side into **EVERY SINGLE PHOTO FRAME** in your chosen layout.
- Utilizes canvas crop-center algorithms to preserve natural proportions without stretching or squishing.

### 🎀 **Post-Capture Decoration Studio**
- Automatically transitions both partners into the **Decoration Studio** right after photo capture.
- **8 Categorized Sticker & Emoji Packs**:
  - `❤️ Doodle Hearts & Love Stamps`
  - `🥰 Cute Expressions & Faces`
  - `🌸 Retro Flowers & Floral Doodles`
  - `🧸 Cute Plushies & Animals`
  - `🎀 Coquette & Aesthetic`
  - `🍓 Sweet Treats & Boba Drinks`
  - `✈️ LDR & Travel Memories`
  - `✨ Sparkles & Magic Symbols`
- **8 Cute Paper Background Themes**:
  - 🍦 *Vanilla Cream*, 🌸 *Rose Pink*, 🌿 *Matcha Mint*, ☁️ *Sky Blue*, 💜 *Lavender Glow*, 🍓 *Strawberry Shortcake*, 🖤 *Midnight Black*, 🎀 *Coquette Blush*.

### 📖 **Cloud Shared Scrapbook Album**
- Completed photo strips automatically save to Neon Postgres and sync to all room members in a **Bento Masonry Grid**.

---

## 🛠️ Tech Stack & Architecture

### **Frontend & User Experience**
- **React 18** + **TypeScript**: Strict type checking across room sessions, compositions, stickers, and camera buffers.
- **Vite 5**: Fast build tooling and hot module replacement.
- **TailwindCSS**: Glassmorphism design system, custom HSL theme tokens, animations, and micro-interactions.
- **HTML5 Canvas 2D Engine**: High-res client-side rendering pipeline for downloadable PNG photo strips.

### **Backend & Real-Time Infrastructure**
- **Neon Postgres**: Serverless PostgreSQL database architecture communicating over HTTPS via `@neondatabase/serverless`.
- **Low-Bandwidth Synchronous State Polling**: Real-time room session state machine (`active_session`) and snap sync.

---

## 📁 Repository Structure

```
PhotoBooth/
├── src/
│   ├── components/
│   │   ├── DualDistanceBooth.tsx  # 50/50 split-screen real-time camera & burst engine
│   │   ├── RoomScreen.tsx         # Room lobby, synchronized state machine & scrapbook
│   │   ├── Editor.tsx             # Post-capture Decoration Studio & sticker canvas
│   │   ├── LayoutPicker.tsx       # Bento Grid layout selector (Strip, Polaroid, Grid)
│   │   ├── StickerDrawer.tsx      # Categorized sticker & emoji drawer
│   │   ├── ControlPanel.tsx       # Paper background themes & filter controls
│   │   ├── Photobooth.tsx         # Local camera burst capture
│   │   ├── Home.tsx               # Hero landing section & navbar
│   │   ├── AlbumView.tsx          # Masonry shared album scrapbook
│   │   └── ExportModal.tsx        # High-res photo strip PNG downloader
│   ├── lib/
│   │   ├── db.ts                  # Neon Postgres database driver
│   │   ├── roomService.ts         # Real-time room, session state & album page services
│   │   ├── render.ts              # High-res HTML5 canvas rendering engine
│   │   ├── filters.ts             # Custom CSS & Canvas image filter algorithms
│   │   └── stickers.ts            # Expanded sticker & emoji collections
│   ├── types.ts                   # Centralized TypeScript interface definitions
│   └── App.tsx                    # Top-level view routing controller
├── public/
│   ├── favicon.svg                # Custom Love Booth SVG logo
│   └── og-image.svg               # OpenGraph preview card banner
├── neon_schema.sql                # PostgreSQL database schema & migration script
├── vercel.json                    # Single-page application route rewrites for Vercel
└── package.json                   # Project dependencies & npm scripts
```

---

## ⚡ Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Anshhhitaaaa/PhotoBooth.git
   cd PhotoBooth
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_NEON_DATABASE_URL=postgresql://your-neon-database-connection-string?sslmode=require
   ```

4. **Initialize Database Schema**:
   Copy and execute `neon_schema.sql` inside your [Neon Console SQL Editor](https://console.neon.tech).

5. **Launch Development Server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment (Vercel)

This application is fully optimized for single-click deployment on Vercel:

1. Import this repository into your **[Vercel Dashboard](https://vercel.com/new)**.
2. Under **Environment Variables**, add `VITE_NEON_DATABASE_URL` with your Neon Postgres connection string.
3. Click **Deploy**! Single-page application rewrites are pre-configured in `vercel.json`.

---

## 📄 License

Distributed under the **MIT License**. Created with ❤️ by [Anshhita](https://github.com/Anshhhitaaaa).
