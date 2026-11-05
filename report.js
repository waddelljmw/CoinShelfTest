// Insurance report: a printable inventory of the coins you own, saved as a web page file
// (open it in a browser, then print or save as PDF). Loaded after app.js.
"use strict";

// Which coins go in the report: all, or the ones you tick.
const repSel = { mode: "all", ids: new Set(), q: "" };

// Where an item is kept, in words: album, box (with row and slot), or stack.
function keptText(c) {
  const al = c.albumId && getAlbum(c.albumId);
  return [al ? albumTitle(al) : "", c.boxId && getBox(c.boxId) ? boxText(c) : "", stackOf(c)].filter(Boolean).join(" · ");
}
function openReportForm() {
  const owned = ownedCoins();
  repSel.mode = "all"; repSel.ids = new Set(); repSel.q = "";
  openSheet(`<div class="sheet-head"><h2>Insurance report</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>A dated, itemized list of your coins with values and totals, to keep for your records or send to your insurance agent. Sold coins aren't included.</p>
    ${priceStatusLine(true)}${lowTotalNote(true)}${needInfoCoins().length ? `<p class="small" style="color:#a85d00"><b>Estimate*</b> ${NEED_NOTE} <button class="link-btn" data-act="needInfo">See them</button></p>` : ""}
    <div class="f"><span>Which coins</span>
      <div class="seg"><button type="button" data-act="repMode" data-v="all" class="on">All coins (${sum(owned, qtyOf)})</button><button type="button" data-act="repMode" data-v="pick">Choose coins</button></div>
    </div>
    <div id="repPick" hidden>
      <input type="search" id="repSearch" placeholder="Search, e.g. Morgan, inherited, PCGS" style="margin-top:10px">
      <div class="small muted" style="display:flex;justify-content:space-between;margin:8px 2px">
        <span id="repCount">None chosen</span>
        <span><button type="button" class="link-btn" data-act="repAll">Tick all shown</button> · <button type="button" class="link-btn" data-act="repNone">Clear</button></span>
      </div>
      <div class="list" id="repList" style="max-height:46vh;overflow-y:auto"></div>
    </div>
    <div class="card" style="margin-top:12px">
      <label class="switch"><span>Include what I paid<div class="small muted">Adds a Paid column and total.</div></span><input type="checkbox" id="repPaid"></label>
      <label class="switch"><span>Include where it's kept<div class="small muted">Adds a Kept in column (album, box with row and slot, or stack).</div></span><input type="checkbox" id="repKept"></label>
      <label class="switch"><span>Include photos<div class="small muted">Adds a small picture of each coin. Makes the file larger.</div></span><input type="checkbox" id="repPhotos"></label>
    </div>
    <label class="f"><span>Order of the list</span><select id="repOrder"><option value="type">Coin type, then year</option><option value="year">Year</option><option value="value">Value, highest first</option><option value="kept">Where it's kept</option></select></label>
    <label class="f"><span>Name on the report (optional)</span><input type="text" id="repName" placeholder="Your name" maxlength="80"></label>
    <div class="btn-row"><button class="btn primary" data-act="makeReport" ${owned.length ? "" : "disabled"}>Create report</button><button class="btn" data-act="closeSheet">Cancel</button></div>
    <div class="hint" id="repMsg">It saves as a file that opens in your browser. From there, print it or save it as a PDF.</div>`);
}
function repShown() {
  const q = repSel.q.trim().toLowerCase();
  return ownedCoins().slice().sort((a, b) => familyOf(a).localeCompare(familyOf(b)) || (+a.year || 0) - (+b.year || 0))
    .filter((c) => !q || (labelOf(c) + " " + gradeText(c) + " " + (c.source || "") + " " + (c.notes || "") + " " + familyOf(c)).toLowerCase().includes(q));
}
function repRenderList() {
  const box = $("#repList");
  if (!box) return;
  const shown = repShown();
  box.innerHTML = shown.length ? shown.map((c) => {
    const v = bestEach(c);
    return `<label class="coin-row" style="cursor:pointer"><input type="checkbox" data-repid="${esc(c.id)}" ${repSel.ids.has(c.id) ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent);flex:0 0 auto">
      <span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span><span class="coin-sub">${qtyOf(c) > 1 ? `<span class="qty">×${qtyOf(c)}</span> ` : ""}${esc(gradeText(c))}${isInherited(c) ? " · Inherited" : ""}</span></span>
      <span class="coin-val">${money(v == null ? null : v * qtyOf(c))}</span></label>`;
  }).join("") : `<div class="empty">No coins match.</div>`;
  repUpdateCount();
}
function repUpdateCount() {
  const el = $("#repCount");
  if (!el) return;
  const chosen = ownedCoins().filter((c) => repSel.ids.has(c.id));
  const n = sum(chosen, qtyOf);
  el.textContent = chosen.length ? `${n} coin${n === 1 ? "" : "s"} chosen · ${money(sum(chosen, (c) => (bestEach(c) || 0) * qtyOf(c)))}` : "None chosen";
}

// Small JPEG thumbnail as a data: URL, so the report file works on its own.
async function thumbDataUrl(photo) {
  try {
    const res = await fetch(photoSrc(photo));
    const blob = await res.blob();
    const img = await decodeImage(blob);
    const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    const s = Math.min(1, 220 / Math.max(w, h));
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * s); cv.height = Math.round(h * s);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.8);
  } catch (e) { return ""; }
}

const SOURCE_TEXT = { entered: "Owner's value", book: "Red Book", melt: "Melt", face: "Face value (no metal price)" };

async function buildReport(opts) {
  const s = settings();
  const byType = (a, b) => familyOf(a).localeCompare(familyOf(b)) || (+a.year || 0) - (+b.year || 0) || normMint(a.mint).localeCompare(normMint(b.mint));
  const order = { type: byType, year: (a, b) => (+a.year || 99999) - (+b.year || 99999) || byType(a, b), value: (a, b) => (bestEach(b) || 0) * qtyOf(b) - (bestEach(a) || 0) * qtyOf(a) || byType(a, b), kept: (a, b) => (keptText(a) || "\uffff").localeCompare(keptText(b) || "\uffff") || byType(a, b) }[opts.order] || byType;
  const coins = ownedCoins().filter((c) => !opts.ids || opts.ids.has(c.id)).slice().sort(order);
  const totQty = sum(coins, qtyOf);
  const totVal = sum(coins, (c) => (bestEach(c) || 0) * qtyOf(c));
  const totMelt = sum(coins, (c) => (meltEach(c) || 0) * qtyOf(c));
  const paidCoins = coins.filter((c) => num(c.paid) != null);
  const totPaid = sum(paidCoins, (c) => num(c.paid) * qtyOf(c));
  const m = (n) => (n == null ? "—" : money(n));
  const ed = s.bookEdition || PRICE_BOOK.edition;

  const thumbs = {};
  if (opts.photos) {
    for (const c of coins) if ((c.photos || [])[0]) thumbs[c.id] = await thumbDataUrl(c.photos[0]);
  }

  const rows = coins.map((c, i) => {
    const v = bestEach(c), q = qtyOf(c), mt = meltEach(c);
    const certLine = c.gradeMode === "cert" && c.cert ? `<div class="sub">Cert ${esc(c.cert)}</div>` : "";
    const inh = inheritanceOf(c), extra = [isInherited(c) ? (inh && (inh.earlier || []).length ? "Inherited: " + esc(inhHistory(inh)) : "Inherited" + (inh ? " from " + esc(inhLabel(inh)) : "")) : "", c.cac ? "CAC " + esc(c.cac) : "", c.acquired ? "Acquired " + esc(c.acquired) : "", c.variety ? esc(c.variety) : "", c.fbl ? "Full Bell Lines" : "", c.sms ? "Special Mint Set" : ""].filter(Boolean).join(" · ");
    return `<tr>
      <td class="n">${i + 1}</td>
      ${opts.photos ? `<td class="ph">${thumbs[c.id] ? `<img src="${thumbs[c.id]}" alt="">` : ""}</td>` : ""}
      <td><b>${esc(labelOf(c))}</b>${c.cid ? ` <span class="sub">${esc(c.cid)}</span>` : ""}${extra ? `<div class="sub">${extra}</div>` : ""}${c.notes ? `<div class="sub">${esc(c.notes)}</div>` : ""}</td>
      <td>${esc(gradeText(c))}${certLine}</td>
      <td class="r">${q}</td>
      <td class="r">${m(v)}</td>
      <td class="r"><b>${m(v == null ? null : v * q)}</b></td>
      <td class="r">${m(mt == null ? null : mt * q)}</td>
      <td>${esc(SOURCE_TEXT[valueSource(c)] || "")}${valueSource(c) === "book" && ed ? " " + esc(ed) : ""}</td>
      ${opts.kept ? `<td>${esc(keptText(c))}</td>` : ""}
      ${opts.paid ? `<td class="r">${num(c.paid) == null ? "—" : money(num(c.paid))}</td>` : ""}
    </tr>`;
  }).join("");

  const byFam = {};
  coins.forEach((c) => { const f = familyOf(c); byFam[f] = byFam[f] || { n: 0, v: 0, m: 0 }; byFam[f].n += qtyOf(c); byFam[f].v += (bestEach(c) || 0) * qtyOf(c); byFam[f].m += (meltEach(c) || 0) * qtyOf(c); });
  const famRows = Object.entries(byFam).sort((a, b) => b[1].v - a[1].v).map(([f, x]) => `<tr><td>${esc(f)}</td><td class="r">${x.n}</td><td class="r">${money(x.v)}</td><td class="r">${money(x.m)}</td></tr>`).join("");
  const metalRows = SPOT_METALS.map((mt) => {
    const cs = coins.filter((c) => meltKey(c) === mt.key && num(c.oz));
    if (!cs.length) return "";
    return `<tr><td>${mt.label}</td><td class="r">${sum(cs, qtyOf)}</td><td class="r">${sum(cs, (c) => ozEach(c) * qtyOf(c)).toFixed(3)} oz</td><td class="r">${money(sum(cs, (c) => (meltEach(c) || 0) * qtyOf(c)))}</td></tr>`;
  }).join("");
  const spots = SPOT_METALS.filter((mt) => num(s.spot[mt.key]) != null).map((mt) => `${mt.label} ${money(num(s.spot[mt.key]))}/${mt.unit}`).join(", ");
  const dateLong = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const name = String(opts.name || "").trim();

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Coin collection inventory – ${esc(dateLong)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f1c18; margin: 24px; font-size: 13px; line-height: 1.35; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 2px solid #9a6b1f; padding-bottom: 4px; }
  .meta { color: #6f675d; margin-bottom: 14px; }
  .sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin: 12px 0; }
  .sum div { border: 1px solid #e4ddd2; border-radius: 8px; padding: 8px 10px; } .sum b { display: block; font-size: 18px; } .sum span { color: #6f675d; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 6px 6px; border-bottom: 1px solid #e4ddd2; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #6f675d; background: #f6f3ee; }
  thead { display: table-header-group; } tr { break-inside: avoid; page-break-inside: avoid; }
  .r { text-align: right; white-space: nowrap; } .n { color: #6f675d; width: 22px; } .sub { color: #6f675d; font-size: 11.5px; margin-top: 2px; }
  .ph { width: 64px; } .ph img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e4ddd2; }
  tfoot td { font-weight: 700; border-top: 2px solid #1f1c18; }
  .note { color: #6f675d; font-size: 11.5px; margin-top: 18px; }
  .print { margin: 0 0 16px; padding: 8px 14px; border: 1px solid #9a6b1f; background: #9a6b1f; color: #fff; border-radius: 8px; font-size: 14px; cursor: pointer; }
  @media print { body { margin: 0; } .print { display: none; } @page { margin: 14mm; } }
</style></head><body>
<button class="print" onclick="window.print()">Print or save as PDF</button>
<h1>Coin collection inventory</h1>
<div class="meta">${name ? "Owner: " + esc(name) + " · " : ""}Prepared ${esc(dateLong)} with Coin Cabinet${opts.ids ? " · Selected coins (" + coins.length + " of " + ownedCoins().length + " entries in the collection)" : ""}</div>
<div class="sum">
  <div><span>Total value${coins.some((c) => missingOf(c).length) ? " (estimate*)" : ""}</span><b>${money(totVal)}</b></div>
  <div><span>Coins</span><b>${totQty}</b></div>
  <div><span>Melt value</span><b>${money(totMelt)}</b></div>
  ${opts.paid ? `<div><span>Paid${paidCoins.length < coins.length ? " (where recorded)" : ""}</span><b>${money(totPaid)}</b></div>` : ""}
</div>
<h2>Itemized list</h2>
<table>
  <thead><tr><th>#</th>${opts.photos ? "<th>Photo</th>" : ""}<th>Coin</th><th>Grade</th><th class="r">Qty</th><th class="r">Value each</th><th class="r">Total</th><th class="r">Melt</th><th>Value basis</th>${opts.kept ? "<th>Kept in</th>" : ""}${opts.paid ? `<th class="r">Paid each</th>` : ""}</tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td></td>${opts.photos ? "<td></td>" : ""}<td>Total</td><td></td><td class="r">${totQty}</td><td></td><td class="r">${money(totVal)}</td><td class="r">${money(totMelt)}</td><td></td>${opts.kept ? "<td></td>" : ""}${opts.paid ? `<td class="r">${money(totPaid)}</td>` : ""}</tr></tfoot>
</table>
<h2>By coin type</h2>
<table><thead><tr><th>Type</th><th class="r">Coins</th><th class="r">Value</th><th class="r">Melt</th></tr></thead><tbody>${famRows}</tbody></table>
${metalRows ? `<h2>Precious metal content</h2><table><thead><tr><th>Metal</th><th class="r">Coins</th><th class="r">Fine weight</th><th class="r">Melt value</th></tr></thead><tbody>${metalRows}</tbody></table>` : ""}
<div class="note">
  ${coins.some((c) => missingOf(c).length) ? `<p><b>*Estimate.</b> ${NEED_NOTE}</p>` : ""}
  ${metalsMissingPrice().length ? `<p><b>Warning: totals are low.</b> No ${esc(metalWords(metalsMissingPrice()))} price was entered, so those coins are counted at face value or left out of melt.</p>` : ""}
  <p><b>How values were set.</b> Each coin uses the owner's own value where one was entered; otherwise the Red Book${ed ? " " + esc(ed) : ""} retail value for its grade; otherwise its melt value. Melt values use spot prices of ${spots ? esc(spots) : "(none entered)"}${s.spotUpdated ? ", as of " + esc(stampText(s.spotUpdated)) : ""}.</p>
  <p>These values are the owner's estimates for record keeping. This is not a professional appraisal. Some insurers require an appraisal for high-value coins.</p>
</div>
</body></html>`;
}

async function makeReport() {
  const opts = { kept: !!($("#repKept") || {}).checked, paid: !!($("#repPaid") || {}).checked, photos: !!($("#repPhotos") || {}).checked, name: ($("#repName") || {}).value || "", order: ($("#repOrder") || {}).value || "type" };
  const msg = $("#repMsg");
  if (repSel.mode === "pick") {
    const ids = new Set(ownedCoins().filter((c) => repSel.ids.has(c.id)).map((c) => c.id));
    if (!ids.size) { if (msg) { msg.textContent = "Tick at least one coin for the report."; msg.style.color = "var(--bad)"; } return; }
    opts.ids = ids;
  }
  if (msg) msg.textContent = opts.photos ? "Building the report and adding photos…" : "Building the report…";
  const html = await buildReport(opts);
  const name = "coin-collection-inventory-" + (opts.ids ? "selected-" : "") + today() + ".html";
  if (downloadsApi) {
    try {
      await downloadsApi.save({ filename: name, data: html });
      closeSheet();
      toast("Report saved. Open it, then print or save as PDF.");
      return;
    } catch (e) {
      if (e && e.code === "declined") { if (msg) msg.textContent = "Not saved."; return; }
    }
  }
  if (msg) msg.textContent = "Saving files isn't available here. Open Coin Cabinet from Claude to save the report.";
}

Object.assign(actions, {
  openReport: () => { closeMenu(); openReportForm(); },
  makeReport: () => makeReport(),
  repMode: (el) => {
    repSel.mode = el.dataset.v;
    $$("[data-act=repMode]").forEach((b) => b.classList.toggle("on", b === el));
    $("#repPick").hidden = repSel.mode !== "pick";
    if (repSel.mode === "pick") repRenderList();
  },
  repAll: () => { repShown().forEach((c) => repSel.ids.add(c.id)); repRenderList(); },
  repNone: () => { repSel.ids.clear(); repRenderList(); },
});
document.addEventListener("input", (e) => { if (e.target.id === "repSearch") { repSel.q = e.target.value; repRenderList(); } });
document.addEventListener("change", (e) => {
  const id = e.target.dataset && e.target.dataset.repid;
  if (!id) return;
  e.target.checked ? repSel.ids.add(id) : repSel.ids.delete(id);
  repUpdateCount();
});
