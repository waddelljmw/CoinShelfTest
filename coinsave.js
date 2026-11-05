// Saving a coin, photos, where a coin was sold (split from app.js; plain script, shares the page's global names)
async function saveDraft() {
  const d = draft;
  const c = { ...d };
  delete c._isNew; delete c._newAlbum; delete c._fillBlobs; delete c._fromWant; delete c._stay; delete c._short; delete c._what; delete c._open; delete c._sourceKind; delete c._payAuto; delete c._replaces; delete c._proof; delete c._preProof; // working copies aren't saved
  delete c._many; delete c._payMode; delete c._lotMode; delete c._spots; delete c._spotsFor; delete c._grams; delete c._purity; delete c._newStack; delete c._lastHolder; delete c._status; delete c._goneReason; delete c._goneDate;
  c.holder = normHolder(formHolder(d));
  if (typeof lotOn === "function" && lotOn(d) && num(c.paid) != null) c.paid = String(Math.round(num(c.paid) / (num(d.qty) || 1) * 10000) / 10000); // whole-lot price saved as price each
  const many = typeof manyOn === "function" && manyOn(d);
  if (many) { const m = manyPrep(c, d); if (m) { toast(m); return; } } // several coins: every chosen spot must be free
  if (typeof boxCheck === "function") { const m = boxCheck(c); if (m) { toast(m); return; } }
  if (c.gradeMode !== "cert") { c.cac = ""; c.catNo = ""; }
  // Status: Sold (and deleted) are only changed from the coin's page.
  if (c.status === "owned" || c.status === "gone") {
    const k = d._status || "owned";
    if (k === "forsale" && isInherited(c)) { toast("Inherited coins can't be set to For sale."); return; }
    if (k === "gone") { c.status = "gone"; c.stage = ""; c.gone = { reason: d._goneReason || "", date: d._goneDate || "" }; }
    else { c.status = "owned"; c.stage = k === "owned" ? "" : k; delete c.gone; }
  }
  c.upgrade = !!c.upgrade;
  if (typeof bizNormalize === "function") bizNormalize(c);
  if (c.stage === "forsale") c.ask = num(c.ask) == null ? "" : String(Math.max(0, num(c.ask))); // asking price only matters while for sale
  c.mintErrors = listOf(c.mintErrors); c.problems = listOf(c.problems);
  c.trackNo = String(c.trackNo || "").replace(/\s+/g, "");
  ["seller", "knownVar", "receiptNo", "catNo", "trackCarrier"].forEach((k) => { c[k] = String(c[k] || "").trim(); });
  BUY_EXTRAS.forEach((k) => { c[k] = num(c[k]) == null ? "" : String(Math.max(0, num(c[k]))); });
  const idBad = typeof checkTypedId === "function" ? checkTypedId(c) : ""; // a flip label typed on the form
  if (idBad) { toast(idBad); return; }
  const prev = !d._isNew && getCoin(c.id);
  if (prev) TYPE_FIELDS.forEach((k) => { c[k] = prev[k]; }); // a saved coin's type never changes, whatever the form says
  const al0 = c.albumId && c.albumId !== "__new" && getAlbum(c.albumId);
  if (al0 && albumTypes(al0).length && !albumHasType(al0, c.typeId) && !(prev && prev.albumId === c.albumId)) { toast("That album is for a different coin type."); return; }
  c.year = num(c.year) ?? "";
  c.qty = Math.max(1, num(c.qty) || 1);
  delete c._ozEdited; delete c._countEdited;
  const it = itemOf(c);
  if (it === "coin") { delete c.item; delete c.setKind; delete c.rollCount; delete c.rollCond; delete c.bankWrap; }
  if (it !== "coin" || !CASE_HOLDERS.includes(c.holder)) delete c.caseName; else if (c.caseName) c.caseName = c.caseName.trim();
  if (it !== "bullion") { delete c.bShape; delete c.bMaker; delete c.bSerial; delete c.bWeight; delete c.bPurity; delete c.bUnit; }
  delete c._bAmt;
  if (it === "bullion") {
    const w = num(c.bWeight), p = num(c.bPurity);
    if (!w || w <= 0) { toast("Enter the weight."); return; }
    if (!p || p <= 0 || p > 1) { toast("Purity is a number up to 1, like 0.999."); return; }
    if (c.bShape === "Shape") c.bShape = "Other";
    if (!BULLION_SHAPES.includes(c.bShape)) c.bShape = "Bar";
    c.bWeight = String(w); c.bUnit = barUnit(c); c.bPurity = String(p); c.bMaker = String(c.bMaker || "").trim(); c.bSerial = String(c.bSerial || "").trim();
    Object.assign(c, { typeId: "", denom: "", mint: "", year: "", gradeMode: "raw", grade: "", cac: "", albumId: "", metal: "Silver", family: "Bullion", typeName: "Bullion" });
    c.oz = String(bullionOz(c)); delete c.slotId; delete c.rollCount; delete c.rollCond; delete c.bankWrap; delete c.setKind;
  }
  const stackable = it === "bullion" || (it === "coin" && isJunk(c) && c.metal === "Silver");
  const stk = String(c.stack || "").trim();
  if (!stackable) delete c.stack;
  else if (!stk && it !== "bullion" && !(d._isNew && settings().junkStack !== false)) delete c.stack; // new junk silver goes in My Silver Stack unless switched off in Options
  else c.stack = stk || "My Silver Stack";
  if (it === "set") {
    const k = SET_BY_ID[c.setKind];
    if (!k && d._isNew) { toast("Pick the kind of set."); return; }
    if (k && d._isNew) { c.typeName = k.name; c.family = "Sets"; }
    Object.assign(c, { typeId: "", denom: "", mint: "", gradeMode: "raw", grade: "", cac: "", albumId: "" }); delete c.slotId;
    c.metal = num(c.oz) ? "Silver" : "";
    delete c.rollCount; delete c.rollCond; delete c.bankWrap;
  } else if (it === "roll") {
    c.rollCount = rollCountOf(c);
    if (!ROLL_CONDS.includes(c.rollCond)) c.rollCond = "";
    c.bankWrap = !!c.bankWrap;
    Object.assign(c, { gradeMode: "raw", grade: "", cac: "", albumId: "" }); delete c.slotId; delete c.setKind;
    if (!c.typeId && !c.typeName) { toast("Pick the coin type for the roll."); return; }
  }
  if (!c.typeName && !c.year && !c.label) { toast("Add at least a year or a coin type."); return; }
  // Coins saved before this check keep their year; only a new or changed year is checked.
  const yp = it === "set" ? setYearProblem(c.setKind, c.year) : yearProblem(c.typeId, c.year, "coin");
  if (yp && !(prev && String(prev.year) === String(c.year))) { toast(yp); return; }
  if (!c.family) c.family = c.typeName || "Other";
  if (!c.labelEdited) c.label = autoLabel(c);
  if (c.slotId) {
    const sl = getAlbum(c.albumId) && (getAlbum(c.albumId).slots || []).find((x) => x.id === c.slotId);
    const al = getAlbum(c.albumId);
    if (sl && sl.pf && d._isNew && !isProofGrade(c.grade)) { toast("This is a proof spot. Pick a proof grade (PR-60 to PR-70)."); return; }
    if (sl && !sl.pf && !sl.set && d._isNew && al.proofs && isProofGrade(c.grade)) { toast("This spot is for a regular coin. Use the album's Proof spot for a proof."); return; }
    // The spot is gone, or the coin no longer fits it (date, mint, type, or proof vs. regular), so it finds its right spot.
    const fitsSpot = sl && (sl.set ? c.typeId === sl.t : num(c.year) === sl.y && normMint(c.mint) === sl.m && (!sl.pf === !isProofGrade(c.grade) || !(sl.pf || al.proofs)));
    if (!fitsSpot) delete c.slotId;
  }
  if (c.albumId === "__new") {
    const na = d._newAlbum;
    const t = TYPE_BY_ID[c.typeId];
    const info = typeof lookupAlbum === "function" ? lookupAlbum(na.brand, na.number) : null;
    const numClean = info ? info.number : na.number.trim();
    const match = albums().find((a) => a.brand === na.brand && (a.number || "") === numClean && albumHasType(a, c.typeId));
    if (match) c.albumId = match.id;
    else if (info && info.types.includes(c.typeId)) {
      const pf = lookupProofs(info);
      const a = { kind: "album", id: uid(), brand: na.brand, number: info.number, name: info.name, typeId: info.types[0], typeIds: info.types, layout: "dates", start: info.start, end: info.end, proofs: pf, removed: [], createdAt: Date.now() };
      a.slots = buildAlbumSlots(info.types, "dates", info.start, info.end, pf, info.spotVarieties);
      put("a_" + a.id, a);
      c.albumId = a.id;
    } else {
      const a = { kind: "album", id: uid(), brand: na.brand, number: na.number.trim(), name: na.brand === "Other" ? na.number.trim() : "", ...(na.brand === "Other" ? { color: na.color || "red" } : {}), typeId: c.typeId,
        start: t ? t.start : num(c.year) || 1900, end: t ? t.end : num(c.year) || 1900, removed: [], createdAt: Date.now() };
      a.slots = t ? buildSlots(t.id, a.start, a.end) : [{ y: num(c.year), m: normMint(c.mint) }];
      put("a_" + a.id, a);
      c.albumId = a.id;
    }
  }
  if (typeof inhPrepSave === "function") inhPrepSave(c);
  const isNew = d._isNew;
  if (isNew) { // quick-add remembers these for the next coin (Album and Slab fill in on their own)
    const keep = ["Album", "Slab"].includes(c.holder) || it !== "coin" ? settings().lastHolder || "" : c.holder;
    const s0 = settings();
    if ((s0.lastSource || "") !== (c.source || "") || (s0.lastHolder || "") !== keep) saveSettings({ lastSource: c.source || "", lastHolder: keep });
  }
  if (d._fromWant) remove("w_" + d._fromWant); // bought a coin off the want list
  if (c.typeId) touchType(c.typeId);
  closeSheet();
  if (many) { await manySave(c, d); return; }
  await saveCoin(c);
  if (d._replaces) {
    const old = getCoin(d._replaces);
    if (old) {
      const before = JSON.parse(JSON.stringify(old));
      await saveCoin({ ...old, prevStatus: old.status, status: "deleted", deletedAt: Date.now(), refunds: undefined }); // its refunds moved to the new entry
      toast("Re-added as " + labelOf(c) + ". The old entry is in Recently deleted.", { label: "Undo", fn: () => { remove("c_" + c.id); saveCoin(before); go("coin-" + before.id); } });
      go("coin-" + c.id);
      return;
    }
  }
  const wantAsk = isNew && !d._fromWant && typeof askWantRemove === "function"; // a normal Add coin that matches a want asks after the page changes
  if (isNew && d._stay) { toast("Added to " + (getAlbum(c.albumId) ? albumTitle(getAlbum(c.albumId)) : "the album") + "."); if (wantAsk) askWantRemove(c); return; } // stay on the album
  toast(isNew ? "Coin added." : "Saved.");
  if (isNew) go("coin-" + c.id);
  if (isNew) askMetalPrice(c);
  if (wantAsk) askWantRemove(c);
}

// Resize to at most 1600px and save as JPEG (also converts iPhone HEIC photos the browser can show).
async function decodeImage(file) {
  try { return await createImageBitmap(file); } catch (e) { /* fall back to an <img> below */ }
  return await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("decode")); };
    img.src = url;
  });
}
async function shrinkImage(file) {
  try {
    const bmp = await decodeImage(file);
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(w, h));
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
    return await new Promise((res) => cv.toBlob((b) => res(b || file), "image/jpeg", 0.85));
  } catch (e) { return file; }
}
// target: "photos" (the coin) or "receiptPhotos".
async function addPhotos(files, target = "photos") {
  const hint = $(target === "photos" ? "#photoHint" : "#costHint");
  const into = (ref) => { if (!draft) return; if (!Array.isArray(draft[target])) draft[target] = []; draft[target].push(ref); };
  for (const f of files) {
    if (hint) hint.textContent = "Uploading photo…";
    const blob = await shrinkImage(f);
    if (store.mode === "local") {
      try { const lid = await localAddPhoto(blob); into({ lid }); }
      catch (e) { toast(e && e.name === "QuotaExceededError" ? "This device is out of space for photos." : "Couldn't save that photo."); }
    } else if (store.mode === "db") {
      if (!assetsApi) { toast("Photos can't be saved from this view."); break; }
      try {
        const a = await assetsApi.upload(blob);
        into({ id: a.id });
      } catch (e) { toast("Couldn't upload that photo."); }
    } else if (draft) {
      into({ url: URL.createObjectURL(blob) });
    }
  }
  if (draft) renderCoinForm();
}

/* --- Where a coin was sold --- */
const SOLD_WHERE = ["Whatnot", "eBay", "eBay Live", "Coin show", "Coin shop", "Private sale", "Facebook / social", "Auction house", "Pawn shop", "Other"];
// Older sales saved "where" as free text; read it back as one of the choices when it matches.
function whereParts(sold) {
  if (!sold) return { type: "", detail: "" };
  if (sold.whereType) return { type: sold.whereType, detail: sold.whereDetail || "" };
  const w = String(sold.where || "").trim();
  if (!w) return { type: "", detail: "" };
  const hit = SOLD_WHERE.find((o) => o !== "Other" && o.toLowerCase() === w.toLowerCase());
  return hit ? { type: hit, detail: "" } : { type: "Other", detail: w };
}
function whereText(sold) {
  const { type, detail } = whereParts(sold);
  if (type === "Coin show") return detail ? "Coin show: " + detail : "Coin show";
  if (type === "Coin shop") return detail ? "Coin shop: " + detail : "Coin shop";
  if (type === "Other") return detail || "Other";
  return type;
}
function whereDetailField(type, detail) {
  if (type === "Coin show") return `<label class="f"><span>Which coin show?</span><input type="text" name="whereDetail" placeholder="e.g. FUN Show, Baltimore Expo" value="${esc(detail)}"></label>`;
  if (type === "Coin shop") return `<label class="f"><span>Shop or dealer name (optional)</span><input type="text" name="whereDetail" placeholder="e.g. Main Street Coins" value="${esc(detail)}"></label>`;
  if (type === "Other") return `<label class="f"><span>Where was it sold?</span><input type="text" name="whereDetail" placeholder="e.g. flea market, swap meet" value="${esc(detail)}"></label>`;
  return "";
}
function whereFields(sv) {
  const { type, detail } = whereParts(sv);
  return `<label class="f"><span>Where (optional)</span><select name="whereType" id="whereType"><option value="">Choose…</option>${SOLD_WHERE.map((o) => `<option ${type === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
    <div id="whereDetailBox">${whereDetailField(type, detail)}</div>`;
}
function readWhere(fd) {
  const type = String(fd.get("whereType") || "");
  const detail = type === "Coin show" || type === "Coin shop" || type === "Other" ? String(fd.get("whereDetail") || "").trim() : "";
  const sold = { whereType: type, whereDetail: detail };
  sold.where = whereText(sold); // plain text too, for exports and older screens
  return sold;
}
document.addEventListener("change", (e) => {
  if (e.target.id !== "whereType") return;
  const box = $("#whereDetailBox");
  const keep = box && box.querySelector("input") ? box.querySelector("input").value : "";
  if (box) box.innerHTML = whereDetailField(e.target.value, keep);
  const inp = box && box.querySelector("input");
  if (inp) inp.focus();
});

