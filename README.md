# LectureMate 🎓

<div align="center">

**An AI-powered study platform that turns YouTube videos, PDFs, and PowerPoint files into rich, interactive study material.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

</div>

## 📖 Overview

LectureMate ingests **YouTube videos, audio, PDFs, and PPT/PPTX files** and generates a full study workspace around them: long-form summaries, quizzes, slide decks, flashcards, AI-narrated images, math formulas, concept maps, and a chat tutor that knows the lecture by heart. Built with **React 19**, **Vite 7**, **Express**, **Google Gemini 2.5 Flash**, and optional **local Qwen2.5 via Ollama** for offline GPU processing.

Fully bilingual (Arabic / English) with proper RTL/LTR handling and Arabic-font PowerPoint export.

---

## ✨ Key Features

### 🎯 Content Sources
- 📹 **YouTube** — Transcript extraction, time-range slicing, key-frame capture via OpenCV
- 🎙️ **Audio uploads** — Local Whisper (`faster-whisper`) transcription
- 📄 **PDF (incl. scanned Arabic)** — High-precision extraction via **PyMuPDF** with automatic **Gemini Vision OCR fallback** when text is garbage/empty
- 🖼️ **PowerPoint (PPT/PPTX)** — Silent conversion to PDF via PowerPoint COM (`pywin32` on Windows) → fed to Gemini Vision for perfect formula extraction
- 🖱️ **Direct text paste** — Skip extraction and go straight to processing

### 🤖 AI-Generated Study Material
- 📝 **Summary** — Long-form abstractive summary with markdown + LaTeX support
- ❓ **Quiz** — Multiple-choice questions with explanations
- 🎬 **Slides** — Professional `.pptx` deck (5 themes, Arabic-aware fonts) using pptxgenjs + custom slide renderer
- 🃏 **Flashcards** — Term/definition cards with **full LaTeX rendering** (`react-markdown` + `remark-math` + `rehype-katex`)
- 🧮 **Formulas** — Auto-extracted math formulas with KaTeX rendering and step-by-step solutions
- 🖼️ **Images** — Every extracted image gets an AI-generated caption ("Analyzing image…" → Gemini 2.5 Flash Vision)
- 🗺️ **Concept Map** — Interactive node graph (React Flow + Dagre layout)
- 🎨 **NanoBanana** — Educational image generation via Google Imagen with Pexels fallback and CLIP-style scoring
- 🧬 **Molecule 3D** — Embedded 3Dmol.js viewer for chemistry lectures
- ⚕️ **Medical Insights / Visuals** — Specialized views for medical content
- 🛠️ **Engineering Lab** — Specialized view for engineering content
- 💡 **Solution Steps** — Worked-example renderer with code-block + math support

### 💬 Dual Chat Tutors
- **Lecture-Specific Agent** — Grounded in the current lecture's transcript and assets
- **General Assistant** — Site-wide help and general study questions
- Persistent chat history per lecture (Firestore)

### 🎨 UX
- 🌐 **Bilingual UI** (Arabic / English) with auto language detection
- 🔄 **RTL/LTR** layout switching
- 🎨 **5 Slide Themes** — Clean, Dark, Academic, Modern, Tech
- 📊 **Live progress** per processing stage
- 🔔 **Audio + visual** completion notifications
- ✋ **Stop button** that actually kills backend child processes (Python/Whisper)
- 📱 **Responsive** — Mobile, tablet, desktop

### 🔐 Auth & Storage
- Firebase Auth (Email/Password + Google Sign-In)
- Firestore for lectures, history, and chat
- Firebase Storage (optional) for uploaded assets

---

## 🛠️ Tech Stack

### Frontend
| Layer | Tech |
|------|------|
| Framework | **React 19** + TypeScript |
| Build | **Vite 7** + custom Vite plugins |
| Styling | **Tailwind CSS v4** + tailwind-merge + tw-animate-css |
| UI Primitives | **Radix UI** (full suite) + shadcn/ui patterns |
| Routing | Wouter |
| Animation | Framer Motion |
| Data | TanStack Query v5 |
| Math | KaTeX + MathJax + remark-math + rehype-katex |
| Diagrams | Mermaid + React Flow (@xyflow/react) + Dagre |
| Rich Editor | TipTap 3 (image, color, text-align, text-style extensions) |
| 3D | 3Dmol.js (molecule viewer) |
| PDF | jsPDF, pdf-parse, mammoth |
| Forms | react-hook-form + Zod |
| Charts | Recharts |
| Markdown | react-markdown + react-syntax-highlighter |

### Backend
| Layer | Tech |
|------|------|
| Runtime | **Node.js 24.x** (verified) with `tsx` watch in dev |
| Server | Express 4 + multer |
| AI SDK | `@google/generative-ai` (Gemini 2.5 Flash) |
| Slide Render | pptxgenjs + custom server-side slide renderer (`server/lib/slideRenderer.ts`) |
| PPTX Animations | Custom XML patcher (`server/lib/pptxAnimations.ts`) |
| Math Render (server) | mathjax-full → SVG → @resvg/resvg-js → PNG |
| Headless | Puppeteer (for high-fidelity rendering jobs) |
| Auth | Firebase Admin + passport-local |
| DB | Drizzle ORM + Neon serverless Postgres (optional) |

### Python (server/scripts/)
| Script | Purpose |
|--------|---------|
| `get_transcript.py` | YouTube transcript via `youtube-transcript-api` |
| `get_video_info.py` | Video metadata |
| `download_youtube_audio.py` | yt-dlp audio download |
| `transcribe_audio.py` | `faster-whisper` audio → text |
| `extract_pdf_content.py` | **PyMuPDF** simultaneous text + image extraction |
| `extract_pptx_images.py` | PPTX image extraction |
| `convert_pptx.py` | **PPTX → PDF** via PowerPoint COM (`pywin32`, Windows) |
| `text_cleaner.py` | Garbage-text detection (triggers OCR fallback) |
| `nano_banana_cli.py` + `nano_banana/` | Imagen + Pexels image generation pipeline |

### AI Models
- **Cloud:** Google **Gemini 2.5 Flash** (text + Vision + File API)
- **Local (optional):** **Ollama** with Qwen2.5
  - `qwen2.5:32b` — best quality, ≥20 GB VRAM
  - `qwen2.5:14b` — great, ≥10 GB VRAM
  - `qwen2.5:7b` — good, ≥5 GB VRAM
- **Image gen:** Google Imagen (NanoBanana pipeline) with Pexels fallback

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (recommended: 20.x or 24.x) and npm
- **Python 3.8+**
- A **Firebase** project (Auth + Firestore)
- A **Gemini API key** ([Google AI Studio](https://aistudio.google.com/apikey))
- *(Optional)* **Ollama** for local GPU inference
- *(Optional, Windows only)* **Microsoft PowerPoint** + `pywin32` for PPTX → PDF auto-conversion

### Installation

```bash
# 1. Clone
git clone https://github.com/MoAlazool/LAST.git
cd LAST

# 2. Install JS deps
npm install

# 3. Install Python deps
pip install -r requirements.txt
# (optional) For GPU Whisper:
pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu118

# 4. Configure env
cp .env.example .env
# then edit .env and set GEMINI_API_KEY

# 5. Set up Firebase
#    - Create project at https://console.firebase.google.com/
#    - Enable Auth (Email/Password + Google)
#    - Create a Firestore database
#    - Paste your web config into client/src/lib/firebase.ts
#    - Deploy rules:
npx firebase deploy --only firestore:rules

# 6. (Optional) Ollama for local GPU processing
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5:7b    # or :14b / :32b based on your VRAM

# 7. Run dev
npm run dev
```

The app runs at **http://localhost:5000** (server) and the Vite client dev server at **http://localhost:8080** (`npm run dev:client`).

---

## 📂 Project Structure

```
.
├── client/                          # React 19 + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── auth/                # ProtectedRoute, sign-in/up flow
│       │   ├── dashboard/           # LectureCard etc.
│       │   ├── editor/              # TipTap-based WordEditor
│       │   ├── home/                # FeatureShowcase
│       │   ├── layout/              # AppLayout, Sidebar
│       │   ├── lecture/             # All study views ↓
│       │   │   ├── SummaryView.tsx
│       │   │   ├── QuizView.tsx
│       │   │   ├── SlidesView.tsx
│       │   │   ├── FlashcardsView.tsx        # LaTeX-aware
│       │   │   ├── FormulasView.tsx          # Math + KaTeX
│       │   │   ├── ImagesView.tsx            # Vision-captioned images
│       │   │   ├── TranscriptView.tsx
│       │   │   ├── AgentChatView.tsx         # Lecture-specific chat
│       │   │   ├── ConceptMapView.tsx        # React Flow
│       │   │   ├── EngineeringLabView.tsx
│       │   │   ├── MedicalInsightsView.tsx
│       │   │   ├── MedicalVisual.tsx
│       │   │   ├── Molecule3D.tsx            # 3Dmol.js
│       │   │   ├── NanoBananaView.tsx        # AI-generated images
│       │   │   ├── SolutionSteps.tsx
│       │   │   ├── MathRenderer.tsx
│       │   │   ├── MathGraph.tsx
│       │   │   └── CodeBlock.tsx
│       │   ├── lecture-mate-studio/ # Studio shell + dashboard widgets
│       │   └── ui/                  # Radix-based primitives
│       ├── contexts/                # AuthContext, LanguageContext
│       ├── hooks/                   # useLectures, useLectureProcessor, …
│       ├── lib/                     # firebase, aiService, lectureService, youtubeService, categoryClassifier, chatHistoryService
│       └── pages/                   # home, dashboard, lecture-view, history, profile, auth/*
├── server/                          # Express + tsx
│   ├── index.ts                     # Server entry, port-conflict guard
│   ├── routes.ts                    # All /api/* routes + OCR fallback
│   ├── static.ts / vite.ts          # Dev/prod static serving
│   ├── storage.ts                   # File handling
│   ├── firebaseStorage.ts           # Firebase Admin uploads
│   ├── assets/fonts/                # Tajawal (Arabic) + Plus Jakarta Sans
│   ├── lib/
│   │   ├── slideRenderer.ts         # Server-side slide → image/PDF
│   │   ├── mathRender.ts            # MathJax → SVG → PNG
│   │   └── pptxAnimations.ts        # Inject PPTX animations
│   └── scripts/                     # Python workers (see Tech Stack table)
├── shared/
│   ├── schema.ts                    # Zod + Drizzle schemas
│   └── slides/                      # Shared slide renderer (client + server)
├── script/build.ts                  # Production build orchestrator
├── docs/                            # Per-feature update notes
├── Dockerfile, docker-compose.yml   # Containerized deployment
├── firebase.json, *.rules           # Firebase Hosting + Firestore/Storage rules
├── requirements.txt                 # Python deps
├── package.json
├── .env.example                     # Copy → .env and fill GEMINI_API_KEY
├── start.sh / startup.sh            # Linux launch helpers
├── setup-gpu.sh                     # GPU env setup
├── install-qwen-model.sh            # Pull Qwen via Ollama
├── preload-models.py                # Warm up Whisper/Qwen
└── README.md
```

---

## 🔌 API Endpoints

### YouTube / Audio
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/youtube/info` | Video metadata |
| `POST` | `/api/youtube/transcribe` | Transcript (with optional time range) |
| `POST` | `/api/audio/transcribe` | Whisper transcription of uploaded file |

### Document Ingest
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/upload/pdf` | PDF text + image extraction (PyMuPDF + Gemini OCR fallback) |
| `POST` | `/api/upload/pptx` | PPTX → PDF → Vision pipeline |

### AI Generation
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/ai/summary` | Long-form summary (AR/EN) |
| `POST` | `/api/ai/quiz` | MCQ quiz |
| `POST` | `/api/ai/slides` | Slide deck |
| `POST` | `/api/ai/flashcards` | LaTeX-aware flashcards |
| `POST` | `/api/ai/formulas` | Extract & render math formulas |
| `POST` | `/api/ai/images/caption` | Per-image AI caption |
| `POST` | `/api/ai/concept-map` | Concept graph |
| `POST` | `/api/ai/nano-banana` | Generate educational image |
| `POST` | `/api/ai/category` | Category classification |

### Chat
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/chat/lecture` | Lecture-grounded chat |
| `POST` | `/api/chat/general` | Site-wide chat |

### Control & Export
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/lecture/:lectureId/stop` | Hard-stop all child processes |
| `POST` | `/api/ai/slides/download` | Download `.pptx` |

---

## 🆕 What's New (Feb 26, 2026 cycle)

> Full changelog in [`UPDATES_FEB_26_2026.md`](UPDATES_FEB_26_2026.md).

- **Vision-captioned images** — Every extracted image now gets a Gemini 2.5 Flash explanation, with lazy loading and sparkle UI cues.
- **PyMuPDF Arabic PDF pipeline** — Replaces fragile JS PDF parsing; one-pass text + image extraction with proper Arabic font handling.
- **Zero-failure OCR** — Garbage-text detector (`text_cleaner.py`) auto-triggers Gemini Vision OCR for scanned / mis-encoded Arabic PDFs.
- **YouTube key-frame extraction** — OpenCV pulls representative frames so every YouTube lecture returns transcript **+ images**.
- **PPTX → PDF auto-conversion** — Silent COM bridge via `pywin32` produces a perfect PDF that Gemini Vision can read end-to-end.
- **LaTeX flashcards** — `$inline$` and `$$block$$` math now renders correctly on both card sides (KaTeX).
- **Port-conflict guard** — Auto-detects and kills orphaned servers holding `0.0.0.0:5000`.
- **Node 24 verified** — Deprecation warnings silenced, `tsx --watch` runs cleanly.
- **Firebase ADC** — Standardized Application Default Credentials for Storage.
- **Stable child-process management** — Whisper / Python processes terminate cleanly on Stop.

---

## 🧪 Development

```bash
npm run dev          # Backend (tsx --watch) — also serves built client in prod
npm run dev:client   # Vite client dev server on :8080
npm run check        # tsc type-check (no emit)
npm run build        # tsx script/build.ts → dist/
npm start            # node dist/index.mjs (production)
npm run db:push      # drizzle-kit push (if using Postgres)
```

---

## 🚢 Deployment

### Docker
```bash
docker-compose up --build
```

### Firebase Hosting (client) + your choice of backend host
```bash
npm run deploy:hosting        # client only
npm run deploy                # client + Functions/whatever firebase.json points at
```

### Backend hosts that work well
- **Cloud Run** — containerized, autoscaling
- **Railway / Render** — easiest PaaS path
- **RunPod / Vast.ai** — for GPU + Ollama (see `RUNPOD_SETUP.md`, `RUNPOD_QUICKSTART.md`)
- **VPS** — `start.sh` / `startup.sh` are ready-to-go launchers

### GPU / Ollama setup
- `GPU_SETUP.md` — local GPU configuration
- `setup-gpu.sh` — automated CUDA + Ollama install
- `install-qwen-model.sh` — pulls the right Qwen size for your VRAM
- `QWEN_MODELS_GUIDE.md` — model selection cheat-sheet
- `preload-models.py` — warm caches on boot

---

## 📝 Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini text + Vision |
| `NODE_ENV` | — | `development` | Standard Node flag |
| `PEXELS_API_KEY` | — | — | Image search fallback for NanoBanana |
| `OLLAMA_URL` | — | `http://localhost:11434` | Local Ollama endpoint |
| `OLLAMA_MODEL` | — | `qwen2.5:7b` | Local model to use |
| `PYTHON_CMD` | — | `python3` | Override Python interpreter |
| `FIREBASE_PROJECT_ID` | — | — | Server-side Firebase Admin |
| `FIREBASE_STORAGE_BUCKET` | — | — | For uploaded asset storage |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | — | — | Inline JSON credentials |
| `GOOGLE_APPLICATION_CREDENTIALS` | — | — | Path to ADC JSON |
| `CUDA_VISIBLE_DEVICES` | — | — | GPU selection |

A complete template lives in [`.env.example`](.env.example).

---

## 🐛 Troubleshooting

**Port 5000 already in use**
Fixed in the Feb 26 cycle — the server now detects and terminates the orphaned process automatically. If it persists, `lsof -i :5000` then `kill -9 <pid>`.

**YouTube transcript missing**
Some videos have no captions (auto or manual). For those, download audio and run Whisper instead — the app falls back automatically when configured.

**PDF text comes out as garbage (e.g. `u LRAJI ,jS.æ`)**
`text_cleaner.py` should detect this and auto-trigger Gemini Vision OCR. If it doesn't, check that `GEMINI_API_KEY` is set and that the PDF isn't password-protected.

**PPTX auto-conversion fails**
Requires **Microsoft PowerPoint installed + `pywin32`** on a **Windows** server. On macOS/Linux, install LibreOffice and convert manually, or upload the PDF export directly.

**Ollama / GPU issues**
- `ollama list` to confirm the model is pulled
- `nvidia-smi` to confirm GPU is visible
- App auto-falls back to Gemini Cloud if Ollama is unreachable

**RTL/Arabic font issues in slides**
Ensure `server/assets/fonts/Tajawal-*.ttf` are present — they're embedded in PPTX output.

**Stop button doesn't kill backend work**
Fixed in Feb 26 cycle. If you still see it, restart the dev server and report the lecture ID — child-process tracking should hold.

---

## 🤝 Contributing

PRs welcome. Standard flow:

```bash
git checkout -b feature/your-feature
# … work …
git commit -m "feat: short description"
git push origin feature/your-feature
# open PR against main
```

---

## 📄 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) — AI text + Vision + File API
- [Ollama](https://ollama.ai/) + [Qwen](https://github.com/QwenLM/Qwen) — local LLM
- [Firebase](https://firebase.google.com/) — Auth, Firestore, Hosting, Storage
- [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) — UI primitives
- [pptxgenjs](https://github.com/gitbrent/pptxgenjs) — PowerPoint output
- [PyMuPDF](https://pymupdf.readthedocs.io/) — PDF extraction
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — audio transcription
- [KaTeX](https://katex.org/) + [MathJax](https://www.mathjax.org/) — math rendering
- [React Flow](https://reactflow.dev/) + [Dagre](https://github.com/dagrejs/dagre) — concept maps
- [3Dmol.js](https://3dmol.csb.pitt.edu/) — molecule viewer
- [TipTap](https://tiptap.dev/) — rich editor

---

<div align="center">

**Made with ❤️ for students and educators**

⭐ Star this repo if you find it helpful!

[Repository](https://github.com/MoAlazool/LAST) · [Issues](https://github.com/MoAlazool/LAST/issues)

</div>
