# 🔍 АУДИТ ПРОЕКТА: VIDEO REELS MODULE
**Дата:** 2026-01-30  
**Статус:** КРИТИЧЕСКИЕ ПРОБЛЕМЫ ОБНАРУЖЕНЫ

---

## 1️⃣ FILTER CHAIN ANALYSIS

### 📍 Местоположение: `utils/ffmpeg.ts:328-365`

### Финальная команда FFmpeg

Функция `processCompleteReel()` выполняет **3 последовательных этапа**:

#### **Этап 1: Trimming (Обрезка)**
```bash
ffmpeg -i input.mp4 -ss {startTime} -t {duration} -c copy trimmed.mp4
```
- **Строка 149-155** в `utils/ffmpeg.ts`
- Использует stream copy (`-c copy`) — **БЕЗ перекодирования**
- ⚠️ **ПРОБЛЕМА**: Stream copy может создавать артефакты при неточных keyframe boundaries

#### **Этап 2: Cropping (Кадрирование 9:16)**
```bash
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih" -c:a copy cropped.mp4
```
- **Строка 185-190** в `utils/ffmpeg.ts`
- Применяет видеофильтр для вертикального формата
- Копирует аудио без изменений

#### **Этап 3: Subtitle Rendering (Наложение субтитров)**
```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='TEXT':fontsize=40:fontcolor=0xFFFFFF:borderw=2:bordercolor=0x000000:x=(w-text_w)/2:y=h-80:enable='between(t,START,END)',..." \
  -c:v libx264 -preset superfast -crf 23 -c:a copy \
  -max_muxing_queue_size 1024 -y subtitled.mp4
```
- **Строка 250-260** в `utils/ffmpeg.ts`
- **КРИТИЧНО**: Использует `drawtext` фильтр (НЕ subtitles filter)
- Цепочка фильтров строится динамически для каждого сегмента субтитров

---

### 🔴 ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ

#### **Проблема #1: Артефакты при Trimming**
```typescript
// Строка 149-155 (utils/ffmpeg.ts)
await ffmpeg.exec([
    '-i', inputName,
    '-ss', startTime.toString(),
    '-t', duration.toString(),
    '-c', 'copy',  // ❌ ПРОБЛЕМА: Stream copy без re-encoding
    outputName
]);
```

**Причина замирания кадра:**
- `-c copy` копирует видеопоток без перекодирования
- Если `startTime` не попадает на keyframe, возникают артефакты
- Решение: добавить `-avoid_negative_ts make_zero` и использовать re-encoding

**Рекомендация:**
```bash
-ss {startTime} -i input.mp4 -t {duration} -c:v libx264 -preset ultrafast -crf 18 -c:a copy
```

#### **Проблема #2: Отсутствие субтитров**
```typescript
// Строка 234-245 (utils/ffmpeg.ts)
const drawtextFilters = subtitles.map((sub) => {
    const escapedText = sub.text
        .replace(/\\/g, '\\\\\\\\')  // ❌ ПРОБЛЕМА: Избыточное экранирование
        .replace(/'/g, "'\\\\''")
        .replace(/:/g, '\\\\:')
        .replace(/\n/g, ' ');
    
    return `drawtext=text='${escapedText}':fontsize=${style.fontSize}:...`;
});
```

**Причины отсутствия субтитров:**
1. **Избыточное экранирование** специальных символов
2. **Отсутствие шрифта** в виртуальной ФС FFmpeg WASM
3. **Неправильный формат времени** в `enable='between(t,START,END)'`

---

## 2️⃣ RESOURCE MAPPING

### 📂 Виртуальная файловая система FFmpeg

#### **Текущее состояние:**
```typescript
// utils/ffmpeg.ts:230
await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
```

**❌ КРИТИЧЕСКАЯ ПРОБЛЕМА:**
- **Файл шрифта НЕ записывается** в виртуальную ФС
- **Файл субтитров НЕ записывается** (используется drawtext вместо subtitles filter)

#### **Что ДОЛЖНО быть:**
```typescript
// 1. Загрузка шрифта
const fontResponse = await fetch('/fonts/Inter-Bold.ttf');
const fontData = await fontResponse.arrayBuffer();
await ffmpeg.writeFile('Inter-Bold.ttf', new Uint8Array(fontData));

// 2. Создание SRT файла
const srtContent = generateSRT(subtitles);
await ffmpeg.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));

// 3. Использование subtitles filter
-vf "subtitles=subtitles.srt:force_style='FontName=Inter-Bold,FontSize=40'"
```

### 📍 Инициализация ресурсов

**Местоположение:** `utils/ffmpeg.ts:9-65`

```typescript
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    // Загружается ТОЛЬКО FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    
    await ffmpeg.load({ coreURL, wasmURL });
    
    // ❌ ОТСУТСТВУЕТ: Загрузка шрифтов
    // ❌ ОТСУТСТВУЕТ: Инициализация директорий для субтитров
}
```

---

## 3️⃣ DEPENDENCY CHECK

### 📦 Установленные версии

```json
{
  "@ffmpeg/ffmpeg": "^0.12.15",  // ✅ Последняя стабильная
  "@ffmpeg/util": "^0.12.2",     // ✅ Совместимая версия
  "@ffmpeg/core": "0.12.6"       // ⚠️ Загружается динамически из unpkg
}
```

### 🔍 Проверка совместимости

| Пакет | Установлено | Рекомендуется | Статус |
|-------|-------------|---------------|--------|
| `@ffmpeg/ffmpeg` | 0.12.15 | 0.12.15 | ✅ OK |
| `@ffmpeg/util` | 0.12.2 | 0.12.2 | ✅ OK |
| `@ffmpeg/core` | 0.12.6 (CDN) | 0.12.6 | ⚠️ Зависит от unpkg.com |

**⚠️ РИСК:**
- Core загружается с внешнего CDN (`unpkg.com`)
- При недоступности CDN приложение не работает
- **Рекомендация:** Использовать локальную копию core файлов

---

## 4️⃣ ERROR HANDLING

### 🐛 Проблема: "Aborted()" показывает "Complete! 100%"

#### **Местоположение:** `components/VideoReelsCutter.tsx:152-207`

```typescript
const handleRenderReel = useCallback(async () => {
    try {
        setProcessingState({ status: 'loading', progress: 0, message: 'Initializing...' });
        
        const output = await processCompleteReel(...);
        
        setOutputVideo(output);
        setProcessingState({ status: 'complete', progress: 100, message: 'Reel ready!' });
        // ❌ ПРОБЛЕМА: Всегда показывает success, даже если FFmpeg упал
        
    } catch (error) {
        setProcessingState({
            status: 'error',
            progress: 0,
            error: error instanceof Error ? error.message : 'Failed to render reel',
        });
    }
}, [videoFile, reelConfig, subtitles, outputVideoUrl]);
```

### 🔴 Корневая причина

**FFmpeg WASM не выбрасывает исключение при `Aborted()`**

```typescript
// utils/ffmpeg.ts:250-260
await ffmpeg.exec([...]);  // ❌ НЕ выбрасывает Error при Aborted()

const data = await ffmpeg.readFile(outputName);  // ✅ Возвращает пустой файл
```

### ✅ Решение

```typescript
// Добавить проверку размера выходного файла
const data = await ffmpeg.readFile(outputName);

if (data.length === 0) {
    throw new Error('FFmpeg processing failed: output file is empty');
}

// Или проверить логи FFmpeg
let hasError = false;
ffmpeg.on('log', ({ type, message }) => {
    if (type === 'fferr' && message.includes('Aborted')) {
        hasError = true;
    }
});
```

---

## 5️⃣ WORDPRESS API REQUESTS

### 🔍 Поиск запросов в Video Reels модуле

**Результат:** ✅ **НЕ ОБНАРУЖЕНО**

```bash
# Проверка VideoReelsCutter.tsx
grep -i "wordpress" components/VideoReelsCutter.tsx
# Результат: No results found

# Проверка всех компонентов видео
grep -r "wp-json" components/video/
# Результат: No results found
```

### 📊 Где ЕСТЬ WordPress API запросы

```typescript
// services/wpService.ts
const baseUrl = getBaseUrl(project.url);
const endpoint = baseUrl.startsWith('/wp-json/')
    ? project.endpoint.replace('/wp-json', '')
    : project.endpoint;
```

**Используется в:**
- ✅ `components/ReviewsArchive.tsx` (Telegram архив)
- ✅ `components/ReviewsTable.tsx` (Таблица отзывов)
- ✅ `components/CoverLab.tsx` (Генерация обложек)
- ❌ **НЕ используется** в `components/VideoReelsCutter.tsx`

### 🎯 Вывод

**Video Reels модуль полностью изолирован от WordPress API** ✅

Все запросы к WordPress происходят только в модулях управления отзывами, что является **правильной архитектурой**.

---

## 📋 ИТОГОВЫЕ РЕКОМЕНДАЦИИ

### 🔴 Критичные исправления

1. **Исправить Trimming артефакты:**
   ```typescript
   // Заменить stream copy на re-encoding
   await ffmpeg.exec([
       '-ss', startTime.toString(),
       '-i', inputName,
       '-t', duration.toString(),
       '-c:v', 'libx264',
       '-preset', 'ultrafast',
       '-crf', '18',
       '-avoid_negative_ts', 'make_zero',
       '-c:a', 'copy',
       outputName
   ]);
   ```

2. **Добавить шрифт в виртуальную ФС:**
   ```typescript
   const fontData = await fetch('/fonts/Inter-Bold.ttf').then(r => r.arrayBuffer());
   await ffmpeg.writeFile('/tmp/Inter-Bold.ttf', new Uint8Array(fontData));
   ```

3. **Переключиться на subtitles filter:**
   ```typescript
   const srtContent = generateSRT(subtitles);
   await ffmpeg.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));
   
   await ffmpeg.exec([
       '-i', inputName,
       '-vf', `subtitles=subtitles.srt:force_style='FontName=Inter-Bold,FontSize=${fontSize}'`,
       '-c:v', 'libx264',
       '-preset', 'medium',
       '-crf', '23',
       outputName
   ]);
   ```

4. **Добавить валидацию выходного файла:**
   ```typescript
   const data = await ffmpeg.readFile(outputName);
   
   if (data.length < 1000) {  // Минимальный размер видео
       throw new Error('FFmpeg failed: output file is too small or empty');
   }
   ```

### ⚠️ Средний приоритет

- Локализовать `@ffmpeg/core` файлы (не зависеть от unpkg.com)
- Добавить детальное логирование FFmpeg процесса
- Реализовать retry механизм для failed операций

### ✅ Подтверждено корректно

- WordPress API запросы отсутствуют в Video Reels модуле
- Версии зависимостей совместимы
- Архитектура модуля изолирована

---

**Подготовлено для передачи на аудит**  
*Все критичные проблемы задокументированы с примерами кода*
