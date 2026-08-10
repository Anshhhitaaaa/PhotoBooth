# 💕 Love Booth — Long Distance & Friends Photobooth

> An interactive online photobooth for long-distance couples and friends to take real-time split-screen photos together, decorate with cute stickers & filters, and create shared photo strip albums!

![Love Booth Banner](https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&h=630&q=80)

## ✨ Features

- 📸 **Live Distance Split-Screen Photobooth**: 50/50 split camera screen with 3-2-1 synchronized countdown across any distance.
- ❤️ **Couple & Friends Rooms**: Create private rooms with a 6-letter shareable code.
- 🎨 **Filters & Stickers**: Customize photo strips with vintage, warm, grainy filters and draggable emoji stickers.
- 📖 **Shared Album Scrapbook**: Automatically saves completed photo strips into a shared cloud room album.
- ⚡ **Neon Postgres Database**: Fast, serverless PostgreSQL storage powered by `@neondatabase/serverless`.
- 🚀 **Vercel Optimized**: Built with React, Vite, TailwindCSS, and deployed effortlessly on Vercel.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`)
- **Deployment**: Vercel

---

## ⚡ Setup & Installation

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/Anshhhitaaaa/PhotoBooth.git
   cd PhotoBooth
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_NEON_DATABASE_URL=postgresql://your-neon-database-url?sslmode=require
   ```

3. **Database Setup**:
   Execute `neon_schema.sql` in your [Neon Console SQL Editor](https://console.neon.tech).

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🌐 License
MIT License
