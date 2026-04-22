import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT ?? 3000);

const app = express();

// Serve built assets
app.use(
  express.static(distDir, {
    index: false,
    // Let the platform handle compression; keep caching simple/portable.
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// SPA fallback (TanStack Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving dist on port ${port}`);
});

