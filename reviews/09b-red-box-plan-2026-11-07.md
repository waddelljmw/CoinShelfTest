# Red box plan: nested containers (planned Sat 2026-11-07, Opus; not built)

Recovered from the 2026-11-07 chat so it lives in the repo. Input for the saved-data blueprint (session 54).

## What's in the red box (from his photos)
```
Red lock box (metal, red, key)
├─ Fringe Benefit box (Blacksburg) ... Canadian gold coins
├─ Kohl's box "Gold Coins" ........... Canadian gold coins
├─ 1885 Morgan ........ in square capsule
├─ Golden State Mint 1 oz .999 round ... in plastic sleeve
├─ Bag with receipt ($84.59) ... coin(s) inside
├─ Littleton Coin Co bags ...... coin(s) inside
├─ Big ziplock
│   ├─ Small bag, marker writing
│   ├─ Small bag, marker writing
│   └─ Folded paper money (not a coin; skip for now)
├─ Halves bag: ~15 loose Kennedy halves + cardboard 2x2s (#13, 1967...)
├─ 2024 Silver Eagle ... capsule on COA card
├─ Cheerios 2000 cent .. sealed on its card
└─ Round in white 2x2
```
Junk-bag note (complete): two Kennedy half bags of different silver content nested in one bag; a Mercury dimes bag inside a bag that also holds loose Roosevelt dimes.

## The idea
- **Any container can sit inside another, no depth limit.** Bags, jewelry boxes and the red box are all storage records with an optional "Kept in" (another container).
- **Reuse `keptBox`:** albums and pocket albums already save which box they sit in. Let storage boxes use the same field; no new field name. Old data and backups keep working.
- **A coin's place is its innermost container.** Its holder (flip, 2x2, capsule, card) stays in Holder. Coin > holder > bag > red box.
- **Coin page shows the path:** "Red box › Big ziplock › Small bag 1".
- **Container page:** "Inside this" (containers) then its coins. Count and value include everything inside, all levels (same code as bug #4).
- **Safety:** no loops (a container can't go inside itself or its own child). Deleting a container moves its contents up one level; never deletes coins.
- **Kept in dropdown:** nested ones indented under their parent. Making a new container on the spot reuses the existing **"+ Add storage…"** wording. **Never say "bag"** on buttons (containers can be anything).
- **Look:** add a "Metal" look + red for the lock box (IDEAS 41).
- **Bag of identical coins:** existing "How many?" with Kept in = that bag. No new feature.

## Decided by him (2026-11-07)
- **Stack AND container:** a junk silver coin keeps its stack (why he collects it) and also gets a container (where it is). Counts once in totals. **This changes how coins are saved; approved.**
- Canadian gold goes in through the "Other coin" work (or as bullion if Maple Leafs).
- Cheerios 2000 cent: a variety of the 2000 Lincoln cent (PCGS "Cheerios Cent" #515762), data only. Keep it sealed.
