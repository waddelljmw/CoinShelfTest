// v0.82.2: the Fix-up bar is readable (dark text on its light box) and only mentions P when a mint check applies.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    fixup.on = true;
    const mk = (o) => ({ kind: "coin", id: "z", status: "owned", gradeMode: "raw", grade: "", qty: 1, mint: "", ...o });
    return { cent: fixupBar(mk({ typeId: "indian-head", year: 1864, _isNew: false })), dime: fixupBar(mk({ typeId: "mercury-dime", year: 1916, _isNew: false })) };
  });
  ok("bar words are dark on the light box", /<b style="color:#2a2418">/.test(r.cent) && /color:#4a4130/.test(r.cent));
  ok("buttons keep their own text color (card sets none)", !/background:#fff7e0;color/.test(r.cent));
  ok("1864 cent: no pick-the-mint line", !/Pick the mint/.test(r.cent));
  ok("1916 dime (D and S existed): mint line shown", /Check the mint mark/.test(r.dime) && /Pick the mint: No mint mark/.test(r.dime));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
