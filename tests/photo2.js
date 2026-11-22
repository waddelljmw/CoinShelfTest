const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    window.__calls = [];
    const sample = async () => ({ text: "" });
    sample.limits = async () => ({ images: { maxCount: 5 } });
    sample.json = async (prompt, o) => {
      window.__calls.push(o.images.length);
      await new Promise((r) => setTimeout(r, 200));
      return o.images.length < 2
        ? { typeId: "morgan-dollar", year: 1881, mint: null, certified: false, confidence: "high", note: "The mint mark on Morgan dollars is on the reverse; add a photo of the back." }
        : { typeId: "morgan-dollar", year: 1881, mint: "S", certified: false, confidence: "high", note: "" };
    };
    window.claude = { use: async (n) => (n === "sample" ? sample : null) };
  });
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(500);
  const png = { name: "f.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") };
  await p.click("#fab");
  console.log("start label:", (await p.textContent("#photoFillBtn")).trim(), "| multiple:", await p.getAttribute("#photoFill", "multiple") !== null);
  await p.setInputFiles("#photoFill", png); await p.waitForTimeout(1200);
  console.log("after front:", (await p.textContent("#photoFillBtn")).trim(), "|", await p.textContent("#photoFillMsg"));
  console.log("  mint:", JSON.stringify(await p.evaluate(() => draft.mint)), "photos:", await p.evaluate(() => draft.photos.length));
  await p.screenshot({ path: "/tmp/photo-front.png" });
  await p.setInputFiles("#photoFill", { ...png, name: "b.png" }); await p.waitForTimeout(1200);
  console.log("after back:", await p.textContent("#photoFillMsg"));
  console.log("  mint:", await p.evaluate(() => draft.mint), "photos:", await p.evaluate(() => draft.photos.length), "images sent per call:", await p.evaluate(() => window.__calls));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  console.log("saved:", await p.textContent("h1"), "| saved has no blobs:", await p.evaluate(() => allCoins().every((c) => !("_fillBlobs" in c))));
  // both at once
  await p.click("#fab"); await p.setInputFiles("#photoFill", [png, { ...png, name: "b.png" }]); await p.waitForTimeout(2500); console.log("msg:", await p.textContent("#photoFillMsg"));
  console.log("both at once:", await p.evaluate(() => draft.mint), await p.evaluate(() => window.__calls.slice(-1)[0]));
  console.log("errors", errors); await b.close();
})();
