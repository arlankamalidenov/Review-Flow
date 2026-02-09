# FFmpeg Font Provider Fix

**Date**: January 29, 2026  
**Status**: ✅ Fixed

## 🐛 Problem
```
Error: can't find selected font provider
Aborted()
```
Subtitles not hardburned into video due to font issues in FFmpeg.wasm

## 🔍 Root Cause
- `subtitles` filter requires font files
- FFmpeg.wasm doesn't have font provider in browser
- Thread support not compiled in WASM build

## ✅ Solution: Drawtext Filter

### Before (Broken):
```typescript
'-vf', `subtitles=subtitles.srt:force_style='...'`
```
❌ Requires font files and font provider

### After (Fixed):
```typescript
const drawtextFilters = subtitles.map(sub => 
  `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${color}:borderw=${borderWidth}:bordercolor=${borderColor}:x=(w-text_w)/2:y=h-${fontSize*2}:enable='between(t,${start},${end})'`
);

'-vf', drawtextFilters.join(',')
```
✅ No font files needed, works in WASM

## 🎨 Features

### 1. Text Escaping
```typescript
const escapedText = text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "'\\\\''")
    .replace(/:/g, '\\\\:')
    .replace(/\n/g, ' ');
```

### 2. Color Conversion
```typescript
const textColor = '#FFFFFF' → '0xFFFFFF'
const borderColor = '#BA0C2F' → '0x2F0CBA' (BGR)
```

### 3. Positioning
```
x=(w-text_w)/2  // Center horizontally
y=h-fontSize*2  // Bottom with margin
```

### 4. Timing
```
enable='between(t,${start},${end})'
```

## ⚡ Optimizations

### Memory & Performance:
```typescript
'-preset', 'superfast',           // Fast encoding
'-max_muxing_queue_size', '1024', // Prevent memory overflow
'-crf', '23',                      // Quality balance
```

## 📊 Comparison

| Method | Font Files | WASM Support | Complexity |
|--------|-----------|--------------|------------|
| `subtitles` | ✅ Required | ❌ No | Low |
| `drawtext` | ❌ Not needed | ✅ Yes | Medium |

## ✅ Result
- No font provider errors
- No Aborted() crashes
- Subtitles hardburned successfully
- Works in browser WASM

**Status**: Production ready! 🚀
