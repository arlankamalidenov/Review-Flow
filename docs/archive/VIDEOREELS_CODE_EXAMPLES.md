# 💻 VideoReels - Примеры Кода и Интеграции

**Практические примеры использования технологий VideoReels**

---

## 📋 Содержание

1. [Загрузка и Метаданные](#загрузка-и-метаданные)
2. [Извлечение Аудио](#извлечение-аудио)
3. [AI Транскрипция](#ai-транскрипция)
4. [Remotion Композиция](#remotion-композиция)
5. [Экспорт в MP4](#экспорт-в-mp4)
6. [Полный Пример](#полный-пример)

---

## 🎬 Загрузка и Метаданные

### HTML5 File Input

```tsx
// VideoReelsCutter.tsx
<input
  type="file"
  accept="video/*"
  onChange={handleFileUpload}
  id="video-upload"
/>
```

### Обработка Загрузки

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // 1. Показать прогресс
    setProcessingState({ 
      status: 'loading', 
      progress: 10, 
      message: 'Loading video...' 
    });

    // 2. Получить метаданные через FFmpeg
    const metadata = await getVideoMetadata(file);

    // 3. Создать Blob URL для preview
    const url = URL.createObjectURL(file);

    // 4. Сохранить в state
    setVideoFile({
      file,
      url,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
    });

    // 5. Сбросить прогресс
    setProcessingState({ status: 'idle', progress: 0 });

  } catch (error) {
    setProcessingState({
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Failed to load video',
    });
  }
};
```

### Извлечение Метаданных (FFmpeg.wasm)

```typescript
// utils/ffmpeg.ts
export async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    // Создаем временный video элемент
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Читаем метаданные из HTML5 Video API
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });

      // Очистка
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };
  });
}
```

---

## 🎤 Извлечение Аудио

### Инициализация FFmpeg

```typescript
// utils/ffmpeg.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

export async function initFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  // Логирование
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  // Прогресс
  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  // Загрузка WASM файлов
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}
```

### Извлечение MP3

```typescript
// utils/ffmpeg.ts
import { fetchFile } from '@ffmpeg/util';

export async function extractAudio(
  ffmpeg: FFmpeg,
  inputFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // 1. Загрузить видео в виртуальную FS
  await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile));

  // 2. Выполнить команду FFmpeg
  await ffmpeg.exec([
    '-i', 'input.mp4',      // Входной файл
    '-vn',                  // Убрать видео
    '-ar', '16000',         // Частота 16kHz (оптимально для Whisper)
    '-ac', '1',             // Моно
    '-b:a', '64k',          // Битрейт 64kbps
    'output.mp3'            // Выходной файл
  ]);

  // 3. Прочитать результат
  const data = await ffmpeg.readFile('output.mp3');

  // 4. Создать Blob
  const audioBlob = new Blob([data], { type: 'audio/mpeg' });

  // 5. Очистить виртуальную FS
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  return audioBlob;
}
```

---

## 🤖 AI Транскрипция

### OpenAI Whisper API

```typescript
// services/whisperService.ts
import OpenAI from 'openai';

export async function transcribeAudio(
  audioFile: File | Blob,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<SubtitleSegment[]> {
  // 1. Создать клиент OpenAI
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // ⚠️ В продакшене использовать backend!
  });

  onProgress?.(10);

  // 2. Конвертировать Blob в File
  const file = audioFile instanceof File
    ? audioFile
    : new File([audioFile], 'audio.mp3', { type: 'audio/mpeg' });

  console.log('🎤 Sending to Whisper API...');
  console.log('📦 Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

  // 3. Отправить на транскрипцию
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word', 'segment'], // Получить word-level timestamps
  });

  onProgress?.(90);

  // 4. Обработать ответ
  const segments: SubtitleSegment[] = [];

  if ('words' in transcription && Array.isArray(transcription.words)) {
    // Группировка слов в сегменты по 3-5 секунд
    let currentSegment: SubtitleSegment | null = null;
    const maxSegmentDuration = 5;

    for (const word of transcription.words) {
      if (!currentSegment) {
        currentSegment = {
          start: word.start,
          end: word.end,
          text: word.word.trim(),
        };
      } else {
        const potentialDuration = word.end - currentSegment.start;

        if (potentialDuration <= maxSegmentDuration) {
          // Добавить к текущему сегменту
          currentSegment.end = word.end;
          currentSegment.text += ' ' + word.word.trim();
        } else {
          // Сохранить и начать новый
          segments.push(currentSegment);
          currentSegment = {
            start: word.start,
            end: word.end,
            text: word.word.trim(),
          };
        }
      }
    }

    // Добавить последний сегмент
    if (currentSegment) {
      segments.push(currentSegment);
    }
  }

  onProgress?.(100);
  console.log('✅ Generated', segments.length, 'segments');

  return segments;
}
```

### Оптимизация Сегментов

```typescript
// services/whisperService.ts
export function optimizeSubtitleSegments(
  segments: SubtitleSegment[],
  maxDuration: number = 5
): SubtitleSegment[] {
  const optimized: SubtitleSegment[] = [];

  for (const segment of segments) {
    const duration = segment.end - segment.start;

    // Если сегмент короткий - оставить как есть
    if (duration <= maxDuration) {
      optimized.push(segment);
      continue;
    }

    // Разбить длинный сегмент
    const words = segment.text.split(' ');
    const wordsPerSegment = Math.ceil(words.length / Math.ceil(duration / maxDuration));
    const timePerWord = duration / words.length;

    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const start = segment.start + (i * timePerWord);
      const end = Math.min(
        segment.start + ((i + wordsPerSegment) * timePerWord),
        segment.end
      );

      optimized.push({
        start,
        end,
        text: segmentWords.join(' '),
      });
    }
  }

  return optimized;
}
```

---

## 🎥 Remotion Композиция

### Основная Композиция

```tsx
// src/video-reels/Composition.tsx
import React from 'react';
import { OffthreadVideo, AbsoluteFill } from 'remotion';
import { SubtitleLayer } from './SubtitleLayer';

export const VideoReelComposition: React.FC<VideoReelProps> = ({
  videoUrl,
  subtitles,
  styleConfig,
}) => {
  return (
    <AbsoluteFill className="bg-black">
      {/* Видео слой (z-index: 1) */}
      <OffthreadVideo
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Субтитры слой (z-index: 10) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <SubtitleLayer 
          subtitles={subtitles} 
          styleConfig={styleConfig} 
        />
      </div>
    </AbsoluteFill>
  );
};
```

### Subtitle Layer с Karaoke

```tsx
// src/video-reels/SubtitleLayer.tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export const SubtitleLayer: React.FC<SubtitleLayerProps> = ({
  subtitles,
  styleConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Текущее время в секундах
  const currentTime = frame / fps;

  // Найти активный субтитр
  const activeSubtitle = subtitles.find(
    (sub) => currentTime >= sub.start && currentTime <= sub.end
  );

  if (!activeSubtitle) return null;

  // Прогресс субтитра (0 to 1)
  const subtitleDuration = activeSubtitle.end - activeSubtitle.start;
  const subtitleProgress = (currentTime - activeSubtitle.start) / subtitleDuration;

  // Анимация появления
  const scale = interpolate(subtitleProgress * 3, [0, 1], [0.95, 1], {
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(subtitleProgress * 3, [0, 1], [0.9, 1], {
    extrapolateRight: 'clamp',
  });

  // Karaoke: разбить на слова
  const words = activeSubtitle.text.split(' ');
  const activeWordIndex = Math.floor(subtitleProgress * words.length);

  return (
    <div style={{
      position: 'absolute',
      bottom: '150px',
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      paddingLeft: '32px',
      paddingRight: '32px',
      opacity,
      transform: `scale(${scale})`,
    }}>
      <div style={{
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {words.map((word, index) => {
          const isActive = index === activeWordIndex;

          return (
            <span
              key={index}
              style={{
                display: 'inline-block',
                marginRight: '0.3em',
                fontFamily: isActive ? 'Eurostile' : 'Montserrat',
                fontSize: '60px',
                fontWeight: isActive ? 500 : 800,
                fontStyle: isActive ? 'italic' : 'normal',
                textTransform: isActive ? 'none' : 'uppercase',
                color: isActive ? '#DFFF00' : '#FFFFFF',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s ease-out',
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
```

### Remotion Player

```tsx
// src/video-reels/RemotionPreview.tsx
import React, { useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { VideoReelComposition } from './Composition';

export const RemotionPreview: React.FC<RemotionPreviewProps> = ({
  videoUrl,
  subtitles,
  styleConfig,
  durationInFrames,
  fps = 30,
}) => {
  const playerRef = useRef<PlayerRef>(null);

  return (
    <div className="relative">
      <Player
        ref={playerRef}
        component={VideoReelComposition}
        durationInFrames={durationInFrames}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={fps}
        style={{
          width: '100%',
          aspectRatio: '9/16',
        }}
        controls={false}
        inputProps={{
          videoUrl,
          subtitles,
          styleConfig,
        }}
      />
    </div>
  );
};
```

---

## 📦 Экспорт в MP4

### Full Player Capture

```typescript
// utils/fullPlayerCapture.ts
import html2canvas from 'html2canvas';
import type { PlayerRef } from '@remotion/player';

export const capturePlayerToMP4 = async ({
  playerRef,
  durationInSeconds,
  fps = 30,
  onProgress,
}: FullPlayerCaptureOptions): Promise<void> => {
  // 1. Получить контейнер плеера
  const container = playerRef.current.getContainerNode();
  if (!container) throw new Error('Container not found');

  // 2. Создать canvas для записи
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // 3. Настроить MediaRecorder
  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  // 4. Начать запись
  mediaRecorder.start(100);
  onProgress?.(20);

  // 5. Захват кадров
  let frameCount = 0;
  const totalFrames = Math.ceil(durationInSeconds * fps);

  const captureFrame = async () => {
    // Захватить DOM → Canvas
    const snapshot = await html2canvas(container as HTMLElement, {
      backgroundColor: '#000000',
      scale: 1,
      width: 1080,
      height: 1920,
    });

    // Нарисовать на recording canvas
    ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
    frameCount++;

    // Прогресс
    const progress = Math.min(70, 20 + (frameCount / totalFrames) * 50);
    onProgress?.(progress);

    // Следующий кадр
    if (frameCount < totalFrames) {
      setTimeout(captureFrame, 1000 / fps);
    }
  };

  // 6. Запустить плеер и захват
  await playerRef.current.seekTo(0);
  await playerRef.current.play();
  captureFrame();

  // 7. Ждать завершения
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), durationInSeconds * 1000 + 1000);
  });

  // 8. Остановить запись
  await playerRef.current.pause();
  await new Promise<void>((resolve) => {
    mediaRecorder.onstop = () => resolve();
    mediaRecorder.stop();
  });

  onProgress?.(75);

  // 9. Создать WebM blob
  const webmBlob = new Blob(chunks, { type: 'video/webm' });
  console.log('✅ WebM:', (webmBlob.size / 1024 / 1024).toFixed(2), 'MB');

  // 10. Конвертировать в MP4 через FFmpeg
  const { initFFmpeg } = await import('./ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');

  const ffmpeg = await initFFmpeg((p) => {
    const progress = Math.min(95, 80 + Math.round(p * 0.15));
    onProgress?.(progress);
  });

  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
  await ffmpeg.exec(['-i', 'input.webm', '-c', 'copy', 'output.mp4']);

  const mp4Data = await ffmpeg.readFile('output.mp4');
  const mp4Blob = new Blob([mp4Data as Uint8Array], { type: 'video/mp4' });

  console.log('✅ MP4:', (mp4Blob.size / 1024 / 1024).toFixed(2), 'MB');

  // 11. Скачать файл
  const url = URL.createObjectURL(mp4Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reel.mp4';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);

  onProgress?.(100);
  console.log('✅ Export complete!');
};
```

---

## 🚀 Полный Пример

### Компонент VideoReelsCutter

```tsx
// components/VideoReelsCutter.tsx
import React, { useState, useRef } from 'react';
import { PlayerRef } from '@remotion/player';

export const VideoReelsCutter: React.FC = () => {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [processingState, setProcessingState] = useState<VideoProcessingState>({
    status: 'idle',
    progress: 0,
  });
  const playerRef = useRef<PlayerRef>(null);

  // 1. Загрузка видео
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const metadata = await getVideoMetadata(file);
    const url = URL.createObjectURL(file);

    setVideoFile({ file, url, ...metadata });
  };

  // 2. Генерация субтитров
  const handleCreateReel = async () => {
    if (!videoFile) return;

    // Извлечь аудио
    const ffmpeg = await initFFmpeg();
    const audioBlob = await extractAudio(ffmpeg, videoFile.file);

    // Транскрибировать
    const segments = await transcribeAudio(audioBlob, openAIKey);

    // Оптимизировать
    const optimized = optimizeSubtitleSegments(segments);
    setSubtitles(optimized);
  };

  // 3. Экспорт MP4
  const handleDownload = async () => {
    if (!playerRef.current || !videoFile || !subtitles.length) return;

    await capturePlayerToMP4({
      playerRef,
      durationInSeconds: 60,
      fps: 30,
      onProgress: (p) => setProcessingState({ status: 'rendering', progress: p }),
    });
  };

  return (
    <div>
      {/* Upload */}
      <input type="file" accept="video/*" onChange={handleFileUpload} />

      {/* Preview */}
      {videoFile && (
        <RemotionPreview
          ref={playerRef}
          videoUrl={videoFile.url}
          subtitles={subtitles}
          styleConfig={DEFAULT_STYLE}
          durationInFrames={Math.floor(videoFile.duration * 30)}
          fps={30}
        />
      )}

      {/* Actions */}
      <button onClick={handleCreateReel}>Create Reel</button>
      <button onClick={handleDownload}>Download MP4</button>

      {/* Progress */}
      {processingState.status !== 'idle' && (
        <ProcessingProgress {...processingState} />
      )}
    </div>
  );
};
```

---

## 🔧 Конфигурация

### Environment Variables

```env
# .env
VITE_OPENAI_API_KEY=sk-...
```

### Package.json

```json
{
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.10",
    "@ffmpeg/util": "^0.12.1",
    "openai": "^4.28.0",
    "@remotion/player": "^4.0.0",
    "remotion": "^4.0.0",
    "html2canvas": "^1.4.1",
    "react": "^18.2.0",
    "zod": "^3.22.4"
  }
}
```

---

## 📝 TypeScript Types

```typescript
// types/video.ts

export interface VideoFile {
  file: File;
  url: string;
  duration: number;
  width: number;
  height: number;
}

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export interface VideoProcessingState {
  status: 'idle' | 'loading' | 'transcribing' | 'rendering' | 'complete' | 'error';
  progress: number;
  message?: string;
  error?: string;
}

export interface ReelConfig {
  startTime: number;
  duration: number;
  subtitlesEnabled: boolean;
  subtitleStyle: StyleConfig;
}

export interface StyleConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
}
```

---

## 🎯 Best Practices

### 1. Управление Памятью

```typescript
// Очистка Blob URLs
useEffect(() => {
  return () => {
    if (videoFile?.url) {
      URL.revokeObjectURL(videoFile.url);
    }
  };
}, [videoFile]);
```

### 2. Обработка Ошибок

```typescript
try {
  const result = await processVideo();
} catch (error) {
  console.error('❌ Error:', error);
  setProcessingState({
    status: 'error',
    progress: 0,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

### 3. Прогресс Индикация

```typescript
// Нормализация прогресса (0-100)
const normalizedProgress = Math.min(100, Math.max(0, progress));
onProgress?.(normalizedProgress);
```

### 4. Оптимизация FFmpeg

```typescript
// Remux вместо re-encode (быстрее!)
await ffmpeg.exec([
  '-i', 'input.webm',
  '-c', 'copy',  // ✅ Копировать кодек без перекодирования
  'output.mp4'
]);
```

---

**Последнее обновление:** 2026-02-04  
**Версия:** 1.0  
**Статус:** ✅ Готово к использованию
