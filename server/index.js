const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const META_FILE = path.join(UPLOAD_DIR, "manifest.json");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"]);
const WORD_EXTS = new Set([".doc", ".docx"]);
const ALLOWED_EXTS = new Set([...IMAGE_EXTS, ...WORD_EXTS]);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function kindFrom(mimeType, ext) {
  if (WORD_EXTS.has(ext) || mimeType.includes("word") || mimeType.includes("officedocument.wordprocessingml")) {
    return "document";
  }
  return "photo";
}

function readManifest() {
  try {
    if (!fs.existsSync(META_FILE)) return [];
    return JSON.parse(fs.readFileSync(META_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeManifest(items) {
  fs.writeFileSync(META_FILE, JSON.stringify(items, null, 2));
}

function extForFile(file) {
  const fromName = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTS.has(fromName)) return fromName;

  const mimeMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  };
  return mimeMap[file.mimetype] || ".bin";
}

function isAllowedFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype)) return true;
  if (file.mimetype.startsWith("image/") && IMAGE_EXTS.has(ext)) return true;
  if (WORD_EXTS.has(ext)) return true;
  return false;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeExt = extForFile(file);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFile(file)) {
      cb(null, true);
    } else {
      cb(new Error("只接受相片（JPG、PNG、WebP、GIF）或 Word 文件（DOC、DOCX）"));
    }
  },
});

function toRecord(file) {
  const ext = path.extname(file.filename).toLowerCase();
  return {
    id: path.parse(file.filename).name,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    kind: kindFrom(file.mimetype, ext),
    url: `/uploads/${file.filename}`,
    createdAt: Date.now(),
  };
}

function listFiles() {
  return readManifest()
    .map((item) => {
      if (item.kind) return item;
      const ext = path.extname(item.filename || "").toLowerCase();
      return { ...item, kind: kindFrom(item.mimeType || "", ext) };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

function deleteById(id) {
  const manifest = readManifest();
  const item = manifest.find((entry) => entry.id === id);
  if (!item) return null;

  const filePath = path.join(UPLOAD_DIR, item.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  writeManifest(manifest.filter((entry) => entry.id !== id));
  return item;
}

app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/files", (_req, res) => {
  res.json({ files: listFiles() });
});

app.post("/api/files", upload.array("files", 20), (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "未揀到檔案" });
  }

  const added = files.map(toRecord);
  writeManifest([...added, ...readManifest()]);
  res.status(201).json({ files: added });
});

app.delete("/api/files/:id", (req, res) => {
  const item = deleteById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: "搵唔到檔案" });
  }
  res.json({ ok: true });
});

// Backward-compatible photo endpoints
app.get("/api/photos", (_req, res) => {
  const photos = listFiles().filter((item) => item.kind === "photo");
  res.json({ photos });
});

app.post("/api/photos", upload.array("photos", 20), (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "未揀到相片" });
  }

  const added = files.map(toRecord);
  writeManifest([...added, ...readManifest()]);
  res.status(201).json({ photos: added, files: added });
});

app.delete("/api/photos/:id", (req, res) => {
  const item = deleteById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: "搵唔到相片" });
  }
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "檔案太大，上限 25MB" });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(400).json({ error: err.message || "上載失敗" });
});

app.listen(PORT, () => {
  console.log(`Yunlu upload running at http://localhost:${PORT}`);
});
