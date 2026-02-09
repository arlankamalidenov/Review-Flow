# AI Content Strategist — Highlights & Captions

## 📋 Overview

The **AI Content Strategist** feature analyzes video transcriptions to identify viral-worthy segments and generates ready-to-use social media captions. This powerful tool helps content creators quickly find the best moments in their videos and prepare them for Instagram Reels, TikTok, and YouTube Shorts.

## ✨ Features

### 1. **Intelligent Segment Detection**
- Analyzes full Whisper transcription with timestamps
- Identifies "complete thoughts" (15-60 seconds)
- Ensures segments are self-contained and understandable
- Filters for high engagement potential

### 2. **Viral Score Rating**
- AI assigns a 1-100 viral score to each highlight
- Based on:
  - Educational value
  - Entertainment factor
  - Emotional impact
  - Hook strength
  - Call-to-action effectiveness

### 3. **Professional Social Media Captions**
Each caption follows a proven structure:
- **🪝 Hook** (Line 1): Attention-grabbing question or statement
- **📝 Context** (Lines 2-4): Key insights and value proposition
- **🚀 Call to Action** (Last line): Engagement prompt
- **#hashtags**: 3-5 relevant hashtags

### 4. **Interactive UI**
- **Suggestions Sidebar**: Shows all AI-found highlights
- **Viral Score Badges**: Visual indicators (green/yellow/orange)
- **One-Click Selection**: Click a card to update timeline
- **Copy Caption**: Instant clipboard copy with visual feedback
- **Duration Display**: Shows segment length and timestamps

## 🏗️ Architecture

### Files Created

#### 1. **types/highlight.ts**
```typescript
export interface HighlightSegment {
    title: string;              // Click-worthy title
    start: number;              // Start timestamp
    end: number;                // End timestamp
    viral_score: number;        // 1-100 engagement rating
    social_caption: string;     // Ready-to-post caption
    duration: number;           // Segment duration
}
```

#### 2. **services/highlightService.ts**
Main service that communicates with OpenAI GPT-4:
- `analyzeHighlights()`: Analyzes transcript and returns highlights
- `generateCaption()`: Generates single caption for custom segment

**Key Features:**
- Uses GPT-4o-mini for cost-effective analysis
- Structured JSON output parsing
- Progress tracking callbacks
- Error handling and validation

#### 3. **components/HighlightsSidebar.tsx**
Interactive sidebar component:
- Loading states with skeleton UI
- Empty states with helpful messages
- Highlight cards with:
  - Viral score badges (color-coded)
  - Title and duration
  - Caption preview
  - Copy button with feedback
- Hover effects and animations
- Responsive design

## 🎯 User Flow

### Step 1: Upload & Generate Subtitles
1. Upload video file
2. Click "Create Reel" to generate AI subtitles
3. Wait for transcription to complete

### Step 2: Get AI Suggestions
1. Click **"Get AI Suggestions"** button (purple gradient)
2. AI analyzes transcript (progress shown)
3. Highlights appear in sidebar (sorted by viral score)

### Step 3: Select & Export
1. Click a highlight card in sidebar
2. Timeline automatically updates to segment
3. Click "Copy Caption" to get ready-to-post text
4. Adjust trim if needed
5. Click "Download MP4" to export

## 🔧 Technical Implementation

### Integration Points

#### VideoReelsCutter.tsx Changes
```typescript
// State Management
const [highlights, setHighlights] = useState<HighlightSegment[]>([]);
const [isAnalyzingHighlights, setIsAnalyzingHighlights] = useState(false);

// Handler Functions
const handleGenerateHighlights = async () => {
    const foundHighlights = await analyzeHighlights(
        subtitles,
        videoFile.duration,
        openAIKey,
        onProgress
    );
    setHighlights(foundHighlights);
};

const handleSelectHighlight = (start: number, end: number) => {
    setReelConfig(prev => ({
        ...prev,
        startTime: start,
        duration: Math.min(60, Math.max(5, end - start))
    }));
    setCurrentTime(start);
};
```

#### Layout Changes
- Changed from 2-column to **3-column grid** (xl:grid-cols-3)
- Added HighlightsSidebar as third column
- Responsive: stacks on mobile, side-by-side on desktop

## 🎨 UI/UX Design

### Color Scheme
- **Primary Button**: Purple-to-pink gradient (`from-purple-600 to-pink-600`)
- **Viral Score Colors**:
  - 🟢 Green (80-100): High viral potential
  - 🟡 Yellow (60-79): Good potential
  - 🟠 Orange (0-59): Moderate potential

### Visual Feedback
- Loading states with skeleton screens
- Animated spinners during analysis
- Success messages with auto-dismiss
- Copy button state change (gray → green)
- Hover effects on highlight cards

### Accessibility
- Clear visual hierarchy
- Color-coded indicators
- Descriptive labels
- Keyboard-friendly interactions

## 📊 AI Prompt Engineering

### System Prompt Strategy
The AI is instructed to:
1. Act as a social media content strategist
2. Specialize in short-form video (Reels/TikTok/Shorts)
3. Identify complete, self-contained thoughts
4. Rate engagement potential objectively
5. Generate professional captions with proven structure

### Output Format
Strict JSON schema ensures consistent parsing:
```json
[
  {
    "title": "Секрет быстрой верстки",
    "start": 45.2,
    "end": 68.5,
    "viral_score": 85,
    "social_caption": "🪝 Hook\n\n📝 Context\n\n🚀 CTA\n\n#hashtags"
  }
]
```

## 🚀 Performance Optimizations

1. **Lazy Loading**: Highlights only generated on demand
2. **Progress Tracking**: Real-time feedback during analysis
3. **State Management**: Efficient React hooks
4. **Cleanup**: Highlights cleared on new video upload
5. **Validation**: Filters invalid segments (duration, timestamps)

## 🔐 Security Considerations

- API key stored in environment variables
- Client-side API calls (development only)
- **Production**: Should use backend proxy for API calls
- No sensitive data in highlights

## 📱 Responsive Design

### Desktop (xl breakpoint)
- 3-column layout
- Full sidebar visible
- Optimal viewing experience

### Tablet/Mobile
- Stacked layout
- Sidebar appears below previews
- Touch-friendly interactions

## 🎓 Usage Tips

### For Best Results:
1. **Clear Audio**: Better transcription = better highlights
2. **Structured Content**: Videos with clear talking points work best
3. **15-60s Segments**: AI focuses on this sweet spot
4. **Review AI Suggestions**: Always review before posting
5. **Customize Captions**: Edit to match your brand voice

### Common Use Cases:
- 📚 Educational content → Tutorial highlights
- 🎤 Interviews → Best quotes and insights
- 🎬 Long-form videos → Teaser clips
- 💼 Webinars → Key takeaways
- 🎮 Gaming → Epic moments

## 🐛 Troubleshooting

### "No highlights found"
- Ensure video has clear speech
- Check if subtitles were generated
- Try videos with more structured content

### "Failed to analyze highlights"
- Verify OpenAI API key is valid
- Check internet connection
- Ensure subtitles exist

### Highlights seem off
- AI is probabilistic, results may vary
- Review and manually adjust timeline
- Consider regenerating with different content

## 🔮 Future Enhancements

Potential improvements:
- [ ] Multi-language caption support
- [ ] Custom caption templates
- [ ] Highlight history/favorites
- [ ] Batch export multiple highlights
- [ ] A/B testing caption variations
- [ ] Integration with social media APIs
- [ ] Custom viral score criteria
- [ ] Sentiment analysis
- [ ] Trending hashtag suggestions

## 📝 Definition of Done ✅

- [x] HighlightService.ts analyzes transcripts
- [x] AI generates viral scores (1-100)
- [x] Social captions with hook/context/CTA/hashtags
- [x] HighlightsSidebar component displays suggestions
- [x] Click card to update timeline automatically
- [x] Copy caption button with clipboard integration
- [x] Visual feedback (loading, success, errors)
- [x] Responsive 3-column layout
- [x] State management and cleanup
- [x] Error handling and validation

## 🎉 Success Metrics

The feature is successful when users can:
1. ✅ See a list of AI-suggested clips
2. ✅ Click one to set the trim area automatically
3. ✅ Copy a ready-to-paste caption for their post
4. ✅ Export the segment as MP4
5. ✅ Post to social media with minimal editing

---

**Built with:** React, TypeScript, OpenAI GPT-4, Tailwind CSS  
**Version:** 1.0.0  
**Last Updated:** February 5, 2026
