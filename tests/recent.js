const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(200);
  for (const [q, y] of [["morgan", 1921], ["peace", 1922], ["franklin", 1955], ["mercury", 1944], ["buffalo", 1936], ["walking", 1943], ["morgan", 1889]]) {
    await p.click("#fab"); await p.fill("#typeSearch", q); await p.click("#typeList button[data-act=pickType] >> nth=0");
    await p.fill("[data-f=year]", String(y)); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(150);
  }
  await p.click("#fab"); await p.focus("#typeSearch");
  console.log("empty:", await p.$$eval("#typeList > *", (o) => o.slice(0, 8).map((x) => x.className === "ta-head" ? "[" + x.textContent + "]" : x.firstChild.textContent)));
  await p.screenshot({ path: "/tmp/recent.png" });
  await p.fill("#typeSearch", "dollar");
  console.log("dollar:", await p.$$eval("#typeList > *", (o) => o.slice(0, 6).map((x) => x.className === "ta-head" ? "[" + x.textContent + "]" : x.firstChild.textContent)));
  await p.click("[data-act=closeSheet] >> nth=0");
  await p.click("#menuBtn"); await p.click("#menu [data-go=albums]"); await p.click("[data-act=newAlbum]");
  console.log("album:", await p.$$eval("#albumType optgroup", (g) => g.map((x) => x.label + ": " + [...x.children].slice(0, 5).map((o) => o.textContent).join(" | "))), await p.inputValue("#albumStart"));
  console.log("errors", errors); await b.close();
})();
