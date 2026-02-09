# ReviewFlow Quick Reference

## 🎯 Project Identity
**ReviewFlow** = Unified Marketing & Management Hub (NOT a WordPress plugin)

## 🏗️ Two Domains

### Domain A: Content Management
- **What**: Manage existing content
- **Backend**: External APIs (WordPress, future: Shopify, Notion)
- **Modules**: Reviews, Publishing, Archive
- **Files**: `/api/*`, `/components/ReviewCard.tsx`

### Domain B: Content Production  
- **What**: Create new content locally
- **Backend**: Browser APIs + MacBook Pro
- **Modules**: Cover Lab, Video Reels Cutter
- **Files**: `/utils/ffmpeg.ts`, `/components/CoverLab.tsx`

## 🔑 Key Principle
> WordPress is ONE data source, not THE core

## ✅ When Adding Features

**Ask**: Is this managing content or creating content?

- **Managing** → Domain A → Connect to API
- **Creating** → Domain B → Local processing only

## 📂 File Structure
```
/api/          → Domain A (external APIs)
/utils/        → Domain B (local tools)
/components/   → UI for both domains
/types/        → TypeScript definitions
```

## ⚠️ Current Trade-off
- **COEP OFF**: ✅ Styles work, ❌ FFmpeg broken
- **COEP ON**: ❌ Styles break, ✅ FFmpeg works
- **Solution**: See `vite.config.ts` comments

## 🚀 Future Modules

**Domain A**: Shopify, Email, Social Media, Analytics, CRM  
**Domain B**: Audio, PDF, Batch Images, SEO Tools

---
See `ARCHITECTURE.md` for full details.
