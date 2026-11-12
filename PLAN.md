# Coin Cabinet: Master Plan

Last updated November 10, 2026. This file is the plan and the progress checklist. Claude ticks off each step when it's merged (green check ✅ = done).

**Next session starts here (Sonnet, This week item 2: 81 + 82):** planning held early on Nov 11 (`reviews/15`); this week runs the Nov 17 update a week early, then pulls in Next week. Go down the **This week** table, then **Next week**, then Extras, while weekly is under each item's number; stop at 70%. **11.3 not before Sat 11-14**, and 11.4, 11.6, 79a, G wait on it. Already done, don't redo: 11.0–11.2 (v0.59.0), 10.1, Fable C fixes, 10.2 + Back follow-ups, bugs #1–#9. Phone steps done. 11.5 done (v0.61.5, `tests/contrast.js`). App is v0.61.5.

## This week, run as a new week (Thu 11-12 → Tue 11-17 1pm): the Nov 17 update, a week early
Fable did last week's plan early, so this week does the Nov 17 update. Days are a guide (baby). One item per chat; new chat after each merge. **Stop building at 70% weekly.**
**Wait rule:** 11.3 not before **Sat 11-14** (his phone needs a few days on v0.59.0+; phone steps done). Everything that depends on it (11.4, 11.6, 79a, G) waits too. Never merge anything marked "merge waits" outside its review.

| # | Day | Model | What | Size | Start if weekly under | Merge | Done |
|---|---|---|---|---|---|---|---|
| 1 | Thu | Sonnet | **11.5** contrast check (`reviews/14`) | S | 66% | on green | ✅ |
| 2 | Thu | Sonnet | **81 + 82** Forward loses typing; fast double-tap on ✕ (one PR) | S | 66% | on green | |
| 3 | Fri | Sonnet | **52** walkthrough fixes | M | 63% | on green | |
| 4 | Fri | Sonnet | **80** show Album › Box › Shelf where a coin is kept | S–M | 64% | on green | |
| 5 | **Sat+** | Sonnet | **11.3** remove Red Book prices from the site (`reviews/14`) | M | 63% | **waits for review** | |
| 6 | Sun | **Opus** | **11.4** review of 11.3, fixes, his OK, merge | S | 60% | asks him | |
| 7 | Mon | Sonnet | **11.6** Silver Eagles by private file (attach Drive price file + Red Book page photo); after 11.4 | S | 66% | on green | |
| 8 | Mon | Sonnet | **79a** bring your own values (spreadsheet: match columns, preview, confirm); after 11.4; writes his price record | M | 62% | asks him | |
| 9 | Tue AM | Sonnet | **55 + 56** mode-switch confirm; tap Coins sold (one PR) | S | 66% | on green | |
| 10 | any | you | Update now after each merge · three known coins same values after 11.4 · enter coins | | | | |

## Next week (Tue 11-17 → Tue 11-24): planned now so it can be pulled in (2 M + 2 S)
Blueprint order (`reviews/11`): after A comes F1 and E with idea 77. **Pull in** once this week's list is done, top to bottom, if weekly is under the number (e.g. with 15% left on Tue morning). Tue 1pm planning only confirms or swaps.

| # | Model | What | Size | Start if weekly under | Merge | Done |
|---|---|---|---|---|---|---|
| N1 | Sonnet | **F1** fix a hand-typed type's name (IDEAS 58 first step, blueprint F) | S | 66% | asks him (saved coin data) | |
| N2 | Sonnet | **E + 77** always a year or a "too worn" tick, new coins only (IDEAS 60, blueprint E) + type the year first; label `waits for review` | M + M | 60% | **waits for review** | |
| N3 | **Opus** | Review of N2, fixes, his OK, merge | (with N2) | 60% | asks him | |
| N4 | Sonnet | **G** fresh-start repo; not before **Sat 11-21** (a week after 11.4); he does a few GitHub taps | S | 66% | | |

### Extras (filler only after both tables; Sonnet; none changes how coins are saved)
57 small help hints (S) · 70 add missing coins to a want list (S/M) · 34 + 35 Kept in for boxes, swap trays (S) · 46 remove from album (S; he answers one question first) · 59 fill from the album spot (M) · 61 report filters (M). Budget: S ~1–2 weekly points, M ~3, Opus review ~5–8.

## This week (Tue 2026-11-10 → Tue 11-17): done except step 8
He works when he can (baby); days are a guide only. Deadlines: Fable + reset by **Sun 11-16 11:59pm PT**; stop building at ~70% weekly.

| Step | Guide day | Model | What | Done |
|---|---|---|---|---|
| 1 | Wed | **Fable** | Session 54: saved-data blueprint (no building) | ✅ `reviews/11` |
| 1b | by Sun | **Fable** | Optional, only if Fable is left: (a) ✅ layout + wording audit 66/67 (`reviews/12-layout-wording-audit.md`), (b) ✅ full-app review with the lenses (`reviews/13-full-app-review.md`), (c) ✅ detailed Nov 17 plan (`reviews/14-nov17-plan.md`). New chat each. | ✅ |
| 2 | Wed | Sonnet | Session 55: **11.0 + 11.1** from `reviews/14` (old-backup safety test; dates split from prices). Two PRs, merge on green. Nothing he can see changes. | ✅ |
| 3 | Wed–Thu | **Fable A** | Session 56: **11.2** copy prices to the phone (one new saved record). PR gets `waits for review`, no merge. Sends him the private price file. | ✅ |
| 4 | next chat | **Fable B** | Session 57: review the 11.2 PR (reproduced problems only), fix, his OK, merge. Then he does the 5-minute phone steps in `reviews/14` (Update now, Options line, back up, Drive file, open the app once on Jinny's phone). | ✅ |
| 5 | Thu–Fri | Sonnet | Session 58: Step 10.1 (new coin types + "Other coin") | ✅ v0.60.0 |
| 6 | by Sun, optional | **Fable C** | Only if weekly is under ~55% and Fable is left: check 10.1's dates and mints against sources, light look at its code. | ✅ v0.61.1 |
| 7 | Fri+ | Sonnet | Session 59: Step 10.2 (Back button). First thing to slide to next week if weekly nears 70%. | ✅ v0.61.0 |
| 8 | Fri–Sun | you | Try it in `?demo`, then enter coins | |

**Usage notes:** Fable is not free: each Fable point has cost about half a weekly point. Start a Fable chat only with the session meter under ~50% (they have cost 20–50 session points). **Free Fable reset:** he uses it after the last Fable chat (B, or C if it runs) and does **not** use Fable after it; Opus and Sonnet only from then on. So all Fable work comes before the reset. Not pulled forward: 11.3 removal (needs the wait), 11.5, 11.6.

### Step 10.1 (session 58, Sonnet): new coin types + "Other coin" (M)
Options 1 + 2 from `reviews/09-tuesday-pack-2026-11-07.md`; **no change to how coins are saved** (option 3, "date as written", is not built).
- [x] ✅ Add the missing types (half cents, large cents, 2-cent, 3-cent, half dimes, Capped Bust, Seated Liberty, Trade dollar, 20-cent, 2004-05 Westward Journey nickels, 2018+ American Innovation dollars). Dates and mints looked up, never guessed; no Red Book values unless he sends pages.
- [x] ✅ (already there as "Medal, token or foreign coin": typed name, kind, face value, year, no Red Book value; a separate country box not added, name carries it) Built-in "Other coin" type (like "Other set"): real year, typed name + country, no Red Book value.
- **His checks:** finds "Trade dollar" in the type list · adds an Other coin (e.g. a Canadian coin) and it saves with its name and no value · his old coins look the same.

### Step 10.2 (session 59, Sonnet): Back button + restore + box totals (M + S + S)
- [x] ✅ Back button (IDEAS 53, v0.61.0): Back on the "i" popup closes only the popup and keeps what was typed; Back after "+" in an album returns to the album; check every popup and form.
- [x] ✅ Restore keeps settings (bug #2, v0.58.9): a setting counts as "set on this phone" only if it differs from `DEFAULT_SETTINGS`. Test: fresh app, restore, `shelfStyle`/`shelfLayout`/folded sections come back.
- [x] ✅ Box totals (bug #4, v0.58.7): Storage shows albums as their own number, e.g. "3 coins · 1 album". Write the total as one function that can later walk down nested containers (blueprint B).
- **His checks:** Back on "i" keeps his typing · restore in a private window keeps Recently added folded · a box with albums shows them on Storage.

### Next 3 weeks (tentative; minutes have the reasons)
- **Nov 17:** see the Next week box (picked 2026-11-11, `reviews/15`).
- **Nov 24:** blueprint B + C + C2 (red box nesting; stack and container; Cull), planned Tue 11-24. *Likely to change.*
- **Dec 1:** D2 + D3 (more stacks, stack groups; his bulk-by-the-pound lots, ideas 71/72/18).

### How we run the project (PMBOK-light, agreed 2026-11-06)
- **Scope:** IDEAS.md (backlog) → planning day picks the week's update (S/M/L budget) → steps here.
- **Acceptance:** each item has 2–3 "his checks" he ticks on his phone (his SaaS contract model).
- **Quality:** tests on every PR (GitHub enforces); Opus review before changes to how coins are saved; count bugs found after merge, more than 2 in a week means the next update gets a review.
- **Risk:** for every design choice ask "costly to change later?" and flag it.
- **Record:** minutes each planning day in `reviews/NN-planning-minutes-DATE.md`; standards change only on planning day.

## Session plan (one chat per session, done in order)

Each session is one new chat that ends with a PR (or a merge). Red Book work is parked until you have the book.

| # | Model | What | Ends with |
|---|---|---|---|
| 1 | Sonnet | Step 4.3 holders, Kept in, storage and display boxes, album colors | ✅ done |
| 2 | Opus | Step 4.5 review of 4.3, fix what it finds | ✅ merged |
| 3 | Sonnet | Step 4.3b filters, saved filters, select and move many | ✅ merged |
| 4 | Sonnet | Step 4.4 arrange the Home shelf + Fix list | ✅ merged |
| 5 | Sonnet | Phase 5 live metal prices (auto refresh + button); Report a problem button (IDEAS 2) + Fix list | ✅ merged v0.29.0 |
| 6 | Opus | Plan Phase 7 selling details and the photo-fill choice | ✅ plan PR |
| 7 | Sonnet | Coin IDs (7.0), Phase 7 basic selling (7.1–7.3) + photo-fill "Coming soon" lock | ✅ merged v0.30.0 (PR #71) |
| 8 | Opus | Phase review (4.3b through 7), then merge | ✅ reviewed, 6 fixes, merged |
| 9 | Sonnet | Step 4.6 add many identical coins at once | ✅ merged v0.31.0 (PR #72) |
| 10 | Opus | Step 8.0 plan Seller Mode (business info, reports, tax documents) | ✅ plan PR |
| 11 | Sonnet | Fix list (album date sort, notes above purchase, proof value, smaller Home chips) | ✅ merged v0.31.1 (PR #74) |
| 12 | Sonnet | Step 8.1 Seller Mode switch, Business stock, business profile | ✅ merged v0.32.0 (PR #76) |
| 13 | Sonnet | Step 8.2 dealer display case and shows | ✅ merged v0.33.0 (PR #79) |
| 14 | Sonnet | Step 8.3 pricing help and reports | ✅ merged v0.34.0 (PR #82) |
| 15 | Sonnet | Step 8.3b saved shipping costs, "Going as" on shows, "Was kept in" on sold coins | ✅ merged v0.35.0 (PR #85) |
| 16 | Opus | Step 8.4 review of Phase 8, then merge | ✅ reviewed, 6 fixes, v0.35.1 |
| 17 | Sonnet | Tidy batch (see **After Phase 8** below): hide values keeps melt prices, Options tidy, Home toggles, junk silver default | ✅ merged v0.36.0 (PR #90) |
| 18 | Opus | Plan the main menu rework (IDEAS 7); planning only | ✅ plan PR (Step 9.0) |
| 19 | Sonnet | Build the menu rework (Step 9.0) | ✅ merged v0.37.0 (PR #95) |
| 20 | Opus | Plan demo mode (IDEAS 8) | ✅ plan PR (Step 9.1) + automatic GitHub tests |
| 20b | Sonnet | Split `app.js` into smaller files by area (no change to what you see); check the automatic GitHub test run passes | ✅ merged v0.37.1 (PR #99), automatic GitHub tests pass |
| 21 | Sonnet | Build demo mode (Step 9.1) | ✅ merged v0.38.0 |
| 22 | Sonnet | Three AI test-user reviews (IDEAS 13): first-time collector, heir, coin-show seller. One chat each, read page text, few screenshots | ✅ all 3 done: `reviews/01-first-time-collector.md`, `reviews/02-heir.md`, `reviews/03-coin-show-seller.md` |
| 23 | Opus | Read the reviews, then the feature audit (IDEAS 22); plan the changes | ✅ plan PR (Step 9.2) |
| 24 | Sonnet | Step 9.2 session 24: honest values, Add coin, Options groups, tuck away | ✅ merged v0.39.0 (PR #109) |
| 24b | Sonnet | Step 9.2 session 24b: seller fixes from review 3 | ✅ merged v0.40.0 (PR #111) |
| 25 | Sonnet | One-page infographic of the app's best features, for you to show people (not in the app); made as a design you can edit, print or share | ✅ done (Claude Design canvas "Coin Cabinet: Best Features", not in the repo) |
| 26 | Opus | Plan from your 45-minute use notes (Step 9.3) | ✅ plan PR #112 (+ v0.40.1 hide-values fix) |
| 27 | Sonnet | Step 9.3a: faster entry fixes + Add album cleanup + What's new | ✅ merged v0.41.0 (PR #113) |
| 28 | Sonnet | Step 9.3b: complete profile, Needs info list, inheritances | ✅ merged v0.42.0 (PR #114) |
| 29 | Sonnet | Step 9.3c: want lists (one want, many lists; missing from album; album wish list) | ✅ merged v0.43.0 (PR #116) |
| 30 | Sonnet | Step 9.3d: asking price with your cost + tax records | ✅ merged v0.44.0 (PR #117) |
| 31 | Opus | Review of 9.3b–9.3d (they add saved data), fix what it finds | ✅ reviewed, 5 fixes + delete confirm, merged v0.44.1 (PR #118) |
| 32 | Opus | Plan new-user help: plain words, walkthrough, Simple mode | ✅ plan PR (Step 9.4) + automatic version check |
| 33 | Sonnet | Fix list + Step 9.4a: change many coins at once | ✅ merged v0.45.0 (PR #122) |
| 34 | Sonnet | Step 9.4b: first open, guided first coin, plain-words help (bug #120 fixed first: v0.45.1, PR #124) | ✅ merged v0.46.0 (PR #125) |
| 35 | Sonnet | Step 9.4c: Simple mode (3 levels) | ✅ merged v0.47.0 |
| 36 | Opus | Review of 9.4 (9.4a changes many saved coins at once), fix what it finds | ✅ reviewed, 5 fixes, merged v0.47.1 (PR #130); inherited coins keep skipping Date acquired too |
| 37 | Sonnet | Fix list (your 2026-11-04 notes: update bar, Suggest an idea, existing coin into album spot, U.S. Mint, level lines) | ✅ merged v0.48.0 |
| 38 | Opus | Plan bug #123: your own catalog numbers (turn off auto Coin ID, use your own flip labels, other systems) | ✅ plan PR (Step 9.5) |
| 39 | Sonnet | Step 9.5: Coin ID style (your own codes, one running number, off), any label typed, IDs in CSV import, renumber with old ID kept | ✅ merged v0.49.0 (PR #135) + v0.49.1 (PR #136, Undo stays in Options) |
| 40 | Opus | Short review of 9.5 (renumbering changes saved coins), fix what it finds | ✅ reviewed, 5 fixes + 1 small, v0.49.2; renumber skips every number on any flip (your choice) |
| 41 | Opus | Plan Step 9.6: fill a full album, Add coin order, trays, albums kept in a box | ✅ plan PR |
| 42 | Sonnet | Step 9.6a: fill a full album (quick list) + Add coin order | ✅ v0.50.0 |
| 43 | Sonnet | Step 9.6b: trays in a box + albums kept in a box (merge waits for review) | ✅ v0.51.0, PR open |
| 44 | Opus | Review of 9.6b (changes how boxes are saved), fix, merge | ✅ reviewed, 2 fixes (coins returning to a removed tray or spot), v0.51.1 |
| 22b | Sonnet | Test-user re-runs on v0.52.0 (the app changed a lot): the heir | ✅ `reviews/04-heir-v0.52.md` (★★★★, 8 problems, 7 wishes) |
| 22c | Sonnet | Same re-run: the coin-show seller (Seller Mode, all business features, ~10 sales, reports, CSV, tax documents) | ✅ `reviews/05-coin-show-seller-v0.52.md` (★★★★, 11 problems, 10 missing business features) |
| 22d | Sonnet | Same re-run: the Whatnot live-stream collector/seller (IDEAS 13, same business checks plus stream costs, fees, shipping) | ✅ `reviews/06-whatnot-seller-v0.52.md` (★★★★, 11 problems, 11 missing business features) |
| 45 | Opus | Read all six reviews + your 2026-11-05 notes, plan the next batch (Step 9.7); planning only | ✅ plan PR |
| 46 | Sonnet | Step 9.7a: money fixes (refund keeps the record, Paid for the whole lot, bulk price never below cost) + your small notes. **Merge waits for session 47 review** | ✅ built v0.53.0, PR #153 open (not merged) |
| 47 | Opus | Short review of 9.7a (refund changes how a sale is saved), fix, merge (ask you first) | ✅ reviewed, 6 fixes, merged v0.53.0 (PR #153) |
| 48 | Sonnet | Step 9.7b: one order with several coins, matching profit numbers, CSV columns, shows (entry fee, bought at this show), stream costs by kind. **Merge waits for session 49 review** | ✅ built v0.54.0, PR open (not merged) |
| 49 | Opus | Short review of 9.7b (orders change how sales are saved), fix, merge (ask you first) | ✅ reviewed, 3 fixes, merged v0.54.1 (PR #154) |
| 50 | Sonnet | Step 9.7c: heir fixes (junk silver by face value, counts agree, report sort, can't-grade choice) | ✅ merged v0.55.0 |
| 51 | Sonnet | Step 9.7d: pocket album (flips/capsules in rows and columns). **Merge waits for session 52 review** | ✅ v0.56.0, PR open (branch `step-9-7d-pocket-album`) |
| 52 | Opus | Short review of 9.7d (new kind of album), fix, merge (ask you first) | ✅ reviewed, 3 small fixes (pocket album kept in a box, pocket wording), also fixed automatic tests (PR #157) |
| 53 | Opus | Planning day (Tue 2026-11-10): bug review, sort notes + IDEAS into the week's top 3 | ✅ minutes `reviews/10` |
| 54 | **Fable** | Saved-data blueprint (no building), see This week | ✅ `reviews/11-saved-data-blueprint.md` |
| 55 | Sonnet | 11.0 + 11.1 (`reviews/14`): old-backup test, dates split from prices | ✅ |
| 56 | **Fable** | 11.2 copy prices to the phone. **Merge waits for session 57 review** | ✅ |
| 57 | **Fable** | Review 11.2, fix, merge (ask him first) | ✅ |
| 58 | Sonnet | Step 10.1: new coin types + "Other coin" | ✅ |
| 59 | Sonnet | Step 10.2: Back button (restore settings and box totals already done) | ✅ v0.61.0 |
| later | Sonnet / Opus | Morgan 1878 album spots. **From his photo (2026-11-04), Whitman Classic Morgan 1878–1886 page 1, 3 per row, in order:** 1878 8 Tail Feathers; 1878 7 Over 8 Tail Feathers; 1878 7 Tail Feathers; 1878-CC; 1878-S; 1879; 1879-CC; 1879-O; 1879-S. With your Red Book (order: Kennedy, Lincoln wheat, Mercury, Roosevelt, Walking Liberty, Indian cent, Indian $2.50, Barber, Ike): 2.9, 2.9b, grading guide, missing PCGS links. Phase 6 stays paused. | |

**Rules for a session:**
- Stay in the chat while it works. Coming back after more than ~5 minutes makes the next message cost more (the chat has to be re-read at full price), so finish or say "stop here" before stepping away.
- Send your small changes **together in one message**. Claude says if a change fits now or goes on the Fix list.
- Fits now: small, and in the same part of the app being worked on. Waits: new screens, anything that changes saved data, or anything that would need a second review.
- Start a new chat for each session. Long chats cost more per message.

## Fix list (small changes waiting for a session)
- [x] ✅ done v0.38.3 **Coin ID changes on first reopen** (review 3, finding 1; Sonnet). New coin shows MD-001, after one reload it is MD-002 and 001 is used up. `ensureIds()` in `ids.js` adds the ID in memory but the saved record lacks it (likely overwritten by the form save). Fix so the ID is saved with the coin, add a test (save coin, reload, same ID), and check old coins.

- [x] ✅ done v0.45.1 **Selling part of a group (bug #120)** (session 34). The Mark as sold form already splits a group (`n` field), but it started at the full count, so it was easy to miss. The count now starts blank and is required, with **Just 1** / **All N** buttons. No change to how sold coins are saved. Test `tests/sellcount.js`.
- [x] ✅ done v0.45.0 **Update always jumps to the newest version** (your note 2026-11-04). Tapping Update now could install an older waiting version, then ask again. Register `sw.js` with `updateViaCache: "none"`; on tap, run `reg.update()` and send "update-now" to the newest `reg.waiting` (not the worker saved when the bar first showed); if a newer one arrives while the bar is up, the bar uses that one. Test: two versions published in a row need only one tap.
- [x] ✅ done v0.45.0 **Mintage line covered by the "Missing" box** on the coin page (screenshot 2026-11-04). Move the mintage line to sit right under the coin name/album/ID, above the Missing box; check the box no longer overlaps anything.
- [x] ✅ done v0.45.0 **Select all · Clear at the top too** on long pick lists (album "Missing" list in `wants.js`, and the My Coins select bar). Keep the bottom ones as well.

- [x] ✅ done v0.48.0 **Update bar covers the Save button** (your note 2026-11-04). The "update available" bar sits at the bottom of the screen, over the form's Save/Add button. Move the bar to the top while a form or pop-up is open (or always), so nothing is covered.
- [x] ✅ done v0.48.0 **Send an idea, too** (your note 2026-11-04). Report a problem in Options becomes **Report a problem · Suggest an idea**: same pre-filled GitHub page, but the idea one starts with "Idea:" so the start check (which looks only for "Problem:") isn't slowed. Ideas are read when you ask.
- [x] ✅ done v0.48.0 **Use a coin I already have for an empty album spot** (your note 2026-11-04). The empty-spot menu has only "Add coin to this spot" (makes a new coin). Add **"Put a coin I already have here"**: lists your owned coins of that type, year and mint that aren't in an album; tap one to place it. (A coin's own edit page already has Holder and Kept in › Album.) Uses the existing album field; no change to how coins are saved.
- [x] ✅ done v0.48.0 **The U.S. Mint as a place of purchase** (your note 2026-11-04). Add to the Source list (Paid with fills Card, like eBay).
- [x] ✅ done v0.48.0 **Show all three level lines** in Options › How much to show (your note 2026-11-04). Today only the chosen level's line shows; list all three short lines (Everything already says it has selling and Seller Mode).

Claude adds items here when they wait. Session 11 cleared the open ones.
- ✅ done v0.28.0 **Session 4:** a **"hide values"** eye button on Home (and the coin pages) that hides every dollar amount until tapped again, for showing the app at a coin show.
- ✅ done v0.28.0 **Session 4:** bar **weight in grams or kilos** as well as ounces (a unit dropdown; stored as ounces, so old bars don't change).
- ✅ done v0.28.0 **Session 4:** **roll end colors** on the shelf. Checked against bank-wrapper (ABA) colors: cents red, nickels blue, dimes green, quarters orange, **halves sand/brown (not yellow)**, dollars gray (Sacagawea too); Morgan and Peace rolls worn beige.
- ✅ done v0.28.0 **Home: collapsible sections below the shelf** (Melt Value by Metal, Recently added, Recently sold). Tap a heading to open or close it; the app remembers each one. Fits Session 4 (Home shelf).
- ✅ done v0.28.0 **Wooden box look.** Add "Wooden box" to the box Look choices (storage and display). On the shelf, a wooden display box gets a solid wood case (today every display box is drawn as a wood-framed glass case). Fits Session 4.
- ✅ done v0.29.0 **Session 5: ask before auto-filling a box spot.** When a box with numbered spots is picked, ask "Choose the spot yourself?" Yes: nothing filled in, you pick the real spot. No: the next free spot is filled in as today. Works for single coins now and for the add-many idea (IDEAS 12) later.
- ✅ done v0.31.1 **Session 11: albums by date.** A **"Sort by date"** button where albums are reordered. Series stay together; each series (or single album) is placed by its first coin type's first year (e.g. Morgan 1878 before Lincoln 1909; Washington 1932, Franklin 1948, Kennedy 1964). You can still move any album after.
- ✅ done v0.31.1 **Session 11: Notes above Purchase** on a coin's page.
- ✅ done v0.31.1 **Session 11: proof with no value.** A 1962 Franklin proof showed blank (melt used). The Red Book table starts at PR-63, so a proof with no grade or below PR-63 gets nothing. Show the lowest listed proof value marked "at least" (like the circulated "below" case), or a short note "Red Book starts at PR-63"; check the no-grade case too.
- ✅ done v0.31.1 **Session 11: smaller Home chips.** My collection, Inherited, My Silver Stack become thin pills in **one row you swipe left/right**; turned-off ones look gray. Must still be easy to spot.


**Starting a new chat** (fast version, no whole-plan read, no test run): paste *"Open my repo waddelljmw/CoinShelfTest. Read CLAUDE.md. From PLAN.md read only the "Next session starts here" line and the "This week" box, not the whole file. Do a quick check with no test run: last PR merged, checklist ticked, Fix list empty. (Bug reports are not checked while he is the only user; he will say when to start again.) Fix any gap. Tell me which model the next session needs and which model you are (if they differ, tell me to switch and stop). Then say in 1–2 lines what the session will do and wait for my go. Never merge a PR marked "merge waits" or with red or unfinished GitHub tests."*

## After Phase 8 (session 17, Sonnet; kept here so the Fix list stays empty for the start check)
- [x] ✅ All items below built in v0.36.0 (branch `session-17-tidy`, test `tests/session17.js`). Options sections start folded; "Don't ask before For sale" and the junk silver switch are in Options.
- **Hide values keeps melt prices.** The eye button should not hide current spot/melt prices (they aren't your coin values).
- **Options tidy.** Put Options in collapsible sections that look cleaner; make **Red Book values** its own collapsible section.
- **More Home toggles.** Turn on and off more Home sections: Recently added, Recently sold, value over time, melt value (as well as melt and sale info today).
- **Junk silver in My Silver Stack by default** for new coins, with a switch in Options. Stored coins don't change.
- **For sale button** on a coin's page, with an "Are you sure?" that has a "Don't ask again" box.
- **Purchase details** on Add coin move below Grade and above Quantity / Value / Melt.
- **Paid with fills itself:** eBay, Whatnot or another online platform gives Credit card; Coin show gives Cash. Still editable.
- **Franklin FBL fallback (bug):** when the Red Book has no Full Bell Lines price for the grade (or the grade is below MS-63), use the regular Red Book price before melt.
- **Sold results and Value over time** collapse on Home like the other sections.
- **Incomplete mark:** a tiny corner mark on coins missing a grade or cost, plus a My Coins filter "Missing grade or cost".
- **Want list check:** adding a coin through normal Add coin that matches a want asks "This is on your want list. Remove it?" (today only "Got it" from the want list removes it).

## Step 9.0: Main menu rework (IDEAS 7). Planned session 18 (Opus); build session 19 (Sonnet)
Only moves and renames menu buttons. No saved data changes, no page addresses change (`#home`, `#albums` etc. stay, so bookmarks and old links keep working).

**New menu, top to bottom** (indented = sits just under its group, slightly smaller, still one tap):
- **My Cabinet** (today's Home)
- **My Coins**
  - My Albums
  - Storage
- **Want List**
- **My Stacks**
- **Coin Value**
  - Insurance Report
- **PCGS Photograde**
- **My Business** (heading only, not a button; shown only when Seller Mode is on)
  - Shows
  - Sales Reports
- **Options** (stays last)

- [x] ✅ **9.1 Menu.** Rebuild `#menu` in `index.html` in that order. Group children get a class (e.g. `menu-sub`: indent, slightly smaller text). "My Business" is a small heading (`menu-head`), hidden with Shows/Reports when Seller Mode is off (reuse how `menuShows`/`menuReports` are hidden today). Highlighting: keep `menuKey` in app.js; album → My Albums, box → Storage, show → Shows (as today).
- [x] ✅ **9.2 Names match.** Page headings and back buttons use the new names: "Home" → "My Cabinet", "Albums" → "My Albums", "Stacks" → "My Stacks", "PCGS Photo Guide" → "PCGS Photograde" (grep `← Albums`, `Back to Albums`, `data-go="stacks">Stacks`, page `<h1>`s). Only words he sees; internal names stay.
- [x] ✅ **9.3 Check on phone width.** One screenshot of the open menu at phone size, Seller Mode on and off; the menu must scroll if it's taller than the screen.
- [x] ✅ **9.4 Test** `tests/menu.js`: order of items, Business group hidden/shown with Seller Mode, highlighting for album/box/show pages. Version: feature → middle number.

**Later, not now:** the feature audit (IDEAS 22) may hide or cut pages; that only means small menu edits.

## Step 9.1: Demo mode (IDEAS 8). Planned session 20 (Opus); build session 21 (Sonnet)
Your choices (2026-11-03): made-up coins only, simple drawn coin pictures, opened by a button **and** a link. The infographic is **not** in the app: it is for you to show people, made later (session 25) once the reviews and audit show the best features.
- [x] ✅ **Separate from real coins.** New `store.mode` `"demo"`: everything lives in memory only, never touches the phone's saved coins (IndexedDB) or the Claude account. No value-history saving, no backup reminder, Backup/Restore and Import hidden in demo. Banner on every page: "Demo: these aren't real coins. **Exit demo**". Exit reloads the app normally.
- [x] ✅ **Opening it.** "Try the demo" button on the first-open screen and in Options; link `https://waddelljmw.github.io/CoinShelfTest/?demo`. The demo file loads only when the demo opens (keeps the normal app small, idea 26), but is in `FILES` in sw.js so it works offline at a show.
- [x] ✅ **Sample collection** in new `catalog/demo.js` (under ~150 KB): ~25 single coins across many types (must include a **1910 Indian Head $2.50 gold** coin, `indian-2-5`), a few rolls, 1 oz and 10 oz silver bars, a "black box" storage box of ~25 wheat cents in 2x2 flips, 2 partly filled albums: Lincoln cents (lightly filled), and a **Morgan dollar album about 85% full** (real album layout from `ALBUM_DB`; the empty spots are mostly the rare, expensive dates, like a real collection), one want list, a few sold coins, one Seller Mode show with business stock, and ~12 months of value history. About **100–120 coins in all**: enough to fill every page, not so many a friend gets lost. Build it from short lists the app turns into coins. Only real dates and mints from `EXACT_SLOTS`; values come from the app's Red Book data (none typed into the demo). Nothing from your backup.
- [x] ✅ **Drawn coin pictures.** One small function draws a coin (metal color, size, denomination and year on it), so no picture files. Never a copy of a real coin design.
- [x] ✅ **Photo fill showcase** (still locked in the real app). One demo coin marked "Filled in from photos". On Add coin in demo, a "See photo fill in action" button fills the form one field at a time from two drawn photos, labeled **Example**. No API key, no outside service.
- [x] ✅ **Tests** (`tests/demo.js`): demo opens from the button and from `?demo`; adding/deleting a coin in demo leaves the real saved coins unchanged after Exit; every demo coin passes `yearProblem`; demo.js stays under the size limit.
- [x] ✅ Version: feature (middle number), v0.38.0.

## Step 9.2: Feature audit and review changes (IDEAS 22). Planned session 23 (Opus); build sessions 24 and 24b (Sonnet)
From the three test-user reviews (`reviews/`) and your audit choices (2026-11-03). Nothing here changes saved coin data.

**Audit result.** Always visible: My Cabinet, My Coins (+ Add coin), My Albums, Storage, Want List, Coin Value, Hide values, Options. Tucked away: Red Book table (moves to Coin Value), My Stacks (menu shows it only once you own a bar, round, roll or junk-silver stack coin), Seller pages (already hidden until Seller Mode), locked photo fill (one small line). Cut: nothing.

**Found, not a bug:** "no Red Book value" for most coins is because only 5 types have Red Book data so far (Morgan, Peace, Franklin, Washington silver and clad). Filling the rest is the parked "With your Red Book" row. Coin ID changing: already fixed v0.38.3.

### Session 24 (Sonnet): honest values + Add coin + Options
- [x] ✅ **Metal price prompt (IDEAS 27).** On saving the first silver/gold coin with no price for that metal, a pop-up: "Get live prices" or type it in (works offline). Until a price exists, coin values say "face value, no silver price yet", not cents.
- [x] ✅ **Price status line on Home** (your worry, 2026-11-03: will people know to refresh, or to type prices when they don't fill in?). Today the automatic fetch fails silently. Under the shelf, one line with a button, three states: **fresh** "Silver $32.10 · updated 2:14 PM ↻" (tap ↻ refreshes right there); **old** (over a day) amber "Prices are 3 days old · Refresh"; **failed or none** "Couldn't get live prices (no internet?) · Type them in" (opens Spot prices, unfolded). The same line sits at the top of the Insurance Report pop-up. Keeps the "Prices updated" date you like.
- [x] ✅ **Low-total warning.** Home and the Insurance Report show "Totals are low: add a silver (gold) price" with a button, whenever an owned coin's metal has no price.
- [x] ✅ **No Red Book value (IDEAS 29).** Coin page says "No Red Book value for this date and grade" (or "Add a grade to get a value" when ungraded) instead of quietly showing face value. Reuse `bookLookup`; no values typed in.
- [x] ✅ **Add another (IDEAS 28).** Saved coin page gets an "Add another" button: fresh Add coin form, same coin type picked.
- [x] ✅ **Source chips after Grade.** A "Where from" chip row using today's `sourceOptions()` values (Inherited first, then the most used, "More…" opens the full list incl. Other), so saved coins don't change. Purchase details stays folded for the rest. Inherited coins stay locked from For sale (as now).
- [x] ✅ **Photo fill note** shrinks to one small line under the form title while locked.
- [x] ✅ **New album form:** brand and album number first, coin-type list after.
- [x] ✅ **Options in 5 groups** (each folds like today): Prices and values (spot prices, selling/pricing, photo fill) · Look of Home (shelf style, Home shelf, Show on Home) · Adding coins · Your data (backup, spreadsheet, snapshot, recently deleted) · Share and help (share app, demo, report a problem). Seller Mode stays its own group. Old saved open/closed choices just reset.
- [x] ✅ **Tuck away:** Red Book table moves from Options to the bottom of Coin Value; My Stacks menu item hidden until a stack-type coin exists (page address `#stacks` keeps working).
- [x] ✅ Tests (`tests/audit.js`): price prompt appears once; warning shows/hides; Source chips save the same value as the old list; Options group order; Stacks hidden/shown. Version: feature (middle number). Screenshots: Add coin and Options at phone width.

### Session 24b (Sonnet): seller fixes (review 3)
- [x] ✅ **Sold form:** when a show is picked, date defaults to the show's first day (today if it's running); warn on a future date; show Paid with, fees and sales tax up front; remember the last payment method.
- [x] ✅ Home Sold results labelled **"before show costs"**.
- [x] ✅ **Dealer case defaults** 2 rows of 6; plain error ("Add a name, and how many rows and spots").
- [x] ✅ **Select** closes after Move to…; case page lists coins in slot order.
- [x] ✅ **Set asking price for all** on a case page (Red Book × your % or Melt + your %, only coins with no price, Undo offered).
- [x] ✅ **Printable price list** for the For Sale list (one page: ID, coin, grade, asking price; print or share as text).
- [x] ✅ Show page **break-even line**: "Sell $X more to cover show costs".
- [x] ✅ Tests + version: feature (middle number).

## Step 9.3: From your use notes (2026-11-03). Planned session 26 (Opus)
Goal: fewer taps when entering, nothing lost, and the app tells you what still needs filling in.

### 9.3a (session 27, Sonnet): faster entry
- [x] ✅ **Save button always on screen** on Add/Edit coin (sticks to the bottom), no scrolling up.
- [x] ✅ **Back goes where you came from:** album → coin → (edit/delete) → back lands on the album, not My Coins. Same for boxes and want lists.
- [x] ✅ **Add album cleanup:** brand + album number first (exists), then a **searchable coin-type box** (type "fra" → Franklin), then Name, pre-filled in gray from the type/album and only saved as typed if you change it. Count taps before and after; cut any extra step.
- [x] ✅ **Album "Inherited" switch** on new/edit album (coins added from its spots default to Inherited).
- [x] ✅ **What's new:** after an update with new features, a small one-time pop-up with 2–4 plain lines (list kept in the code per version; fixes-only updates show nothing). Also in Options › Share and help.
- [x] ✅ Tests + version (feature).

### 9.3b (session 28, Sonnet): complete profile + inheritances
- [x] ✅ **Complete = grade + (cost, or inherit date for inherited coins).** Bars/rounds/rolls need cost only. Replaces today's incomplete rule.
- [x] ✅ **Needs info list, hard to miss:** an amber line right under the Home totals, "12 coins need info, totals may be off ›", opening My Coins filtered to incomplete; each row says what's missing; a coin drops off once filled. Goes away when all are complete.
- [x] ✅ **Totals marked:** while any coin needs info, Collection value and the Insurance Report show "estimate*" with the same note.
- [x] ✅ **Coin page banner:** an incomplete coin shows "Missing: grade" (etc.) at the top with a Fill in button; the row mark in My Coins and album spots gets bigger and amber.
- [x] ✅ **Inheritances:** Options holds a list; one is the default (from whom, date, e.g. "Mother-in-law, 2023"). Choosing Source = Inherited fills the default; a picker switches to another; "+ New inheritance" for exceptions. **Earlier owners:** each inheritance can list who had it before and when (e.g. her grandmother, 1974), shown on the coin page as its history.
- [x] ✅ **Value when inherited** (optional, per coin or per inheritance) for tax records. Inherited coins stay locked from selling.
- [x] ✅ **Mark many as inherited:** Select › "Mark inherited" (pick the inheritance). Fixes the coins you missed.
- [x] ✅ **Original to album:** a check on coins in an inherited album; coins added later aren't original. Shown on the album spot.
- [x] ✅ Old coins: Inherited with no inheritance shows "Inherited (who/when not set)"; nothing rewritten until you edit. Tests + version.

### 9.3c (session 29, Sonnet): want lists
- [x] ✅ **One want, many lists:** a want can belong to several lists/albums, each with its own grade ("any grade" or "upgrade above MS-63"). A small **"wanted ×2"** tag on album spots, the want list and the coin page; tap shows which albums.
- [x] ✅ Old wants convert on read (one list each); a second matching want for the same coin is merged only when you add to it.
- [x] ✅ **Missing from album:** album page button "Add missing to a want list": suggests an existing list for that type, otherwise a new one named "Franklin Half – Missing from [album name]".
- [x] ✅ **Upgrade:** on a filled spot, "Want an upgrade" adds it with a grade above the current one.
- [x] ✅ **Album wish list:** albums you want to buy (brand, number, name), a section on the Want List page.
- [x] ✅ Tests + version.

### 9.3d (session 30, Sonnet): asking price + tax records (Seller Mode)
- [x] ✅ **Asking price** shows three numbers: Red Book × your %, melt + your %, and **your cost + your minimum markup %**. Suggested = the higher of the first two, **never below cost + minimum markup**. Inherited: uses value when inherited as cost if set.
- [x] ✅ **Tax records:** a year-end sales export (date bought, date sold, cost incl. fees, sale price, fees, gain, held over 1 year yes/no, inherited yes/no). Plain note: "Records for your tax preparer, not tax advice." (Coins are collectibles; your preparer decides the rates.)
- [x] ✅ Tests + version.

### Decided not now
- **Value over time using past metal prices:** needs an outside price history and is confusing; stays with IDEAS 32.

## Step 9.4: New-user help + change many at once (IDEAS 3, 25, 31). Planned session 32 (Opus)
Your choices (2026-11-04): Simple mode starts with **3 levels**; the guided first coin uses the person's **real first coin**; change-many sets **date acquired, where/from whom, price paid each**.

### 9.4a (session 33, Sonnet): change many coins at once
- [x] ✅ **Select inside an album** (and box pages): a Select button like My Coins, tap spots that have coins, same select bar (Move, Set holder, Mark inherited, the new Set purchase info). Select all · Clear at top and bottom.
- [x] ✅ **Set purchase info…** in the select bar: one sheet with **Date acquired**, **Where / from whom** (same Source and seller choices as Add coin, including Coin show and its name), **Price paid each** or **Split a total evenly** (shows the each-price before saving). Only fields you fill are changed; blank fields leave each coin as it is. Says "Changes 14 coins" before saving.
- [x] ✅ Inherited coins skip price/source (listed, like Mark inherited). Sold coins aren't selectable here.
- [x] ✅ **One Undo puts every coin back.** Needs-info list updates (coins with a cost now drop off).
- [x] ✅ Tests: set date/source/price on 3 coins, blanks untouched, Undo restores all, inherited skipped. Version (feature).

### 9.4b (session 34, Sonnet): first open, guided first coin, plain words
- [x] ✅ **First open** (no coins yet, phone app): a welcome card with two big buttons: **Start my collection** and **Try with sample coins** (today's demo). The small "New here?" card becomes this. Shown until the first coin is saved; Options › Share and help keeps both.
- [x] ✅ **Guided first coin (optional):** Start my collection asks "Show me how (1 minute)" or "Skip". The guide is a few small bubbles over the real Add coin form: pick the type → year/mint → grade → cost → Save. Then it shows the coin page (what Missing means, how Fill in works) and ends by showing **where the coin is kept** (album spot, box or My Coins). Skip / Next on every bubble; never blocks typing. Can be replayed from Options.
- [x] ✅ **Plain-words help:** a small ⓘ after hard words (Melt value, Spot price, Red Book, Raw/Slab, Kept in, Seller Mode, Snapshot, Details coin). Tap shows one line in plain words. One list in the code so words are added in one place. Only shown where the word first appears on a page.
- [x] ✅ Tests (welcome shows only with no coins; guide can be skipped and replayed; every ⓘ word has a meaning). Version (feature).

### 9.4c (session 35, Sonnet): Simple mode
- [x] ✅ **Three levels**, picked on the welcome card after "Start my collection" (or later in Options › first group, one tap to switch, clearly named):
  - **Simple:** add coins, bars and rounds; Home, My Coins, Coin Value. Short Add coin form (type, year/mint, grade, cost, notes; "More details" for the rest).
  - **Collector:** Simple + albums, boxes, want lists, inheritances, Insurance Report, Value over time.
  - **Everything:** today's app, including selling and Seller Mode.
- [x] ✅ Hiding is **only what's shown**: no saved data changes; a coin with album/selling info still shows it on its page. Switching levels never loses anything.
- [x] ✅ **You and current users:** an existing collection starts on Everything (nothing disappears after the update).
- [x] ✅ Tests (each level's menu; switching keeps every coin and field). Version (feature).

### Not now
- Your 6-level idea (Builder, audiences) waits until people use the 3 levels; IDEAS 25 keeps it.
- Running sessions automatically with helpers: decided to keep today's workflow (cheaper).

## Step 9.5: Your own catalog numbers (bug #123). Planned session 38 (Opus); build session 39 (Sonnet); review session 40 (Opus)
Why: sellers and collectors often already have numbers written on their flips, or another program that numbers coins. The app must take their numbers, or count up in their style, without a "pattern builder" (too complicated, rarely needed).

### 9.5 (session 39, Sonnet)
- [x] ✅ **Coin ID style** in Options (one choice, plain words, default = today):
  1. **App's codes** (MD-012), as today.
  2. **My own codes:** a list of the type codes where each can be renamed (MD → MOR) and given a starting number. Codes: 1–6 letters/numbers.
  3. **One running number:** optional start text (e.g. "JW-") + starting number (e.g. 1050); counts up for every item, any type. Digits padded to match the start (0007 stays 4 digits).
  4. **Off:** no automatic IDs; type your own or leave blank. My Coins and the coin page say "No ID" quietly (no nagging).
- [x] ✅ **Any label can be typed** on a coin (today only MD-012 shapes are accepted, so "A17" or "Box 3 #17" is refused). Still refuse duplicates (ignore case and extra spaces) and say which coin has it. If a typed label fits the current style, the counter moves past it so it's never handed out again.
- [x] ✅ **Changing the style only affects new coins.** Existing IDs stay as they are. Never reuse a number (today's rule).
- [x] ✅ **"Renumber my coins"** button under the style (the user's choice, not automatic): asks first, suggests a Backup, then renumbers owned coins in the order they were added. Each coin keeps its **old ID** (shown small on the coin page, found by My Coins search) so labels already written on flips still find the coin. **Undo** right after. Sold/gone coins keep their IDs (sale records match).
- [x] ✅ **CSV import takes the ID column** (today it's export-only), so numbers from another program come in. Duplicates in the file: keep the first, report the rest. Backup restore already keeps IDs.
- [x] ✅ **Cleaner spreadsheet export** (your note 2026-11-04: too much scrolling right). Today roll, bar and box columns come before Year and Grade. Put the everyday columns first (ID, Label, Year, Mint, Coin type, Grade, Qty, Paid, Value, Kept in, Status), then the rest; **leave out columns that are empty for every coin**. Import still matches columns by heading, so old and new files both import. No saved data changes.
- [x] ✅ Add coin / add many: shows the next ID it will use (or nothing when Off); with Off, an optional ID field on Add coin for the flip label.
- [x] ✅ Old data: coins without a style setting = App's codes (convert on read). Demo mode unchanged.
- [x] ✅ Tests (each style, typed labels, duplicates, renumber + old ID search + Undo, CSV import IDs, old backup restores). Version (feature).

### Session 40 (Opus): short review
- [x] ✅ v0.49.2 One adversarial review of 9.5 (renumbering changes saved coins): restore an old backup, renumber, Undo, CSV import with clashing IDs, add many coins in each style. Fix what it finds. An AI test-user run as **(g) a seller with labeled flips** (IDEAS 13) only if budget allows.

### Not now
- A "build your own pattern" tool (year, mint, box codes in the ID). Add only if real users ask.
- Other ways people bring their own system (checked, already covered): own storage places (Kept in, boxes), own album brands, CSV import of coins, own asking prices.

## Step 9.6: Fill a full album, Add coin order, trays in a box, albums kept in a box (IDEAS 23, 33, 19). Planned session 41 (Opus)
Why: a real album full of coins takes too long one coin at a time; your wooden box has pullout trays with different layouts; some albums sit in cardboard boxes.

### 9.6a (session 42, Sonnet): fill a full album + Add coin order
- [x] ✅ **New album asks "Empty, or already has coins?"** If it has coins: a scrollable **quick list**, one row per spot, every row **ticked "have it"**; untick the empty holes. Each ticked row has a grade dropdown.
- [x] ✅ **Price on the quick list, your choice:** a switch between **one total for the album, split across the coins** (to the cent, leftover on the first, like add many) or **a price on each row** (**default: price on each row**, your choice 2026-11-04). Date acquired and source asked once for the whole album.
- [x] ✅ Saving makes one coin per ticked spot (own ID, in its album spot). Unticked spots stay empty (they already show on want lists). Undo removes the whole batch. Also offered on an existing album's page for its empty spots ("Fill spots").
- [x] ✅ **Add coin order (nothing removed):** 1) What is it, type, year, mint 2) Grade 3) Price paid, date, where you got it 4) Where it's kept 5) **Notes** in its own small fold, one tap, right here (you use it often; opens already when the coin has notes) 6) **More details** fold: variety, ID label, status, receipt and the rest. Needs info keeps catching empty important fields.
- [x] ✅ Simple mode: quick list shows at every level; More details stays hidden where the level hides it today.
- [x] ✅ Tests (quick list, untick, split vs. per row, Undo, Fill spots, form order). Version (feature).

### 9.6b (session 43, Sonnet): trays in a box + albums kept in a box. **Changes how boxes are saved: Opus review (session 44) before merge.**
- [x] ✅ **Trays:** a storage box can have trays. Making a box: "How many trays?" (default 1). Each new tray **copies the layout of the tray above** (rows/columns and slots), with a "Change" button for odd ones (your bottom two). Called **trays**.
- [x] ✅ A coin's spot becomes tray + row + slot (new `boxTray`). The box page shows one tray at a time with tray tabs; spot pickers, add many, filters and "next free spot" include the tray.
- [x] ✅ **Old data:** a box without trays reads as one tray with its old layout; a coin without `boxTray` is in tray 1 (convert on read). Backup/restore and CSV carry the tray.
- [x] ✅ **Album kept in a box:** "Kept in" on New/Edit album: pick a box or type a place ("safe, top shelf"). Just "in this box", no spot number. Shown on the album page and listed on the box page. **The album still shows on the Home shelf** as now.
- [x] ✅ Tests (trays, copied layout, old boxes and old backups, album in box still on shelf). Version (feature).

### Session 44 (Opus): review of 9.6b
- [x] ✅ One adversarial review: old boxes and backups, moving coins between trays, shrinking a tray with coins in it, add many into trays, album in a box that is deleted. Fix what it finds, then merge (ask you first).

## Step 9.7: Fixes from the six test-user reviews + your notes (2026-11-05). Planned session 45 (Opus)
Why: the reviews found no crashes or lost coins, but a refund erases money you already spent and "Paid each" can give the wrong cost. Your notes add small clean-ups and a pocket album. **Weekly rhythm:** one or two of these sessions per week; stop building at about 70% weekly usage.

### 9.7a (session 46, Sonnet): money fixes + your small notes. **Refund changes how a sale is saved: Opus review (session 47) before merge.**
- [x] ✅ **Refund / cancel that keeps the record** (review 6 #5): on a sold coin, "Refund or cancel" puts the coin back in stock (personal or Business, as before) and keeps the sale on record marked **Refunded**: the fee and shipping you paid still count as costs; the sale price no longer counts as a sale. Old sales read as not refunded (convert on read). "Move back to collection" stays for real mistakes.
- [x] ✅ **"Paid for the whole lot"** (review 6 #6): when Quantity is more than 1, a switch **Price is: each / for the whole lot**, and a live line "Total: $24.50 for 20". Saved as price each, the way it is now (no change to saved data).
- [x] ✅ **Bulk asking price follows the coin's own rule** (review 5 #1): add "Suggested (never below cost + 10%)" to "Set asking price for all", and offer it from Select on any Business coins, not just a dealer case.
- [x] ✅ **"Paid with" doesn't carry over** between sales, except within the same show (review 5 #4). Edit sale refills eBay fees when the price changes (review 5 #5).
- [x] ✅ **Check number:** when Paid with is Check, one optional "Check #" box. Nothing else (no cleared or bounced tracking).
- [x] ✅ **Black** added to the spine and box colors.
- [x] ✅ **Untick all** (and Tick all) at the top of the album quick list.
- [x] ✅ **Photograde, one link per screen:** next to Grade on the coin form, and one link at the top of the quick list (all one coin type). Not on every row.
- [x] ✅ **"+ Add storage"** at the end of every Kept in list: makes a new box or place, then brings you back to the form you were on, with what you typed kept and the new storage picked.
- [x] ✅ **Guide bubble:** fix the white text on a very light background and the hard-to-see button (first-open guide, works in a private window too).
- [ ] **Wording pass (partly done in session 46: the three old lines are fixed and the spellings of Whatnot, eBay, Photograde and Red Book checked; a full read of every screen is still open):** check capitals, spelling and grammar on every screen so it reads the same everywhere. Also the old lines from reviews 5 and 6: Seller Mode "later dealer cases, shows and reports", a sold coin still showing its old box slot, "Check eBay sold" on a Whatnot sale.
- [x] ✅ Tests (refund keeps fee, lot price, bulk price floor, Add storage round trip). Version (feature).

### Session 47 (Opus): short review of 9.7a
- [x] ✅ Review refunds: old sales, refund then sell again, reports and tax CSV after a refund, Undo. Fix, then merge (ask you first).

### 9.7b (session 48, Sonnet): sales and shows. **Orders change how sales are saved: Opus review (session 49) before merge.**
- [x] ✅ **One order, several coins** (reviews 5 and 6, top wish): Select → "Sell together": one buyer, one order number, one tracking number, one shipping charge, one flat fee (e.g. one 30¢ Whatnot fee), each coin keeps its own price. Each coin still shows as sold; reports count the order once for fees and shipping. A refund (9.7a) can be for one coin or the whole order.
- [x] ✅ **Profit numbers agree:** Home, the show page, Sales Reports and the tax CSV use the same words: **Sales** (coins only), **Shipping charged** shown apart, **Profit before show costs** and **Profit after show costs**. The show's "Sold here" list shows the coin price, with shipping on its own small line, in date order.
- [x] ✅ **CSV columns:** coins CSV gets Business / Personal and Show; sales CSV gets buyer, order and tracking. Business stays apart on My Stacks and Coin Value (review 5 #7).
- [x] ✅ **Stream costs by kind:** costs offered follow the kind of show: a coin show keeps Table fee, Gas, Hotel, Food, Other; a stream gets Supplies, Equipment, Subscriptions, Other. Supplies gets its own line on the Schedule C summary. Old "Other" amounts stay as they are.
- [x] ✅ **Attendee shows:** an **Entry fee** line (instead of Table fee). Shows can be turned on for attendees without Seller Mode (one switch in Options, off by default, so the menu stays clean).
- [x] ✅ **Bought at this show:** on Add coin, Where from → Coin show → pick the show; the date acquired fills in from the show day you pick. The show page lists **Bought here** and **Sold here**. Show costs are **not** spread into each coin's cost (keeps your costs clear).
- [x] ✅ **Usual shipping you charge** (Options → Selling), filled in on each sale, still changeable.
- [x] ✅ **Platform fees:** in Options → Selling, a "Fees last checked" date with a link to each site's fee page (the app can't read them for you).
- [x] ✅ Tests. Version (feature).

### Session 49 (Opus): short review of 9.7b
- [x] ✅ Review orders: old single sales, refunding one coin of an order, fees counted once, CSV and tax CSV totals. Fix, then merge (ask you first).

### 9.7c (session 50, Sonnet): heir fixes (review 4)
- [x] ✅ **Junk silver by face value:** "Junk silver (90%, 40%, 35%)" on Add coin; type the face value ("$20 of dimes") and the ounces are worked out. Uses the standard silver content per dollar of face value (looked up, not guessed).
- [x] ✅ **Cardboard box / pile:** numbered spots **off** by default for cardboard boxes, so no rows or slots are needed.
- [x] ✅ **Counts agree:** Home's "need info" count and the list it opens match; Coins vs My Coins counts are labeled so the difference is clear.
- [x] ✅ **"Can't grade these":** a choice on common circulated coins so they stop counting as needing info.
- [x] ✅ **Report:** pick the order (type, year, value, where kept); show CAC and who/when inherited.
- [x] ✅ Hide Cost and Gain on Home when everything is inherited; a plain "I'd like to sell this one eventually" on an inherited coin.
- [x] ✅ Single-coin Delete asks "Are you sure?" (Undo stays).
- [x] ✅ Tests. Version (feature).

### 9.7d (session 51, Sonnet): pocket album. **New kind of album: Opus review (session 52) before merge.**
- [x] ✅ **New album → "Pocket album (flips or capsules)":** asks pages, pockets across and pockets down (yours: 2 across, 3 down). **Any coin can go in any pocket** (no date list), coins keep their holder (flip, capsule, slab).
- [x] ✅ Built on the box tray code (pages work like trays), so it's cheap and well tested. The album page shows one page at a time with page tabs; spot pickers and "next free pocket" work the same.
- [x] ✅ Shows on the Home shelf like other albums; has Kept in and spine color (black included). No "missing" or want-list spots, since it has no set list.
- [x] ✅ **Old albums unchanged** (they read as hole albums). Backup, restore and CSV carry the page and pocket.
- [x] ✅ Tests. Version (feature).
- Built as a box of type `pocket` (`pockets.js`): pages = trays, rows = pockets down, perRow = across, up to 40 pages. Shows in Albums list, Home shelf spines and Kept-in lists; hidden from the Storage page. Test `tests/pocket97d.js`.

### Session 52 (Opus): short review of 9.7d
- [x] ✅ Review pocket albums: old albums and backups, moving a coin between a pocket album and a box, shrinking pages with coins in them, deleting the album. Fix, then merge (ask you first).

### Not now (from the reviews; add only if you ask)
- Buyer receipt or invoice, to-ship list, stream run sheet, payout match-up, buyer list, giveaways, auction vs buy-it-now, trades, layaway and consignment, mileage rate, stock age.
- Spreading show costs into each coin's cost; check cleared or bounced tracking.
- **Red Book gaps:** still waits for your Red Book ("later" row).
- **Shelf:** don't pad it to look full (empty space shows real gaps). Slabs drawn differently from raw coins goes with the shelf look (IDEAS 4).

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

- [x] ✅ **0.1** Review leftovers (album years keep your spots, coins re-link after date edits, snapshot hides "Most I'd pay", melt message, New list sheet)
- [x] ✅ **0.2** Coin type is locked once saved, with "Wrong type? Re-add it"
- [x] ✅ **0.3** Date limits (no coins from the future; wants up to 5 years ahead)
- [x] ✅ **0.4** Safety review and fixes

**Added along the way (also done):**
- [x] ✅ Album name shows on a coin's page
- [x] ✅ Albums with several coin types (e.g. Washington silver + clad), and type-set albums
- [x] ✅ Proof spots in albums (None / S proofs only / All proofs)
- [x] ✅ Proof switch on coins, with proof-only mint marks (e.g. West Point W)
- [x] ✅ Every Lincoln cent type through 2026 (VDB, 1922-D, 1943 steel, 2009 designs) and modern Morgan and Peace dollars
- [x] ✅ Album lookup: type a brand and number and it fills in the album (74 albums from Whitman, Dansco, Littleton and H.E. Harris), with exact dates and designs for every coin series in it
- [x] ✅ Second safety review and fixes

---

## Phase 1: Make it an independent app (your priority 1)

**Step 1.0. Foundation. Model: Opus** — DONE ✅
*Say this:* "Do Step 1.0 of the plan."

- [x] ✅ **PLAN.md** (this file): the plan plus a checklist Claude ticks off.
- [x] ✅ **CLAUDE.md:** your working rules, read automatically by every new Claude session (short replies, model advice, test before publishing, merge and branch links).
- [x] ✅ **Tests saved in the repo:** all 42 tests now live in the `tests` folder, with one command to run them all (`node tests/run-all.js`). Any future session can check that nothing broke.
- [x] ✅ **Version number:** shown at the bottom of Options and raised with each merge, so you can tell which version your phone has.
- [x] ✅ **README** in plain words, for you and your partner.
- [x] ✅ **Coin catalog in its own folder** (`catalog/`): coin types and dates, Red Book prices, and the album list. The ancient-coins app can swap in its own catalog later.
- [x] ✅ Merged

**Step 1.1. Save on your phone, not in Claude. Model: Opus** — DONE ✅

- [x] ✅ **Storage:** when the app runs on its own, coins, photos, albums and lists are saved on the device, so it works with no internet.
- [x] ✅ **Backup and Restore** (Options): one file with everything, photos included. Restore adds a backup without deleting anything. Home reminds you if your last backup is over 30 days old.
- [x] ✅ **Moving your data:** in the Claude version, Options → Backup and restore saves the file you'll restore into the phone app in Step 1.2.
- [x] ✅ Merged
- *The "Update ready" banner and the backup reminder before big updates come with Step 1.2.*

**Step 1.2. Put it online and installable. Model: Sonnet.** — DONE ✅ (live at https://waddelljmw.github.io/CoinShelfTest/)

- [x] ✅ App icon, install files and offline copy (works with no internet).
- [x] ✅ "A new version is ready" bar with Update now, suggesting a backup first.
- [x] ✅ Files save as normal phone downloads.
- [x] ✅ Merged
- [x] ✅ GitHub Pages turned on (repo made public; coins stay on the phone)
- [x] ✅ Installed on your phone and coins restored from a backup

- **Hosting:** free hosting on GitHub Pages from your repo, at a web address like `waddelljmw.github.io/CoinShelfTest`.
- **Install:** "Add to Home screen" on Android installs it like a normal app: icon, full screen, works offline.
- **Updates:** after each merge the app updates itself the next time it's online, with an "Update ready, tap to refresh" banner. Your coins are never touched by updates.
- **Saving files:** reports, CSV and snapshots save as normal phone downloads.
- **Privacy:** the web address is public, but your coins are not. Each phone keeps its own data.

**Step 1.3. Sharing with your partner. Model: Sonnet.** — DONE ✅

- [x] ✅ Options → **Share the app** sends the app's link through the phone's Share menu. Your partner installs it and gets their own separate collection.
- [x] ✅ **Share a snapshot** opens the Share menu with the view-only file (Messages, email, Drive...).
- A shared, live collection would need an online account service. That's its own project, to decide later.

**Step 1.4. Review. Model: Opus.** — DONE ✅

- [x] ✅ Fixed: a photo on a coin you hadn't saved yet could be deleted if the app was open in another window.
- [x] ✅ Fixed: restoring a backup replaced your value history and settings; now they're combined.
- [x] ✅ Fixed: "Update now" could throw away a coin you were halfway through typing.
- Still open: snapshot photos show blank (your paused item, Phase 6). Very large backups (about 1,000+ photos) may get too big for one file; to handle when it matters.

---

## Phase 2: Track everything you own

**Step 2.1. How a coin is held. Model: Opus** (new data fields), then **Sonnet** for screens. — DONE ✅
- [x] ✅ Merged (v0.15.0)
- **Holder:** album, slab, hard case, capsule, mint box with COA, 2x2, flip, envelope, roll, loose, or other.
- **Slab extras:** a CAC sticker checkbox (green or gold) with a CAC badge on the coin.
- **COA:** a "COA included" checkbox, plus a note about the box and packaging.
- **Speed:** quick-add remembers your last holder and source.

**Step 2.2. Coin record upgrade. Model: Opus** (new data fields), then **Sonnet** for screens. — DONE ✅
- [x] ✅ Merged (v0.16.0), plus tracking number with a Track package link and Mark as received for coins on the way
*Why it comes first:* the steps after it (rolls, sets, the new form) are built on these fields. Deciding how data is stored before building screens means nothing has to be redone.
- **Status:** In collection, On the way (bought or won, not here yet), For sale, Sold, Gone (traded, gifted or lost; left out of totals). Plus an **Upgrade wanted** checkbox. Inherited coins can't be set to For sale. Coins you already have become "In collection" automatically.
- **Purchase details:** date, seller (fills in from past entries), where (show, eBay, Whatnot, shop, inherited), price, tax, shipping and fees, then a **total cost** worked out for you. Plus payment method, receipt number and a receipt photo.
- **Errors and problems:**
  - **Known varieties** (e.g. 1955 doubled die, 1922 no D), including the **Statehood quarter varieties** (e.g. 2004-D Wisconsin extra leaf). Each is checked against real sources or your Red Book pages, never guessed.
  - **Mint errors** picked from a list: off-center, clipped, double struck, broadstrike and others.
  - **Problems:** cleaned, scratched, holed, bent and others. These show as "Details" next to the grade and lower the value.
- **Catalog number** (PCGS or NGC), shown only for slabs and copied from the label. Phase 3 uses it to open that exact coin in the PCGS Photo Guide.

**Step 2.3. A cleaner Add coin page. Model: Sonnet.** — DONE ✅ (merged, v0.17.0). Done: "What is it?" (US coin, or medal/token/foreign); sets, rolls and bullion choices come with 2.4 and 2.7.
- [x] ✅ Merged
*Made for anyone, even people who aren't good with technology.*
- The page asks **"What is it?"** first (US coin, set, roll, medal or token, foreign, bullion) and only shows the fields that matter.
- Page one is just the basics: type, year, mint and grade.
- Everything else is in closed sections you tap to open: Holder, Purchase, Errors and problems, Photos, Notes.
- Sale details aren't on this page at all. They open from a **Mark as sold** button (see Phase 7).

**Step 2.4. Sets and rolls. Model: Sonnet.** — DONE ✅ (merged, v0.18.0; also single coins with no value, price or melt count at face value)
- [x] ✅ Merged
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
- [x] ✅ Merged
- Done: **Kind** (Commemorative, Medal, Token, Foreign coin, Other) so they group on Your Coins; **Used before** list so metal and weight are typed once; **grams + purity** helper that works out ounces.
- Commemoratives (like the 1993 James Madison), medals, casino tokens with a silver weight (like your .7 ozt tokens), and foreign coins.
- Type the metal and weight once, and melt is worked out automatically.

**Step 2.6. Groups you can include or leave out. Model: Sonnet.** — DONE ✅ (merged, v0.20.0)
- [x] ✅ Merged
- Done: optional **Group** on each coin (Inherited and My collection work themselves out); Home has on/off chips that update value, melt, cost and gain at once. Value history keeps the full total.
- Tag coins with a group, like *Inherited* (never for sale) or *My collection*.
- Turn each group on or off in your totals. Value and melt update right away.

**Step 2.7. My Silver Stack and other stacks. Model: Opus** (planning) — DONE ✅ (merged, v0.21.0)
*Say this (on Sonnet):* "Do Step 2.7 of the plan."
- [x] ✅ Planned (Nov 1, 2026). Your choices: Silver Eagles stay with your coins; junk silver coins can join a stack; stacks count in your total, because the total should match your whole real shelf.
- [x] ✅ Merged
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
- [x] ✅ Fixed: older spreadsheet columns ("Serial", "Weight oz", "Details") went to the wrong fields.
- [x] ✅ Fixed: spreadsheet export lost group, case name, gone reason and date, kind, box spot and carrier.
- [x] ✅ Fixed: import skipped bars and rolls as "duplicates" of different items.
- [x] ✅ Fixed: a coin brought back (Undo, Restore, Move back) could share a box spot with another coin; now it leaves the box and says so.

---

## Phase 3: Research links. Model: Sonnet. — PARTLY DONE (v0.23.0)

- [x] ✅ eBay sold links added to the Add coin form and the Coin Value page (the want list already had them).
- [x] ✅ PCGS Photo Guide link in Add coin names the picked coin type, but it only opens a search for now.
- [x] ✅ **Exact PCGS Photo Guide links.** Built (v0.23.1), awaiting merge. Added SLQe, ShieldNic, LibNic, Buffalo, Jefferson, Ike, SBA, SAC; Kennedy is 1964-present. Still without a link: Presidential dollars, Gold Eagles, other classic gold, Silver Eagles, commemoratives (they open the general page). Pattern: `https://www.pcgs.com/photograde#/<Code>/Grades`. Codes are PCGS's own and can't be guessed.
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
- [x] ✅ Picked: **two styles you can switch between** in Options → Shelf style: **Bookcase** (option A, wood with brass plaques) and **Safe** (option D, steel walls, bolts, dial and handle on a door bar, green display numbers).
- [x] ✅ Bookcase follows the phone's night mode: **only the page background around the bookcase** (and the top bar, chips) goes dark; the bookcase itself stays the same. Safe has no night version (it's already dark).
- Mockup to copy: `design/shelf-mockup.html` (open with `?v=A`, `?v=A&night=1`, `?v=D`). Shelves top to bottom: totals plaques + metal prices; albums (spines with title + years, green check when complete, series kept together in his order); stacks, My Coins, rolls; 2x2 boxes (filled/total) and sets. Sample numbers in it are made up.
- No door-opening animation.

*Say this (on Sonnet):* "Do Step 4.2 of the plan."
- **Top shelf:** total value, melt value and live metal prices, shown like plaques.
- **Middle shelves:** album spines for each album (generic designs, without copying brand logos), a stack of bars for My Silver Stack, a coin stack for My Coins, and boxes for your 2x2 boxes and sets.
- **Tapping** an item opens that section. The graphics are original drawings, so there are no copyright issues and the app stays fast.

**Step 4.2. Build it. Model: Sonnet.** Then you check it on your phone.
- [x] ✅ Built in PR #52 (branch `step-4.2-shelf-home`, v0.24.0, not merged yet): shelf Home in `shelf.js`, Bookcase/Safe switch in Options, test `tests/shelf.js`.
- [x] ✅ Merged (PR #52, then fixes in #53, v0.24.2)
- [x] ✅ **Full-shelf fix (done in v0.24.1, PR #52; was: do this next, on the same branch/PR #52):** now a full shelf scrolls sideways with no sign there's more. Change to: album spines wrap onto **up to 2 album shelves** (about 18 spines, each row with its own wooden board); if there are more, the last spot is a **"+N more"** spine that opens the Albums page. Boxes and sets row: **1 shelf**, then "+N more" opening 2x2 Storage Boxes. Stacks row: same idea if it overflows. Series stay together in his order. Add checks to `tests/shelf.js` (e.g. 30 albums → 2 shelves + "+N more"), take one screenshot, bump to v0.24.1 in the three places.

---

**Step 4.3. Holders, storage and display boxes. Model: Sonnet** (planned on Opus, Nov 2, 2026). Opus review (4.5) before merging, because it changes how boxes are saved.
*Session 1.*
- [x] ✅ Planned
- [x] ✅ Built (v0.25.0, branch `step-4.3-holders-storage`, PR open, **not merged** until the Opus review, session 2)
- [x] ✅ Merged (v0.25.2, Nov 2, 2026, after the Opus review)

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
- [x] ✅ Built (v0.27.0, branch `step-4.3b-filters`, new file `filters.js`; coin type and Show also stay as the chips and tabs above the list)
- [x] ✅ Merged (v0.27.0, Nov 2, 2026)
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
- [x] ✅ Built (v0.28.0, branch `step-4.4-arrange-shelf`, test `tests/step44.js`; also did the Session 4 Fix list items)
- [x] ✅ Merged (v0.28.0, Nov 2, 2026)
- **Shelves:** top totals (always first, can't move or hide), Albums, Stacks and coins, Storage boxes, Display boxes, Sets (sets get their own shelf).
- **Options → Home shelf:** each shelf has on/off, up/down arrows (no dragging, easier on a phone), and a pin choice: **None**, **Pin to top** (always right under the totals; several pinned shelves keep their order) or **Lock in place** (stays at its position number when others move).
- **Hide single items:** a "Show on Home shelf" switch on each album page and box page. Hidden shelves and items still count in your totals; only the drawing hides. A small "N hidden" note in Options with "Show all".
- **Saved in settings** as `shelfLayout`: `{ order, hidden, hiddenItems, pins }`. Missing or unknown entries fall back to the default order, so new shelves added later just appear.
- Tests: reorder, pin to top, lock in place while moving another, hidden album still in totals, old settings without `shelfLayout`. Version: middle number up.

**Step 4.5. Review. Model: Opus.** Before 4.3 merges (it reshapes saved boxes), then a short look at 4.4.
*Say this (on Opus):* "Do Step 4.5 of the plan."
- [x] ✅ Review of 4.3 done (Nov 2, 2026)
- [x] ✅ Box columns added (v0.26.0, Nov 2, 2026): Edit box → "Spots run in" Rows or Columns
- [x] ✅ Short look at 4.4 (session 8: odd old shelf settings cause no errors)

**Step 4.6. Add many identical coins at once (IDEAS 12). Model: Sonnet. Planned on Opus (session 6).**
- [x] ✅ Built (v0.31.0, branch `step-4.6-add-many`, file `many.js`, test `tests/many46.js`). Tax, shipping and fees are split across the coins the same way as a group price. Quantity stays 1 on each coin. Not offered when an album is picked.
- [x] ✅ Merged (v0.31.0, Nov 2, 2026, PR #72)
- On Add coin, a **How many?** box (default 1, up to 100). Everything you fill in (type, year, mint, grade, holder, notes) is copied to each coin. **Each saves as its own coin with its own ID** (e.g. MD-013 to MD-024).
- **Price:** each time you choose **per coin** or **total for the group** (split evenly; any leftover cent goes on the first coin).
- **Photos:** one photo shared by all. You can change any single coin's photo later. Deleting one coin must **never** delete a photo another coin still uses.
- **Placing in a box:** pick the box once; its spot grid opens. **Tap spots in order**: each tap places the next coin, a tap on a placed coin takes it back out. A **Fill the rest for me** button puts the rest in the next free spots. Not offered for albums (each album spot is a different date).
- **One Undo** removes the whole group.

## Phase 5: Features that need an outside service. Model: Sonnet.

- **Photo fill** (reading a coin from a photo) needs an AI service. **Decided (session 6): off for now, with a place ready for it.** In the phone app the "Fill in from photos" button shows **grayed out with a 🔒 and "Coming soon"**. Options gets a closed **Photo fill (API key)** spot, also marked Coming soon, so once you have a key it can be switched on without redesigning. Later option: a free Google Gemini key could work here too (decide then). Costs a few cents per coin when on; explained step by step then. Built with Step 7.2 (session 7), since it's small. It's featured in the demo (IDEAS 8) and the AI test-user review (IDEAS 13).
- **Live metal prices:** fetched from a free price source when you're online, with the last prices kept for offline use. You can still type them in. Add: refresh the prices automatically each time the app is opened (when online), plus a button to fetch them on demand. Show when they were last updated.

---

## Phase 6: Paused item: snapshot photos. Model: Sonnet.

*You asked to pause this.*
- **The problem:** coin photos show blank inside a shared snapshot file.
- **The fix:** store the photos in the file itself.
- **Why it waits:** Phase 1 changes how photos are stored, so it comes after.

---

## Phase 7: Basic selling (part of priority 1). Model: Sonnet.

*Planned in session 6 (Opus). The app already has: a For sale status, and **Mark as sold** with date, price, shipping, insurance, where, buyer, and sold results on Home.*

**Step 7.0. Coin ID numbers (IDEAS 10). Built first in session 7, checked by the session 8 Opus review before merge.**
- [x] ✅ Merged (v0.30.0, Nov 2, 2026, after the session 8 review)
- Every item gets an ID you can write on its flip: a **type code + number**, e.g. **MD-012** (Morgan dollar #12). Numbers count up separately for each type (MD-001, MD-002…; PD-001 for Peace dollars). 3 digits, growing to 4 if a type passes 999.
- Codes come from a short list in `catalog/idcodes.js` (one per coin type; also bars, rounds, sets, rolls, medals/tokens, foreign). Look up the type names already in the catalog; don't invent new types. Show him the code list in the PR so he can change any code.
- **Existing coins all get IDs now**, in the order they were added. Done on read, so old backups still restore and get numbered too.
- An ID is **never reused**, even after a coin is sold, gone or deleted. A coin's type never changes, so its code never changes.
- **You can edit an ID.** The app refuses a duplicate and says which coin already has it.
- **Shown:** on the coin page (near the label), in My Coins search (type "MD-012"), in CSV export, Backup and the insurance report, and on the sale record when sold.

**Step 7.1. For sale and asking price.**
- [x] ✅ Merged (v0.30.0, Nov 2, 2026, after the session 8 review)
- An **Asking price** field shows when status is For sale (inherited coins still can't be For sale).
- A **For Sale list**: one tap from Home (and the For sale filter on My Coins) showing each coin, its asking price, what you paid, and the profit if it sells at that price.
- The asking price fills in "Sold for" when you tap Mark as sold (you can change it).

**Step 7.2. A fuller Mark as sold form.**
- [x] ✅ Merged (v0.30.0, Nov 2, 2026, after the session 8 review)
- Always shown: how many (for rolls/quantities), date, **sold for**, where.
- **More details** (closed until tapped): shipping you charged the buyer, shipping you paid (label), insurance, **platform fees**, sales tax collected, payment method (same list as buying), buyer, order number, tracking number (with the Track package link).
- **Where sold** choices: Whatnot, eBay, eBay Live, Coin show, **Coin shop**, **Private sale**, **Facebook / social**, **Auction house**, **Pawn shop**, Other. Old sales keep their saved "where" (convert on read).
- **Fees fill in as an estimate** for Whatnot, eBay and eBay Live; you can change the number to match your receipt. The rates live in **Options → Selling → Fee rates** so you can edit them when platforms change prices. Before building, check Whatnot's and eBay's own fee pages for the coin category (sources disagree: Whatnot coins may be 4% or 8%, plus 2.9% + 30¢ processing). Never auto-change a fee you typed.
- Sales tax collected is **not** profit (it's passed to the state); shown but left out of profit.

**Step 7.3. Profit.**
- [x] ✅ Merged (v0.30.0, Nov 2, 2026, after the session 8 review)
- Worked out as you type in the form: **sold for + shipping charged − what you paid (total cost) − fees − shipping paid − insurance**.
- Shown on the sold coin's page and in Sold results on Home (total profit and margin %). Inherited coins stay out of sold results, as today.
- Selling part of a roll or quantity splits the cost the same way the coin is split today.
- Sold details go into CSV export and Backup.
- *Stored data:* new fields only added to `sold` (old sales keep working with blanks). Review in session 8 checks this.

Ideas for status, purchase and sale details came from OpenNumismat (ideas only, no code copied).

---

## Phase 8: Seller Mode (priority 2)

**Step 8.0. Plan it together. Model: Opus.**
- [x] ✅ Planned (session 10, Nov 2, 2026). Your choices are below.
- **A note on taxes:** Claude isn't a tax advisor. The app organizes your records; a tax professional should review them before you file.

**Step 8.1. Seller Mode switch, Business stock, business profile. Model: Sonnet.** (session 12)
- [x] ✅ Merged (v0.32.0, Nov 2, 2026, PR #76; file `seller.js`, test `tests/seller81.js`)
- **Options → Seller Mode** on/off. Off: nothing about selling business shows (Business stock, dealer cases, shows, reports hide; data is kept, never deleted).
- **Business stock tag:** every item is Personal (default) or Business (`biz: true`; missing = Personal, convert on read). Add coin gets a Personal/Business choice when Seller Mode is on; Add many (4.6) copies it to each coin.
- **Separate totals:** Business stock never counts in your collection value. Home shows a small Business plaque (stock value, cost, count) only when Seller Mode is on. My Coins filter gets Personal/Business.
- **Move to Business:** a personal coin keeps **what you paid** as its cost. Inherited coins can't be moved to Business. One Undo; Select-many (4.3b) gets "Move to Business".
- **Business profile** (Options): business name, EIN or tax ID, address, state sales-tax permit number. Saved in `settings.seller.profile`, stays on the phone, goes into Backup.

**Step 8.2. Dealer display case and shows. Model: Sonnet.** (session 13)
- [x] ✅ Merged (v0.33.0, Nov 2, 2026, PR #79; file `dealer.js`, test `tests/seller82.js`). Inherited coins can't go in a for-sale case; picking a show also fills in "Where".
- **Dealer case:** a new box type next to storage and display boxes (`type: "dealer"`), drawn on the shelf like a glass-top show case. Spots on or off, like other boxes. It can be a permanent home or used just for shows.
- **Moving in:** each dealer case has a **"For sale case"** switch (on by default; Edit case, `forSale`). On: coins moved in switch to **For sale** (inherited coins are skipped and listed). Off: coins keep their status (a display-only case). Turning the switch off later doesn't change coins already inside. The app remembers each coin's earlier place and status (`caseFrom`: album/box/spot/stack plus status/stage).
- **Moving out:** "Take out" on one coin, or **"Return unsold coins"** on the case, puts each coin back in its old spot and old status. A coin that was already For sale stays For sale. If its old spot is taken now, it goes to "Nothing special" and the app lists it. One Undo.
- **Show records** (new `sh_` records): name, date(s), place, kind (coin show, Whatnot live, eBay Live, other), and costs: table fee, gas/mileage, hotel, food, other. Mark as sold gets a **Show** picker that defaults to a show happening today.
- **Show page:** coins sold, sales, coin cost, fees, show costs and **profit for the show** (sales − coin cost − fees − show costs). Selling at a show uses the Phase 7 sale form and fee estimates.

**Step 8.3. Pricing help and reports. Model: Sonnet.** (session 14)
- [x] ✅ Merged (v0.34.0, Nov 3, 2026, PR #82). Built (files `pricing.js`, `salesreport.js`, test `tests/pricing83.js`); tick when merged. Reports sit in the menu as **Sales Reports** (Seller Mode only). Business stock is shown at cost for the end of the period plus its value today (no stock history is kept).
- **Suggested asking price:** on a coin's page and in the dealer case, shows both **Red Book × your %** and **melt + your markup %**; tap one to use it as the asking price. Percentages set in Options → Selling (start at 90% and 10%, changeable). Coins with no Red Book value show only the melt choice.
- **Reports page** (Seller Mode): pick month, quarter or year. Sales, cost of coins sold, fees, shipping, show costs, profit, sales tax collected (kept apart), and Business stock value at the end of the period. Per-platform totals to check against **1099-K** forms, and a **Schedule C style summary**. Personal sales are listed apart, not mixed in.
- **Printable page** (save as PDF from the phone) **and a spreadsheet (CSV)** for an accountant.

**Step 8.3b. Shipping defaults, Going as, Was kept in. Model: Sonnet.** (session 15, added Nov 3 before the review so the review covers it)
- [x] ✅ Merged (v0.35.0, Nov 3, 2026, PR #85). Test `tests/ship83b.js`. Shipping costs live in Options → Selling; Going as is on the show form; Was kept in is saved on the sale as `sold.keptIn`.
- **Saved shipping costs:** in Options → Selling, a **default shipping cost** plus **per coin type** amounts (e.g. Morgan dollar $4.50). The Mark as sold form fills in "Shipping paid" from them; you can still change it. Saved in settings, goes into Backup.
- **Going as:** each show gets **Seller** or **Attendee**. Attendee shows skip table fee and profit math. Add a **Find shows** link (a web search for coin shows near you); the app can't keep its own show list up to date offline.
- **Was kept in:** when a coin is marked sold from a dealer case, its old place is saved on the sale and shown on the sold coin's page, so you know where it lived before the show. Check that it also shows for coins sold from other places.

**Step 8.4. Review. Model: Opus.** (session 16)
- [x] ✅ Reviewed (v0.35.1, Nov 3, 2026). Test `tests/review84.js`. Fixed: editing a sale kept losing Was kept in / its show; case return could double up an album spot; attendee show costs counted in Reports; Move to Personal moved sold coins; deleting a dealer case now sends coins back; Quarter→Month period switch.

Checks Business totals, the dealer case return (old spot taken, Undo), show profit math, reports against sample sales, and old backups.

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
