# 將雲路上架 Apple App Store

這個 repo 已準備 iOS 原生殼（Capacitor）：相機、相簿、App Store 資料、私隱政策。  
**真正上傳仍需你自己的 Apple Developer 帳戶（每年 USD $99）和一部裝了 Xcode 的 Mac。** 沒有這些，任何雲端環境都無法代你按「Submit for Review」。

## 1. 先部署永久後端（必做）

App 會連你的雲路伺服器，不是 iCloud。

1. 按 [Deploy to Render](https://render.com/deploy?repo=https://github.com/ngkasum18-maker/yunlu-upload)
2. 記下 HTTPS 網址，例如 `https://yunlu-upload.onrender.com`
3. 打開 `public/native-config.js`，改成：

```js
window.YUNLU_API_BASE = "https://你的網址.onrender.com";
```

4. 確認這些頁可以在瀏覽器打開（Apple 審核會檢查）：
   - `/privacy.html` 私隱政策
   - `/support.html` 支援
   - `/terms.html` 使用條款

## 2. 在 App Store Connect 建立 App

1. 加入 [Apple Developer Program](https://developer.apple.com/programs/)
2. 用 **ngkasum18@gmail.com** 登入 [App Store Connect](https://appstoreconnect.apple.com) → My Apps → +
3. 填寫：
   - Name：雲路 Yunlu
   - Bundle ID：`com.yunlu.app`（先在 Certificates, Identifiers & Profiles 建立）
   - SKU：`yunlu-app`
   - Platform：iOS
4. 類別：Productivity
5. 年齡分級：4+
6. 私隱政策 URL：`https://你的網址/privacy.html`
7. 支援 URL：`https://你的網址/support.html`
8. 準備帳號／示範密碼：拆除密碼 `1014`（寫在審核備註）

文案已放在 `store/app-store/metadata/`，可直接複製。

## 3. 在 Mac 用 Xcode 封包

```bash
git clone https://github.com/ngkasum18-maker/yunlu-upload.git
cd yunlu-upload
npm install
npx cap sync ios
npx cap open ios
```

Xcode 內：

1. 選 target **App**
2. Signing & Capabilities → Team 選 **ngkasum18@gmail.com**（加入 Developer Program 後會出現）
3. 確認 Bundle Identifier 是 `com.yunlu.app`
4. 確認 Info 有相機／相簿用途說明
5. 選 Any iOS Device → Product → Archive
6. Distribute App → App Store Connect → Upload

或用 Fastlane（已設定 `fastlane/Fastfile`）：

```bash
bundle exec fastlane ios release
```

## 4. 上架截圖

Apple 最少要一組 iPhone 6.9" 截圖（例如 1320×2868）。  
請用模擬器或真機影：

1. 首頁上載區（影相／相簿／揀檔案）
2. 檔案庫有相片
3. 相片放大預覽
4. Word 閱讀畫面

把 PNG 放到 `store/app-store/screenshots/zh-Hant/`。

App Store 1024×1024 圖示：`store/app-store/icons/AppIcon-1024.png`

## 5. 送審

1. App Store Connect 選擇剛上傳的 build
2. 貼上 `store/app-store/review/notes.txt` 作為審核備註
3. Export Compliance：只用標準 HTTPS，選「No」額外加密
4. 廣告識別符：No
5. Submit for Review

審核通常數小時到數日。被拒時最常見是 Guideline 4.2（只是網站套殼）——本專案已加原生相機／相簿，並把 UI 包進 App。

## 無法代你完成的步驟

- 付款加入 Apple Developer Program
- 用你的 Team 簽署 IPA
- 在 App Store Connect 按 Submit

Apple ID 已設為 **ngkasum18@gmail.com**（`fastlane/Appfile`）。請唔好把 Apple 密碼傳俾任何人。

完成 Render 永久網址後告訴我，我可以再改 `native-config.js` 和上架文案裡的連結。

下一步：用同一個電郵加入 [Apple Developer Program](https://developer.apple.com/programs/enroll/)，然後喺 Mac 用 Xcode 以呢個帳戶簽署並上傳。
