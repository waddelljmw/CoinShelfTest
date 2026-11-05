// Step 9.6a: fill a full album at once (quick list) + Add coin order.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const fail = (m) => console.log("FAIL " + m), ok = (m, v) => (v ? console.log("ok   " + m) : fail(m));
  // an album of Morgan dollars 1878-1880, made through the real New album form
  await p.evaluate(() => { openNewAlbum(); });
  const typeId = await p.evaluate(() => COIN_TYPES.find((t) => /Morgan/.test(t.name)).id);
  await p.evaluate((id) => { const f = document.querySelector("#albumForm"); f.querySelector("[name=brand]").value = "Other"; f.querySelector("[name=number]").value = "Fill test"; f.querySelector("[name=fill]").value = "has"; const sel = f.querySelector("[name^=type], select.album-type, [data-album-type]"); }, typeId);
  ok("New album asks if it is empty", await p.isVisible("[name=fill]"));
  // set type, years, then submit
  await p.evaluate((id) => { const f = document.querySelector("#albumForm"); const s = [...f.querySelectorAll("select")].find((x) => [...x.options].some((o) => o.value === id)); if (s) s.value = id; f.querySelector("#albumStart").value = 1878; f.querySelector("#albumEnd").value = 1879; }, typeId);
  await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(300);
  ok("quick list opens for an album that has coins", await p.isVisible("#fillForm"));
  const n = await p.locator("#fillRows .fill-row").count();
  ok("one row per spot, all ticked", n > 4 && (await p.locator("#fillRows .fill-on:checked").count()) === n);
  // untick the first two, grade the rest of the first 3 ticked, price on each row
  await p.locator("#fillRows .fill-on").nth(0).uncheck(); await p.locator("#fillRows .fill-on").nth(1).uncheck();
  ok("counter updates", /ticked/.test(await p.textContent("#fillCount")) && (await p.textContent("#fillCount")).startsWith((n - 2) + " of " + n));
  await p.locator("#fillRows .fill-grade").nth(2).selectOption("VF-20"); await p.locator("#fillRows .fill-paid").nth(2).fill("30");
  await p.locator("#fillRows .fill-grade").nth(3).selectOption("MS-63"); await p.locator("#fillRows .fill-paid").nth(3).fill("100.50");
  await p.fill("#fillDate", "2026-01-02"); await p.fill("#fillSource", "Coin Show");
  // switching to the total keeps what was ticked and typed
  await p.click("[data-act=fillMode][data-v=total]"); await p.waitForTimeout(100);
  ok("total mode: row prices go away", (await p.locator("#fillRows .fill-paid").count()) === 0 && await p.isVisible("#fillTotal"));
  ok("total mode keeps the ticks and grades", (await p.locator("#fillRows .fill-on:checked").count()) === n - 2 && (await p.locator("#fillRows .fill-grade").nth(2).inputValue()) === "VF-20");
  await p.fill("#fillTotal", "10.01");
  await p.click("[data-act=fillGo]"); await p.waitForTimeout(400);
  let cs = await p.evaluate(() => allCoins().filter((c) => c.status === "owned").map((c) => ({ id: c.id, y: c.year, m: c.mint, g: c.grade, paid: c.paid, a: c.albumId, s: c.slotId, cid: c.cid, acq: c.acquired, src: c.source, label: c.label, h: c.holder })));
  ok("one coin per ticked spot", cs.length === n - 2);
  ok("each has own ID and spot", new Set(cs.map((c) => c.cid)).size === cs.length && cs.every((c) => c.cid && c.s && c.a));
  const sum = Math.round(cs.reduce((a, c) => a + Number(c.paid || 0), 0) * 100) / 100;
  ok("total split to the cent: " + sum, sum === 10.01);
  ok("leftover cent on the first coin", cs.slice().sort((x, y) => x.cid.localeCompare(y.cid))[0].paid === moneyCheck(cs));
  function moneyCheck(list) { const k = list.length, t = 1001, base = Math.floor(t / k); return String((base + (t - base * k)) / 100); }
  ok("date, source, label and holder saved", cs.every((c) => c.acq === "2026-01-02" && c.src === "Coin Show" && c.label && c.h === "Album"));
  ok("grades kept", cs.some((c) => c.g === "VF-20") && cs.some((c) => c.g === "MS-63"));
  const stat = await p.evaluate((id) => { const a = getAlbum(id); const s = albumStats(a); return [s.owned, s.total]; }, cs[0].a);
  ok("album shows the coins in their spots " + stat, stat[0] === n - 2);
  // Undo removes the whole batch
  await p.evaluate(() => { document.querySelector("#toast button, .toast button, [data-act=toastUndo]").click(); }); await p.waitForTimeout(200);
  ok("Undo removes the whole batch", (await p.evaluate(() => allCoins().filter((c) => c.status === "owned").length)) === 0);
  // Fill spots on the existing album: only the empty spots, price on each row by default
  await p.evaluate((id) => go("album-" + id), cs[0].a); await p.waitForTimeout(200);
  ok("album page has Fill spots", await p.isVisible("[data-act=fillSpots]"));
  await p.click("[data-act=fillSpots]"); await p.waitForTimeout(150);
  ok("price on each row is the default", (await p.locator("#fillRows .fill-paid").count()) === n);
  await p.locator("#fillRows .fill-on").evaluateAll((els, keep) => els.forEach((e, i) => { e.checked = i < keep; }), 2); await p.click("[data-act=fillGo]"); await p.waitForTimeout(300);
  ok("Fill spots adds the ticked ones", (await p.evaluate(() => allCoins().filter((c) => c.status === "owned").length)) === 2);
  await p.click("[data-act=fillSpots]"); await p.waitForTimeout(150);
  ok("a second Fill spots lists only the spots still empty", (await p.locator("#fillRows .fill-row").count()) === n - 2);
  await p.evaluate(() => closeSheet());

  // Add coin order: what is it, grade, price paid, kept in, Notes, then More details
  await p.evaluate(() => go("coins")); await p.waitForTimeout(150); await p.click("#fab"); await p.waitForTimeout(150); if (await p.isVisible(".what-btn[data-v=us]")) await p.click(".what-btn[data-v=us]");
  await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  const order = await p.$$eval("#coinForm [data-f=year], #coinForm [data-f=grade], #coinForm summary", (els) => els.map((e) => e.tagName === "SUMMARY" ? e.textContent.trim() : e.dataset.f));
  console.log("order:", JSON.stringify(order));
  const at = (t) => order.findIndex((x) => x.startsWith(t));
  ok("order: year, grade, Purchase, Kept in, Notes, More details", at("year") < at("grade") && at("grade") < at("Purchase") && at("Purchase") < at("Holder") && at("Holder") < at("Notes") && at("Notes") < at("More details"));
  const more = await p.$$eval("#coinForm details[data-sec=more] details[data-sec]", (ds) => ds.map((d) => d.dataset.sec));
  ok("More details holds value, status, errors, photos and label", ["value", "status", "errors", "photos", "label"].every((k) => more.includes(k)));
  ok("Notes is not inside More details", !more.includes("notes") && !more.includes("purchase") && !more.includes("holder"));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
