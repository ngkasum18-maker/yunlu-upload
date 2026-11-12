import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const LIVE = process.env.YUNLU_SCREENSHOT_URL || "https://yunlu-upload.onrender.com/?preview=appstore";
const CHROME = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";
const OUT_ZH = "store/app-store/screenshots/zh-Hant";
const OUT_EN = "store/app-store/screenshots/en-US";

async function waitForGallery(page) {
  await page.waitForSelector("#gallery .file-card", { timeout: 45000 });
  await page.waitForFunction(() => {
    const img = document.querySelector("#gallery .file-card.is-photo img");
    return img && img.complete && img.naturalWidth > 0;
  }, { timeout: 45000 });
}

async function prepareNativeLook(page) {
  await page.evaluate(() => {
    document.body.classList.add("is-native-app");
    const install = document.getElementById("install-btn");
    if (install) install.hidden = true;
    const camera = document.getElementById("camera-btn");
    const album = document.getElementById("album-btn");
    if (camera) camera.hidden = false;
    if (album) album.hidden = false;
    const footer = document.querySelector(".legal-footer");
    if (footer) footer.style.display = "none";
  });
}

async function shot(page, name) {
  const file = `APP_IPHONE_69_${name}.png`;
  const zhPath = path.join(OUT_ZH, file);
  await page.screenshot({ path: zhPath, type: "png" });
  fs.copyFileSync(zhPath, path.join(OUT_EN, file));
  const size = fs.statSync(zhPath).size;
  console.log(`wrote ${zhPath} (${size} bytes)`);
}

async function main() {
  fs.mkdirSync(OUT_ZH, { recursive: true });
  fs.mkdirSync(OUT_EN, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--font-render-hinting=none",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 3 });
  await page.goto(LIVE, { waitUntil: "networkidle2", timeout: 60000 });
  await waitForGallery(page);
  await prepareNativeLook(page);
  await new Promise((r) => setTimeout(r, 800));

  await shot(page, "01_home");

  await page.evaluate(() => {
    document.getElementById("gallery-title")?.scrollIntoView({ block: "start" });
  });
  await new Promise((r) => setTimeout(r, 400));
  await shot(page, "02_library");

  await page.click("#gallery .file-card.is-photo");
  await page.waitForSelector("#lightbox[open], dialog.lightbox[open]", { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 600));
  await shot(page, "03_photo");
  await page.click("#lightbox-close");
  await new Promise((r) => setTimeout(r, 300));

  await page.click("#gallery .file-card.is-doc");
  await page.waitForSelector("#reader[open], dialog.reader[open]", { timeout: 15000 });
  await page.waitForFunction(() => {
    return Boolean(document.querySelector("#reader .reader-content, #reader .reader-status"));
  }, { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 1200));
  await shot(page, "04_word");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
