# 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ: FFMPEG FILTER CHAIN

## 📊 Текущая архитектура обработки

```
┌─────────────────────────────────────────────────────────────────┐
│                    processCompleteReel()                         │
│                  (utils/ffmpeg.ts:328-365)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │         ЭТАП 1: TRIMMING                    │
        │  ffmpeg -i input.mp4 -ss START -t DUR       │
        │         -c copy trimmed.mp4                 │
        │                                             │
        │  ❌ ПРОБЛЕМА: Stream copy артефакты         │
        └─────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │         ЭТАП 2: CROPPING                    │
        │  ffmpeg -i trimmed.mp4                      │
        │         -vf "crop=ih*9/16:ih"               │
        │         -c:a copy cropped.mp4               │
        │                                             │
        │  ✅ Работает корректно                      │
        └─────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │    ЭТАП 3: SUBTITLE RENDERING               │
        │  ffmpeg -i cropped.mp4                      │
        │         -vf "drawtext=..."                  │
        │         -c:v libx264 subtitled.mp4          │
        │                                             │
        │  ❌ ПРОБЛЕМА: Субтитры не отображаются      │
        └─────────────────────────────────────────────┘
```

---

## 🔍 ДЕТАЛЬНЫЙ АНАЛИЗ ПРОБЛЕМ

### Проблема #1: Артефакты при Trimming

#### Текущий код (строки 135-167):
```typescript
export async function trimVideo(
    ffmpeg: FFmpeg,
    inputFile: File,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'trimmed.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    // ❌ ПРОБЛЕМА: -c copy без re-encoding
    await ffmpeg.exec([
        '-i', inputName,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy',  // Stream copy
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'video/mp4' });
}
```

#### Почему возникают артефакты:

1. **Keyframe alignment:**
   - `-ss` перемещает позицию в видео
   - Если `startTime` не совпадает с keyframe, видео начинается с P-frame
   - P-frames зависят от предыдущих I-frames → замирание кадра

2. **Stream copy limitations:**
   - `-c copy` не перекодирует видео
   - Не может "починить" битые frame dependencies
   - Быстро, но ненадежно для точной обрезки

#### ✅ Исправленная версия:
```typescript
export async function trimVideo(
    ffmpeg: FFmpeg,
    inputFile: File,
    startTime: number,
    duration: number,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'trimmed.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

    // ✅ РЕШЕНИЕ: Re-encode с точным позиционированием
    await ffmpeg.exec([
        '-ss', startTime.toString(),  // Seek BEFORE input (faster)
        '-i', inputName,
        '-t', duration.toString(),
        '-c:v', 'libx264',           // Re-encode video
        '-preset', 'ultrafast',      // Быстрое кодирование
        '-crf', '18',                // Высокое качество
        '-avoid_negative_ts', 'make_zero',  // Исправить timestamps
        '-c:a', 'copy',              // Копировать аудио
        '-y',
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    // ✅ Валидация выходного файла
    if (data.length < 1000) {
        throw new Error('Trimming failed: output file is empty or corrupted');
    }

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
    return new Blob([uint8Data], { type: 'video/mp4' });
}
```

---

### Проблема #2: Отсутствие субтитров

#### Текущий код (строки 234-260):
```typescript
// Build drawtext filter chain
const drawtextFilters = subtitles.map((sub) => {
    const escapedText = sub.text
        .replace(/\\/g, '\\\\\\\\')      // ❌ Избыточное экранирование
        .replace(/'/g, "'\\\\''")
        .replace(/:/g, '\\\\:')
        .replace(/\n/g, ' ');

    const textColor = style.color.replace('#', '0x');
    const borderColor = style.strokeColor.replace('#', '0x');

    return `drawtext=text='${escapedText}':fontsize=${style.fontSize}:fontcolor=${textColor}:borderw=${style.strokeWidth}:bordercolor=${borderColor}:x=(w-text_w)/2:y=h-${style.fontSize * 2}:enable='between(t,${sub.start},${sub.end})'`;
});

const videoFilter = drawtextFilters.join(',');

await ffmpeg.exec([
    '-i', inputName,
    '-vf', videoFilter,
    '-c:v', 'libx264',
    '-preset', 'superfast',
    '-crf', '23',
    '-c:a', 'copy',
    '-max_muxing_queue_size', '1024',
    '-y',
    outputName
]);
```

#### Проблемы:

1. **Отсутствие шрифта:**
   - `drawtext` требует системный шрифт
   - FFmpeg WASM не имеет доступа к системным шрифтам
   - Нужно загрузить шрифт в виртуальную ФС

2. **Избыточное экранирование:**
   - Множественные backslashes ломают текст
   - Специальные символы экранируются неправильно

3. **Неэффективная фильтрация:**
   - Каждый subtitle segment = отдельный drawtext фильтр
   - Для 50+ сегментов = огромная filter chain
   - Лучше использовать `subtitles` filter с SRT файлом

#### ✅ Исправленная версия:

```typescript
export async function addSubtitlesToVideo(
    ffmpeg: FFmpeg,
    inputFile: Blob,
    subtitles: Array<{ start: number; end: number; text: string }>,
    style: {
        fontFamily: string;
        fontSize: number;
        color: string;
        strokeColor: string;
        strokeWidth: number;
    },
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'subtitled.mp4';
    const srtName = 'subtitles.srt';
    const fontName = 'Inter-Bold.ttf';

    console.log('🎬 [Subtitles] Starting hardburn...');

    if (subtitles.length === 0) {
        console.log('⚠️ [Subtitles] No subtitles, returning input');
        return inputFile;
    }

    try {
        // 1. Загрузить шрифт в виртуальную ФС
        console.log('📥 [Subtitles] Loading font...');
        const fontResponse = await fetch(`/fonts/${fontName}`);
        if (!fontResponse.ok) {
            throw new Error(`Font not found: ${fontName}`);
        }
        const fontData = await fontResponse.arrayBuffer();
        await ffmpeg.writeFile(fontName, new Uint8Array(fontData));
        console.log('✅ [Subtitles] Font loaded:', fontName);

        // 2. Создать SRT файл
        console.log('📝 [Subtitles] Generating SRT...');
        const srtContent = generateSRT(subtitles);
        await ffmpeg.writeFile(srtName, new TextEncoder().encode(srtContent));
        console.log('✅ [Subtitles] SRT created:', subtitles.length, 'segments');

        // 3. Записать входное видео
        await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
        console.log('✅ [Subtitles] Input written');

        // 4. Применить subtitles filter
        const fontColor = style.color.replace('#', '&H') + '&';
        const outlineColor = style.strokeColor.replace('#', '&H') + '&';
        
        const forceStyle = [
            `FontName=${style.fontFamily}`,
            `FontSize=${style.fontSize}`,
            `PrimaryColour=${fontColor}`,
            `OutlineColour=${outlineColor}`,
            `Outline=${style.strokeWidth}`,
            `Alignment=2`,  // Bottom center
            `MarginV=60`    // 60px from bottom
        ].join(',');

        console.log('🎨 [Subtitles] Applying filter...');
        await ffmpeg.exec([
            '-i', inputName,
            '-vf', `subtitles=${srtName}:fontsdir=.:force_style='${forceStyle}'`,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'copy',
            '-max_muxing_queue_size', '1024',
            '-y',
            outputName
        ]);

        console.log('✅ [Subtitles] FFmpeg completed');

        // 5. Прочитать результат
        const data = await ffmpeg.readFile(outputName);
        
        // ✅ Валидация
        if (data.length < 1000) {
            throw new Error('Subtitle rendering failed: output file is empty');
        }
        
        console.log('📦 [Subtitles] Output:', (data.length / 1024 / 1024).toFixed(2), 'MB');

        // 6. Очистка
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
        await ffmpeg.deleteFile(srtName);
        await ffmpeg.deleteFile(fontName);

        const uint8Data = data instanceof Uint8Array ? new Uint8Array(data) : data;
        return new Blob([uint8Data], { type: 'video/mp4' });
        
    } catch (error) {
        console.error('❌ [Subtitles] Error:', error);
        
        // Cleanup on error
        try {
            await ffmpeg.deleteFile(inputName).catch(() => {});
            await ffmpeg.deleteFile(outputName).catch(() => {});
            await ffmpeg.deleteFile(srtName).catch(() => {});
            await ffmpeg.deleteFile(fontName).catch(() => {});
        } catch {}
        
        throw error;
    }
}
```

---

## 📂 RESOURCE MAPPING: Виртуальная ФС

### Текущее состояние:
```
/
├── input.mp4         (записывается)
├── trimmed.mp4       (создается FFmpeg)
├── cropped.mp4       (создается FFmpeg)
└── subtitled.mp4     (создается FFmpeg)

❌ ОТСУТСТВУЮТ:
   - Файлы шрифтов (.ttf)
   - Файлы субтитров (.srt)
```

### Исправленная структура:
```
/
├── input.mp4         (входное видео)
├── trimmed.mp4       (после обрезки)
├── cropped.mp4       (после кадрирования)
├── subtitled.mp4     (финальное видео)
├── subtitles.srt     (SRT субтитры)
└── Inter-Bold.ttf    (шрифт для субтитров)
```

### Код инициализации ресурсов:

```typescript
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    console.log('🎬 [FFmpeg Init] Starting initialization...');

    if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error('SharedArrayBuffer is not available. COOP/COEP headers may be missing.');
    }

    if (ffmpegInstance && ffmpegInstance.loaded) {
        console.log('✅ [FFmpeg Init] Using cached instance');
        return ffmpegInstance;
    }

    const ffmpeg = new FFmpeg();

    // Логирование
    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
        console.log(`[FFmpeg Progress] ${Math.round(progress * 100)}%`);
        if (onProgress) {
            onProgress(Math.round(progress * 100));
        }
    });

    // Загрузка FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

    await ffmpeg.load({ coreURL, wasmURL });

    // ✅ НОВОЕ: Предзагрузка шрифтов
    console.log('📥 [FFmpeg Init] Preloading fonts...');
    try {
        const fontResponse = await fetch('/fonts/Inter-Bold.ttf');
        if (fontResponse.ok) {
            const fontData = await fontResponse.arrayBuffer();
            await ffmpeg.writeFile('Inter-Bold.ttf', new Uint8Array(fontData));
            console.log('✅ [FFmpeg Init] Font preloaded: Inter-Bold.ttf');
        }
    } catch (error) {
        console.warn('⚠️ [FFmpeg Init] Font preload failed:', error);
    }

    ffmpegInstance = ffmpeg;
    console.log('🎉 [FFmpeg Init] Initialization complete!');
    return ffmpeg;
}
```

---

## 🐛 ERROR HANDLING: Детальная диагностика

### Проблема: Aborted() не выбрасывает исключение

```typescript
// Текущий код (НЕ работает):
try {
    await ffmpeg.exec([...]);
    const data = await ffmpeg.readFile(outputName);
    // ❌ data может быть пустым, но ошибки нет
} catch (error) {
    // ❌ Сюда не попадаем при Aborted()
}
```

### ✅ Решение: Мониторинг логов FFmpeg

```typescript
export async function processCompleteReel(
    inputFile: File,
    startTime: number,
    duration: number,
    subtitles: Array<{ start: number; end: number; text: string }>,
    style: SubtitleStyle,
    onProgress?: (stage: string, progress: number) => void
): Promise<Blob> {
    const ffmpeg = await initFFmpeg((p) => onProgress?.('init', p));

    // ✅ Отслеживание ошибок FFmpeg
    let ffmpegError: string | null = null;
    
    const errorListener = ({ type, message }: { type: string; message: string }) => {
        if (type === 'fferr') {
            console.error('[FFmpeg Error]', message);
            
            if (message.includes('Aborted') || 
                message.includes('Error') || 
                message.includes('failed')) {
                ffmpegError = message;
            }
        }
    };
    
    ffmpeg.on('log', errorListener);

    try {
        // Step 1: Trim
        onProgress?.('trimming', 0);
        const trimmed = await trimVideo(ffmpeg, inputFile, startTime, duration);
        
        if (ffmpegError) {
            throw new Error(`Trimming failed: ${ffmpegError}`);
        }

        // Step 2: Crop
        onProgress?.('cropping', 0);
        const cropped = await cropToVertical(ffmpeg, trimmed);
        
        if (ffmpegError) {
            throw new Error(`Cropping failed: ${ffmpegError}`);
        }

        // Step 3: Subtitles
        if (subtitles.length > 0) {
            onProgress?.('rendering', 0);
            const result = await addSubtitlesToVideo(ffmpeg, cropped, subtitles, style);
            
            if (ffmpegError) {
                throw new Error(`Subtitle rendering failed: ${ffmpegError}`);
            }
            
            return result;
        }

        return cropped;
        
    } finally {
        // ✅ Очистка listener
        ffmpeg.off('log', errorListener);
    }
}
```

---

## 📊 DEPENDENCY VERSIONS

### Текущие версии:
```json
{
  "@ffmpeg/ffmpeg": "^0.12.15",
  "@ffmpeg/util": "^0.12.2"
}
```

### FFmpeg Core (динамическая загрузка):
```typescript
const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
```

### ⚠️ Проблема: Зависимость от CDN

**Риски:**
- unpkg.com может быть недоступен
- Версия может измениться без предупреждения
- Медленная загрузка в некоторых регионах

### ✅ Решение: Локальные файлы

1. **Скачать core файлы:**
```bash
mkdir -p public/ffmpeg-core
cd public/ffmpeg-core
curl -O https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js
curl -O https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm
curl -O https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js
```

2. **Изменить инициализацию:**
```typescript
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    const ffmpeg = new FFmpeg();

    // ✅ Использовать локальные файлы
    const baseURL = '/ffmpeg-core';
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

    await ffmpeg.load({ coreURL, wasmURL });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
}
```

---

## 🎯 ЧЕКЛИСТ ИСПРАВЛЕНИЙ

### Критичные (блокируют работу):
- [ ] Исправить trimming артефакты (заменить `-c copy` на re-encoding)
- [ ] Добавить шрифт в виртуальную ФС
- [ ] Переключиться с `drawtext` на `subtitles` filter
- [ ] Добавить валидацию выходных файлов

### Важные (улучшают надежность):
- [ ] Реализовать мониторинг FFmpeg ошибок
- [ ] Локализовать FFmpeg core файлы
- [ ] Добавить retry механизм
- [ ] Улучшить логирование процесса

### Опциональные (оптимизация):
- [ ] Кэшировать шрифты между вызовами
- [ ] Оптимизировать preset для баланса скорость/качество
- [ ] Добавить прогресс-бар для каждого этапа

---

**Документ готов для технического аудита**
