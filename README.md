# 雲路 Yunlu — 相片上載

簡單嘅相片上載網站：拖放或揀相，即刻保存，並喺相冊瀏覽。

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

- 拖放 / 點選上載多張相片（JPG、PNG、WebP、GIF 等）
- 上載進度顯示
- 相冊預覽、放大同刪除
- 相片存喺本機 `uploads/` 目錄

## API

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/photos` | 列出所有相片 |
| `POST` | `/api/photos` | 上載相片（`multipart/form-data`，欄位名 `photos`） |
| `DELETE` | `/api/photos/:id` | 刪除相片 |
