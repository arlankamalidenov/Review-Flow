# Live Feed Button Enhancement

## Дата: 2026-01-16

## Обзор изменений

Кнопка **LIVE FEED** теперь интерактивная и позволяет вручную обновлять все отзывы и счетчики одним кликом.

## Реализованная функциональность

### 1. Интерактивная кнопка

**Было:**
```tsx
<div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm">
  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
    Live Feed
  </span>
</div>
```

**Стало:**
```tsx
<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
>
  <RefreshCw 
    className={`w-3.5 h-3.5 text-emerald-500 transition-transform duration-500 ${
      isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
    }`}
  />
  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
    {isRefreshing ? 'Updating...' : 'Live Feed'}
  </span>
</button>
```

### 2. Функция обновления

```typescript
const handleRefresh = useCallback(async () => {
  console.log('🔄 Refreshing reviews...');
  setIsRefreshing(true);
  
  // Invalidate all review-related queries
  await queryClient.invalidateQueries({ queryKey: ['reviews'] });
  await queryClient.invalidateQueries({ queryKey: ['review-count'] });
  await queryClient.invalidateQueries({ queryKey: ['archive'] });
  
  // Keep the animation for at least 500ms for better UX
  setTimeout(() => {
    setIsRefreshing(false);
  }, 500);
}, [queryClient]);
```

### 3. Визуальные эффекты

#### Hover эффекты:
- **Тень**: `shadow-sm` → `shadow-md`
- **Граница**: `border-slate-100` → `border-emerald-200`
- **Иконка**: Поворот на 180° при наведении

#### Loading состояние:
- **Иконка**: Анимация вращения (`animate-spin`)
- **Текст**: "Live Feed" → "Updating..."
- **Кнопка**: Disabled с opacity 70%
- **Курсор**: `cursor-not-allowed`

### 4. Что обновляется при клике

При нажатии на кнопку происходит инвалидация всех кэшей React Query:

1. **`['reviews']`** - все отзывы для текущего проекта и фильтра
2. **`['review-count']`** - счетчики для badges (All, Pending, Published, Draft, Trash)
3. **`['archive']`** - данные из Telegram архива (если открыт RBesolov)

После инвалидации React Query автоматически перезапрашивает данные с сервера.

## UX улучшения

### Минимальная длительность анимации
Даже если запрос выполнился мгновенно, анимация загрузки показывается минимум **500ms** для лучшего визуального восприятия.

### Плавные переходы
- Все изменения стилей имеют `transition-all duration-200`
- Иконка вращается с `transition-transform duration-500`

### Feedback для пользователя
- **Hover** - показывает, что кнопка кликабельна
- **Click** - немедленная визуальная реакция (spinning icon)
- **Disabled** - предотвращает множественные клики

## Технические детали

### Состояние
```typescript
const [isRefreshing, setIsRefreshing] = useState(false);
```

### Импорты
```typescript
import { RefreshCw } from 'lucide-react';
```

### Зависимости
- React Query `queryClient.invalidateQueries()`
- Framer Motion (уже используется в проекте)
- Lucide React Icons

## Использование

1. Откройте Dashboard
2. Найдите кнопку **LIVE FEED** в правом верхнем углу
3. Наведите курсор - иконка повернётся на 180°
4. Кликните - начнётся обновление данных
5. Дождитесь завершения (иконка перестанет вращаться)

## Совместимость

- ✅ Работает со всеми проектами (Bfisherman, RBesolov, Archive)
- ✅ Обновляет данные независимо от текущего фильтра
- ✅ Сохраняет текущую страницу пагинации
- ✅ Сохраняет поисковый запрос

## Файлы изменений

- ✅ `/components/DashboardLayout.tsx`
  - Добавлен импорт `RefreshCw`
  - Добавлено состояние `isRefreshing`
  - Добавлена функция `handleRefresh`
  - Обновлена кнопка LIVE FEED
