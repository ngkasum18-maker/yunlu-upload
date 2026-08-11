# GitHub 設定指引 — 雲路 Yunlu

呢個 repo 已經係 **Public**：https://github.com/ngkasum18-maker/yunlu-upload

## 1. 合併 Railway 部署 PR

打開並合併：

**https://github.com/ngkasum18-maker/yunlu-upload/pull/5**

撳 **Merge pull request** → **Confirm merge**。

## 2. 連接 GitHub 到 Railway（一鍵部署用）

1. 打開 Railway 一鍵連結：  
   https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Fngkasum18-maker%2Fyunlu-upload%2Ftree%2Fcursor%2Frailway-one-click-deploy-94c0&envs=DATA_DIR%2CNODE_ENV&DATA_DIRDefault=%2Fdata&NODE_ENVDefault=production
2. 用 **Login with GitHub** 登入
3. 如果要授權 repo：
   - 揀 **Configure GitHub App** / **Grant access**
   - 允許 `ngkasum18-maker/yunlu-upload`（或 All repositories）
4. 撳 **Deploy**
5. 部署後：
   - **Variables**：`DATA_DIR=/data`、`NODE_ENV=production`
   - **Settings → Volumes → Add Volume**，Mount Path=`/data`
   - **Settings → Networking → Generate Domain**

## 3.（可選）GitHub Actions 自動部署

如果你想每次 `git push` 去 `main` 就自動更新 Railway：

1. 喺 Railway 專案 → **Account Settings → Tokens** 建立 API Token
2. 去 GitHub repo → **Settings → Secrets and variables → Actions**
3. 新增 Secret：
   - Name：`RAILWAY_TOKEN`
   - Value：你嘅 Railway token
4. 再新增 Secret（可選）：
   - Name：`RAILWAY_SERVICE_ID`（服務 ID）
5. workflow 檔案：`.github/workflows/railway-deploy.yml`

## 需要你完成嘅事

- [ ] 合併 PR #5
- [ ] Railway 用 GitHub 登入並授權 repo
- [ ] Generate Domain 後把永久網址回覆
