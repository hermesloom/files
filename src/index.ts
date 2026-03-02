// src/index.ts
import express from "express";
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
