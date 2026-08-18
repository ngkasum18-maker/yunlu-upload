/* Tutoring Centre frontend */
const isAdmin = new URLSearchParams(location.search).has("admin");
const adminPanel = document.getElementById("admin");
if (isAdmin && adminPanel) adminPanel.hidden = false;
if (isAdmin) {
  const adminFab = document.getElementById("admin-fab");
  if (adminFab) adminFab.hidden = true;
}

/* Mobile nav toggle */
const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => nav.classList.toggle("is-open"));
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") nav.classList.remove("is-open");
  });
}

/* State */
let courses = [];
let announcements = [];
let siteInfo = {};
const defaultAboutItems = [
  {
    key: "aboutTeachers",
    icon: "🎓",
    title: "專業師資",
    description: "擁有多年教學經驗，熟悉考試重點，針對學生弱項加強訓練。",
  },
  {
    key: "aboutSmallClass",
    icon: "📚",
    title: "小班教學",
    description: "每班人數有限，確保每位學生都得到充分關注同個別指導。",
  },
  {
    key: "aboutResults",
    icon: "📈",
    title: "成績保證",
    description: "配合度高嘅學生，成績進步率超過 90%，有口碑、有實績。",
  },
  {
    key: "aboutCloud",
    icon: "☁️",
    title: "雲端教材",
    description: "筆記、練習、錄影全部上載到雲端，隨時隨地重溫溫習。",
  },
];

/* Helpers */
function formatDate(ts) {
  try {
    return new Intl.DateTimeFormat("zh-HK", {
      year: "numeric", month: "long", day: "numeric",
    }).format(new Date(ts));
  } catch { return ""; }
}

/* ---- API ---- */
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

async function deleteJSON(url) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error("刪除失敗");
  return res.json();
}

/* ---- Load Data ---- */
async function loadAll() {
  try {
    const [c, a, i] = await Promise.all([
      fetchJSON("/api/tutor/courses"),
      fetchJSON("/api/tutor/announcements"),
      fetchJSON("/api/tutor/info"),
    ]);
    courses = c.courses || [];
    announcements = a.announcements || [];
    siteInfo = i.info || {};
  } catch {
    courses = [];
    announcements = [];
    siteInfo = {};
  }
  renderAll();
}

/* ---- Render ---- */
function renderAll() {
  renderHeroStats();
  renderAbout();
  renderCourses();
  renderAnnouncements();
  renderContact();
  if (isAdmin) {
    renderAdminAbout();
    renderAdminCourses();
    renderAdminAnnouncements();
    renderAdminInfo();
  }
}

function renderAbout() {
  const container = document.getElementById("about-content");
  if (!container) return;
  container.innerHTML = "";

  for (const item of defaultAboutItems) {
    const raw = siteInfo[item.key] || item.description;
    const card = document.createElement("div");
    card.className = "about-card";
    card.innerHTML = `
      <div class="about-icon">${item.icon}</div>
      <h3>${item.title}</h3>
      ${formatAboutBody(raw)}
    `;
    container.appendChild(card);
  }
}

function formatAboutBody(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•·\-]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return `<p>${esc(lines[0] || text || "")}</p>`;
  }

  const items = lines.map((line) => `<li>${esc(line)}</li>`).join("");
  return `<ul class="about-bullets">${items}</ul>`;
}

function renderHeroStats() {
  const el = document.getElementById("hero-stats");
  if (!el) return;
  el.innerHTML = "";
  const stats = [
    { num: courses.length || "—", label: "個課程" },
    { num: siteInfo.years || "5+", label: "年經驗" },
    { num: siteInfo.students || "200+", label: "位學生" },
  ];
  for (const s of stats) {
    const d = document.createElement("div");
    d.className = "stat";
    d.innerHTML = `<span class="stat-num">${s.num}</span><span class="stat-label">${s.label}</span>`;
    el.appendChild(d);
  }
}

function renderCourses() {
  const grid = document.getElementById("courses-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!courses.length) {
    grid.innerHTML = '<p class="empty-state">暫時未有課程資料，請稍後再嚟。</p>';
    return;
  }

  for (const c of courses) {
    const card = document.createElement("article");
    card.className = "course-card";
    card.innerHTML = `
      <h3 class="course-name">${esc(c.name)}</h3>
      <div class="course-meta">
        ${c.target ? `<span class="course-tag">${esc(c.target)}</span>` : ""}
        ${c.schedule ? `<span class="course-tag">${esc(c.schedule)}</span>` : ""}
        ${c.fee ? `<span class="course-tag fee">${esc(c.fee)}</span>` : ""}
      </div>
      ${c.description ? `<p class="course-desc">${esc(c.description)}</p>` : ""}
    `;
    grid.appendChild(card);
  }
}

function renderAnnouncements() {
  const list = document.getElementById("announce-list");
  if (!list) return;
  list.innerHTML = "";

  if (!announcements.length) {
    list.innerHTML = '<p class="empty-state">暫時未有公告。</p>';
    return;
  }

  for (const a of announcements) {
    const card = document.createElement("article");
    card.className = "announce-card";
    card.innerHTML = `
      <h3>${esc(a.title)}</h3>
      <p class="announce-date">${formatDate(a.createdAt)}</p>
      <p class="announce-body">${esc(a.content)}</p>
    `;
    list.appendChild(card);
  }
}

function renderContact() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "暫未提供";
  };
  set("contact-address", siteInfo.address);
  set("contact-phone", siteInfo.phone);
  set("contact-email", siteInfo.email);
  set("contact-hours", siteInfo.hours);
}

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

/* ---- Admin: Tabs ---- */
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("is-active"));
    document.querySelectorAll(".admin-content").forEach((c) => (c.hidden = true));
    tab.classList.add("is-active");
    const target = document.getElementById(tab.dataset.tab);
    if (target) target.hidden = false;
  });
});

/* ---- Admin: About (填寫上載資料) ---- */
const aboutForm = document.getElementById("about-form");
const aboutStatus = document.getElementById("about-status");

function setAboutStatus(message, kind = "") {
  if (!aboutStatus) return;
  aboutStatus.textContent = message;
  aboutStatus.classList.remove("is-error", "is-ok");
  if (kind) aboutStatus.classList.add(kind);
}

if (aboutForm) {
  aboutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAboutStatus("上載緊…");
    try {
      const data = {
        aboutTeachers: document.getElementById("about-teachers").value,
        aboutSmallClass: document.getElementById("about-small-class").value,
        aboutResults: document.getElementById("about-results").value,
        aboutCloud: document.getElementById("about-cloud").value,
      };
      await postJSON("/api/tutor/info", data);
      await loadAll();
      setAboutStatus("已儲存並上載，前台已更新", "is-ok");
    } catch {
      setAboutStatus("上載失敗，請再試", "is-error");
    }
  });
}

function renderAdminAbout() {
  const fields = [
    ["about-teachers", "aboutTeachers"],
    ["about-small-class", "aboutSmallClass"],
    ["about-results", "aboutResults"],
    ["about-cloud", "aboutCloud"],
  ];
  for (const [id, key] of fields) {
    const el = document.getElementById(id);
    if (el) el.value = siteInfo[key] || "";
  }
}

/* ---- Admin: Courses ---- */
const courseForm = document.getElementById("course-form");
if (courseForm) {
  courseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      id: document.getElementById("course-id").value || undefined,
      name: document.getElementById("course-name").value,
      target: document.getElementById("course-target").value,
      schedule: document.getElementById("course-schedule").value,
      fee: document.getElementById("course-fee").value,
      description: document.getElementById("course-desc").value,
    };
    await postJSON("/api/tutor/courses", data);
    courseForm.reset();
    document.getElementById("course-id").value = "";
    await loadAll();
  });
}

document.getElementById("course-reset")?.addEventListener("click", () => {
  courseForm?.reset();
  document.getElementById("course-id").value = "";
});

function renderAdminCourses() {
  const list = document.getElementById("courses-admin-list");
  if (!list) return;
  list.innerHTML = "";
  for (const c of courses) {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <span class="admin-item-name">${esc(c.name)} ${c.target ? `(${esc(c.target)})` : ""}</span>
      <div class="admin-item-actions">
        <button class="btn-edit" data-id="${c.id}">編輯</button>
        <button class="btn-del" data-id="${c.id}">刪除</button>
      </div>
    `;
    item.querySelector(".btn-edit").addEventListener("click", () => editCourse(c));
    item.querySelector(".btn-del").addEventListener("click", () => deleteCourse(c.id));
    list.appendChild(item);
  }
}

function editCourse(c) {
  document.getElementById("course-id").value = c.id;
  document.getElementById("course-name").value = c.name || "";
  document.getElementById("course-target").value = c.target || "";
  document.getElementById("course-schedule").value = c.schedule || "";
  document.getElementById("course-fee").value = c.fee || "";
  document.getElementById("course-desc").value = c.description || "";
  document.getElementById("course-name").focus();
}

async function deleteCourse(id) {
  if (!confirm("確定刪除呢個課程？")) return;
  await deleteJSON(`/api/tutor/courses/${id}`);
  await loadAll();
}

/* ---- Admin: Announcements ---- */
const announceForm = document.getElementById("announce-form");
if (announceForm) {
  announceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      id: document.getElementById("announce-id").value || undefined,
      title: document.getElementById("announce-title").value,
      content: document.getElementById("announce-content").value,
    };
    await postJSON("/api/tutor/announcements", data);
    announceForm.reset();
    document.getElementById("announce-id").value = "";
    await loadAll();
  });
}

document.getElementById("announce-reset")?.addEventListener("click", () => {
  announceForm?.reset();
  document.getElementById("announce-id").value = "";
});

function renderAdminAnnouncements() {
  const list = document.getElementById("announce-admin-list");
  if (!list) return;
  list.innerHTML = "";
  for (const a of announcements) {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <span class="admin-item-name">${esc(a.title)}</span>
      <div class="admin-item-actions">
        <button class="btn-edit" data-id="${a.id}">編輯</button>
        <button class="btn-del" data-id="${a.id}">刪除</button>
      </div>
    `;
    item.querySelector(".btn-edit").addEventListener("click", () => editAnnounce(a));
    item.querySelector(".btn-del").addEventListener("click", () => deleteAnnounce(a.id));
    list.appendChild(item);
  }
}

function editAnnounce(a) {
  document.getElementById("announce-id").value = a.id;
  document.getElementById("announce-title").value = a.title || "";
  document.getElementById("announce-content").value = a.content || "";
  document.getElementById("announce-title").focus();
}

async function deleteAnnounce(id) {
  if (!confirm("確定刪除呢個公告？")) return;
  await deleteJSON(`/api/tutor/announcements/${id}`);
  await loadAll();
}

/* ---- Admin: Site Info ---- */
const infoForm = document.getElementById("info-form");
if (infoForm) {
  infoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("info-name").value,
      address: document.getElementById("info-address").value,
      phone: document.getElementById("info-phone").value,
      email: document.getElementById("info-email").value,
      hours: document.getElementById("info-hours").value,
      whatsapp: document.getElementById("info-whatsapp").value,
    };
    await postJSON("/api/tutor/info", data);
    await loadAll();
  });
}

function renderAdminInfo() {
  document.getElementById("info-name") && (document.getElementById("info-name").value = siteInfo.name || "");
  document.getElementById("info-address") && (document.getElementById("info-address").value = siteInfo.address || "");
  document.getElementById("info-phone") && (document.getElementById("info-phone").value = siteInfo.phone || "");
  document.getElementById("info-email") && (document.getElementById("info-email").value = siteInfo.email || "");
  document.getElementById("info-hours") && (document.getElementById("info-hours").value = siteInfo.hours || "");
  document.getElementById("info-whatsapp") && (document.getElementById("info-whatsapp").value = siteInfo.whatsapp || "");
}

if (isAdmin && adminPanel) {
  requestAnimationFrame(() => {
    adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* Boot */
loadAll();
