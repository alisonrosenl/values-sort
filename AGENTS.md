# AGENTS.md — Values Tool Project State

## What's Live
- Landing page: Nav → Hero (with inline email form) → Footer — untouched
- 3-round grid sort tool: Round1Screen → Round2Screen → (Round3SortScreen if >10) → Top5Screen → ResultsScreen
- 56 values (49 original + 7 new: Acceptance, Non-conformity, Dependability, Courage, Loyalty, Self-control, Tolerance)
- 7 batches of 8 cards per batch in Round 1; batching also applies to Round 2 if >8 cards
- Drag-to-zone mechanic with tap-to-select fallback (pill buttons)
- Zone chip lists accumulate across all batches
- "Next batch" button replaces continue when a batch is done but more remain
- Shareable URL and download image features preserved (ResultsScreen untouched)
- Lumios Typewriter Used font loaded from `public/fonts/`

## Current Priorities
- QA pass on full flow (nav + footer consistent across all screens)

## Known Loose Ends
- `public/sort-preview.png` — unused file, safe to delete
