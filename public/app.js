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
    del.textContent = "刪除";
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
    setStatus("刪除失敗，請再試", "is-error");
    return;
  }
  setStatus("已刪除相片", "is-ok");
  await loadPhotos();
}

function uploadFiles(files) {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (!list.length) {
    setStatus("請揀相片檔案（JPG、PNG、WebP 等）", "is-error");
    return;
  }

  const formData = new FormData();
  for (const file of list) formData.append("photos", file);

  progress.hidden = false;
  progressBar.style.width = "8%";
  progressLabel.textContent = `上載緊 ${list.length} 張…`;
  setStatus("");

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
      setStatus(`成功上載 ${count} 張相片`, "is-ok");
      fileInput.value = "";
      await loadPhotos();
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

loadPhotos().catch(() => {
  setStatus("暫時讀唔到相冊", "is-error");
  empty.hidden = false;
});
