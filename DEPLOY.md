# Deploying LectureMate to Railway

LectureMate is a **single Node server** that serves the React client **and** the `/api`
backend, and shells out to Python (`yt-dlp`, `PyMuPDF`) + `ffmpeg` + LibreOffice.
It therefore needs a real container host — **not** a static host like Netlify.
This guide uses **Railway** with the included `Dockerfile.railway`.

## 1. Prerequisites
- A GitHub repo with this code (e.g. https://github.com/MoAlazool/LAST).
- A **Firebase** project with Auth + Firestore + Storage enabled (already set up: `lecturemate-d0187`).
- A **Gemini API key** (free tier is rate-limited to 5 req/min — a paid key is strongly recommended for a live site).

## 2. Create the Railway service
1. Go to https://railway.app → **New Project → Deploy from GitHub repo** → pick your repo.
2. Railway reads `railway.json` and builds with **`Dockerfile.railway`** automatically.

## 3. Set environment variables (Railway → service → Variables)
| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | your Gemini API key (`AIza…`) |
| `FIREBASE_PROJECT_ID` | `lecturemate-d0187` |
| `FIREBASE_STORAGE_BUCKET` | `lecturemate-d0187.firebasestorage.app` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **the entire service-account JSON, pasted as one line** |
| `PYTHON_CMD` | `python3` |

`PORT` is injected by Railway automatically — don't set it.

> The server reads `FIREBASE_SERVICE_ACCOUNT_KEY` as inline JSON, so files persist in
> Firebase Storage (cloud disks are ephemeral). Never commit the JSON file.

## 4. Firebase setup for the live domain
- **Authentication → Settings → Authorized domains**: add your Railway domain
  (e.g. `your-app.up.railway.app`) so Google/Email sign-in works.
- **Firestore rules** and **Storage** must be published (already done for this project).

## 5. Deploy & verify
- Railway builds the image and starts `node dist/index.mjs`.
- Health check: `GET /api/health` should return OK.
- Open the Railway URL → sign up → paste a YouTube link → process a lecture.

## Notes / limitations on a CPU host
- **GPU / Whisper ("gpu" mode) is disabled** — the image is CPU-only; use **"api" mode** (Gemini). This is the default.
- **LibreOffice** is included for `.ppt/.pptx/.docx` → PDF conversion.
- First build is slow (LibreOffice + deps); subsequent deploys are cached.
- The free-tier Gemini quota (5/min) will rate-limit a live site — upgrade the key for real use.

## Local production test (optional)
```bash
docker build -f Dockerfile.railway -t lecturemate .
docker run -p 5000:5000 --env-file .env lecturemate
# open http://localhost:5000
```
