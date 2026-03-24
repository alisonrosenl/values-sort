# CLAUDE.md — Values Tool

## Project Context
**Property:** Values Tool — interactive values card sort for self-employed women
**Live URL:** values.alisonrose.nl
**Stack:** React + Vite, deployed to GitHub Pages
**Stage:** Active Development — landing page is a fresh build, tool is being iterated
**User Level:** Vibe-coder (AI writes all code, user edits designs)

---

## Directives
1. **Brand first:** Read brand asset paths and color tokens below before writing any UI code
2. **Plan before building:** Propose a plan and wait for approval before implementing
3. **One feature at a time:** Test before moving on
4. **Mobile-first:** Build for phone screens first, desktop second
5. **Explain your decisions:** Say what you're doing and why
6. **Voice rules apply to all copy:** See voice rules below
7. **Landing page is a fresh build:** Do not preserve or reference the old landing page design

---

## Project Structure
```
/
├── src/               React components and logic
├── public/            Static assets including fonts
├── dist/              Build output — do not edit
├── CLAUDE.md          This file
└── AGENTS.md          Current project state and priorities
```

---

## Key Commands
- `npm run dev` — Start local dev server
- `npm run build` — Build for production
- `npm run lint` — Check code style
- `npm run preview` — Preview production build locally

**Deploy:** Push to GitHub — GitHub Pages builds automatically from the repo.

---

## Brand Asset Paths (Local — Windows)

```
Fonts:
  Quincy CF:              C:\Users\Alison Rose\Dropbox\AlisonCastillo\Alison Rose Claude\Alison Rose Brand Guidelines\Quincy CF\
  Lumios Typewriter Used: C:\Users\Alison Rose\Dropbox\AlisonCastillo\Alison Rose Claude\Alison Rose Brand Guidelines\lumios-typewriter-font\

Logos:
  AR wordmark (PNG):      C:\Users\Alison Rose\Dropbox\AlisonCastillo\Alison Rose Claude\Alison Rose Brand Guidelines\Alison Rose Logo NamePrintSmall.png

Brand reference:
  AlisonRoseBrand.md:     C:\Users\Alison Rose\Dropbox\AlisonCastillo\Alison Rose Claude\Alison Rose Brand Guidelines\AlisonRoseBrand.md
  UX/UI patterns:         C:\Users\Alison Rose\Dropbox\AlisonCastillo\Alison Rose Claude\Alison Rose Brand Guidelines\uxui\SKILL.md
```

Work Sans loads from Google Fonts CDN:
`https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600&display=swap`

Quincy CF and Lumios Typewriter Used are local — copy into `public/fonts/` for runtime use.

---

## Color Tokens

Values Tool matches the In Alignment design system — teal family as primary surface, mustard as primary accent.

```css
--white:      #FFFFFF
--off-white:  #F8F8F6
--ink:        #1A1916
--rule:       #E2E0DC

/* Sage — decorative only. Never use --sage as text or label color. */
--sage:       #7A9E94
--sage-light: #EBEFEE

/* Mustard — primary accent */
--mustard-light: #F0E4CC
--mustard:       #9F6C26
--mustard-dark:  #8A5C1C   /* restricted: text on --mustard-light only */

--rose-light: #F2E0D6
--rose:       #93493E

--fig-light: #EAE0E6
--fig:       #6B4D5E

--teal-mid:  #1E4457
--teal:      #152E3A

/* Text tokens — two levels only */
--ink:                  #1A1916  /* all body copy, headings, UI text */
--color-text-secondary: #4A4845  /* subtitles, dates, metadata, captions */
```

---

## Typography

| Role | Font | Weights |
|------|------|---------|
| Headlines H1–H3 | Quincy CF | Bold, Bold Italic |
| Body / UI / Buttons / Nav | Work Sans | 300, 400, 500 |
| Labels / Stamps / Eyebrows | Lumios Typewriter Used | Regular |

**Rules:**
- Body/UI minimum: **13px**. No exceptions.
- Stamps, eyebrows, micro-labels: **11px minimum**.
- Full opacity on all text. Use a lighter color token instead of reducing opacity.
- Playfair Display is retired. Never use it.
- Logo fonts stay in logos only.

---

## Corner Radius

| Element | Radius |
|---------|--------|
| Eyebrow labels | 0px |
| Inputs | 4px |
| Buttons | 6px |
| Cards / panels | 8px |
| Featured cards / modals | 12px |
| Image containers | 16px |
| Pills / chips / filters | 999px |

---

## Spacing

Base unit: 8px. All spacing values are multiples of 8 (4px for optical nudges only).

| Token | Value |
|-------|-------|
| --space-xs | 4px |
| --space-sm | 8px |
| --space-md | 16px |
| --space-lg | 24px |
| --space-xl | 40px |
| --space-2xl | 64px |

Hero/page-level breathing room: 96–120px (explicit values, no token).

---

## Responsive Breakpoints

| Breakpoint | Use |
|------------|-----|
| 900px | Hero sections stack vertically |
| 768px | Mobile layout — primary threshold |
| 640px | Header/footer reflow |
| 600px | Small phone adjustments |

---

## Z-Index Scale

Do not introduce values outside this scale without documenting them.

| Layer | Value |
|-------|-------|
| Landing header | 100 |
| Scroll-to-top button | 100 |
| Nav dropdown | 200 |

---

## Shadow Tokens

Cards use borders, not shadows. Shadows for lifted/floating states only.

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);
--shadow-md: 0 2px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
--shadow-lg: 0 4px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06);
```

---

## Semantic Color Tokens

| Token | Value | Use |
|-------|-------|-----|
| --color-bg | #F8F8F6 | Page background (alias for --off-white) |
| --color-surface | #FFFFFF | Card/panel surface (alias for --white) |
| --color-border-light | #ECEAE6 | Softer divider than --rule |
| --color-error | #93493E | Error states (same value as --rose) |
| --color-text-secondary | #4A4845 | Supporting text, metadata, captions |

---

## Button Variants

Base: Work Sans 500, 14px, 40px min height, 12px 24px padding, 6px radius. Disabled: opacity 0.5, cursor not-allowed.

| Variant | Style |
|---------|-------|
| .btn-primary | --mustard fill, white text |
| .btn-secondary | 1px --ink border, --ink text |
| .btn-ghost | No border, --rose or --mustard on hover |
| .btn-danger | --rose border + text, fills --rose on hover |
| .w-btn-ghost | White text + white border — dark surfaces only |

---

## Animations & Transitions

Standard transitions: `0.2s` color/border/shadow · `0.15s` links · `0.12s` dropdown hover.

Easing tokens:
```css
--ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-reveal:  cubic-bezier(0.16, 1, 0.3, 1);
```

---

## Max-Width System

| Value | Use |
|-------|-----|
| 560px | Modals, footer inner, focused prose |
| 680px | `--max-width` default — general sections |
| 860px | Landing page hero and nav |

---

## Rules
- All colors via CSS tokens — no hardcoded hex values
- One column form layouts always
- Labels above fields, never as placeholders
- Mobile viewport tested before marking any feature complete
- No heavy drop shadows
- No full-saturation color fills as large background areas
- Icons: flat, clean SVG style (Flaticon aesthetic as reference). Inline SVG implementation. No emojis in UI.
- Contrast standard: WCAG AA (4.5:1 body, 3:1 large text)
- Input focus: border becomes --mustard + `box-shadow: 0 0 0 3px rgba(159,108,38,0.12)`
- Error: `.form-error` — Work Sans 400, ~13.6px, --color-error
- Progress bars: fill `--mustard`, track `--rule` 4px fully rounded. Never `--teal-mid` or hardcoded values.
- Colored box-shadows allowed in color-coded interactive contexts (drag targets, pile indicators). Keep opacity ≤ 30%.
- Footer background inherits page background. Landing page footer: #FFFFFF. Does not override.
- Footer: all text --ink, links --mustard only. No social icons in footer.
- Sage eyebrow/tag text: always `--teal-mid`. Never `--ink`.

---

## Retired Tokens — Do Not Use

- `--sage-mid` (#4E7A70) — retired. Remove from code.
- `--fig-dark` (#4A3342) — retired. Remove from code.
- `--ink-secondary` — retired alias. Use `--color-text-secondary` (#4A4845) everywhere.

---

## Voice Rules (apply to all generated copy)

- No em dashes. Use a comma, a period, or restructure.
- Define things by what they are. Never describe by contrast with what something is not.
- No "actually," "genuinely," "honestly," or "straightforward."
- Positive framing only. No defensive, rescue, or corrective language.
- Lead with a specific felt experience before naming the cause or solution.
- No coaching posture. Copy observes, reflects, and invites.
- Casual and specific tone. Specificity is warmth.
**Voice:** Read VOICE.md before writing any copy — reference path: C:\Users\Alison Rose\Dropbox\AlisonCastillo\Alison Rose Claude\Alison Rose Brand Guidelines\VOICE.md
