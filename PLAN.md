# Coin Cabinet: Master Plan

Last updated November 2, 2026. This file is the plan and the progress checklist. Claude ticks off each step when it's merged.

**Next session starts here (session 3, Step 4.3b filters):** switch to **Sonnet**, start a new chat, say *"Open my repo waddelljmw/CoinShelfTest, read CLAUDE.md, IDEAS.md and PLAN.md, and do the next session."*

## Session plan (one chat per session, done in order)

Each session is one new chat that ends with a PR (or a merge). Red Book work is parked until you have the book.

| # | Model | What | Ends with |
|---|---|---|---|
| 1 | Sonnet | Step 4.3 holders, Kept in, storage and display boxes, album colors | ✓ done |
| 2 | Opus | Step 4.5 review of 4.3, fix what it finds | ✓ merged |
| 3 | Sonnet | Step 4.3b filters, saved filters, select and move many | merge |
| 4 | Sonnet | Step 4.4 arrange the Home shelf + Fix list | merge |
| 5 | Sonnet | Phase 5 live metal prices (auto refresh + button); Report a problem button (IDEAS 2) + Fix list | merge |
| 6 | Opus | Plan Phase 7 selling details and the photo-fill choice | plan PR |
| 7 | Sonnet | Phase 7 basic selling | PR |
| 8 | Opus | Phase review (4.3b through 7), then merge | merge |
| later | Sonnet / Opus | With your Red Book: 2.9, 2.9b, grading guide, missing PCGS links. Phase 6 stays paused. Phase 8 Seller Mode planning on Opus. | |

**Rules for a session:**
- Stay in the chat while it works. Coming back after more than ~5 minutes makes the next message cost more (the chat has to be re-read at full price), so finish or say "stop here" before stepping away.
- Send your small changes **together in one message**. Claude says if a change fits now or goes on the Fix list.
- Fits now: small, and in the same part of the app being worked on. Waits: new screens, anything that changes saved data, or anything that would need a second review.
- Start a new chat for each session. Long chats cost more per message.

## Fix list (small changes waiting for a session)

Claude adds items here when they wait. Sessions 4 and 5 clear them.
- **Home: collapsible sections below the shelf** (Melt Value by Metal, Recently added, Recently sold). Tap a heading to open or close it; the app remembers each one. Fits Session 4 (Home shelf).
- **Wooden box look.** Add "Wooden box" to the box Look choices (storage and display). On the shelf, a wooden display box gets a solid wood case (today every display box is drawn as a wood-framed glass case). Fits Session 4.


**Starting a new chat:** say *"Open my repo waddelljmw/CoinShelfTest, read PLAN.md, and do the next step."*

## What you want, in short

- **One place for everything** you own: inherited coins (never for sale), your own collection, proof and mint sets, rolls, slabs (with CAC stickers), medals, tokens, foreign coins, bullion bars, and boxes of wheat pennies.
- **Values you can trust:** numismatic value and melt value, with live metal prices. You can include or leave out groups (inherited, bullion stacks) from your totals.
- **Fast to use on your phone,** working offline as its own app, not only inside Claude.
- **Looks like a real shelf:** albums, stacks and boxes on shelves, with your totals on the top shelf.
- **Later:** a Seller Mode you can hide, and a second app for ancient coins for your friend who sells on Whatnot.
- **Sharing:** with one partner who also collects. No plans to sell the app.

## How to use this plan (no tech knowledge needed)

1. Each step has a **"Say this"** line. Copy it into the chat.
2. Each step says which model to use. To switch, type `/model` and pick **Sonnet 5.5** or **Opus 5.5** before you send the "Say this" line.
   - **Sonnet 5.5:** building, routine fixes and testing. It costs fewer tokens, so use it for most steps.
   - **Opus 5.5:** planning, reviewing for hidden mistakes, and changes to how your data is stored. It costs more, so only use it where the plan says.
3. After each step you get a merge link. Say **"merge it"**, then delete the branch at https://github.com/waddelljmw/CoinShelfTest/branches.
4. If a chat gets long, start a new one. Long chats use more tokens.

---

## Phase 0: Review fixes — DONE ✅

- [x] **0.1** Review leftovers (album years keep your spots, coins re-link after date edits, snapshot hides "Most I'd pay", melt message, New list sheet)
- [x] **0.2** Coin type is locked once saved, with "Wrong type? Re-add it"
- [x] **0.3** Date limits (no coins from the future; wants up to 5 years ahead)
- [x] **0.4** Safety review and fixes

**Added along the way (also done):**
- [x] Album name shows on a coin's page
- [x] Albums with several coin types (e.g. Washington silver + clad), and type-set albums
- [x] Proof spots in albums (None / S proofs only / All proofs)
- [x] Proof switch on coins, with proof-only mint marks (e.g. West Point W)
- [x] Every Lincoln cent type through 2026 (VDB, 1922-D, 1943 steel, 2009 designs) and modern Morgan and Peace dollars
- [x] Album lookup: type a brand and number and it fills in the album (74 albums from Whitman, Dansco, Littleton and H.E. Harris), with exact dates and designs for every coin series in it
- [x] Second safety review and fixes

---

## Phase 1: Make it an independent app (your priority 1)

**Step 1.0. Foundation. Model: Opus** — DONE ✅
*Say this:* "Do Step 1.0 of the plan."

- [x] **PLAN.md** (this file): the plan plus a checklist Claude ticks off.
- [x] **CLAUDE.md:** your working rules, read automatically by every new Claude session (short replies, model advice, test before publishing, merge and branch links).
- [x] **Tests saved in the repo:** all 42 tests now live in the `tests` folder, with one command to run them all (`node tests/run-all.js`). Any future session can check that nothing broke.
- [x] **Version number:** shown at the bottom of Options and raised with each merge, so you can tell which version your phone has.
- [x] **README** in plain words, for you and your partner.
- [x] **Coin catalog in its own folder** (`catalog/`): coin types and dates, Red Book prices, and the album list. The ancient-coins app can swap in its own catalog later.
- [x] Merged

**Step 1.1. Save on your phone, not in Claude. Model: Opus** — DONE ✅

- [x] **Storage:** when the app runs on its own, coins, photos, albums and lists are saved on the device, so it works with no internet.
- [x] **Backup and Restore** (Options): one file with everything, photos included. Restore adds a backup without deleting anything. Home reminds you if your last backup is over 30 days old.
- [x] **Moving your data:** in the Claude version, Options → Backup and restore saves the file you'll restore into the phone app in Step 1.2.
- [x] Merged
- *The "Update ready" banner and the backup reminder before big updates come with Step 1.2.*

**Step 1.2. Put it online and installable. Model: Sonnet.** — DONE ✅ (live at https://waddelljmw.github.io/CoinShelfTest/)

- [x] App icon, install files and offline copy (works with no internet).
- [x] "A new version is ready" bar with Update now, suggesting a backup first.
- [x] Files save as normal phone downloads.
- [x] Merged
- [x] GitHub Pages turned on (repo made public; coins stay on the phone)
- [x] Installed on your phone and coins restored from a backup

- **Hosting:** free hosting on GitHub Pages from your repo, at a web address like `waddelljmw.github.io/CoinShelfTest`.
- **Install:** "Add to Home screen" on Android installs it like a normal app: icon, full screen, works offline.
- **Updates:** after each merge the app updates itself the next time it's online, with an "Update ready, tap to refresh" banner. Your coins are never touched by updates.
- **Saving files:** reports, CSV and snapshots save as normal phone downloads.
- **Privacy:** the web address is public, but your coins are not. Each phone keeps its own data.

**Step 1.3. Sharing with your partner. Model: Sonnet.** — DONE ✅

- [x] Options → **Share the app** sends the app's link through the phone's Share menu. Your partner installs it and gets their own separate collection.
- [x] **Share a snapshot** opens the Share menu with the view-only file (Messages, email, Drive...).
- A shared, live collection would need an online account service. That's its own project, to decide later.

**Step 1.4. Review. Model: Opus.** — DONE ✅

- [x] Fixed: a photo on a coin you hadn't saved yet could be deleted if the app was open in another window.
- [x] Fixed: restoring a backup replaced your value history and settings; now they're combined.
- [x] Fixed: "Update now" could throw away a coin you were halfway through typing.
- Still open: snapshot photos show blank (your paused item, Phase 6). Very large backups (about 1,000+ photos) may get too big for one file; to handle when it matters.

---

## Phase 2: Track everything you own

**Step 2.1. How a coin is held. Model: Opus** (new data fields), then **Sonnet** for screens. — DONE ✅
- [x] Merged (v0.15.0)
- **Holder:** album, slab, hard case, capsule, mint box with COA, 2x2, flip, envelope, roll, loose, or other.
- **Slab extras:** a CAC sticker checkbox (green or gold) with a CAC badge on the coin.
- **COA:** a "COA included" checkbox, plus a note about the box and packaging.
- **Speed:** quick-add remembers your last holder and source.

**Step 2.2. Coin record upgrade. Model: Opus** (new data fields), then **Sonnet** for screens. — DONE ✅
- [x] Merged (v0.16.0), plus tracking number with a Track package link and Mark as received for coins on the way
*Why it comes first:* the steps after it (rolls, sets, the new form) are built on these fields. Deciding how data is stored before building screens means nothing has to be redone.
- **Status:** In collection, On the way (bought or won, not here yet), For sale, Sold, Gone (traded, gifted or lost; left out of totals). Plus an **Upgrade wanted** checkbox. Inherited coins can't be set to For sale. Coins you already have become "In collection" automatically.
- **Purchase details:** date, seller (fills in from past entries), where (show, eBay, Whatnot, shop, inherited), price, tax, shipping and fees, then a **total cost** worked out for you. Plus payment method, receipt number and a receipt photo.
- **Errors and problems:**
  - **Known varieties** (e.g. 1955 doubled die, 1922 no D), including the **Statehood quarter varieties** (e.g. 2004-D Wisconsin extra leaf). Each is checked against real sources or your Red Book pages, never guessed.
  - **Mint errors** picked from a list: off-center, clipped, double struck, broadstrike and others.
  - **Problems:** cleaned, scratched, holed, bent and others. These show as "Details" next to the grade and lower the value.
- **Catalog number** (PCGS or NGC), shown only for slabs and copied from the label. Phase 3 uses it to open that exact coin in the PCGS Photo Guide.

**Step 2.3. A cleaner Add coin page. Model: Sonnet.** — DONE ✅ (merged, v0.17.0). Done: "What is it?" (US coin, or medal/token/foreign); sets, rolls and bullion choices come with 2.4 and 2.7.
- [x] Merged
*Made for anyone, even people who aren't good with technology.*
- The page asks **"What is it?"** first (US coin, set, roll, medal or token, foreign, bullion) and only shows the fields that matter.
- Page one is just the basics: type, year, mint and grade.
- Everything else is in closed sections you tap to open: Holder, Purchase, Errors and problems, Photos, Notes.
- Sale details aren't on this page at all. They open from a **Mark as sold** button (see Phase 7).

**Step 2.4. Sets and rolls. Model: Sonnet.** — DONE ✅ (merged, v0.18.0; also single coins with no value, price or melt count at face value)
- [x] Merged
*Start from PR #29 (branch `step-2.2-sets-rolls`, built before this plan changed): reuse its good parts, add what's new here, then close #29.*
- **Proof and mint sets:** one entry with year, type and packaging (hard plastic or cellophane). Silver proof sets get melt automatically.
- **Rolls:** pick the coin type (e.g. Kennedy half 90%, 40% or clad); the metal comes from the catalog.
  - **Coin count and face value fill in for you:** cents 50 ($0.50), nickels 40 ($2), dimes 50 ($5), quarters 40 ($10), halves 20 ($10), dollars 25 ($25). You can change them.
  - **Dates:** mixed dates, or one date and mint.
  - **Roll condition:** Circulated, AU, UNC or BU, plus an "Original bank wrap" checkbox.
  - **Value:** clad rolls count at face value. Silver rolls are coins × melt per coin. **Nicer rolls** (UNC, BU, bank-wrapped, key dates) can have your own value instead; "Check eBay sold" helps you find one.
  - A roll is all one metal (no mixed silver and clad rolls).
- **Cases with several coins** (e.g. 3 steel wheat cents): one case, with each coin still counted.

**Step 2.5. Coins outside the catalog. Model: Sonnet.** — DONE ✅ (merged, v0.19.0)
- [x] Merged
- Done: **Kind** (Commemorative, Medal, Token, Foreign coin, Other) so they group on Your Coins; **Used before** list so metal and weight are typed once; **grams + purity** helper that works out ounces.
- Commemoratives (like the 1993 James Madison), medals, casino tokens with a silver weight (like your .7 ozt tokens), and foreign coins.
- Type the metal and weight once, and melt is worked out automatically.

**Step 2.6. Groups you can include or leave out. Model: Sonnet.** — DONE ✅ (merged, v0.20.0)
- [x] Merged
- Done: optional **Group** on each coin (Inherited and My collection work themselves out); Home has on/off chips that update value, melt, cost and gain at once. Value history keeps the full total.
- Tag coins with a group, like *Inherited* (never for sale) or *My collection*.
- Turn each group on or off in your totals. Value and melt update right away.

**Step 2.7. My Silver Stack and other stacks. Model: Opus** (planning) — DONE ✅ (merged, v0.21.0)
*Say this (on Sonnet):* "Do Step 2.7 of the plan."
- [x] Planned (Nov 1, 2026). Your choices: Silver Eagles stay with your coins; junk silver coins can join a stack; stacks count in your total, because the total should match your whole real shelf.
- [x] Merged
- A "Stacks" section kept apart from coins, starting with My Silver Stack. My Gold Stack and others can be added later.
- Bars, rounds and other silver items, each with weight, purity, maker and serial number (like your 10 oz Engelhard bar).
- Each stack shows total ounces and melt, and counts in your overall total. A Home on/off chip per stack (like Inherited) lets you leave one out for a moment.
- Gold details are discussed before that part is built.

*How to build it (for Claude):*
- **"What is it?" gets Bullion** (bar, round or other silver item). It is saved as a coin record with `item: "bullion"`, so purchase, status, Mark as sold, photos, backup, groups and Undo all keep working. Extend `itemOf`; old records convert on read.
- **Bullion fields:** type (bar/round/other silver item), metal (Silver for now), maker, weight in oz (grams helper from 2.5), purity (default .999), serial number, quantity. Pure ounces = weight × purity. Value = melt unless he types his own value (collectible bars). No year/mint/grade needed.
- **`stack` field** (a name, like `group`): bullion defaults to "My Silver Stack". Raw coins graded **Junk** that have silver get an optional "Put in a stack" picker. Silver Eagles and other graded coins don't get the picker.
- **Stacks page** (menu): each stack with item count, total pure oz and melt; tap to list its items.
- **Totals:** a stacked item counts only if its group chip AND its stack chip are on (an inherited bar stays "Inherited" and in My Silver Stack). Stacks are on by default (new `hiddenStacks` setting). Value history keeps the full total.
- Tests: bullion melt math, junk coin in a stack, chips, and old coins unchanged.

**Step 2.8. The 2x2 storage box organizer. Model: Sonnet.** — DONE ✅ (merged, v0.22.0)
- A "Box" works like an album. Name it (e.g. Black box 1), set rows and slots per row; each spot holds a 2x2.
- See what's in each row, search for "1909-S", and get its row and slot number.
- See which Lincoln dates you're still missing.

**Step 2.9. More albums. Model: Sonnet.**
- Add Littleton albums that couldn't be confirmed online (type sets, the Silver Eagle album, America the Beautiful Vol. 1). Send photos of their pages.
- Add proof dates for more series (Lincoln, Kennedy, Roosevelt, Silver Eagles and others) from Red Book pages you send, so "with proofs" albums get their proof spots.

**Step 2.9b. Variety audit. Model: Opus** (research), then **Sonnet** (data entry). Best after 2.9, so your Red Book pages can confirm the splits.
*Say this (on Opus):* "Do Step 2.9b of the plan."
- Go series by series and find coins PCGS, NGC or the Red Book split into types or designs that the app doesn't have yet (like Standing Liberty's three types: 1916-1917, 1917-1924, and the 1925-1930 recessed date).
- Give you a short list to approve before anything changes. Nothing is guessed: each split is checked against a source or your Red Book pages.
- Saved coins must keep working. Opus plans how they map to new types or designs; Sonnet then enters the approved changes.
- Also gives each type its exact PCGS Photo Guide link (Phase 3), including types that need one link per design.

**Step 2.10. Review. Model: Opus.** — DONE ✅ (v0.23.2; covers 2.1–2.8, before 2.9 and 2.9b)
- [x] Fixed: older spreadsheet columns ("Serial", "Weight oz", "Details") went to the wrong fields.
- [x] Fixed: spreadsheet export lost group, case name, gone reason and date, kind, box spot and carrier.
- [x] Fixed: import skipped bars and rolls as "duplicates" of different items.
- [x] Fixed: a coin brought back (Undo, Restore, Move back) could share a box spot with another coin; now it leaves the box and says so.

---

## Phase 3: Research links. Model: Sonnet. — PARTLY DONE (v0.23.0)

- [x] eBay sold links added to the Add coin form and the Coin Value page (the want list already had them).
- [x] PCGS Photo Guide link in Add coin names the picked coin type, but it only opens a search for now.
- [x] **Exact PCGS Photo Guide links.** Built (v0.23.1), awaiting merge. Added SLQe, ShieldNic, LibNic, Buffalo, Jefferson, Ike, SBA, SAC; Kennedy is 1964-present. Still without a link: Presidential dollars, Gold Eagles, other classic gold, Silver Eagles, commemoratives (they open the general page). Pattern: `https://www.pcgs.com/photograde#/<Code>/Grades`. Codes are PCGS's own and can't be guessed.
  - Already sent: Roosevelt, Mercury, Barber10, Washington, SLQ (1925-30), SLQT1 (1916-17), Barber25, Seated25, Lincoln, Indian, Flying, BraidedCent, CoronetCent, ClassicCent, DrapedBustCent, LibertyCapCent, WreathCent, ChainCent, Kennedy, Franklin, Walker, Barber50, Peace, Morgan, 2.5Ind.
  - Still needed: Standing Liberty Type 2 (1917-1924), nickels (Shield, Liberty, Buffalo, Jefferson), Eisenhower, Susan B. Anthony, Sacagawea, other gold, anything else wanted. Re-check the Kennedy link (his label said "1946-Present").
  - Build: keep the codes in one small list in `catalog/data.js`; show a small PCGS link next to the grade on the coin's page and in Add coin; one link can cover several app types (e.g. Lincoln, Roosevelt, Washington, Kennedy). Standing Liberty picks by year: 1916 Type 1; 1917 by design (Type 1 if none picked); 1918-1924 Type 2; 1925-1930 recessed. Types with no link open the general Photograde page.
- [ ] Red Book grading guide: skipped for now (needs Red Book photos).


- **Photo guide:** once a coin type is picked in Add coin, a "PCGS Photo Guide" button opens that coin's own guide page. The menu link stays as it is.
- **eBay sold listings:** a button on want-list items, the Coin Value page and the Add coin form.
- **Red Book grading guide:** send photos of the grading pages and a short "What to look for" note per grade appears next to the grade picker.

---

## Phase 4: The shelf look

**Step 4.1. Design. Model: Opus.** — DONE ✅ (Nov 2, 2026)
- [x] Picked: **two styles you can switch between** in Options → Shelf style: **Bookcase** (option A, wood with brass plaques) and **Safe** (option D, steel walls, bolts, dial and handle on a door bar, green display numbers).
- [x] Bookcase follows the phone's night mode: **only the page background around the bookcase** (and the top bar, chips) goes dark; the bookcase itself stays the same. Safe has no night version (it's already dark).
- Mockup to copy: `design/shelf-mockup.html` (open with `?v=A`, `?v=A&night=1`, `?v=D`). Shelves top to bottom: totals plaques + metal prices; albums (spines with title + years, green check when complete, series kept together in his order); stacks, My Coins, rolls; 2x2 boxes (filled/total) and sets. Sample numbers in it are made up.
- No door-opening animation.

*Say this (on Sonnet):* "Do Step 4.2 of the plan."
- **Top shelf:** total value, melt value and live metal prices, shown like plaques.
- **Middle shelves:** album spines for each album (generic designs, without copying brand logos), a stack of bars for My Silver Stack, a coin stack for My Coins, and boxes for your 2x2 boxes and sets.
- **Tapping** an item opens that section. The graphics are original drawings, so there are no copyright issues and the app stays fast.

**Step 4.2. Build it. Model: Sonnet.** Then you check it on your phone.
- [x] Built in PR #52 (branch `step-4.2-shelf-home`, v0.24.0, not merged yet): shelf Home in `shelf.js`, Bookcase/Safe switch in Options, test `tests/shelf.js`.
- [x] Merged (PR #52, then fixes in #53, v0.24.2)
- [x] **Full-shelf fix (done in v0.24.1, PR #52; was: do this next, on the same branch/PR #52):** now a full shelf scrolls sideways with no sign there's more. Change to: album spines wrap onto **up to 2 album shelves** (about 18 spines, each row with its own wooden board); if there are more, the last spot is a **"+N more"** spine that opens the Albums page. Boxes and sets row: **1 shelf**, then "+N more" opening 2x2 Storage Boxes. Stacks row: same idea if it overflows. Series stay together in his order. Add checks to `tests/shelf.js` (e.g. 30 albums → 2 shelves + "+N more"), take one screenshot, bump to v0.24.1 in the three places.

---

**Step 4.3. Holders, storage and display boxes. Model: Sonnet** (planned on Opus, Nov 2, 2026). Opus review (4.5) before merging, because it changes how boxes are saved.
*Session 1.*
- [x] Planned
- [x] Built (v0.25.0, branch `step-4.3-holders-storage`, PR open, **not merged** until the Opus review, session 2)
- [x] Merged (v0.25.2, Nov 2, 2026, after the Opus review)

*Two separate things for every coin:* **Holder** = what is right around the coin (flip, capsule, slab). **Kept in** = the container that holder sits in (album, storage box, display box, stack). Example: wheat cent · 2x2 cardboard flip · kept in Black box 1.

- **Holder choices** (`HOLDERS` in `catalog/data.js`): Album, Slab, Hard case, Capsule, **2x2 cardboard flip**, **Plastic flip**, **Plastic holder**, Mint box, Envelope, Roll, Loose, Other. Convert on read: old `"2x2"` shows as "2x2 cardboard flip", old `"Flip"` as "Plastic flip" (saved value only changes when the coin is edited). Flip sizes stay in `IDEAS.md`.
- **"Kept in" dropdown** (Holder section of Add coin, near the top): Nothing special · each album · each storage box · each display box · each stack (stacks only where they're allowed today: bullion and junk silver). **Every kind of item gets Kept in:** coins, sets, rolls, bullion, medals, tokens and foreign coins (albums only list coins that fit them, as today). **One place per coin:** picking one clears the others (`albumId`, `boxId`/`boxRow`/`boxSlot`, `stack`). Old coins that have two keep both until edited; their page shows both. Album choice still puts the coin in its album spot as today.
- **Any holder can go in a box** (today only "2x2"; remove that limit in `boxCheck`). Capsules, flips and hard cases all allowed.
- **Box record** (`b_`, `boxes.js`) gains, converted on read for old boxes:
  - `type`: `storage` (default) or `display`.
  - `look`: `black` (default, old boxes), `cardboard`, or `plastic`. Plastic gets `color`: **clear** (see-through, coins visible), white, red, dark blue, yellow, dark green, orange, dark brown (solid-looking). Changeable any time in Edit box.
  - `spots`: on = rows × slots like today (old boxes: on); off = no numbered spots, just a list of what's inside (good for capsule containers and display boxes).
  - `inside`: optional **"What's inside"** note, typed when adding or editing the box (e.g. "ziplock of Bicentennial quarters, pill bottle of halves"). Coins he enters are linked to the box only through Kept in; the note is just a description.
- **Names:** "2x2 storage box" becomes **"Storage box"**; menu page "2x2 Storage Boxes" becomes **"Storage"**, listing storage boxes then display boxes. New box form asks: name, storage or display, look (and color), numbered spots on/off (then rows and slots), What's inside. Example name stays "Black box 1".
- **Box page:** with spots, same grid as today; without spots, a list of its coins plus the What's inside note. Search and missing-wheat still work.
- **Shelf drawings** (`shelf.js`, `styles.css`): black box as today; cardboard box (brown, tape strip); plastic box in its color; the clear one is see-through with coin shapes inside. **Display box:** a flat wood-framed glass case showing a few coin circles, on its own shelf.
- **Album spine colors by brand** (replace the blue/red/green cycle): Whitman blue (current blue), Littleton green (current green), Dansco dark brown, H.E. Harris beige (dark lettering). "Other" albums: pick a color when adding or editing the album (same color list as boxes, default red), saved as `color`.
- **Search** also matches holder text (including typed "Other" text like "Ziplock bag") and the Kept in name. The Holder and Kept in filters come in 4.3b.
- **Backup, CSV, snapshot, insurance report:** carry the new box fields; CSV "Kept in" column; snapshot shows box names.
- Tests: old box converts with spots on and black look; capsule coin in a box; picking a box clears an album; box without spots has no row/slot; old "2x2"/"Flip" labels; spine color per brand. Version → 0.25.0.

**Step 4.3b. Better filters for Your Coins. Model: Sonnet.** After 4.3 is merged (it needs Holder and Kept in).
*Say this (on Sonnet):* "Do Step 4.3b of the plan."
- [ ] Built
- [ ] Merged
- **One "Filter" button** opens a panel with every filter; the ones in use show as chips above the list (tap × to remove one, "Clear all" to reset). Search and sort stay where they are. The count shows "12 of 340 coins".
- **Filters** (each one optional; they combine):
  - Already there, moved into the panel: coin type, metal, raw or certified, status.
  - **Group** (Inherited, My collection, your own) and **Stack**.
  - **Holder** (each choice, plus every custom "Other" text typed, like "Ziplock bag") and **Kept in** (each album, box, display box, stack, or "Nothing special").
  - **Year range** (from / to) and **mint mark** (P, D, S, W, CC, O, none).
  - **Grade range** (e.g. VF-20 to MS-63; Junk and custom grades listed too) and **value range** ($ from / to).
  - **Problems and errors:** Details coins, known varieties, mint errors, CAC sticker.
- **Select and move many at once:** a "Select" button on Your Coins; tick items (or "Select all shown", which works with filters, e.g. all wheat cents), then **Move to…** (pick an album, box, display box or stack; boxes with numbered spots fill the next free spots, and it says if there aren't enough) or **Set holder…**. One Undo puts everything back. Items that can't go there (e.g. a Morgan into a Lincoln album, a coin into a stack it can't join) are skipped and listed.
- **Saved filters:** "Save this filter" with a name (e.g. "Inherited silver"); saved ones are one tap at the top of the panel; rename or delete (with Undo). Saved in settings as `savedFilters`.
- Filters are remembered while the app is open. Totals on Home are not changed by these filters (Home has its own group/stack chips).
- Tests: bulk move into a box with spots (and too few spots), bulk move Undo, skipped items; each filter, combined filters, custom holder text, saved filter round-trip, old settings without `savedFilters`. Version: middle number up.

**Step 4.4. Arrange the Home shelf. Model: Sonnet.** After 4.3b is merged.
*Say this (on Sonnet):* "Do Step 4.4 of the plan."
- [ ] Built
- [ ] Merged
- **Shelves:** top totals (always first, can't move or hide), Albums, Stacks and coins, Storage boxes, Display boxes, Sets (sets get their own shelf).
- **Options → Home shelf:** each shelf has on/off, up/down arrows (no dragging, easier on a phone), and a pin choice: **None**, **Pin to top** (always right under the totals; several pinned shelves keep their order) or **Lock in place** (stays at its position number when others move).
- **Hide single items:** a "Show on Home shelf" switch on each album page and box page. Hidden shelves and items still count in your totals; only the drawing hides. A small "N hidden" note in Options with "Show all".
- **Saved in settings** as `shelfLayout`: `{ order, hidden, hiddenItems, pins }`. Missing or unknown entries fall back to the default order, so new shelves added later just appear.
- Tests: reorder, pin to top, lock in place while moving another, hidden album still in totals, old settings without `shelfLayout`. Version → 0.26.0.

**Step 4.5. Review. Model: Opus.** Before 4.3 merges (it reshapes saved boxes), then a short look at 4.4.
*Say this (on Opus):* "Do Step 4.5 of the plan."
- [x] Review of 4.3 done (Nov 2, 2026)
- [ ] Short look at 4.4

## Phase 5: Features that need an outside service. Model: Sonnet.

- **Photo fill** (reading a coin from a photo) needs an AI service. Choose between: (a) leaving it off in the standalone app, or (b) using your own Anthropic API key, which costs a few cents per coin. It's explained step by step when we get there.
- **Live metal prices:** fetched from a free price source when you're online, with the last prices kept for offline use. You can still type them in. Add: refresh the prices automatically each time the app is opened (when online), plus a button to fetch them on demand. Show when they were last updated.

---

## Phase 6: Paused item: snapshot photos. Model: Sonnet.

*You asked to pause this.*
- **The problem:** coin photos show blank inside a shared snapshot file.
- **The fix:** store the photos in the file itself.
- **Why it waits:** Phase 1 changes how photos are stored, so it comes after.

---

## Phase 7: Basic selling (part of priority 1). Model: Sonnet.

- A "For sale" mark with an asking price, and a simple For Sale list.
- Profit per sale (what you paid vs. what it sold for), including shipping and fees. This builds on what the app already has.
- **Mark as sold** opens the sale details: date, buyer, where (eBay, Whatnot, show, private), price, shipping charged and shipping paid, platform fees, sales tax collected, payment method, order and tracking numbers, then **profit** worked out for you.
- Ideas for status, purchase and sale details came from OpenNumismat (ideas only, no code copied).

---

## Phase 8: Seller Mode (priority 2, details planned later)

**Step 8.0. Plan it together. Model: Opus.**
- **Your choice to show:** a switch in Options turns Seller Mode on. When it's off, nothing about selling shows.
- **Separate inventory:** your personal collection stays separate from your business inventory.
- **Whatnot tools:** fast bulk entry, show-day lists, Whatnot fee math and sales per show.
- **For first-timers:** pricing help at a coin show, such as Red Book value, melt and a suggested asking price.
- **Business profile:** name, EIN or tax ID, address and sales-tax info.
- **Reports:** sales, costs, profit and inventory value by month, quarter or year, ready for an accountant, with totals that line up with 1099-K forms and a Schedule C style summary.
- **A note on taxes:** Claude isn't a tax advisor. The app organizes your records, and a tax professional should review them before you file.

---

## Phase 9: The ancient-coins app for your friend (priority 3)

- From Step 1.0 on, the coin catalog lives in its own folder (`catalog/`), so the second app can swap in an ancient-coin catalog without rewriting the rest.
- It starts as a copy of this project in a new GitHub repo, planned together on Opus.

---

## Rules for every step

- Every change is tested on a phone-sized screen before you see it (`node tests/run-all.js` must pass).
- Nothing deletes your data without asking, and Undo is offered where possible.
- Coins you already have keep working after every change.
- If a step would break another feature, Claude stops and asks.
- Replies stay short to save tokens.
