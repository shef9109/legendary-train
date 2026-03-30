# Калькулятор баллов ЕГЭ 2026

Статический сайт на `HTML + CSS + JavaScript` для подсчёта баллов ЕГЭ.

## Возможности
- Подсчёт по заданиям: `задания -> первичный -> тестовый/оценка`.
- Быстрый перевод: `первичный -> тестовый/оценка`.
- Поддержка всех предметов из таблиц 2026 года.
- Установка как web app (PWA) на Android и iOS.

## Источники данных
- Шкала перевода: https://4ege.ru/novosti-ege/4023-shkala-perevoda-ballov-ege.html
- Разбаловка по заданиям: https://4ege.ru/novosti-ege/76411-raspredelenie-ballov-ege-2026-po-vsem-predmetam.html

## Структура проекта
- `index.html` - страница
- `styles.css` - стили
- `app.js` - логика калькулятора
- `data/ege_2026.json` - данные по предметам и шкалам
- `manifest.webmanifest` - настройки web app
- `sw.js` - service worker для офлайн-режима
- `assets/icons/*` - иконки приложения
- `.nojekyll` - отключение Jekyll на GitHub Pages

## Локальный запуск
Вариант 1 (Node.js):
```bash
npx serve .
```

Вариант 2 (Python):
```bash
python -m http.server 8080
```

Откройте: `http://localhost:3000` (для `serve`) или `http://localhost:8080`.

## Деплой на GitHub Pages

### 1) Залить проект в GitHub
```bash
git init
git add .
git commit -m "Initial commit: EGE calculator"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

### 2) Включить Pages
1. Откройте репозиторий на GitHub.
2. Перейдите: `Settings -> Pages`.
3. В `Build and deployment` выберите:
- `Source`: `Deploy from a branch`
- `Branch`: `main`
- `Folder`: `/ (root)`
4. Нажмите `Save`.

### 3) Дождаться публикации
- Обычно 1-3 минуты.
- Ссылка появится в разделе `Settings -> Pages`.

## Какой будет URL
- Если репозиторий вида `<username>.github.io`, сайт откроется на: `https://<username>.github.io/`
- Если обычный репозиторий (например `ege-calculator`): `https://<username>.github.io/ege-calculator/`

## Установка как приложение
Android (Chrome/Edge):
1. Откройте сайт.
2. Нажмите `Установить приложение` (или меню браузера -> `Установить приложение`).
3. Сайт откроется отдельно, как приложение.

iOS (Safari):
1. Откройте сайт в Safari.
2. Нажмите `Поделиться`.
3. Выберите `На экран "Домой"`.
4. Открывайте с ярлыка, сайт запустится в standalone-режиме.

## Обновление данных
Редактируйте `data/ege_2026.json` и коммитьте изменения в `main`.
После пуша GitHub Pages автоматически обновит сайт.

## Лицензия
MIT, см. `LICENSE`.
