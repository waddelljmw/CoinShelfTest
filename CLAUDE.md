# Working on Coin Cabinet

Read this, then `IDEAS.md` (short; just don't build from it unless asked), then only the **next unchecked step** in `PLAN.md` (don't read the whole plan).

**Ideas:** when he mentions a new idea, ask if it should go on `IDEAS.md`. Add it only if he says yes.

## The person
- Coin collector, **no app-building background**. Plain words.
- **Token-conscious.** Short replies (aim for under 150 words). No recaps of steps already shown. Don't repeat merge/branch instructions he already knows beyond the two links.
- **Start prompt (fast):** at the start of a session read only CLAUDE.md, IDEAS.md, and from PLAN.md the "Next session starts here" line, the session table and the next unchecked step. The check is quick git/gh looks (PR merged, checklist ticked, Fix list empty), **no test run**. The exact prompt is on the "Starting a new chat" line in PLAN.md; give that one. **If an open PR already holds the step on the "Next session starts here" line** (that line only updates on merge), the next session is the one after it in the session table.
- **End every finished task with the exact next prompt to copy** (and the model), plus 1–2 plain lines on **what that next step will do** (from `PLAN.md`), so he knows before he says go. After each merge, update the "Next session starts here" line in `PLAN.md` and mark finished items with ✅ (`- [x] ✅`); a weekly reminder reads it.
- **When he says he's ending the session:** reply with only (1) anything unfinished (e.g. a PR not merged yet), (2) Sonnet or Opus for the next session, (3) the exact prompt to paste, taken from the Session plan in `PLAN.md`. (4) 1–2 lines on what that session will do.
- **Session-end check:** At the end of each session, check the PR is merged, the checklist is ticked, the Fix list is empty; open bug reports are not checked while he is the only user (turn back on if he says so); if all is clear, give a short start prompt that skips the check, otherwise give the full one.
- **Work smarter:** whenever a GitHub feature, test automation, splitting files, or another setup would save tokens, speed up work or improve the code (within good coding practice), tell him in one line and do it. Anything touching his saved coin data still needs his OK first.
- **Say which model to use before each next step.** Opus: planning, reviews, anything that reshapes stored data. Sonnet: building, routine fixes, data entry (album lists, coin dates).

## Doing a change (keep it cheap)
0. **Stay small:** don't change unrelated files; reuse existing helpers before writing new ones; if a request has a risk (breaks old data, touches many files), say so in one line *before* building.
1. Branch from `main`. Batch related small requests into one branch/PR.
2. Find code with `grep -n` and read only the lines needed. Don't read whole files (`app.js` is now small; the rest is split by area, see the code map).
3. Plain files only: no build step, no frameworks.
4. Add/adjust a test in `tests/`. Run **`node tests/run-all.js 2>&1 | tail -3`**; only look at details if something fails. Screenshots only for new layouts.
5. Raise the version in **three places**: `APP_VERSION` (app.js), `version` (package.json), `CACHE` (sw.js). Fix → last number; feature → middle. New page files must be added to `FILES` in sw.js.
6. Commit, push, open a PR with `gh api` (GraphQL is blocked).
7. **Merge yourself when the work is finished and all tests pass** (no need to wait for "merge it"). Exception: ask first for anything that changes how saved coin data is stored, and for review-fix sessions. **Never merge** a PR whose step says "merge waits" (it waits for the review session), or while the automatic GitHub tests are red or still running: check `gh api repos/waddelljmw/CoinShelfTest/commits/<HEAD>/check-runs` shows success first. Then: `gh api -X PUT repos/waddelljmw/CoinShelfTest/pulls/<n>/merge -f merge_method=merge -f sha=<HEAD>`, confirm `main` has it, tick `PLAN.md`, give **https://github.com/waddelljmw/CoinShelfTest/branches**. Remind him to tap **Update now** on the phone.
7b. **After merging a bigger feature, prompt him to try it** with the safe test link **https://waddelljmw.github.io/CoinShelfTest/?demo** (sample coins, nothing saved) and, for empty-app flows, the main link in a private window. Say in 1–2 lines what to try and to send all findings in one message.
8. Merging publishes the real app at **https://waddelljmw.github.io/CoinShelfTest/**. The Claude artifact (slug `11b5b1eb-a5c1-4157-8b05-2c9cda610e1f`) is only a test copy; don't publish there unless asked.

## Reviews (the most expensive thing; ~100–150k tokens each)
- One Opus adversarial subagent **per phase**, and before changes that reshape stored data. Not after every small feature.
- Point it at the changed files and the risks; ask for reproduced problems only, under 600 words.

## Things that don't work from here (don't retry)
- Deleting branches, the GitHub Pages API, GraphQL: blocked. Opening github.io or most websites from the shell: blocked (check Pages with `gh api repos/waddelljmw/CoinShelfTest/deployments`).
- littletoncoin.com can't be read; use retailer listings or ask for screenshots.

## Code map
- Scripts load in this order (index.html): `catalog/data.js`, `catalog/pricebook.js`, `catalog/albums.js`, `catalog/varieties.js`, `app.js`, `values.js`, `views.js`, `albums.js`, `options.js`, `coinform.js`, `coinsave.js`, `editforms.js`, `actions.js`, `sheets.js`, `photofill.js`, `history.js`, `wants.js`, `report.js`, `snapshot.js`, `albumdb.js`, `local.js`, `backup.js`, `pwa.js`.
- `catalog/`: coin knowledge, swappable for another collection. `data.js` types, metals, grades, `EXACT_SLOTS` dates/mints, designs (`varieties`); `pricebook.js` Red Book values, mintages, proof dates; `albums.js` album lookup (`ALBUM_DB`); `varieties.js` known varieties, mint errors, problems, gone reasons, payment methods.
- App code, in load order: `app.js` storage, settings, helpers, `APP_VERSION` · `values.js` melt, Red Book values (`bookLookup`, `meltEach`), cost, labels · `views.js` navigation, Home, Value, Coins, coin page · `albums.js` album spots and pages (`buildAlbumSlots`, `albumStats`, `slotType`, series/reorder) · `options.js` Options page, live prices, pop-up sheet · `coinform.js` add/edit coin form (`renderCoinForm`, `pickType`) · `coinsave.js` `saveDraft`, photos, sold-where · `editforms.js` coin ID, new/edit album · `actions.js` toast, `actions` object, event listeners, app start. New app files go in `index.html`, `sw.js` FILES and `snapshot.js` SNAP_FILES.
- `pockets.js` pocket albums (a box of type `pocket`; pages are trays) · `wants.js` want lists and album-spot menus · `sheets.js` CSV · `photofill.js` read coin from photo · `history.js` value over time · `report.js` insurance report · `snapshot.js` view-only file · `albumdb.js` album lookup forms · `local.js` on-device storage (IndexedDB) · `backup.js` Backup/Restore · `pwa.js` + `sw.js` + `manifest.webmanifest` install, offline, update bar.
- `store.mode`: `local` phone app · `db` Claude account · `snapshot` · `memory`. Photos: `{lid}` on device, `{id}` Claude, `{url}` temporary.
- Coin status: `status` owned|sold|gone|deleted; owned coins may have `stage` coming|forsale (`stageOf`, `statusKey`). Cost = `costOf` (paid×qty + `buyTax`/`buyShip`/`buyFees`). `problems` make a Details coin (no Red Book value). Receipt photos in `receiptPhotos` (use `photoRefsOf`).
- Record keys: `c_` coins, `a_` albums, `w_` wants, `wl_` want lists, `settings`, `history`.

## Rules that protect his coins
- Never delete data without asking; offer Undo.
- Old saved data must keep working: convert on read.
- A saved coin's type never changes. Coin years must be real (`yearProblem`).
- Don't guess coin facts (dates, mints, mintages, album contents): look them up or ask for Red Book pages / photos.
