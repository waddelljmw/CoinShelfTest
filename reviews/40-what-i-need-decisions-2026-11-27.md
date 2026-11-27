# Step 43: "What I need" (Shopping view) — decisions locked 2026-11-27

Talk-and-sketch step (no code). Covers ideas 99 (want-list picker), 100 (wanted vs upgrade apart), 101 (missing view like albums), 103 (album as shopping tool), 105 (tap a coin, eBay sold), 129 (vertical cards), 133 (select coins for upgrade), 159 (tap a want row for its card) and his notes (Upgrade vs New tag, no side-scroll, grade-or-better).

## Decisions (his OK in chat)
1. **Name and place:** "What I need" replaces the Want List page (menu item renamed). Home gets a "What I need" button under the Search any coin box. Not "Shopping" (sounds like in-app buying); not "hunt" (clashes with the Coin roll hunting source).
2. **Two tabs:** *Albums* (built by itself from album gaps + upgrades, album order) and *Lists* (existing want lists, unchanged, for coins not tied to an album). Nothing deleted; hand-made album lists stay until he removes them.
3. **Rows:** year-mint, tag **Need** (green) or **Upgrade** (blue, "have VF-20"), target shown as "AU+" (grade or better), **pay up to** price, **eBay sold** link always shown. Search box on top ("1949 S"), filter chips All / Need / Upgrade / Album. No side-scroll; album cards stacked and collapsible.
4. **Priority:** star on a row moves it to a Priority section at the top (like Home shelf Pin to top); tap again to put it back. No dragging.
5. **Coin card on tap:** You own line, target, "Pay up to $45 (edit)" or "Pay up to… (not set)", eBay sold, Bought it, Open in album.
6. **Old price hint:** when pay-up-to is older than 3 months, the row shows "6 mo old" in faint orange.
7. **Upgrades, both ways:** (a) existing per-coin Upgrade tick + Select many › Want upgrade (idea 133); (b) NEW album setting "Aim for: AU-50 or better" — every coin below it shows Upgrade by itself, empty spots show "Need AU+". A VF-20 bought for an empty spot fills it and shows Upgrade until replaced.
8. **Left alone:** Inherited coins never count toward the target. Original-to-album (not inherited) coins are left alone by default; one album switch "Upgrade original coins too" (off) turns them on.

## Saved-data changes (Opus plan + his OK before build)
- Album: target grade, "upgrade original coins too" switch.
- Want item: priority yes/no, date pay-up-to was set. Pay up to on an empty album spot = a want item for that spot (same kind Add missing makes); it must go away when the spot fills (dropSpotWants already does this).
- Nothing existing is rewritten.

Next: step 43b plan + build (Opus, ~3 weekly, ~1.5 h).
