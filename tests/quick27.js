// Step 27 Quick wins: You own counts the same kind, GSA holder, 1922 high relief, Add type button up,
// Lincoln missing button gone, rename want list, discard prompt on saved coin, mint? in box spots.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on("pageerror", (e) => console.log("FAIL pageerror " + e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  ok("GSA holder is a choice", await ev(() => HOLDERS.includes("GSA holder")));
  ok("1922 Peace dollar lists High Relief", await ev(() => knownVarieties({ typeId: "peace-dollar", year: 1922, mint: "" }).includes("High Relief") && !knownVarieties({ typeId: "peace-dollar", year: 1923, mint: "" }).length));
  ok("Add another type button sits above the type rows", await ev(() => { const h = albumTypeRows(["morgan-dollar"]); return h.indexOf("albumAddType") > 0 && h.indexOf("albumAddType") < h.indexOf('id="albumTypes"'); }));
  ok("Lincoln missing button is off Storage", await ev(() => !/boxMissing/.test(viewBoxes ? viewBoxes() : "")));
  ok("You own counts only the same kind", await ev(() => {
    const mk = (id, extra) => put("c_" + id, { ...blankCoin(), id, typeId: "kennedy-clad", typeName: "Kennedy", year: "1976", mint: "S", qty: 1, status: "owned", ...extra }, true);
    mk("q1", { grade: "PR-65" }); mk("q2", { grade: "VF-20" }); mk("q3", { grade: "VF-20", variety: "Doubled Die" });
    const spot = { typeId: "kennedy-clad", year: 1976, mint: "S", variety: "", grade: "PR-65" };
    const t = ownGradesText(spot);
    return ownCountOf(spot) === 1 && /You own 1: PR-65/.test(t) && /also .*1 Doubled Die/.test(t) && /1 non-proof/.test(t);
  }));
  ok("Rename want list works", await ev(() => {
    ensureDefaultList();
    actions.wlRename({ dataset: { id: DEFAULT_LIST_ID } });
    const f = document.querySelector("#wlRenameForm"); if (!f) return false;
    f.name.value = "Everything I want";
    f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    return getWantList(DEFAULT_LIST_ID).name === "Everything I want";
  }));
  ok("Can't tell mint shows (mint?) in box spots", await ev(() => slotDate({ year: "1955", mint: CANT_TELL }) === "1955 (mint?)"));
  ok("Edited saved coin asks Discard your changes", await ev(() => {
    put("c_e1", { ...blankCoin(), id: "e1", typeId: "kennedy-clad", typeName: "Kennedy", year: "1976", qty: 1, status: "owned" }, true);
    openCoinForm("e1"); formTouched = true;
    const k = sheetUnsaved(); askDiscard(k);
    const t = document.body.innerText;
    return k === "edit" && /Discard your changes\?/.test(t);
  }));
  ok("New album: extra coin types sit right under the Coin type box", await ev(() => { openNewAlbum(); const f = document.querySelector("#albumForm"), blk = f.querySelector("#albumTypesBlock"), top = f.querySelector("#albumTypeFind"); const ok = blk && top && (top.compareDocumentPosition(blk) & 4) && !(f.querySelector('[name=brand]').compareDocumentPosition(blk) & 4); closeSheet(); return !!ok; }));
  await b.close();
})();
