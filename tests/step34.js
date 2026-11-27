// Step 34: S1 quick fixes + plain names.
const { chromium } = require("./_compat");
const fs = require("fs"), path = require("path");
(async () => {
  const root = path.join(__dirname, "..");
  const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
  // No publisher name in anything the app can print (comments and import column names excepted).
  const bad = [];
  fs.readdirSync(root).filter((f) => /\.(js|html|webmanifest)$/.test(f)).forEach((f) => fs.readFileSync(path.join(root, f), "utf8").split("\n").forEach((l, i) => {
    if (/^Step 11\.3|^\/\*/.test(l) || (f === "pricefile.js" && i < 5)) return;
    const code = l.replace(/\/\/.*$|\/\*.*?\*\//g, "").replace(/names: \[[^\]]*\]/g, "");
    if (/^\s*(\*|Red Book ×)/.test(code)) return;
    if (/(red|blue|gr[ea]y) ?(book|sheet)\b/i.test(code.replace(/\b(redBook|redbook)\b/g, ""))) bad.push(f + ":" + (i + 1));
  }));
  ok("no publisher names in app text " + bad.join(" "), !bad.length);
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } }), errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + root + "/index.html"); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const out = {};
    const mk = (o) => { const c = Object.assign(blankCoin(), o); c.id = uid(); saveCoin(c); return c; };
    mk({ typeName: "Test", year: 1900, paid: "10", value: "15", source: "Gift" });
    mk({ typeName: "Test", year: 1901, paid: "100" });
    go("home"); render();
    out.home = document.querySelector("#view").textContent;
    out.cull = gradeText({ grade: "Junk", gradeMode: "raw" });
    const h = mk({ typeName: "Test", year: 1902, grade: "VF-20", source: "Inherited" });
    out.loud = coinInhHtml(h).includes("miss-banner");
    justAdded.add(h.id);
    out.quiet = !coinInhHtml(h).includes("miss-banner") && coinInhHtml(h).includes("Inherit date");
    saveSettings({ changedIds: [], changedCoins: 0 }, true);
    return out;
  });
  ok("Gain says N of M", /Gain on 1 of 2 coins|Gain on 1 of 3 coins/.test(r.home));
  ok("Junk shows as Cull", r.cull === "Raw Cull");
  ok("inherit banner for an older coin", r.loud);
  ok("quiet line for a just-added coin", r.quiet);
  await p.evaluate(() => actions.startCollection());
  await p.click("#sheet [data-act=textSize][data-v=large]");
  ok("text size on first-run sheet", await p.evaluate(() => settings().textSize === "large" && !!document.querySelector("#sheet [data-v=large].on")));
  console.log("errors", errs);
  await b.close();
})();
