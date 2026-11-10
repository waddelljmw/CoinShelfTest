// Fix 3: a backup says how many photos it couldn't add
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  const r = await p.evaluate(async () => {
    const c = blankCoin(); c.photos = [{ id: "nope1" }, { id: "nope2" }]; put("c_" + c.id, c);
    const orig = window.photoSrc; window.photoSrc = () => "http://127.0.0.1:1/missing.jpg";
    const data = await buildBackup();
    window.photoSrc = orig;
    return { saved: data.counts.photos, skipped: backupSkipped };
  });
  ok("two unreadable photos are counted", r.skipped === 2 && r.saved === 0);
  const src = require("fs").readFileSync(require("path").resolve(__dirname, "../backup.js"), "utf8");
  ok("message warns about skipped photos", /couldn't be added/.test(src));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
