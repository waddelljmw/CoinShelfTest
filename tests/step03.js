const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const Y = await p.evaluate(() => new Date().getFullYear());
  const yp = (t, y, k) => p.evaluate(([t, y, k]) => yearProblem(t, y, k), [t, y, k]);
  ok("Morgan 1950 rejected", !!(await yp("morgan-dollar", 1950, "coin")));
  ok("Morgan 1881 ok", !(await yp("morgan-dollar", 1881, "coin")));
  ok("Morgan 2021 (Morgan reissue not in this type) rejected", !!(await yp("morgan-dollar", 2021, "coin")));
  ok("ongoing type (silver eagle) this year ok", !(await yp("silver-eagle", Y, "coin")));
  ok("ongoing type next year rejected", !!(await yp("silver-eagle", Y + 1, "coin")));
  ok("ended series (women quarter) 2026 rejected", !!(await yp("women-quarter", 2026, "coin")));
  ok("custom coin future rejected, past ok", !!(await yp("", Y + 1, "coin")) && !(await yp("", 1750, "coin")));
  ok("want +5 ok", !(await yp("silver-eagle", Y + 5, "want")));
  ok("want +6 rejected", !!(await yp("silver-eagle", Y + 6, "want")));
  ok("want for ended type still limited to its run", !!(await yp("morgan-dollar", Y + 2, "want")));
  ok("blank year ok", !(await yp("morgan-dollar", "", "coin")));
  // Add coin form
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1950"); await p.waitForTimeout(100);
  ok("form shows a hint", /Morgan/.test(await p.textContent("#yearHint")));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(150);
  ok("save blocked, nothing added", await p.evaluate(() => allCoins().length === 0 && !!draft));
  await p.fill("[data-f=year]", "1881"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("valid year saves", await p.evaluate(() => allCoins().length === 1));
  // Old coin with an out-of-range year can still be edited and kept
  await p.evaluate(() => { put("c_old", { ...blankCoin(), id: "old", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", year: 1950, grade: "VF-20" }); openCoinForm("old"); });
  await p.waitForTimeout(100);
  ok("old coin flagged", (await p.textContent("#yearHint")).length > 0);
  await p.evaluate(() => { draft.notes = "edited"; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  ok("old coin saves other edits, year untouched", await p.evaluate(() => getCoin("old").notes === "edited" && getCoin("old").year === 1950));
  // Want form
  await p.evaluate(() => { go("wants"); openWantForm(null); }); await p.waitForTimeout(100);
  await p.selectOption("#wantForm select[name=typeId]", "silver-eagle"); await p.fill("#wantForm [name=year]", String(Y + 6)); await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(150);
  ok("want +6 blocked", await p.evaluate(() => wants().length === 0));
  await p.fill("#wantForm [name=year]", String(Y + 5)); await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(150);
  ok("want +5 saved", await p.evaluate(() => wants().length === 1));
  // Albums
  await p.evaluate(() => closeSheet());
  const nb = await p.evaluate(() => { const f = document.createElement("form"); f.innerHTML = '<input name="typeId" value="jefferson-nickel"><input name="brand" value="Whitman"><input name="number" value="9"><input name="name" value=""><input name="start" value="1938"><input name="end" value="2200">'; const n = albums().length; doNewAlbum(f); return albums().length - n; });
  ok("new album to 2200 blocked", nb === 0);
  await p.evaluate(() => { const a = { kind: "album", id: "j1", brand: "Whitman", number: "1", name: "", typeId: "jefferson-nickel", start: 1938, end: 1940, removed: [], createdAt: 1 }; a.slots = buildSlots(a.typeId, 1938, 1940); put("a_j1", a); go("album-j1"); });
  await p.waitForTimeout(150);
  await p.click("[data-act=editAlbum]"); await p.fill("#editAlbumForm [name=end]", "2200"); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  ok("edit album to 2200 blocked", await p.evaluate(() => getAlbum("j1").end === 1940));
  await p.fill("#editAlbumForm [name=end]", String(Y)); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  ok("edit album to this year ok", await p.evaluate((Y) => getAlbum("j1").end === Y, Y));
  // Photo fill
  const pf = await p.evaluate(() => { draft = blankCoin(); draft._isNew = true; const f = applyPhotoResult({ typeId: "morgan-dollar", year: 2099, mint: null }); return { f, year: draft.year }; });
  ok("photo fill skips impossible year", pf.year === "" && pf.f.some((x) => /year skipped/.test(x)));
  // Import
  const im = await p.evaluate(() => { const c1 = { ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1950 }; return yearProblem(c1.typeId, c1.year, "coin"); });
  ok("import row with bad year is flagged", !!im);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
