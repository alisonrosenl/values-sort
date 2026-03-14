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

--terra-light: #F2E0D6
--terra:       #965443

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
- Minimum font size: 13.3px (10pt). No exceptions.
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

---

## Rules
- All colors via CSS tokens — no hardcoded hex values
- One column form layouts always
- Labels above fields, never as placeholders
- Mobile viewport tested before marking any feature complete
- No heavy drop shadows
- No full-saturation color fills as large background areas
- Flaticons only for icons — no emojis in UI
- Shadows follow brand only: `0 2px 8px rgba(26,25,22,0.06)` on lifted cards only
- Contrast standard: WCAG AA (4.5:1 body, 3:1 large text)

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
