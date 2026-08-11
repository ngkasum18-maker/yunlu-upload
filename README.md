# 雲路 Yunlu — 相片同 Word 上載

簡單嘅雲端檔案網站：拖放或揀相片／Word 文件，即刻保存，並喺檔案庫瀏覽同刪除。

## 快速開始

```bash
npm install
npm start
```

開瀏覽器去 [http://localhost:3000](http://localhost:3000)。

開發模式（檔案改動自動重啟）：

```bash
npm run dev
```

## 功能

- 拖放 / 點選 /「貼上」掣或 Ctrl/⌘ + V 上載相片（JPG、PNG、WebP、GIF 等）同 Word（DOC、DOCX）
- 上載進度顯示
- 雲端檔案庫：篩選全部／相片／Word，顯示檔案總數
- 相片預覽放大；Word（.docx）撳開即可閱讀；相片同 Word 都可下載（保留中文檔名）
- 正確顯示中文檔案名稱（上載後同下載時都會保留）
- 刪除記錄（同步刪除實體檔案）
- 可安裝 App（PWA）：手機／電腦加到主畫面
- 檔案存喺伺服器 `uploads/` 目錄（部署後即雲端儲存）

## 安裝成 App

1. 用手機或電腦瀏覽器打開網站（需 HTTPS 或本機）
2. 撳右上角 **安裝 App**
3. 或者：
   - **Android / Chrome**：選單 → 安裝應用程式
   - **iPhone / iPad（Safari）**：分享 → 加到主畫面
   - **桌面 Chrome / Edge**：網址列右側安裝圖示

## API

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/files` | 列出所有檔案 |
| `POST` | `/api/files` | 上載檔案（`multipart/form-data`，欄位名 `files`） |
| `DELETE` | `/api/files/:id` | 刪除檔案記錄 |
| `GET` | `/api/photos` | 只列出相片（相容舊版） |
| `POST` | `/api/photos` | 上載相片（欄位名 `photos`） |
| `DELETE` | `/api/photos/:id` | 刪除相片 |
