# Working on Coin Cabinet

Read this, `pipeline/pipeline.json`, and from `PLAN.md` only the "Next session starts here" line + This week box. **Only planning sessions read `IDEAS.md`.**

## The person
- Coin collector, **no app-building background**. Plain words. Phone only; baby at home, so short blocks.
- **Token-conscious.** Short replies (under ~150 words). No recaps. Never ask him to do what Claude can do itself (clock times, tracking).
- **Answer questions first; build only after his OK.** When his message has feedback or questions, answer and discuss before deciding, building or merging.
- **Push back:** when an idea is out of order, already covered, costly or risky, say "Push back:" + the reason + a recommendation. He wants to be challenged.
- A new idea: if the app or plan already covers it, say so and don't add it. Otherwise ask, and add to `IDEAS.md` only on yes. Idea numbers and finding codes always come with a plain-words hint.
- Teach briefly as we go. If a rename only changes internal names, say it isn't needed and skip it.

## Chat start (every chat, same order)
1. Open repo `waddelljmw/CoinShelfTest`. Read this file, `pipeline.json`, PLAN.md line + box. If Notion is on, remind him to turn it off.
2. **Usage:** his reading comes in the start prompt `[session/weekly]`; ask only if missing. It is the **only** reading this chat and it closes the previous chat in `claude-usage-tracking`. Clock times come from the repo (`git log`, `date`), never from him.
3. **Read the page data** (artifact `d51312cb-ee58-4793-9a5f-4e44aea565bb`; `db_list` collections `ticks`, `notes`, `questions`, `track`): test ticks, new notes, his answers in **Questions for you** and under notes.
4. **Write a short reply under each new note** (where it went in the queue, or one question). Handle notes ticked "blocks entering coins" **first**. Clear answered questions (`status: "cleared"`).
5. Then start the step (no separate "go"). Stop instead if he's on the wrong model (say switch) or the build cap / fantasy reserve says wait.

## Run modes (he says one in the start prompt)
- **1 step** (default) · **keep going to __%** · **overnight to __%**. Suggest the % from the pipeline estimates.
- Never go past the build cap or into the fantasy reserve. **Stop** on any saved-data change, failing test or question; post the question to the page's **Questions for you** box (`questions/` doc: `{q, asked, status:"open"}`).
- When a long job starts, set a phone timer for when it should end (works only if the Claude app is open on screen; if it fails, say so in a few words and go on).

## Finishing a step
- **Self-check before merging:** run the step's Try-it list in the test browser at phone size; look at 1–2 screenshots for contrast, tap size and large-text wrapping; write one line in the PR: `Self-checked: ...`.
- Merge yourself when the work is finished, tests pass and self-check is done (see Doing a change, 7). Ask first for changes to how saved coin data is stored.
- Then update `pipeline.json` (below), tell him in 1–2 lines what the next step does, its model, estimated weekly points and time, and give a whole new start prompt to copy (he only adds his usage). If the Try-it list is new, say to open the page's Test checklist.
- **"end it":** tell him anything unfinished, Sonnet or Opus next (with reason), the exact prompt to paste, 1–2 lines on what it does.
- **One chat checks, plans and builds** the step. Use a separate Opus chat only when saved data changes or for a review.
- **Work smarter:** if a GitHub feature, test automation, splitting files or other setup would save tokens, speed things up or improve the code (within good practice), say so in a line and do it. Saved-coin-data changes need his OK first; check `IDEAS.md` for cost savings but keep the app simple.
- **Models:** Opus for planning, reviews, anything reshaping stored data; Sonnet for building, fixes, data entry. Say which before each next step; suggest switches with a reason, never switch automatically.

## Pipeline (decided 11-17, process update 11-19)
- Queue = `pipeline/pipeline.json`, shown on the page **https://claude.ai/artifact/TK4NoA9NmYnhyb6xFvY8Rg** (slug above; files `index.html` + `pipeline.json`). Each step = one chat (3a/3b, 4b/4c are separate).
- Start prompt: *"Let's start the coin work. Pipeline step N: name. Mode: 1 step. Usage: [__/__]"*. Read only that step plus this file; build only what it lists. Side ideas go to the page's Notes inbox.
- **After every merge**, update `pipeline.json` in the same PR: step `status` → `done`, `actual` (weekly points from his readings), `started`/`ended`/`minutes` from the repo clock, a `done` entry, next ready step → `next`, `updated`, `app`, `week.weekly_now`. Then republish the artifact (publish_files, slug above, mode patch, both files). Fix later `est` values when real cost disagrees.
- **YOU ARE HERE = the next ready step** (skips Waiting steps with a date that hasn't come).
- **"Where are we?"**: read `pipeline.json` only; answer in one line + the page link.
- Every item has S/M/L. Every step has `try` (2–4 plain taps in `?demo`, ~2 min); write it if missing. Test blocks are grouped in the page's Test checklist (10–15 min each), planned around his real life, never a fixed day.
- **Fix check (15c, Opus) before testers:** a simulated tester re-runs every fixed finding.

## Weekly usage (replaces the 70% stop, weekly rhythm and top-3 rules)
- His weekly usage resets **Tue 1pm ET**. Build to the **build cap (85%)** until Sunday's fantasy run, then up to **95%**.
- **HARD RULE:** keep the fantasy reserve (Thu ~7pm and Sun 12:30pm ET runs, ~1–2 points each, through NFL week 17). Before work, check the reserve is still covered; if not, say so and suggest waiting for the reset.
- **Cost table (guesses until measured):** Sonnet step ~1 weekly point, 20–45 min · Sonnet bigger M step 1–3, 30–60 min · Opus plan or build 2–3, 30–60 min · Opus review or fix check 5–8, 60+ min · a fantasy run 1–2.
- Plan only when the queue runs low or notes pile up, not on a fixed day. Always keep more lined up than a week can use, plus small fill-ins.

## Weekly check-in (Sonnet, ~15 min, ~0-1 weekly point)
Replaces fixed-day planning. Run it as a short chat when the page's **Weekly check-in** card suggests it (after Sunday's fantasy run: Monday evening or Tuesday morning before the 1pm reset).
1. **Last week:** each step done since the last check-in, estimate vs real cost. Fix later `est` values that disagree.
2. **Queue order check:** anything urgent to jump? Anything blocked?
3. **Top up:** at least a few days of ready-to-build work lined up, questions already answered (pull from Later, or post to Questions for you). The page shows **Queue low** when fewer than 3 ready-to-build steps remain; the next chat then pulls from Later and says which, or posts to Questions for you.
4. **One process change to try** (a line, with the reason). Keep it only if it saved usage or time.
5. **Suggest days** for test blocks and the use day around his real schedule (visitors, travel); tentative, never a fixed day.
6. **Review due?** An Opus review is due when 8-10 steps are done since the last one, a change to how coins are saved is coming up, or before testers/buyers. If due, queue a **solo Opus review** (~1-3 weekly, 25-45 min, no helper agents unless he asks) in `pipeline.json`. Full Opus planning only when the queue is low, notes pile up, or tester feedback arrives.
- **Early planning rule:** after Sunday's fantasy run, on Monday evening or Tuesday morning before the 1pm reset: if weekly is about **90% or lower**, run the check-in (or planning, or a due review) early, then fill-ins up to **95%**. Skip if above about **93%**.
- After a check-in set `checkin.last` in `pipeline.json` and republish; after a review set `checkin.review_baseline` to the number of done steps at that time.

## Planning (when the queue is low or notes pile up)
Start from the existing queue, never blank: (1) check the queue; (2) sort the page's unsorted notes and new findings into it and mark each note **sorted** with where it went; (3) talk it through with him, push back where you disagree; (4) re-order, urgent can jump; (5) top up past one week plus fill-ins; (6) lock: `PLAN.md`, `pipeline.json` + republish, next prompt. No build plan before his OK. Minutes go to `reviews/NN-planning-minutes-DATE.md`; PLAN.md keeps only decisions.

## Cost rules (agreed 2026-11-04)
- Short build chats; **new chat after each merge**. Models: Opus for planning, reviews, saved-data changes; Sonnet for the rest; **Fable** only for one-off deep planning when free.
- GitHub runs the full test suite on every PR; while working, run only related tests. Reviews: one reviewer, deep on recent changes, every 2–3 weeks or after big features.
- Read page text, not screenshots (except the self-check). Group quick questions into one message.
- **Costly to change later?** Ask it for every design choice and flag it (build for his own use now, but so selling, other languages or reskins need no rework).
- **Usage log:** one line per chat in `claude-usage-tracking` (reading, work type, model, why sessions/models switched).
- **Stay at $0** beyond his Claude Pro plan: no paid tools or services.

## Doing a change (keep it cheap)
0. **Stay small:** don't change unrelated files; reuse existing helpers before writing new ones; if a request has a risk (breaks old data, touches many files), say so in one line *before* building.
1. Branch from `main`. Batch related small requests into one branch/PR.
2. Find code with `grep -n` and read only the lines needed. Don't read whole files (`app.js` is now small; the rest is split by area, see the code map).
3. Plain files only: no build step, no frameworks.
4. Add/adjust a test in `tests/`. Run **`node tests/run-all.js 2>&1 | tail -3`**; only look at details if something fails. Screenshots only for new layouts.
5. Raise the version in **three places**: `APP_VERSION` (app.js), `version` (package.json), `CACHE` (sw.js). Fix → last number; feature → middle. New page files must be added to `FILES` in sw.js.
6. Commit, push, open a PR with `gh api` (GraphQL is blocked).
7. **Merge yourself when the work is finished and all tests pass** (no need to wait for "merge it"). Exception: ask first for anything that changes how saved coin data is stored, and for review-fix sessions. **GitHub enforces this:** `main` only accepts a merge when the checks `test` and `merge-gate` pass. When a step says "merge waits", add the label right after opening the PR: `gh api repos/waddelljmw/CoinShelfTest/issues/<n>/labels -f "labels[]=waits for review"`. Only the review session removes it (`gh api -X DELETE "repos/waddelljmw/CoinShelfTest/issues/<n>/labels/waits%20for%20review"`), after its fixes and his OK. Wait for both checks to finish before merging; never try to get around a failed check. Then: `gh api -X PUT repos/waddelljmw/CoinShelfTest/pulls/<n>/merge -f merge_method=merge -f sha=<HEAD>`, confirm `main` has it, tick `PLAN.md`. Branches clean up by themselves (GitHub's auto-delete setting); don't list branches to delete. Remind him to tap **Update now** on the phone.
7b. **After merging a bigger feature, prompt him to try it** with the safe test link **https://waddelljmw.github.io/CoinShelfTest/?demo** (sample coins, nothing saved) and, for empty-app flows, the main link in a private window. Say in 1–2 lines what to try and to send all findings in one message.
8. Merging publishes the real app at **https://waddelljmw.github.io/CoinShelfTest/**. The Claude artifact (slug `11b5b1eb-a5c1-4157-8b05-2c9cda610e1f`) is only a test copy; don't publish there unless asked.

## Reviews (the most expensive thing; ~100–150k tokens each)
- One Opus adversarial subagent **per phase**, and before changes that reshape stored data. Not after every small feature.
- Point it at the changed files and the risks; ask for reproduced problems only, under 600 words.

## Things that don't work from here (don't retry)
- Deleting branches, the GitHub Pages API, GraphQL: blocked. Opening github.io or most websites from the shell: blocked (check Pages with `gh api repos/waddelljmw/CoinShelfTest/deployments`).
- littletoncoin.com can't be read; use retailer listings or ask for screenshots.

## Code map
- Scripts load in this order (index.html): `catalog/data.js`, `catalog/bookfacts.js`, `catalog/albums.js`, `catalog/varieties.js`, `catalog/idcodes.js`, `app.js`, `values.js`, `views.js`, `albums.js`, `options.js`, `coinform.js`, `coinsave.js`, `editforms.js`, `actions.js`, `ids.js`, `sheets.js`, `selling.js`, `order.js`, `seller.js`, `photofill.js`, `history.js`, `wants.js`, `boxes.js`, `pockets.js`, `dealer.js`, `pricing.js`, `salesreport.js`, `many.js`, `fillalbum.js`, `filters.js`, `inherit.js`, `shelf.js`, `report.js`, `snapshot.js`, `albumdb.js`, `local.js`, `backup.js`, `pricefile.js`, `ownvalues.js`, `whatsnew.js`, `welcome.js`, `levels.js`, `pwa.js`. `catalog/demo.js` is fetched only when `?demo` opens (and is in sw.js FILES).
- `catalog/`: coin knowledge, swappable for another collection. `data.js` types, metals, grades, `EXACT_SLOTS` dates/mints, designs (`varieties`); `bookfacts.js` which dates, mints and varieties the Red Book lists (names only, no prices; album spots, proof spots, variety choices, FB/FBL and SMS ticks read it); `albums.js` album lookup (`ALBUM_DB`); `varieties.js` known varieties, mint errors, problems, gone reasons, payment methods; `idcodes.js` the two-letter ID code per coin type (`ID_CODES`); `demo.js` the made-up sample collection.
- **No prices ship with the app** (since 11.3; `catalog/pricebook*.js` are gone). The price list is the saved record `pricebook`, read into `PRICE_BOOK` (app.js, `loadPriceBook`, `bookName()` for the words "Red Book"). It only gets there from his own files: `pricefile.js` (Options > Red Book values > Load a price file; checks the file's shape, `PRICE_FILE_KINDS` `pricebook` / `coin-cabinet-prices`, saves the record; Save price file writes one out) and `ownvalues.js` (idea 79a "bring your own values": pick a CSV, match columns, preview, confirm; adds numbers to the `pricebook` record, Undo puts the old prices back; uses `parseCsv`/`matchType`/`parseGrade`/`splitYear` from sheets.js). Tests may supply `SHIPPED_PRICE_BOOK` (tests/_compat.js); the real app has none. Never overwrite the record.
- App code, in load order: `app.js` storage, settings, helpers, `APP_VERSION` · `values.js` melt, Red Book values (`bookLookup`, `meltEach`), cost, labels, `isInherited`, `missingOf` · `views.js` navigation, Home, Value, Coins, coin page · `albums.js` album spots and pages (`buildAlbumSlots`, `albumStats`, `slotType`, series/reorder) · `options.js` Options page, live prices, pop-up sheets (`openSheet`, `openSheetOver`, `closeSheet`) · `coinform.js` add/edit coin form (`renderCoinForm`, `pickType`) · `coinsave.js` `saveDraft`, photos, sold-where · `editforms.js` coin ID, new/edit album · `actions.js` toast, `actions` object, event listeners, app start · `ids.js` coin ID numbers and styles · `sheets.js` CSV in/out · `selling.js` asking price, For sale list, Mark as sold form, fees, profit · `order.js` sell several coins as one order · `seller.js` Seller Mode, Personal/Business tag (`biz`) · `photofill.js` read coin from photo · `history.js` value over time · `wants.js` want lists and album-spot menus · `boxes.js` storage and display boxes · `pockets.js` pocket albums (a box of type `pocket`; pages are trays) · `dealer.js` dealer case and shows · `pricing.js` suggested asking price · `salesreport.js` seller reports (CSV/print) · `many.js` add many identical coins · `fillalbum.js` fill an album at once · `filters.js` Filter panel, saved filters, Select / Move many (`bulkApply`) · `inherit.js` inheritances (list, picker, "Mark inherited", leaving-Inherited question on Edit) · `shelf.js` Home drawn as a bookcase or safe · `report.js` insurance report · `snapshot.js` view-only file (`SNAP_FILES`) · `albumdb.js` album lookup forms · `local.js` on-device storage (IndexedDB) · `backup.js` Backup/Restore · `whatsnew.js` "What's new" lines per version · `welcome.js` welcome card, guided first coin, ⓘ help words · `levels.js` Simple mode (what is shown only) · `pwa.js` + `sw.js` + `manifest.webmanifest` install, offline, update bar. New app files go in `index.html`, `sw.js` FILES and `snapshot.js` SNAP_FILES.
- `store.mode`: `local` phone app · `db` Claude account · `snapshot` · `memory`. Photos: `{lid}` on device, `{id}` Claude, `{url}` temporary.
- Coin status: `status` owned|sold|gone|deleted; owned coins may have `stage` coming|forsale (`stageOf`, `statusKey`). Cost = `costOf` (paid×qty + `buyTax`/`buyShip`/`buyFees`). `problems` make a Details coin (no Red Book value). Receipt photos in `receiptPhotos` (use `photoRefsOf`).
- Record keys: `c_` coins, `a_` albums, `w_` wants, `wl_` want lists, `settings`, `history`, `pricebook` (price list: `{kind, format: 1, source, edition, series, mintage, savedAt}`; restore keeps the later `savedAt`; left out of view-only files, which carry `snapBook` stamps on coins instead).

## Rules that protect his coins
- Never delete data without asking; offer Undo.
- Old saved data must keep working: convert on read.
- **4-box check before any change to how coins are saved** (new field, new meaning, conversion). Report green/red chips, change nothing, and don't ask him to approve until all four are green: (1) backup and restore tested; (2) a data version number exists and is raised if a conversion is added; (3) the change was tried on a `?demo` or scratch copy first; (4) coin count and totals match before and after.
- A saved coin's type never changes. Coin years must be real (`yearProblem`).
- Don't guess coin facts (dates, mints, mintages, album contents): look them up or ask for Red Book pages / photos.
