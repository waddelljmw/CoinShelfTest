// Step 2.10 review fixes: CSV columns, export/import round trip, duplicates, box spots on return.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);

  // 1. Older spreadsheet headings go to the right fields.
  const r1 = await p.evaluate(() => {
    loadImportText("Year,Coin type,Grading service,Grade,Serial,Weight oz,Metal,Details\n1921,Morgan Dollar,PCGS,MS-63,12345678,,,Nice toning\n1990,Silver medal,,,,1.5,Silver,from grandpa", "old.csv");
    const out = importCoins().map((x) => x.coin); closeSheet(); return out;
  });
  ok("Serial goes to cert", r1[0].cert === "12345678");
  ok("Details column isn't read as problems", !(r1[0].problems || []).length && !(r1[1].problems || []).length);
  ok("Weight oz is metal content for a medal", +r1[1].oz === 1.5 && r1[1].metal === "Silver");

  // 3. Export then import keeps group, case, gone, kind, box, carrier.
  const r3 = await p.evaluate(async () => {
    const box = { kind: "box", id: "bx1", name: "Black box 1", rows: 2, perRow: 3, createdAt: 1 }; await put("b_bx1", box);
    const mk = (o) => ({ ...blankCoin(), ...o });
    const coins = [
      mk({ typeId: "lincoln-wheat", typeName: "Lincoln Wheat", family: "Lincoln", denom: "1C", year: 1910, grade: "F-12", group: "Grandpa", holder: "2x2", boxId: "bx1", boxRow: "1", boxSlot: "2", trackCarrier: "UPS" }),
      mk({ typeId: "lincoln-wheat", typeName: "Lincoln Wheat", family: "Lincoln", denom: "1C", year: 1943, grade: "VF-20", holder: "Hard case", caseName: "Steel cents case" }),
      mk({ typeName: "Masonic token", family: "Token", year: 1980, status: "gone", gone: { reason: "Gifted", date: "2026-01-02" } }),
    ];
    const csv = toCsv(coins);
    loadImportText(csv, "round.csv");
    const out = importCoins().map((x) => x.coin);
    closeSheet(); return { out, csv };
  });
  const [w, s, t] = r3.out;
  ok("group kept", w.group === "Grandpa");
  ok("carrier kept", w.trackCarrier === "UPS");
  ok("box name, row, slot kept", w._boxName === "Black box 1" && w.boxRow === "1" && w.boxSlot === "2");
  ok("case name kept", s.caseName === "Steel cents case");
  ok("gone reason and date kept", t.status === "gone" && t.gone.reason === "Gifted" && t.gone.date === "2026-01-02");
  ok("kind kept", t.family === "Token");

  // 4. Bars and rolls aren't duplicates of different things.
  const r4 = await p.evaluate(async () => {
    const bar = { ...blankCoin(), item: "bullion", bShape: "Bar", bWeight: "10", bPurity: "0.999", typeName: "Bullion", family: "Bullion", year: "", metal: "Silver" };
    const cent = { ...blankCoin(), typeId: "lincoln-wheat", typeName: "Lincoln Wheat", year: 1910, grade: "" };
    await put("c_" + bar.id, bar); await put("c_" + cent.id, cent);
    const round = { ...bar, id: "x1", bShape: "Round", bWeight: "1" };
    const roll = { ...cent, id: "x2", item: "roll", rollCount: 50 };
    return { round: isDuplicate(round), roll: isDuplicate(roll), same: isDuplicate({ ...bar, id: "x3" }) };
  });
  ok("1 oz round isn't a duplicate of a 10 oz bar", !r4.round);
  ok("roll isn't a duplicate of a single coin", !r4.roll);
  ok("same bar still flagged", r4.same);

  // Old export with "Weight (oz)" for bars still reads the bar weight.
  const r5 = await p.evaluate(() => {
    loadImportText("Item,Weight (oz),Purity,Year,Coin type,Metal oz\nBar,10,0.999,,Bullion,9.99", "v022.csv");
    const c = importCoins()[0].coin; closeSheet(); return c;
  });
  ok("older bar export keeps weight", r5.item === "bullion" && r5.bWeight === "10");

  // 2. A coin coming back to a taken box spot leaves the box.
  const r2 = await p.evaluate(async () => {
    const a = { ...blankCoin(), typeId: "lincoln-wheat", typeName: "Lincoln Wheat", year: 1911, holder: "2x2", boxId: "bx1", boxRow: "2", boxSlot: "1" };
    await put("c_" + a.id, a);
    actions.delete({ dataset: { id: a.id } });
    const bb = { ...blankCoin(), typeId: "lincoln-wheat", typeName: "Lincoln Wheat", year: 1912, holder: "2x2", boxId: "bx1", boxRow: "2", boxSlot: "1" };
    await put("c_" + bb.id, bb);
    actions.restore({ dataset: { id: a.id } });
    const back = getCoin(a.id);
    return { owned: back.status === "owned", out: !back.boxId, msg: document.querySelector("#toast").textContent, bStays: getCoin(bb.id).boxId === "bx1" };
  });
  ok("restored coin is owned", r2.owned);
  ok("restored coin leaves the taken spot", r2.out && r2.bStays);
  ok("toast explains it", /Nothing special/.test(r2.msg));

  console.log("errors", errors);
  await b.close();
})();
