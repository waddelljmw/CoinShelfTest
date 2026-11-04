// Add / edit coin form (split from app.js; plain script, shares the page's global names)
/* --- Add / edit coin --- */
let draft = null;
function blankCoin() {
  return { kind: "coin", id: uid(), status: "owned", typeId: "", typeName: "", family: "", denom: "", year: "", mint: "", gradeMode: "raw", grade: "", customGrade: "",
    service: "PCGS", customService: "", cert: "", metal: "", oz: "", qty: 1, paid: "", value: "", source: "", acquired: "", albumId: "", notes: "", holder: "", cac: "", coa: false, packaging: "", photos: [], fbl: false, sms: false, variety: "", label: "", labelEdited: false,
    stage: "", upgrade: false, seller: "", buyTax: "", buyShip: "", buyFees: "", payMethod: "", receiptNo: "", receiptPhotos: [],
    knownVar: "", mintErrors: [], problems: [], errorNote: "", catNo: "", createdAt: Date.now() };
}
function openCoinForm(id) {
  const existing = id ? getCoin(id) : null;
  draft = existing ? JSON.parse(JSON.stringify(existing)) : blankCoin();
  draft._isNew = !existing;
  if (!existing) { const s = settings(); draft.source = s.lastSource || ""; draft._lastHolder = s.lastHolder || ""; } // quick-add: remember last source and holder
  draft._newAlbum = { brand: "Whitman", number: "" };
  draft._status = statusKey(draft);
  draft._goneReason = (draft.gone && draft.gone.reason) || "";
  draft._goneDate = (draft.gone && draft.gone.date) || "";
  if (!Array.isArray(draft.receiptPhotos)) draft.receiptPhotos = [];
  renderCoinForm();
}
function sourceOptions() {
  const known = new Set(SOURCE_DEFAULTS.map((x) => x.toLowerCase()));
  return [...new Set([...SOURCE_DEFAULTS, ...allCoins().map((c) => (c.source || "").trim()).filter((x) => x && !known.has(x.toLowerCase()))])];
}
// Picking where a coin came from (the Source list or a chip): sets the source and a matching "Paid with" on a new coin.
function applySourceKind(d, v) {
  d._sourceKind = v;
  d.source = v === "Other" ? "" : v;
  // Paid with fills itself on a new coin (still editable): online platforms → Card, Coin Show → Cash.
  const auto = ["eBay", "Whatnot"].includes(v) ? "Card" : v === "Coin Show" ? "Cash" : "";
  if (d._isNew && auto && (!d.payMethod || d.payMethod === d._payAuto)) { d.payMethod = auto; d._payAuto = auto; }
}
// "Where from" chips right after Grade: Inherited first, then the three most used, then More… (opens the full list under Purchase details).
function sourceChips(d) {
  const counts = {};
  allCoins().forEach((c) => { const s = (c.source || "").trim(); if (s && s !== "Inherited") counts[s] = (counts[s] || 0) + 1; });
  const common = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
  ["Coin Shop", "Coin Show", "eBay"].forEach((x) => { if (common.length < 3 && !common.includes(x)) common.push(x); });
  const names = ["Inherited", ...common];
  const cur = d._sourceKind;
  if (cur && cur !== "Other" && !names.includes(cur)) names.push(cur); // a chosen source stays visible
  return `<div class="f"><span>Where from <span class="muted small">(optional)</span></span><div class="chips wrap" style="flex-wrap:wrap">${names.map((n) => `<button type="button" class="chip ${cur === n ? "on" : ""}" data-act="srcChip" data-v="${esc(n)}" aria-pressed="${cur === n}">${esc(n)}</button>`).join("")}<button type="button" class="chip" data-act="srcChip" data-v="__more">More…</button></div></div>`;
}
// First render of a coin: figure out whether its saved source is a known choice or custom text.
function initSourceKind(d) {
  if (d._sourceKind !== undefined) return;
  const canon = SOURCE_DEFAULTS.find((x) => x.toLowerCase() === (d.source || "").trim().toLowerCase()); // "Coin shop" saved before → "Coin Shop"
  if (canon) d.source = canon;
  d._sourceKind = !d.source ? "" : sourceOptions().includes(d.source) ? d.source : "Other";
}
// Mint marks offered for a type. Proofs have their own list: e.g. West Point (W) proofs of Silver Eagles.
function proofMintsOf(t) {
  if (t.proofMints) return t.proofMints;
  return t.end < 1968 ? ["P"] : t.start >= 1968 ? ["S"] : ["P", "S"]; // US proofs moved from Philadelphia to San Francisco in 1968
}
function mintChoices(t, proof) {
  if (!t) return MINTS;
  const ms = proof ? proofMintsOf(t) : t.mints;
  return ["", ...ms.filter((m) => m !== "P"), ...(!proof && ms.includes("P") ? ["P"] : [])];
}
// Closed-by-default section. It stays open (or closed) as you left it, even when the form redraws.
function sec(key, title, body, hasData) {
  const o = draft._open && draft._open[key];
  const open = o !== undefined ? o : !!hasData && !draft._isNew; // new coins start with every section closed
  return `<details data-sec="${key}" ${open ? "open" : ""}><summary>${title}</summary>${body}</details>`;
}
function whatPicker() {
  return openSheet(`<div class="sheet-head"><h2>Add coin</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  ${store.mode === "snapshot" ? `<div class="banner" style="margin:0 0 6px">Try it out. This copy doesn't save, so coins added here disappear when the page is closed.</div>` : ""}
  <div class="f"><span>What is it?</span></div>
  <button type="button" class="btn block what-btn" data-act="what" data-v="us"><b>US coin</b><small>Cent to dollar, loose or in a holder</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="set"><b>Proof or mint set</b><small>One entry for the whole set</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="roll"><b>Roll of coins</b><small>Bank roll, tube or mint-sealed roll</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="bullion"><b>Silver bar, round or other item</b><small>Bullion that goes in a stack</small></button>
  <button type="button" class="btn block what-btn" data-act="what" data-v="other"><b>Medal, token or foreign coin</b><small>Anything that isn't a US coin from the Red Book</small></button>`, "sheet-75");
}
function renderCoinForm() {
  const d = draft;
  const it = itemOf(d);
  const noun = it === "set" ? "set" : it === "roll" ? "roll" : "coin";
  if (d._isNew && !d.typeId && !d.typeName && !d._what) return whatPicker();
  document.querySelectorAll(`#coinForm[data-coin="${d.id}"] details[data-sec]`).forEach((x) => { (d._open = d._open || {})[x.dataset.sec] = x.open; }); // keep sections as you left them
  const t = TYPE_BY_ID[d.typeId];
  const other = it !== "bullion" && (d._isNew && !d.typeId && d._what === "other" || !d._isNew && !t);
  if (d.grade && d.grade !== "Other") d._proof = isProofGrade(d.grade); // a grade that's set decides the switch
  else if (d._proof === undefined) d._proof = false;
  const mints = mintChoices(t, d._proof).concat(d.mint && !mintChoices(t, d._proof).includes(d.mint) ? [d.mint] : []); // keep an older saved mint visible
  const grades = (d.gradeMode === "cert" ? CERT_GRADES : GRADES).filter((g) => isProofGrade(g) === !!d._proof);
  const melt = meltEach(d);
  initSourceKind(d);
  const h = formHolder(d);
  const typeBlock = !d._isNew
    ? `<div class="f"><span>Coin type</span><div class="locked-type"><b>${esc(t ? t.name : d.typeName || "Custom coin")}</b>${d.denom ? ` <span class="muted small">${esc(d.denom)}</span>` : ""}</div>
      <div class="hint">The coin type can't change once a coin is saved. <button type="button" class="link-btn" data-act="retype">Wrong type? Re-add it</button></div></div>`
    : other
      ? `${otherPicker(d)}<label class="f"><span>Kind</span><select data-f="family" data-rerender><option value="">Choose…</option>${OTHER_KINDS.map((k) => `<option ${d.family === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>
      <div class="grid2">
      <label class="f"><span>What is it called?</span><input type="text" data-f="typeName" value="${esc(d.typeName)}" placeholder="e.g. Casino token"></label>
      <label class="f"><span>Face value</span><input type="text" data-f="denom" value="${esc(d.denom)}" placeholder="$1"></label></div>`
      : `<div class="f typeahead"><span>Coin type</span>
      <input type="search" id="typeSearch" placeholder="Search by name, e.g. Morgan" value="${esc(t ? t.name : "")}">
      <div class="ta-list" id="typeList" hidden></div>
      <div class="hint"><button type="button" class="link-btn" data-act="what" data-v="other">Can't find it? Type it yourself</button></div>
    </div>`;
  openSheet(`<div class="sheet-head"><h2>${d._isNew ? (d._stay ? "Add coin to album" : "Add " + noun) : "Edit " + noun}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
  ${store.mode === "snapshot" ? `<div class="banner" style="margin:0 0 6px">Try it out. This copy doesn't save, so coins added here disappear when the page is closed.</div>` : ""}
  <form id="coinForm" data-coin="${d.id}" autocomplete="off">
    ${d._isNew && !other && it === "coin" ? (store.mode === "demo" && typeof demoFillCard === "function" ? demoFillCard(d) : sampleApi ? photoFillButton(d) : photoFillLockedButton()) : ""}
    ${it === "bullion" ? bullionTopHtml(d) : it === "set" ? setTopHtml(d) : `${typeBlock}
    ${t && t.note ? `<div class="hint">${esc(t.note)}</div>` : ""}
    <div class="grid2">
      <label class="f"><span>Year</span><input type="number" inputmode="numeric" data-f="year" value="${esc(d.year)}" placeholder="${t ? t.start + "–" + typeLastYear(t) : "1921"}"></label>
      ${other ? "" : `<label class="f"><span>Mint mark</span><select data-f="mint">${mints.map((m) => `<option value="${m}" ${d.mint === m ? "selected" : ""}>${m || "None (Philadelphia)"}</option>`).join("")}</select></label>`}
    </div>
    <div class="hint" id="yearHint" style="color:var(--bad)">${esc(yearProblem(d.typeId, d.year, "coin"))}</div>`}
    ${it === "roll" ? rollFields(d) : ""}

    ${it !== "coin" ? "" : `<fieldset><legend>Grade</legend>
      <div class="seg"><button type="button" data-act="gmode" data-v="raw" class="${d.gradeMode === "raw" ? "on" : ""}">Raw</button><button type="button" data-act="gmode" data-v="cert" class="${d.gradeMode === "cert" ? "on" : ""}">Certified</button></div>
      ${d.gradeMode === "cert" ? `<div class="grid2">
        <label class="f"><span>Grading service</span><select data-f="service" data-rerender>${SERVICES.map((s) => `<option ${d.service === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        <label class="f"><span>Cert number</span><input type="text" inputmode="numeric" data-f="cert" value="${esc(d.cert)}"></label></div>
        ${d.service === "Other" ? `<label class="f"><span>Service name</span><input type="text" data-f="customService" value="${esc(d.customService)}"></label>` : ""}
        <div class="grid2"><label class="f"><span>CAC sticker</span><select data-f="cac"><option value="">None</option><option ${d.cac === "Green" ? "selected" : ""}>Green</option><option ${d.cac === "Gold" ? "selected" : ""}>Gold</option></select></label>
        <label class="f"><span>Catalog number (optional)</span><input type="text" data-f="catNo" value="${esc(d.catNo || "")}" placeholder="From the label, e.g. 7172" maxlength="20"></label></div>
        <div class="hint">The ${d.service === "NGC" ? "NGC" : "PCGS"} coin number printed on the slab's label. Later it opens this exact coin in PCGS Photograde.</div>` : ""}
      <label class="switch"><span>Proof<div class="small muted">Mirror-finish coin made for collectors. Shows proof grades (PR) and the mints that struck proofs.</div></span><input type="checkbox" data-act="toggleProof" ${d._proof ? "checked" : ""}></label>
      <label class="f"><span>${d.gradeMode === "cert" ? "Grade on the holder" : "My estimated grade"}</span>
        <select data-f="grade" data-rerender><option value="">Choose…</option>${grades.map((g) => `<option ${d.grade === g ? "selected" : ""}>${g}</option>`).join("")}<option value="Other" ${d.grade === "Other" ? "selected" : ""}>Other…</option></select></label>
      ${d.grade === "Other" ? `<label class="f"><span>Custom grade</span><input type="text" data-f="customGrade" value="${esc(d.customGrade)}" placeholder="e.g. VF details, cleaned"></label>` : ""}
      ${isJunk(d) ? `<div class="hint">Junk coins are valued at melt.</div>` : ""}
      <div class="hint"><a id="pcgsLink" href="${esc(photoGuideUrl(d))}" target="_blank" rel="noopener">${esc(photoGuideText(d))} ↗</a></div>
      ${it === "coin" && (d.typeName || d.year) ? `<div class="hint"><a id="ebayLink" href="${esc(ebayUrl(d))}" target="_blank" rel="noopener">Check eBay sold ↗</a></div>` : ""}
      ${PRICE_BOOK.series[d.typeId] && PRICE_BOOK.series[d.typeId].fbl && !isProofGrade(d.grade) ? `<label class="switch"><span>Full Bell Lines (FBL)<div class="small muted">All the lines on the Liberty Bell are complete.</div></span><input type="checkbox" data-fcheck="fbl" ${d.fbl ? "checked" : ""}></label>` : ""}
      <div id="smsBox">${smsField(d)}</div>
      <div id="varietyBox">${varietyField(d)}</div>
    </fieldset>`}

    ${sourceChips(d)}
    ${purchaseFields(d)}

    ${sec("value", "Quantity, value and metal", `${typeof manyField === "function" ? manyField(d) : ""}<div class="grid2">
      <label class="f"><span>Quantity</span><input type="number" inputmode="numeric" min="1" data-f="qty" value="${esc(d.qty)}"></label>
      <label class="f"><span>Value${eachWord(d)}</span><input type="number" inputmode="decimal" step="0.01" data-f="value" value="${esc(isJunk(d) ? "" : d.value)}" placeholder="${isJunk(d) ? "melt" : "$"}" ${isJunk(d) ? "disabled" : ""}></label>
    </div>
    <div class="hint" id="bookHint">${esc(bookHintText(d))}</div>
    ${it === "bullion" ? "" : `<div class="grid2">
      ${it === "set" ? "" : `<label class="f"><span>Metal</span><select data-f="metal" data-rerender><option value="">Choose…</option>${METALS.map((m) => `<option ${d.metal === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>`}
      <label class="f"><span>${it === "set" ? "Silver in the set (oz)" : it === "roll" ? "Metal content per coin (oz)" : "Metal content (oz)"}</span><input type="number" inputmode="decimal" step="0.00001" data-f="oz" value="${esc(d.oz)}" placeholder="0.77344"></label>
    </div>`}
    ${other ? gramsHelper(d) : ""}
    <div class="hint" id="meltHint">${esc(meltHintText(d))}</div>`, num(d.qty) > 1 || d.value || (other && d.metal) || (typeof manyOn === "function" && manyOn(d)))}

    ${sec("status", "Status" + (d._status && d._status !== "owned" ? ` <span class="muted small">· ${esc(STATUS_TEXT[d._status] || "")}</span>` : ""), statusFields(d), (d._status && d._status !== "owned") || d.upgrade || d.status === "sold")}

    ${sec("holder", (it === "set" ? "Packaging and Kept in" : "Holder and Kept in") + (h ? ` <span class="muted small">· ${esc(h)}</span>` : ""), `${keptInFields(d)}
    ${d.albumId === "__new" ? `<div class="grid2">
      <label class="f"><span>Brand</span><select data-na="brand">${ALBUM_BRANDS.map((b) => `<option ${d._newAlbum.brand === b ? "selected" : ""}>${b}</option>`).join("")}</select></label>
      <label class="f"><span>${d._newAlbum.brand === "Other" ? "Album name" : "Album number"}</span><input type="text" data-na="number" value="${esc(d._newAlbum.number)}" placeholder="${d._newAlbum.brand === "Dansco" ? "7070" : d._newAlbum.brand === "Whitman" ? "9128" : "My Morgans"}"></label></div>
      ${d._newAlbum.brand === "Other" ? `<label class="f"><span>Spine color</span><select data-na="color">${BOX_COLORS.filter((x) => x[0] !== "clear").map((x) => `<option value="${x[0]}" ${(d._newAlbum.color || "red") === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></label>` : ""}
      <div class="hint">Makes a virtual album for this coin type with every date and mint mark. Change its name or date range later with Edit album on the album's page.</div>` : ""}
    ${holderFields(d)}`, d.albumId || d.holder || d.coa || d.packaging || d.stack || d.boxId)}

    ${it === "coin" ? errorFields(d) : ""}

    ${sec("photos", `Photos (${(d.photos || []).length})`, `<div class="photos">${(d.photos || []).map((p, i) => `<div class="ph"><img src="${esc(photoSrc(p))}" alt=""><button type="button" class="rm" data-act="rmPhoto" data-i="${i}" aria-label="Remove photo">✕</button></div>`).join("")}</div>
      <label class="btn file-btn" style="display:inline-block;margin-top:10px">Add photos<input type="file" accept="image/*" multiple id="photoInput"></label>
      <div class="hint" id="photoHint">${store.mode === "db" && !assetsApi ? "Photos can't be saved from this view." : ""}</div>`, (d.photos || []).length)}

    ${sec("notes", "Notes and label", `<label class="f"><span>Notes</span><textarea data-f="notes">${esc(d.notes)}</textarea></label>
      <label class="f"><span>Label</span><input type="text" id="labelInput" data-f="label" value="${esc(d.labelEdited ? d.label : autoLabel(d))}"></label>
      <div class="hint">Fills in as date-mint mark, coin type, denomination. Type over it to use your own.${d.labelEdited ? ` <button type="button" class="link-btn" data-act="resetLabel">Use automatic label</button>` : ""}</div>`, d.notes || d.labelEdited)}

    <div class="btn-row">
      <button type="submit" class="btn primary">${d._isNew ? "Add " + noun : "Save changes"}</button>
      <button type="button" class="btn" data-act="closeSheet">Cancel</button>
    </div>
  </form>`, d._short ? "sheet-75" : "");
  refreshFormHints();
}

// Status picker. Sold is set with Mark as sold on the coin's page.
function statusFields(d) {
  if (d.status === "sold") return `<div class="hint">Status: <b>Sold</b>. To change it, use Edit sale or Move back to collection on the coin's page.</div>`;
  const inh = isInherited(d);
  if (inh && d._status === "forsale") d._status = "owned";
  const opts = ["owned", "coming", "forsale", "gone"].filter((k) => !(k === "forsale" && inh));
  return `<div class="grid2">
      <label class="f"><span>Status</span><select data-f="_status" data-rerender>${opts.map((k) => `<option value="${k}" ${d._status === k ? "selected" : ""}>${STATUS_TEXT[k]}</option>`).join("")}</select></label>
      <label class="switch" style="align-self:end"><span>Upgrade wanted<div class="small muted">You'd like a nicer one</div></span><input type="checkbox" data-fcheck="upgrade" ${d.upgrade ? "checked" : ""}></label>
    </div>
    <label class="f"><span>Group <span class="muted small">(optional)</span></span><input type="text" data-f="group" list="groupList" value="${esc(d.group || "")}" placeholder="${esc(isInherited(d) ? "Inherited" : "My collection")}"><datalist id="groupList">${[...new Set(["My collection", "Inherited", ...allCoins().map((c) => String(c.group || "").trim()).filter(Boolean)])].map((g) => `<option value="${esc(g)}">`).join("")}</datalist></label>
    ${typeof bizField === "function" ? bizField(d) : ""}
    <div class="hint">${d._status === "coming" ? "Bought or won, not here yet. Counted in your totals." : d._status === "gone" ? "Traded, gifted or lost. Left out of your totals." : inh ? "Inherited coins can't be set to For sale." : ""}</div>
    ${d._status === "forsale" && typeof askField === "function" ? askField(d) : ""}
    ${d._status === "coming" || d.trackNo ? `<div class="grid2">
      <label class="f"><span>Tracking number</span><input type="text" data-f="trackNo" id="trackNo" value="${esc(d.trackNo || "")}" placeholder="Paste it here" maxlength="40" autocapitalize="characters"></label>
      <label class="f"><span>Carrier</span><select data-f="trackCarrier"><option value="">Work it out</option>${CARRIERS.map((x) => `<option ${d.trackCarrier === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
      <button type="button" class="link-btn" data-act="pasteTrack">📋 Paste tracking number</button>` : ""}
    ${d._status === "gone" ? `<div class="grid2">
      <label class="f"><span>What happened?</span><select data-f="_goneReason"><option value="">Choose…</option>${GONE_REASONS.map((x) => `<option ${d._goneReason === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="f"><span>When</span><input type="date" data-f="_goneDate" value="${esc(d._goneDate || "")}" max="${today()}"></label></div>` : ""}`;
}
function purchaseFields(d) {
  const has = d.seller || d.paid || d.acquired || BUY_EXTRAS.some((k) => num(d[k]) != null) || d.payMethod || d.receiptNo || (d.receiptPhotos || []).length || (d.source && !d._isNew);
  const money$ = (k, label) => `<label class="f"><span>${label}</span><input type="number" inputmode="decimal" step="0.01" min="0" data-f="${k}" value="${esc(d[k] || "")}" placeholder="$"></label>`;
  return sec("purchase", "Purchase details" + (d.source ? ` <span class="muted small">· ${esc(d.source)}</span>` : ""), `${typeof manyPayFields === "function" ? manyPayFields(d) : ""}<div class="grid2">
      <label class="f"><span>${typeof paidLabel === "function" ? paidLabel(d) : "Paid each"}</span><input type="number" inputmode="decimal" step="0.01" data-f="paid" value="${esc(d.paid)}" placeholder="$"></label>
      <label class="f"><span>Date acquired</span><input type="date" data-f="acquired" value="${esc(d.acquired)}"></label>
    </div>
    <label class="f"><span>Source</span><select data-f="_sourceKind" data-rerender><option value="">Choose…</option>${sourceOptions().map((s) => `<option value="${esc(s)}" ${d._sourceKind === s ? "selected" : ""}>${esc(s)}</option>`).join("")}<option value="Other" ${d._sourceKind === "Other" ? "selected" : ""}>Other…</option></select></label>
    ${d._sourceKind === "Coin Shop" ? `<label class="f"><span>Shop or dealer name (optional)</span><input type="text" data-f="seller" list="sellerList" value="${esc(d.seller || "")}" placeholder="e.g. Main Street Coins" maxlength="60"></label>` : ""}
    ${d._sourceKind === "Other" ? `<label class="f"><span>Where did you get it?</span><input type="text" data-f="source" value="${esc(d.source)}" placeholder="e.g. Grandpa's collection, flea market"></label>` : ""}
    <div class="hint" id="inhHint" ${isInherited(d) ? "" : "hidden"}><span class="dns">Do not sell</span> Inherited coins are marked do-not-sell and aren't counted in gains.</div>
      <div class="grid2">
        ${d._sourceKind === "Coin Shop" ? "" : `<label class="f"><span>Seller</span><input type="text" data-f="seller" list="sellerList" value="${esc(d.seller || "")}" placeholder="Person or shop" maxlength="60"></label>`}
        <label class="f"><span>Paid with</span><select data-f="payMethod"><option value="">Choose…</option>${PAY_METHODS.concat(d.payMethod && !PAY_METHODS.includes(d.payMethod) ? [d.payMethod] : []).map((x) => `<option ${d.payMethod === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      </div>
      <datalist id="sellerList">${pastSellers().map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="grid3">${money$("buyTax", "Tax")}${money$("buyShip", "Shipping")}${money$("buyFees", "Fees")}</div>
      <div class="hint" id="costHint">${costHintText(d)}</div>
      <label class="f"><span>Receipt number</span><input type="text" data-f="receiptNo" value="${esc(d.receiptNo || "")}" placeholder="Order or invoice number" maxlength="60"></label>
      <div class="photos">${(d.receiptPhotos || []).map((p, i) => `<div class="ph"><img src="${esc(photoSrc(p))}" alt=""><button type="button" class="rm" data-act="rmPhoto" data-k="receiptPhotos" data-i="${i}" aria-label="Remove receipt photo">✕</button></div>`).join("")}</div>
      <label class="btn file-btn" style="display:inline-block;margin-top:6px">${(d.receiptPhotos || []).length ? "Add another receipt photo" : "Add receipt photo"}<input type="file" accept="image/*" id="receiptInput"></label>`, has);
}
function costHintText(d) {
  const c = costOf(d);
  if (c == null) return BUY_EXTRAS.some((k) => num(d[k]) != null) ? "Enter Paid each to see the total cost." : "Tax, shipping and fees are for this whole entry.";
  return "Total cost: " + money(c) + (qtyOf(d) > 1 ? " for " + qtyOf(d) + " coins" : "") + ". Used for your gains.";
}
function knownVarHint(d) {
  const kv = knownVarieties(d);
  return kv.length ? "Known for this date: " + kv.join(", ") + "." : d.typeId && d.year ? "No known varieties listed for this date. You can type one." : "Pick the type and year to see known varieties.";
}
function errorFields(d) {
  const errs = listOf(d.mintErrors), probs = listOf(d.problems);
  const checks = (key, all, on) => `<div class="chk-list">${all.map((x) => `<label><input type="checkbox" data-flist="${key}" value="${esc(x)}" ${on.includes(x) ? "checked" : ""}>${esc(x)}</label>`).join("")}</div>`;
  return sec("errors", "Errors and problems" + (probs.length ? " · Details" : ""), `
      <label class="f"><span>Known variety</span><input type="text" data-f="knownVar" list="kvList" value="${esc(d.knownVar || "")}" placeholder="e.g. Doubled Die Obverse" maxlength="60"></label>
      <datalist id="kvList">${knownVarieties(d).map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
      <div class="hint" id="kvHint">${esc(knownVarHint(d))}</div>
      <div class="small" style="margin-top:8px"><b>Mint errors</b> <span class="muted">(mistakes made when it was struck)</span></div>
      ${checks("mintErrors", MINT_ERRORS, errs)}
      <div class="small"><b>Problems</b> <span class="muted">(damage after it left the Mint)</span></div>
      ${checks("problems", COIN_PROBLEMS, probs)}
      <div class="hint">Any problem makes it a "Details" coin. Red Book prices are for coins without problems, so they aren't used for it.</div>
      <label class="f"><span>Describe (optional)</span><textarea data-f="errorNote" placeholder="e.g. 10% off-center at 3 o'clock">${esc(d.errorNote || "")}</textarea></label>`, d.knownVar || errs.length || probs.length || d.errorNote);
}
// The holder the form shows: what was picked, else Album / Slab when that fits, else (new coins) the last holder used.
function formHolder(d) {
  if (itemOf(d) !== "coin") return d.holder || "";
  return normHolder(d.holder) || (d.albumId ? "Album" : d.gradeMode === "cert" ? "Slab" : d._isNew ? normHolder(d._lastHolder) : "");
}
function holderFields(d) {
  const h = formHolder(d);
  const showPack = d.coa || h === "Mint box" || h === "Other";
  return `<div class="grid2">
      <label class="f"><span>${itemOf(d) === "set" ? "Packaging" : "Holder"}</span><select data-f="holder" data-rerender><option value="">Choose…</option>${holderList(d, h).map((x) => `<option ${h === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="switch" style="align-self:end"><span>COA included<div class="small muted">Certificate of authenticity</div></span><input type="checkbox" data-fcheck="coa" data-rerender ${d.coa ? "checked" : ""}></label>
    </div>
    ${showPack ? `<label class="f"><span>${h === "Other" ? "Describe the holder / packaging" : "Box and packaging"}</span><input type="text" data-f="packaging" value="${esc(d.packaging || "")}" placeholder="${h === "Other" ? "e.g. velvet case" : "e.g. original blue box, outer sleeve"}"></label>` : ""}
    ${typeof boxFields === "function" ? boxFields(d) : ""}
    ${itemOf(d) === "coin" && CASE_HOLDERS.includes(h) ? `<label class="f"><span>Case name <span class="muted small">(several coins in one case)</span></span><input type="text" data-f="caseName" list="caseNames" value="${esc(d.caseName || "")}" placeholder="e.g. Steel cents case"><datalist id="caseNames">${[...new Set(ownedCoins().map((c) => (c.caseName || "").trim()).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>` : ""}`;
}
function holderList(d, h) {
  const l = itemOf(d) === "set" ? SET_HOLDERS : itemOf(d) === "roll" ? ROLL_HOLDERS : itemOf(d) === "bullion" ? BULLION_HOLDERS : HOLDERS;
  return l.concat(h && !l.includes(h) ? [h] : []);
}
// Sets: kind and year. Rolls: count, condition and bank wrap.
function rollHint(d) {
  const f = rollFace(d);
  return (f != null ? "Face value " + money(f) + ". " : "") + "Leave the year empty for mixed dates.";
}
function rollFields(d) {
  return `<div class="grid2">
      <label class="f"><span>Coins in the roll</span><input type="number" inputmode="numeric" min="1" data-f="rollCount" value="${esc(d.rollCount)}"></label>
      <label class="f"><span>Roll condition</span><select data-f="rollCond"><option value="">Choose…</option>${ROLL_CONDS.map((x) => `<option ${d.rollCond === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
    <label class="switch"><span>Original bank wrap<div class="small muted">Never opened</div></span><input type="checkbox" data-fcheck="bankWrap" ${d.bankWrap ? "checked" : ""}></label>
    <div class="hint" id="rollHint">${esc(rollHint(d))}</div>`;
}
function bullionHint(d) { return bullionOz(d) ? "Pure silver: " + bullionOz(d) + " oz (weight × purity)." : "Pure silver ounces = weight × purity. Pick ounces (troy), grams or kilos; a kilo bar is 32.15 oz."; }
function bullionTopHtml(d) {
  const makers = [...new Set(allCoins().filter((c) => itemOf(c) === "bullion").map((c) => (c.bMaker || "").trim()).filter(Boolean))];
  return `<div class="grid2">
      <label class="f"><span>What is it?</span><select data-f="bShape">${BULLION_SHAPES.map((x) => `<option value="${x}" ${(d.bShape === "Shape" ? "Other" : d.bShape || "Bar") === x ? "selected" : ""}>${esc(shapeName(x))}</option>`).join("")}</select></label>
      <label class="f"><span>Maker</span><input type="text" data-f="bMaker" list="makerList" value="${esc(d.bMaker || "")}" placeholder="e.g. Engelhard" maxlength="40"><datalist id="makerList">${makers.map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label></div>
    <div class="grid2">
      <label class="f"><span>Weight</span><span class="inline-pair"><input type="number" inputmode="decimal" step="0.001" min="0" data-f="_bAmt" value="${esc(barAmount(d))}" placeholder="10" aria-label="Weight"><select data-f="bUnit" data-rerender aria-label="Weight unit">${BAR_UNITS.map((u) => `<option value="${u[0]}" ${barUnit(d) === u[0] ? "selected" : ""}>${u[1]}</option>`).join("")}</select></span></label>
      <label class="f"><span>Purity</span><input type="number" inputmode="decimal" step="0.001" min="0" max="1" data-f="bPurity" value="${esc(d.bPurity || "")}" placeholder="0.999"></label></div>
    <div class="hint" id="bullionHint">${esc(bullionHint(d))}</div>
    <label class="f"><span>Serial number <span class="muted small">(optional)</span></span><input type="text" data-f="bSerial" value="${esc(d.bSerial || "")}" maxlength="40"></label>
    <label class="f"><span>Stack</span><input type="text" data-f="stack" list="stackList" value="${esc(d.stack || "")}" placeholder="My Silver Stack"><datalist id="stackList">${stackNames().map((x) => `<option value="${esc(x)}">`).join("")}</datalist></label>
    <div class="hint">Silver only for now. It counts in your total and stays in the stack you name.</div>`;
}
function setTopHtml(d) {
  const k = SET_BY_ID[d.setKind];
  return (d._isNew ? `<label class="f"><span>Kind of set</span><select data-f="setKind" data-rerender><option value="">Choose…</option>${SET_KINDS.map((x) => `<option value="${x.id}" ${d.setKind === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>`
    : `<div class="f"><span>Kind of set</span><div class="locked-type"><b>${esc(k ? k.name : d.typeName || "Set")}</b></div></div>`)
    + `<label class="f"><span>Year</span><input type="number" inputmode="numeric" data-f="year" value="${esc(d.year)}" placeholder="1964"></label>
    <div class="hint" id="yearHint" style="color:var(--bad)">${esc(setYearProblem(d.setKind, d.year))}</div>`;
}
function setOzText(d) {
  if (!d.setKind || !d.year) return "";
  const v = setSilverOz(d.setKind, num(d.year));
  return v == null ? "Type the silver content from the box or a price guide, if it has silver." : v === 0 ? "This set has no silver coins." : "Filled in: " + v + " oz of silver in this set.";
}
// Coins outside the catalog: kinds, remembered items, and a grams-to-ounces helper.
const OTHER_KINDS = ["Commemorative", "Medal", "Token", "Foreign coin", "Other"];
const GRAMS_PER_TROY_OZ = 31.1035;
// Bar weight can be typed in ounces, grams or kilos. It is always stored in troy ounces (bWeight), so old bars don't change; bUnit is just how it is shown.
const BAR_UNITS = [["oz", "Ounces (oz)", 1], ["g", "Grams (g)", GRAMS_PER_TROY_OZ], ["kg", "Kilos (kg)", GRAMS_PER_TROY_OZ / 1000]];
const barUnit = (c) => (BAR_UNITS.some((u) => u[0] === c.bUnit) ? c.bUnit : "oz");
const unitFactor = (u) => (BAR_UNITS.find((x) => x[0] === u) || BAR_UNITS[0])[2];
const roundTo = (n, p) => Math.round(n * 10 ** p) / 10 ** p;
function barAmount(c) { const w = num(c.bWeight); return w ? roundTo(w * unitFactor(barUnit(c)), 4) : ""; }
const barWeightText = (c) => { const w = num(c.bWeight); return w ? roundTo(w * unitFactor(barUnit(c)), 3) + " " + barUnit(c) : ""; };
// Things typed before (name, face value, kind, metal, weight), newest first, so metal and weight are typed once.
function savedOthers() {
  const seen = new Map();
  allCoins().filter((c) => !c.typeId && c.typeName && itemOf(c) === "coin" && (c.status === "owned" || c.status === "sold")).forEach((c) => {
    const k = [c.typeName, c.denom, c.metal, c.oz].join("|");
    if (!seen.has(k)) seen.set(k, { name: c.typeName, denom: c.denom || "", family: OTHER_KINDS.includes(c.family) ? c.family : "", metal: c.metal || "", oz: c.oz || "" });
  });
  return [...seen.values()];
}
function otherPicker(d) {
  if (!d._isNew) return "";
  const list = savedOthers();
  if (!list.length) return "";
  return `<label class="f"><span>Used before</span><select data-act-change="useOther"><option value="">Pick one you've added before…</option>${list.map((o, i) => `<option value="${i}">${esc(o.name)}${o.denom ? " · " + esc(o.denom) : ""}${o.metal ? " · " + esc(o.metal) : ""}${num(o.oz) ? " · " + esc(o.oz) + " oz" : ""}</option>`).join("")}</select></label>`;
}
function gramsHelper(d) {
  if (!MELT_OF_METAL[d.metal]) return "";
  return `<div class="grid2">
    <label class="f"><span>Weight in grams</span><input type="number" inputmode="decimal" step="0.001" data-f="_grams" value="${esc(d._grams || "")}" placeholder="e.g. 20"></label>
    <label class="f"><span>Purity</span><input type="number" inputmode="decimal" step="0.001" data-f="_purity" value="${esc(d._purity || "")}" placeholder="0.900"></label></div>
  <div class="hint">Only know grams? Enter the weight and purity (0.900 = 90%) and the ounces fill in above.</div>`;
}
function gramsToOz(d) {
  const g = num(d._grams), p = num(d._purity);
  if (!g || !p || p <= 0 || p > 1) return;
  d.oz = String(Math.round((g * p / GRAMS_PER_TROY_OZ) * 100000) / 100000);
  const oi = $("[data-f=oz]"); if (oi) oi.value = d.oz;
}
function meltHintText(d) {
  const m = meltEach(d);
  const t = m != null ? "Melt today: " + money(m) + eachWord(d) + "." : meltKey(d) ? "Enter the spot price in Options to see melt." : "";
  return itemOf(d) === "set" ? (setOzText(d) + " " + t).trim() : t;
}
// Sets: fill in the silver for the kind and year, unless it was typed by hand.
function autoSetOz(d) {
  if (itemOf(d) !== "set" || d._ozEdited) return;
  const v = setSilverOz(d.setKind, num(d.year));
  d.oz = v ? String(v) : "";
  d.metal = num(d.oz) ? "Silver" : "";
}
function smsField(d) {
  if (!hasSms(d) || isProofGrade(d.grade)) return "";
  return `<label class="switch"><span>Special Mint Set (SMS)<div class="small muted">From a 1964–1967 Special Mint Set, not a regular strike.</div></span><input type="checkbox" data-fcheck="sms" ${d.sms ? "checked" : ""}></label>`;
}
function varietyField(d) {
  const vs = bookVarieties(d);
  if (!vs.some((v) => v)) return "";
  // Always offer a neutral first choice, so nothing gets tagged with a variety by accident.
  const choices = vs.includes("") ? vs : ["", ...vs];
  const blank = vs.includes("") ? "Regular (no variety)" : "Not sure / not listed";
  const tt = TYPE_BY_ID[d.typeId];
  const needsDesign = tt && tt.varieties && tt.varieties[d.year + "|" + normMint(d.mint)] && !d.variety;
  return `<label class="f"><span>Variety</span><select data-f="variety" data-rerender>${choices.map((v) => `<option value="${esc(v)}" ${(d.variety || "") === v ? "selected" : ""}>${esc(v || blank)}</option>`).join("")}</select></label>${needsDesign ? `<div class="hint">Pick the design so this coin fills its own spot in an album.</div>` : ""}`;
}
function bookHintText(d) {
  if (itemOf(d) === "bullion") return "Leave value empty to use melt. For a collectible bar, type your own value.";
  if (itemOf(d) === "set") return "Value is your own price. Leave it empty to use the silver (melt) value.";
  if (itemOf(d) === "roll") return "Leave value empty: clad rolls count at face value, silver rolls at melt. For a nicer roll (UNC, BU, bank wrap, key dates), type your own value. Check eBay sold on the roll's page helps.";
  if (isJunk(d)) return "";
  const b = bookLookup(d);
  if (!b) return "";
  const t = bookText(b);
  if (b.price != null && hasProblems(d)) return t + ". That price is for a coin without problems, so it isn't used for this one. Enter your own value (Check eBay sold helps)" + (meltEach(d) != null ? ", or melt is used." : ".");
  return b.price != null ? t + (num(d.value) == null ? ". Used as the value while Value each is empty." : "") : t;
}
// Link to the coin type's own PCGS Photograde page; types without a saved code open the general page.
const photoGuideCode = (c) => (c.typeId ? pcgsCodeFor(c.typeId, c.year, c.variety) : "");
const photoGuideText = (c) => (c.typeName && c.typeId ? "PCGS Photograde: " + c.typeName : "Compare grades on PCGS Photograde");
const photoGuideUrl = (c) => { const k = photoGuideCode(c); return k ? "https://www.pcgs.com/photograde#/" + k + "/Grades" : "https://www.pcgs.com/photograde"; };
function refreshFormHints() {
  const pl = $("#pcgsLink"); if (pl) { pl.href = photoGuideUrl(draft); pl.textContent = photoGuideText(draft) + " ↗"; }
  const el = $("#ebayLink"); if (el) el.href = ebayUrl(draft);
  const yh = $("#yearHint"); if (yh) yh.textContent = itemOf(draft) === "set" ? setYearProblem(draft.setKind, draft.year) : yearProblem(draft.typeId, draft.year, "coin");
  const bh = $("#bullionHint"); if (bh) bh.textContent = bullionHint(draft);
  const rh = $("#rollHint"); if (rh) rh.textContent = rollHint(draft);
  const mh = $("#meltHint"); if (mh) mh.textContent = meltHintText(draft);
  const ch = $("#costHint"); if (ch) ch.textContent = costHintText(draft);
  const kh = $("#kvHint"); if (kh) kh.textContent = knownVarHint(draft);
  const kl = $("#kvList"); if (kl) { const h = knownVarieties(draft).map((x) => `<option value="${esc(x)}">`).join(""); if (kl.innerHTML !== h) kl.innerHTML = h; }
  const sb = $("#smsBox");
  if (sb) {
    if (!hasSms(draft) || isProofGrade(draft.grade)) draft.sms = false;
    const html = smsField(draft);
    if (sb.innerHTML.trim() !== html.trim() && !(html && sb.querySelector("input"))) sb.innerHTML = html;
    if (!html) sb.innerHTML = "";
  }
  const vb = $("#varietyBox");
  if (vb) {
    const vs = bookVarieties(draft);
    if (!vs.includes(draft.variety || "")) draft.variety = ""; // never auto-pick a variety
    const html = varietyField(draft);
    if (vb.innerHTML !== html) vb.innerHTML = html;
  }
  const h = $("#bookHint");
  if (h) h.textContent = bookHintText(draft);
  const vi = $("[data-f=value]");
  if (vi && !isJunk(draft)) { const bp = hasProblems(draft) ? null : bookPrice(draft); vi.placeholder = bp != null ? bp.toFixed(2) : "$"; }
}

// Albums a coin can go in: only albums for its coin type (plus the one it's already in).
function albumsForCoin(d) {
  return albums().filter((a) => a.id === d.albumId || (d.typeId ? albumHasType(a, d.typeId) : d._isNew || !albumTypes(a).length));
}
function pickType(id) {
  if (draft && !draft._isNew) return; // a saved coin's type never changes
  const t = TYPE_BY_ID[id];
  draft.fbl = false;
  if (!t) return;
  draft.typeId = t.id;
  draft.typeName = shortName(t);
  draft.family = t.family;
  draft.denom = t.denom;
  draft.metal = t.metal;
  draft.oz = t.oz || "";
  if (draft.mint && !t.mints.includes(draft.mint) && draft.mint !== "") draft.mint = "";
  const al = draft.albumId && getAlbum(draft.albumId);
  if (al && !albumHasType(al, t.id)) { draft.albumId = ""; delete draft.slotId; } // that album is for other types
  applyYearMetal(draft);
  if (itemOf(draft) === "roll" && !draft._countEdited) draft.rollCount = ROLL_COUNTS[t.denom] || "";
  renderCoinForm();
}

// The fields that make up a coin's type. Locked once the coin is saved.
const TYPE_FIELDS = ["typeId", "typeName", "family", "denom", "item", "setKind"];
// "Wrong type? Re-add it": a new coin with everything copied except the type, replacing the old one on save.
function retypeDraft() {
  if (!draft || draft._isNew) return;
  const old = getCoin(draft.id);
  if (!old) return;
  const keep = JSON.parse(JSON.stringify(draft));
  draft = { ...keep, id: uid(), _isNew: true, _what: "us", _replaces: old.id, typeId: "", typeName: "", family: "", denom: "", metal: "", oz: "",
    variety: "", fbl: false, sms: false, label: "", labelEdited: false, albumId: "", createdAt: Date.now(), _newAlbum: { brand: "Whitman", number: "" } };
  delete draft.slotId; delete draft.lotId; delete draft.splitFrom; delete draft.cid;
  renderCoinForm();
  toast("Pick the right coin type, then tap Add coin. Everything else was copied.");
}

/* --- recently used coin types (kept in settings, newest first, max 5) --- */
const recentTypeIds = () => (settings().recentTypes || []).filter((id) => TYPE_BY_ID[id]).slice(0, 5);
function touchType(id) {
  if (!TYPE_BY_ID[id]) return;
  const cur = recentTypeIds();
  const next = [id, ...cur.filter((x) => x !== id)].slice(0, 5);
  if (next.join() !== cur.join()) saveSettings({ recentTypes: next });
}
// Recent types first, then everything else, in the same order as before.
function typesRecentFirst(list) {
  const rec = recentTypeIds();
  const recSet = new Set(rec);
  return { recent: rec.map((id) => TYPE_BY_ID[id]).filter((t) => list.includes(t)), rest: list.filter((t) => !recSet.has(t.id)) };
}
function typeMatches(q) {
  q = q.trim().toLowerCase();
  const words = q ? q.split(/\s+/) : [];
  const all = COIN_TYPES.filter((t) => words.every((w) => (t.name + " " + t.family + " " + t.denom).toLowerCase().includes(w)));
  const { recent, rest } = typesRecentFirst(all);
  return { recent, rest: rest.slice(0, q ? 20 : 12) };
}
function showTypeList(q) {
  const box = $("#typeList");
  if (!box) return;
  const { recent, rest } = typeMatches(q);
  const btn = (t) => `<button type="button" data-act="pickType" data-id="${t.id}">${esc(t.name)}<small>${esc(t.denom)} · ${t.start}–${t.end} · ${esc(t.metal)}</small></button>`;
  const head = (txt) => `<div class="ta-head">${txt}</div>`;
  box.innerHTML = recent.length || rest.length
    ? (recent.length ? head("Recent") + recent.map(btn).join("") + (rest.length ? head("All types") : "") : "") + rest.map(btn).join("")
    : `<div class="hint" style="padding:10px">No match. Type the coin type below instead.</div>`;
  box.hidden = false;
}

