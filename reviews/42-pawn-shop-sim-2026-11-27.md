# Step 38: pawn-shop owner sim (idea 115, app v0.130.0, Fri 2026-11-27)

Report only. No app code, saved data or IDEAS.md changed. One Opus chat, solo, no helpers.

**The tester (made up):** owns a pawn shop with a coin case, long-time collector of U.S. coins, now hunting $1,000+ coins. Buys at the counter and at shows, sometimes gets shipwreck coins and coins from named bank hoards. Huge personal collection, already listed in a spreadsheet. Selling and trade-in value were left out on purpose.

**How it ran:** phone-size browser (390x844, touch) on `?demo=big` (1,234 made-up coins, 4 albums) and on an empty app. **Tags:** RUN = done in the browser · CODE = read in the code · COUNTED = taps counted from the form, not tapped · GUESS.
**Taps:** a tap on a button, chip or row = 1; a drop-down = 2 (open + pick); typing = "typed".

## Verdict
- **The counter check is fast** (1 tap + typed: "1889-cc morgan" → row): mintage, Key/Semi-key tag, "You own 1: VF-30" with where it's kept. Works offline. With values hidden, melt shows •••. RUN
- **But it misses the two things a buyer asks next:** "is this an upgrade for me?" and "what did I say I'd pay?" (F3). That's the biggest gap for his job.
- **Two accuracy slips an expert would catch at once** (F1): the search offers an 1893-CC $2.50 gold (never made), and import takes a 1955-S Franklin (never made) without a flag.
- **A receipt is lost if the app closes halfway** (F2). The first coin is kept but loses its receipt link; store, total and receipt photo are gone.
- **Stars (GUESS): ★★★★☆ for the counter, ★★★☆☆ for logging his big coins.** "It answers 'do I have it' faster than my spreadsheet. It won't hold my pedigree or my early gold, and it lost my receipt."

## Findings, ranked
| # | Size | What | How | Fix (plain words) |
|---|---|---|---|---|
| F1 | S | **Never-made coins get in.** Search "1893 cc" lists a $2.50 gold CC (Carson City never struck $2.50; the type's own mint list leaves CC out, but the search ignores it). Import of "Franklin Half, 1955, S" is ticked and saved with no flag, though the coin form already warns "struck at P, not S". | RUN | Search uses the type's mint list. Import preview shows the same mint warning and starts that row unticked. Display only. |
| F2 | M | **Interrupted receipt is lost.** New purchase (store, date, total $1,450) → + New coin → save coin 1 → start coin 2 → app closes. After reopening: coin 2's form comes back, coin 1 is saved **with no receipt**, the receipt itself is gone. | RUN | Keep the half-done receipt the way a half-done coin is kept (it already survives a reload), or save the receipt when its first coin is saved. Ask him which. No change to how coins are saved (GUESS; check first). |
| F3 | M | **Counter check ignores want lists and album targets.** A 1878 Morgan VF-30 in an album aiming for AU+ shows no "Upgrade". An 1889-CC on a "Coin show list" with pay up to $900 shows "You don't own this one yet" and offers **Add to want list** again (only the General list is checked, so a tap makes a duplicate). No value or paid for the coin you own. | RUN | On that sheet: "★ On Coin show list · target VF-20 · pay up to $900"; "Upgrade: you have VF-30, album aims AU+"; your value and paid on the "You own" line. Check every list before offering Add. Display only. |
| F4 | S | **Cert numbers:** the same PCGS cert saved twice with no warning; a cert number can't be found with search (search reads notes, variety, seller, but not cert). | RUN (dup) · CODE (search) | Warn "You already have cert 12345678: 1881-S MS-65" (save still allowed). Add cert to search. |
| F5 | S | **Spreadsheet slabs lose their holder info.** A grade cell like "PCGS MS-64 CAC" or "PCGS PR-62" comes in as a raw coin with typed grade "Other"; service, grade and CAC are lost. 600 rows came in in ~10 s, all 600 coin types matched (good). | RUN | Read service + grade + CAC (and +) out of one grade cell; show "read as PCGS MS-64, CAC Green" in the preview. |
| F6 | M | **Shipwreck and hoard provenance has no home.** Only Notes or Variety hold "Atocha"/"bank hoard". Notes are searchable, so he can find it again (CODE), but it's not on the coin card line, the insurance report or a filter. | CODE | Push back on a big feature. Step 1 (free): tell him "type it in Notes, search finds it". Step 2 only if he asks again: one optional "Pedigree" line (saved-data change, Opus, 4-box check). |
| F7 | L | **Dead ends for a $1,000+ hunter:** no catalog types for Flowing Hair / Draped Bust dimes, quarters, halves and dollars, $3 gold, or gold before about 1838 (Classic Head and earlier). Shipwreck coins (mostly Spanish colonial, GUESS) and world coins only go in as "something else" with a typed name: no date or mint check, no mintage, no melt unless typed. | CODE | Add the missing U.S. early types (dates and mints from public U.S. Mint sources only, never Red Book pages). World/shipwreck: keep the "something else" path; add a Country box later if testers ask. |
| F8 | — | **505 coins need attention** shows on the big sample. A big spreadsheet import will look like a mountain. | RUN | Already step 39 (the Needs attention sim). No new item. |

## Tap counts
| Job | Taps | How |
|---|---|---|
| Counter: "do I own it, where, key date?" | 1 + typed | RUN |
| Same, but "is it an upgrade / what will I pay?" | not possible on that sheet; 3+ taps via What I need | RUN (F3) |
| Log a $1,000+ slab: type, year, mint, Certified, service, cert, grade, +, CAC, paid, where from, 2 photos, Save | ~16 + 4 typed + 2 photos (~3 taps each on the phone camera, GUESS) | COUNTED |
| Receipt with 2 new coins | ~2 to start + each coin's taps + 1 to save receipt | COUNTED |
| Import 600-row spreadsheet | ~5 taps (pick file, match columns, Import), ~10 s | RUN |

## The 8 questions
1. **Checks before buying:** own it ✓ (with grade and place), upgrade ✗, pay up to ✗ (F3).
2. **$1,000+ slab:** service (PCGS, NGC, ANACS, ICG, CACG, Other), cert (number keypad), grade, +, CAC Green/Gold, cert link to the grader's site ✓; no duplicate-cert warning (F4).
3. **Shipwreck and hoard:** Notes only; found again by search (F6).
4. **Interrupted multi-coin purchase:** coin form survives, receipt doesn't (F2).
5. **One hand, signal, hiding values:** lookup works offline (RUN); hidden values show ••• on Home and the lookup sheet (RUN); Save is pinned at the bottom (CODE); the ✕ and menu sit at the top, a reach one-handed (GUESS).
6. **Hundreds of coins:** 1,234 coins searched smoothly (RUN); import fast and accurate except slab text (F5) and never-made mints (F1).
7. **Dead ends:** F7 (early U.S., $3 gold, world, shipwreck). Paper money skipped as asked.
8. **Keep or quit:** keeps it for the 1-tap counter check and cert/CAC detail. Would quit over a wrong coin offered (F1) or a lost receipt (F2); would grumble about F3 every time he buys.

## Suggested order (his OK first)
F1 (S) → F4 (S) → F5 (S) as one Sonnet fill-in (~1 weekly, 30–40 min) · F3 (M, Sonnet, display only, ~1–2) · F2 (M, Opus check first, ~2) · F6 step 1 now as a tip, step 2 only if asked · F7 (L) later, its own research step.
