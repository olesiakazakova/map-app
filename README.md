# Map App — React Native + Expo

Мобильное приложение с картой OpenStreetMap, маркерами и привязанными к ним изображениями. Данные **сохраняются локально** в SQLite и **не теряются** при перезапуске приложения.

## 📱 Что умеет

- Отображает карту **OpenStreetMap** на весь экран
- Добавляет маркеры по тапу на карту
- Открывает экран деталей маркера (координаты, список фото)
- Позволяет добавлять изображения из галереи 
- Удаляет изображения и маркеры с подтверждением
- Обрабатывает ошибки: разрешения, отмена выбора, ненайденный маркер
- **Сохраняет данные в SQLite** между запусками приложения

## 🛠 Стек технологий

| Технология | Зачем |
|---|---|
| **React Native** | Фреймворк для мобильной разработки |
| **Expo** | Удобная обёртка над React Native |
| **Expo Router** | Файловая маршрутизация |
| **TypeScript** | Типизация |
| **react-native-leaflet-kit** | Карта OpenStreetMap через WebView + Leaflet |
| **expo-image-picker** | Доступ к галерее |
| **React Context** | Общее состояние между экранами |

## 📦 Установка и запуск

### Требования

- Node.js (последняя LTS-версия)
- Expo CLI
- TypeScript
- Приложение **Expo Go** на телефоне (Android/iOS)
- Телефон и компьютер в **одной Wi-Fi сети**

### Шаги

```bash
# 1. Клонировать репозиторий
git clone "https://github.com/olesiakazakova/map-app.git"
cd map-app

# 2. Установить зависимости
npm install --legacy-peer-deps

# 3. Запустить Metro
npx expo start --clear

# 4. Отсканировать QR-код в Expo Go
```

Флаг `--legacy-peer-deps` обязателен: в проекте могут быть конфликты версий React между пакетами.

## 🗂 Структура проекта

```
map-app/
├── app/                       # Экраны
│   ├── _layout.tsx            # Корневой лэйаут (MarkersProvider + Stack)
│   ├── index.tsx              # Экран карты
│   └── marker/
│       └── [id].tsx           # Экран деталей маркера
├── assets/                    # Иконки
├── components/                # Компоненты
│   ├── Map.tsx                # Компонент карты (OpenStreetMap)
│   └── ImageList.tsx          # Сетка изображений
├── contexts/
│   └── DatabaseContext.tsx    # React Context: SQLite + CRUD + статусы
├── database/
│   ├── schema.ts              # Открытие БД, PRAGMA, миграции
│   └── operations.ts          # CRUD-операции, row ↔ UI, DatabaseError
├── app.json                   # Конфиг Expo
├── package-lock.json          # Точные версии пакетов
├── package.json               # Зависимости
├── tsconfig.json              # Настройки TS
└── types.ts                   # TypeScript-интерфейсы
```
## 🗄 Схема базы данных

Файл: `markers.db` (создаётся автоматически в песочнице приложения).

### Таблица `markers`

| Колонка | Тип | Ограничения | Зачем |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Уникальный id |
| `latitude` | `REAL` | `NOT NULL` | Широта |
| `longitude` | `REAL` | `NOT NULL` | Долгота |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Время создания (UTC) |
| `title` | `TEXT` | `NOT NULL DEFAULT ''` | Название маркера (добавлено миграцией 2) |

### Таблица `marker_images`

| Колонка | Тип | Ограничения | Зачем |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Уникальный id |
| `marker_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY → markers(id) ON DELETE CASCADE` | К какому маркеру привязано |
| `uri` | `TEXT` | `NOT NULL` | Путь к файлу изображения |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Время добавления |

### Связи

- **Один-ко-многим:** один `marker` → много `marker_images`.
- **Каскадное удаление:** удаление маркера удаляет все его изображения (`ON DELETE CASCADE` + `PRAGMA foreign_keys = ON`).

### Версионирование и миграции

- `PRAGMA user_version` — версия схемы в заголовке файла БД.
- **v1** — `CREATE TABLE markers`, `CREATE TABLE marker_images`.
- **v2** — `ALTER TABLE markers ADD COLUMN title TEXT NOT NULL DEFAULT ''`.
- Блоки `if (version < N)` гарантируют, что каждая миграция применяется **ровно один раз** и только к тем, у кого её ещё нет. Обновление приложения **не теряет данные**.

## 🧩 Принятые решения

### 1. OpenStreetMap вместо Google Maps

**Проблема:** `react-native-maps` использует **Google Maps SDK**, в который вшит API-ключ. В Expo Go на Android этот ключ **просрочен** — карта показывает бежевый/чёрный экран без тайлов.

**Решение:** Перешли на `react-native-leaflet-kit`, которая рендерит **OpenStreetMap через WebView + Leaflet**. Не требует API-ключей, работает в Expo Go.

### 2. Тап вместо долгого нажатия

**Проблема:** В `react-native-leaflet-kit` **нет** пропа `onLongPress`. Есть только `onMapClick`.

**Решение:** Добавление маркеров реализовано через `onMapClick` (обычный тап). Это функциональный аналог — маркер добавляется по взаимодействию с картой.

### 3. Обходной путь для тапа по маркеру

**Проблема:** В `react-native-leaflet-kit` **нет** пропа `onPress` у `<Marker>`. Библиотека не пробрасывает клик по маркеру наружу.

**Решение:** Используется `onMapClick` + проверка попадания в радиус маркера (`HIT_RADIUS = 0.0005°` ≈ 50 м). Если тап попал в радиус — открываем детали, иначе — добавляем новый маркер.

### 4. SQLite вместо in-memory

**Проблема:** в первом задании данные жили в `useState` и **терялись** при перезапуске.

**Решение:** `expo-sqlite` + `React Context`. Контекст открывает БД, держит соединение, грузит данные в state и даёт CRUD-методы. Экраны **не пишут SQL** — только `useMarkers()`.

### 5. Разделение слоёв

- `database/schema.ts` — открытие БД, PRAGMA, миграции.
- `database/operations.ts` — CRUD, конвертация `row ↔ UI`, `DatabaseError`.
- `contexts/DatabaseContext.tsx` — состояние, методы, обработка ошибок.
- `app/*`, `components/*` — только UI, без SQL.

### 6. `id: string` в UI / `number` в БД

В `MapMarkerData.id` — **строка** (совместимость с `RootStackParamList` и expo-router: параметры URL — строки). Внутри `operations.ts` — `Number(id)` для SQLite, наружу — `String(row.id)`. Конвертация — в одном месте (`rowToMarker`, `rowToImage`).

## 🛡 Обработка ошибок

Ошибки обрабатываются **на всех уровнях**.

### 1. Ошибки инициализации БД

- `openDatabase()` обёрнут в `try/catch` в `useEffect` контекста.
- Ошибка → `setError` → UI показывает сообщение + кнопку **«Повторить»**.
- `retryInit()` увеличивает `initAttempt` → `useEffect` перезапускается → повторная попытка.
- `isLoading` сбрасывается в `finally` — UI не зависает в крутилке.

### 2. Ошибки транзакций

- `deleteMarker` обёрнут в `withTransactionAsync` — атомарность (удаление маркера + каскад изображений).
- Ошибка → откат → `DatabaseError` с оригиналом в `cause`.

### 3. Нарушения ограничений (FK, NOT NULL)

- `PRAGMA foreign_keys = ON` — иначе каскад **не работает**.
- `insertImage` к несуществующему маркеру → `SQLITE_CONSTRAINT_FOREIGNKEY` → `DatabaseError('Не удалось добавить изображение', cause)`.
- `insertMarker` с `latitude: undefined` → `NOT NULL constraint failed` → `DatabaseError('Не удалось создать маркер', cause)`.

### 4. Проблемы с подключением

- `requireDb()` бросает `'База данных не инициализирована'`, если `dbRef.current === null`.
- `wrap()` ловит это → `setError` + `throw`.

### 5. Единая обработка — `wrap()`

Все методы контекста обёрнуты в `wrap`:

1. Логирует ошибку (`__DEV__`).
2. Кладёт в `error` (если компонент жив — `mountedRef`).
3. Пробрасывает дальше — экран может показать `Alert`.

### 6. Очистка ресурсов

- `cancelled` — прерывает инициализацию, если компонент размонтирован во время `await`.
- `mountedRef` — запрещает `setState` после размонтирования.
- `closeAsync()` + `dbRef = null` — закрытие соединения в cleanup.

### 7. Тип `DatabaseError`

```typescript
class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) { ... }
}
```

Пользователю — понятное `message`, разработчику — оригинал в `cause` (например, `SQLITE_CONSTRAINT...`).

### 8. Логирование в dev

- `log()` в `operations.ts` под `__DEV__` — операции с БД.
- `console.error('[MarkersContext]', err)` в `wrap` — ошибки контекста.

## ⚠️ Известные ограничения

- **`HIT_RADIUS` фиксирован.** Если маркеры стоят близко друг к другу (< 50 м), тап может открыть не тот маркер.
- **Нет `onLongPress`.** Добавление маркеров — по обычному тапу.
- **Нет редактирования названия.** Маркеры называются «Место N» и переименовать их нельзя.
