# Dutch Sentence a Day

A polished, mobile-first Next.js app to learn 100 practical Dutch sentences over 100 days.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- localStorage persistence (no login)

## Features

- One deterministic sentence per local calendar day (`YYYY-MM-DD` key).
- 100 built-in everyday Dutch sentences.
- Mark sentence as learned with confirmation.
- Progress tracking (`learnedDays.length / 100 * 100`).
- History page (most recent first) with learned date.
- Settings page with confirmed reset.
- Toast feedback and loading states.

## Folder Structure

```txt
app/
  globals.css
  layout.tsx
  page.tsx
  history/page.tsx
  settings/page.tsx
components/
  ConfirmModal.tsx
  PhraseCard.tsx
  ProgressBar.tsx
  Toast.tsx
data/
  phrases.ts
lib/
  date.ts
  progress.ts
  storage.ts
  types.ts
  useAppState.ts
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

```txt
http://localhost:3000
```

## Build for Production

```bash
npm run build
npm run start
```
