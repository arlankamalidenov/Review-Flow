# ReviewFlow Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ReviewFlow Platform                          │
│              Unified Marketing & Management Hub                      │
│                    (React + TypeScript + Vite)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐        ┌──────▼──────────┐
        │   Domain A     │        │    Domain B     │
        │    Content     │        │    Content      │
        │  Management    │        │   Production    │
        └───────┬────────┘        └──────┬──────────┘
                │                        │
                │                        │
    ┌───────────▼──────────┐   ┌────────▼─────────────┐
    │  External APIs       │   │  Local Processing    │
    │  (WordPress, etc.)   │   │  (Browser APIs)      │
    └───────────┬──────────┘   └────────┬─────────────┘
                │                        │
                │                        │
    ┌───────────▼──────────┐   ┌────────▼─────────────┐
    │  Current Modules:    │   │  Current Modules:    │
    │                      │   │                      │
    │  • Reviews Mgmt      │   │  • Cover Lab         │
    │  • Publishing        │   │  • Video Reels       │
    │  • Archive           │   │                      │
    │                      │   │  Future:             │
    │  Future:             │   │  • Audio Editor      │
    │  • Shopify Orders    │   │  • PDF Generator     │
    │  • Email Campaigns   │   │  • Batch Images      │
    │  • Social Media      │   │  • SEO Tools         │
    │  • Analytics         │   │                      │
    │  • CRM               │   │                      │
    └──────────────────────┘   └──────────────────────┘
```

## Data Flow

### Domain A: Content Management
```
User Action
    │
    ▼
Dashboard UI (React)
    │
    ▼
API Client (/api/wordpress.ts)
    │
    ▼
WordPress REST API
    │
    ▼
Response Data
    │
    ▼
React Query Cache
    │
    ▼
UI Update
```

### Domain B: Content Production
```
User Upload
    │
    ▼
File API (Browser)
    │
    ▼
Processing Utility (/utils/ffmpeg.ts)
    │
    ▼
Local Processing (MacBook CPU)
    │
    ▼
Output Blob
    │
    ▼
Download to User's File System
```

## Module Independence

```
┌─────────────────────────────────────────────────────┐
│                  ReviewFlow Core                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Reviews  │  │ Cover    │  │  Video   │          │
│  │ Module   │  │ Lab      │  │  Reels   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │                 │
│       │             │             │                 │
│  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐          │
│  │WordPress │  │ Canvas   │  │ FFmpeg   │          │
│  │   API    │  │   API    │  │  .wasm   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  Each module is independent and pluggable           │
└─────────────────────────────────────────────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
│              React Components + Tailwind             │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                  State Management                    │
│         React Query + localStorage + Context         │
└────────────────────────┬────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐            ┌─────────▼────────┐
│  External APIs  │            │  Browser APIs    │
│                 │            │                  │
│  • WordPress    │            │  • File API      │
│  • OpenAI       │            │  • Canvas API    │
│  • Future APIs  │            │  • FFmpeg.wasm   │
└─────────────────┘            └──────────────────┘
```

## File Organization

```
/Review-Flow/
│
├── 📄 ARCHITECTURE.md          ← You are here
├── 📄 README.md                ← Project overview
├── 📄 QUICK_REFERENCE.md       ← Quick guide
│
├── 📁 /components/
│   ├── DashboardLayout.tsx     ← Main layout & routing
│   ├── Sidebar.tsx             ← Navigation
│   │
│   ├── 🔵 Domain A (Management)
│   │   ├── ReviewCard.tsx
│   │   ├── Pagination.tsx
│   │   └── SearchBar.tsx
│   │
│   └── 🟢 Domain B (Production)
│       ├── CoverLab.tsx
│       └── VideoReelsCutter.tsx
│
├── 📁 /api/                    ← Domain A only
│   └── wordpress.ts
│
├── 📁 /utils/                  ← Domain B only
│   ├── ffmpeg.ts
│   └── openai.ts
│
├── 📁 /types/
│   ├── review.ts
│   └── project.ts
│
└── 📁 /public/
    └── /fonts/                 ← For Cover Lab
```

## Decision Tree: Adding New Features

```
                    New Feature Request
                            │
                            ▼
            Does it manage existing content?
                    ┌───────┴───────┐
                   YES             NO
                    │               │
                    ▼               ▼
              Domain A        Domain B
          (Management)      (Production)
                    │               │
                    ▼               ▼
         Needs external API?   Uses local tools?
                    │               │
                   YES             YES
                    │               │
                    ▼               ▼
         Create in /api/    Create in /utils/
         Connect to API     Use Browser APIs
                    │               │
                    ▼               ▼
         Add to sidebar     Add to sidebar
         as Management      as Production
                    │               │
                    └───────┬───────┘
                            ▼
                    Update ARCHITECTURE.md
```

## Example: Adding Instagram Module

```
Instagram Posts Manager (Domain A)
        │
        ▼
Create /api/instagram.ts
        │
        ▼
interface InstagramPost {
  id: string;
  caption: string;
  imageUrl: string;
}
        │
        ▼
async function fetchPosts() {
  // Connect to Instagram API
}
        │
        ▼
Create /components/InstagramModule.tsx
        │
        ▼
Add to Sidebar navigation
        │
        ▼
Done!
```

## Example: Adding Audio Editor

```
Podcast Audio Editor (Domain B)
        │
        ▼
Create /utils/audio.ts
        │
        ▼
Use Web Audio API
        │
        ▼
Process locally on MacBook
        │
        ▼
Export to user's file system
        │
        ▼
Create /components/AudioEditor.tsx
        │
        ▼
Add to Sidebar navigation
        │
        ▼
Done!
```

---

**Remember**: 
- Domain A = External data sources
- Domain B = Local processing
- WordPress = Just one data source, not the core
