/* E1q (E1-14): "Break up this set". A proof, mint or other set becomes single coins, ready for album spots.
   The set entry is never deleted: it becomes Gone, reason "Broken up". Each new coin gets fromSet = the set's id.
   Cost is split by each coin's value at break-up time (equal when nothing has a value); every line can be typed over and must add up.
   Nothing is saved until Make coins. One Undo puts it all back. */
const SET_BROKEN = "Broken up";
const isBrokenSet = (c) => !!c && itemOf(c) === "set" && c.status === "gone" && !!c.gone && c.gone.reason === SET_BROKEN;
const setCoinsOf = (set) => (set ? allCoins().filter((c) => c.fromSet === set.id && c.status !== "deleted") : []);
// What a set held, by year. Only kinds and years whose contents are well known (U.S. Mint facts); anything else starts empty and you add the coins.
// Each row: [type id, mint]. Mint "" = no mint mark (Philadelphia).
function setContents(kind, y) {
  const cent = y <= 1958 ? "lincoln-wheat" : "lincoln-memorial-copper";
  if (kind === "proof" && y >= 1950 && y <= 1964) return [cent, "jefferson-nickel", "roosevelt-silver", "washington-silver", y === 1964 ? "kennedy-90" : "franklin-half"].map((t) => [t, ""]);
  if (kind === "sms" && y >= 1965 && y <= 1967) return ["lincoln-memorial-copper", "jefferson-nickel", "roosevelt-clad", "washington-clad", "kennedy-40"].map((t) => [t, ""]);
  if (kind === "proof" && ((y >= 1968 && y <= 1974) || (y >= 1977 && y <= 1978))) {
    const list = ["lincoln-memorial-copper", "jefferson-nickel", "roosevelt-clad", "washington-clad", y <= 1970 ? "kennedy-40" : "kennedy-clad"];
    if (y >= 1973) list.push("ike-clad");
    return list.map((t) => [t, "S"]);
  }
  if (kind === "mint" && y >= 1959 && y <= 1964) {
    const five = ["lincoln-memorial-copper", "jefferson-nickel", "roosevelt-silver", "washington-silver", y === 1964 ? "kennedy-90" : "franklin-half"];
    return five.flatMap((t) => [[t, ""], [t, "D"]]);
  }
  return [];
}
const isProofSet = (set) => set.setKind === "proof" || set.setKind === "silver-proof";
let bu = null; // the break-up being set up: { setId, lines: [{ k, typeId, mint, grade, cost, to }], rest }
function buLine(set, typeId, mint) {
  return { k: uid(), typeId, mint: mint || "", grade: "", cost: "", to: "" };
}
// The coin a line would make (also used for values and matching spots). Not saved.
function buCoin(set, l) {
  const t = TYPE_BY_ID[l.typeId];
  const c = { ...blankCoin(), typeId: l.typeId, typeName: t ? shortName(t) : "", family: t ? t.family : "", denom: t ? t.denom : "", metal: t ? t.metal : "", oz: t ? t.oz || "" : "", year: num(set.year) || "", mint: l.mint, grade: l.grade };
  if (typeof applyYearMetal === "function") applyYearMetal(c);
  return c;
}
// Split the set's cost by each coin's value (its grade's value, else melt, else face); equal shares when none has a value. Cents add up exactly.
function buSplit(set) {
  const total = Math.round(costOf(set) * 100), lines = bu.lines;
  if (!lines.length) return;
  const w = lines.map((l) => Math.max(0, bestEach(buCoin(set, l)) || 0));
  const all = w.reduce((x, y) => x + y, 0);
  const share = w.map((x) => (all > 0 ? x / all : 1 / lines.length));
  let left = total;
  lines.forEach((l, i) => { const cents = i === lines.length - 1 ? left : Math.round(total * share[i]); left -= cents; l.cost = (cents / 100).toFixed(2); });
}
// R11-1: each line's cost is the coin's whole cost. The set's tax, shipping and fees go into each coin's own boxes
// (shared in the same proportion as the costs), and the rest is its price. So a receipt never adds them a second time.
function buParts(set) {
  const cents = bu.lines.map((l) => Math.round((num(l.cost) || 0) * 100)), total = cents.reduce((x, y) => x + y, 0);
  const big = cents.indexOf(Math.max(...cents)); // rounding pennies go to the costliest coin, so no price goes below zero
  const out = cents.map(() => ({}));
  const extra = cents.map(() => 0);
  BUY_EXTRAS.forEach((k) => {
    const v = Math.round((num(set[k]) || 0) * 100);
    if (!v) return;
    let left = v;
    cents.forEach((x, i) => { const p = i === big || !total ? 0 : Math.round(v * x / total); out[i][k] = p; left -= p; });
    out[big][k] = (out[big][k] || 0) + left;
    out.forEach((o, i) => { extra[i] += o[k]; o[k] = o[k] ? (o[k] / 100).toFixed(2) : ""; });
  });
  return out.map((o, i) => { BUY_EXTRAS.forEach((k) => { if (o[k] === "") delete o[k]; }); return { ...o, paid: String(Math.max(0, cents[i] - extra[i]) / 100) }; });
}
const buTotalCents = () => bu.lines.reduce((s, l) => s + Math.round((num(l.cost) || 0) * 100), 0);
// Open album spots this line's coin fits, in every album (same rules as Move to another album). A proof line looks for proof spots.
function buSpots(set, l) {
  const c = buCoin(set, l);
  if (isProofSet(set) && !isProofGrade(c.grade)) c.grade = "PR-65"; // only to find proof spots; the coin keeps the grade you pick
  return albumMoveTargets(c, null);
}
function openBreakUp(id) {
  const set = getCoin(id);
  if (!set || itemOf(set) !== "set" || set.status !== "owned") return;
  if (qtyOf(set) > 1) { toast("Break up works on one set at a time. Set the quantity to 1 first, then add the others as their own sets."); return; }
  const y = num(set.year);
  bu = { setId: set.id, lines: setContents(set.setKind, y).map(([t, m]) => buLine(set, t, m)), rest: keptValue(set) || "none" };
  buSplit(set);
  renderBreakUp();
}
function renderBreakUp() {
  const set = bu && getCoin(bu.setId);
  if (!set) return;
  const y = num(set.year), proof = isProofSet(set), cost = Math.round(costOf(set) * 100), got = buTotalCents(), left = cost - got;
  const opt = (v, l, sel) => `<option value="${esc(v)}" ${sel === v ? "selected" : ""}>${esc(l)}</option>`;
  const grades = GRADES.filter((g) => isProofGrade(g) === proof);
  const addTypes = COIN_TYPES.filter((t) => y && typeMadeIn(t, y)).sort((a, b) => (a.face || 0) - (b.face || 0));
  const lines = bu.lines.map((l, i) => {
    const t = TYPE_BY_ID[l.typeId], spots = buSpots(set, l);
    const to = `<option value="">Where the others go (below)</option>${spots.map((s) => opt("spot:" + s.album.id + ":" + s.spot.id, albumTitle(s.album) + ": " + slotLabel(s.spot) + " spot", l.to)).join("")}${placeOptionsHtml(l.to)}`;
    return `<div class="bu-line"><div class="rowline"><b>${esc((y || "") + (l.mint ? "-" + l.mint : "") + " " + (t ? shortName(t) : "Coin") + (proof ? " Proof" : ""))}</b><button class="link-btn" style="color:var(--bad)" data-act="buDel" data-i="${i}">Remove</button></div>
      <div class="grid2"><label class="f"><span>${proof ? "Proof grade" : "Grade"}</span><select data-bu="grade" data-i="${i}">${opt("", "Grade later", l.grade)}${grades.map((g) => opt(g, g, l.grade)).join("")}</select></label>
      <label class="f"><span>Cost</span><input type="number" inputmode="decimal" step="0.01" min="0" data-bu="cost" data-i="${i}" value="${esc(l.cost)}"></label></div>
      <label class="f"><span>Goes to${spots.length ? ` <span class="small muted">(${spots.length} matching spot${spots.length === 1 ? "" : "s"})</span>` : ""}</span><select data-bu="to" data-i="${i}">${to}</select></label></div>`;
  }).join("");
  const restOpts = opt("__case", "Keep them in the set's case", bu.rest) + placeOptionsHtml(bu.rest);
  openSheet(`<div class="sheet-head"><h2>Break up this set</h2><button class="x" data-act="buClose" aria-label="Close">✕</button></div><div id="buForm">
    <p class="small" style="margin-top:0"><b>${esc(labelOf(set))}</b> · cost ${money(cost / 100, "$0.00")}. Check each coin, then Make coins. Nothing is saved until then.</p>
    ${bu.lines.length ? "" : `<div class="card small">This set's coins aren't filled in for you (only sets whose contents are sure are). Add each coin below.</div>`}
    ${lines}
    ${addTypes.length ? `<label class="f"><span>+ Add a coin</span><select data-bu="add"><option value="">Pick a coin type…</option>${addTypes.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>` : ""}
    <div class="btn-row">${bu.lines.some((l) => buSpots(set, l).length) ? `<button class="btn" data-act="buMatch">Use matching spots</button>` : ""}${bu.lines.length > 1 ? `<button class="btn" data-act="buResplit">Split by value again</button>` : ""}</div>
    <label class="f" style="margin-top:10px"><span>Coins with no spot go to:</span><select data-bu="rest">${restOpts}</select></label>
    <div class="hint">Each coin keeps the set's Where from, date, seller, receipt and Inherited or Keeping for. The set moves to Gone (Broken up) so your cost history stays. One Undo puts everything back.</div>
    <div class="fill-save"><div class="bu-sum ${left ? "bad" : ""}">${left ? (left > 0 ? "Left to split: " : "Over by ") + money(Math.abs(left) / 100, "$0.00") : "Cost adds up to " + money(cost / 100, "$0.00") + " ✓"}</div>
    <button class="btn primary block" data-act="buGo" style="margin-top:6px" ${bu.lines.length && !left ? "" : "disabled"}>Make ${bu.lines.length} coin${bu.lines.length === 1 ? "" : "s"}</button></div></div>`, "sheet-75");
}
// "Use matching spots": every line with one matching album gets its spot; a line that matches two albums is left for you to pick.
function buMatch() {
  const set = getCoin(bu.setId), taken = new Set();
  let ask = 0;
  bu.lines.forEach((l) => {
    if (l.to) { if (l.to.startsWith("spot:")) taken.add(l.to); return; }
    const spots = buSpots(set, l).map((s) => "spot:" + s.album.id + ":" + s.spot.id).filter((k) => !taken.has(k));
    if (spots.length === 1) { l.to = spots[0]; taken.add(spots[0]); } else if (spots.length > 1) ask++;
  });
  renderBreakUp();
  toast(ask ? ask + " coin" + (ask === 1 ? " fits" : "s fit") + " spots in more than one album: pick which in Goes to." : "Matching spots filled in. Check them, then Make coins.");
}
function buGo() {
  const set = getCoin(bu.setId);
  if (!set || set.status !== "owned") return;
  if (buTotalCents() !== Math.round(costOf(set) * 100)) { toast("The costs must add up to the set's cost first."); return; }
  const spotsUsed = new Set();
  for (const l of bu.lines) {
    if (!l.to.startsWith("spot:")) continue;
    if (spotsUsed.has(l.to)) { toast("Two coins are going to the same spot. Pick another for one of them."); return; }
    spotsUsed.add(l.to);
    const [, aid, sid] = l.to.split(":"), a = getAlbum(aid), s = a && (a.slots || []).find((x) => x.id === sid);
    if (!s || albumStats(a).filled.has(slotKey(s))) { toast("A spot you picked just got filled. Pick again."); return; }
    if (s.pf && !isProofGrade(l.grade)) { toast("Pick a proof grade for the " + labelOf(buCoin(set, l)) + ": it goes in a proof spot."); return; }
  }
  const before = JSON.parse(JSON.stringify(set)), made = [], wantsGone = [], when = Date.now();
  let caseBox = null, rest = bu.rest;
  if (rest === "__case") { // a holder named after the set, kept where the set was kept
    caseBox = normBox({ kind: "box", id: uid(), createdAt: when, name: labelOf(set), type: "storage", look: normHolder(set.holder) === "Hard plastic" ? "plastic" : "other", color: "clear", spots: false, rows: 1, perRow: 1 });
    if (set.boxId && getBox(set.boxId)) caseBox.keptBox = set.boxId;
    put("b_" + caseBox.id, caseBox);
    rest = "b:" + caseBox.id;
  }
  const parts = buParts(set);
  const copy = ["source", "seller", "acquired", "payMethod", "receiptNo", "purchaseId", "inhId", "keepFor", "biz"];
  const used = new Set(), moved = [];
  bu.lines.forEach((l, i) => {
    const c = buCoin(set, l);
    copy.forEach((k) => { if (set[k] != null && set[k] !== "") c[k] = JSON.parse(JSON.stringify(set[k])); });
    Object.assign(c, parts[i], { id: uid(), qty: 1, fromSet: set.id, notes: "From " + labelOf(set), createdAt: when + i, gradeMode: "raw" });
    if (l.to.startsWith("spot:")) {
      const [, aid, sid] = l.to.split(":"), a = withSlotIds(getAlbum(aid)), s = (a.slots || []).find((x) => x.id === sid);
      applyKept(c, "a:" + a.id, true); c.slotId = s.id;
      wantsGone.push(...dropSpotWants(a, [s]));
    } else {
      const dest = l.to || rest, why = dest === "none" ? "" : movePlace(c, dest, used);
      if (why) moved.push(labelOf(c)); // can't go there (a stack takes only junk silver): it stays loose
    }
    put("c_" + c.id, c, true);
    made.push(c);
  });
  const gone = JSON.parse(JSON.stringify(set));
  applyKept(gone, "");
  Object.assign(gone, { status: "gone", stage: "", gone: { reason: SET_BROKEN, date: today() } });
  put("c_" + gone.id, gone, true);
  bu = null;
  closeSheet();
  if (typeof ensureIds === "function") ensureIds();
  render();
  const undo = () => {
    const now = made.map((c) => getCoin(c.id)).filter(Boolean);
    made.forEach((c) => remove("c_" + c.id));
    if (typeof idGiveBack === "function") idGiveBack(now);
    if (caseBox) remove("b_" + caseBox.id);
    wantsGone.forEach(saveWant);
    put("c_" + before.id, before);
    render();
  };
  toast("Made " + made.length + " coin" + (made.length === 1 ? "" : "s") + " from the set." + (moved.length ? " " + moved.length + " stayed loose." : ""), { label: "Undo", fn: undo });
}
Object.assign(actions, {
  breakUp: (el) => openBreakUp(el.dataset.id),
  buDel: (el) => { bu.lines.splice(+el.dataset.i, 1); formTouched = true; renderBreakUp(); },
  buMatch: () => { formTouched = true; buMatch(); },
  buResplit: () => { buSplit(getCoin(bu.setId)); formTouched = true; renderBreakUp(); },
  buGo,
  buClose: () => dismissSheet(), // R11-2: asks before throwing away what you filled in
});
["breakUp", "buGo"].forEach((x) => SNAPSHOT_BLOCK.add(x));
// The sheet's boxes: grade, cost, goes to, add a coin, where the rest go. Cost typing doesn't redraw (the keyboard stays up).
document.addEventListener("change", (e) => {
  const k = e.target.dataset && e.target.dataset.bu;
  if (!k || !bu || k === "cost") return; // cost is kept by the input listener below; redrawing here would eat the next tap
  const set = getCoin(bu.setId), l = bu.lines[+e.target.dataset.i];
  if (k === "add") { if (e.target.value) { bu.lines.push(buLine(set, e.target.value, "")); buSplit(set); } }
  else if (k === "rest") bu.rest = e.target.value;
  else if (l) l[k] = e.target.value;
  renderBreakUp();
});
document.addEventListener("input", (e) => {
  if (!bu || !e.target.dataset || e.target.dataset.bu !== "cost") return;
  const l = bu.lines[+e.target.dataset.i];
  if (l) l.cost = e.target.value;
  const set = getCoin(bu.setId), cost = Math.round(costOf(set) * 100), left = cost - buTotalCents(), el = document.querySelector("#sheet .bu-sum"), btn = document.querySelector('#sheet [data-act="buGo"]');
  if (el) { el.className = "bu-sum" + (left ? " bad" : ""); el.textContent = left ? (left > 0 ? "Left to split: " : "Over by ") + money(Math.abs(left) / 100, "$0.00") : "Cost adds up to " + money(cost / 100, "$0.00") + " ✓"; }
  if (btn) btn.disabled = !!left || !bu.lines.length;
});
