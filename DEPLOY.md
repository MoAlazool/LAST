# Deploying LectureMate to Railway

LectureMate is a **single Node server** that serves the React client **and** the `/api`
backend, and shells out to Python (`yt-dlp`, `PyMuPDF`) + `ffmpeg` + LibreOffice.
It therefore needs a real container host for the backend. This guide uses **Railway** with the
included `Dockerfile`. The React client can additionally be hosted on **Netlify**
(see "Frontend on Netlify" below) while the backend stays on Railway.

## 1. Prerequisites
- A GitHub repo with this code (e.g. https://github.com/MoAlazool/LAST).
- A **Firebase** project with Auth + Firestore + Storage enabled (already set up: `lecturemate-d0187`).
- A **Gemini API key** (free tier is rate-limited to 5 req/min — a paid key is strongly recommended for a live site).

## 2. Create the Railway service
1. Go to https://railway.app → **New Project → Deploy from GitHub repo** → pick your repo.
2. Railway reads `railway.json` and builds with **`Dockerfile`** automatically.

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
docker build -t lecturemate .
docker run -p 5000:5000 --env-file .env lecturemate
# open http://localhost:5000
```

## Frontend on Netlify (optional; backend stays on Railway)

Netlify serves the static React client; every `/api` call goes **directly** to the Railway
backend (Netlify's proxy stops requests after ~26 s, and AI processing takes longer).
Uploaded files (`/uploads/*`) are proxied through Netlify so image paths keep working.

1. Deploy the backend on Railway first (steps above) and note its URL, e.g.
   `https://lecturemate-production.up.railway.app`.
2. Netlify → **Add new site → Import an existing project** → pick this GitHub repo.
   `netlify.toml` already sets the build command (`npm run build:netlify`), publish folder
   (`dist/public`) and Node 22 — keep the defaults Netlify shows.
3. Netlify → **Site configuration → Environment variables**:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | the Railway backend URL (https, no trailing slash) |

   The build **fails on purpose** if this is missing, so a site without a backend is never published.
4. Railway → backend service → **Variables**, allow the Netlify site to call the API:

   | Variable | Value |
   |---|---|
   | `CORS_ORIGINS` | `https://<your-site>.netlify.app` (comma-separate extra domains, e.g. a custom domain) |
   | `CORS_ALLOW_NETLIFY_PREVIEWS` | `true` *(optional — also allow `*.netlify.app` deploy previews)* |

5. Firebase Console → **Authentication → Settings → Authorized domains** → add
   `<your-site>.netlify.app` (and any custom domain), otherwise sign-in is blocked.
6. Trigger a deploy on Netlify. After changing `VITE_API_BASE_URL`, redeploy — it is baked
   into the client at build time.

Verify: open the Netlify URL, sign in, check the "free analyses left" counter loads under
**New Analysis** (that request goes to the backend), then run one analysis end to end.
