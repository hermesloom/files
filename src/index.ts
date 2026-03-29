// src/index.ts
import express from "express";
import { readdir } from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If your folder layout is:
//  - public/
//  - src/index.ts
// then ../public from this file is correct.
const PUBLIC_DIR = path.resolve(__dirname, "../public");

const app = express();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.get("/", async (_req, res, next) => {
  try {
    const entries = await readdir(PUBLIC_DIR, { withFileTypes: true });
    const items = entries
      .map((e) => ({
        name: e.name,
        kind: e.isDirectory() ? ("directory" as const) : ("file" as const),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const rows = items
      .map((item) => {
        const segment = encodeURIComponent(item.name);
        const href =
          item.kind === "directory" ? `/${segment}/` : `/${segment}`;
        const label =
          item.kind === "directory" ? `${item.name}/` : item.name;
        return `<li><a href="${href}">${escapeHtml(label)}</a></li>`;
      })
      .join("\n");

    res
      .type("html")
      .send(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Files</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.35rem 0; }
  </style>
</head>
<body>
  <h1>Files</h1>
  <ul>
${rows || "<li><em>(empty)</em></li>"}
  </ul>
</body>
</html>`
      );
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      res.status(404).type("text/plain").send("Public directory not found");
      return;
    }
    next(err);
  }
});

// Serve static files from /public
app.use(
  express.static(PUBLIC_DIR, {
    etag: true,
    maxAge: "1h",
    fallthrough: true,
    setHeaders: (res, filePath) => {
      // Help some proxies/clients by setting a content type for PDFs explicitly
      if (path.extname(filePath).toLowerCase() === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Serving static files from ${PUBLIC_DIR}`);
});
