# Step 39: Needs attention sim, is a Skip needed? (app v0.130.0, Sat 2026-11-28)

Report only. No app code, saved data or IDEAS.md changed. One Opus chat, solo, no helpers.

**How it ran:** a script in a phone-size browser (390x844, touch). Made-up coins loaded in memory on `?demo` and `?demo=big`; real Home › Fix them run tapped. **Tags:** RUN = done in the browser · CODE = read in the code · COUNTED = taps counted from the form · GUESS.

## Verdict
- **Skip isn't needed. Two honest answers are what's missing.** Every reason a coin lands in Needs attention already has a truthful "clear it" answer, except one: **cost on a bought coin**. There is no "I don't know what I paid". RUN
- **The heir can clear all 100 coins honestly** (rough date typed once, Not graded for all, Can't tell on mints). The slow part is mints: one coin at a time. RUN
- **The busy collector is stuck with 80 coins for good.** Forgotten costs can't be cleared without making up a number or picking a fake source (Gift, Pocket change). Home says "80 coins need attention" forever. RUN
- **Today's Skip only lasts for one run.** Skipping 55 coins took 56 taps. The next Fix them starts over with the same coins, and the Home count doesn't move. RUN
- **Recommend:** don't build Skip (it hides problems and needs 4 safeguards). Add **"Don't know what I paid"** instead (N1, saved field, Opus plan + his OK), and let **Set for all** set Can't tell on mints (N2).

## The two testers (made up)
| Tester | Coins | In Needs attention at start | After honest fixes | Left with no honest answer |
|---|---|---|---|---|
| **Heir**: 100 inherited coins from Grandfather (40 Morgans, 15 Walkers, 15 Franklins, 30 Mercury dimes), doesn't know grades, mints or the date, 5 too worn to read | 100 | 100 (grade 100, inherit date 100, check mint 85, year 5) | 0 once mints are done | **0** |
| **Busy collector**: 500 bought quarters, cost forgotten on 80 old buys, where from blank on 30, 20 loose with no mint | 500 | 110 (cost 80, where from 30, check mint 19) | 80 | **80** (all cost) |

## What clears each reason today
| Reason | Honest answer in the app | Taps | Bulk? |
|---|---|---|---|
| Grade | Not graded / Can't grade this one | 2 per coin, or Set for all › Not graded | Yes (RUN) |
| Inherit date | Type it once on the inheritance; free text like "1990s, not sure" works | 1 typed, clears all 100 | Yes (RUN) |
| Year | Unreadable / Never had a date tick | 2 | No |
| Check mint | Can't tell | 3 per coin (pick + Save) | **No** (N2) |
| Where from | Other › type "Don't know" | ~4 + typed | Set for all |
| **Cost** | **None.** Only a made-up price or a fake source | n/a | n/a (N1) |

## Findings
| # | Size | What | Fix (plain words) |
|---|---|---|---|
| N1 | M | **No "Don't know what I paid".** 80 of the collector's 110 can never be cleared honestly. | A "Don't know what I paid" tick by Price paid: clears Needs attention, coin stays out of Gain (it already is, S1-1 honest Gain). Home's totals note stays true. New saved field: Opus plan, 4-box check, his OK. Also in Set for all. |
| N2 | S | **Mints one at a time.** The heir's 85 loose coins with no mint take ~255 taps. | Set for all › Mint › Can't tell, only on coins whose mint is still blank. Same saved word as today, no new field (CODE: Set for all leaves mint out on purpose, so this is a careful exception). |
| N3 | S | **"Don't know" for Where from** needs Other + typing. | A "Don't know" chip under More…. Display only (saves the words as the source). |
| N4 | — | **Big sample's 505 is 500 mint checks** (made-up loose coins with blank mints). The "mountain" in report 42 F8 is mostly a sample-data effect; N2 shrinks it. | No new item. |

## Push back
- **Skip with 4 safeguards** (count on Home, Show skipped, mark on the coin page, edits bring it back) is more to build and teach than N1 + N2, and it lets a coin hide a real gap. Build N1 + N2 first; bring Skip back only if a tester still gets stuck after that.

## Tap counts
| Job | Taps | How |
|---|---|---|
| Skip through 55 coins | 56 | RUN |
| Heir: clear inherit date on 100 coins | 1 typed | RUN |
| Heir: Not graded on 30 dimes (Set for all) | ~6 | COUNTED |
| Heir: Can't tell on 85 mints today | ~255 | COUNTED |
| Heir: same with N2 | ~6 | GUESS |
