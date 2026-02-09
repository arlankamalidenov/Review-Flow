# Cover Generator Module - Implementation Guide

## Дата: 2026-01-22

## Обзор

Модуль **Cover Lab** - это встроенный инструмент для создания обложек для социальных сетей с автоматическим извлечением акцентного цвета из изображения.

## Реализованная функциональность

### 1. Интеграция в Sidebar

**Файл:** `/components/Sidebar.tsx`

- ✅ Добавлена иконка `Sparkles` из lucide-react
- ✅ Пункт меню "Cover Lab" доступен для всех проектов
- ✅ Расположен после пункта "Archive (TG)"

```typescript
menuItems.push({ id: 'cover-lab', label: 'Cover Lab', icon: Sparkles, count: undefined });
```

### 2. Основной компонент CoverLab

**Файл:** `/components/CoverLab.tsx`

#### Функциональность:

**Загрузка изображения:**
- Input type="file" с accept="image/*"
- FileReader API для чтения файла
- Автоматическое извлечение цвета при загрузке

**Извлечение акцентного цвета:**
```typescript
const extractColor = async (imageUrl: string) => {
  const colorThief = new ColorThief();
  const color = colorThief.getColor(img);
  const hexColor = `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`;
};
```

**Состояние данных:**
```typescript
interface CoverData {
  title: string;
  description: string;
  image: string | null;
  accentColor: string;
}
```

### 3. Шаблоны превью

#### Instagram Story Template (1080×1920px)

**Особенности:**
- Вертикальный формат
- Фоновое изображение с object-cover
- Градиентный оверлей от прозрачного к акцентному цвету
- Крупный заголовок с обводкой акцентным цветом
- Красный блок с описанием внизу
- Иконка стрелки в блоке описания

**Масштабирование:**
```css
transform: scale(0.25);
transform-origin: top left;
```

#### Desktop Cover Template (1920×1080px)

**Особенности:**
- Горизонтальный формат
- Аналогичный дизайн, адаптированный под широкий формат
- Заголовок размещён слева с max-width
- Градиент более плавный

### 4. Экспорт в PNG

**Библиотека:** `html-to-image`

```typescript
const handleDownload = async (ref, filename) => {
  const dataUrl = await toPng(ref.current, {
    quality: 1.0,
    pixelRatio: 2,
    cacheBust: true
  });
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
```

**Параметры:**
- Quality: 1.0 (максимальное качество)
- PixelRatio: 2 (для Retina дисплеев)
- CacheBust: true (предотвращает кэширование)

### 5. Дизайн и стилизация

#### Цветовая схема:
- **Основной акцент:** Индиго (indigo-600)
- **Фон:** Slate-50
- **Карточки:** Белый с тенью
- **Границы:** Slate-100

#### Типографика:
- **Заголовки:** Font-bold, tracking-tight
- **Текст:** San Francisco / Inter fallback
- **Размеры:** Адаптивные (text-3xl, text-lg, text-sm)

#### Анимации:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
/>
```

### 6. Интеграция в DashboardLayout

**Файл:** `/components/DashboardLayout.tsx`

**Условный рендеринг:**
```typescript
{filter === 'cover-lab' ? (
  <CoverLab />
) : (
  <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto">
    {/* Dashboard content */}
  </main>
)}
```

## Установленные зависимости

```bash
npm install colorthief html-to-image
```

**Версии:**
- `colorthief`: Последняя стабильная
- `html-to-image`: Последняя стабильная

## Структура UI

```
Cover Lab
├── Header
│   ├── Icon (Sparkles)
│   ├── Title
│   └── Description
├── Grid Layout (3 columns)
│   ├── Settings Panel (1 col)
│   │   ├── Image Upload
│   │   ├── Title Input
│   │   ├── Description Input
│   │   └── Accent Color Display
│   └── Preview Panel (2 cols)
│       ├── Instagram Story Preview
│       │   ├── Preview Container
│       │   └── Download Button
│       ├── Desktop Cover Preview
│       │   ├── Preview Container
│       │   └── Download Button
│       └── Empty State (if no image)
```

## Использование

### Шаг 1: Открыть Cover Lab
1. Кликнуть на "Cover Lab" в сайдбаре
2. Откроется интерфейс генератора

### Шаг 2: Загрузить изображение
1. Нажать "Upload Image"
2. Выбрать файл изображения
3. Автоматически извлечётся акцентный цвет

### Шаг 3: Настроить текст
1. Ввести заголовок в поле "Title"
2. Ввести описание в поле "Description"
3. Превью обновится автоматически

### Шаг 4: Скачать обложки
1. Нажать "Download" под Instagram Story
2. Нажать "Download" под Desktop Cover
3. Файлы сохранятся в формате PNG

## Технические детали

### Извлечение цвета

**ColorThief:**
- Анализирует доминирующие цвета изображения
- Возвращает RGB массив
- Конвертируется в HEX формат

**Fallback:**
- Если извлечение не удалось: `#DC2626` (красный)

### Рендеринг в PNG

**html-to-image:**
- Конвертирует DOM элемент в canvas
- Экспортирует в PNG DataURL
- Поддерживает высокое разрешение (2x)

### Масштабирование превью

**Проблема:** Шаблоны имеют реальные размеры (1080px, 1920px)

**Решение:**
```css
width: 1080px;
height: 1920px;
transform: scale(0.25);
transform-origin: top left;
```

## Особенности реализации

### 1. Refs для экспорта
```typescript
const storyRef = useRef<HTMLDivElement>(null);
const desktopRef = useRef<HTMLDivElement>(null);
```

### 2. Обработка состояния загрузки
```typescript
const [isProcessing, setIsProcessing] = useState(false);
```

### 3. CORS для изображений
```typescript
img.crossOrigin = 'Anonymous';
```

### 4. Graceful degradation
- Если ColorThief не работает → используется красный цвет
- Если экспорт не удался → показывается alert

## Дизайн-система

### Соответствие Figma:

✅ **Фото героя** - background image с object-cover
✅ **Текстовый блок** - крупный заголовок с text-shadow обводкой
✅ **Градиентный переход** - linear-gradient с акцентным цветом
✅ **Красный блок** - описание в цветном контейнере
✅ **Иконка стрелки** - SVG в блоке описания

### Минимализм Apple:

✅ **Шрифты** - San Francisco (-apple-system)
✅ **Spacing** - Generous padding и gaps
✅ **Shadows** - Subtle, не агрессивные
✅ **Borders** - Тонкие, светлые
✅ **Animations** - Плавные, spring-based

## Файлы изменений

- ✅ `/components/CoverLab.tsx` - новый компонент
- ✅ `/components/Sidebar.tsx` - добавлен пункт меню
- ✅ `/components/DashboardLayout.tsx` - условный рендеринг
- ✅ `/package.json` - добавлены зависимости

## Будущие улучшения

- [ ] Больше шаблонов (Facebook, LinkedIn, Twitter)
- [ ] Выбор из палитры цветов (не только доминирующий)
- [ ] Кастомные шрифты
- [ ] Библиотека сохранённых обложек
- [ ] Batch export (все форматы сразу)
- [ ] Предпросмотр в реальном размере (zoom)
- [ ] История изменений (undo/redo)
- [ ] Шаблоны с несколькими фото

## Производительность

### Оптимизации:

- **useCallback** для всех обработчиков
- **useRef** для DOM элементов (избегаем ре-рендеров)
- **Lazy loading** ColorThief (только при загрузке изображения)
- **Debounce** для текстовых полей (опционально)

### Размер бандла:

- ColorThief: ~10KB
- html-to-image: ~15KB
- **Итого:** ~25KB дополнительно

## Совместимость

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

**Требования:**
- Canvas API
- FileReader API
- Blob API
- Download attribute support
