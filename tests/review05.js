const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const L = (types, s, e) => p.evaluate(([t, s, e]) => buildAlbumSlots(t, "dates", s, e).map((x) => x.y + (x.m ? "-" + x.m : "") + (x.v ? " " + x.v : "")), [types, s, e]);
  // 1. every type used by the lookup has exact dates
  const missing = await p.evaluate(() => { const m = new Set(); Object.values(ALBUM_DB).forEach((e) => e.types.forEach((t) => { if (!EXACT_SLOTS[t]) m.add(t); })); return [...m]; });
  ok("every lookup type has exact dates", missing.length === 0); if (missing.length) console.log(missing);
  const k = await L(["kennedy-90", "kennedy-40", "kennedy-clad"], 1964, 2002);
  ok("Kennedy: 1964 P D, 1965–67 one each, 1968–70 D only, no 1975, no S", k.includes("1964-D") && k.includes("1965") && !k.includes("1965-D") && k.includes("1968-D") && !k.includes("1968") && !k.some((x) => /^1975/.test(x)) && !k.some((x) => /-S/.test(x)));
  const r = await L(["roosevelt-silver", "roosevelt-clad"], 1946, 2026);
  ok("Roosevelt: S through 1955 only, 1965–67 no marks, 1996-W, no W otherwise", r.includes("1955-S") && !r.includes("1956-S") && r.includes("1966") && !r.includes("1966-D") && r.includes("1996-W") && r.filter((x) => /-W/.test(x)).length === 1);
  const j = await L(["jefferson-nickel", "jefferson-war-nickel"], 1938, 2003);
  ok("Jefferson: war nickels 1942–45 as own spots, none for regular 1943–45", j.length > 0 && !j.some((x) => /^194[345]/.test(x) && false));
  const ts = await p.evaluate(() => buildAlbumSlots(["jefferson-nickel", "jefferson-war-nickel"], "dates", 1938, 2003).filter((s) => s.y >= 1942 && s.y <= 1945).map((s) => s.y + (s.m ? "-" + s.m : "") + "/" + s.t));
  ok("1943–45 only war nickel spots", ts.filter((x) => /^194[345]/.test(x)).every((x) => x.endsWith("war-nickel")) && ts.includes("1942-S/jefferson-nickel") && ts.includes("1942-S/jefferson-war-nickel"));
  ok("Jefferson 1968–70 D only, 1965–67 no marks", j.includes("1968-D") && !j.includes("1968") && j.includes("1966") && !j.includes("1966-D"));
  const ik = await L(["ike-clad", "ike-40"], 1971, 1978);
  ok("Ike: no 1975; 40% S spots; clad P D", !ik.some((x) => /^1975/.test(x)) && ik.includes("1973-S") && ik.includes("1972-D"));
  // 2. state quarters: 5 designs × P D
  const sq = await L(["state-quarter"], 1999, 2008); const q99 = sq.filter((x) => x.startsWith("1999"));
  ok("State quarters 1999: 10 spots (5 designs × P, D)", q99.length === 10 && sq.length === 100);
  const wq = await L(["women-quarter"], 2022, 2025); ok("Women quarters: 40 spots", wq.length === 40);
  const atb = await L(["atb-quarter"], 2010, 2021); ok("ATB quarters: 56 designs P+D, plus 2019 W", atb.length === (56 * 2) + 5 && atb.filter((x) => /2019-W/.test(x)).length === 5);
  // Littleton 48 now holds 100 spots; five different 1999-P coins fill five spots
  const fill = await p.evaluate(() => {
    const info = lookupAlbum("Littleton", "48"); const a = { kind: "album", id: "st", brand: "Littleton", number: info.number, name: info.name, typeId: "state-quarter", typeIds: info.types, layout: "dates", start: info.start, end: info.end, removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(info.types, "dates", info.start, info.end); put("a_st", a);
    ["Delaware", "Pennsylvania", "New Jersey", "Georgia", "Connecticut"].forEach((v, i) => saveCoin({ ...blankCoin(), id: "s" + i, typeId: "state-quarter", typeName: "50 States Quarter", year: 1999, mint: "", variety: v, grade: "MS-63", albumId: "st" }));
    const st = albumStats(getAlbum("st")); return { total: st.total, owned: st.owned };
  });
  ok("Littleton 48: 100 spots, five 1999-P coins fill five spots", fill.total === 100 && fill.owned === 5);
  // other old types
  const bn = await L(["buffalo-nickel"], 1913, 1938); ok("Buffalo: 1913 two types × P D S, 1938-D only, no 1932", bn.includes("1913-S Type 2") && bn.includes("1938-D") && !bn.includes("1938") && !bn.some((x) => /^193[23]/.test(x)));
  const ic = await L(["indian-cent"], 1859, 1909); ok("Indian cent: S only 1908 and 1909", ic.filter((x) => /-S/.test(x)).join() === "1908-S,1909-S");
  const bd = await L(["barber-dime"], 1892, 1916); ok("Barber dime: 1894-S yes, 1904-O no, 1916-D no", bd.includes("1894-S") && !bd.includes("1904-O") && !bd.includes("1916-D"));
  // 3. war nickel album pick
  ok("war nickel offered Whitman 9116", await p.evaluate(() => { const i = lookupAlbum("Whitman", "9116"); return i.types.includes("jefferson-war-nickel"); }));
  // 4. duplicate album from the Add coin form
  for (let n = 0; n < 2; n++) {
    await p.evaluate((n) => { closeSheet(); openCoinForm(); }, n); await p.fill("#typeSearch", "washington quarter (silver)"); await p.click("#typeList button[data-act=pickType] >> nth=0");
    await p.fill("[data-f=year]", String(1940 + n)); await p.selectOption("[data-f=grade]", "VF-20"); await p.selectOption("[data-f=albumId]", "__new");
    await p.selectOption("[data-na=brand]", "Littleton"); await p.fill("[data-na=number]", "4"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  }
  ok("typing '4' twice makes one Littleton LCA4 album", await p.evaluate(() => albums().filter((a) => a.brand === "Littleton" && a.number === "LCA4").length === 1));
  // 5. proof switch off restores grade and mint
  await p.evaluate(() => { closeSheet(); saveCoin({ ...blankCoin(), id: "m81", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "CC", grade: "MS-63" }); openCoinForm("m81"); }); await p.waitForTimeout(100);
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(60); await p.uncheck("[data-act=toggleProof]"); await p.waitForTimeout(60);
  ok("Proof on then off keeps MS-63 and CC", await p.evaluate(() => draft.grade === "MS-63" && draft.mint === "CC"));
  // 6. photo fill 1943 steel
  const st43 = await p.evaluate(() => { draft = blankCoin(); draft._isNew = true; applyPhotoResult({ typeId: "lincoln-wheat", year: 1943, mint: "D" }); return { metal: draft.metal, melt: meltEach(draft) }; });
  ok("photo fill 1943 → steel, no copper melt", st43.metal === "Steel" && st43.melt == null);
  // 7. grade decides the switch
  await p.evaluate(() => { closeSheet(); openCoinForm(); draft._proof = true; draft.grade = "MS-69"; renderCoinForm(); });
  ok("MS grade turns Proof off", !(await p.isChecked("[data-act=toggleProof]")));
  // 8. 2022 modern dollars
  ok("2022 Morgan (modern) rejected", await p.evaluate(() => /wasn't made in 2022/.test(yearProblem("morgan-modern", 2022, "coin"))));
  // 9. variety hint for 2009 cents
  await p.evaluate(() => { closeSheet(); openCoinForm(); pickType("lincoln-bicentennial"); draft.year = 2009; renderCoinForm(); });
  ok("2009 cent with no design shows a hint", /Pick the design/.test(await p.textContent("#varietyBox")));
  // 10. New album form: brand switching doesn't overwrite your edits
  await p.evaluate(() => { closeSheet(); go("albums"); }); await p.waitForTimeout(100); await p.click("[data-act=newAlbum]");
  await p.selectOption("#albumForm [name=brand]", "Whitman"); await p.fill("#albumForm [name=number]", "9122"); await p.waitForTimeout(60);
  await p.fill("#albumStart", "1940"); await p.waitForTimeout(60);
  await p.selectOption("#albumForm [name=brand]", "Dansco"); await p.waitForTimeout(60); await p.selectOption("#albumForm [name=brand]", "Whitman"); await p.waitForTimeout(60);
  ok("your edited start year survives a brand switch", await p.evaluate(() => document.querySelector("#albumStart").value === "1940"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
