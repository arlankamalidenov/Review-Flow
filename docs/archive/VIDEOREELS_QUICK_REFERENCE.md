# 📊 VideoReels - Краткая Справочная Таблица

**Быстрый справочник по технологиям VideoReels сервиса**

---

## 🎯 Технологии по Этапам

| Этап | Технология | Назначение | Входные Данные | Выходные Данные |
|------|-----------|-----------|----------------|-----------------|
| **1. Загрузка** | HTML5 File API | Получение файла от пользователя | User selection | File object |
| | FFmpeg.wasm | Извлечение метаданных | File object | duration, width, height |
| | Blob URL API | Создание preview URL | File object | blob:// URL |
| **2. Транскрипция** | FFmpeg.wasm | Извлечение аудио | MP4 file | MP3 blob |
| | OpenAI Whisper API | AI транскрипция | MP3 blob | Word timestamps JSON |
| | JavaScript | Оптимизация сегментов | Word array | Subtitle segments |
| **3. Предпросмотр** | Remotion Player | Рендеринг композиции | Video URL + Subtitles | Canvas preview |
| | OffthreadVideo | Оптимизированное видео | Blob URL | Video layer |
| | SubtitleLayer | React-субтитры | Subtitle segments | Subtitle layer |
| | React Hooks | Управление состоянием | Frame number | Active subtitle |
| **4. Экспорт** | html2canvas | Захват DOM | Player container | Canvas snapshots |
| | Canvas API | Рисование кадров | Canvas snapshots | Canvas stream |
| | MediaRecorder | Запись видео | Canvas stream | WebM blob |
| | FFmpeg.wasm | Remux в MP4 | WebM blob | MP4 blob |
| | Download API | Сохранение файла | MP4 blob | reel.mp4 |

---

## ⚙️ Ключевые Функции и Файлы

| Функция | Файл | Строки | Технология | Описание |
|---------|------|--------|-----------|----------|
| `handleFileUpload` | VideoReelsCutter.tsx | 30-63 | File API + FFmpeg | Загрузка и валидация видео |
| `getVideoMetadata` | utils/ffmpeg.ts | 67-95 | FFmpeg.wasm | Извлечение метаданных |
| `extractAudio` | utils/ffmpeg.ts | 97-130 | FFmpeg.wasm | MP4 → MP3 конвертация |
| `transcribeAudio` | services/whisperService.ts | 4-107 | OpenAI API | Транскрипция аудио |
| `optimizeSubtitleSegments` | services/whisperService.ts | 120-157 | JavaScript | Группировка слов в сегменты |
| `RemotionPreview` | src/video-reels/RemotionPreview.tsx | 17-144 | Remotion Player | Интерактивный плеер |
| `VideoReelComposition` | src/video-reels/Composition.tsx | 28-63 | Remotion | Композиция слоев |
| `SubtitleLayer` | src/video-reels/SubtitleLayer.tsx | 23-178 | React + Remotion | Рендеринг субтитров |
| `capturePlayerToMP4` | utils/fullPlayerCapture.ts | 14-214 | html2canvas + MediaRecorder | Полный экспорт |

---

## 🔄 Поток Данных (Упрощенный)

```
User File (MP4)
    ↓
[HTML5 File API]
    ↓
File Object + Blob URL
    ↓
[FFmpeg.wasm] → Metadata (duration, width, height)
    ↓
[FFmpeg.wasm] → MP3 Audio
    ↓
[OpenAI Whisper API] → Word Timestamps
    ↓
[JavaScript] → Subtitle Segments (3-5s each)
    ↓
[Remotion Player] → Interactive Preview
    ├─ [OffthreadVideo] → Video Layer
    └─ [SubtitleLayer] → Subtitle Layer (Karaoke)
    ↓
[html2canvas] → Frame Snapshots (30 FPS)
    ↓
[Canvas API] → Canvas Stream
    ↓
[MediaRecorder] → WebM Video
    ↓
[FFmpeg.wasm] → MP4 Video (remux)
    ↓
[Download API] → reel.mp4 (saved to disk)
```

---

## 📦 NPM Пакеты

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `@ffmpeg/ffmpeg` | ^0.12.x | FFmpeg WebAssembly |
| `@ffmpeg/util` | ^0.12.x | FFmpeg утилиты |
| `openai` | ^4.x | OpenAI SDK |
| `@remotion/player` | ^4.x | Remotion плеер |
| `@remotion/cli` | ^4.x | Remotion CLI |
| `remotion` | ^4.x | Remotion core |
| `html2canvas` | ^1.4.x | DOM → Canvas |
| `zod` | ^3.x | Валидация схем |
| `@fontsource/montserrat` | ^5.x | Шрифт субтитров |
| `lucide-react` | ^0.x | UI иконки |

---

## ⏱️ Временные Оценки

| Этап | Время | Зависит от |
|------|-------|-----------|
| Загрузка видео | 1-5 сек | Размер файла |
| Извлечение аудио | 5-15 сек | Длительность видео |
| Whisper транскрипция | 15-40 сек | Длительность аудио, API скорость |
| Оптимизация сегментов | \u003c1 сек | Количество слов |
| Предпросмотр | Мгновенно | Real-time |
| Захват кадров | 60-90 сек | Длительность видео (60s × 30fps) |
| Запись WebM | 60-90 сек | Параллельно с захватом |
| Remux MP4 | 5-10 сек | Размер WebM |
| Скачивание | \u003c1 сек | Размер MP4 |

**Общее время:** ~2-3 минуты для 60-секундного видео

---

## 🎨 Стили Субтитров

| Параметр | Значение | Технология |
|----------|----------|-----------|
| Шрифт (обычный) | Montserrat 800 | @fontsource |
| Шрифт (активный) | Eurostile 500 Italic | Web Font |
| Размер | 40-60px (авто) | JavaScript |
| Цвет (обычный) | #FFFFFF | CSS |
| Цвет (активный) | #DFFF00 | CSS |
| Обводка | #BA0C2F | text-shadow |
| Анимация | scale + opacity | Remotion interpolate |
| Позиция | bottom: 150px | Inline CSS |
| Эффект | Karaoke (слово за словом) | React + CSS |

---

## 🔒 Безопасность

| Аспект | Решение |
|--------|---------|
| API ключ OpenAI | Хранится в `import.meta.env.VITE_OPENAI_API_KEY` |
| Обработка видео | Полностью клиентская (браузер) |
| Данные пользователя | Не отправляются на сервер (кроме Whisper API) |
| FFmpeg | WebAssembly sandbox |
| CORS | Не требуется (локальная обработка) |

---

## 📊 Форматы Файлов

| Этап | Формат | MIME Type | Codec |
|------|--------|-----------|-------|
| Входное видео | MP4, MOV, AVI, WebM | video/* | Any |
| Извлеченное аудио | MP3 | audio/mpeg | MP3 16kHz mono |
| Промежуточное видео | WebM | video/webm | VP9 |
| Финальное видео | MP4 | video/mp4 | VP9 (copied) |

---

## 🎯 Разрешения

| Параметр | Значение | Формат |
|----------|----------|--------|
| Входное видео | Любое | 16:9 (обычно) |
| Композиция | 1080×1920 | 9:16 (вертикально) |
| Canvas | 1080×1920 | 9:16 |
| Выходное видео | 1080×1920 | 9:16 |
| FPS | 30 | Фиксированный |
| Битрейт | 8 Mbps | MediaRecorder |

---

## 🚀 Оптимизации

| Оптимизация | Технология | Эффект |
|-------------|-----------|--------|
| Offthread Video | Remotion | Видео в отдельном потоке |
| FFmpeg Remux | `-c copy` | Без перекодирования (быстро) |
| WebAssembly | FFmpeg.wasm | Нативная скорость |
| Прогресс бар | Callbacks | UX feedback |
| Blob URLs | URL.createObjectURL | Быстрый preview |
| Auto-scaling | JavaScript | Адаптивный размер шрифта |

---

## ❌ Известные Ограничения

| Ограничение | Причина | Решение |
|-------------|---------|---------|
| Размер файла \u003c 500MB | Память браузера | Сжатие перед загрузкой |
| Длительность \u003c 10 мин | FFmpeg.wasm | Разбить на части |
| OpenAI API в браузере | `dangerouslyAllowBrowser: true` | Использовать backend proxy |
| Экспорт медленный | html2canvas | Оптимизация в будущем |

---

## 🔧 Команды FFmpeg

### Извлечение аудио:
```bash
ffmpeg -i input.mp4 -vn -ar 16000 -ac 1 -b:a 64k output.mp3
```

### Remux WebM → MP4:
```bash
ffmpeg -i input.webm -c copy output.mp4
```

### Trim видео:
```bash
ffmpeg -ss 10 -i input.mp4 -t 60 -c copy output.mp4
```

---

## 📝 Типы Данных

### VideoFile:
```typescript
{
  file: File,
  url: string,        // blob://
  duration: number,   // секунды
  width: number,      // пиксели
  height: number      // пиксели
}
```

### SubtitleSegment:
```typescript
{
  start: number,      // секунды
  end: number,        // секунды
  text: string        // текст сегмента
}
```

### ReelConfig:
```typescript
{
  startTime: number,        // начало обрезки
  duration: number,         // длительность (5-60s)
  subtitlesEnabled: boolean,
  subtitleStyle: StyleConfig
}
```

---

**Последнее обновление:** 2026-02-04  
**Версия:** 1.0  
**Статус:** ✅ Актуально
