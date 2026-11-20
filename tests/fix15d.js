// 15d: no empty "Same as last" chip, no eBay in premium list, import preview shows a dash (not face value) with no metal prices.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, v, x) => console.log((v ? "ok " : "FAIL ") + n + (x !== undefined ? " " + JSON.stringify(x) : ""));
  await p.evaluate(() => { openCoinForm(); }); await p.waitForTimeout(150);
  ok("n1 no 'Same as last' chip with nothing to repeat", !/Same as last/.test(await p.textContent("#coinForm")));
  const src = require("fs").readFileSync(require("path").resolve(__dirname, "../views.js"), "utf8");
  ok("r65 premium rows have no eBay link", !/premium\.map[^\n]*ebayUrl/.test(src));
  const toastCss = require("fs").readFileSync(require("path").resolve(__dirname, "../styles.css"), "utf8");
  ok("n3 toast moves to the top while a pop-up is open", /#sheet:not\(\[hidden\]\)\) \.toast\s*\{[^}]*top:/.test(toastCss));
  const v = await p.evaluate(() => { const c = { typeId: "morgan-dollar", year: 1881, mint: "S", grade: "MS-63", metal: "Silver", qty: 1 }; let r; try { r = (typeof meltEach === "function" && meltEach(c) == null); } catch (e) { r = "err"; } return r; });
  ok("n4 no melt without metal prices (so import preview dashes)", v === true, v);
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
