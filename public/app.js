const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const pickBtn = document.getElementById("pick-btn");
const pasteBtn = document.getElementById("paste-btn");
const statusEl = document.getElementById("status");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const gallery = document.getElementById("gallery");
const empty = document.getElementById("empty");
const fileCountEl = document.getElementById("file-count");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
const filterButtons = document.querySelectorAll(".filter");

const WORD_EXTS = [".doc", ".docx"];
let allFiles = [];
let activeFilter = "all";

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.classList.remove("is-error", "is-ok");
  if (kind) statusEl.classList.add(kind);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts) {
  try {
    return new Intl.DateTimeFormat("zh-HK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

function isWordFile(file) {
  const name = (file.name || "").toLowerCase();
  return (
    WORD_EXTS.some((ext) => name.endsWith(ext)) ||
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function isAllowedUpload(file) {
  return file.type.startsWith("image/") || isWordFile(file);
}

function fileKind(item) {
  if (item.kind) return item.kind;
  const name = (item.originalName || item.filename || "").toLowerCase();
  if (WORD_EXTS.some((ext) => name.endsWith(ext))) return "document";
  return "photo";
}

async function loadFiles() {
  const res = await fetch("/api/files");
  if (!res.ok) throw new Error("讀取檔案庫失敗");
  const data = await res.json();
  allFiles = data.files || [];
  renderGallery();
}

function countByKind() {
  let photos = 0;
  let documents = 0;
  for (const item of allFiles) {
    if (fileKind(item) === "document") documents += 1;
    else photos += 1;
  }
  return { total: allFiles.length, photos, documents };
}

function updateFileCounts() {
  const { total, photos, documents } = countByKind();

  const countNodes = document.querySelectorAll(".filter-count");
  countNodes.forEach((node) => {
    const key = node.dataset.count;
    if (key === "photo") node.textContent = String(photos);
    else if (key === "document") node.textContent = String(documents);
    else node.textContent = String(total);
  });

  if (!fileCountEl) return;

  if (activeFilter === "photo") {
    fileCountEl.textContent = `相片合共 ${photos} 個檔案`;
  } else if (activeFilter === "document") {
    fileCountEl.textContent = `Word 合共 ${documents} 個檔案`;
  } else {
    fileCountEl.textContent = `合共 ${total} 個檔案（相片 ${photos} · Word ${documents}）`;
  }
}

function renderGallery() {
  gallery.innerHTML = "";
  const files = allFiles.filter((item) => activeFilter === "all" || fileKind(item) === activeFilter);
  empty.hidden = files.length > 0;
  updateFileCounts();

  if (!files.length) {
    empty.textContent =
      activeFilter === "document"
        ? "暫時未有 Word 文件。"
        : activeFilter === "photo"
          ? "暫時未有相片。"
          : "暫時未有檔案。試下上載第一個。";
  }

  for (const item of files) {
    const kind = fileKind(item);
    const card = document.createElement("article");
    card.className = kind === "document" ? "file-card is-doc" : "file-card is-photo";
    card.dataset.id = item.id;

    const displayName = item.originalName || (kind === "document" ? "Word 文件" : "上載相片");

    if (kind === "photo") {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = displayName;
      img.loading = "lazy";
      img.addEventListener("click", () => openLightbox(item.url, displayName));

      const caption = document.createElement("p");
      caption.className = "file-name";
      caption.title = displayName;
      caption.textContent = displayName;

      card.append(img, caption);
    } else {
      const body = document.createElement("div");
      body.className = "doc-body";

      const badge = document.createElement("span");
      badge.className = "doc-badge";
      badge.textContent = "WORD";

      const title = document.createElement("p");
      title.className = "doc-title";
      title.title = displayName;
      title.textContent = displayName;

      const meta = document.createElement("p");
      meta.className = "doc-meta";
      meta.textContent = `${formatBytes(item.size || 0)} · ${formatDate(item.createdAt)}`;

      const open = document.createElement("a");
      open.className = "doc-open";
      open.href = `/api/files/${encodeURIComponent(item.id)}/download`;
      open.download = displayName;
      open.textContent = "下載 / 開啟";

      body.append(badge, title, meta, open);
      card.appendChild(body);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "刪除";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFile(item.id, kind);
    });

    card.appendChild(del);
    gallery.appendChild(card);
  }
}

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.showModal();
}

lightboxClose.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});

async function deleteFile(id, kind) {
  const label = kind === "document" ? "Word 文件" : "相片";
  const confirmed = window.confirm(`確定刪除呢個${label}？`);
  if (!confirmed) return;

  const res = await fetch(`/api/files/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    setStatus("刪除失敗，請再試", "is-error");
    return;
  }
  setStatus(`已刪除${label}`, "is-ok");
  await loadFiles();
}

function uploadFiles(files) {
  const list = Array.from(files).filter(isAllowedUpload);
  if (!list.length) {
    setStatus("請揀相片或 Word 文件（DOC、DOCX）", "is-error");
    return;
  }

  const formData = new FormData();
  for (const file of list) formData.append("files", file);

  const photoCount = list.filter((f) => f.type.startsWith("image/")).length;
  const docCount = list.length - photoCount;

  progress.hidden = false;
  progressBar.style.width = "8%";
  progressLabel.textContent = `上載緊 ${list.length} 個檔案…`;
  setStatus("");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/files");

  xhr.upload.addEventListener("progress", (e) => {
    if (!e.lengthComputable) return;
    const pct = Math.max(8, Math.round((e.loaded / e.total) * 100));
    progressBar.style.width = `${pct}%`;
    progressLabel.textContent = `上載緊 ${pct}% · ${formatBytes(e.loaded)} / ${formatBytes(e.total)}`;
  });

  xhr.addEventListener("load", async () => {
    progressBar.style.width = "100%";
    let payload = {};
    try {
      payload = JSON.parse(xhr.responseText);
    } catch {
      payload = {};
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      const parts = [];
      if (photoCount) parts.push(`${photoCount} 張相片`);
      if (docCount) parts.push(`${docCount} 份 Word`);
      setStatus(`成功上載 ${parts.join("、")}`, "is-ok");
      fileInput.value = "";
      await loadFiles();
    } else {
      setStatus(payload.error || "上載失敗", "is-error");
    }

    setTimeout(() => {
      progress.hidden = true;
      progressBar.style.width = "0%";
    }, 600);
  });

  xhr.addEventListener("error", () => {
    setStatus("網絡錯誤，上載失敗", "is-error");
    progress.hidden = true;
  });

  xhr.send(formData);
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter || "all";
    filterButtons.forEach((other) => {
      const selected = other === btn;
      other.classList.toggle("is-active", selected);
      other.setAttribute("aria-selected", selected ? "true" : "false");
    });
    renderGallery();
  });
});

pickBtn.addEventListener("click", () => fileInput.click());
pasteBtn.addEventListener("click", () => {
  pasteFromClipboard();
});
fileInput.addEventListener("change", () => {
  if (fileInput.files?.length) uploadFiles(fileInput.files);
});

["dragenter", "dragover"].forEach((eventName) => {
  form.addEventListener(eventName, (e) => {
    e.preventDefault();
    form.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  form.addEventListener(eventName, (e) => {
    e.preventDefault();
    form.classList.remove("is-dragover");
  });
});

form.addEventListener("drop", (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) uploadFiles(files);
});

form.addEventListener("submit", (e) => e.preventDefault());

function extensionForType(type) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type.includes("word") || type.includes("officedocument")) return "docx";
  if (type === "application/msword") return "doc";
  return "png";
}

function normalizePastedFile(file) {
  if (!file) return null;
  if (file.name && file.name !== "image.png" && file.name !== "blob") {
    return file;
  }
  const ext = extensionForType(file.type || "image/png");
  return new File([file], `paste-${Date.now()}.${ext}`, {
    type: file.type || "image/png",
    lastModified: Date.now(),
  });
}

function filesFromClipboard(clipboardData) {
  if (!clipboardData) return [];

  if (clipboardData.files?.length) {
    return Array.from(clipboardData.files).map(normalizePastedFile).filter(Boolean);
  }

  const items = clipboardData.items ? Array.from(clipboardData.items) : [];
  const files = [];

  for (const item of items) {
    if (item.kind !== "file") continue;
    const file = normalizePastedFile(item.getAsFile());
    if (file) files.push(file);
  }

  return files;
}

function flashDropzone() {
  form.classList.add("is-dragover");
  setTimeout(() => form.classList.remove("is-dragover"), 350);
}

async function filesFromClipboardApi() {
  if (!navigator.clipboard?.read) {
    throw new Error("呢個瀏覽器唔支援撳掣貼上，請改用 Ctrl/⌘ + V");
  }

  const items = await navigator.clipboard.read();
  const files = [];

  for (const item of items) {
    const types = item.types || [];
    const preferred =
      types.find((t) => t.startsWith("image/")) ||
      types.find((t) => t.includes("word") || t.includes("officedocument")) ||
      types.find((t) => t !== "text/plain" && t !== "text/html");

    if (!preferred) continue;

    const blob = await item.getType(preferred);
    const file = normalizePastedFile(
      new File([blob], `paste-${Date.now()}.${extensionForType(preferred)}`, {
        type: preferred,
        lastModified: Date.now(),
      })
    );
    if (file) files.push(file);
  }

  return files;
}

async function pasteFromClipboard() {
  try {
    const files = await filesFromClipboardApi();
    if (!files.length) {
      setStatus("剪貼簿冇相片或 Word 檔案。請先複製再試。", "is-error");
      return;
    }
    flashDropzone();
    uploadFiles(files);
  } catch (err) {
    const message = String(err?.message || err || "");
    if (/denied|permission|not allowed/i.test(message)) {
      setStatus("請允許瀏覽器讀取剪貼簿，或者改用 Ctrl/⌘ + V", "is-error");
      return;
    }
    setStatus(message || "貼上失敗，請改用 Ctrl/⌘ + V", "is-error");
  }
}

document.addEventListener("paste", (e) => {
  const target = e.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return;
  }

  const files = filesFromClipboard(e.clipboardData);
  if (!files.length) return;

  e.preventDefault();
  flashDropzone();
  uploadFiles(files);
});

loadFiles().catch(() => {
  setStatus("暫時讀唔到檔案庫", "is-error");
  empty.hidden = false;
});
