# 將雲路上架 Apple App Store（唔使喺自己電腦裝 Xcode）

Apple **唔接受**由 Windows／Linux／手機直接上傳 iOS App。簽署 IPA 一定要用 macOS。

你可以**唔使買 Mac、唔使裝 Xcode**：用雲端 Mac（推薦 **Codemagic**）代你編譯、簽署、上傳。

仍然一定要：

1. 用 **ngkasum18@gmail.com** 加入 [Apple Developer Program](https://developer.apple.com/programs/enroll/)（每年 USD $99）
2. 喺 App Store Connect 建立 App（Bundle ID：`com.yunlu.app`）
3. 建立 App Store Connect API Key（App Manager）

呢個環境同任何非 Mac 電腦都**無法代替**上面 3 步。

正式網站：https://yunlu-upload.onrender.com/  
私隱：https://yunlu-upload.onrender.com/privacy.html  
支援：https://yunlu-upload.onrender.com/support.html  
Apple ID：ngkasum18@gmail.com

---

## 推薦：Codemagic（瀏覽器完成，唔使 Xcode）

Repo 已有 `codemagic.yaml`。

### A. Apple 帳戶（只做一次）

1. 用 ngkasum18@gmail.com 加入 Apple Developer Program 並付款
2. [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Integrations → App Store Connect API
3. 撳 + 建立 Key，權限選 **App Manager**，下載 `.p8`（只可以下載一次）
4. 記低 **Issuer ID** 同 **Key ID**
5. My Apps → + → iOS App
   - Name：雲路 Yunlu
   - Bundle ID：`com.yunlu.app`（未有就先去 Certificates, Identifiers & Profiles 建立）
   - SKU：`yunlu-app`
6. 填私隱政策 URL：https://yunlu-upload.onrender.com/privacy.html
7. 支援 URL：https://yunlu-upload.onrender.com/support.html
8. 文案可複製 `store/app-store/metadata/`

### B. Codemagic

1. 用 GitHub 登入 https://codemagic.io
2. Add application → 揀 `ngkasum18-maker/yunlu-upload`
3. Teams → Integrations → **Apple Developer Portal** → 上傳剛才嘅 API Key（名稱用 `codemagic`，同 yaml 入面 `app_store_connect: codemagic` 一致）
4. Start new build → workflow 揀 **Yunlu iOS → TestFlight**
5. 等雲端 Mac 編譯。成功後會電郵 ngkasum18@gmail.com，build 會出現喺 App Store Connect → TestFlight
6. 喺 TestFlight 用自己 iPhone 試完，再跑 **Yunlu iOS → App Store review**  
   或者喺 App Store Connect 手動 Submit for Review（較穩陣）

Codemagic 免費額度通常夠第一次上架。超額之後先要畀錢。

---

## 其他唔使本地 Xcode 嘅方法

| 方法 | 要唔要 Mac | 說明 |
|------|------------|------|
| Codemagic | 唔要 | 本 repo 已設定，最簡單 |
| GitHub Actions `macos-15` | 唔要 | 要自己放證書／API Key 做 secrets，較煩 |
| Ionic Appflow | 唔要 | 收費 |
| 自己電腦 Xcode | 要 | 見下面「可選」 |
| 只加到主畫面（PWA） | 唔要 | **唔係** App Store，用家仍然用瀏覽器 |

冇任何方法可以跳過 Apple Developer 年費。

---

## 可選：自己有 Mac 先用 Xcode

```bash
npm install
npx cap sync ios
npx cap open ios
```

Signing 選 ngkasum18@gmail.com → Archive → Upload。

---

## 截圖同送審

Apple 最少要一組 iPhone 6.9" 截圖。可以用 TestFlight 安裝後喺 iPhone 截圖。

審核備註：`store/app-store/review/notes.txt`  
拆除示範密碼：`1014`  
圖示：`store/app-store/icons/AppIcon-1024.png`

Export Compliance：只用標準 HTTPS，選 No。廣告識別符：No。

---

請唔好把 Apple 密碼傳俾任何人。API Key 只放喺 Codemagic／你自己保管。
