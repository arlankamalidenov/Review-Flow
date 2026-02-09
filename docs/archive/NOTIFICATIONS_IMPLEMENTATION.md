# Система счетчиков и уведомлений

## Дата: 2026-01-16

## Обзор

Реализована полноценная система счетчиков (badges) и уведомлений о новых отзывах с использованием Web Notifications API.

## 1. Функция получения количества отзывов (wpService.ts)

### `fetchReviewCount`

Новая функция для эффективного получения количества отзывов без загрузки данных.

**Особенности:**
- Использует **HEAD запрос** для минимизации трафика
- Извлекает заголовок `X-WP-Total` из ответа WordPress API
- Поддерживает фильтрацию по статусу
- Возвращает 0 при ошибке (graceful degradation)

```typescript
export const fetchReviewCount = async (
  project: ProjectConfig,
  creds: WPCredentials,
  status: ReviewStatus | 'all' = 'all'
): Promise<number>
```

## 2. Хук useReviewCounts

**Расположение:** `/hooks/useReviewCounts.ts`

**Функциональность:**
- Загружает счетчики для всех категорий (All, Pending, Published, Draft, Trash)
- Использует React Query для кэширования
- Автоматическое обновление каждые 5 минут
- Stale time: 4 минуты

**Возвращаемые данные:**
```typescript
{
  all: number;
  pending: number;
  published: number;
  draft: number;
  trash: number;
}
```

## 3. Хук useNotifications

**Расположение:** `/hooks/useNotifications.ts`

**Функциональность:**

### Запрос разрешений
- Автоматический запрос разрешения на уведомления при первом запуске
- Проверка `Notification.permission`
- Graceful degradation если браузер не поддерживает

### Периодическая проверка
- Интервал: **5 минут** (настраиваемый)
- Легкий HEAD запрос к endpoint Pending
- Сравнение с предыдущим значением

### При обнаружении новых отзывов:

1. **Обновление document.title:**
   ```javascript
   document.title = `(${newReviewsCount}) ReviewFlow - ${project.name}`;
   ```

2. **Web Notification:**
   - Заголовок: "Новый отзыв на [Название проекта]!"
   - Тело: "У вас X новых отзывов. Нажмите, чтобы прочитать."
   - Иконка: `/favicon.ico`
   - Автозакрытие через 5 секунд
   - Клик по уведомлению фокусирует окно

## 4. Компонент CountBadge

**Расположение:** `/components/ui/CountBadge.tsx`

**Дизайн:**
- Стиль iOS/macOS notifications
- Шрифт: San Francisco (`-apple-system, BlinkMacSystemFont, "SF Pro Text"`)
- Минимальная ширина: 20px
- Высота: 20px (5 в Tailwind)
- Скругление: `rounded-full`

**Варианты:**
- `default` - серый (slate-100/slate-600)
- `primary` - синий (indigo-500/white) - для "All Reviews"
- `danger` - красный (red-500/white) - для "Pending"

**Анимация:**
- Spring animation при появлении/исчезновении
- `scale` и `opacity` transitions
- Framer Motion

**Особенности:**
- Автоматически скрывается при count = 0
- Отображает "99+" для значений > 99

## 5. Интеграция в Sidebar

### Обновленный интерфейс:
```typescript
interface SidebarProps {
  // ... existing props
  counts?: {
    all: number;
    pending: number;
    published: number;
    draft: number;
    trash: number;
  };
}
```

### Логика отображения:
- Каждый пункт меню получает соответствующий счетчик
- Archive (TG) не имеет счетчика (count: undefined)
- Badges выравниваются справа через `justify-between`

### Цветовая схема:
```typescript
const getCountBadgeVariant = (itemId: string) => {
  if (itemId === ReviewStatus.Pending) return 'danger';  // Красный
  if (itemId === 'all') return 'primary';                 // Синий
  return 'default';                                        // Серый
};
```

## 6. Интеграция в DashboardLayout

### Импорты:
```typescript
import { useNotifications } from '../hooks/useNotifications';
import { useReviewCounts } from '../hooks/useReviewCounts';
```

### Использование:
```typescript
// Система уведомлений
useNotifications({
  project: currentProject,
  creds: activeCreds,
  enabled: true
});

// Счетчики для badges
const counts = useReviewCounts({
  project: currentProject,
  creds: activeCreds,
  enabled: true
});

// Передача в Sidebar
<Sidebar
  // ... other props
  counts={counts}
/>
```

## 7. Производительность

### Оптимизации:
- **HEAD запросы** вместо GET для проверки количества
- **React Query кэширование** - избегаем дублирующих запросов
- **Stale time** - данные считаются свежими 4 минуты
- **Refetch interval** - обновление каждые 5 минут
- **Автоматическая очистка** - document.title сбрасывается при unmount

### Трафик:
- HEAD запрос: ~200 байт (только заголовки)
- vs GET запрос: ~5-50 КБ (полные данные)
- **Экономия: ~95-99%**

## 8. Браузерная совместимость

### Web Notifications API:
- ✅ Chrome/Edge 22+
- ✅ Firefox 22+
- ✅ Safari 7+
- ✅ Opera 25+
- ❌ IE (не поддерживается)

### Graceful degradation:
```typescript
if ('Notification' in window) {
  // Используем уведомления
} else {
  // Только счетчики, без уведомлений
}
```

## 9. Пользовательский опыт

### Первый запуск:
1. Приложение запрашивает разрешение на уведомления
2. Пользователь разрешает/отклоняет
3. Выбор сохраняется в браузере

### При новом отзыве:
1. Через 5 минут происходит проверка
2. Обнаружен новый отзыв
3. Заголовок вкладки: `(1) ReviewFlow - Bfisherman.no`
4. Всплывает уведомление (если разрешено)
5. Клик по уведомлению → фокус на вкладке

### Визуальные индикаторы:
- **Pending (красный badge)** - привлекает внимание
- **All Reviews (синий badge)** - основной индикатор
- **Остальные (серый badge)** - нейтральные

## 10. Файлы изменений

- ✅ `/services/wpService.ts` - добавлена `fetchReviewCount`
- ✅ `/hooks/useNotifications.ts` - новый хук
- ✅ `/hooks/useReviewCounts.ts` - новый хук
- ✅ `/components/ui/CountBadge.tsx` - новый компонент
- ✅ `/components/Sidebar.tsx` - интеграция badges
- ✅ `/components/DashboardLayout.tsx` - интеграция хуков

## 11. Будущие улучшения

- [ ] Звуковое уведомление (опционально)
- [ ] Настройка интервала проверки в UI
- [ ] История уведомлений
- [ ] Push notifications для мобильных устройств
- [ ] Группировка уведомлений при большом количестве
