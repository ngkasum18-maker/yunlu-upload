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

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只接受相片檔案"));
    }
  },
});

app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/photos", (_req, res) => {
  const items = readManifest().sort((a, b) => b.createdAt - a.createdAt);
  res.json({ photos: items });
});

app.post("/api/photos", upload.array("photos", 20), (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "未揀到相片" });
  }

  const manifest = readManifest();
  const added = files.map((file) => ({
    id: path.parse(file.filename).name,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    url: `/uploads/${file.filename}`,
    createdAt: Date.now(),
  }));

  writeManifest([...added, ...manifest]);
  res.status(201).json({ photos: added });
});

app.delete("/api/photos/:id", (req, res) => {
  const manifest = readManifest();
  const photo = manifest.find((p) => p.id === req.params.id);
  if (!photo) {
    return res.status(404).json({ error: "搵唔到相片" });
  }

  const filePath = path.join(UPLOAD_DIR, photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  writeManifest(manifest.filter((p) => p.id !== req.params.id));
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "檔案太大，上限 15MB" });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(400).json({ error: err.message || "上載失敗" });
});

app.listen(PORT, () => {
  console.log(`Yunlu upload running at http://localhost:${PORT}`);
});
