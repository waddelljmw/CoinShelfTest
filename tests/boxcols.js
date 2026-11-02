// Box columns: a box's spots can run in columns instead of rows. Old boxes stay rows.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    put("b_old", { kind: "box", id: "old", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 });
    put("c_w1", { kind: "coin", id: "w1", status: "owned", typeId: COIN_TYPES[0].id, year: 1944, boxId: "old", boxRow: "2", boxSlot: "1", createdAt: 2 });
  });
  ok("old box reads as rows", await p.evaluate(() => !getBox("old").cols && boxText(getCoin("w1")).includes("Row 2")));
  // switch it to columns through Edit box
  await p.evaluate(() => go("box-old")); await p.waitForTimeout(150);
  await p.click("[data-act=boxEdit]"); await p.selectOption("[name=dir]", "cols"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  ok("saved as columns", await p.evaluate(() => getBox("old").cols === true && getBox("old").rows === 2));
  ok("coin keeps its spot, shown as a column", await p.evaluate(() => getCoin("w1").boxRow === "2" && getCoin("w1").boxSlot === "1" && boxText(getCoin("w1")).includes("Column 2")));
  await p.evaluate(() => go("box-old")); await p.waitForTimeout(150);
  ok("page draws columns side by side", await p.evaluate(() => { const g = document.querySelector(".slots.cols"); return !!g && g.querySelectorAll(".col-head").length === 2 && g.querySelectorAll(".slot").length === 6 && g.querySelectorAll(".slot")[1].classList.contains("full"); }));
  ok("next free spot fills column 1 first", await p.evaluate(() => { const n = nextFreeSpot(getBox("old")); return n.row === 1 && n.slot === 1; }));
  ok("taken spot message says column", await p.evaluate(() => boxCheck({ id: "x", boxId: "old", boxRow: "2", boxSlot: "1" }).startsWith("Column 2")));
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
  // and back to rows
  await p.click("[data-act=boxEdit]"); await p.selectOption("[name=dir]", "rows"); await p.click("#boxForm button[type=submit]"); await p.waitForTimeout(250);
  ok("back to rows", await p.evaluate(() => !("cols" in getBox("old")) && boxText(getCoin("w1")).includes("Row 2")));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
