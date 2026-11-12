# 將雲路上架 Apple App Store

iOS 原生殼、文案、圖示、私隱頁同 iPhone 6.9" 截圖已經齊。  
**呢部雲端電腦冇 Xcode，亦唔能夠代你付款或按 Submit for Review。** 你要用 **ngkasum18@gmail.com** 加入 Apple Developer Program，再喺 Mac 上傳。

## 而家已準備好

| 項目 | 狀態 |
|------|------|
| Bundle ID | `com.yunlu.app` |
| 版本 | 1.0 (build 1)，iPhone only |
| 後端 | https://yunlu-upload.onrender.com/ |
| 私隱政策 | https://yunlu-upload.onrender.com/privacy.html |
| 支援 | https://yunlu-upload.onrender.com/support.html |
| App Store 文案 | `store/app-store/metadata/` |
| 1024 圖示 | `store/app-store/icons/AppIcon-1024.png` |
| iPhone 截圖 | `store/app-store/screenshots/` |
| 審核備註 | `store/app-store/review/notes.txt`（拆除密碼 1014） |

## 你要做嘅 4 步（必須用你嘅 Apple 帳戶）

### 1. 加入 Apple Developer Program（每年 USD $99）

用 **ngkasum18@gmail.com** 打開：  
https://developer.apple.com/programs/enroll/

未付款前，App Store Connect 唔可以建立 App，Xcode 亦簽唔到正式 IPA。

### 2. 喺 App Store Connect 建立 App

1. 登入 https://appstoreconnect.apple.com → My Apps → **+**
2. 先去 [Identifiers](https://developer.apple.com/account/resources/identifiers/list) 建立 Bundle ID：`com.yunlu.app`
3. 建立 App：
   - Name：雲路 Yunlu
   - Bundle ID：`com.yunlu.app`
   - SKU：`yunlu-app`
   - 平台：iOS
4. 類別：Productivity（次要 Photo & Video）
5. 年齡：4+
6. 私隱政策 URL：https://yunlu-upload.onrender.com/privacy.html
7. 支援 URL：https://yunlu-upload.onrender.com/support.html
8. 把 `store/app-store/metadata/` 同 `store/app-store/screenshots/` 嘅文字／PNG 貼上去
9. 圖示用 `store/app-store/icons/AppIcon-1024.png`

### 3. 喺 Mac 用 Xcode 封包上傳

```bash
git clone https://github.com/ngkasum18-maker/yunlu-upload.git
cd yunlu-upload
npm install
npx cap sync ios
npx cap open ios
```

Xcode：

1. Target **App** → Signing & Capabilities → Team 選 **ngkasum18@gmail.com**
2. Bundle Identifier 確認係 `com.yunlu.app`
3. 裝置選 **Any iOS Device (arm64)**
4. Product → Archive
5. Distribute App → App Store Connect → Upload

### 4. 送審

1. App Store Connect 揀剛上傳嘅 build
2. 貼上 `store/app-store/review/notes.txt`
3. Export Compliance：只用標準 HTTPS → **No**
4. 廣告識別符 → **No**
5. **Submit for Review**

審核通常數小時到數日。被拒最常見係 Guideline 4.2（純網頁套殼）——本 App 已有原生相機／相簿。

## 無法代你完成

- 付款加入 Apple Developer Program
- 用你嘅 Team 簽署 IPA
- 喺 App Store Connect 撳 Submit

請唔好把 Apple 密碼傳俾任何人。
