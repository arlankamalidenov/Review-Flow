# ✅ Phase 2 Integration Guide - VideoReelsCutter

**Дата:** 2026-01-30 15:35  
**Статус:** 🟢 READY FOR INTEGRATION

---

## 🎯 Что нужно сделать в VideoReelsCutter.tsx:

### 1. **Импортировать RemotionPreview**

```typescript
import { RemotionPreview } from '../src/video-reels';
```

### 2. **Найти старый video player**

Найдите в коде:
```typescript
<video
    src={videoUrl}
    controls
    className="..."
/>
```

### 3. **Заменить на RemotionPreview**

```typescript
<RemotionPreview
    videoUrl={videoUrl}
    subtitles={subtitles.map(sub => ({
        start: sub.start,
        end: sub.end,
        text: sub.text
    }))}
    styleConfig={{
        fontFamily: 'Inter',
        fontSize: 40,
        color: '#FFFFFF',
        strokeColor: '#BA0C2F',
        strokeWidth: 2,
    }}
    durationInFrames={Math.floor(videoDuration * 30)}
    fps={30}
    currentTime={currentTime} // From timeline slider
    onTimeUpdate={(time) => setCurrentTime(time)} // Update timeline
/>
```

---

## 📋 Пример полной интеграции:

```typescript
export const VideoReelsCutter: React.FC = () => {
    const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
    const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);

    // ... existing code ...

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Video Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Preview
                </h2>
                
                {videoFile && (
                    <RemotionPreview
                        videoUrl={URL.createObjectURL(videoFile.file)}
                        subtitles={subtitles}
                        styleConfig={{
                            fontFamily: 'Inter',
                            fontSize: 40,
                            color: '#FFFFFF',
                            strokeColor: '#BA0C2F',
                            strokeWidth: 2,
                        }}
                        durationInFrames={Math.floor(videoDuration * 30)}
                        fps={30}
                        currentTime={currentTime}
                        onTimeUpdate={setCurrentTime}
                    />
                )}
            </div>

            {/* Right: Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                {/* Timeline Slider */}
                <input
                    type="range"
                    min={0}
                    max={videoDuration}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="w-full"
                />
                
                {/* Subtitle Editor */}
                {/* ... existing code ... */}
            </div>
        </div>
    );
};
```

---

## 🔧 Синхронизация с Timeline:

### Двусторонняя синхронизация:

```typescript
// 1. Timeline → Player
<input
    type="range"
    value={currentTime}
    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
/>

// 2. Player → Timeline
<RemotionPreview
    currentTime={currentTime}
    onTimeUpdate={(time) => setCurrentTime(time)}
/>
```

### Как это работает:

1. **User двигает timeline slider** → `setCurrentTime(newTime)`
2. **RemotionPreview получает новый `currentTime`** → `useEffect` срабатывает
3. **Player делает `seekTo(targetFrame)`** → мгновенный переход
4. **Player обновляет frame** → `onFrameUpdate` срабатывает
5. **Callback `onTimeUpdate`** → обновляет `currentTime` в родителе

---

## ✅ Что уже готово:

### 1. **SubtitleLayer.tsx** ✅
- ✅ Entrance animation (scale + fade)
- ✅ Highlight pulse effect (#BA0C2F)
- ✅ TT Lakes Neue font support
- ✅ Drop shadow for readability
- ✅ Backdrop blur background

### 2. **Composition.tsx** ✅
- ✅ Использует SubtitleLayer
- ✅ OffthreadVideo для плавности
- ✅ Zod validation

### 3. **RemotionPreview.tsx** ✅
- ✅ Timeline synchronization
- ✅ External currentTime support
- ✅ onTimeUpdate callback
- ✅ 9:16 aspect ratio
- ✅ Apple-style controls

---

## 🎨 Styling Features:

### TT Lakes Neue Font:

```css
/* Уже применено в SubtitleLayer */
fontFamily: "'TT Lakes Neue', sans-serif"
```

### Highlight Effect:

```typescript
// Pulse animation (1 second cycle)
const pulseProgress = (frame % 30) / 30;
const highlightOpacity = interpolate(
    pulseProgress,
    [0, 0.5, 1],
    [0.2, 0.4, 0.2]
);
```

### Drop Shadow:

```css
textShadow: `
    0 2px 8px rgba(0, 0, 0, 0.8),
    0 4px 16px rgba(0, 0, 0, 0.6),
    -2px -2px 0 #BA0C2F,
    2px -2px 0 #BA0C2F,
    -2px 2px 0 #BA0C2F,
    2px 2px 0 #BA0C2F
`
```

---

## 🔍 SharedArrayBuffer Check:

### Добавьте в console:

```typescript
useEffect(() => {
    console.log('SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined');
}, []);
```

### Должно вывести:
```
SharedArrayBuffer available: true
```

Если `false`, проверьте headers в `vite.config.ts`:
```typescript
headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
}
```

---

## 📊 Performance Tips:

### 1. **Мемоизация subtitles:**

```typescript
const memoizedSubtitles = useMemo(() => 
    subtitles.map(sub => ({
        start: sub.start,
        end: sub.end,
        text: sub.text
    })),
    [subtitles]
);
```

### 2. **Debounce timeline updates:**

```typescript
const debouncedTimeUpdate = useMemo(
    () => debounce((time: number) => setCurrentTime(time), 100),
    []
);
```

### 3. **Lazy load RemotionPreview:**

```typescript
const RemotionPreview = lazy(() => 
    import('../src/video-reels').then(m => ({ default: m.RemotionPreview }))
);
```

---

## ✅ Definition of Done:

- [x] SubtitleLayer создан с анимациями
- [x] Composition обновлен
- [x] RemotionPreview поддерживает timeline sync
- [x] TT Lakes Neue font применен
- [x] Highlight effect реализован
- [x] Drop shadow добавлен
- [ ] **Интеграция в VideoReelsCutter** (ваша задача)
- [ ] **Тестирование с реальным видео** (ваша задача)

---

## 🚀 Next Steps:

1. **Откройте VideoReelsCutter.tsx**
2. **Импортируйте RemotionPreview**
3. **Замените старый video player**
4. **Подключите timeline sync**
5. **Тестируйте!**

---

**Готово к интеграции!** 🎉

Все компоненты созданы и готовы к использованию.

---

**Подготовлено:** 2026-01-30 15:35  
**Статус:** 🟢 PHASE 2 COMPLETE
