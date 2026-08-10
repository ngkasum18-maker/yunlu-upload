const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const PHOTO_META = path.join(UPLOAD_DIR, "manifest.json");
const DOC_META = path.join(UPLOAD_DIR, "documents.json");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function readJson(file) {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeJson(file, items) {
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
}

const PHOTO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const WORD_MIME = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-word",
  "application/octet-stream",
]);

const WORD_EXT = new Set([".doc", ".docx"]);

function makeStorage(allowedExt, fallbackExt) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || fallbackExt;
      const safeExt = allowedExt.includes(ext) ? ext : fallbackExt;
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`);
    },
  });
}

const photoUpload = multer({
  storage: makeStorage([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"], ".jpg"),
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (PHOTO_MIME.has(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只接受相片檔案"));
    }
  },
});

const docUpload = multer({
  storage: makeStorage([".doc", ".docx"], ".docx"),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (WORD_EXT.has(ext) || WORD_MIME.has(file.mimetype)) {
      if (!WORD_EXT.has(ext)) {
        cb(new Error("只接受 Word 檔案（.doc / .docx）"));
        return;
      }
      cb(null, true);
    } else {
      cb(new Error("只接受 Word 檔案（.doc / .docx）"));
    }
  },
});

app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/photos", (_req, res) => {
  const items = readJson(PHOTO_META).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ photos: items });
});

app.post("/api/photos", photoUpload.array("photos", 20), (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "未揀到相片" });
  }

  const manifest = readJson(PHOTO_META);
  const added = files.map((file) => ({
    id: path.parse(file.filename).name,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    url: `/uploads/${file.filename}`,
    createdAt: Date.now(),
  }));

  writeJson(PHOTO_META, [...added, ...manifest]);
  res.status(201).json({ photos: added });
});

app.delete("/api/photos/:id", (req, res) => {
  const manifest = readJson(PHOTO_META);
  const photo = manifest.find((p) => p.id === req.params.id);
  if (!photo) {
    return res.status(404).json({ error: "搵唔到相片" });
  }

  const filePath = path.join(UPLOAD_DIR, photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  writeJson(
    PHOTO_META,
    manifest.filter((p) => p.id !== req.params.id)
  );
  res.json({ ok: true });
});

app.get("/api/documents", (_req, res) => {
  const items = readJson(DOC_META).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ documents: items });
});

app.post("/api/documents", docUpload.array("documents", 10), (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "未揀到 Word 檔案" });
  }

  const manifest = readJson(DOC_META);
  const added = files.map((file) => ({
    id: path.parse(file.filename).name,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    url: `/uploads/${file.filename}`,
    createdAt: Date.now(),
  }));

  writeJson(DOC_META, [...added, ...manifest]);
  res.status(201).json({ documents: added });
});

app.delete("/api/documents/:id", (req, res) => {
  const manifest = readJson(DOC_META);
  const doc = manifest.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "搵唔到文件" });
  }

  const filePath = path.join(UPLOAD_DIR, doc.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  writeJson(
    DOC_META,
    manifest.filter((d) => d.id !== req.params.id)
  );
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "檔案太大，超過上限" });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(400).json({ error: err.message || "上載失敗" });
});

app.listen(PORT, () => {
  console.log(`Yunlu upload running at http://localhost:${PORT}`);
});
