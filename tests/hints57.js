// Item 57: small help hints (blank fields, Raw vs Certified, PCGS link under grade, + button after first coin)
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (c, m) => { if (!c) console.log("FAIL " + m); };
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  ok(/left blank/.test(await p.textContent("#blankHint")), "blank hint");
  ok(/loose/i.test(await p.textContent("#rawHint")), "raw hint");
  await p.click("[data-act=gmode][data-v=cert]");
  ok(/sealed/i.test(await p.textContent("#rawHint")), "certified hint");
  const order = await p.evaluate(() => { const g = document.querySelector("[data-f=grade]"), l = document.querySelector("#pcgsLink"); return !!(g.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING); });
  ok(order, "pcgs link after grade");
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=grade]", "MS-65");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok(/\+ button/.test(await p.textContent("#toast, .toast")), "first coin + pointer");
  console.log("errors", errors); await b.close();
})();
