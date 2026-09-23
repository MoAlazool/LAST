// Writes dist/public/_redirects for Netlify after `vite build`.
//  - /uploads/*  → proxied to the backend (images/PDFs stored by the server; fast, static)
//  - /*          → index.html (client-side routing)
// API calls do NOT go through Netlify: the client calls VITE_API_BASE_URL directly,
// because Netlify's proxy cuts requests off after ~26 s and AI processing takes longer.
import fs from "fs";
import path from "path";

const base = String(process.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
const out = path.resolve("dist/public/_redirects");

if (!base) {
  const msg = "[netlify] VITE_API_BASE_URL is not set — the deployed site would have no backend. " +
    "Set it in Netlify → Site configuration → Environment variables (e.g. https://your-backend.up.railway.app).";
  if (process.env.NETLIFY === "true") {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}
if (base && !/^https:\/\//.test(base) && process.env.NETLIFY === "true") {
  console.error(`[netlify] VITE_API_BASE_URL must be an https:// URL (got "${base}").`);
  process.exit(1);
}

const lines = [
  ...(base ? [`/uploads/*  ${base}/uploads/:splat  200`] : []),
  "/*  /index.html  200",
];
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`[netlify] wrote ${out}:\n${lines.join("\n")}`);
