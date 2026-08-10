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

- 拖放 / 點選 / 貼上（Ctrl/⌘ + V）上載相片（JPG、PNG、WebP、GIF 等）同 Word（DOC、DOCX）
- 上載進度顯示
- 雲端檔案庫：篩選全部／相片／Word
- 相片預覽放大；Word 可下載／開啟
- 刪除記錄（同步刪除實體檔案）
- 檔案存喺伺服器 `uploads/` 目錄（部署後即雲端儲存）

## API

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/files` | 列出所有檔案 |
| `POST` | `/api/files` | 上載檔案（`multipart/form-data`，欄位名 `files`） |
| `DELETE` | `/api/files/:id` | 刪除檔案記錄 |
| `GET` | `/api/photos` | 只列出相片（相容舊版） |
| `POST` | `/api/photos` | 上載相片（欄位名 `photos`） |
| `DELETE` | `/api/photos/:id` | 刪除相片 |
