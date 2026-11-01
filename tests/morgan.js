const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(200);
  console.log(JSON.stringify(await p.evaluate(() => {
    const t = (o) => bookText(bookLookup({ typeId: "morgan-dollar", gradeMode: "raw", ...o }));
    return [t({ year: 1921, mint: "", grade: "MS-63" }), t({ year: 1893, mint: "S", grade: "VF-20" }), t({ year: 1878, mint: "", grade: "MS-64", variety: "8 Tail Feathers" }),
      t({ year: 1881, mint: "S", grade: "G-4" }), t({ year: 1895, grade: "PR-64" }), t({ year: 1888, mint: "O", grade: "MS-65", variety: "Scarface" }), t({ year: 1884, mint: "CC", grade: "MS-65" }),
      t({ year: 1921, mint: "D", grade: "XF-45" })];
  }), null, 1));
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button >> nth=0");
  await p.fill("[data-f=year]", "1878");
  console.log("1878 varieties:", await p.$$eval("[data-f=variety] option", (o) => o.map((x) => x.textContent)));
  await p.selectOption("[data-f=grade]", "MS-63"); console.log(await p.textContent("#bookHint"));
  await p.fill("[data-f=year]", "1880"); await p.selectOption("[data-f=mint]", "CC");
  console.log("1880-CC varieties:", await p.$$eval("[data-f=variety] option", (o) => o.map((x) => x.textContent)), await p.textContent("#bookHint"));
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=mint]", "S");
  console.log("1881-S variety box:", await p.$$eval("[data-f=variety]", (o) => o.length), await p.textContent("#bookHint"));
  await p.screenshot({ path: "/tmp/morgan-form.png" });
  console.log("errors", errors); await b.close();
})();
