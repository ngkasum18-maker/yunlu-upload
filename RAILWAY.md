# Railway 一鍵部署 — 雲路 Yunlu

用 Railway 永久上載同保存相片／Word。

## 一鍵部署

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Fngkasum18-maker%2Fyunlu-upload%2Ftree%2Fcursor%2Fphoto-word-cloud-files-94c0&envs=DATA_DIR%2CNODE_ENV&DATA_DIRDefault=%2Fdata&NODE_ENVDefault=production&referralCode=yunlu)

或者直接打開：

**https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Fngkasum18-maker%2Fyunlu-upload%2Ftree%2Fcursor%2Fphoto-word-cloud-files-94c0&envs=DATA_DIR%2CNODE_ENV&DATA_DIRDefault=%2Fdata&NODE_ENVDefault=production**

## 部署後必做（永久保存上載檔）

1. 登入 [Railway](https://railway.com)，打開剛建立嘅專案
2. 撳服務 → **Variables**，確認：
   - `DATA_DIR=/data`
   - `NODE_ENV=production`
3. 撳服務 → **Settings** → **Volumes** → **Add Volume**
   - Mount Path：`/data`
   - 建議容量：≥ 5GB
4. **Settings** → **Networking** → **Generate Domain**（產生公開網址）
5. 等重新部署完成，用新網址上載測試

完成後，上載嘅相片同 Word 會永久保存在 Volume，唔會因為臨時連結過期而消失。
