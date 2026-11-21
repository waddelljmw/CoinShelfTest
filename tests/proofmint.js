// Fix 0.104.1: turning Proof on must never wipe the mint (a 1955-D became a plain 1955 and the D box stayed empty).
const { chromium } = require("./_compat");
const ok = (n, v) => console.log((v ? "ok   " : "FAIL ") + n);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => { openCoinForm(null); draft.typeId = "washington-silver"; draft.year = 1955; draft.mint = "D"; renderCoinForm(); });
  await p.evaluate(() => actions.toggleProof({ checked: true }));
  ok("mint D kept after Proof on", await p.evaluate(() => draft.mint === "D"));
  ok("warning shown", /No 1955 proofs/.test(await p.evaluate(() => (document.querySelector("#toast") || {}).textContent || "")));
  await b.close();
})();
