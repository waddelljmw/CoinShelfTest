// R5-18: a pocket album's page and card show its value and the grades inside; Hide values hides the value.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    put("b_p1", { kind: "box", id: "p1", name: "Pocket pages", type: "pocket", rows: 2, perRow: 3, createdAt: 1 });
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan dollar", year: "1881", metal: "Silver", qty: 1, status: "owned", boxId: "p1", ...o });
    mk("a", { value: "40", grade: "MS-63", boxRow: "1", boxSlot: "1" }); mk("b", { value: "60", grade: "MS-63", boxRow: "1", boxSlot: "2" }); mk("c", { value: "25", grade: "VF-20", boxRow: "1", boxSlot: "3" });
    go("box-p1");
  });
  await p.waitForTimeout(200);
  let t = await p.textContent("main");
  ok("page shows total value $125.00", /\$125\.00/.test(t));
  ok("page shows grades with counts", /2× MS-63/.test(t) && /VF-20/.test(t));
  await p.evaluate(() => go("albums")); await p.waitForTimeout(200);
  ok("album list card shows the value", /Value \$125\.00/.test(await p.textContent("main")));
  await p.evaluate(() => { saveSettings({ hideValues: true }); go("box-p1"); }); await p.waitForTimeout(200);
  t = await p.textContent("main");
  ok("Hide values hides the pocket value", !/\$125/.test(t) && /Grades:/.test(t));
  await p.evaluate(() => { saveSettings({ hideValues: false }); put("b_p2", { kind: "box", id: "p2", name: "Empty pocket", type: "pocket", rows: 1, perRow: 2, createdAt: 2 }); go("box-p2"); }); await p.waitForTimeout(200);
  ok("an empty pocket album shows no value card", !/Grades:/.test(await p.textContent("main")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
