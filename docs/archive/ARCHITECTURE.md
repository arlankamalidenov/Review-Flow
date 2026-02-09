# ReviewFlow Architecture

**Project Vision**: Unified Marketing & Management Hub

ReviewFlow is not just a WordPress plugin or admin panel. It's a comprehensive business management platform that combines content management, content production tools, and marketing automation in one unified interface.

---

## 🏗️ Core Architecture Principles

### 1. **Separation of Concerns**

The platform is divided into two distinct domains:

#### **Domain A: Content Management** (WordPress-dependent)
- **Purpose**: Manage existing content and website operations
- **Backend**: WordPress REST API
- **Data Sources**: 
  - `bfisherman.no` (primary business site)
  - `rbesolov.com` (secondary site)
- **Modules**:
  - Reviews Management
  - Publishing Workflows
  - Archive Management

#### **Domain B: Content Production** (WordPress-independent)
- **Purpose**: Create new content using local computing power
- **Backend**: Browser APIs + Local Processing
- **Computing**: MacBook Pro resources (FFmpeg, Canvas API, AI APIs)
- **Modules**:
  - Cover Lab (Image generation)
  - Video Reels Cutter (Video processing)
  - Future: Audio editing, PDF generation, etc.

### 2. **WordPress as One of Many Data Sources**

WordPress is **NOT** the core of this application. It's one of several pluggable data sources:

```
┌─────────────────────────────────────┐
│     ReviewFlow Platform Core        │
│  (React + TypeScript + Vite)        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────┐      ┌───▼────────┐
   │ Domain A│      │  Domain B  │
   │ Content │      │  Content   │
   │ Mgmt    │      │ Production │
   └───┬────┘      └────────────┘
       │
   ┌───▼──────────────────┐
   │  Data Source Layer   │
   ├──────────────────────┤
   │ • WordPress API      │
   │ • Future: Shopify    │
   │ • Future: Notion     │
   │ • Future: Airtable   │
   │ • Future: Direct DB  │
   └──────────────────────┘
```

---

## 📦 Current Module Structure

### **Module: Reviews** (Domain A)
**Location**: `/components/DashboardLayout.tsx`, `/api/wordpress.ts`

**Responsibilities**:
- Fetch reviews from WordPress
- Display reviews in dashboard
- Filter by status (pending, published, draft, trash)
- Bulk actions (publish, archive, delete)
- Search and pagination

**Dependencies**:
- WordPress REST API
- Project credentials (stored in localStorage)

**Key Files**:
```
/api/wordpress.ts          # WordPress API client
/components/ReviewCard.tsx # Review display component
/components/Pagination.tsx # Pagination UI
/types/review.ts          # Review data types
```

---

### **Module: Cover Lab** (Domain B)
**Location**: `/components/CoverLab.tsx`

**Responsibilities**:
- Generate custom cover images for reviews
- Use Canvas API for rendering
- Export high-quality PNG/JPG
- Completely client-side (no server needed)

**Dependencies**:
- Browser Canvas API
- Custom fonts (loaded from `/public/fonts/`)
- No WordPress connection

**Key Files**:
```
/components/CoverLab.tsx
/public/fonts/cover-fonts.css
/public/fonts/*.ttf
```

---

### **Module: Video Reels Cutter** (Domain B)
**Location**: `/components/VideoReelsCutter.tsx`, `/utils/ffmpeg.ts`

**Responsibilities**:
- Trim videos to 60-second reels
- Crop to 9:16 vertical format
- Add AI-generated subtitles (OpenAI Whisper)
- Export ready-to-publish reels
- Completely client-side processing

**Dependencies**:
- FFmpeg.wasm (video processing)
- OpenAI API (subtitle generation)
- Browser File API
- No WordPress connection

**Key Files**:
```
/components/VideoReelsCutter.tsx
/utils/ffmpeg.ts
/utils/openai.ts
```

**Technical Notes**:
- Requires `SharedArrayBuffer` (COEP headers)
- Trade-off with CDN resources (see `vite.config.ts`)
- Processing happens on MacBook Pro CPU

---

## 🔌 Plugin Architecture

### Adding New Modules

When adding new functionality, **always ask**:

> **Is this managing existing content (Domain A) or creating new content (Domain B)?**

#### **Domain A Module Template** (Content Management)
```typescript
// Example: Instagram Posts Manager
interface InstagramPost {
  id: string;
  caption: string;
  imageUrl: string;
  publishedAt: Date;
}

// Fetch from external API
async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  // Connect to Instagram API
}

// Display in dashboard
function InstagramPostsModule() {
  // Similar to Reviews module
  // Filter, search, bulk actions
}
```

#### **Domain B Module Template** (Content Production)
```typescript
// Example: Audio Podcast Editor
function PodcastEditor() {
  // Use Web Audio API
  // Process locally on MacBook
  // No backend needed
  
  const processAudio = async (file: File) => {
    // Local processing only
  };
}
```

---

## 🎯 Design Patterns

### 1. **Data Source Abstraction**

All external data sources should be abstracted behind a common interface:

```typescript
// /api/data-source.ts
interface DataSource {
  name: string;
  fetchItems<T>(params: FetchParams): Promise<T[]>;
  updateItem<T>(id: string, data: Partial<T>): Promise<T>;
  deleteItem(id: string): Promise<void>;
}

// WordPress implementation
class WordPressDataSource implements DataSource {
  name = 'WordPress';
  // ... implementation
}

// Future: Shopify implementation
class ShopifyDataSource implements DataSource {
  name = 'Shopify';
  // ... implementation
}
```

### 2. **Local-First Processing**

All content production tools should:
- ✅ Work offline
- ✅ Process data locally
- ✅ Not depend on server availability
- ✅ Export results to user's file system

```typescript
// Good: Local processing
async function processVideo(file: File): Promise<Blob> {
  const ffmpeg = await initFFmpeg();
  // Process locally
  return processedBlob;
}

// Bad: Server dependency
async function processVideo(file: File): Promise<Blob> {
  // ❌ Don't do this in Domain B
  const response = await fetch('/api/process-video', {
    method: 'POST',
    body: file
  });
  return response.blob();
}
```

### 3. **Modular Sidebar Navigation**

Each module registers itself in the sidebar:

```typescript
// /config/modules.ts
interface Module {
  id: string;
  name: string;
  icon: LucideIcon;
  component: React.ComponentType;
  domain: 'management' | 'production';
  badge?: number; // For counts
}

const modules: Module[] = [
  {
    id: 'reviews',
    name: 'All Reviews',
    icon: MessageSquare,
    component: ReviewsModule,
    domain: 'management',
  },
  {
    id: 'cover-lab',
    name: 'Cover Lab',
    icon: Sparkles,
    component: CoverLab,
    domain: 'production',
  },
  // Easy to add new modules
];
```

---

## 🚀 Future Expansion Ideas

### Domain A (Content Management)
- **Shopify Orders**: Manage e-commerce orders
- **Email Campaigns**: Manage newsletter subscribers
- **Social Media**: Schedule posts across platforms
- **Analytics Dashboard**: Unified metrics from all sources
- **Customer Database**: CRM functionality

### Domain B (Content Production)
- **Audio Editor**: Podcast editing and enhancement
- **PDF Generator**: Create branded documents
- **Image Batch Processor**: Resize, watermark, optimize
- **Email Template Designer**: Visual email builder
- **Social Media Post Designer**: Multi-platform post creator
- **SEO Content Optimizer**: AI-powered content suggestions

---

## 🔧 Technical Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (CDN for now, local for production)
- **State Management**: React Query (TanStack Query)
- **Routing**: Client-side (filter-based)

### Content Production Tools
- **Video**: FFmpeg.wasm
- **Images**: Canvas API
- **AI**: OpenAI API (Whisper, GPT)
- **Fonts**: Custom fonts loaded locally

### Data Sources
- **Current**: WordPress REST API
- **Future**: Shopify, Notion, Airtable, Direct DB

### Storage
- **Credentials**: localStorage (encrypted in future)
- **Cache**: React Query cache
- **Exports**: User's file system

---

## 📝 Development Guidelines

### When Adding New Features

1. **Identify the Domain**
   - Content Management (Domain A) → Needs backend API
   - Content Production (Domain B) → Local processing only

2. **Check Dependencies**
   - Domain A: Can connect to external APIs
   - Domain B: Must work offline, use browser APIs only

3. **Follow Naming Conventions**
   ```
   /components/[ModuleName].tsx       # Main module component
   /api/[datasource].ts               # API client (Domain A only)
   /utils/[tool].ts                   # Processing utilities (Domain B)
   /types/[entity].ts                 # TypeScript types
   ```

4. **Update Sidebar**
   - Add module to sidebar navigation
   - Use appropriate icon from Lucide
   - Add badge if showing counts

5. **Document the Module**
   - Update this ARCHITECTURE.md
   - Add module-specific README if complex
   - Document any special requirements (COEP, APIs, etc.)

---

## ⚠️ Important Constraints

### COEP Headers Trade-off
- **With COEP**: FFmpeg works, CDN resources blocked
- **Without COEP**: Styles work, FFmpeg doesn't work
- **Solution**: Toggle COEP when using Video Reels, or install Tailwind locally

See `/vite.config.ts` for detailed instructions.

### Browser API Requirements
- **Canvas API**: All modern browsers
- **File API**: All modern browsers
- **FFmpeg.wasm**: Requires SharedArrayBuffer (COEP headers)
- **Web Audio API**: Future audio features

### Performance Considerations
- Video processing is CPU-intensive (MacBook Pro)
- Large files (>500MB) may cause memory issues
- Close other tabs when processing video
- Consider adding progress indicators for long operations

---

## 📚 Key Files Reference

```
/
├── ARCHITECTURE.md              # This file
├── vite.config.ts              # Server config, COEP headers
├── index.html                  # Entry point, Tailwind CDN
├── index.tsx                   # React root
│
├── /components/
│   ├── DashboardLayout.tsx     # Main layout, routing
│   ├── Sidebar.tsx             # Navigation
│   ├── ReviewCard.tsx          # Domain A component
│   ├── CoverLab.tsx            # Domain B component
│   └── VideoReelsCutter.tsx    # Domain B component
│
├── /api/
│   └── wordpress.ts            # WordPress API client
│
├── /utils/
│   ├── ffmpeg.ts               # Video processing
│   └── openai.ts               # AI integration
│
└── /types/
    ├── review.ts               # Review types
    └── project.ts              # Project types
```

---

## 🎯 Summary

**Remember**: ReviewFlow is a **Unified Marketing & Management Hub**, not a WordPress admin panel.

- **Domain A** (Management): Connect to external services, manage content
- **Domain B** (Production): Local tools, create content, no backend needed
- **WordPress**: Just one of many data sources
- **Goal**: Swiss Army knife for business operations

When in doubt, ask: *"Is this managing content or creating content?"*

---

**Last Updated**: January 28, 2026  
**Version**: 1.0  
**Maintainer**: Arlan Kamalidenov
