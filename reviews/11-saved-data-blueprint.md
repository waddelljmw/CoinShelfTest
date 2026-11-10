# Saved-data blueprint (session 54, Fable, 2026-11-10; nothing built)

One design for every planned change to how coins are saved, so each build session is cheap and none undoes another. Code facts below were checked against v0.58.6.

## At a glance

| # | Change | New saved fields | Old data | Risk | Size | Who builds |
|---|---|---|---|---|---|---|
| 0 | Safety net (old-backup test) | none | n/a | none | S | Sonnet |
| A | Red Book prices off the public site | 1 new record, `pricebook`, on the phone | copied to the phone first | **High** if rushed | L = M + M | Sonnet, Opus review before part 2 |
| B | Containers inside containers (red box) | `keptBox` on storage boxes (same name albums use) | untouched | Low-medium | M | Sonnet |
| C | Stack AND container | none (rule change only) | untouched | Medium | M | Sonnet, Opus review |
| D1 | Pounds on bars (72) | none (`bUnit` gets "lb") | untouched | Low | S | Sonnet |
| D2 | More kinds of stacks (71) | none (`metal` stops being forced to Silver; one new junk kind) | missing metal = Silver | Medium | M | Sonnet, light Opus look |
| D3 | Groups inside a stack (18) | none (worked out on screen) | untouched | Low | M | Sonnet |
| E | Year or "too worn" tick (60) | `noDate`, `yearAbout` on coins | not asked, not changed | Low | M (was L) | Sonnet |
| F1 | Fix a hand-typed type name (58) | none | untouched | Low | S | Sonnet |
| F2 | Change a catalog type (58) | `typeWas` | untouched | High | L | Opus, **wait** |

**Good news:** only A, E and F2 add anything new to saved data. B, C and D reuse fields that already exist, so old backups keep working with no conversion.

## Recommended order

```
0 Safety net ─► A1 copy prices to phone ─► (you: open app, back up) ─► A2 remove from site
     │
     ├─► D1 pounds, F1 fix typed name      (small, any week)
     │
     └─► B nesting ─► C stack + container ─► D2 more stacks ─► D3 stack groups
                                                   E year / worn   (with "year first", idea 77)
                                                   F2 change catalog type (only if still wanted)
```
Why this order:
- **0 first:** every later step is checked against one frozen old backup.
- **A next:** your top priority, and no new Red Book data should go in until it's done.
- **B before C:** C needs the container picker B builds.
- **C before D2:** both rewrite the same few lines that save a stack; C first means D2 doesn't redo them.
- **F2 last:** F1 probably removes the need.

Suggested weeks (planning day decides): **Nov 17** = 0 + A1 + A2 + D1. **Nov 24** = F1 + E with idea 77. **Dec 1** = B + C. **Dec 8** = D2 + D3.

## Rules for every step
1. **You:** export a backup before tapping Update now on any step marked A, C, D2, E or F2.
2. Old data converts **on read**; nothing rewrites your coins in bulk.
3. Backup file `format` stays 1 while changes only add things. Raise it to 2 only if an older app would misread the file (none of these do).
4. Each step keeps the step-0 test green and adds one case for its own new shape.
5. Steps marked "Opus review" get the `waits for review` label when the PR opens.

---

## 0. Safety net (S, Sonnet)
- **What:** `tests/fixtures/backup-v058.json`, a made-up backup (not your real coins) in today's shape with one of everything awkward: coin in an album spot, coin in a box slot, junk silver coin in a stack, an old coin that has a stack **and** a box, a coin with no year, a hand-typed type, a bar in grams, junk by face value, a roll, a set, an album kept in a box, a pocket album, changed settings.
- **Test `oldbackup.js`:** restore it into an empty app; every item's name, value, "kept in" text and the Home totals must equal numbers written in the test.
- Also confirm backup and restore carry a record kind they don't know (needed for A).
- **Risk:** none. Test only.

## A. Red Book prices off the public site (IDEAS 21, review 08 #10)

**Today:** all values live in two files, `catalog/pricebook.js` and `catalog/pricebook-modern.js` (70 KB), which the site serves to anyone. A coin's Red Book value is **not saved on the coin**; it is looked up each time (`bookLookup` in values.js). So if the files vanish, your values vanish, unless the phone has its own copy first. That is the whole risk.

**What's saved:** one new record on the phone, key `pricebook`: `{ kind: "pricebook", edition, series, mintage, savedAt }`, same inner shape as today. Because backups copy every record, it rides along in your backups automatically.

**Two parts, never together:**
- **A1 "copy to phone" (M):** files still ship. On start, if the phone has no `pricebook` record (or an older edition), save the shipped one. All lookups read from the record. Options shows a line: "Red Book prices on this phone: 2026 · 13 series". Claude also hands you the same data as a private file for your Google Drive (second copy).
- **You, between parts:** tap Update now, see that Options line, export a backup.
- **A2 "remove" (M):** delete both files; remove them from `index.html`, `sw.js` FILES and `snapshot.js` SNAP_FILES. Add Options > "Load a price file" (checks the file's shape; a bad file is refused and the old prices stay). With no record, coins simply show no Red Book value; typed values and melt still work.

**Details the builder needs:**
- `PRICE_BOOK` becomes a variable filled at start; empty = `{ edition: "", series: {}, mintage: {} }`. Uses are in values.js (lines 35-140, 287) and coinform.js (159); all already cope with a missing series.
- **View-only file (snapshot):** must not carry the whole book. Leave the `pricebook` record out and stamp each coin's worked-out value into the file instead.
- **`?demo`:** no Red Book values (typed values and melt only).
- **Tests** switch to a small made-up price file in `tests/fixtures/` (about 15 test files check Red Book values today, so this is the bulk of A1's work).
- **Future Red Book pages:** Claude types them into a price file given to you in chat; you load it on the phone. It never goes in the repo.

**Tests:** fresh start copies the book to the phone · with files gone, a known coin shows the same value · no record = no crash, typed values still show · backup then restore brings prices back · a guard test fails if any served file holds price rows · bad price file refused.

**Risk: high if A2 lands before your phone has run A1.** Guards: two separate updates, the Options line, the backup, the Drive copy. Opus review before A2 merges.

**Costly to change later?** No. One loader in one place also suits a future PCGS or Greysheet lookup (idea 48): those save a value on the coin with where it came from.

### Host decision: stay on GitHub Pages
- Once A2 is done the site serves nothing private, so the reason to move goes away.
- **Moving has a real cost:** your coins are stored under the web address. A new address means backup, restore and reinstall. (Bug #2, restore keeps settings, is fixed this week either way.)
- Making this repo private doesn't help: the free plan takes the site down, the paid plan keeps it up but **the site is still public**.
- **Fallback if you ever want the code private:** Cloudflare Pages (free, works with a private repo, optional sign-in wall free up to 50 people).
- **Costly-later flag:** the web address. Before anyone else installs the app for real (selling), buy your own domain first. Not needed for your own use.

### Your call: old copies in the repo's history
Removing the files doesn't remove them from the repo's past versions (or from branch `backup-before-shelf`), which stay public. Two choices:
- **Leave it** (simplest; `NOTICE.md` already offers takedown).
- **Fresh start:** rename this repo, make it private, and create a new public one with the **same name** from the cleaned code. Same web address, so the phone keeps its coins; about 10 minutes of your taps on GitHub plus one Sonnet session. Back up first. Lean: do it, but after A2 has run a week. *(Not legal advice.)*

## B. Containers inside containers: the red box (M, Sonnet)

**Today:** albums and pocket albums already save `keptBox` (the box they sit in) and `keptPlace` (typed text). Storage boxes can't.

**What's saved:** storage boxes get the same two optional fields. Two new looks: `metal` (with a color, red for the lock box) and `bag`. Bags use the existing "no numbered spots" setting. Nothing new on coins: a coin's `boxId` is its innermost container; its flip or capsule stays in Holder.

**Old data:** nothing to convert. No `keptBox` = top level, as now. An older app that sees a new look shows it as black (`normBox`, boxes.js line 11).

**Rules:**
- Parents can be storage or display boxes. Children: storage boxes only (not dealer cases).
- **No loops, checked on read:** if the chain is broken or circles back, treat the box as top level. The Kept in picker hides the box itself and everything inside it.
- **Delete a container:** boxes and coins inside move up one level (coins lose row and slot numbers); never deletes coins; Undo puts everything back.
- Counts and values include everything inside, all levels, each coin once. **Note for session 56 (bug #4):** write the box total as one function that can later walk down levels.
- Coin page shows the path: "Red box › Big ziplock › Small bag 1". The Coins filter "Kept in: Red box" includes everything inside.
- Wording: reuse "+ Add storage…"; never "bag" on a button.

**Tests:** 3-level path text · hand-made loop doesn't hang · delete the middle one, contents move up, Undo restores · totals count once per level · album in a bag in a box · step-0 backup unchanged.

**Risk:** low-medium. Dangers are an endless loop and double counting; both have tests.

## C. Stack AND container (M, Sonnet builds, Opus review)

**Today:** the Kept in dropdown mixes albums, boxes and stacks, and picking one clears the others (`applyKept` in boxes.js). Bars already keep a stack and a box. Junk silver **coins** lose their stack when put in a box.

**What's saved:** no new field. `stack` = why you have it; `boxId` = where it is. Only the rule changes.

**Changes:** Stack becomes its own row on the form (junk silver coins and bars); Kept in lists albums and boxes only; choosing a place no longer clears the stack. Also fix: moving many coins at once (filters.js 185-211) and taking a coin back out of a dealer case (dealer.js line 54) must keep both.

**Old data:** coins with only a stack look the same. Coins that already have both (the app allowed this until the next edit) simply become normal.

**Decision needed:** may a junk coin be in an album and a stack? Lean yes; one rule (stack is separate from place) is simpler than exceptions.

**Tests:** junk coin with a stack, pick a box, both saved · Home total counts it once · its stack total and its box total both include it · old stack-only coin unchanged after an edit · move-many keeps stacks · dealer case round trip · spreadsheet export and import keep both.

**Risk:** medium. It touches the save code and bulk moves; the danger is counting a coin twice or silently dropping a stack.

## D. Stacks: pounds (72), more kinds (71), groups (18)

**D1 Pounds (S, Sonnet, any week).** Bar weight is always saved in troy ounces (`bWeight`); `bUnit` only says how to show it. Add "lb" using the factor already in the code (1 troy oz = 0.0685714 lb). Label it "Pounds (lb)" meaning ordinary 16-ounce pounds, not troy pounds. An older app that sees "lb" shows ounces. Test: 1, 5, 10 and 25 lb survive save and reopen exactly.

**D2 More kinds of stacks (M, Sonnet, light Opus look).**
- **Today:** saving a bar forces `metal` to "Silver"; only silver junk coins can join a stack; the default name is fixed as "My Silver Stack" in coinsave.js line 58.
- **Saved:** the existing `metal` field may be Silver, Gold, Platinum, Palladium or Copper. One new junk kind, "copper cents by weight", entered in pounds. Fractional gold is just a small gold bar or round; nothing special.
- **Old data:** a bar with no metal reads as Silver (already true).
- Default stack name follows the metal ("My Gold Stack"); `stackOf` already does this.
- **Don't guess:** the copper share of pre-1982 cents and any sterling purity come from the Red Book or a named source at build time.
- **Tests:** old bar same melt as before · gold bar uses the gold price · copper by the pound · ID numbers unchanged.
- **Risk:** medium (edits the save code).

**D3 Groups inside a stack (M, Sonnet).** Nothing saved. Rows are worked out on screen from metal, purity and junk kind: My bars › Junk coins › 90% / 40% / 35% › coin kind. The "just coins / just stacks" switch is a setting, not coin data. Test: group totals add up to the stack total and no item lands in two groups. Risk: low.

## E. Always a year, or a "too worn" tick (IDEAS 60) (M, Sonnet)

**Today:** a coin may be saved with no year if it has a type or a name.

**What's saved (coins only, both optional):**
- `noDate`: `"worn"` (can't read it) or `"none"` (never had a date, like many tokens).
- `yearAbout: true` for "about 1850"; `year` itself stays a real number.

**Old data:** nothing changes on read. An old coin with no year means "not asked yet" and can still be edited and saved freely. A Coins filter "No date yet" lets you clean up when you like.

**Rules:** new coins need a year or a tick. If both are given, the year wins. A worn coin can't claim a dated album spot (it stays under "also in this album"); type-set spots work as now. Reading a coin from a photo never ticks the box for you.

**Tests:** old no-year coin saves unchanged · new coin with neither is stopped with a clear message · year plus tick keeps the year · spreadsheet column round trip.

**Risk:** low (two optional fields). Build with idea 77 "type the year first": same part of the form.

## F. Edit a coin's type (IDEAS 58)

**Today:** the type is locked on save (`TYPE_FIELDS`, coinsave.js line 30). "Wrong type? Re-add it" makes a **new** coin, which loses the coin's ID number and its lot links.

**F1 Fix a hand-typed name (S, Sonnet).** For coins with a typed type (no catalog type): name, denomination and kind become editable. Coin ID number, photos and place stay. Catalog coins stay locked. If session 55 gives "Other coin" its own built-in type id, allow that one too. Tests: fix a typo, same ID and photos · catalog coin still locked · the "types you've used" list shows the new name. Risk: low.

**F2 Change a catalog type in place (L, Opus). Recommend waiting.** Would save `typeWas` (old type and date), clear what no longer fits (album spot, variety, Full Bands and similar), re-check the year, and offer Undo. It rewrites the rule "a saved coin's type never changes" and touches album spots, Red Book values and ID numbers at once. Decide after a month of F1.

---

## Decisions for you (answer in one message)
1. **Host:** stay on GitHub Pages? (recommended)
2. **Repo history:** leave it, or fresh start after A2? (lean: fresh start, later)
3. **Demo link** shows no Red Book values: OK?
4. **Junk coin in an album and a stack:** allow? (lean yes)
5. **Year rule** applies to new coins only; old ones aren't forced: OK?
6. **F2** waits until F1 has been used a while: OK?
