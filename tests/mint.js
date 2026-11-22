const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(200);
  console.log(await p.evaluate(() => {
    const t = (o) => JSON.stringify(mintageInfo({ gradeMode: "raw", ...o }));
    return [t({ typeId: "morgan-dollar", year: 1893, mint: "S", grade: "VF-20" }), t({ typeId: "morgan-dollar", year: 1888, mint: "O", grade: "VF-20", variety: "Scarface" }),
      t({ typeId: "morgan-dollar", year: 1895, grade: "PR-63" }), t({ typeId: "morgan-dollar", year: 1921, grade: "PR-63", variety: "Zerbe" }),
      t({ typeId: "peace-dollar", year: 1922, grade: "PR-63" }), t({ typeId: "washington-silver", year: 1934, grade: "F-12", variety: "Light Motto" }),
      t({ typeId: "washington-clad", year: 1976, mint: "S", grade: "MS-63", variety: "Silver Clad" }), t({ typeId: "franklin-half", year: 1955, grade: "MS-64", fbl: true }),
      t({ typeId: "washington-clad", year: 1966, grade: "MS-65", sms: true }), t({ typeId: "jefferson-nickel", year: 1950, grade: "MS-65" }), t({ typeId: "morgan-dollar", year: 1921, mint: "D", grade: "" })].join("\n");
  }));
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button >> nth=0");
  await p.fill("[data-f=year]", "1893"); await p.selectOption("[data-f=mint]", "CC"); await p.selectOption("[data-f=grade]", "VF-20");
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  await p.screenshot({ path: "/tmp/mint-detail.png" });
  console.log("errors", errors); await b.close();
})();
