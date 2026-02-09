# 📚 ReviewFlow Documentation Index

Welcome to ReviewFlow - your Unified Marketing & Management Hub!

---

## 🚀 Getting Started

1. **[README.md](./README.md)** - Start here!
   - Project overview
   - Quick start guide
   - Installation instructions
   - Current features

2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick lookup
   - Two-domain architecture summary
   - Key principles
   - File structure
   - Common tasks

---

## 🏗️ Architecture

3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full architecture documentation
   - Core principles
   - Domain A vs Domain B
   - Module structure
   - Design patterns
   - Future expansion plans

4. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual diagrams
   - System architecture
   - Data flows
   - Module independence
   - Decision trees

---

## 💻 Development

5. **[CODE_EXAMPLES.md](./CODE_EXAMPLES.md)** - Code templates
   - Domain A module example (Shopify)
   - Domain B module example (Audio Editor)
   - TypeScript patterns
   - API client patterns
   - Local processing patterns

---

## 🔧 Troubleshooting

6. **[FFMPEG_DIAGNOSTIC_REPORT.md](./FFMPEG_DIAGNOSTIC_REPORT.md)** - FFmpeg issues
   - 0% progress problem diagnosis
   - COEP/COOP headers explanation
   - SharedArrayBuffer requirements
   - Complete fix documentation

7. **[QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)** - Testing guide
   - How to test Video Reels
   - Step-by-step testing
   - Expected results
   - Troubleshooting tips

---

## 📋 Other Documentation

8. **[PAGINATION_IMPLEMENTATION.md](./PAGINATION_IMPLEMENTATION.md)** - Pagination system
   - How pagination works
   - Implementation details

9. **[MIGRATION.md](./MIGRATION.md)** - Migration notes
   - Version migration guides
   - Breaking changes

---

## 🎯 Quick Navigation by Task

### I want to...

#### **Understand the project**
→ Read [README.md](./README.md) → [ARCHITECTURE.md](./ARCHITECTURE.md)

#### **Add a new feature**
→ Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) → [CODE_EXAMPLES.md](./CODE_EXAMPLES.md)

#### **Fix Video Reels not working**
→ Read [FFMPEG_DIAGNOSTIC_REPORT.md](./FFMPEG_DIAGNOSTIC_REPORT.md)

#### **Test the application**
→ Read [QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)

#### **See visual architecture**
→ Read [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)

---

## 🔑 Key Concepts

### Two-Domain Architecture

```
Domain A (Management)     Domain B (Production)
        │                         │
        ▼                         ▼
  External APIs            Local Processing
  (WordPress, etc.)        (FFmpeg, Canvas)
        │                         │
        ▼                         ▼
   Reviews Module           Cover Lab
   Future: Shopify          Video Reels
   Future: Email            Future: Audio
```

### Core Principle
> WordPress is ONE data source, not THE core

### When Adding Features
> Ask: "Is this managing content or creating content?"

---

## 📊 Current Status

### ✅ Working
- Reviews Management (WordPress)
- Cover Lab (Image generation)
- Video Reels (with COEP enabled)
- Styles (with COEP disabled)

### ⚠️ Known Issues
- COEP trade-off: Can't have both styles AND FFmpeg simultaneously
- Solution: Toggle COEP or install Tailwind locally

### 🔄 Planned
- Shopify integration
- Email campaigns
- Social media scheduling
- Audio editor
- PDF generator

---

## 🛠️ Tech Stack Summary

- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS
- **State**: React Query
- **Video**: FFmpeg.wasm
- **AI**: OpenAI API
- **Data**: WordPress REST API (+ more coming)

---

## 📞 Support

For questions or issues:
1. Check relevant documentation above
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions
3. See [CODE_EXAMPLES.md](./CODE_EXAMPLES.md) for implementation patterns

---

## 🎓 Learning Path

### Beginner
1. Read [README.md](./README.md)
2. Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
3. Try [QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)

### Intermediate
1. Study [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
3. Explore existing code in `/components/`

### Advanced
1. Read [CODE_EXAMPLES.md](./CODE_EXAMPLES.md)
2. Implement a new module
3. Contribute to architecture

---

**Last Updated**: January 28, 2026  
**Version**: 1.0.0  
**Maintainer**: Arlan Kamalidenov
