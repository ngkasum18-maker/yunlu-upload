const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, "uploads");
const UPLOAD_DIR = DATA_DIR;
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

/**
 * Browsers/multer often send non-ASCII names as Latin-1 bytes of UTF-8,
 * or as percent-encoded strings. Normalize to real Unicode (e.g. 中文檔名).
 */
function decodeOriginalName(name) {
  if (!name || typeof name !== "string") return name || "";

  let decoded = name.trim();

  try {
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
      decoded = decodeURIComponent(decoded.replace(/\+/g, "%20"));
    }
  } catch {
    // keep current value
  }

  const hasCjk = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(decoded);
  if (!hasCjk) {
    try {
      const asUtf8 = Buffer.from(decoded, "latin1").toString("utf8");
      if (
        asUtf8 &&
        asUtf8 !== decoded &&
        !asUtf8.includes("\uFFFD") &&
        /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(asUtf8)
      ) {
        decoded = asUtf8;
      }
    } catch {
      // keep current value
    }
  }

  // Strip path segments some clients include
  decoded = decoded.replace(/^.*[/\\]/, "");
  return decoded || name;
}

function contentDisposition(filename) {
  const fallback = String(filename || "file")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_") || "file";
  const encoded = encodeURIComponent(filename || "file").replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function readManifest() {
  try {
    if (!fs.existsSync(META_FILE)) return [];
    const items = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
    if (!Array.isArray(items)) return [];

    let changed = false;
    const normalized = items.map((item) => {
      const originalName = decodeOriginalName(item.originalName || item.filename || "");
      if (originalName && originalName !== item.originalName) {
        changed = true;
        return { ...item, originalName };
      }
      return item;
    });

    if (changed) writeManifest(normalized);
    return normalized;
  } catch {
    return [];
  }
}

function writeManifest(items) {
  fs.writeFileSync(META_FILE, JSON.stringify(items, null, 2), "utf8");
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
    originalName: decodeOriginalName(file.originalname),
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
app.use(
  express.static(path.join(ROOT, "public"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith("manifest.webmanifest")) {
        res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      }
      if (filePath.endsWith("sw.js")) {
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Service-Worker-Allowed", "/");
      }
    },
  })
);
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/files/:id/download", (req, res) => {
  const item = listFiles().find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "搵唔到檔案" });
  }

  const filePath = path.join(UPLOAD_DIR, item.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "檔案已唔存在" });
  }

  res.setHeader("Content-Type", item.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", contentDisposition(item.originalName || item.filename));
  res.sendFile(filePath);
});

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

/* ---------- Tutoring Centre API (cloud JSON storage) ---------- */
const TUTOR_DIR = path.join(UPLOAD_DIR, "tutor");
if (!fs.existsSync(TUTOR_DIR)) fs.mkdirSync(TUTOR_DIR, { recursive: true });

function tutorFile(name) { return path.join(TUTOR_DIR, name); }

function readTutorJSON(name) {
  try {
    const p = tutorFile(name);
    if (!fs.existsSync(p)) return name === "info.json" ? {} : [];
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return data;
  } catch { return name === "info.json" ? {} : []; }
}

function writeTutorJSON(name, data) {
  fs.writeFileSync(tutorFile(name), JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/tutor/courses", (_req, res) => {
  res.json({ courses: readTutorJSON("courses.json") });
});

app.post("/api/tutor/courses", (req, res) => {
  const courses = readTutorJSON("courses.json");
  const body = req.body || {};
  if (body.id) {
    const idx = courses.findIndex((c) => c.id === body.id);
    if (idx >= 0) {
      courses[idx] = { ...courses[idx], ...body, updatedAt: Date.now() };
    } else {
      return res.status(404).json({ error: "搵唔到課程" });
    }
  } else {
    courses.push({
      id: `crs-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      ...body,
      createdAt: Date.now(),
    });
  }
  writeTutorJSON("courses.json", courses);
  res.json({ ok: true, courses });
});

app.delete("/api/tutor/courses/:id", (req, res) => {
  let courses = readTutorJSON("courses.json");
  const before = courses.length;
  courses = courses.filter((c) => c.id !== req.params.id);
  if (courses.length === before) return res.status(404).json({ error: "搵唔到課程" });
  writeTutorJSON("courses.json", courses);
  res.json({ ok: true });
});

app.get("/api/tutor/announcements", (_req, res) => {
  const items = readTutorJSON("announcements.json");
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ announcements: items });
});

app.post("/api/tutor/announcements", (req, res) => {
  const items = readTutorJSON("announcements.json");
  const body = req.body || {};
  if (body.id) {
    const idx = items.findIndex((a) => a.id === body.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...body, updatedAt: Date.now() };
    } else {
      return res.status(404).json({ error: "搵唔到公告" });
    }
  } else {
    items.push({
      id: `ann-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      ...body,
      createdAt: Date.now(),
    });
  }
  writeTutorJSON("announcements.json", items);
  res.json({ ok: true, announcements: items });
});

app.delete("/api/tutor/announcements/:id", (req, res) => {
  let items = readTutorJSON("announcements.json");
  const before = items.length;
  items = items.filter((a) => a.id !== req.params.id);
  if (items.length === before) return res.status(404).json({ error: "搵唔到公告" });
  writeTutorJSON("announcements.json", items);
  res.json({ ok: true });
});

app.get("/api/tutor/info", (_req, res) => {
  res.json({ info: readTutorJSON("info.json") });
});

app.post("/api/tutor/info", (req, res) => {
  const info = { ...readTutorJSON("info.json"), ...req.body, updatedAt: Date.now() };
  writeTutorJSON("info.json", info);
  res.json({ ok: true, info });
});

app.get("/api/tutor/teachers", (_req, res) => {
  const teachers = readTutorJSON("teachers.json");
  teachers.sort((a, b) => (a.name || "").localeCompare(b.name || "", "zh-Hant"));
  res.json({ teachers });
});

app.post("/api/tutor/teachers", (req, res) => {
  const teachers = readTutorJSON("teachers.json");
  const body = req.body || {};
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: "請填寫導師姓名" });
  }

  if (body.id) {
    const idx = teachers.findIndex((t) => t.id === body.id);
    if (idx >= 0) {
      teachers[idx] = { ...teachers[idx], ...body, updatedAt: Date.now() };
    } else {
      return res.status(404).json({ error: "搵唔到導師" });
    }
  } else {
    teachers.push({
      id: `tch-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      name: String(body.name).trim(),
      subject: body.subject || "",
      qualification: body.qualification || "",
      experience: body.experience || "",
      bio: body.bio || "",
      photoUrl: body.photoUrl || "",
      createdAt: Date.now(),
    });
  }
  writeTutorJSON("teachers.json", teachers);
  res.json({ ok: true, teachers });
});

app.delete("/api/tutor/teachers/:id", (req, res) => {
  let teachers = readTutorJSON("teachers.json");
  const before = teachers.length;
  teachers = teachers.filter((t) => t.id !== req.params.id);
  if (teachers.length === before) return res.status(404).json({ error: "搵唔到導師" });
  writeTutorJSON("teachers.json", teachers);
  res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "yunlu-upload",
    dataDir: UPLOAD_DIR,
    files: readManifest().length,
  });
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Yunlu upload running at http://0.0.0.0:${PORT}`);
  console.log(`Data directory: ${UPLOAD_DIR}`);
});
