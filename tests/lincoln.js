const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const Y = await p.evaluate(() => new Date().getFullYear());
  // A Lincoln album 1909–2012 with all the Lincoln types
  const r = await p.evaluate(() => {
    const types = ["lincoln-wheat", "lincoln-memorial-copper", "lincoln-memorial-zinc", "lincoln-bicentennial", "lincoln-shield"];
    const sl = buildAlbumSlots(types, "dates", 1909, 2012);
    const lab = (s) => s.y + (s.m ? "-" + s.m : "") + (s.v ? " " + s.v : "");
    const L = sl.map(lab);
    return { n: sl.length, L, keys: new Set(sl.map(slotKey)).size === sl.length, p2009: sl.filter((s) => s.y === 2009).map(lab), y1982: sl.filter((s) => s.y === 1982).map((s) => lab(s) + "/" + s.t) };
  });
  ok("no duplicate spot keys", r.keys);
  ok("1909 VDB, 1909, 1909-S VDB, 1909-S", ["1909", "1909 VDB", "1909-S", "1909-S VDB"].every((x) => r.L.includes(x)));
  ok("1922 is D only", r.L.includes("1922-D") && !r.L.includes("1922") && !r.L.includes("1922-S"));
  ok("no S cents 1956–1967, S 1968–1974, none after", !r.L.some((x) => /^19(5[6-9]|6[0-7])-S/.test(x)) && r.L.includes("1970-S") && !r.L.includes("1975-S"));
  ok("1965–1967 no mint marks", r.L.includes("1966") && !r.L.includes("1966-D"));
  ok("2009: four designs × P and D", r.p2009.length === 8 && r.p2009.includes("2009-D Presidency"));
  ok("1982 has copper and zinc spots", r.y1982.filter((x) => x.includes("copper")).length === 2 && r.y1982.filter((x) => x.includes("zinc")).length === 2);
  ok("ends at 2012", !r.L.some((x) => +x.slice(0, 4) > 2012));
  console.log("spots:", r.n, "| 2009:", r.p2009.join(", "));
  // Add-coin flow for 2009 and 1943
  await p.click("#fab"); await p.fill("#typeSearch", "bicentennial"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "2009"); await p.waitForTimeout(100);
  const vopts = await p.evaluate(() => [...document.querySelectorAll("[data-f=variety] option")].map((o) => o.textContent));
  ok("2009 variety menu lists the four designs", ["Birth and Early Childhood", "Formative Years", "Professional Life", "Presidency"].every((v) => vopts.includes(v)));
  await p.evaluate(() => closeSheet());
  await p.click("#fab"); await p.fill("#typeSearch", "wheat"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1943"); await p.waitForTimeout(100);
  ok("1943 wheat set to steel", await p.evaluate(() => draft.metal === "Steel" && meltEach(draft) == null));
  await p.fill("[data-f=year]", "1944"); await p.waitForTimeout(100);
  ok("1944 back to copper", await p.evaluate(() => draft.metal === "Copper"));
  await p.evaluate(() => closeSheet());
  // Date limits and hints
  const yp = (t, y) => p.evaluate(([t, y]) => yearProblem(t, y, "coin"), [t, y]);
  ok("2009 under zinc points to Bicentennial", /Bicentennial/.test(await yp("lincoln-memorial-zinc", 2009)));
  ok("2026 shield allowed", !(await yp("lincoln-shield", 2026)));
  ok("2021 Morgan under classic points to modern", /2021 on/.test(await yp("morgan-dollar", 2021)));
  ok("2021 modern Morgan allowed; 1921 not", !(await yp("morgan-modern", 2021)) && !!(await yp("morgan-modern", 1921)));
  const mm = await p.evaluate(() => buildSlots("morgan-modern", 2021, 2026).map((s) => s.y + (s.m ? "-" + s.m : "")));
  ok("modern Morgan spots: 2021 P D S O CC, no 2022", ["2021", "2021-D", "2021-S", "2021-O", "2021-CC"].every((x) => mm.includes(x)) && !mm.some((x) => x.startsWith("2022")));
  // Import picks the right type by year
  const imp = await p.evaluate(() => { const g = (o) => (k) => o[k]; return [rowToCoin(g({ year: "2021", mint: "CC", typeName: "Morgan Dollar" })), rowToCoin(g({ year: "1943", typeName: "Lincoln Wheat Cent" })), rowToCoin(g({ year: "2009", mint: "D", typeName: "Lincoln Cent" }))].map((x) => (x.coin || x).typeId + "/" + (x.coin || x).metal); });
  ok("import: 2021 Morgan → modern, 1943 → steel", imp[0].startsWith("morgan-modern") && imp[1] === "lincoln-wheat/Steel");
  console.log(imp.join(" | "));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
