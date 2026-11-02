// Session 5: live prices (fetch mocked), Report a problem, and the "choose the spot yourself?" question.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  // live prices: mock the network
  await p.evaluate(() => { window.fetch = async (u) => { const sym = String(u).split("/").pop(); if (sym === "HG") throw new Error("down"); return { ok: true, json: async () => ({ price: { XAU: 4000.126, XAG: 50.5, XPT: 1500 }[sym] }) }; }; });
  await p.evaluate(() => go("options")); await p.waitForTimeout(150);
  await p.click("#spotFetch"); await p.waitForTimeout(400);
  ok("prices filled in, copper kept", await p.evaluate(() => { const s = settings(); return s.spot.gold === 4000.13 && s.spot.silver === 50.5 && s.spot.platinum === 1500 && s.spot.copper == null; }));
  ok("last updated stamp saved", await p.evaluate(() => !!settings().spotUpdated));
  await p.evaluate(() => { window.fetch = async () => { throw new Error("offline"); }; });
  await p.click("#spotFetch"); await p.waitForTimeout(300);
  ok("failed fetch keeps old prices", await p.evaluate(() => settings().spot.gold === 4000.13));
  ok("report button present", await p.evaluate(() => !!document.querySelector("[data-act=reportProblem]")));
  // box spot question
  await p.evaluate(() => { put("b_t", { kind: "box", id: "t", name: "Test box", rows: 2, perRow: 3, createdAt: 1 }); });
  const d = { boxId: "t", boxRow: "", boxSlot: "" };
  ok("asks first, nothing filled", await p.evaluate((d) => { const h = boxFields(d); return h.includes("Choose the spot yourself?") && !d.boxRow; }, d));
  ok("No fills next free spot", await p.evaluate((d) => { d._spotAsk = "no"; boxFields(d); return d.boxRow === "1" && d.boxSlot === "1"; }, d));
  ok("Yes leaves it blank", await p.evaluate(() => { const e = { boxId: "t", boxRow: "", boxSlot: "", _spotAsk: "yes" }; boxFields(e); return !e.boxRow && !e.boxSlot; }));
  ok("a coin with a spot isn't asked", await p.evaluate(() => !boxFields({ boxId: "t", boxRow: "2", boxSlot: "2" }).includes("Choose the spot")));
  ok("blank spot can't be saved", await p.evaluate(() => boxCheck({ id: "z", boxId: "t", boxRow: "", boxSlot: "", _spotAsk: "yes" }).startsWith("Pick a")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
