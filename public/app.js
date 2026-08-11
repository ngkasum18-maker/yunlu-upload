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
const lightboxName = document.getElementById("lightbox-name");
const lightboxDownload = document.getElementById("lightbox-download");
const lightboxClose = document.getElementById("lightbox-close");
const reader = document.getElementById("reader");
const readerTitle = document.getElementById("reader-title");
const readerBody = document.getElementById("reader-body");
const readerStatus = document.getElementById("reader-status");
const readerDownload = document.getElementById("reader-download");
const readerClose = document.getElementById("reader-close");
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
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const displayName = item.originalName || (kind === "document" ? "Word 文件" : "上載相片");
    const downloadUrl = `/api/files/${encodeURIComponent(item.id)}/download`;
    card.setAttribute("aria-label", `開啟閱讀 ${displayName}`);

    if (kind === "photo") {
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = displayName;
      img.loading = "lazy";

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

      const hint = document.createElement("p");
      hint.className = "doc-open";
      hint.textContent = "撳開閱讀";

      body.append(badge, title, meta, hint);
      card.appendChild(body);
    }

    const openForRead = () => {
      if (kind === "photo") openLightbox(item, displayName, downloadUrl);
      else openDocumentReader(item, displayName, downloadUrl);
    };

    card.addEventListener("click", (e) => {
      if (e.target.closest(".card-actions")) return;
      openForRead();
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openForRead();
      }
    });

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const download = document.createElement("a");
    download.className = "download";
    download.href = downloadUrl;
    download.download = displayName;
    download.textContent = "下載";
    download.title = `下載 ${displayName}`;
    download.addEventListener("click", (e) => e.stopPropagation());

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "刪除";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFile(item.id, kind);
    });

    actions.append(download, del);
    card.appendChild(actions);
    gallery.appendChild(card);
  }
}

function openLightbox(item, alt, downloadUrl) {
  lightboxImg.src = item.url || item;
  lightboxImg.alt = alt;
  if (lightboxName) {
    lightboxName.textContent = alt;
    lightboxName.title = alt;
  }
  if (lightboxDownload) {
    lightboxDownload.href = downloadUrl || "#";
    lightboxDownload.download = alt || "download";
    lightboxDownload.hidden = !downloadUrl;
  }
  lightbox.showModal();
}

function isDocxFile(item) {
  const name = (item.originalName || item.filename || "").toLowerCase();
  return name.endsWith(".docx") || (item.mimeType || "").includes("wordprocessingml");
}

async function ensureMammoth() {
  if (window.mammoth?.convertToHtml) return window.mammoth;
  throw new Error("閱讀器未載入，請刷新頁面再試");
}

async function openDocumentReader(item, displayName, downloadUrl) {
  if (!reader || !readerBody) {
    window.open(item.url, "_blank", "noopener");
    return;
  }

  readerTitle.textContent = displayName;
  readerTitle.title = displayName;
  readerDownload.href = downloadUrl;
  readerDownload.download = displayName;
  readerBody.innerHTML = "";
  const status = document.createElement("p");
  status.className = "reader-status";
  status.textContent = "載入緊文件…";
  readerBody.appendChild(status);
  reader.showModal();

  try {
    if (!isDocxFile(item)) {
      status.innerHTML =
        "呢個係舊格式 .doc，瀏覽器入面唔可以直接閱讀。<br>請撳上面「下載」用 Word／Pages 開啟。";
      return;
    }

    const mammoth = await ensureMammoth();
    const res = await fetch(item.url);
    if (!res.ok) throw new Error("讀取文件失敗");
    const buffer = await res.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    readerBody.innerHTML = "";
    const article = document.createElement("article");
    article.className = "reader-content";
    article.innerHTML = result.value || "<p>（文件冇可見文字）</p>";
    readerBody.appendChild(article);
    if (result.messages?.length) {
      const note = document.createElement("p");
      note.className = "reader-note";
      note.textContent = "部份格式可能同 Word 略有不同。";
      readerBody.appendChild(note);
    }
  } catch (err) {
    status.textContent = err?.message || "打唔開呢份文件，請改用下載。";
    status.classList.add("is-error");
  }
}

lightboxClose.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close();
});

if (readerClose) {
  readerClose.addEventListener("click", () => reader.close());
}
if (reader) {
  reader.addEventListener("click", (e) => {
    if (e.target === reader) reader.close();
  });
}

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
    setStatus("網絡錯誤，上載失敗。請刷新頁面或用最新公開連結再試。", "is-error");
    progress.hidden = true;
  });

  xhr.addEventListener("timeout", () => {
    setStatus("上載逾時，請檢查網絡後再試。", "is-error");
    progress.hidden = true;
  });

  xhr.timeout = 120000;
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

/* ---------- Progressive Web App (installable) ---------- */
const installBtn = document.getElementById("install-btn");
const installDialog = document.getElementById("install-dialog");
const installDialogLead = document.getElementById("install-dialog-lead");
const installSteps = document.getElementById("install-steps");
let deferredInstallPrompt = null;

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edg/i.test(ua);
  const isChromium = /chrome|crios|edg|chromium/i.test(ua) && !/fxios/i.test(ua);
  return { isIOS, isAndroid, isSafari, isChromium };
}

function installGuideForPlatform() {
  const { isIOS, isAndroid, isSafari, isChromium } = detectPlatform();

  if (isIOS) {
    return {
      lead: isSafari
        ? "iPhone／iPad 要用 Safari 先可以加到主畫面。"
        : "請改用 Safari 打開呢個網站，然後跟住下面步驟。",
      steps: [
        "撳底欄（或頂欄）嘅「分享」掣 ▢↑",
        "向下搵並撳「加到主畫面」",
        "再撳「加入」完成安裝",
      ],
    };
  }

  if (isAndroid) {
    return {
      lead: "Android 可以將雲路安裝成 App。",
      steps: [
        "撳瀏覽器右上角「⋮」選單",
        "揀「安裝應用程式」或「加到主畫面」",
        "確認安裝後，主畫面會出現「雲路」圖示",
      ],
    };
  }

  if (isChromium) {
    return {
      lead: "電腦 Chrome／Edge 可以安裝雲路 App。",
      steps: [
        "撳網址列右側嘅安裝圖示（電腦圖／＋）",
        "或者打開選單 →「安裝雲路…」／「應用程式」→「安裝呢個網站作為應用程式」",
        "安裝後可喺開始選單／Launchpad 開啟",
      ],
    };
  }

  return {
    lead: "你可以將雲路加到主畫面當 App 用。",
    steps: [
      "打開瀏覽器選單",
      "揀「安裝應用程式」或「加到主畫面」",
      "確認後用主畫面圖示開啟雲路",
    ],
  };
}

function showInstallDialog(extraLead = "") {
  if (!installDialog || !installSteps) {
    setStatus("請用瀏覽器選單「加到主畫面」安裝 App", "is-ok");
    return;
  }

  const guide = installGuideForPlatform();
  if (installDialogLead) {
    installDialogLead.textContent = extraLead ? `${extraLead} ${guide.lead}` : guide.lead;
  }
  installSteps.innerHTML = "";
  for (const step of guide.steps) {
    const li = document.createElement("li");
    li.textContent = step;
    installSteps.appendChild(li);
  }

  if (typeof installDialog.showModal === "function") {
    installDialog.showModal();
  } else {
    setStatus(guide.steps.join(" → "), "is-ok");
  }
}

async function handleInstallClick() {
  setStatus("準備安裝…", "is-ok");

  if (isStandaloneApp()) {
    setStatus("你而家已經用緊雲路 App", "is-ok");
    installBtn.hidden = true;
    return;
  }

  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice.outcome === "accepted") {
        setStatus("已開始安裝雲路 App", "is-ok");
        installBtn.hidden = true;
        return;
      }
      setStatus("已取消自動安裝", "is-ok");
      showInstallDialog("你取消咗自動安裝。");
      return;
    } catch {
      deferredInstallPrompt = null;
      showInstallDialog("自動安裝失敗。");
      return;
    }
  }

  showInstallDialog("呢個瀏覽器冇自動安裝彈窗。");
}
if (installBtn) {
  if (isStandaloneApp()) {
    installBtn.hidden = true;
  } else {
    installBtn.hidden = false;
    installBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleInstallClick();
    });
  }
}

if (installDialog) {
  installDialog.addEventListener("click", (e) => {
    if (e.target === installDialog) installDialog.close();
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn && !isStandaloneApp()) {
    installBtn.hidden = false;
    installBtn.textContent = "安裝 App";
  }
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  if (installBtn) installBtn.hidden = true;
  if (installDialog?.open) installDialog.close();
  setStatus("雲路 App 已安裝到裝置", "is-ok");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}
