// Spreadsheet (CSV) import and export for Coin Cabinet.
// Loaded after app.js and uses its helpers (store, put, settings, COIN_TYPES, ...).
"use strict";

/* ---------- columns ---------- */
// One entry per spreadsheet column. `names` are other headings we recognize on import
// (compared lowercase with spaces, dashes and punctuation removed).
const SHEET_COLS = [
  { key: "cid", head: "ID", names: ["id", "coinid", "cabinetid", "flip", "fliplabel", "flipid", "mynumber"] },
  { key: "label", head: "Label", names: ["label", "name", "title", "description"] },
  { key: "item", head: "Item", names: ["item", "itemtype", "entrytype"] },
  { key: "rollCount", head: "Coins per roll", names: ["coinsperroll", "rollcount", "coinsinroll"] },
  { key: "rollCond", head: "Roll condition", names: ["rollcondition", "rollcond"] },
  { key: "bankWrap", head: "Original bank wrap", names: ["originalbankwrap", "bankwrap"] },
  { key: "bWeight", head: "Bar weight (oz)", names: ["barweightoz", "barweight"] },
  { key: "bPurity", head: "Purity", names: ["purity", "fineness"] },
  { key: "bMaker", head: "Maker", names: ["maker", "mintmaker", "refiner"] },
  { key: "bSerial", head: "Serial number", names: ["serialnumber", "barserial", "barserialnumber"] },
  { key: "stack", head: "Stack", names: ["stack"] },
  { key: "status", head: "Status", names: ["status", "state"] },
  { key: "year", head: "Year", names: ["year", "date", "yr"] },
  { key: "mint", head: "Mint", names: ["mint", "mintmark", "mm"] },
  { key: "noDate", head: "No date", names: ["nodate", "undated", "nodatereason"] },
  { key: "typeName", head: "Coin type", names: ["cointype", "type", "series", "coin", "design"] },
  { key: "kind", head: "Kind", names: ["kind"] },
  { key: "group", head: "Group", names: ["group"] },
  { key: "denom", head: "Denomination", names: ["denomination", "denom", "facevalue", "face"] },
  { key: "variety", head: "Variety", names: ["variety", "var"] },
  { key: "knownVar", head: "Known variety", names: ["knownvariety", "dievariety"] },
  { key: "mintErrors", head: "Mint errors", names: ["minterrors", "minterror"] },
  { key: "problems", head: "Problems", names: ["problems", "problem"] },
  { key: "upgrade", head: "Upgrade wanted", names: ["upgradewanted", "upgrade"] },
  { key: "gradeMode", head: "Raw or certified", names: ["raworcertified", "rawcertified", "gradetype", "certified", "slabbed", "graded"] },
  { key: "grade", head: "Grade", names: ["grade", "condition", "estimatedgrade", "myestimatedgrade"] },
  { key: "service", head: "Grading service", names: ["gradingservice", "service", "grader", "tpg", "company"] },
  { key: "cert", head: "Cert number", names: ["certnumber", "cert", "certno", "certification", "certificationnumber", "serial"] },
  { key: "catNo", head: "Catalog number", names: ["catalognumber", "pcgsnumber", "pcgscoinnumber", "coinnumber", "catno"] },
  { key: "cac", head: "CAC", names: ["cac", "cacsticker"] },
  { key: "caseName", head: "Case name", names: ["casename", "case"] },
  { key: "box", head: "Storage box", names: ["storagebox", "box", "2x2box"] },
  { key: "keptIn", head: "Kept in", exportOnly: true, names: [] },
  { key: "boxTray", head: "Box tray", names: ["boxtray"] },
  { key: "boxRow", head: "Box row", names: ["boxrow"] },
  { key: "boxSlot", head: "Box slot", names: ["boxslot"] },
  { key: "holder", head: "Holder", names: ["holder", "holdertype", "storage", "housing"] },
  { key: "coa", head: "COA", names: ["coa", "certificateofauthenticity"] },
  { key: "packaging", head: "Packaging", names: ["packaging", "boxpackaging", "packagingnotes"] },
  { key: "fbl", head: "FBL", names: ["fbl", "fullbelllines"] },
  { key: "sms", head: "SMS", names: ["sms", "specialmintset"] },
  { key: "metal", head: "Metal", names: ["metal", "composition"] },
  { key: "oz", head: "Metal oz", names: ["metaloz", "oz", "metalcontent", "metalcontentoz", "asw", "agw", "fineweight", "weightoz"] },
  { key: "qty", head: "Qty", names: ["qty", "quantity", "count", "number", "amount"] },
  { key: "paid", head: "Paid each", names: ["paideach", "paid", "pricepaid", "cost", "purchaseprice", "price"] },
  { key: "value", head: "Value each", names: ["valueeach", "value", "estimatedvalue", "worth", "currentvalue", "marketvalue"] },
  { key: "redBook", head: "Red Book each", names: ["redbookeach", "redbook", "redbookvalue"], exportOnly: true },
  { key: "meltEach", head: "Melt each", names: ["melteach", "melt", "meltvalue"], exportOnly: true },
  { key: "source", head: "Source", names: ["source", "from", "acquiredfrom", "boughtfrom", "origin"] },
  { key: "seller", head: "Seller", names: ["seller", "sellername", "vendor", "dealer"] },
  { key: "buyTax", head: "Purchase tax", names: ["purchasetax", "taxpaid", "salestaxpaid"] },
  { key: "buyShip", head: "Purchase shipping", names: ["purchaseshipping", "shippingpaid", "inboundshipping"] },
  { key: "buyFees", head: "Purchase fees", names: ["purchasefees", "buyerspremium", "buyerfees"] },
  { key: "totalCost", head: "Total cost", names: ["totalcost"], exportOnly: true },
  { key: "payMethod", head: "Paid with", names: ["paidwith", "paymentmethod", "payment"] },
  { key: "trackCarrier", head: "Carrier", names: ["carrier", "shippingcarrier"] },
  { key: "trackNo", head: "Tracking number", names: ["trackingnumber", "tracking", "trackingno"] },
  { key: "receiptNo", head: "Receipt number", names: ["receiptnumber", "receipt", "invoice", "invoicenumber", "ordernumber"] },
  { key: "acquired", head: "Date acquired", names: ["dateacquired", "acquired", "purchasedate", "datepurchased", "dateadded", "bought"] },
  { key: "album", head: "Album", names: ["album", "folder", "binder"] },
  { key: "notes", head: "Notes", names: ["notes", "note", "comments", "comment", "memo"] },
  { key: "goneReason", head: "Gone reason", names: ["gonereason"] },
  { key: "goneDate", head: "Gone date", names: ["gonedate"] },
  { key: "soldDate", head: "Sold date", names: ["solddate", "datesold"] },
  { key: "soldAmount", head: "Sold for", names: ["soldfor", "soldprice", "saleprice", "soldamount"] },
  { key: "shipping", head: "Shipping", names: ["shipping", "shippingcost"] },
  { key: "shipCharged", head: "Shipping charged", names: ["shippingcharged"], exportOnly: true },
  { key: "soldFees", head: "Platform fees", names: ["platformfees"], exportOnly: true },
  { key: "soldTax", head: "Sales tax collected", names: ["salestaxcollected"], exportOnly: true },
  { key: "soldPay", head: "Sold paid with", names: ["soldpaidwith"], exportOnly: true },
  { key: "soldOrder", head: "Order number", names: ["ordernumber"], exportOnly: true },
  { key: "soldTrack", head: "Sold tracking number", names: ["soldtrackingnumber"], exportOnly: true },
  { key: "soldProfit", head: "Profit", names: ["profit"], exportOnly: true },
  { key: "askPrice", head: "Asking price", names: ["askingprice"], exportOnly: true },
  { key: "bizGroup", head: "Business / Personal", names: ["businesspersonal"], exportOnly: true },
  { key: "showSold", head: "Show", names: ["show"], exportOnly: true },
  { key: "showBought", head: "Bought at show", names: ["boughtatshow"], exportOnly: true },
  { key: "inhFrom", head: "Inherited from", names: ["inheritedfrom"], exportOnly: true },
  { key: "inhValue", head: "Value when inherited", names: ["valuewheninherited"], exportOnly: true },
  { key: "insurance", head: "Insurance", names: ["insurance", "insurancecost"] },
  { key: "soldWhere", head: "Sold where", names: ["soldwhere", "wheresold", "soldon", "soldvia", "platform", "venue"] },
  { key: "soldTo", head: "Sold to", names: ["soldto", "buyer", "buyername", "customer", "purchaser"] },
];
const COL_BY_KEY = Object.fromEntries(SHEET_COLS.map((c) => [c.key, c]));
const squash = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* ---------- export ---------- */
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function coinToRow(c) {
  const a = c.albumId ? getAlbum(c.albumId) : null;
  const s = c.sold || {};
  const m = meltEach(c);
  const rb = bookPrice(c);
  return {
    cid: c.cid || "", label: labelOf(c), item: itemOf(c) === "set" ? "Set" : itemOf(c) === "roll" ? "Roll" : itemOf(c) === "bullion" ? shapeName(c.bShape) : "Coin", bWeight: itemOf(c) === "bullion" ? c.bWeight || "" : "", bPurity: itemOf(c) === "bullion" ? c.bPurity || "" : "", bMaker: c.bMaker || "", bSerial: c.bSerial || "", stack: stackOf(c), kind: !c.typeId && itemOf(c) === "coin" && OTHER_KINDS.includes(c.family) ? c.family : "", group: String(c.group || "").trim(), caseName: c.caseName || "", box: c.boxId && typeof getBox === "function" && getBox(c.boxId) ? getBox(c.boxId).name : "", boxTray: c.boxId && c.boxTray ? c.boxTray : "", boxRow: c.boxId ? c.boxRow || "" : "", boxSlot: c.boxId ? c.boxSlot || "" : "", trackCarrier: c.trackCarrier || "", goneReason: c.status === "gone" && c.gone ? c.gone.reason || "" : "", goneDate: c.status === "gone" && c.gone ? c.gone.date || "" : "", rollCount: itemOf(c) === "roll" ? rollCountOf(c) : "", rollCond: itemOf(c) === "roll" ? c.rollCond || "" : "", bankWrap: itemOf(c) === "roll" && c.bankWrap ? "Yes" : "", status: STATUS_TEXT[statusKey(c)] || "In collection", knownVar: c.knownVar || "", mintErrors: listOf(c.mintErrors).join("; "), problems: listOf(c.problems).join("; "), upgrade: c.upgrade ? "Yes" : "",
    catNo: c.gradeMode === "cert" ? c.catNo || "" : "", seller: c.seller || "", buyTax: c.buyTax || "", buyShip: c.buyShip || "", buyFees: c.buyFees || "", totalCost: costOf(c) ?? "", payMethod: c.payMethod || "", receiptNo: c.receiptNo || "", trackNo: c.trackNo || "", year: c.year, mint: c.mint, typeName: c.typeName, denom: c.denom,
    variety: c.variety, gradeMode: c.gradeMode === "cert" ? "Certified" : "Raw",
    grade: c.grade === "Other" ? c.customGrade : c.grade, service: c.gradeMode === "cert" ? (c.service === "Other" ? c.customService : c.service) : "",
    cert: c.cert, cac: cacOf(c), holder: holderOf(c), keptIn: keptName(c), coa: c.coa ? "Yes" : "", packaging: c.packaging || "", fbl: c.fbl ? "Yes" : "", sms: c.sms ? "Yes" : "", noDate: c.noDate === "worn" ? "Too worn" : c.noDate === "none" ? "Never had a date" : "", metal: c.metal, oz: c.oz, qty: qtyOf(c), paid: c.paid, value: c.value,
    redBook: rb ?? "", meltEach: m == null ? "" : m.toFixed(2), source: (c.source || "").trim(), acquired: c.acquired,
    album: a ? albumTitle(a) : "", notes: c.notes, soldDate: s.date, soldAmount: s.amount, shipping: s.shipping, insurance: s.insurance, soldWhere: c.sold ? whereText(c.sold) : "", soldTo: s.to || "", shipCharged: s.shipCharged ?? "", soldFees: s.fees ?? "", soldTax: s.salesTax ?? "", soldPay: s.payMethod || "", bizGroup: isInherited(c) ? "" : isBiz(c) ? "Business" : "Personal", showSold: s.showId && typeof getShow === "function" && getShow(s.showId) ? getShow(s.showId).name : "", showBought: c.boughtShowId && typeof getShow === "function" && getShow(c.boughtShowId) ? getShow(c.boughtShowId).name : "", soldOrder: s.orderNo || "", soldTrack: s.trackNo || "", soldProfit: c.status === "sold" && !isInherited(c) && typeof saleProfit === "function" ? saleProfit(c) : "", askPrice: c.ask || "", inhFrom: isInherited(c) && typeof inheritanceOf === "function" && inheritanceOf(c) ? inhLabel(inheritanceOf(c)) : "", inhValue: isInherited(c) && typeof inhValueOf === "function" ? (inhValueOf(c) ?? "") : "",
  };
}
// Everyday columns come first; the rest follow in the usual order. Columns that are empty for every coin are left out.
const CSV_FIRST = ["cid", "label", "year", "mint", "typeName", "grade", "qty", "paid", "value", "keptIn", "status"];
const CSV_KEEP = ["label", "year", "typeName", "qty"];
function toCsv(coins) {
  const list = coins || allCoins().filter((c) => c.status !== "deleted");
  const rows = list.map(coinToRow);
  const first = CSV_FIRST.map((k) => SHEET_COLS.find((c) => c.key === k)).filter(Boolean);
  const cols = [...first, ...SHEET_COLS.filter((c) => !CSV_FIRST.includes(c.key))].filter((c) => CSV_KEEP.includes(c.key) || rows.some((r) => r[c.key] != null && String(r[c.key]) !== ""));
  return [cols.map((c) => c.head).join(","), ...rows.map((r) => cols.map((col) => csvCell(r[col.key])).join(","))].join("\n");
}
async function doExport() {
  const csv = toCsv();
  const name = "coin-cabinet-" + today() + ".csv";
  if (downloadsApi) {
    try { await downloadsApi.save({ filename: name, data: csv }); return; } catch (e) { if (e && e.code === "declined") return; }
  }
  try { await navigator.clipboard.writeText(csv); toast("Copied the spreadsheet. Paste it into Excel or Google Sheets."); }
  catch (e) { toast("Couldn't export from this view."); }
}

/* ---------- CSV parsing ---------- */
// Handles quoted fields, doubled quotes, commas and line breaks inside quotes, and a byte-order mark.
function parseCsv(text) {
  text = String(text || "").replace(/^﻿/, "");
  const delim = (text.split(/\r?\n/)[0].match(/\t/g) || []).length > (text.split(/\r?\n/)[0].match(/,/g) || []).length ? "\t" : ",";
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

/* ---------- turning a row into a coin ---------- */
const money2 = (v) => { if (v == null) return ""; const s = String(v).replace(/[$,\s]/g, ""); return s === "" || isNaN(+s) ? "" : +s; };
const yesish = (v) => /^(y|yes|true|1|x|✓)$/i.test(String(v || "").trim());

function parseGrade(raw) {
  let g = String(raw || "").trim();
  if (!g) return { grade: "" };
  if (/^junk$/i.test(g)) return { grade: "Junk" };
  let m = g.toUpperCase().replace(/\s+/g, " ").match(/^(PO|P|FR|AG|G|VG|F|VF|EF|XF|AU|MS|PF|PR|SP)\s*-?\s*(\d{1,2})(\+)?$/);
  if (m) {
    let pre = m[1];
    if (pre === "P") pre = "PO";
    if (pre === "EF") pre = "XF";
    if (pre === "PF") pre = "PR";
    const cand = pre + "-" + m[2];
    if (GRADES.includes(cand)) return { grade: cand };
  }
  return { grade: "Other", customGrade: g };
}
function parseService(raw) {
  const s = String(raw || "").trim();
  if (!s) return {};
  const hit = SERVICES.find((x) => x !== "Other" && x.toLowerCase() === s.toLowerCase());
  return hit ? { service: hit } : { service: "Other", customService: s };
}
function parseMint(raw) {
  const s = String(raw || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!s || s === "NONE" || s === "NA") return "";
  return MINTS.includes(s) ? s : s;
}
// "1921-D" in a year cell gives both year and mint.
function splitYear(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/(1[789]\d\d|20\d\d)(?:\s*-?\s*(CC|[PDSOWC])\b)?/i);
  return m ? { year: +m[1], mint: m[2] ? m[2].toUpperCase() : null } : { year: "", mint: null };
}
// Find the known coin type for a name and year (e.g. "Kennedy Half Dollar" + 1967 → the 40% silver Kennedy).
function matchType(name, year, oz, metal) {
  const n = squash(name);
  if (!n) return null;
  const inYear = (t) => !year || (year >= t.start && year <= t.end);
  const ozOk = (t) => oz === "" || oz == null || Math.abs((t.oz || 0) - oz) < 0.0005;
  const sameName = COIN_TYPES.filter((t) => squash(t.name) === n || squash(shortName(t)) === n || squash(t.family) === n);
  // The metal column breaks ties, e.g. 1982 copper vs. zinc Lincoln cents.
  const metalOk = (t) => !metal || String(metal).toLowerCase().trim() === String(t.metal).toLowerCase();
  let hit = sameName.find((t) => inYear(t) && ozOk(t) && metalOk(t)) || sameName.find((t) => inYear(t) && ozOk(t)) || sameName.find(inYear) || null;
  if (!hit) {
    const words = String(name).toLowerCase().replace(/[^a-z0-9$ ]/g, " ").split(/\s+/).filter((w) => w && !["us", "the", "coin", "silver", "clad"].includes(w));
    const loose = COIN_TYPES.filter((t) => words.length && words.every((w) => (t.name + " " + t.family + " " + t.denom).toLowerCase().includes(w)));
    hit = loose.find(inYear) || null;
  }
  return hit;
}

function rowToCoin(get) {
  const yr = splitYear(get("year"));
  const typeText = get("typeName") || "";
  const t = matchType(typeText, yr.year, money2(get("oz")), get("metal"));
  const statusSold = /sold/i.test(get("status") || "") || money2(get("soldAmount")) !== "" || !!String(get("soldDate") || "").trim();
  const svc = parseService(get("service"));
  const g = parseGrade(get("grade"));
  const certified = /cert|slab|yes|true|graded/i.test(get("gradeMode") || "") || !!svc.service || !!String(get("cert") || "").trim();
  const c = blankCoin();
  c.year = yr.year;
  c.mint = get("mint") != null && String(get("mint")).trim() !== "" ? parseMint(get("mint")) : yr.mint || "";
  if (t) { c.typeId = t.id; c.typeName = shortName(t); c.family = t.family; c.denom = t.denom; c.metal = t.metal; c.oz = t.oz || ""; applyYearMetal(c); }
  else { c.typeName = typeText.trim(); c.family = typeText.trim() || "Other"; }
  if (String(get("denom") || "").trim()) c.denom = String(get("denom")).trim();
  const metal = String(get("metal") || "").trim();
  if (metal) { const hit = METALS.find((m) => m.toLowerCase() === metal.toLowerCase()); c.metal = hit || "Other"; if (!MELT_OF_METAL[c.metal] && !hit) c.oz = ""; }
  if (money2(get("oz")) !== "") c.oz = money2(get("oz"));
  c.gradeMode = certified ? "cert" : "raw";
  c.grade = g.grade === "Junk" && certified ? "" : g.grade;
  if (g.customGrade) c.customGrade = g.customGrade;
  if (certified) { c.service = svc.service || "PCGS"; c.customService = svc.customService || ""; c.cert = String(get("cert") || "").trim(); }
  c.variety = String(get("variety") || "").trim();
  const cacT = String(get("cac") || "").trim();
  if (certified && cacT) c.cac = /gold/i.test(cacT) ? "Gold" : /green|yes|true|^y$|^x$|cac/i.test(cacT) ? "Green" : "";
  const holdT = String(get("holder") || "").trim();
  if (holdT) { const hit = HOLDERS.find((h) => h.toLowerCase() === normHolder(holdT.replace(/^slabbed$/i, "slab")).toLowerCase()); c.holder = hit || "Other"; if (!hit) c.packaging = holdT; }
  c.coa = yesish(get("coa"));
  const packT = String(get("packaging") || "").trim();
  if (packT) c.packaging = c.packaging ? c.packaging + "; " + packT : packT;
  c.fbl = yesish(get("fbl"));
  c.sms = yesish(get("sms"));
  if (!c.year) { const nd = String(get("noDate") || "").trim(); if (/worn|unread/i.test(nd)) c.noDate = "worn"; else if (/never|none/i.test(nd)) c.noDate = "none"; } // a year wins
  c.qty = Math.max(1, Math.round(+money2(get("qty")) || 1));
  c.paid = String(money2(get("paid")));   // stored as text, like the add-coin form
  c.value = String(money2(get("value")));
  c.source = String(get("source") || "").trim();
  const txt = (k) => String(get(k) || "").trim();
  const listIn = (k, all) => txt(k).split(/[;,]/).map((x) => x.trim()).filter(Boolean).map((x) => all.find((a) => a.toLowerCase() === x.toLowerCase()) || x);
  c.seller = txt("seller"); c.payMethod = txt("payMethod"); c.receiptNo = txt("receiptNo"); c.trackNo = txt("trackNo").replace(/\s+/g, ""); c.knownVar = txt("knownVar");
  ["buyTax", "buyShip", "buyFees"].forEach((k) => { c[k] = String(money2(get(k))); });
  c.mintErrors = listIn("mintErrors", MINT_ERRORS); c.problems = listIn("problems", COIN_PROBLEMS);
  c.upgrade = yesish(get("upgrade"));
  if (certified) c.catNo = txt("catNo");
  const st = squash(get("status"));
  if (/forsale/.test(st) && !/inherited/i.test(c.source)) c.stage = "forsale";
  else if (/ontheway|coming|ordered|intransit/.test(st)) c.stage = "coming";
  else if (/^gone|traded|gifted|lost/.test(st)) { c.status = "gone"; const gr = txt("goneReason"); c.gone = { reason: GONE_REASONS.find((x) => x.toLowerCase() === gr.toLowerCase()) || (gr ? "Other" : /trade/.test(st) ? "Traded" : /gift/.test(st) ? "Gifted" : /lost/.test(st) ? "Lost" : ""), date: normDate(get("goneDate")) }; }
  c.acquired = normDate(get("acquired"));
  c.group = txt("group"); c.trackCarrier = CARRIERS.find((x) => x.toLowerCase() === txt("trackCarrier").toLowerCase()) || "";
  if (!t) { const kd = OTHER_KINDS.find((x) => x.toLowerCase() === txt("kind").toLowerCase()); if (kd) c.family = kd; }
  // A "Serial number" column on a slab row is its cert number.
  if (certified && !c.cert && txt("bSerial")) c.cert = txt("bSerial");
  c.notes = String(get("notes") || "").trim();
  { const x = String(get("cid") ?? "").trim().replace(/\s+/g, " ").slice(0, 40); if (x) c.cid = x; } // an ID from another program (checked for repeats when importing)
  const itemT = String(get("item") || "").trim().toLowerCase();
  if (itemT === "set" || itemT === "roll") {
    const hl = itemT === "set" ? SET_HOLDERS : ROLL_HOLDERS;
    const hh = hl.find((x) => x.toLowerCase() === holdT.toLowerCase());
    if (hh) { c.holder = hh; if (c.packaging === holdT) c.packaging = ""; }
  }
  if (itemT === "set") {
    const k = SET_KINDS.find((x) => x.name.toLowerCase() === typeText.trim().toLowerCase()) || SET_BY_ID.other;
    Object.assign(c, { item: "set", setKind: k.id, typeId: "", typeName: k.id === "other" ? typeText.trim() || k.name : k.name, family: "Sets", denom: "", mint: "", gradeMode: "raw", grade: "", cac: "" });
    c.metal = num(c.oz) ? "Silver" : "";
  } else if (itemT === "roll") {
    c.item = "roll"; c.gradeMode = "raw"; c.grade = ""; c.cac = "";
    c.rollCount = Math.max(1, Math.round(+money2(get("rollCount")) || (t && ROLL_COUNTS[t.denom]) || 1));
    const rc = String(get("rollCond") || "").trim().toLowerCase();
    c.rollCond = ROLL_CONDS.find((x) => x.toLowerCase() === rc) || "";
    c.bankWrap = yesish(get("bankWrap"));
  }
  const shapeIn = ["bar", "round", "other silver item", "other", "shape"].includes(itemT) ? (itemT === "bar" || itemT === "round" ? itemT[0].toUpperCase() + itemT.slice(1) : "Other") : itemT === "bullion" ? "Bar" : "";
  if (shapeIn) {
    const w = +money2(get("bWeight")) || +money2(get("oz")), pu = +money2(get("bPurity")) || 0.999;
    if (w > 0 && pu <= 1) {
      Object.assign(c, { item: "bullion", bShape: shapeIn, bWeight: String(w), bPurity: String(pu), bMaker: txt("bMaker"), bSerial: txt("bSerial"),
        typeId: "", typeName: "Bullion", family: "Bullion", denom: "", mint: "", year: "", gradeMode: "raw", grade: "", cac: "", metal: "Silver", stack: txt("stack") || "My Silver Stack" });
      c.oz = String(bullionOz(c));
    }
  } else if (txt("stack") && c.gradeMode === "raw" && c.grade === "Junk" && c.metal === "Silver") c.stack = txt("stack");
  if (itemOf(c) === "coin" && CASE_HOLDERS.includes(c.holder) && txt("caseName")) c.caseName = txt("caseName");
  if (txt("box")) { c._boxName = txt("box"); c.boxRow = txt("boxRow"); c.boxSlot = txt("boxSlot"); c.boxTray = txt("boxTray"); }
  const lab = String(get("label") || "").trim();
  if (lab && lab !== autoLabel(c)) { c.label = lab; c.labelEdited = true; }
  if (statusSold) {
    c.status = "sold";
    c.sold = { at: Date.now(), date: normDate(get("soldDate")) || "", amount: money2(get("soldAmount")) === "" ? null : money2(get("soldAmount")),
      shipping: money2(get("shipping")) === "" ? null : money2(get("shipping")), insurance: money2(get("insurance")) === "" ? null : money2(get("insurance")) };
    Object.assign(c.sold, whereFromText(get("soldWhere")));
    c.sold.to = String(get("soldTo") || "").trim();
  }
  c._albumName = String(get("album") || "").trim();
  return { coin: c, typeMatched: !!t, typeText };
}
// "Coin show: FUN Show" → Coin show + detail; "ebay live" → eBay Live; anything else → Other.
function whereFromText(v) {
  const w = String(v || "").trim();
  if (!w) return { whereType: "", whereDetail: "", where: "" };
  const m = w.match(/^coin\s*show\s*[:\-–]?\s*(.*)$/i);
  let out;
  if (m) out = { whereType: "Coin show", whereDetail: m[1].trim() };
  else {
    const hit = SOLD_WHERE.find((o) => o !== "Other" && squash(o) === squash(w));
    out = hit ? { whereType: hit, whereDetail: "" } : { whereType: "Other", whereDetail: w };
  }
  out.where = whereText(out);
  return out;
}
// Accepts 2026-10-31, 10/31/2026, 10/31/26.
function normDate(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`; }
  return "";
}

/* ---------- import flow ---------- */
let imp = null; // { headers, rows, map: [fieldKey|""], fileName }

function guessField(header, taken) {
  const h = squash(header);
  const col = SHEET_COLS.find((c) => !c.exportOnly && !taken.has(c.key) && c.names.includes(h));
  return col ? col.key : "";
}
function openImport() {
  imp = null;
  openSheet(`<div class="sheet-head"><h2>Import from a spreadsheet</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>Pick a CSV file. Excel, Google Sheets and Numbers can all save one ("Download as CSV" or "Export as CSV").</p>
    <div class="card small">
      <b>Columns the app understands</b>
      <div class="muted" style="margin-top:4px">Year and Coin type are needed. Also: Mint, Grade, Qty, Paid each, Value each, Source, Date acquired, Notes, Album, Grading service, Cert number, Variety. A file from <b>Export</b> works as is. Other column names can be matched on the next step.</div>
    </div>
    <label class="btn primary block file-btn" style="display:block;text-align:center">Choose CSV file<input type="file" id="importFile" accept=".csv,.tsv,.txt,text/csv,text/plain"></label>
    <div class="hint" id="importMsg"></div>`);
}
function loadImportText(text, fileName) {
  const rows = parseCsv(text);
  if (rows.length < 2) { const m = $("#importMsg"); if (m) m.textContent = "That file has no coin rows. Check it has a heading row and at least one coin."; return; }
  const headers = rows[0].map((h) => String(h).trim());
  const taken = new Set();
  // Files exported by v0.21–0.23 call the bar weight "Weight (oz)" next to "Metal oz".
  const oldBarWeight = headers.some((h) => squash(h) === "metaloz");
  const map = headers.map((h) => { const k = oldBarWeight && squash(h) === "weightoz" && !taken.has("bWeight") ? "bWeight" : guessField(h, taken); if (k) taken.add(k); return k; });
  imp = { headers, rows: rows.slice(1), map, fileName, skip: new Set() };
  renderImport();
}
function importCoins() {
  if (!imp) return [];
  return imp.rows.map((r) => rowToCoin((key) => { const i = imp.map.indexOf(key); return i < 0 ? null : r[i]; }));
}
function isDuplicate(c) {
  return allCoins().some((o) => o.status !== "deleted" && o.status === c.status && itemOf(o) === itemOf(c) && ["setKind", "bShape", "bWeight", "bSerial"].every((k) => String(o[k] ?? "") === String(c[k] ?? "")) && o.typeId === c.typeId && (o.typeId || o.typeName === c.typeName) && String(o.year) === String(c.year) && normMint(o.mint) === normMint(c.mint) && o.grade === c.grade && o.gradeMode === c.gradeMode && (c.gradeMode !== "cert" || !c.cert || o.cert === c.cert));
}
function renderImport() {
  const parsed = importCoins();
  const hasYear = imp.map.includes("year"), hasType = imp.map.includes("typeName");
  if (!imp.dupChecked) { parsed.forEach((p, i) => { if (isDuplicate(p.coin) || (p.coin.year && yearProblem(p.coin.typeId, p.coin.year, "coin"))) imp.skip.add(i); }); imp.dupChecked = true; }
  const fieldOpts = (sel) => `<option value="">Don't import</option>` + SHEET_COLS.filter((c) => !c.exportOnly).map((c) => `<option value="${c.key}" ${sel === c.key ? "selected" : ""}>${esc(c.head)}</option>`).join("");
  const sample = (i) => { const v = imp.rows.map((r) => r[i]).find((x) => String(x || "").trim()); return v ? String(v).slice(0, 24) : ""; };
  const nNew = parsed.filter((_, i) => !imp.skip.has(i)).length;
  const coinsN = parsed.filter((_, i) => !imp.skip.has(i)).reduce((t, p) => t + qtyOf(p.coin), 0);
  openSheet(`<div class="sheet-head"><h2>Import ${esc(imp.fileName || "")}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <details ${hasYear && hasType ? "" : "open"}><summary>Match columns (${imp.map.filter(Boolean).length} of ${imp.headers.length} used)</summary>
      <div class="hint">Each column from your file, and where it goes in the app.</div>
      ${imp.headers.map((h, i) => `<div class="grid2" style="align-items:end"><label class="f"><span>${esc(h || "(no heading)")}</span><input type="text" value="${esc(sample(i))}" disabled></label>
        <label class="f"><span>&nbsp;</span><select data-impmap="${i}">${fieldOpts(imp.map[i])}</select></label></div>`).join("")}
    </details>
    ${!hasYear || !hasType ? `<div class="banner" style="margin:12px 0 0">Pick which column is the <b>${!hasYear ? "Year" : "Coin type"}</b> to continue.</div>` : `
    <h2>Preview</h2>
    <div class="small muted" style="margin:-4px 0 8px">Untick any row you don't want. Rows that look like coins you already have, or have a year that doesn't fit, start unticked.</div>
    <div class="list">${parsed.map((p, i) => {
      const c = p.coin; const flags = [];
      if (!c.year) flags.push("no year");
      else if (yearProblem(c.typeId, c.year, "coin")) flags.push("year doesn't fit: " + yearProblem(c.typeId, c.year, "coin"));
      if (!p.typeMatched) flags.push(p.typeText ? "type not recognized, kept as typed" : "no coin type");
      if (c.grade === "Other") flags.push("grade kept as typed");
      if (isDuplicate(c)) flags.push("looks like one you have");
      const ia = c._albumName && albums().find((a) => squash(albumTitle(a)) === squash(c._albumName));
      if (ia && !albumHasType(ia, c.typeId)) flags.push("album " + albumTitle(ia) + " is for other coin types, so it won't go in it");
      const v = bestEach(c);
      return `<label class="coin-row" style="cursor:pointer"><input type="checkbox" data-impskip="${i}" ${imp.skip.has(i) ? "" : "checked"} style="width:20px;height:20px;accent-color:var(--accent)">
        <span class="coin-main"><span class="coin-label">${esc(labelOf(c))}</span>
        <span class="coin-sub">${qtyOf(c) > 1 ? `<span class="qty">×${qtyOf(c)}</span> ` : ""}${esc(gradeText(c))}${c.status === "sold" ? " · Sold" : ""}</span>${flags.length ? `<span class="small" style="display:block;color:var(--bad)">${esc(flags.join(", "))}</span>` : ""}</span>
        <span class="coin-val">${money(v == null ? null : v * qtyOf(c))}</span></label>`;
    }).join("")}</div>
    <div class="btn-row"><button class="btn primary" data-act="doImport" ${nNew ? "" : "disabled"}>Import ${nNew} row${nNew === 1 ? "" : "s"} (${coinsN} coin${coinsN === 1 ? "" : "s"})</button><button class="btn" data-act="closeSheet">Cancel</button></div>`}`);
}
async function doImport() {
  const parsed = importCoins();
  const batch = "imp_" + uid();
  const chosen = parsed.filter((_, i) => !imp.skip.has(i)).map((p) => p.coin).filter((c) => !c.year || !yearProblem(c.typeId, c.year, "coin"));
  const dropped = parsed.filter((_, i) => !imp.skip.has(i)).length - chosen.length;
  const albumByName = new Map(albums().map((a) => [squash(albumTitle(a)), a.id]));
  closeSheet();
  toast("Importing " + chosen.length + " rows…");
  const ids = [];
  let noSpot = 0, idClash = 0;
  const seenId = new Set(); // keep the first coin with an ID, report the rest
  for (const c of chosen) {
    const an = c._albumName; delete c._albumName;
    // Only into an album made for this coin's type.
    if (an && albumByName.has(squash(an)) && albumHasType(getAlbum(albumByName.get(squash(an))), c.typeId)) c.albumId = albumByName.get(squash(an));
    // Into a 2x2 storage box by name, only if that spot is free.
    const bn = c._boxName; delete c._boxName;
    const bx = bn && typeof allBoxes === "function" && allBoxes().find((b) => squash(b.name) === squash(bn));
    if (bx) { c.boxId = bx.id; if (boxCheck(c)) { delete c.boxId; delete c.boxRow; delete c.boxSlot; delete c.boxTray; noSpot++; } }
    else { delete c.boxRow; delete c.boxSlot; delete c.boxTray; }
    if (c.cid) c.cid = idTidy(c.cid);
    if (c.cid) {
      const k = idNormKey(c.cid);
      if (seenId.has(k) || idOwner(c.cid)) { delete c.cid; idClash++; } else { seenId.add(k); idBump(c.cid); }
    }
    c.importBatch = batch;
    ids.push(c.id);
    if (c.typeId) touchType(c.typeId);
    await saveCoin(c); // one at a time so large files don't overwhelm saving
  }
  saveSettings({ lastImport: { batch, count: ids.length, ids, at: today() } });
  const anySold = chosen.some((c) => c.status === "sold");
  if (anySold && !settings().soldAutoDone) saveSettings({ showSold: true, soldAutoDone: true });
  go("coins");
  toast("Imported " + ids.length + " rows." + (dropped ? " Skipped " + dropped + " with a year that doesn't fit." : "") + (idClash ? " " + idClash + " ID" + (idClash === 1 ? " was" : "s were") + " already used, so " + (idClash === 1 ? "that coin " : "those coins ") + (idStyle() === "off" ? "have no ID." : "got a new one.") : "") + (noSpot ? " " + noSpot + " couldn't go in their box spot (taken or missing), so they're not in a box." : ""), { label: "Undo", fn: () => undoImport(true) });
}
// Imported rows you haven't changed since. Edited coins leave the batch (see saveCoin).
const importLeft = (li) => li.ids.map(getCoin).filter((c) => c && c.importBatch === li.batch && c.status !== "deleted");
async function undoImport(skipConfirm) {
  const li = settings().lastImport;
  if (!li) return;
  const left = importLeft(li);
  const doIt = async () => {
    // Moved to Recently deleted (restorable), not erased.
    for (const c of left) await put("c_" + c.id, { ...c, status: "deleted", prevStatus: c.status, deletedAt: Date.now() });
    saveSettings({ lastImport: null });
    const kept = li.count - left.length;
    toast("Moved " + left.length + " imported row" + (left.length === 1 ? "" : "s") + " to Recently deleted." + (kept ? " " + kept + " you'd changed were kept." : ""));
  };
  if (skipConfirm === true) return doIt();
  if (!left.length) { saveSettings({ lastImport: null }); toast("Nothing left to remove. You've changed or removed all of those rows."); return; }
  confirmSheet("Remove last import?", left.length + " imported row" + (left.length === 1 ? "" : "s") + " you haven't changed will move to Recently deleted, where you can restore them." + (li.count > left.length ? " " + (li.count - left.length) + " you've changed since will be kept." : ""), "Remove", doIt);
}

/* ---------- wiring ---------- */
Object.assign(actions, {
  openImport,
  doImport,
  undoImport: () => undoImport(),
  export: () => doExport(),
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "importFile" && el.files && el.files[0]) {
    const f = el.files[0];
    const r = new FileReader();
    r.onload = () => loadImportText(r.result, f.name);
    r.onerror = () => { const m = $("#importMsg"); if (m) m.textContent = "Couldn't read that file."; };
    r.readAsText(f);
    return;
  }
  if (el.dataset.impmap != null && imp) {
    const i = +el.dataset.impmap;
    const k = el.value;
    if (k) imp.map = imp.map.map((x, j) => (j !== i && x === k ? "" : x)); // each field from one column only
    imp.map[i] = k;
    imp.dupChecked = false; imp.skip = new Set();
    const y = $(".sheet").scrollTop; renderImport(); $(".sheet").scrollTop = y;
    return;
  }
  if (el.dataset.impskip != null && imp) {
    const i = +el.dataset.impskip;
    el.checked ? imp.skip.delete(i) : imp.skip.add(i);
    const y = $(".sheet").scrollTop; renderImport(); $(".sheet").scrollTop = y;
  }
});
