# Gigross Frontend

Современное веб-приложение на Next.js 15 с TypeScript, TailwindCSS, MongoDB, Framer Motion и shadcn/ui.

## 🚀 Технологии

- **Next.js 15** - React фреймворк с App Router и Turbopack
- **TypeScript** - Статическая типизация для JavaScript
- **TailwindCSS 4** - Utility-first CSS фреймворк
- **MongoDB** - NoSQL база данных
- **Mongoose** - ODM для MongoDB
- **Framer Motion** - Библиотека анимаций для React
- **shadcn/ui** - Коллекция красивых и доступных UI компонентов
- **ESLint + Prettier** - Линтинг и форматирование кода

## 📁 Структура проекта

```
src/
├── app/                    # App Router страницы
├── components/             # React компоненты
│   └── ui/                # shadcn/ui компоненты
├── hooks/                 # Пользовательские хуки
├── lib/                   # Утилиты и конфигурация
├── types/                 # TypeScript типы
├── utils/                 # Вспомогательные функции
├── constants/             # Константы приложения
├── config/                # Конфигурационные файлы
├── middleware/            # Middleware функции
├── api/                   # API утилиты
├── database/              # Модели и схемы базы данных
└── stores/                # Управление состоянием
```

## 🛠 Установка и запуск

1. **Клонирование репозитория**

   ```bash
   git clone <repository-url>
   cd gigross-front
   ```

2. **Установка зависимостей**

   ```bash
   yarn install
   ```

3. **Настройка переменных окружения**

   ```bash
   cp .env.example .env.local
   ```

   Отредактируйте `.env.local` и укажите ваши настройки:

   ```env
   MONGODB_URI=mongodb://localhost:27017/gigross
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Запуск в режиме разработки**

   ```bash
   yarn dev
   ```

5. **Открыть в браузере**
   Перейдите по адресу [http://localhost:3000](http://localhost:3000)

## 📜 Доступные скрипты

- `yarn dev` - Запуск в режиме разработки с Turbopack
- `yarn build` - Сборка для продакшена
- `yarn start` - Запуск продакшен сборки
- `yarn lint` - Проверка кода с ESLint
- `yarn lint:fix` - Исправление ошибок ESLint
- `yarn format` - Форматирование кода с Prettier
- `yarn format:check` - Проверка форматирования
- `yarn type-check` - Проверка типов TypeScript
- `yarn clean` - Очистка сборочных файлов

## 🎨 Компоненты UI

Проект использует полный набор компонентов shadcn/ui:

### Формы

- Button, Input, Label, Textarea
- Select, Checkbox, Radio Group, Switch
- Slider, Progress

### Навигация

- Navigation Menu, Breadcrumb, Tabs
- Dropdown Menu, Context Menu, Menubar

### Обратная связь

- Alert, Dialog, Sheet, Drawer
- Tooltip, Hover Card, Popover

### Отображение данных

- Card, Table, Badge, Avatar
- Accordion, Collapsible, Separator
- Calendar, Carousel, Resizable

### Утилиты

- Aspect Ratio, Skeleton

## 🔧 Конфигурация

### ESLint

Настроен с правилами для:

- Next.js и React
- TypeScript
- Prettier интеграция
- Сортировка импортов

### Prettier

Конфигурация включает:

- Одинарные кавычки
- Точки с запятой
- Ширина строки 100 символов
- Интеграция с TailwindCSS

### TailwindCSS

- Версия 4 с новым синтаксисом
- Кастомные цвета и переменные
- Только светлая тема
- Интеграция с shadcn/ui

## 🗄 База данных

Проект настроен для работы с MongoDB через Mongoose:

- Подключение через переменную `MONGODB_URI`
- Кэширование соединения для оптимизации
- Готовые типы и интерфейсы

## 🎭 Анимации

Framer Motion интегрирован для создания плавных анимаций:

- Анимации появления элементов
- Переходы между страницами
- Интерактивные анимации

## 📱 Адаптивность

Проект полностью адаптивен и оптимизирован для:

- Мобильных устройств
- Планшетов
- Десктопов

## 🔒 Безопасность

- Middleware для аутентификации
- Валидация данных
- Защита от XSS и CSRF

## 🚀 Развертывание

Проект готов для развертывания на:

- Vercel (рекомендуется)
- Netlify
- Docker
- Любой Node.js хостинг

## 📄 Лицензия

MIT License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или предложения, создайте Issue в репозитории.
