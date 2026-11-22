# Layout + wording audit (step 1b(a), Fable, 2026-11-10; nothing built)

IDEAS 66 (layout) and 67 (wording), checked against v0.58.6 by reading the page code for every form and popup. Nothing was run on a phone, so anything marked **(check)** should be looked at on screen when it's built. Sizes: **S** small fix, **M** a feature, **L** big.

## At a glance

| Area | Verdict | Fixes |
|---|---|---|
| Add / Edit form | Works, but 3 things slow entry: Quantity is two taps deep, Kept in is hidden in a closed section, Save is only at the very bottom | 9 (7 S, 2 M) |
| New album | Weakest page. The search box and the list it fills sit 7 fields apart | 1 M + 2 S |
| Storage, pocket album, wants, selling, shows | Mostly fine. Small label fixes only | 6 S |
| Wording across the app | One idea often has 2–4 names ("Where from" / "Source" / "Where") | 11 S |
| Blueprint terms (Cull, Stack, Kept in) | "Cull" appears nowhere yet; Stack still lives inside Kept in | fold into C and C2 |
| "$" | One good money formatter, but about 60 "$" typed by hand around it | 1 S |
| On-screen text | About 1,070 pieces of text typed straight into 38 page files; no word list | 1 S now, L later (wait) |

**Top 5 by payoff:** W1 one name for "Where from" · L1 Quantity up top · A1 New album order · W2 "Add coin" naming · T1 shared word list (makes Cull and Kept in one-line changes).

**Suggested bundles (planning day decides):**
- **Wording pass (one Sonnet session, S+S+S…):** W1–W11 + L7 + L8. No saved data touched. About 60 test lines name these words and need the same edit.
- **Form layout (one Sonnet session, M):** L1–L6, L9. Build with E / idea 77 ("year first"), same part of the form.
- **New album (M):** A1–A3 with idea 36.
- **With blueprint C + C2:** every row in the "Blueprint clashes" table, plus T1.
- **Money (S, any week):** D1.

---

## 1. Layout: Add / Edit form (`coinform.js`)

Order today: photo fill · Coin type · Year + Mint · **Grade** box · Where from chips · *Purchase details* · *Holder and Kept in* · *Notes* · *More details* (› Quantity, value and metal · Status · Errors · Photos · Label and ID) · Add / Cancel. Sections in *italics* start closed on a new coin.

| # | Problem | Fix | Size |
|---|---|---|---|
| L1 | **Quantity** is inside More details › Quantity, value and metal: two closed sections deep. But "Paid each", the cost hint and "How many separate coins?" all depend on it. | Move Quantity next to "Paid each" in Purchase details (or beside Year). Leave Value and Metal where they are. | S |
| L2 | **Kept in** (one of the blueprint's three main questions) starts hidden inside a closed section. | Show the Kept in row itself above the fold, right after Where from; keep Holder, COA and packaging in the section. Do it when C adds the Stack row, so the form is reshuffled once. | M (with C) |
| L3 | **Add / Save button** is only at the very bottom. With sections open that's a long scroll, on every sheet. | Keep the button row stuck to the bottom of the screen on all forms. **(check)** small phones with the keyboard open. | M |
| L4 | Sections inside a section (More details › Status…): easy to lose your place. | After L1 and L2 only rarely used things remain; make them plain sections and drop the "More details" wrapper. | S |
| L5 | **Group** and **Personal or Business** sit under Status, but they aren't a status. | Rename the section "Status and group". | S |
| L6 | Bars: after picking "Junk silver" the form still asks "What is it?" again and shows **Maker**, which a bag of dimes doesn't have. | Hide Maker for junk silver. | S |
| L7 | **Bug:** the Label and ID section opens itself whenever the coin has **Notes** (copy-paste slip, line 200). | Open it only when the label was edited. | S |
| L8 | "(optional)" is marked three ways: in the label, in gray, or not at all. Nearly every field is optional. | Drop "(optional)" everywhere; mark the few required fields instead. | S |
| L9 | Certified coins: label says "Catalog number", the hint under it says "coin number". | Label: "PCGS or NGC coin number". | S |

Already fine: Year + Mint side by side; Grade before price; chips for Where from; the last holder and source are remembered.

## 2. Layout: New album / Edit album (`editforms.js`)

Order today: Brand + Album number · **Is the album empty?** · **Find coin type** (search) · Name · Spine color · Inherited · Kept in · Or type a place · Kind of album · **Coin types in this album** · + Add another coin type · Proof spots · From / To year · Create album.

| # | Problem | Fix | Size |
|---|---|---|---|
| A1 | "Find coin type" is 7 fields above "Coin types in this album", the list it fills. This is the idea-66 example. Extras (color, inherited, Kept in) sit between the fields that decide what the album holds. | New order: Brand + number · **Coin types** (the search built into each row, like on Add coin) · From / To year · Proof spots · Kind of album · Is it empty? · then a closed "More" with Name, color, Inherited, Kept in. Same order on Edit album. | M |
| A2 | "+ New album" and "+ New pocket album (flips or capsules)" are two separate buttons (idea 36). | One "+ New album" that asks "Printed dates" or "Pockets" first. | S |
| A3 | From / To year are always filled; idea 36 wants them optional. | Show the type's own years in gray; only save years he types. **Touches how an album is saved: ask first.** | S |

## 3. Layout: other input pages

| # | Page | Problem | Fix | Size |
|---|---|---|---|---|
| B1 | New box | "Plastic color (plastic only)" shows for every look **(check)**. | Show it only when Look = Plastic. | S |
| B2 | New box | "What's inside" suggests typing "ziplock of quarters". After blueprint B a bag is a real container. | Change the example when B ships. | with B |
| B3 | Box, album, list, show, inheritance | The button that finishes a new thing has 3 verbs: "Create album", "Add box", "Create list", "Save". | "Add …" for new, "Save" for edits, everywhere. | S |
| B4 | Filter | Says "Problems and errors"; the form and coin page say "Errors and problems". | One order. | S |
| B5 | Coin page | The form asks "Kept in", but the coin page shows a row called "Storage box" / "Display box" / "Pocket album", and the album as a chip. | One row, "Kept in", with the full path (blueprint B needs this anyway). | with B |
| B6 | Mark as sold | No layout problem. Wording only (W3). | | |

Checked and fine: pocket album, want form, new want list, show form, inheritance form, Fill spots, Sell together, Set purchase info, Move, Set holder, Coin ID, Import.

---

## 4. Wording: one idea, several names

| # | Idea | Names on screen today | Use | Size |
|---|---|---|---|---|
| W1 | Where a coin came from | "Where from" (chips, bulk edit, Fill spots) · "Source" (Purchase details, spreadsheet, Inheritances hint) · "Where" (coin page) · "Where did you get it?" | **Where from** everywhere. Spreadsheet keeps reading old "Source" columns. Also: the chips and the Source list are the same field shown twice on one form; keep the chips + "More…", drop the second list. | S |
| W2 | The "+" page (idea 67) | Popup title "Add coin", "+" button named "Add coin", and a bar or junk silver gets title and button "Add coin" (sets and rolls are already right). | Popup title **"What are you adding?"** (replaces the "What is it?" line); "+" named "Add"; button says Add bar / Add round / Add junk silver. "Add to inventory" was considered: longer and no clearer. | S |
| W3 | "Where" | Three meanings: where bought (coin page), where sold (sale), "Where it's kept" (guide, report). | "Where from" · "Sold at" · "Kept in". | S |
| W4 | No place picked | "Nothing special" (coin, filter, move, dealer case) · "Not in a box" (album) · "Pick where…" | **"No album or box"** for coins, "Not in a box" for albums. "Nothing special" doesn't answer "Kept in?". | S |
| W5 | Want list | Menu "Want List", but two messages say "wish list". | "want list". | S |
| W6 | Counting | "Total cost … for 3 coins" also for rolls, sets and bars. | Use the item's own word. | S |
| W7 | "Collection" | A status ("In collection"), a group ("My collection") and Personal ("my collection"). | Leave; mention in ⓘ help only if it confuses. | skip |
| W8 | Spots | album "spot" · box "row" and "slot" · "Numbered spots" · "pocket" · "tray". | Fine as is (spot = general word). Add one ⓘ line. | S |
| W9 | Grade help | "Can't grade this one" (switch) shows as "Not graded" on the coin. | Becomes "Worn, not graded" in C2. | with C2 |
| W10 | Other coins | "Kind" then "What is it called?" then "Face value" with a "$1" example. | Session 55 rebuilds this ("Other coin"); apply W-rules there. | with 55 |
| W11 | Stacks page | "put a junk silver coin in a stack from its Holder section". | Wrong after C: "…with the Stack row". | with C |

## 5. Blueprint clashes (Cull, Stack, Kept in)

**Cull.** The word isn't in the app yet. "Junk" as a *grade* shows in:

| Where | Today | After C2 |
|---|---|---|
| Grade list on the form; Grade from/to in Filter (`GRADES`, catalog/data.js 208) | Junk | Cull |
| Coin rows and coin page (`gradeText`, values.js 286–290) | "Raw Junk" | "Raw Cull" |
| Form hint (coinform.js 156) | "Junk coins are valued at melt." | "Cull coins…" |
| Coin page value row (views.js 351) | "Value (junk = melt)" | "Value (cull = melt)" |
| Grades at a glance (data.js 306) | "Junk: worn, damaged, **cleaned** or holed" | Blueprint wording: holed, bent, corroded or worn nearly smooth. **Drop "cleaned"**: a cleaned coin is a Problem (Details coin), not a Cull. |
| Spreadsheet (sheets.js 164, 229, 289) | writes and reads "Junk" | write "Cull"; read both |
| Options (options.js 153) | "Junk silver goes in My Silver Stack" | goes away |

"Junk silver" as the stacking word (popup choice, "Junk silver 90%", My Stacks intro) is right and stays. Three places use "junk silver coin" to mean a Junk-*graded* coin and need rewording: options.js 153, views.js 154, filters.js 213.

**Stack.**
- Stack is still a choice inside the Kept in list ("Stack: …", "+ New stack…", boxes.js 91–93). Blueprint C makes it its own row.
- The Insurance Report hint says the Kept in column holds "album, box … or stack" (report.js 32). A stack is not a place.
- "My Silver Stack" is typed in 4 code places + 1 label (coinform.js 329, coinsave.js 58, sheets.js 286, values.js 194, options.js 153). D2 needs it to follow the metal: one helper.
- "Silver only for now." (coinform.js 330) and the bulk-move skip reasons (filters.js 185, 213) change with C and D2.

**Kept in.**
- ⓘ help says Kept in is "an album, a storage box, a display box, **or loose in a flip**" (welcome.js 10). The blueprint keeps flips and capsules under Holder. Remove that phrase.
- W4 and B5 above.
- Storage boxes have no Kept in field yet (blueprint B adds it).
- **Question for planning day:** the Holder list contains "Album" and "Roll", which are also places or items. Leave it (old coins have it saved), but should a new coin placed in an album stop asking for a Holder?

## 6. Hard-coded "$" (D1, S)

Good: almost all amounts go through one formatter, `money()` (app.js 12). The "$" typed by hand around it:

| Kind | Count | Where |
|---|---|---|
| Zero text `"$0.00"` handed to the formatter | 35 | dealer.js 177–186, 203 · views.js 118, 173, 174, 181, 265 · albums.js 193, 217, 218 · order.js 58, 61, 110 · selling.js 47, 157, 161 · shelf.js 165, 166 · seller.js 31, 32 · filters.js 115 |
| Gray "$" inside empty price boxes | 14 | coinform.js 180, 236, 238, 452 · selling.js 33, 104, 115, 265, 266 · order.js 30, 31 · dealer.js 196 · wants.js 252 · fillalbum.js 23 ("$ paid") |
| "$" glued on in code | 5 | filters.js 74 · views.js 341 · values.js 282 · history.js 49 · coinform.js 315 |
| Labels with "($)" | 5 | "Face value ($)" coinform.js 323 · "Value from ($)" and "Value to ($)" filters.js 157 · "($ per oz)" style labels options.js 78, 129 |
| A second formatter | 1 | salesreport.js 97 |
| Example sentences ("$20 of dimes", "per $1", "40¢") | 7 | coinform.js 95, 315 · coinsave.js 44 · selling.js 4 · whatsnew.js 10 |
| Coin names ("$1", "$2.50 Gold") | 35 | catalog/data.js. **Leave**: these are the coins' real names and the catalog is the swappable part. |

Also fixed to US style: dates (app.js 216, 219 · history.js 48 · report.js 128) and "oz" in about 60 places.

**Fix:** one small settings block in app.js (symbol, currency, locale), a `money(0)` for zero text, and swap the 60 code spots (mostly the same one-word change). Example sentences stay as text. No saved data touched. **Costly later?** No, as long as new code keeps using `money()`; add that line to CLAUDE.md.

## 7. Hard-coded on-screen text

- About **1,070** pieces of text (labels, buttons, hints, messages) are typed directly into the code that builds each page, across 38 files. Biggest: coinform.js, wants.js, boxes.js, filters.js, selling.js, dealer.js.
- Kept in one place already: status names, ⓘ help words, the grade guide, and the option lists in `catalog/`.
- **Saved data holds English words too:** grade ("Junk"), holder ("2x2 cardboard flip"), source ("Coin Shop"), metal, paid-with, stack names. The blueprint's C2 rule (the saved word stays, the screen shows another) is the right pattern for all of them.

| # | Fix | Size | When |
|---|---|---|---|
| T1 | A short **shared word list** (about 15 words used in many files: Kept in, Stack, Cull, Where from, Holder, Storage, Want list, the Add / Save verbs, "No album or box") plus one "show this saved word as…" helper. Cull then changes in one place. | S | with C2 |
| T2 | Move **all** text into a word list (needed for another language or a reskin). | L | **Wait** until selling or a second language is real. |

**Costly later?** Yes, slowly: T2 grows with every feature (about 1,070 strings now). T1 plus one CLAUDE.md rule ("shared words come from the list") stops the terms drifting meanwhile. Not worth L of his usage today.

## 8. Tests that name these words

Renames must edit tests in the same PR: "Add coin" 20 lines in 16 files · "Junk" 27 in 10 · "Kept in" 22 in 6 · "My Silver Stack" 18 in 7 · "Source" 9 in 7 · "Nothing special" 4 in 2.

## Not covered

Read from code only: no screenshots, no tap-through on a phone, no spacing or color review. The Options page was checked for wording, not order. The full-app review is step 1b(b).
