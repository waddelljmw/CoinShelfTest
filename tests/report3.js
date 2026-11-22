// Report filters (idea 61): Business stock and "on the way" left out by default; presets; kind and metal.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { window.__saved = null; const d = { save: async (r) => { window.__saved = r; return { status: "saved" }; } }; window.claude = { use: async (n) => (n === "downloads" ? d : null) }; });
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(500);
  await p.evaluate(() => {
    saveSettings({ spot: { gold: 3884.9, silver: 49.14 } });
    const mk = (o) => saveCoin({ ...blankCoin(), ...o });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1881, grade: "VF-20", value: "50" });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1882, grade: "VF-20", value: "50", biz: true });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1883, grade: "VF-20", value: "50", stage: "coming" });
    mk({ typeId: "indian-2-5", typeName: "Indian Head $2.50 Gold", family: "Classic gold", denom: "$2.50", metal: "Gold", oz: 0.12094, year: 1910, grade: "AU-53", value: "600" });
  });
  const run = async () => { await p.evaluate(() => { window.__saved = null; }); await p.click("[data-act=makeReport]"); await p.waitForTimeout(300); return p.evaluate(() => window.__saved.data); };
  await p.click("#menuBtn"); await p.click("#menu [data-act=openReport]");
  console.log("default count:", await p.textContent("#repAllN"));
  let h = await run(); console.log("default: has 1881", h.includes("1881 Morgan"), "no 1882 biz", !h.includes("1882 Morgan"), "no 1883 coming", !h.includes("1883 Morgan"));
  await p.click("#menuBtn"); await p.click("#menu [data-act=openReport]");
  await p.click("[data-act=repPreset][data-v=inventory]");
  console.log("inventory count:", await p.textContent("#repAllN"));
  h = await run(); console.log("inventory: all 4", ["1881 Morgan", "1882 Morgan", "1883 Morgan", "1910 Indian"].every((x) => h.includes(x)));
  await p.click("#menuBtn"); await p.click("#menu [data-act=openReport]");
  await p.selectOption("#repMetal", "Gold");
  console.log("gold count:", await p.textContent("#repAllN"));
  h = await run(); console.log("gold only:", h.includes("1910 Indian") && !h.includes("1881 Morgan"));
  await p.click("#menuBtn"); await p.click("#menu [data-act=openReport]");
  await p.selectOption("#repKind", "bullion");
  console.log("bars count:", await p.textContent("#repAllN"), "| create disabled:", await p.isDisabled("[data-act=makeReport]"));
  console.log("errors", errors); await b.close();
})();
