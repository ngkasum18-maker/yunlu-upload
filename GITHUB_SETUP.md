# GitHub 設定指引 — 雲路 Yunlu

呢個 repo 已經係 **Public**：https://github.com/ngkasum18-maker/yunlu-upload

## 正式永久網站

**https://yunlu-upload.onrender.com**

已部署喺 Render，資料存喺永久磁碟（`DATA_DIR=/var/data`）。

## 1. 合併 Railway 部署 PR（可選）

如果仲想加 Railway 一鍵部署設定，可合併：

**https://github.com/ngkasum18-maker/yunlu-upload/pull/5**

撳 **Merge pull request** → **Confirm merge**。

## 2. 連接 GitHub 到 Railway（可選）

1. 打開 Railway 一鍵連結：  
   https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Fngkasum18-maker%2Fyunlu-upload%2Ftree%2Fcursor%2Frailway-one-click-deploy-94c0&envs=DATA_DIR%2CNODE_ENV&DATA_DIRDefault=%2Fdata&NODE_ENVDefault=production
2. 用 **Login with GitHub** 登入並授權 repo
3. Deploy 後加 Volume（`/data`）同 Generate Domain

## 3.（可選）GitHub Actions 自動部署

1. Railway → Account Settings → Tokens 建立 API Token
2. GitHub repo → Settings → Secrets and variables → Actions
3. 新增 `RAILWAY_TOKEN`（同可選 `RAILWAY_SERVICE_ID`）
4. workflow：`.github/workflows/railway-deploy.yml`
