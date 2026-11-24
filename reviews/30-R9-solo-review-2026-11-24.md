# R9 solo Opus review — 2026-11-24 (app v0.107.0)

Scope: everything merged since R8 (v0.101.3 → v0.107.0; this repo's history starts at v0.104.1, so the diffs read were v0.105.0 mint "Can't tell", v0.106.0–v0.106.2 Needs Attention and Circulated, v0.107.0 step 25). Plus a safety check of the parts Purchases (step 26) will touch: backup, restore, photo clean-up, snapshots. Also the 11-22 review note: is Save pinned, and does every form ask before losing changes (idea 136)? Reproduced problems only. **Nothing fixed here.**

## Findings

**R9-1 (High for step 26) — snapshots share every non-coin record as-is.**
`snapshotDocs` (snapshot.js) cleans coins, settings and wants, and copies every other record unchanged. Reproduced: a test purchase record (store name, total, receipt photo link) and a coin-show record both went into the snapshot. Today only show records (2027 selling) are affected. Purchases would put store names and totals into every shared snapshot, against the "keep private info out of snapshots" rule.
Fix inside step 26: snapshots keep only the record kinds they need (allow-list), and purchases are left out.

**R9-2 (High for step 26) — a receipt photo saved under any other name would be lost.**
Backup, restore and the phone's photo clean-up only see photos in a record's `photos` or `receiptPhotos` list (`photoRefsOf`, values.js). Reproduced: a photo saved as `receipt` on a purchase record is not counted as in use, so the clean-up deletes it after a day, and backup skips it.
Rule for step 26: keep the receipt as `receiptPhotos: [photo]` on the purchase record. Then backup, restore and clean-up work with no other change.

**R9-3 (Medium) — editing a coin, then leaving, drops the changes without asking.**
Reproduced at phone size: open a saved coin, type in Notes, close (✕, swipe or Back): no question, the note is gone. Only a new coin, Fill spots and the album form ask (`sheetUnsaved`, options.js). Idea 136 (Save you can't miss) was marked covered; half true: Save is pinned at the bottom (checked, 390 px screen), but the "ask before losing changes" part is missing for edits.
Fix: small (S, Sonnet): ask "Discard your changes?" on an edited coin too. The new purchase form in step 26 should ask the same way.

**R9-4 (Low) — albums made before v0.107.0 keep the old order.**
P and D side by side and the 2020-W spots apply to new albums only; Edit album doesn't reorder or add the W spots. If your Parks album is already in the app and empty: delete it and make it again, but after step 27's W tick (today a new Parks album gets 2019-W and 2020-W spots your album doesn't have).

**R9-5 (Low) — "Can't tell" shows as "1955-?" in storage box spots.**
`slotDate` (boxes.js) adds "-" + mint; coin labels correctly say "1955 (mint?)". Cosmetic, one line; fold into step 27.

## For the step 26 plan (not bugs)
- Spreadsheet (CSV): coins re-imported get new records, so their link to a purchase is lost. Say so, or add a Purchase column.
- A deleted coin in a purchase: the "prices add up to the total" check should skip deleted coins, and Undo should bring the link back.
- Restore handles a new record kind with no change (it adds or replaces it). DATA_VERSION stays 1 unless old coins are converted.

## Checked, no problem found
- Mint "Can't tell" / No mint mark (v0.105.0): the form's "-" is never saved; `mintOk` only on a blank mint; values use the plain-date price for "?"; CSV writes and reads "Can't tell" and "None".
- Needs Attention (v0.106.0–1): album link opens the album; the run only continues when started by Fix them.
- Circulated with a plain design (v0.106.2): valuable varieties and the Known variety box still need a grade.
- Step 25: names in the suggestion list are escaped (no odd-text problems); old Bank roll coins still count at face and still appear in Source; 2019/2020 W spots match the Mint's W quarters.
- Related tests: step25, mint4c, needs134, runonly106, circdesign106 all pass (47 checks).
