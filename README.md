# 📸 Love Booth — Real-Time Long Distance & Friends Photobooth

Love Booth is a state-of-the-art web application designed for long-distance partners and friends to connect, take live 50/50 split-screen photos together in real time, apply custom canvas filters and stickers, and generate shared digital scrapbooks.

---

## 💻 Tech Stack & Skills Demonstrated

### **Frontend & User Interface**
- **React 18**: Modern component architecture utilizing custom hooks, state management, and functional components.
- **TypeScript**: Strict static type checking across all data structures, room models, composition objects, and API response types.
- **Vite**: High-performance frontend build tooling with hot module replacement (HMR) and optimized bundler pipelines.
- **TailwindCSS**: Responsive design system using custom HSL themes, fluid layouts, glassmorphism, animations, and micro-interactions.
- **Lucide Icons**: Scalable vector UI iconography.

### **Backend & Database Infrastructure**
- **Neon Postgres**: Serverless PostgreSQL database architecture utilizing `@neondatabase/serverless` for HTTP-driven low-latency database queries.
- **Real-Time Synchronous State**: Custom state-polling and broadcast channels synchronizing camera countdowns and split-screen live frames between connected devices.
- **HTML5 WebRTC / MediaDevices API**: Hardware access to local webcams with real-time video stream filtering, facing mode toggles, and frame buffer captures.
- **HTML5 Canvas 2D Rendering Engine**: Dynamic client-side rendering engine converting composite photo strips, SVG stickers, and custom filter matrices into high-res downloadable PNG images.

---

## 🔥 Key Features

- 👯 **50/50 Split-Screen Camera Booth**: Displays your camera stream alongside your remote partner/friend's live camera feed side-by-side.
- ⚡ **Synchronized 3-2-1 Countdown**: Either partner can launch the photobooth session to trigger a synchronized countdown across both screens.
- 🔑 **Private Room Code Access**: Instant room creation (`Couple Room` or `Friends Group`) generated with 6-character room codes.
- 🎨 **Custom Canvas Filters & Adjustments**: Adjust brightness, contrast, saturation, and apply vintage, warm, sepia, or polaroid photo filters.
- 🎀 **Interactive Sticker Canvas**: Drag, scale, rotate, and layer emoji stickers behind or over photos on custom paper background themes (Rose, Cream, Mint, Sky).
- 📖 **Cloud Shared Album Scrapbook**: Completed photo strips are automatically saved to Neon Postgres and synced live to room members.

---

## 📁 Repository Structure

```
PhotoBooth/
├── src/
│   ├── components/
│   │   ├── DualDistanceBooth.tsx  # 50/50 split-screen real-time photobooth engine
│   │   ├── RoomScreen.tsx         # Room lobby, active member indicator & album view
│   │   ├── Editor.tsx             # Photo strip editor, sticker layering & composition
│   │   ├── Photobooth.tsx         # Local camera burst capture
│   │   ├── Home.tsx               # Main hero page & navigation bar
│   │   ├── AlbumView.tsx          # Saved scrapbook album gallery
│   │   ├── StickerCanvas.tsx      # Draggable canvas stickers
│   │   └── ExportModal.tsx        # Rendered strip export & download
│   ├── lib/
│   │   ├── db.ts                  # Neon Postgres database driver
│   │   ├── roomService.ts         # Real-time room session, snap & page services
│   │   ├── render.ts              # High-resolution HTML5 canvas rendering engine
│   │   ├── filters.ts             # Custom CSS & Canvas image filter algorithms
│   │   └── storage.ts             # Fallback browser storage management
│   ├── types.ts                   # Centralized TypeScript interface definitions
│   └── App.tsx                    # Top-level view routing & app state controller
├── neon_schema.sql                # PostgreSQL database schema & index definitions
├── vercel.json                    # Single-page application route rewrites for Vercel
├── index.html                     # HTML5 template with OpenGraph social meta tags
├── vite.config.ts                 # Vite bundler & dev server configuration
└── package.json                   # Dependency definitions & npm scripts
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

4. **Initialize Database Tables**:
   Copy and execute `neon_schema.sql` inside your [Neon Console SQL Editor](https://console.neon.tech).

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment (Vercel)

This application is fully optimized for single-click deployment on Vercel:

1. Import the GitHub repository into your [Vercel Dashboard](https://vercel.com/new).
2. Under **Environment Variables**, add `VITE_NEON_DATABASE_URL` with your Neon connection string.
3. Deploy! Single-page rewrites are pre-configured in `vercel.json`.

---

## 📄 License

Distributed under the MIT License.
