# Cover Lab Typography & Layout Update

## Дата: 2026-01-22

## Обзор изменений

Обновление модуля Cover Lab с точной типографикой из Figma, интерактивными контролами и правильной стилизацией.

---

## 1. Типографика (Typography)

### Подключенные шрифты

**Файл:** `/public/fonts/cover-fonts.css`

```css
/* TT Lakes Neue - Italic */
@font-face {
  font-family: 'TT Lakes Neue';
  src: url('https://fonts.cdnfonts.com/s/29829/TTLakesNeue-Italic.woff') format('woff');
  font-weight: 400;
  font-style: italic;
}

/* Sudo Var - Monospace */
@font-face {
  font-family: 'Sudo Var';
  src: url('https://fonts.cdnfonts.com/s/96862/SudoVar-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
}
```

### Main Title (TT Lakes Neue)

**Stories:**
```css
font-family: 'TT Lakes Neue', sans-serif;
font-style: italic;
font-weight: 400;
font-size: 115px;
line-height: 100%;
text-align: center;
text-transform: uppercase;
color: #FFFFFF;
text-shadow: 0px 5.1px 0px #BA0C2F;
```

**Desktop:**
```css
font-size: 140px;
text-shadow: 0px 5.08px 0px #BA0C2F;
```

### Subtitle (Sudo Var)

```css
font-family: 'Sudo Var', monospace;
font-size: 42px;
color: #FFFFFF;
```

**Контейнер подзаголовка:**
```css
background: #BA0C2F;
border-radius: 22.11px;
box-shadow: 
  inset 0px 4.42px 8.07px #FF0033,
  inset 0px -11.05px 10.5px rgba(0, 0, 0, 0.25);
padding: 20px 40px;
```

---

## 2. Flexbox Layout (Flow Layout)

### Вместо `position: absolute`

**Старый подход:**
```tsx
<div className="absolute top-0 left-0 right-0 p-16">
  <h1>Title</h1>
</div>
<div className="absolute bottom-32 left-16 right-16">
  <div>Subtitle</div>
</div>
```

**Новый подход:**
```tsx
<div className="absolute inset-0 flex flex-col justify-end items-center">
  {/* Subtitle */}
  <div style={{ marginBottom: subtitleBottom }}>...</div>
  
  {/* Title */}
  <div style={{ marginTop: titleSpacing }}>...</div>
</div>
```

### Stories Layout

```tsx
<div
  className="absolute inset-0 flex flex-col justify-end items-center"
  style={{ paddingBottom: `${data.subtitleBottom}px` }}
>
  {/* Subtitle Box */}
  <div className="cover-subtitle" style={{ ... }}>
    <p>{data.description}</p>
    <svg>...</svg>
  </div>

  {/* Title */}
  <div
    className="cover-title"
    style={{ marginTop: `${data.titleSpacing}px` }}
  >
    <h1>{data.title}</h1>
  </div>
</div>
```

**Параметры:**
- `subtitleBottom`: **190px** (default)
- `titleSpacing`: **130px** (default)

### Desktop Layout

```tsx
<div
  className="absolute inset-0 flex flex-col justify-end items-center"
  style={{ paddingBottom: '150px' }}
>
  {/* Title Only */}
  <div className="cover-title">
    <h1>{data.title}</h1>
  </div>
</div>
```

**Параметры:**
- Bottom spacing: **150px** (fixed)

---

## 3. Интерактивные контролы (Interactive Controls)

### Добавленные слайдеры

```tsx
interface CoverData {
  title: string;
  description: string;
  image: string | null;
  accentColor: string;
  subtitleBottom: number;  // NEW
  titleSpacing: number;    // NEW
}
```

### Subtitle Bottom Spacing

**Диапазон:** 50–400px  
**Default:** 190px

```tsx
<input
  type="range"
  min="50"
  max="400"
  value={coverData.subtitleBottom}
  onChange={(e) => setCoverData(prev => ({ 
    ...prev, 
    subtitleBottom: parseInt(e.target.value) 
  }))}
  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
/>
```

### Title Spacing

**Диапазон:** 50–300px  
**Default:** 130px

```tsx
<input
  type="range"
  min="50"
  max="300"
  value={coverData.titleSpacing}
  onChange={(e) => setCoverData(prev => ({ 
    ...prev, 
    titleSpacing: parseInt(e.target.value) 
  }))}
  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#BA0C2F]"
/>
```

### UI панели контролов

```tsx
<div className="pt-4 border-t border-slate-200">
  <h3 className="text-sm font-bold text-slate-700 mb-4">Layout Controls</h3>
  
  <div className="mb-4">
    <label className="block text-xs font-medium text-slate-600 mb-2">
      Subtitle Bottom Spacing: {coverData.subtitleBottom}px
    </label>
    <input type="range" ... />
  </div>

  <div>
    <label className="block text-xs font-medium text-slate-600 mb-2">
      Title Spacing: {coverData.titleSpacing}px
    </label>
    <input type="range" ... />
  </div>
</div>
```

---

## 4. Динамический градиент и цвета

### Акцентный цвет #BA0C2F

**Применяется в:**
- ✅ Text shadow заголовка
- ✅ Фон подзаголовка
- ✅ Кнопки Download
- ✅ Слайдеры (accent color)
- ✅ Индикатор цвета

### ColorThief интеграция

```tsx
const extractColor = useCallback(async (imageUrl: string) => {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      const colorThief = new ColorThief();
      try {
        const color = colorThief.getColor(img);
        const hexColor = `#${color.map((c: number) => 
          c.toString(16).padStart(2, '0')
        ).join('')}`;
        resolve(hexColor);
      } catch (error) {
        resolve('#BA0C2F'); // Fallback
      }
    };
  });
}, []);
```

### Градиент обложки

**Stories & Desktop:**
```tsx
<div
  className="absolute inset-0"
  style={{
    background: `linear-gradient(
      to bottom, 
      rgba(0,0,0,0) 0%, 
      rgba(0,0,0,0) 50%, 
      ${data.accentColor}dd 100%
    )`
  }}
/>
```

**Особенности:**
- Прозрачный верх (0%)
- Прозрачная середина (50%)
- Акцентный цвет внизу (100%) с opacity `dd` (~87%)

---

## 5. Экспорт в высоком разрешении

### html-to-image настройки

```tsx
const handleDownload = useCallback(async (
  ref: React.RefObject<HTMLDivElement>, 
  filename: string
) => {
  if (!ref.current) return;

  try {
    setIsProcessing(true);
    const dataUrl = await toPng(ref.current, {
      quality: 1.0,        // Максимальное качество
      pixelRatio: 2,       // Retina (2x)
      cacheBust: true      // Предотвращает кэширование
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to generate image. Please try again.');
  } finally {
    setIsProcessing(false);
  }
}, []);
```

**Параметры:**
- `quality: 1.0` - PNG без потерь
- `pixelRatio: 2` - Двойное разрешение для чёткости
- `cacheBust: true` - Всегда свежий рендер

**Результат:**
- Instagram Story: **2160 × 3840 px** (1080 × 1920 × 2)
- Desktop Cover: **3840 × 2160 px** (1920 × 1080 × 2)

---

## 6. Изменения в UI

### Обновлённые кнопки Download

**Было:**
```tsx
className="bg-indigo-600 hover:bg-indigo-700"
```

**Стало:**
```tsx
className="bg-[#BA0C2F] hover:bg-[#9A0A26]"
```

### Новая иконка в заголовке

```tsx
<h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
  <Sliders className="w-5 h-5" />
  Cover Settings
</h2>
```

### Accent для слайдеров

```css
accent-[#BA0C2F]
```

Tailwind CSS автоматически применяет цвет к:
- Thumb (ползунок)
- Track (активная часть)

---

## 7. Структура данных

### До обновления

```typescript
interface CoverData {
  title: string;
  description: string;
  image: string | null;
  accentColor: string;
}
```

### После обновления

```typescript
interface CoverData {
  title: string;
  description: string;
  image: string | null;
  accentColor: string;
  subtitleBottom: number;  // 50-400px
  titleSpacing: number;    // 50-300px
}
```

### Default значения

```typescript
const [coverData, setCoverData] = useState<CoverData>({
  title: 'НАВИГАЦИЯ - ПОСТОЯННЫЙ КОНТРОЛЬ',
  description: '3-й помощник капитана Leo о работе на контейнеровозе',
  image: null,
  accentColor: '#BA0C2F',
  subtitleBottom: 190,
  titleSpacing: 130
});
```

---

## 8. Загрузка шрифтов

### useEffect для динамической загрузки

```tsx
useEffect(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/fonts/cover-fonts.css';
  document.head.appendChild(link);

  return () => {
    document.head.removeChild(link);
  };
}, []);
```

**Преимущества:**
- Шрифты загружаются только при открытии Cover Lab
- Cleanup при размонтировании компонента
- Не влияет на остальное приложение

---

## 9. Файлы изменений

- ✅ `/components/CoverLab.tsx` - полная перезапись (467 строк)
- ✅ `/public/fonts/cover-fonts.css` - новый файл с @font-face
- ✅ `package.json` - без изменений (зависимости уже установлены)

---

## 10. Тестирование

### Проверенная функциональность

✅ **Шрифты:**
- TT Lakes Neue загружается корректно
- Sudo Var загружается корректно
- Fallback на системные шрифты работает

✅ **Слайдеры:**
- Subtitle Bottom Spacing: 50-400px
- Title Spacing: 50-300px
- Live preview обновляется при изменении

✅ **Цвета:**
- Акцентный цвет #BA0C2F применяется везде
- ColorThief извлекает цвет из фото
- Градиент использует извлечённый цвет

✅ **Экспорт:**
- PNG генерируется в 2x разрешении
- Шрифты и тени сохраняются
- Качество высокое

---

## 11. Следующие шаги

### Рекомендации для улучшения

1. **Локальные шрифты** - скачать WOFF файлы в `/public/fonts/`
2. **Больше шаблонов** - Facebook, LinkedIn, Twitter
3. **Preset layouts** - сохранённые комбинации spacing
4. **Undo/Redo** - история изменений
5. **Batch export** - экспорт всех форматов сразу

---

## 12. Производительность

### Оптимизации

- ✅ Шрифты загружаются асинхронно
- ✅ ColorThief вызывается только при загрузке фото
- ✅ Слайдеры используют controlled components
- ✅ Refs для DOM элементов (избегаем ре-рендеров)

### Размер

- TT Lakes Neue WOFF: ~50KB
- Sudo Var WOFF: ~40KB
- **Итого:** ~90KB дополнительно

---

## Итоговый результат

✅ **Типографика** - точное соответствие Figma  
✅ **Layout** - Flexbox вместо absolute positioning  
✅ **Контролы** - интерактивные слайдеры для spacing  
✅ **Цвета** - #BA0C2F акцент + динамический градиент  
✅ **Экспорт** - 2x resolution для чёткости  

Модуль Cover Lab полностью готов к использованию! 🎨
