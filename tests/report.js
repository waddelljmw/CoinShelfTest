const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  // Fake runtime with downloads, to capture the saved file
  await p.addInitScript(() => {
    window.__saved = null;
    const downloads = { save: async (r) => { window.__saved = r; return { status: "saved" }; } };
    window.claude = { use: async (n) => (n === "downloads" ? downloads : null) };
  });
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(500);
  await p.evaluate(async () => {
    saveSettings({ spot: { gold: 3884.9, silver: 49.14, platinum: 1434.5, copper: 6.48 }, spotUpdated: "2026-10-31" });
    // a small real photo (red square) as a blob URL photo
    const cv = document.createElement("canvas"); cv.width = 300; cv.height = 300; const g = cv.getContext("2d"); g.fillStyle = "#b8862b"; g.beginPath(); g.arc(150, 150, 140, 0, 7); g.fill();
    const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg"));
    const mk = (o) => saveCoin({ ...blankCoin(), ...o });
    mk({ typeId: "indian-2-5", typeName: "Indian Head $2.50 Gold", family: "Classic gold", denom: "$2.50", metal: "Gold", oz: 0.12094, year: 1910, grade: "AU-53", value: "600", source: "Inherited", photos: [{ url: URL.createObjectURL(blob) }] });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1878, mint: "CC", grade: "VF-20", qty: 2, paid: "180" });
    mk({ typeId: "franklin-half", typeName: "Franklin Half Dollar", family: "Franklin half", denom: "50C", metal: "Silver", oz: 0.36169, year: 1953, mint: "S", gradeMode: "cert", service: "PCGS", cert: "12345678", grade: "MS-65", fbl: true, paid: "250", notes: "From the Smith estate" });
    mk({ typeId: "kennedy-40", typeName: "Kennedy Half Dollar", family: "Kennedy half", denom: "50C", metal: "Silver", oz: 0.14792, grade: "Junk", qty: 25, paid: "4" });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1880, mint: "O", grade: "AU-55", status: "sold", sold: { amount: 70 } });
  });
  await p.click("#menuBtn"); await p.click("#menu [data-go=options]");
  await p.click("main [data-act=openReport]");
  console.log("defaults off:", !(await p.isChecked("#repPaid")), !(await p.isChecked("#repPhotos")));
  await p.screenshot({ path: "/tmp/report-form.png" });
  // 1) default report
  await p.click("[data-act=makeReport]"); await p.waitForTimeout(500);
  let saved = await p.evaluate(() => window.__saved);
  fs.writeFileSync("/tmp/report-default.html", saved.data);
  console.log("file:", saved.filename, "| has Paid column:", saved.data.includes("Paid each"), "| has photos:", saved.data.includes("data:image/jpeg"), "| sold excluded:", !saved.data.includes("1880-O"));
  // 2) with paid + photos + name
  await p.click("main [data-act=openReport]"); await p.check("#repPaid"); await p.check("#repPhotos"); await p.fill("#repName", "Test Owner");
  await p.click("[data-act=makeReport]"); await p.waitForTimeout(800);
  saved = await p.evaluate(() => window.__saved);
  fs.writeFileSync("/tmp/report-full.html", saved.data);
  console.log("full: has Paid:", saved.data.includes("Paid each"), "| photos:", (saved.data.match(/data:image\/jpeg/g) || []).length, "| name:", saved.data.includes("Owner: Test Owner"), "| size KB:", Math.round(saved.data.length / 1024));
  // 3) Next time the boxes are off again
  await p.click("main [data-act=openReport]"); console.log("off again:", !(await p.isChecked("#repPaid")), !(await p.isChecked("#repPhotos")));
  console.log("errors", errors);
  // Render both reports to check them
  const r = await b.newPage({ viewport: { width: 900, height: 1200 } });
  for (const f of ["default", "full"]) { await r.goto("file:///tmp/report-" + f + ".html"); await r.screenshot({ path: "/tmp/report-" + f + ".png", fullPage: true }); await r.pdf({ path: "/tmp/report-" + f + ".pdf", format: "Letter" }); }
  await b.close();
})();
