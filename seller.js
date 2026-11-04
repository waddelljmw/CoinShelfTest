/* Step 8.1: Seller Mode. A switch in Options, a Personal/Business tag on every item, a Business total kept apart
   from your collection, and a business profile. Saved in settings.seller = { on, profile: { name, ein, address, permit } }.
   A coin is Business when it has biz: true; a missing biz means Personal, so old coins need no change. */

const sellerOn = () => !!(settings().seller && settings().seller.on);
const sellerProfile = () => ({ name: "", ein: "", address: "", permit: "", ...((settings().seller || {}).profile || {}) });
const isBiz = (c) => !!c.biz;
const bizCoins = () => ownedCoins().filter(isBiz);
const saveSeller = (patch, quiet) => saveSettings({ seller: { ...(settings().seller || {}), ...patch } }, quiet);

// Add coin: the Personal / Business choice (only with Seller Mode on; inherited coins stay Personal).
function bizField(d) {
  if (!sellerOn() || isInherited(d)) return "";
  return `<label class="f"><span>Personal or Business</span><select data-f="biz"><option value="" ${d.biz ? "" : "selected"}>Personal (my collection)</option><option value="1" ${d.biz ? "selected" : ""}>Business stock (for sale)</option></select></label>
    <div class="hint">Business stock is counted apart from your collection.</div>`;
}
// Called by saveDraft: Business is saved as true, Personal as nothing at all.
function bizNormalize(c) {
  if (c.biz && !isInherited(c)) c.biz = true; else delete c.biz;
}

// Home: a small Business plaque (stock value, cost, count). Shown only with Seller Mode on.
function bizPlaqueHtml() {
  if (!sellerOn()) return "";
  const b = bizCoins();
  const value = sum(b, (c) => (bestEach(c) || 0) * qtyOf(c));
  const costs = b.filter((c) => costOf(c) != null);
  return `<div class="card biz-plaque"><div class="rowline"><b>Business stock</b><span class="muted small">${sum(b, qtyOf)} item${sum(b, qtyOf) === 1 ? "" : "s"}</span></div>
    <div class="stats"><div class="stat"><div class="k">Value</div><div class="v">${money(value, "$0.00")}</div></div>
    <div class="stat"><div class="k">Cost</div><div class="v">${money(sum(costs, costOf), "$0.00")}</div></div></div>
    ${b.length ? `<button class="link-btn" data-act="bizList">See Business stock</button>` : `<div class="small muted">Nothing yet. Choose Business when you add an item, or move one from its page.</div>`}</div>`;
}

// Options → Seller Mode.
function sellerOptionsHtml() {
  const on = sellerOn(), p = sellerProfile(), hidden = bizCoins().length;
  const inp = (k, label, ph) => `<label class="f"><span>${label}</span><input type="text" data-seller="${k}" value="${esc(p[k])}" placeholder="${esc(ph || "")}" maxlength="${k === "address" ? 160 : 60}"></label>`;
  return `<h2>Seller Mode</h2><div class="card">
    <label class="switch"><span>Seller Mode<div class="small muted">Business stock, and later dealer cases, shows and reports. Turn it off and they hide; nothing is deleted. ${typeof wi === "function" ? wi("seller") : ""}</div></span><input type="checkbox" data-act="sellerMode" ${on ? "checked" : ""}></label>
    ${hidden ? `<div class="hint">${hidden} item${hidden === 1 ? "" : "s"} tagged Business ${hidden === 1 ? "is" : "are"} kept and stay out of your collection totals.</div>` : ""}
    ${on ? `<details class="more" open><summary>Business profile</summary>
      <div class="hint">Stays on this phone and goes into your backup. Used on reports later.</div>
      ${inp("name", "Business name")}${inp("ein", "EIN or tax ID")}${inp("address", "Address")}${inp("permit", "State sales-tax permit number")}</details>` : ""}</div>`;
}
document.addEventListener("input", (e) => {
  const k = e.target.dataset && e.target.dataset.seller;
  if (!k) return;
  saveSeller({ profile: { ...sellerProfile(), [k]: e.target.value } }, true);
});

// Moving one item between Personal and Business. A personal coin keeps what you paid as its cost.
function bizMoveOne(id, toBiz) {
  const c = getCoin(id);
  if (!c) return;
  if (toBiz && isInherited(c)) { toast("Inherited coins can't be moved to Business."); return; }
  const before = JSON.parse(JSON.stringify(c)), after = JSON.parse(JSON.stringify(c));
  if (toBiz) after.biz = true; else delete after.biz;
  put("c_" + id, after);
  toast(toBiz ? "Moved to Business." : "Moved back to Personal.", { label: "Undo", fn: () => { put("c_" + id, before); toast("Undone."); } });
}
// The Move to Business button on a coin's page.
function bizButton(c) {
  if (!sellerOn() || c.status !== "owned") return "";
  if (isInherited(c)) return "";
  return isBiz(c)
    ? `<button class="btn" data-act="bizMove" data-id="${esc(c.id)}" data-v="0">Move back to Personal</button>`
    : `<button class="btn" data-act="bizMove" data-id="${esc(c.id)}" data-v="1">Move to Business</button>`;
}

Object.assign(actions, {
  sellerMode: (el) => { saveSeller({ on: !!el.checked }); render(); },
  bizList: () => { listState.status = "owned"; listState.family = null; listState.f = { biz: "business" }; go("coins"); },
  bizMove: (el) => bizMoveOne(el.dataset.id, el.dataset.v === "1"),
  // Select many: Move to Business
  bizBulk: () => {
    bulkApply("Moved to Business", (c) => {
      if (c.status !== "owned") return "not in your collection";
      if (isInherited(c)) return "inherited coins can't be Business";
      if (isBiz(c)) return "already Business";
      c.biz = true; return "";
    });
  },
  bizBulkBack: () => {
    bulkApply("Moved to Personal", (c) => {
      if (c.status !== "owned") return "not in your collection";
      if (!isBiz(c)) return "already Personal";
      delete c.biz; return "";
    });
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") ["sellerMode", "bizMove", "bizBulk", "bizBulkBack"].forEach((a) => SNAPSHOT_BLOCK.add(a));
