// Fix 5: a pocket album's back link and delete go to My Albums, not Storage
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  await p.evaluate(() => {
    put("b_pk1", { kind: "box", id: "pk1", type: "pocket", name: "Test pocket album", createdAt: 1 });
    put("b_bx1", { kind: "box", id: "bx1", type: "storage", name: "Test box", createdAt: 2 });
    go("box-pk1");
  });
  await p.waitForTimeout(200);
  ok("pocket page back link goes to My Albums", await p.evaluate(() => { const l = document.querySelector("#view .link-btn, .link-btn"); return l.dataset.go === "albums" && /My Albums/.test(l.textContent); }));
  await p.evaluate(() => go("box-bx1")); await p.waitForTimeout(200);
  ok("normal box back link still says Storage", await p.evaluate(() => { const l = document.querySelector(".link-btn"); return l.dataset.go === "boxes" && /Storage/.test(l.textContent); }));
  await p.evaluate(() => go("box-pk1")); await p.waitForTimeout(150);
  await p.evaluate(() => actions.boxDelete({ dataset: { id: "pk1" } })); await p.waitForTimeout(150);
  await p.click("#sheet button.btn.danger, #sheet .btn-danger, #sheet button:has-text('Delete album')"); await p.waitForTimeout(200);
  ok("deleting a pocket album lands on My Albums", await p.evaluate(() => location.hash.includes("albums")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
