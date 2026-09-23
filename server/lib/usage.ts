/**
 * Free-plan processing limit: FREE users get FREE_LIMIT analyses per 24-hour
 * window. The window starts with the first analysis and resets 24h later.
 *
 * State lives in Firestore `billing/{uid}` via the Admin SDK. The client can't
 * write there (the rules' catch-all denies it), so neither the plan nor the
 * counter can be changed from the browser. To make someone Pro, set
 * `plan: "pro"` on their `billing/{uid}` document in the Firebase console.
 */
import type { Express, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminApp } from "../firebaseStorage";

export const FREE_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type Plan = "free" | "pro";

export interface UsageStatus {
  plan: Plan;
  limit: number | null; // null = unlimited
  used: number;
  remaining: number | null;
  resetAt: string | null; // ISO time the current window ends (null when no window is open)
  enforced: boolean; // false when the server has no Firebase Admin credentials
}

async function uidFromRequest(req: Request): Promise<string | null> {
  const app = getAdminApp();
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!app || !token) return null;
  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function statusFrom(data: any, now: number): UsageStatus {
  const plan: Plan = data?.plan === "pro" ? "pro" : "free";
  if (plan === "pro") {
    return { plan, limit: null, used: 0, remaining: null, resetAt: null, enforced: true };
  }
  const windowStart = typeof data?.windowStart === "number" ? data.windowStart : 0;
  const open = windowStart > 0 && now - windowStart < WINDOW_MS;
  const used = open ? Math.max(0, Number(data?.used) || 0) : 0;
  return {
    plan,
    limit: FREE_LIMIT,
    used,
    remaining: Math.max(0, FREE_LIMIT - used),
    resetAt: open ? new Date(windowStart + WINDOW_MS).toISOString() : null,
    enforced: true,
  };
}

const UNENFORCED: UsageStatus = {
  plan: "free", limit: FREE_LIMIT, used: 0, remaining: FREE_LIMIT, resetAt: null, enforced: false,
};

export function registerUsageRoutes(app: Express) {
  // Current plan + remaining attempts (for the New Analysis card and the profile page).
  app.get("/api/usage", async (req: Request, res: Response) => {
    const adminApp = getAdminApp();
    if (!adminApp) return res.json(UNENFORCED);
    const uid = await uidFromRequest(req);
    if (!uid) return res.status(401).json({ error: "Sign in required" });
    try {
      const snap = await getFirestore(adminApp).collection("billing").doc(uid).get();
      res.json(statusFrom(snap.data(), Date.now()));
    } catch (e: any) {
      console.error("[usage] read failed:", e?.message);
      res.json(UNENFORCED);
    }
  });

  // Uses one attempt. Called right before a new analysis starts; 429 when the free quota is used up.
  app.post("/api/usage/consume", async (req: Request, res: Response) => {
    const adminApp = getAdminApp();
    if (!adminApp) {
      // No credentials (e.g. local dev without a service account): don't block processing.
      console.warn("[usage] Firebase Admin not configured — free-plan limit is NOT enforced");
      return res.json(UNENFORCED);
    }
    const uid = await uidFromRequest(req);
    if (!uid) return res.status(401).json({ error: "Sign in required" });

    const db = getFirestore(adminApp);
    const ref = db.collection("billing").doc(uid);
    try {
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.data() || {};
        const now = Date.now();
        const current = statusFrom(data, now);
        if (current.plan === "pro") return { ok: true, status: current };
        if ((current.remaining ?? 0) <= 0) return { ok: false, status: current };

        const windowOpen = current.resetAt !== null;
        const windowStart = windowOpen ? data.windowStart : now;
        const used = current.used + 1;
        tx.set(ref, { plan: "free", windowStart, used, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { ok: true, status: statusFrom({ plan: "free", windowStart, used }, now) };
      });
      if (!result.ok) {
        return res.status(429).json({ error: "Free plan limit reached", code: "LIMIT_REACHED", ...result.status });
      }
      res.json(result.status);
    } catch (e: any) {
      console.error("[usage] consume failed:", e?.message);
      // Fail open so a Firestore hiccup never blocks a paying user; it's logged for follow-up.
      res.json(UNENFORCED);
    }
  });
}
