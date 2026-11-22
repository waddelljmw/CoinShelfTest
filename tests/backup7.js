// Process update 11-19: the Home backup reminder shows after 7 days (was 30), not before.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  const r = await p.evaluate(() => {
    const c = blankCoin(); put("c_" + c.id, c);
    const ago = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const at = (n) => { saveSettings({ lastBackup: ago(n) }); return backupReminder(); };
    return { d6: at(6), d8: at(8), never: (saveSettings({ lastBackup: "" }), backupReminder()) };
  });
  ok("no reminder at 6 days", r.d6 === "");
  ok("reminder at 8 days", /days ago/.test(r.d8));
  ok("reminder when never backed up", /haven't saved/.test(r.never));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
