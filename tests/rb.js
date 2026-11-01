const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html"));
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const t = (o) => { const c = { typeId: "franklin-half", gradeMode: "raw", ...o }; return [bookText(bookLookup(c)), valueEach(c)]; };
    return {
      ms64_1953S: t({ year: 1953, mint: "S", grade: "MS-64" }),
      ms65fbl_1953S: t({ year: 1953, mint: "S", grade: "MS-65", fbl: true }),
      vf_1950: t({ year: 1950, mint: "", grade: "VF-20" }),
      au58_1949D: t({ year: 1949, mint: "D", grade: "AU-58" }),
      ms67_1949D: t({ year: 1949, mint: "D", grade: "MS-67" }),
      pr65_1956: t({ year: 1956, grade: "PR-65", variety: "Variety 1" }),
      pr65_1961ddr: t({ year: 1961, grade: "PR-65", variety: "Doubled Die Reverse" }),
      pr64_1961: t({ year: 1961, grade: "PR-64", variety: "" }),
      ms63_1963D_P: t({ year: 1963, mint: "P", grade: "MS-63" }),
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await p.click("#fab"); await p.fill("#typeSearch", "franklin"); await p.click("#typeList button >> nth=0");
  await p.fill("[data-f=year]", "1953"); await p.selectOption("[data-f=mint]", "S"); await p.selectOption("[data-f=grade]", "MS-65");
  await p.check("[data-fcheck=fbl]");
  console.log("hint:", await p.textContent("#bookHint"));
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(60); await p.selectOption("[data-f=grade]", "PR-65"); await p.fill("[data-f=year]", "1956");
  console.log("variety:", await p.$$eval("[data-f=variety] option", (o) => o.map((x) => x.textContent)), await p.textContent("#bookHint"));
  await p.screenshot({ path: "/tmp/rb-form.png" });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  await p.screenshot({ path: "/tmp/rb-detail.png" });
  console.log("errors", errors);
  await b.close();
})();
