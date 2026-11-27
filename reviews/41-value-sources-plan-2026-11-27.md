# Step 44 / 44b: Value sources — plan locked 2026-11-27

Step 44 was the talk (idea 154: one default value source plus a per-coin choice; his notes about his own Red Book / Blue Book numbers). Locked in chat 11-27. Step 44b builds it (Opus, saved-data change, his OK on the change below first).

## Decisions (his OK in chat)
1. **Named sources.** He names his own sources ("Blue Book", "My Red Book"...). Made from **"+ Name a new source…"** at the bottom of the coin form's *Value from* list. Managed (rename, remove) in **Options › Value sources**, folded, in the same group as the price list and melt prices, with **one ⓘ** for the rules. The app ships no publisher names.
2. **Main value counts.** The coin's main *Value* is the only one in totals. *Value from* lists the built-in choices, his sources, and **"Melt (follows silver)"** (gold coins: "follows gold"): picking it clears the Value box, and the value follows the live metal price.
3. **Compare-only values** behind a **"+ Compare another value"** link (hidden in Simple mode), each with its own *from*. Never in totals. On the coin page a compare line shows only if one was entered, plus an automatic **Melt today** line on silver and gold coins (worked out, not saved).
4. **Up to 3 loaded price list files.** **"Fill blank coins from"** shows only when 2 or more are loaded.
5. **Which value counts:** main value (or Melt when picked), else the fill-from list, else melt, else face. **Never borrow from another list.**
6. No hints in the lists. One *What's new* line. Old coins unchanged. Backup, restore and CSV carry everything.

## Saved-data change (needs his OK before build)
| Where | New | Old data |
|---|---|---|
| Coin | `valueFrom` may also be `"melt"` or `"s:<id>"` (one of his sources) | old words (PCGS, eBay sold…) unchanged |
| Coin | `compare`: list of `{from, value}` | none today; missing = no compare lines |
| Settings | `valueSources`: `[{id, name}]`; `fillFrom`: which list fills (default the first) | missing = no sources, first list fills |
| Records | `pricebook2`, `pricebook3`: same shape as `pricebook`, name = what he types | `pricebook` stays list 1, untouched |

- Coins keep a source's **id**, so a rename changes every coin at once and no coin is rewritten. A source a coin still uses can be renamed but not removed (it says how many coins use it).
- Restore joins `valueSources` by id (same as inheritances); `pricebook2/3` follow the same later-saved-wins rule as `pricebook`. View-only files still carry no price lists.
- CSV: *Value from* writes the source name or "Melt"; new columns *Compare 1 from / Compare 1 value* (up to 3). Import matches a name to his sources, else makes a new source with that name.
- No conversion: old coins are read exactly as today, so the data version stays 1.

## 4-box check (at plan time)
1. Backup/restore: plan covers it (settings join by id, lists 2/3 in restore); tested on a scratch copy during the build.
2. Data version: exists (1); no conversion, so not raised.
3. Tried on `?demo` / scratch copy first: in the build, before merge.
4. Counts and totals: same before and after for every old coin (rule 5 is today's rule when only one list is loaded); a test checks this.

Build: step 44b (Opus, est ~3–4 weekly, ~1.5 h).
