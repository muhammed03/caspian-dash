# Материалы для сдачи

| Файл | Что это | Формат |
|---|---|---|
| `Caspian-Watch-Документация.pdf` | Документация проекта простым языком: архитектура, стек, источники данных, формулы, запуск, честные ограничения и готовые ответы жюри | A4, 9 страниц |
| `Caspian-Watch-Презентация.pdf` | Презентация для защиты, 13 слайдов | 16:9, размер слайда PowerPoint (13,33 × 7,5 дюйма) |

Исходники — `documentation.html` и `presentation.html` в этой же папке.

## Пересобрать PDF после правок

```bash
npm run docs
```

Или вручную:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="docs/Caspian-Watch-Презентация.pdf" \
  "file://$PWD/docs/presentation.html"
```

## Что заполнить перед сдачей

- Слайд 01: название команды (сейчас плейсхолдер «Название команды»)
- `docs/documentation.html`, раздел «Авторы» — состав команды
