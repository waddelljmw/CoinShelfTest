// Fill in the add-coin form from a photo, using Claude (the `sample` capability).
// Loaded after app.js; uses its draft, helpers and data.
"use strict";

function photoPrompt() {
  const types = COIN_TYPES.map((t) => `${t.id} | ${t.name} | ${t.start}-${t.end} | mints ${t.mints.join(",")}`).join("\n");
  return `You are reading a photo of a United States coin, either loose or in a grading holder (slab), to fill in a coin inventory form.

Read only what you can actually see. If the photo shows a holder label, copy the year, mint mark, variety, grade, grading service and certification number exactly from the label. If it is a loose coin, read the date and mint mark from the coin, and do not guess a grade.

Pick the coin type from this list (id | name | years | mint marks). Use null if none fits:
${types}

Reply with only one JSON object, no other text:
{"typeId": "morgan-dollar" or null,
 "typeName": "short coin type name as written, e.g. Morgan Dollar",
 "year": 1921 or null,
 "mint": "D" (one of P, D, S, O, CC, W, C; "" if there is no mint mark; null if you cannot see it),
 "certified": true if it is in a grading holder, else false,
 "service": "PCGS", "NGC", "ANACS", "ICG", "CACG", another name, or null,
 "grade": the grade on the label as Sheldon grade like "MS-63", "AU-58", "PR-69" (proof grades use PR) or null,
 "gradeDetails": anything after the grade on the label, e.g. "Details, Cleaned", "+", "DCAM", "RD", or null,
 "cert": the certification number exactly as printed, or null,
 "variety": variety or pedigree text from the label, e.g. "VAM-3", "Doubled Die Obverse", "Full Bell Lines", or null,
 "fbl": true only if the label says FBL or Full Bell Lines,
 "confidence": "high", "medium" or "low",
 "note": one short sentence about anything unclear, or ""}`;
}

function setFillMsg(text, isError) {
  const m = $("#photoFillMsg");
  if (!m) return;
  m.textContent = text;
  m.style.color = isError ? "var(--bad)" : "";
}

// Put what Claude read into the form. Only fills fields it actually read.
function applyPhotoResult(r) {
  if (!draft || !r || typeof r !== "object") return [];
  const filled = [];
  const t = r.typeId && TYPE_BY_ID[r.typeId];
  if (t) {
    draft.typeId = t.id; draft.typeName = shortName(t); draft.family = t.family; draft.denom = t.denom; draft.metal = t.metal; draft.oz = t.oz || "";
    filled.push("type");
  } else if (r.typeName) {
    draft.typeName = String(r.typeName).slice(0, 60); draft.family = ""; draft.typeId = "";
    filled.push("type (typed, not matched)");
  }
  const y = parseInt(r.year, 10);
  if (y >= 1700 && y <= 2100) { draft.year = y; filled.push("year"); }
  if (r.mint != null) {
    const m = String(r.mint).toUpperCase().trim();
    draft.mint = m === "P" && y && y < 1980 ? "" : MINTS.includes(m) ? m : draft.mint;
    filled.push("mint mark");
  }
  if (r.certified) {
    draft.gradeMode = "cert";
    if (r.service) {
      const svc = SERVICES.find((s) => s !== "Other" && s.toLowerCase() === String(r.service).toLowerCase());
      draft.service = svc || "Other";
      draft.customService = svc ? "" : String(r.service).slice(0, 30);
      filled.push("grading service");
    }
    if (r.cert) { draft.cert = String(r.cert).trim().slice(0, 40); filled.push("cert number"); }
  }
  if (r.grade) {
    let g = String(r.grade).toUpperCase().replace(/\s+/g, "").replace(/^PF/, "PR").replace(/^EF/, "XF").replace(/^([A-Z]+)(\d+)$/, "$1-$2");
    const details = r.gradeDetails ? String(r.gradeDetails).trim() : "";
    const list = draft.gradeMode === "cert" ? CERT_GRADES : GRADES;
    if (list.includes(g) && !/detail/i.test(details)) { draft.grade = g; draft.customGrade = ""; }
    else { draft.grade = "Other"; draft.customGrade = (r.grade + (details ? " " + details : "")).slice(0, 40); }
    filled.push("grade");
  }
  if (r.fbl) draft.fbl = true;
  if (r.variety) {
    const v = String(r.variety).trim();
    const known = bookVarieties(draft).find((x) => x && x.toLowerCase() === v.toLowerCase());
    if (known) { draft.variety = known; filled.push("variety"); }
    else if (!/full bell/i.test(v)) draft.notes = (draft.notes ? draft.notes + "\n" : "") + "Label: " + v;
  }
  return filled;
}

async function fillFromPhoto(file) {
  if (!sampleApi || !draft) return;
  const forDraft = draft;
  const btn = $("#photoFillBtn");
  if (btn) btn.style.opacity = ".5";
  setFillMsg("Reading the photo… this can take up to a minute.");
  let blob;
  try { blob = await shrinkImage(file); } catch (e) { blob = file; }
  try {
    const r = await sampleApi.json(photoPrompt(), { images: [blob], cache: false });
    if (draft !== forDraft) return; // form was closed or replaced while waiting
    const filled = applyPhotoResult(r);
    renderCoinForm();
    // Keep the photo with the coin.
    await addPhotos([blob]);
    if (!filled.length) {
      setFillMsg("Couldn't read the coin details from that photo. Try a closer, sharper picture of the label or date.", true);
    } else {
      const unsure = r.confidence && r.confidence !== "high";
      setFillMsg("Filled in: " + filled.join(", ") + ". " + (unsure ? "Claude wasn't fully sure, so check it carefully. " : "Check it before saving. ") + (r.note ? String(r.note).slice(0, 160) : ""), unsure);
    }
  } catch (e) {
    if (draft !== forDraft) return;
    const code = e && e.code;
    if (code === "not_granted" || code === "sampling_disabled" || code === "images_unavailable" || code === "not_declared") {
      sampleApi = null;
      setFillMsg("Photo reading isn't available here. You can still fill in the form by hand.", true);
    } else if (code === "rate_limited") setFillMsg("Too many photo reads right now. Wait a bit and try again.", true);
    else if (code === "image_rejected") setFillMsg("That image couldn't be used. Try a JPEG or PNG photo.", true);
    else if (code === "cancelled") setFillMsg("");
    else setFillMsg("Couldn't read that photo. Try again with a closer, sharper picture.", true);
  } finally {
    const b = $("#photoFillBtn");
    if (b) b.style.opacity = "";
  }
}

document.addEventListener("change", (e) => {
  if (e.target.id === "photoFill" && e.target.files && e.target.files[0]) fillFromPhoto(e.target.files[0]);
});
