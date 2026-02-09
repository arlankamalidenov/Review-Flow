# Director Model Workflow - Technical Documentation

## 🎬 Overview

The **Director Model** is a restructured workflow that separates **analysis** from **rendering**, providing a more intuitive and efficient user experience.

### The Problem (Before)

**Circular Logic:**
- User uploads video
- "Create Reel" button generates subtitles during rendering
- "Get AI Suggestions" requires subtitles
- **Result**: Can't get suggestions without rendering first ❌

### The Solution (After)

**Linear Workflow:**
```
Upload → Analyze (Global) → Choose from Sidebar → Preview → Export
```

## 🔄 New Workflow

### Step 1: Upload Video
User uploads a video file (any format supported by FFmpeg)

### Step 2: Analyze Full Video (Global Analysis)
**Button**: "Analyze Full Video" (purple gradient)

**What happens:**
1. **Extract Compressed Audio** (Mono, 16kHz, 64kbps)
   - Stays under 25MB limit
   - Avoids Error 413 (Payload Too Large)
   - ~70-80% size reduction
   
2. **Transcribe with Whisper**
   - Full video transcription
   - Word-level timestamps
   
3. **Optimize Subtitles**
   - 3-5 second segments
   - Readable chunks
   
4. **Find Viral Highlights**
   - AI analyzes content
   - Generates viral scores
   - Creates social media captions

**Output:**
- ✅ Full subtitle track loaded
- ✅ Highlights sidebar populated
- ✅ Ready to select segments

### Step 3: Choose from Sidebar
**Action**: Click a highlight card

**What happens:**
- Timeline updates to segment start/end
- Current time jumps to start
- Subtitles filter automatically for preview
- **No rendering yet** - just preview setup

### Step 4: Preview Selection
**Button**: "Preview Selection" (red gradient)

**What happens:**
- Validates subtitles exist
- Shows success message
- Preview panel updates with selected segment
- User can adjust timeline manually if needed

### Step 5: Export Final
**Button**: "Download MP4" (below preview)

**What happens:**
- Captures full Remotion player
- Includes video + subtitles
- Exports as MP4
- Downloads to user's device

## 🔧 Technical Implementation

### Key Functions

#### 1. `handleGlobalAnalysis()`
**Location**: `VideoReelsCutter.tsx`

**Purpose**: One-click analysis of entire video

**Steps:**
```typescript
1. Initialize FFmpeg (0-10%)
2. Extract compressed audio (10-30%)
   - Mono: -ac 1
   - 16kHz: -ar 16000
   - 64kbps: -b:a 64k
3. Transcribe with Whisper (30-70%)
4. Optimize subtitles (70-75%)
5. Analyze highlights (75-100%)
```

**Dependencies:**
- `extractCompressedAudio()` from `utils/ffmpeg.ts`
- `transcribeAudio()` from `services/whisperService.ts`
- `optimizeSubtitleSegments()` from `services/whisperService.ts`
- `analyzeHighlights()` from `services/highlightService.ts`

#### 2. `extractCompressedAudio()`
**Location**: `utils/ffmpeg.ts`

**Purpose**: Extract audio optimized for Whisper API

**FFmpeg Command:**
```bash
ffmpeg -i input.mp4 \
  -vn \                    # No video
  -acodec libmp3lame \     # MP3 codec
  -ac 1 \                  # Mono (1 channel)
  -ar 16000 \              # 16kHz sample rate
  -b:a 64k \               # 64kbps bitrate
  -y \                     # Overwrite
  audio_compressed.mp3
```

**Benefits:**
- **Mono**: ~50% size reduction
- **16kHz**: Whisper's native sample rate (no quality loss)
- **64kbps**: Optimal for speech (music would need 128kbps+)
- **Result**: Typically 2-5MB for 10-minute video

**Validation:**
```typescript
const sizeMB = data.length / 1024 / 1024;
if (sizeMB > 25) {
    throw new Error(`Audio too large: ${sizeMB}MB (max 25MB)`);
}
```

#### 3. `handleSelectHighlight()`
**Location**: `VideoReelsCutter.tsx`

**Purpose**: Update timeline when user clicks highlight

**Logic:**
```typescript
const handleSelectHighlight = (start: number, end: number) => {
    const duration = end - start;
    
    // Update reel config
    setReelConfig(prev => ({
        ...prev,
        startTime: start,
        duration: Math.min(60, Math.max(5, duration))
    }));
    
    // Jump to start
    setCurrentTime(start);
    
    // Subtitles auto-filter via adjustSubtitleTiming()
};
```

**No Rendering**: Just updates state for preview

#### 4. `handleCreateReel()` (Simplified)
**Location**: `VideoReelsCutter.tsx`

**Purpose**: Validate and prepare for export

**Before (Complex):**
- Check if subtitles exist
- If not, extract audio
- Transcribe with Whisper
- Optimize segments
- Show success

**After (Simple):**
```typescript
const handleCreateReel = () => {
    if (subtitles.length === 0) {
        alert('Please run "Analyze Full Video" first');
        return;
    }
    
    // Just show success - subtitles already loaded
    setProcessingState({
        status: 'complete',
        message: '✅ Preview ready! Click "Download MP4" to export.'
    });
};
```

## 📊 Progress Tracking

### Global Analysis Progress Breakdown

| Stage | Progress | Message |
|-------|----------|---------|
| FFmpeg Init | 0-10% | 🎬 Initializing... |
| Audio Extract | 10-30% | 🎤 Extracting audio (compressed for API)... |
| Transcription | 30-70% | 🎤 AI is listening to your video... |
| Optimization | 70-75% | ✨ Optimizing subtitles... |
| Highlights | 75-100% | 🎯 Finding viral moments... |

### User Feedback
- Real-time progress bar
- Stage-specific messages
- Success notifications
- Error handling with clear messages

## 🎨 UI Changes

### Button Updates

**Before:**
1. ❌ "Create Reel" (red) - Generated subtitles + rendered
2. ❌ "Get AI Suggestions" (purple) - Required subtitles first

**After:**
1. ✅ "Analyze Full Video" (purple) - Does everything upfront
2. ✅ "Preview Selection" (red) - Just validates
3. ✅ "Download MP4" (red) - Final export

### Button States

#### "Analyze Full Video"
- **Enabled**: Video uploaded + API key set
- **Disabled**: No video OR no API key OR analyzing
- **Loading**: Shows spinner + "Analyzing..."

#### "Preview Selection"
- **Enabled**: Video uploaded
- **Disabled**: No video OR processing
- **Alert**: If no subtitles, prompts to analyze first

#### "Download MP4"
- **Enabled**: Video + subtitles exist
- **Disabled**: Rendering in progress
- **Location**: Below preview panel

## 🚀 Performance Benefits

### Before (Old Workflow)
1. Upload video
2. Click "Create Reel" → Extract audio (high quality) → Transcribe → Render
3. Click "Get AI Suggestions" → Analyze
4. Click highlight → Re-render
5. Download

**Total Time**: ~5-10 minutes for 10-minute video

### After (Director Model)
1. Upload video
2. Click "Analyze Full Video" → Extract compressed audio → Transcribe → Analyze
3. Click highlight → Update timeline (instant)
4. Click "Download MP4" → Render once

**Total Time**: ~3-5 minutes for 10-minute video

**Savings:**
- ✅ Compressed audio = faster upload to Whisper
- ✅ Single transcription (not per render)
- ✅ No re-analysis when switching highlights
- ✅ Instant timeline updates

## 🔐 Error Handling

### Audio Too Large (>25MB)
```typescript
if (sizeMB > 25) {
    throw new Error(
        `Audio file too large: ${sizeMB}MB (max 25MB). 
         Please use a shorter video.`
    );
}
```

**Solution**: Use shorter video or implement chunking

### No Subtitles
```typescript
if (subtitles.length === 0) {
    alert('Please run "Analyze Full Video" first');
    return;
}
```

**User Action**: Click "Analyze Full Video" button

### API Key Missing
```typescript
if (!openAIKey) {
    alert('Please provide OpenAI API key in settings');
    return;
}
```

**User Action**: Open settings and add API key

## 📝 State Management

### Key State Variables

```typescript
// Video file
const [videoFile, setVideoFile] = useState<VideoFile | null>(null);

// Subtitles (from global analysis)
const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);

// Highlights (from global analysis)
const [highlights, setHighlights] = useState<HighlightSegment[]>([]);

// Analysis in progress
const [isAnalyzingHighlights, setIsAnalyzingHighlights] = useState(false);

// Timeline selection
const [reelConfig, setReelConfig] = useState<ReelConfig>({
    startTime: 0,
    duration: 60,
    // ...
});
```

### State Flow

```
Upload → videoFile set
         ↓
Analyze → subtitles + highlights set
         ↓
Select → reelConfig updated (startTime, duration)
         ↓
Preview → validates subtitles exist
         ↓
Export → uses reelConfig + subtitles
```

## 🎯 User Benefits

### 1. **Clarity**
- Clear linear workflow
- No circular dependencies
- Obvious next steps

### 2. **Efficiency**
- Analyze once, use many times
- Instant highlight switching
- Compressed audio = faster processing

### 3. **Flexibility**
- Choose any highlight
- Adjust timeline manually
- Preview before export

### 4. **Transparency**
- See all highlights upfront
- Know viral scores before selecting
- Read captions before exporting

## 🔮 Future Enhancements

### Potential Improvements

1. **Auto-Analyze on Upload**
   - Option to analyze immediately after upload
   - Skip manual "Analyze Full Video" click

2. **Batch Export**
   - Export multiple highlights at once
   - Queue system for rendering

3. **Highlight Editing**
   - Fine-tune AI-selected segments
   - Adjust start/end by dragging

4. **Caption Customization**
   - Edit AI-generated captions
   - Save custom templates

5. **Progress Persistence**
   - Save analysis results to localStorage
   - Resume from where you left off

## 📚 Related Documentation

- **AI_CONTENT_STRATEGIST.md** - Highlights & captions feature
- **VIDEOREELS_TECHNOLOGY_BREAKDOWN.md** - Technical architecture
- **VIDEOREELS_QUICK_REFERENCE.md** - Quick reference guide

---

**Version**: 2.0.0 (Director Model)  
**Last Updated**: February 5, 2026  
**Breaking Changes**: Yes (workflow restructure)
