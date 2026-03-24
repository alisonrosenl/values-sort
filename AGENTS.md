# AGENTS.md — Values Tool Project State

## What's Live
- Landing page: SiteNav → Hero (inline email form) → SiteFooter
- 2-round flow: GridSortScreen (Round 1, 56 cards, 7 batches of 9) → Top5Screen → ResultsScreen
- 56 values (49 original + 7: Acceptance, Non-conformity, Dependability, Courage, Loyalty, Self-control, Tolerance)
- Drag-to-zone mechanic with floating tray fallback (tap-to-select + sort buttons)
- Floating tray doubles as batch-advance control when batch is complete
- SiteNav (Values Card Sort wordmark + Resources + Contact) renders on all screens
- SiteFooter renders on all screens
- Shareable URL, download image (canvas), and Kit email subscription all live
- Results screen: numbered top 5 (Quincy CF, terra-light numbers), tensions, RCC promo, 3-col breakdown
- Color token: `--rose` / `--rose-light` (renamed from terra)
- Lumios Typewriter Used font loaded from `public/fonts/`

## Current Branch
- `claude/great-goldberg-bqvZ6` — needs merging to main for GitHub Pages deploy

## Known Loose Ends
- `public/sort-preview.png` — unused file, safe to delete
- Old `lp-footer` CSS still in App.css — dead, safe to remove
