# ReviewFlow

**Unified Marketing & Management Hub for Modern Business**

ReviewFlow is not just a WordPress admin panel. It's a comprehensive platform that combines content management, content production tools, and marketing automation in one unified interface.

---

## 🎯 Vision

A Swiss Army knife for business operations that:
- Manages content across multiple platforms (WordPress, Shopify, etc.)
- Creates content locally using MacBook Pro's computing power
- Works offline for content production
- Scales with your business needs

---

## 🏗️ Architecture

ReviewFlow is built on a **two-domain architecture**:

### **Domain A: Content Management**
Manage existing content from external sources
- Reviews Management (WordPress)
- Publishing Workflows
- Archive Management
- Future: Shopify, Email, Social Media, CRM

### **Domain B: Content Production**
Create new content using local tools
- **Cover Lab**: Generate custom cover images
- **Video Reels Cutter**: Process videos for social media
- Future: Audio editing, PDF generation, batch image processing

📖 **Read more**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern browser (Chrome 92+, Edge 92+, Safari 15.4+)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Create .env.local and add:
# GEMINI_API_KEY=your_gemini_api_key

# 3. Run the development server
npm run dev

# 4. Open http://localhost:3000
```

### First Time Setup

1. **Add Project Credentials**
   - Click "Project Settings" in sidebar
   - Add WordPress site credentials
   - Credentials are stored locally (localStorage)

2. **Explore Modules**
   - **All Reviews**: Manage WordPress reviews
   - **Cover Lab**: Create cover images
   - **Video Reels**: Process videos (requires COEP - see below)

---

## 📦 Current Modules

### Reviews Management (Domain A)
- Fetch and display reviews from WordPress
- Filter by status (pending, published, draft, trash)
- Bulk actions (publish, archive, delete)
- Search and pagination
- Live feed for real-time updates

### Cover Lab (Domain B)
- Generate custom cover images for reviews
- Multiple templates and styles
- Custom fonts and colors
- Export high-quality PNG/JPG
- Completely offline

### Video Reels Cutter (Domain B)
- Trim videos to 60-second reels
- Crop to 9:16 vertical format (Instagram/TikTok)
- AI-generated subtitles (OpenAI Whisper)
- Export ready-to-publish videos
- Local processing (no upload needed)

---

## ⚙️ Configuration

### FFmpeg / Video Processing

Video Reels Cutter requires `SharedArrayBuffer` which needs special headers.

**Current Status**: COEP is **disabled** to allow Tailwind CSS from CDN
- ✅ Styles work perfectly
- ❌ Video processing doesn't work

**To Enable Video Processing**:

See detailed instructions in `vite.config.ts` comments.

**Option 1**: Quick toggle (breaks styles temporarily)
```typescript
// In vite.config.ts, uncomment:
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless', // ← Uncomment
},
```

**Option 2**: Install Tailwind locally (recommended for production)
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# Follow setup in vite.config.ts comments
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **State**: React Query (TanStack Query)
- **Video**: FFmpeg.wasm
- **AI**: OpenAI API
- **Data Sources**: WordPress REST API (more coming)

---

## 📂 Project Structure

```
/
├── ARCHITECTURE.md              # Detailed architecture docs
├── QUICK_REFERENCE.md          # Quick reference guide
├── vite.config.ts              # Server config, COEP headers
├── index.html                  # Entry point
│
├── /components/
│   ├── DashboardLayout.tsx     # Main layout
│   ├── Sidebar.tsx             # Navigation
│   ├── ReviewCard.tsx          # Domain A: Reviews
│   ├── CoverLab.tsx            # Domain B: Cover generation
│   └── VideoReelsCutter.tsx    # Domain B: Video processing
│
├── /api/
│   └── wordpress.ts            # WordPress API client
│
├── /utils/
│   ├── ffmpeg.ts               # Video processing utilities
│   └── openai.ts               # AI integration
│
└── /types/
    ├── review.ts               # TypeScript types
    └── project.ts
```

---

## 🎨 Features

### Current
- ✅ Multi-project WordPress management
- ✅ Review filtering and bulk actions
- ✅ Custom cover image generation
- ✅ Video trimming and cropping
- ✅ AI subtitle generation
- ✅ Offline content production
- ✅ Local credential storage

### Planned
- 🔄 Shopify integration
- 🔄 Email campaign management
- 🔄 Social media scheduling
- 🔄 Analytics dashboard
- 🔄 Audio podcast editor
- 🔄 PDF document generator
- 🔄 Batch image processor

---

## 🤝 Contributing

This is a private business tool, but the architecture is designed to be modular and extensible.

### Adding New Modules

1. Identify the domain (Management vs Production)
2. Follow the patterns in `ARCHITECTURE.md`
3. Update sidebar navigation
4. Document the module

---

## 📝 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full architecture documentation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference guide
- **[FFMPEG_DIAGNOSTIC_REPORT.md](./FFMPEG_DIAGNOSTIC_REPORT.md)** - FFmpeg troubleshooting
- **[QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)** - Testing guide

---

## ⚠️ Known Issues

### COEP Headers Trade-off
- **With COEP**: Video processing works, CDN resources blocked
- **Without COEP**: Styles work, video processing doesn't work
- **Solution**: Toggle as needed or install Tailwind locally

### Browser Compatibility
- Chrome 92+ (recommended)
- Edge 92+
- Safari 15.4+
- Firefox 89+ (slower video processing)

### Performance
- Video processing is CPU-intensive
- Large files (>500MB) may cause memory issues
- Close other tabs when processing video

---

## 📄 License

Private - All Rights Reserved

---

## 👤 Author

**Arlan Kamalidenov**
- Business: bfisherman.no
- Email: arlalmit@gmail.com

---

## 🙏 Acknowledgments

- Built with React, Vite, and Tailwind CSS
- Video processing powered by FFmpeg.wasm
- AI features powered by OpenAI
- Icons by Lucide

---

**Version**: 1.0.0  
**Last Updated**: January 28, 2026
