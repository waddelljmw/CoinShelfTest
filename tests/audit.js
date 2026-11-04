// Session 24: honest values, source chips, Options groups, Stacks menu (PLAN Step 9.2).
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (f, a) => p.evaluate(f, a);

  // A silver coin with no silver price
  await ev(() => { store.mode = store.mode === "memory" ? "local" : store.mode; saveSettings({ spot: { silver: null, gold: null, platinum: null, copper: null }, spotUpdated: null, priceAsked: {}, optOpen: {} }); });
  await ev(async () => { await saveCoin({ ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", metal: "Silver", oz: "0.77344", year: "1921", mint: "D", grade: "", label: "t1" }); });
  await ev(() => go("home")); await p.waitForTimeout(250);
  if (!(await p.locator(".lowtot").count())) console.log("FAIL low-total warning should show when silver has no price");
  const line = await ev(() => document.querySelector(".sh-updrow")?.textContent || "");
  if (!/Couldn't get live prices/.test(line)) console.log("FAIL price line should say couldn't get prices, got: " + line);

  // Price prompt: appears once
  await ev(() => { const c = allCoins()[0]; askMetalPrice(c); });
  if (!(await p.locator("#ppInput").count())) console.log("FAIL price prompt should appear");
  await ev(() => closeSheet()); await ev(() => askMetalPrice(allCoins()[0]));
  if (await p.locator("#ppInput").count()) console.log("FAIL price prompt should appear only once per metal");

  // Typing a price clears the warning and makes the line fresh
  await ev(() => { saveSettings({ spot: { ...settings().spot, silver: 30 }, spotUpdated: new Date().toISOString() }); go("home"); }); await p.waitForTimeout(250);
  if (await p.locator(".lowtot").count()) console.log("FAIL warning should hide once silver has a price");
  if (!/Prices updated/.test(await ev(() => document.querySelector(".sh-updrow").textContent))) console.log("FAIL fresh price line");
  // Old prices turn amber
  await ev(() => { saveSettings({ spotUpdated: new Date(Date.now() - 3 * 86400000).toISOString() }); go("home"); }); await p.waitForTimeout(250);
  if (!/3 days old/.test(await ev(() => document.querySelector(".sh-updrow").textContent))) console.log("FAIL old price line");

  // No Red Book value note + face label
  const id = await ev(() => allCoins()[0].id);
  await ev((i) => go("coin-" + i), id); await p.waitForTimeout(250);
  if (!/Add a grade to get a Red Book value/.test(await p.textContent("main"))) console.log("FAIL no-grade Red Book note");
  await ev(async (i) => { await saveCoin({ ...getCoin(i), grade: "VF-20", typeId: "indian-cent", metal: "Copper-nickel" }); go("coin-" + i); }, id); await p.waitForTimeout(250);
  if (!/No Red Book value for this date and grade/.test(await p.textContent("main"))) console.log("FAIL no Red Book value note");
  if (!(await p.locator("[data-act=addAnother]").count())) console.log("FAIL Add another button");
  await ev((i) => actions.addAnother({ dataset: { id: i } }), id); await p.waitForTimeout(250);
  if (!(await ev(() => draft && draft._isNew && draft.typeId === getCoin(allCoins()[0].id).typeId))) console.log("FAIL Add another should pick the same type");

  // Source chips save the same value as the old list
  await ev(() => { openCoinForm(null); actions.what({ dataset: { v: "us" } }); }); await p.waitForTimeout(250);
  await p.click('[data-act=srcChip][data-v="Inherited"]'); await p.waitForTimeout(150);
  if (!(await ev(() => draft.source === "Inherited" && draft._sourceKind === "Inherited"))) console.log("FAIL chip should set source Inherited");
  await p.click('[data-act=srcChip][data-v="Inherited"]'); await p.waitForTimeout(150);
  if (await ev(() => draft.source)) console.log("FAIL tapping the chip again should clear it");
  if (!(await p.locator("#photoFillLocked").count())) console.log("FAIL locked photo-fill line");
  await ev(() => closeSheet());

  // Options groups in order, Red Book moved to Coin Value
  await ev(() => go("options")); await p.waitForTimeout(250);
  const groups = await ev(() => [...document.querySelectorAll(".optgroup")].map((e) => e.textContent));
  if (groups.join("|") !== "Prices and values|Look of Home|Adding coins|Your data|Share and help") console.log("FAIL Options group order: " + groups.join("|"));
  if (await p.locator('[data-v="red-book-values"]').count()) console.log("FAIL Red Book table should not be in Options");
  await ev(() => go("value")); await p.waitForTimeout(250);
  if (!/Red Book edition/.test(await p.textContent("main"))) console.log("FAIL Red Book table should be on Coin Value");

  // My Stacks menu item: hidden until a stack-type item exists
  await ev(() => render()); 
  if (await ev(() => !document.querySelector("#menuStacks").hidden)) console.log("FAIL My Stacks should be hidden with no stack item");
  await ev(async () => { await saveCoin({ ...blankCoin(), item: "bullion", metal: "Silver", bShape: "Bar", bWeight: "1", bPurity: "0.999", oz: "1", label: "bar" }); render(); }); await p.waitForTimeout(200);
  if (await ev(() => document.querySelector("#menuStacks").hidden)) console.log("FAIL My Stacks should show once a bar exists");

  console.log("errors", errors); await b.close();
})();
