# KURAL — Multilingual Personal AI Agent

> iQOO Hackathon Prototype

KURAL is a local-first, multilingual personal AI agent for your files, sharing, and reminders.  
It supports **English**, **தமிழ் (Tamil)**, and **Tanglish** voice and text commands.

---

## Demo

**Live:** https://kural.vercel.app *(deploy to your own Vercel)*

## Hackathon Demo Flow

1. Open KURAL → go to **Files** → **Add files** → select a real PDF invoice
2. Go to **Home** → tap the mic or type:
   - `"Find my latest invoice and tell me the amount"`
   - `"Downloads la latest invoice find panni amount sollu"`
3. Watch the JSON action plan + real extraction
4. Try: `"Share this invoice"` → browser share sheet opens
5. Try: `"Remind me tomorrow at 9 AM to pay this"` → real reminder created

## Architecture

```
USER VOICE/TEXT
  ↓
SpeechEngine (Web Speech API)
  ↓
LanguageNormalizer (EN / Tamil / Tanglish)
  ↓
LocalPrototypeIntentEngine
  ↓
JSON ActionPlan { actions: [...] }
  ↓
ActionValidator
  ↓
TaskPlanner
  ↓
ActionExecutor
  ↓
  ├── FIND_FILE  → IndexedDB
  ├── READ_FILE  → PDF.js
  ├── SHARE_FILE → Web Share API
  └── CREATE_REMINDER → Notification API + IndexedDB
```

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3 — sky-blue glassmorphism design
- Framer Motion — restrained micro-animations
- IndexedDB (idb) — local-first storage
- PDF.js — real PDF text extraction
- Web Speech API — voice recognition
- Web Share API — native file sharing
- Notification API — browser reminders

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) — it will auto-detect Vite.

## Privacy

- All file data stays in your **browser's IndexedDB** — nothing is uploaded
- No analytics, no tracking, no external AI APIs
- Sharing uses the browser's native Web Share API only

---

*KURAL — குறள் — Speak naturally. Act locally.*
