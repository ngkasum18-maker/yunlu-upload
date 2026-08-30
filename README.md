# 雲路 Yunlu — 相片同 Word 上載

簡單嘅雲端檔案網站：拖放或揀相片／Word 文件，即刻保存，並喺檔案庫瀏覽、閱讀、下載同刪除。

## 快速開始（本機）

```bash
npm install
npm start
```

開瀏覽器去 [http://localhost:3000](http://localhost:3000)。

## 永久雲端部署（推薦）

臨時試用連結（trycloudflare）會過期。要**永久上載同保存資料**，請部署到 Render：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ngkasum18-maker/yunlu-upload)

### 步驟

1. 撳上面 **Deploy to Render**
2. 用 GitHub 登入，並授權呢個 repo：`ngkasum18-maker/yunlu-upload`
3. 建立服務（已包含 **5GB 永久磁碟** 保存上載檔案）
4. 部署完成後，Render 會俾一個永久網址，例如：  
   `https://yunlu-upload.onrender.com`
5. 之後用呢個網址上載／瀏覽／下載；手機亦可「安裝 App」

環境變數：

| 變數 | 說明 | 預設 |
|------|------|------|
| `PORT` | 服務埠 | `3000` |
| `DATA_DIR` | 上載資料永久目錄 | `uploads/`（本機）或 `/var/data`（Render） |

## 功能

- 拖放 / 點選 /「貼上」掣或 Ctrl/⌘ + V 上載相片（JPG、PNG、WebP、GIF 等）同 Word（DOC、DOCX）
- 上載進度顯示
- 雲端檔案庫：篩選全部／相片／Word，顯示檔案總數
- 顯示預覽人數：網站訪客、瀏覽次數、每個檔案被打開幾多次
- 相片預覽放大；Word（.docx）撳開即可閱讀；相片同 Word 都可下載（保留中文檔名）
- Word 顯示完整檔名標題
- 刪除記錄（同步刪除實體檔案）
- 可安裝 App（PWA）：手機／電腦加到主畫面
- 部署後檔案存喺永久磁碟（`DATA_DIR`）

## 安裝成 App

1. 用手機或電腦瀏覽器打開**永久網站**（需 HTTPS）
2. 撳右上角 **安裝 App**
3. 或者：
   - **Android / Chrome**：選單 → 安裝應用程式
   - **iPhone / iPad（Safari）**：分享 → 加到主畫面
   - **桌面 Chrome / Edge**：網址列右側安裝圖示

## API

| Method | Path | 說明 |
|--------|------|------|
| `GET` | `/api/health` | 健康檢查 |
| `GET` | `/api/stats` | 預覽人數（訪客、瀏覽、檔案預覽） |
| `POST` | `/api/stats/visit` | 記錄一次網站瀏覽 |
| `POST` | `/api/stats/preview` | 記錄一次檔案預覽（`{ id }`） |
| `GET` | `/api/files` | 列出所有檔案 |
| `POST` | `/api/files` | 上載檔案（`multipart/form-data`，欄位名 `files`） |
| `GET` | `/api/files/:id/download` | 下載檔案（保留中文檔名） |
| `DELETE` | `/api/files/:id` | 刪除檔案記錄 |
| `GET` | `/api/photos` | 只列出相片（相容舊版） |
| `POST` | `/api/photos` | 上載相片（欄位名 `photos`） |
| `DELETE` | `/api/photos/:id` | 刪除相片 |
