# Video Reels Cutter - Implementation Documentation

## Overview
The Video Reels Cutter is a powerful web-based video editing module integrated into the ReviewFlow Dashboard. It enables users to create professional 60-second vertical reels (9:16 format) with AI-generated subtitles, all processed entirely in the browser using WebAssembly.

## Features

### 1. **Client-Side Video Processing**
- **FFmpeg WebAssembly**: All video processing happens in the browser using @ffmpeg/ffmpeg
- **No Server Required**: Complete privacy and no upload limits
- **Real-time Preview**: Instant feedback during editing

### 2. **Video Trimming**
- **Interactive Timeline**: Drag-to-select interface for choosing the best 60-second clip
- **Visual Markers**: Clear indicators for start/end points and current playback position
- **Quick Presets**: One-click buttons for Start, Middle, and End selections
- **Precise Control**: Frame-accurate trimming

### 3. **Automatic Cropping**
- **9:16 Aspect Ratio**: Automatically crops video to vertical format for Instagram Reels, TikTok, YouTube Shorts
- **Center Crop**: Intelligently crops the center portion of the video
- **Maintains Quality**: Uses FFmpeg's high-quality crop filter

### 4. **AI-Powered Subtitles**
- **OpenAI Whisper Integration**: State-of-the-art speech recognition
- **Automatic Transcription**: Generates accurate subtitles with timestamps
- **Smart Segmentation**: Optimizes subtitle length for readability (3-5 seconds per segment)
- **Custom Styling**: 
  - TT Lakes Neue font (matching Cover Lab design)
  - Customizable colors and stroke
  - Adjustable positioning (top/center/bottom)

### 5. **Professional UI**
- **Apple-Style Design**: Dark theme with glassmorphism effects
- **Smooth Animations**: Framer Motion for fluid transitions
- **Progress Tracking**: Real-time progress bars with stage indicators
- **Responsive Layout**: Works on desktop and tablet devices

## Architecture

### Technology Stack
```
Frontend Framework: React + TypeScript
Video Processing: @ffmpeg/ffmpeg (WebAssembly)
AI Transcription: OpenAI Whisper API
State Management: React Hooks
Animations: Framer Motion
Styling: Tailwind CSS
```

### File Structure
```
components/
├── VideoReelsCutter.tsx          # Main component
├── video/
│   ├── VideoPlayer.tsx            # Video player with controls
│   ├── Timeline.tsx               # Interactive timeline selector
│   ├── SubtitleOverlay.tsx        # Subtitle rendering
│   └── ProcessingProgress.tsx    # Progress indicator

utils/
└── ffmpeg.ts                      # FFmpeg utilities

services/
└── whisperService.ts              # OpenAI Whisper integration

types/
└── video.ts                       # TypeScript definitions
```

## Usage Guide

### 1. Upload Video
1. Click "Upload Your Video" or drag and drop a video file
2. Supported formats: MP4, MOV, AVI, WebM
3. Video metadata is automatically extracted

### 2. Select Clip Range
1. Use the interactive timeline to select your 60-second clip
2. Drag the selection range or use quick preset buttons
3. Preview the selection in the video player

### 3. Generate Subtitles (Optional)
1. Open Settings and enter your OpenAI API key
2. Enable "AI Subtitles" toggle
3. Click "Generate AI Subtitles"
4. Wait for transcription to complete (~30-60 seconds)
5. Review generated subtitles in the preview panel

### 4. Render Final Reel
1. Click "Render Reel" to start processing
2. Monitor progress through the stages:
   - Initialize FFmpeg
   - Trim Video
   - Crop to 9:16
   - AI Transcription (if enabled)
   - Render Final Output
3. Processing time varies based on video length and complexity

### 5. Download
1. Once complete, click "Download Reel"
2. File is saved as `reel-[timestamp].mp4`
3. Ready to upload to social media platforms

## Technical Details

### FFmpeg Processing Pipeline

#### 1. Trimming
```bash
ffmpeg -i input.mp4 -ss [startTime] -t 60 -c copy trimmed.mp4
```
- Uses stream copy for fast processing
- No re-encoding required

#### 2. Cropping to 9:16
```bash
ffmpeg -i trimmed.mp4 -vf "crop=ih*9/16:ih" -c:a copy cropped.mp4
```
- Calculates crop dimensions based on input height
- Centers the crop automatically
- Preserves audio stream

#### 3. Adding Subtitles
```bash
ffmpeg -i cropped.mp4 -vf "subtitles=subtitles.srt:force_style='...'" output.mp4
```
- Generates SRT subtitle file
- Applies custom styling (font, color, stroke)
- Burns subtitles into video

### Subtitle Generation

#### OpenAI Whisper API
```typescript
const transcription = await openai.audio.transcriptions.create({
  file: videoFile,
  model: 'whisper-1',
  response_format: 'verbose_json',
  timestamp_granularities: ['segment'],
});
```

#### Optimization
- Splits long segments into 3-5 second chunks
- Adjusts timing to match trimmed video range
- Filters out segments outside the selected range

### Performance Considerations

1. **FFmpeg Loading**: ~5-10 seconds on first use (cached afterwards)
2. **Trimming**: ~5-10 seconds for 60-second clip
3. **Cropping**: ~10-20 seconds depending on resolution
4. **Transcription**: ~30-60 seconds via OpenAI API
5. **Subtitle Rendering**: ~20-30 seconds

**Total Processing Time**: 1-2 minutes for complete workflow

### Memory Usage
- FFmpeg WASM: ~30-50 MB
- Video in memory: Varies by file size
- Recommended: 4GB+ RAM for smooth operation

## Configuration

### Default Subtitle Style
```typescript
{
  fontFamily: 'TT Lakes Neue',
  fontSize: 48,
  color: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 3,
  position: 'center',
}
```

### Customization Options
Users can modify:
- Subtitle position (top/center/bottom)
- Font size
- Colors (text and stroke)
- Stroke width
- Background color (optional)

## API Requirements

### OpenAI API Key
- Required for subtitle generation
- Stored locally in browser (not persisted)
- Uses Whisper-1 model
- Costs: ~$0.006 per minute of audio

**Security Note**: In production, implement a backend proxy to avoid exposing API keys in the browser.

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Edge 90+
- ✅ Safari 15.4+
- ✅ Firefox 89+

### Requirements
- WebAssembly support
- SharedArrayBuffer support
- Modern JavaScript (ES2020+)

## Limitations

1. **File Size**: Recommended max 500MB (browser memory constraints)
2. **Duration**: Works best with videos under 30 minutes
3. **Format**: Some codecs may not be supported (use MP4 H.264 for best compatibility)
4. **Mobile**: Not optimized for mobile devices (desktop/tablet only)

## Future Enhancements

### Planned Features
- [ ] Custom subtitle templates
- [ ] Multiple subtitle languages
- [ ] Background music overlay
- [ ] Transition effects
- [ ] Batch processing
- [ ] Cloud storage integration
- [ ] Mobile optimization
- [ ] Advanced color grading
- [ ] Text animations
- [ ] Logo/watermark overlay

### Performance Improvements
- [ ] Web Workers for parallel processing
- [ ] Progressive rendering
- [ ] Video thumbnail generation
- [ ] Caching optimization

## Troubleshooting

### Common Issues

**1. FFmpeg fails to load**
- Check browser console for errors
- Ensure SharedArrayBuffer is enabled
- Try clearing browser cache

**2. Subtitle generation fails**
- Verify OpenAI API key is correct
- Check API quota/billing
- Ensure video has clear audio

**3. Rendering is slow**
- Reduce video resolution before upload
- Close other browser tabs
- Use Chrome for best performance

**4. Download doesn't work**
- Check browser download permissions
- Ensure sufficient disk space
- Try a different browser

## Credits

### Libraries Used
- **@ffmpeg/ffmpeg**: Video processing
- **OpenAI**: Whisper API for transcription
- **React**: UI framework
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **Tailwind CSS**: Styling

### Fonts
- **TT Lakes Neue**: Subtitle font (matching Cover Lab)
- **Inter**: UI font

## License
Part of ReviewFlow Dashboard - Internal Tool

---

**Version**: 1.0.0  
**Last Updated**: January 25, 2026  
**Author**: ReviewFlow Team
