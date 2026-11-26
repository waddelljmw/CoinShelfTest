# 34 · E1 efficiency check: taps at real size (2026-11-25, Opus + 1 fresh-eyes helper)

App v0.116.2. Report only: nothing in the app changed. Phone-size browser (390x844) on `?demo=full`, scaled to real size: **504 coins, 30 albums, one 106-spot album** (Lincoln 1959–2008). Every tap, scroll and typed letter was counted by the test tool. Source tags: **A** = tapped on the phone, **B** = read in the code, **C** = estimate.

## Verdict
The app is already fast where it matters most: moving 2 spots 40 places now takes **7 taps** (was 81), marking 62 album coins original takes **5–6 taps**, and the receipt shipping split works. The waste is in **repeat jobs at real size**: grading old coins (3 taps + a scroll each), fixing a wrong year (6 taps + 1–2 scrolls each), and attaching **old receipts to coins already in albums** (~30 taps each). Two **data-safety** slips come first: a coin added after an inherited one quietly copies "Inherited" (the "Same as last" chip sits down by Where from, off the first screen), and clearing that chip leaves an auto-filled price behind.

## Data safety first (both S, Sonnet, no saved-data change)
| Code | What happens | Fix |
|---|---|---|
| **E1-1** | New coins copy the last coin's Where from. If that was **Inherited**, the new coin becomes "Inherited · do not sell" with the last inheritance. The chip that says so sits by Where from, below the first screen. Helper: a 1964 half added to a year set became "do not sell, Grandpa Joe" without him noticing. (A + B: `coinform.js:27, 75`) | Never carry Inherited or Gift; show any carried value at the top of the form. |
| **E1-2** | Clearing the carried "Pocket change" chip keeps the face-value price it filled ($1.00 on a slab nobody priced). (B: `actions.js:522` clears source and pay method, not `_paidAuto`) | Clear the auto price too. |

## Scenarios: today vs better (ranked by taps saved × how often he does it)
| # | Job | Today | Better route | Saved | Size | Saved data? |
|---|---|---|---|---|---|---|
| 3 | 100 old receipts, 3 album coins each | ~30 taps + ~60 letters per receipt, ~3,000 taps total (B, C) | Find coins **by album** (pick album, tick spots); **Select › Put on a receipt**; Save + next keeps the last date and store | ~1,600 taps | M | no (purchaseId exists) |
| 1b | Grade later with Quick grade (13 coins) | 39 taps + 13 scrolls: it opens the full Edit form, grade below the fold, then Save (A) | Grade box first; picking a grade saves and moves on (his 11-24 sketch decision) | 13 taps + 13 scrolls per 13 coins (~400 for his 200+) | S | no |
| 5 | Fix a wrong year on 20 coins | ~120 taps + ~30 scrolls: spot › View coin › scroll › Edit › year › Save › Back (A, one coin ×20) | **Select › Edit one by one** (same run screen as Quick grade, Save + next) | ~58 taps, ~30 scrolls | M | no |
| 14 | Upgrade want list from 30 album coins | 36 taps in the album; 14 via My Coins Filter (Kept in + Grade to) that he'd have to know about (B) | **Select by grade…** on the album's Select bar | ~28 | S | no |
| 6 | Break a proof set into album spots | No tool: ~45 taps + typing, 5 coins one by one (B, C) | **Break up this set** on a set: makes the coins (Proof ticked, year, mint), splits cost, offers matching empty spots | ~37 | M–L | **yes** (Opus) |
| 10 | Sell 10 as one order | ~25 taps + ~40 letters, one price per coin; Sell together button above the list (B; helper A for 3) | **One price for the lot**, split by value; sticky Select bar | ~9 taps + 30 letters | S | no |
| 1 | Fill 10 spots fast (106-spot album) | 15 taps, 4–6 scrolls; Save sits under 43 rows; 22 px tick boxes; rows grow when a loose coin is offered (A) | Pinned Save, whole row tappable, keep row height | ~5 scrolls | S | no |
| 9 | Loose coins into a new album | Create album, then Fill spots offers each loose coin (B) | After Create: "23 of your loose coins fit. Put them in?" | ~N + 3 | S | no |
| 7b | Wrong coin sitting in a spot (token in a Morgan spot) | Can't: "Wrong type? Re-add it" takes it out of the album and loses "original" (helper A) | **Something else is in this spot** on a filled/typed spot | can't → ~4 | M | **yes** (Opus) |
| I3 | Edit a coin from its spot | spot › View coin › scroll › Edit: 3 taps + 1 scroll (A) | Edit on the spot card; pinned action bar on the coin page | 2 taps + 1 scroll each | S | no |
| I4 | Open 1 of 30 albums | My Albums: 6 scrolls (helper A) | Search box on My Albums | ~5 scrolls | S | no |
| 2 | One coin from scratch | 10 taps + 4 letters, 2–3 scrolls (A). State design is called "Variety", below the fold; two "Circulated" controls | Call it "Design" when the type has designs, right under the type | ~2 scrolls | S | no |
| 4 | Split shipping on a receipt | 3 taps, but Shipping sits in a closed section; the helper typed 12 into Total (A) | Open by default | 1 + a slip | S | no |
| 11 | Find a variety in 500 | 1 tap + a word works; "DDO" / "DDR" don't; sample has no variety coins (A) | Add the short forms; add 3 variety coins to the sample | – | S | no |
| I2 | Phone Back with the menu open | Leaves the app (A) | Back closes the menu | a restart | S | no |
| 13 | Restore on a new phone | ~4 taps (B). The demo hides Backup on purpose but says nothing; helper never found it | One line in the demo's Options: "Backup is in your real app" | – | S | no |
| 12 | Clean up a duplicate | ~8 taps, no finder (B) | Later | – | – | – |

**Keep as is (fast already):** I1 move 2 spots 40 places, 7 taps + 6 letters, 0 scrolls (was 81) · 7 mark 62 originals, 6 taps · 8 move a box's contents (Move everything) · I5 pawn-shop check (Home search, 1 tap + a word) · 15 first 10 minutes (report 29).

## Fresh-eyes helper (didn't know the app; 8-level ladder; 165 taps logged)
Levels done: 1, 2, 3, 4, 7. Partly: 5 (no Bag holder), 6 (wrong coin in a spot). 8: sale done, variety search unclear, **backup skipped** (hidden in the demo). First-glance guesses: nearly all right; wrong only on "no Backup in the menu".

**Think-aloud highlights:** typing the year removes a line and the next tap lands on "Can't find it? Type it yourself" (trap) · Fill spots list jumps when "Use my loose coin" lines appear · "+" grade only shows after picking MS-64 (found late) · Shipping hidden in a closed section · Plated is 3 levels deep with 13 px tick boxes · Sell together button above the list · "do not sell, Grandpa Joe" copied onto a year-set half (E1-1).

**Delights (keep):** year-first type search · state list under Variety · Circulated fills Pocket change and $0.25 · receipt math and even shipping split · Fill spots confirm + Undo + Quick grade · Set for all › Original (62 coins, 5 taps) · + Container inside · Year set holder · Sell together profit line · silver bar form · Recently deleted.

**Its top 5, with verdicts (for learning, not to act on):**
1. Stop silent carry-over. **Agree** (checked in the code; E1-1, E1-2).
2. Visible Backup. **Better way:** the real app has it in Options; the demo hides it. Say so in the demo.
3. No jumping forms, sticky Save/Sell bars. **Agree.**
4. Record the wrong coin in a spot. **Better way:** one "Something else is in this spot" choice, not free placement anywhere (saved data, Opus).
5. Buried fields, tiny boxes. **Agree** on Shipping, "+", Plated, Bag holder. **Push back** on a Country field now: a new saved field for a rare case; the name line works.

**Missed or late features, why, fix:**
| Feature | Found | Why | Fix |
|---|---|---|---|
| Backup | never | hidden in demo, empty-looking heading | demo line (S) |
| Put an existing coin in a filled spot | never | doesn't exist for a filled spot | E1p plan |
| "+" grade | late | appears only after a grade is picked | show beside Grade (S) |
| Shipping on receipt | late | closed section looks like a heading | open by default (S) |
| Plated / problems | late | 3 levels deep, 13 px ticks | one level up, 44 px rows (S) |
| Quick grade | fast | button on the album | grade first (S) |
| Edit spots / Move spots | not tried | not needed by the ladder | – |
| Needs attention run | not tried | – | – |
| My Albums search | never | doesn't exist | add (S) |
| Bag holder | never | only a box look, not a holder | add choice (S) |

## Suggested queue (needs his yes)
1. **E1a Safe carry + small fixes** (Sonnet, ~1–2 weekly, ~45 min): E1-1, E1-2, menu Back, Shipping open, "+" beside Grade, Bag holder, Plated up a level, demo Backup line, Design label, DDO/DDR, Edit on the spot card. **Before he enters more coins.**
2. **E1b Fewer taps for big jobs** (Sonnet, ~2, ~1 h): Quick grade grade-first, Fill spots pinned Save + whole-row tick + no jump, sticky Select bar, My Albums search, one price for the lot, loose-coin offer, Select by grade.
3. **E1c Receipt backlog** (Sonnet, ~1–2, ~45 min): find coins by album, Select › Put on a receipt, Save + next keeps date and store.
4. **E1d Edit one by one** (Sonnet, ~1, ~30 min).
5. **E1p Opus plan** (~2): wrong coin in a spot + break up a set (both change saved data; 4-box check).
Then 33a–33c fillers as queued.
