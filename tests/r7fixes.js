// R7 fixes: junk silver keeps its stack when moved (R7-1), Fill spots doesn't carry a face-value source (R7-3), tax CSV gain adds shipping charged (R7-2).
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (f, a) => p.evaluate(f, a);
  await ev(() => {
    const al = (id, name) => put("a_" + id, { kind: "album", id, name, typeId: "kennedy-half-silver", typeIds: ["kennedy-half-silver"], start: 1964, end: 1964, removed: [], createdAt: 1, slots: buildSlots("kennedy-half-silver", 1964, 1964) });
    al("a1", "Kennedy one"); al("a2", "Kennedy two");
    put("c_j1", { ...blankCoin(), id: "j1", typeId: "kennedy-half-silver", typeName: "Kennedy half", year: "1964", metal: "Silver", gradeMode: "raw", grade: "Junk", qty: 1, status: "owned", albumId: "a1", stack: "My Silver Stack" });
  });
  // R7-1: move, swap-out and box slot keep the stack
  const r1 = await ev(() => {
    const c = getCoin("j1"), n1 = { ...c }; applyKept(n1, "a:a2", true);
    const n2 = { ...c }; applyKept(n2, "", true);
    const n3 = { ...c }; applyKept(n3, "b:x", true);
    const n4 = { ...c }; applyKept(n4, "a:a2"); // the coin form still clears the stack on purpose
    return { move: n1.stack, out: n2.stack, box: n3.stack, album: n1.albumId, form: n4.stack };
  });
  ok("move keeps My Silver Stack and changes the album", r1.move === "My Silver Stack" && r1.album === "a2");
  ok("swap-out and box slot keep the stack", r1.out === "My Silver Stack" && r1.box === "My Silver Stack");
  ok("picking a place in the coin form still sets one place", r1.form === "");
  // R7-3: face-value source is not carried; other sources still are
  await ev(() => { put("a_a3", { kind: "album", id: "a3", name: "Wash", typeId: "washington-clad", typeIds: ["washington-clad"], start: 1965, end: 1968, removed: [], createdAt: 3, slots: buildSlots("washington-clad", 1965, 1968) }); saveSettings({ lastFillSource: "Pocket change" }, true); openFillAlbum("a3", false); });
  await p.waitForSelector("#fillForm");
  const face = await p.inputValue("#fillSource");
  await ev(() => { closeSheet(); saveSettings({ lastFillSource: "Coin Show" }, true); }); await p.waitForTimeout(400); await ev(() => { openFillAlbum("a3", false); });
  await p.waitForSelector("#fillForm");
  const r3 = { face, show: await p.inputValue("#fillSource") };
  ok("old face source is not prefilled", r3.face === "");
  ok("a normal source (Coin Show) is still prefilled", r3.show === "Coin Show");
  // R7-2: tax CSV gain = coin page profit
  const r2 = await ev(() => {
    put("c_s1", { ...blankCoin(), id: "s1", typeId: "kennedy-half-silver", typeName: "Kennedy half", year: "1964", qty: 1, status: "sold", paid: "50", sold: { date: "2026-03-01", amount: "100", fees: "10", shipping: "5", shipCharged: "5" } });
    const row = taxData(2026).find((r) => r[0] !== undefined && r[5] === 100);
    return { gain: row ? row[7] : null, profit: saleProfit(getCoin("s1")) };
  });
  ok("tax gain matches coin profit ($40)", r2.gain === 40 && r2.profit === 40);
  ok("no page errors", errors.length === 0);
  await b.close();
})();
