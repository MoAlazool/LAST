// Load .env BEFORE any other import so modules (e.g. firebaseStorage) see env vars at load time.
import "dotenv/config";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// Keep the server alive on stray async errors from third-party libraries
// (e.g. OfficeParser leaking a rejection on unsupported files) instead of crashing.
process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
});

const app = express();
const httpServer = createServer(app);

// CORS — needed when the client is hosted on another domain (e.g. Netlify) and calls this
// server directly. Allowed origins: CORS_ORIGINS (comma-separated, e.g.
// "https://lecturemate.netlify.app,https://www.example.com"); set CORS_ALLOW_NETLIFY_PREVIEWS=true
// to also accept *.netlify.app deploy previews. Same-origin requests are unaffected.
const corsOrigins = (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean);
const allowNetlifyPreviews = process.env.CORS_ALLOW_NETLIFY_PREVIEWS === "true";
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = !!origin && (corsOrigins.includes(origin) || (allowNetlifyPreviews && /^https:\/\/[a-z0-9-]+(--[a-z0-9-]+)?\.netlify\.app$/i.test(origin)));
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin!);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "Content-Type, Authorization");
    // headers the client reads from responses (PPTX download name + render status)
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Slides-Render, X-Slides-Render-Error");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS" && allowed) return res.sendStatus(204);
  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ limit: "50mb", extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const logLine = `${formattedTime} [${source}] ${message}`;
  console.log(logLine);
  try {
    fs.appendFileSync(path.join(process.cwd(), "server.log"), logLine + "\n");
  } catch (err) {
    // ignore
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Default to 8080 if not specified.
  // this serves both the API and the client.

  // Hosts like Railway/Render inject the port via $PORT; fall back to 5000 locally.
  const PORT = Number(process.env.PORT) || 5000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
