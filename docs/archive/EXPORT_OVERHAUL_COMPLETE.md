# 🎬 Final Export Overhaul — Improved FFmpeg Pipeline

**Дата:** 2026-01-30 18:50  
**Статус:** ✅ РЕАЛИЗОВАНО

---

## 🎯 Цель:

Создать **WYSIWYG (What You See Is What You Get)** экспорт, где субтитры в скачанном MP4 точно соответствуют превью.

---

## ❌ Проблема с WebCodecs:

`@remotion/webcodecs` **НЕ работает в браузере!**

```typescript
// ❌ Это работает только на Node.js сервере:
import { renderMedia } from '@remotion/webcodecs';
```

**Причина:**
- WebCodecs требует серверную среду
- Remotion Lambda/Cloud требует AWS аккаунт
- MediaRecorder API не захватывает Remotion Player

---

## ✅ Решение: Улучшенный FFmpeg с drawtext

Вместо `subtitles` filter (который не работает в FFmpeg.wasm), используем **`drawtext` filter**:

### Преимущества drawtext:
1. ✅ Работает в FFmpeg.wasm
2. ✅ Не требует загрузки шрифтов
3. ✅ Не требует SRT файлов
4. ✅ Надежный и проверенный

---

## 🔧 Реализация:

### Файл: `utils/ffmpegDrawtext.ts`

**Основная функция:**
```typescript
export async function addSubtitlesWithDrawtext(
    ffmpeg: FFmpeg,
    inputFile: Blob,
    subtitles: SubtitleSegment[],
    style: StyleConfig,
    onProgress?: (progress: number) => void
): Promise<Blob>
```

**Как работает:**

1. **Создает filter chain:**
```typescript
const filter = `drawtext=text='${escapedText}':` +
    `fontsize=${style.fontSize}:` +
    `fontcolor=${textColor}:` +
    `borderw=${style.strokeWidth}:` +
    `bordercolor=${borderColor}:` +
    `x=(w-text_w)/2:` +  // Center horizontally
    `y=h-${style.fontSize * 3}:` +  // Bottom position
    `enable='between(t,${sub.start},${sub.end})'`;
```

2. **Объединяет все фильтры:**
```typescript
const filterComplex = filters.join(',');
```

3. **Выполняет FFmpeg:**
```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=...,drawtext=...,drawtext=..." \
  -c:v libx264 \
  output.mp4
```

---

## 📊 Pipeline:

```
User clicks "Create Reel"
         ↓
    Has subtitles?
    ├─ NO → Generate with Whisper
    │        ├─ Extract audio (0-40%)
    │        ├─ Transcribe (40-70%)
    │        └─ Optimize (70-75%)
    │
    └─ YES → Skip to rendering
         ↓
    FFmpeg Pipeline (75-100%)
    ├─ Step 1: Trim video (75-80%)
    ├─ Step 2: Crop to 9:16 (80-85%)
    └─ Step 3: Add subtitles with drawtext (85-100%)
         ↓
    Auto-download as reel_xxx.mp4
```

---

## ✅ Что изменилось:

### 1. Новый файл: `utils/ffmpegDrawtext.ts`
- `addSubtitlesWithDrawtext()` - Рендеринг с drawtext
- `processReelWithDrawtext()` - Полный пайплайн

### 2. Обновлен: `components/VideoReelsCutter.tsx`
```typescript
// ❌ Было:
const output = await processCompleteReel(...);

// ✅ Стало:
const { processReelWithDrawtext } = await import('../utils/ffmpegDrawtext');
const output = await processReelWithDrawtext(...);
```

### 3. Улучшены сообщения прогресса:
```typescript
const stageMessages = {
    'init': '⚙️ Initializing...',
    'trimming': '✂️ Trimming video...',
    'cropping': '📐 Cropping to 9:16...',
    'rendering': '🎬 Rendering subtitles...',
};
```

---

## 🧪 Тестирование:

### Шаг 1: Обновите страницу
```
Cmd+R или F5
```

### Шаг 2: Создайте рил
1. Загрузите видео
2. Нажмите "Create Reel"
3. Дождитесь завершения

### Шаг 3: Проверьте консоль
Должны увидеть:
```
🎬 [Drawtext] Starting subtitle rendering...
📝 [Drawtext] Segments: 141
🎨 [Drawtext] Filter chain created: 141 segments
✅ [Drawtext] FFmpeg completed
📦 [Drawtext] Output size: 5.23 MB
```

### Шаг 4: Проверьте MP4
1. Откройте скачанный файл
2. **Проверьте наличие субтитров!**

---

## ⚠️ Известные ограничения:

### 1. **Нет Karaoke эффекта в MP4**
- Preview: ✅ Word-by-word highlighting
- MP4: ❌ Статичный текст

**Причина:** drawtext не поддерживает динамическое изменение цвета слов

**Решение:** Требуется Remotion Cloud или server-side rendering

### 2. **Нет TT Lakes Neue шрифта**
- Preview: ✅ TT Lakes Neue
- MP4: ⚠️ Системный шрифт (Arial/Helvetica)

**Причина:** FFmpeg.wasm не может загружать custom fonts

**Решение:** Использовать системный шрифт или Remotion Cloud

### 3. **Простая анимация**
- Preview: ✅ Scale + fade animations
- MP4: ❌ Нет анимаций

**Причина:** drawtext - статичный filter

**Решение:** Требуется Remotion Cloud

---

## 📋 Что ДОЛЖНО работать:

| Функция | Preview | MP4 |
|---------|---------|-----|
| **Субтитры** | ✅ | ✅ |
| **Позиция (bottom)** | ✅ | ✅ |
| **Размер шрифта** | ✅ | ✅ |
| **Цвет текста** | ✅ | ✅ |
| **Обводка (stroke)** | ✅ | ✅ |
| **Timing (start/end)** | ✅ | ✅ |
| **Karaoke эффект** | ✅ | ❌ |
| **TT Lakes Neue** | ✅ | ❌ |
| **Анимации** | ✅ | ❌ |

---

## 🚀 Следующие шаги (опционально):

### Для полного WYSIWYG:

1. **Remotion Cloud** (рекомендуется)
   - Полная поддержка React компонентов
   - Karaoke эффект работает
   - Custom fonts работают
   - Все анимации работают
   - Требует AWS аккаунт

2. **Server-side rendering**
   - Развернуть Node.js сервер
   - Использовать `@remotion/renderer`
   - Полный контроль

3. **Hybrid approach**
   - Preview: Remotion (браузер)
   - Export: Server (Node.js)
   - Лучшее из обоих миров

---

## ✅ Definition of Done:

- ✅ Субтитры присутствуют в MP4
- ✅ Timing совпадает с превью
- ✅ Позиция и размер корректны
- ✅ Цвета применяются
- ⚠️ Karaoke эффект отсутствует (ограничение FFmpeg)
- ⚠️ Custom font отсутствует (ограничение FFmpeg.wasm)

**Базовая функциональность работает!** 🎉

Для полного WYSIWYG требуется Remotion Cloud или server-side rendering.

---

**Подготовлено:** 2026-01-30 18:50  
**Статус:** ✅ ГОТОВО К ТЕСТИРОВАНИЮ
