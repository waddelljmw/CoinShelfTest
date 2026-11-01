const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(200);
  console.log(await p.evaluate(() => {
    const t = (o) => bookText(bookLookup({ gradeMode: "raw", ...o }));
    return [
      t({ typeId: "washington-silver", year: 1932, mint: "D", grade: "VF-20" }),
      t({ typeId: "washington-silver", year: 1949, mint: "", grade: "MS-63" }),
      t({ typeId: "washington-silver", year: 1943, mint: "", grade: "AU-50", variety: "Doubled Die Obverse" }),
      t({ typeId: "washington-silver", year: 1964, mint: "", grade: "MS-65", sms: true }),
      t({ typeId: "washington-silver", year: 1952, grade: "PR-65", variety: "Superbird" }),
      t({ typeId: "washington-clad", year: 1983, mint: "P", grade: "MS-65" }),
      t({ typeId: "washington-clad", year: 1976, mint: "S", grade: "MS-63", variety: "Silver Clad" }),
      t({ typeId: "washington-clad", year: 1966, grade: "MS-66", sms: true }),
      t({ typeId: "washington-clad", year: 1990, grade: "PR-67", variety: "Doubled Die Obverse" }),
      t({ typeId: "washington-clad", year: 1989, mint: "P", grade: "MS-65" }),
    ].join("\n");
  }));
  await p.click("#fab"); await p.fill("#typeSearch", "washington silver"); await p.click("#typeList button >> nth=0");
  await p.fill("[data-f=year]", "1934");
  console.log("1934:", await p.$$eval("[data-f=variety] option", (o) => o.map((x) => x.textContent)));
  await p.fill("[data-f=year]", "1964"); await p.selectOption("[data-f=grade]", "MS-65");
  console.log("sms box:", await p.$$eval("[data-fcheck=sms]", (o) => o.length), await p.textContent("#bookHint"));
  await p.check("[data-fcheck=sms]"); console.log(await p.textContent("#bookHint"));
  console.log("errors", errors); await b.close();
})();
