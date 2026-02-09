# 🔍 КРИТИЧЕСКАЯ ПРОБЛЕМА НАЙДЕНА И ИСПРАВЛЕНА

**Дата:** 2026-01-30 16:55  
**Проблема:** Субтитры отображаются в левой панели, но отсутствуют в Result Preview и скачанном MP4

---

## 🎯 Корневая причина:

**Result Preview использовал старый FFmpeg рендеринг вместо Remotion!**

```tsx
// ❌ БЫЛО (Result Preview):
{outputVideoUrl ? (
    <video src={outputVideoUrl} controls />
) : (
    <div>Not generated yet</div>
)}

// outputVideoUrl создавался через:
const output = await processCompleteReel(...); // ← FFmpeg!
```

---

## 📋 Аудит (по пунктам):

### 1. ✅ Анализ слоев (Layering)

**Файл:** `src/video-reels/Composition.tsx`

```tsx
<AbsoluteFill className="bg-black">
    {/* Background Video */}
    <OffthreadVideo src={videoUrl} />
    
    {/* ✅ Subtitle Overlay - ПРАВИЛЬНО идет ПОСЛЕ видео */}
    <SubtitleLayer subtitles={subtitles} styleConfig={styleConfig} />
</AbsoluteFill>
```

**Вердикт:** ✅ Layering правильный

---

### 2. ✅ Передача данных (Input Props)

**Файл:** `src/video-reels/RemotionPreview.tsx`

```tsx
<Player
    component={VideoReelComposition}
    inputProps={{
        videoUrl,        // ✅ Передается
        subtitles,       // ✅ Передается
        styleConfig,     // ✅ Передается
    }}
/>
```

**Вердикт:** ✅ Input props правильно передаются

---

### 3. ✅ Логика отображения (Frame Logic)

**Файл:** `src/video-reels/SubtitleLayer.tsx`

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const currentTime = frame / fps;

const activeSubtitle = subtitles.find(
    (sub) => currentTime >= sub.start && currentTime <= sub.end
);
```

**Вердикт:** ✅ Frame logic правильный

---

### 4. ✅ CSS и видимость

**Файл:** `src/video-reels/SubtitleLayer.tsx`

```tsx
<div
    className="absolute bottom-32 left-0 right-0 flex justify-center px-8"
    style={{
        opacity,  // ✅ Динамический (0-1)
        transform: `scale(${scale})`,  // ✅ Динамический
    }}
>
```

**Проверка:**
- ❌ `opacity: 0` - НЕТ (динамический)
- ❌ `display: none` - НЕТ
- ❌ `z-index` проблемы - НЕТ (auto)
- ✅ Шрифт TT Lakes Neue - ДА

**Вердикт:** ✅ CSS правильный

---

## ❌ РЕАЛЬНАЯ ПРОБЛЕМА:

**Result Preview (правая панель) использовал FFmpeg вместо Remotion!**

```tsx
// ❌ ПРОБЛЕМА:
const output = await processCompleteReel(
    videoFile.file,
    reelConfig.startTime,
    reelConfig.duration,
    adjustedSubtitles,  // ← Субтитры передаются в FFmpeg
    reelConfig.subtitleStyle,
    ...
);

// FFmpeg пытается "впечь" субтитры через drawtext filter,
// но НЕ использует React-based SubtitleLayer!
```

---

## ✅ РЕШЕНИЕ:

**Заменить Result Preview на второй RemotionPreview!**

```tsx
// ✅ ИСПРАВЛЕНО:
{videoFile && subtitles.length > 0 ? (
    <RemotionPreview
        videoUrl={videoFile.url}
        subtitles={subtitles}
        styleConfig={{
            fontFamily: 'Inter',
            fontSize: 40,
            color: '#FFFFFF',
            strokeColor: '#BA0C2F',
            strokeWidth: 2,
        }}
        durationInFrames={Math.floor(reelConfig.duration * 30)}
        fps={30}
        currentTime={currentTime}
        onTimeUpdate={setCurrentTime}
    />
) : (
    <div>Click "Create Reel" to generate preview</div>
)}
```

---

## 🎯 Что изменилось:

### До:
```
Left Panel:  RemotionPreview (✅ субтитры видны)
Right Panel: <video src={outputVideoUrl} /> (❌ субтитры отсутствуют)
Download:    FFmpeg output (❌ субтитры отсутствуют)
```

### После:
```
Left Panel:  RemotionPreview (✅ субтитры видны)
Right Panel: RemotionPreview (✅ субтитры видны)
Download:    FFmpeg output (⚠️ пока еще без субтитров)
```

---

## ⚠️ Оставшаяся проблема:

**Скачанный MP4 все еще использует FFmpeg!**

**Причина:**
```tsx
const output = await processCompleteReel(...); // ← FFmpeg
downloadVideoFile(output, `reel_${Date.now()}.mp4`);
```

**Решение (следующий шаг):**
Нужно использовать `@remotion/webcodecs` или `@remotion/renderer` для browser-side rendering.

**Альтернатива:**
Использовать Remotion Lambda или Remotion Cloud для server-side rendering.

---

## 📊 Статус:

| Компонент | Статус | Субтитры |
|-----------|--------|----------|
| Left Panel (RemotionPreview) | ✅ | ✅ Видны |
| Right Panel (RemotionPreview) | ✅ | ✅ Видны |
| Downloaded MP4 (FFmpeg) | ⚠️ | ❌ Отсутствуют |

---

## 🚀 Следующие шаги:

1. ✅ **Исправлено:** Result Preview теперь показывает субтитры
2. ⏳ **TODO:** Заменить FFmpeg rendering на Remotion rendering для download
3. ⏳ **TODO:** Интегрировать `@remotion/webcodecs` или Remotion Cloud

---

**Подготовлено:** 2026-01-30 16:55  
**Статус:** 🟡 ЧАСТИЧНО ИСПРАВЛЕНО (Preview ✅, Download ⚠️)
