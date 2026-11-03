// Links that land on a folded Options section open it (IDEAS 30).
const { chromium } = require("playwright"); // plain: _compat would auto-open Options sections
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const isOpen = (key) => p.evaluate((k) => { const el = document.querySelector(`[data-act=optSec][data-v="${k}"]`); return el && el.getAttribute("aria-expanded") === "true"; }, key);
  // Home spot-price link → Options with Spot prices open
  await p.evaluate(() => saveSettings({ hideSpot: {}, optOpen: {} })); await p.waitForTimeout(150);
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  await p.click(".sh-spot"); await p.waitForTimeout(250);
  if (!(await isOpen("spot-prices"))) console.log("FAIL spot prices not open after tapping the Home prices");
  // Reports link (Seller Mode off) → Options with Seller Mode open
  await p.evaluate(() => saveSettings({ optOpen: {} })); await p.evaluate(() => go("reports")); await p.waitForTimeout(250);
  await p.click("main [data-open=seller-mode]"); await p.waitForTimeout(250);
  if (!(await isOpen("seller-mode"))) console.log("FAIL seller mode not open after tapping Options link on Reports");
  // Plain menu visit leaves sections as they were (closed)
  await p.evaluate(() => saveSettings({ optOpen: {} })); await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  if (await isOpen("spot-prices")) console.log("FAIL plain Options visit should keep sections closed");
  console.log("errors", errors); await b.close();
})();
