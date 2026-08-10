const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const pickBtn = document.getElementById("pick-btn");
const statusEl = document.getElementById("status");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const gallery = document.getElementById("gallery");
const empty = document.getElementById("empty");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

const docForm = document.getElementById("doc-form");
const docInput = document.getElementById("doc-input");
const docPickBtn = document.getElementById("doc-pick-btn");
const docStatus = document.getElementById("doc-status");
const docProgress = document.getElementById("doc-progress");
const docProgressBar = document.getElementById("doc-progress-bar");
const docProgressLabel = document.getElementById("doc-progress-label");
const docList = document.getElementById("doc-list");
const docEmpty = document.getElementById("doc-empty");

function setStatus(el, message, kind = "") {
  el.textContent = message;
  el.classList.remove("is-error", "is-ok");
  if (kind) el.classList.add(kind);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts) {
  try {
    return new Intl.DateTimeFormat("zh-HK", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function isWordFile(file) {
  const name = (file.name || "").toLowerCase();
  return name.endsWith(".doc") || name.endsWith(".docx");
}

async function loadPhotos() {
  const res = await fetch("/api/photos");
  if (!res.ok) throw new Error("讀取相冊失敗");
  const data = await res.json();
  renderGallery(data.photos || []);
}

function renderGallery(photos) {
  gallery.innerHTML = "";
  empty.hidden = photos.length > 0;

  for (const photo of photos) {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.dataset.id = photo.id;

    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = photo.originalName || "上載相片";
    img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(photo.url, img.alt));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "拆除";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deletePhoto(photo.id);
    });

    card.append(img, del);
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

async function deletePhoto(id) {
  const res = await fetch(`/api/photos/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    setStatus(statusEl, "拆除失敗，請再試", "is-error");
    return;
  }
  setStatus(statusEl, "已拆除相片", "is-ok");
  await loadPhotos();
}

function uploadFiles(files) {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (!list.length) {
    setStatus(statusEl, "請揀相片檔案（JPG、PNG、WebP 等）", "is-error");
    return;
  }

  const formData = new FormData();
  for (const file of list) formData.append("photos", file);

  progress.hidden = false;
  progressBar.style.width = "8%";
  progressLabel.textContent = `上載緊 ${list.length} 張…`;
  setStatus(statusEl, "");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/photos");

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
      const count = (payload.photos || []).length;
      setStatus(statusEl, `成功上載 ${count} 張相片`, "is-ok");
      fileInput.value = "";
      await loadPhotos();
    } else {
      setStatus(statusEl, payload.error || "上載失敗", "is-error");
    }

    setTimeout(() => {
      progress.hidden = true;
      progressBar.style.width = "0%";
    }, 600);
  });

  xhr.addEventListener("error", () => {
    setStatus(statusEl, "網絡錯誤，上載失敗", "is-error");
    progress.hidden = true;
  });

  xhr.send(formData);
}

pickBtn.addEventListener("click", () => fileInput.click());
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

async function loadDocuments() {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new Error("讀取文件失敗");
  const data = await res.json();
  renderDocuments(data.documents || []);
}

function renderDocuments(documents) {
  docList.innerHTML = "";
  docEmpty.hidden = documents.length > 0;

  for (const doc of documents) {
    const item = document.createElement("li");
    item.className = "doc-item";
    item.dataset.id = doc.id;

    const meta = document.createElement("div");
    meta.className = "doc-meta";

    const name = document.createElement("p");
    name.className = "doc-name";
    name.textContent = doc.originalName || doc.filename;

    const detail = document.createElement("p");
    detail.className = "doc-detail";
    detail.textContent = `${formatBytes(doc.size)} · ${formatDate(doc.createdAt)}`;

    meta.append(name, detail);

    const actions = document.createElement("div");
    actions.className = "doc-actions";

    const download = document.createElement("a");
    download.className = "doc-link";
    download.href = doc.url;
    download.download = doc.originalName || doc.filename;
    download.textContent = "下載";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "doc-delete";
    del.textContent = "拆除";
    del.addEventListener("click", () => deleteDocument(doc.id, doc.originalName));

    actions.append(download, del);
    item.append(meta, actions);
    docList.appendChild(item);
  }
}

async function deleteDocument(id, label) {
  const ok = window.confirm(`確定拆除「${label || "呢份文件"}」？拆除後唔可以復原。`);
  if (!ok) return;

  const res = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    setStatus(docStatus, "拆除失敗，請再試", "is-error");
    return;
  }
  setStatus(docStatus, "已拆除 Word 文件", "is-ok");
  await loadDocuments();
}

function uploadDocuments(files) {
  const list = Array.from(files).filter(isWordFile);
  if (!list.length) {
    setStatus(docStatus, "請揀 Word 檔案（.doc 或 .docx）", "is-error");
    return;
  }

  const formData = new FormData();
  for (const file of list) formData.append("documents", file);

  docProgress.hidden = false;
  docProgressBar.style.width = "8%";
  docProgressLabel.textContent = `上載緊 ${list.length} 份…`;
  setStatus(docStatus, "");

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/documents");

  xhr.upload.addEventListener("progress", (e) => {
    if (!e.lengthComputable) return;
    const pct = Math.max(8, Math.round((e.loaded / e.total) * 100));
    docProgressBar.style.width = `${pct}%`;
    docProgressLabel.textContent = `上載緊 ${pct}% · ${formatBytes(e.loaded)} / ${formatBytes(e.total)}`;
  });

  xhr.addEventListener("load", async () => {
    docProgressBar.style.width = "100%";
    let payload = {};
    try {
      payload = JSON.parse(xhr.responseText);
    } catch {
      payload = {};
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      const count = (payload.documents || []).length;
      setStatus(docStatus, `成功上載 ${count} 份 Word，已存喺雲端`, "is-ok");
      docInput.value = "";
      await loadDocuments();
    } else {
      setStatus(docStatus, payload.error || "上載失敗", "is-error");
    }

    setTimeout(() => {
      docProgress.hidden = true;
      docProgressBar.style.width = "0%";
    }, 600);
  });

  xhr.addEventListener("error", () => {
    setStatus(docStatus, "網絡錯誤，上載失敗", "is-error");
    docProgress.hidden = true;
  });

  xhr.send(formData);
}

docPickBtn.addEventListener("click", () => docInput.click());
docInput.addEventListener("change", () => {
  if (docInput.files?.length) uploadDocuments(docInput.files);
});

["dragenter", "dragover"].forEach((eventName) => {
  docForm.addEventListener(eventName, (e) => {
    e.preventDefault();
    docForm.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  docForm.addEventListener(eventName, (e) => {
    e.preventDefault();
    docForm.classList.remove("is-dragover");
  });
});

docForm.addEventListener("drop", (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) uploadDocuments(files);
});

docForm.addEventListener("submit", (e) => e.preventDefault());

loadPhotos().catch(() => {
  setStatus(statusEl, "暫時讀唔到相冊", "is-error");
  empty.hidden = false;
});

loadDocuments().catch(() => {
  setStatus(docStatus, "暫時讀唔到 Word 文件", "is-error");
  docEmpty.hidden = false;
});
