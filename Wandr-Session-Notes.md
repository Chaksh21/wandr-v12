# v12 — Session Notes (context for future work)

Covers everything changed in this session beyond the original Figma-exported prototype.
Files: `Wandr-App.dc.html` (mirrored byte-for-byte to `index.html` for GitHub Pages — **every
HTML edit must be copied to both**), `wandr-features.js`, `wandr-flow.js`, `wandr-logic.js`,
`wandr-styles.css`, `assets/illustrations/`.

Live: https://chaksh21.github.io/wandr-v12/ — deploys via GitHub Actions on push to `main`.
Pages deploy step is flaky ("Deployment failed, try again later") independent of code — just
rerun the failed workflow run, it's transient on GitHub's side.

---

## Setup funnel — current shape

Two independent funnels, each with its own `suProgFor` stepper (no shared numbering):

**Funnel 1 — "ABOUT YOU" (quiz, `s2`)** — 4 sub-questions inside one screen, stepped via
`st.qzStep` (0–3): name → pace → style → spend. Progress shown as `0X/04`.

**Funnel 2 — "ABOUT TRIP"** — starts after the intent-picker (`s3`, no stepper — just back+X),
only entered via the "Plan a trip" card. 6 steps, same denominator for both import and scratch
paths (the old per-path step divergence was removed):

| Step | Screen | What |
|---|---|---|
| 1 | `s4` | Destination search |
| 2 | `s4b` | Trip name + dates (group name field was removed here — see below) |
| 3 | `sPeople` | Who's coming — friend toggles + headcount stepper |
| 4 | `s5` | Import-a-booking vs just-give-an-itinerary |
| 5 | `s6` | Swipe deck ("Pick what excites you") |
| 6 | `s12` | Pick & lock a draft |

`s8` (trip-complete) is **not** a stepped screen anymore — just a confirmation, no progress bar.

### Screens that were removed entirely this session
- **`s3b`** ("Name your group") — folded into `s4b` briefly, then the group-name field itself
  was removed per later feedback (kept `suGroupName` state/plumbing harmless-but-unused; trip
  object still has a `groupName` field defaulting to `null`, surfaced conditionally in the group
  screen's `headerSub` if ever populated again).
- **`s5a`** ("Confirm your trip details" / booking-found full screen) — folded into a **popup**
  triggered from `s5`'s "Import a booking" card (`suImportOpen` boolean, not a `suScreen` nav).
  Only shows the Hotel field now (destination/dates rows and the "LOW CONFIDENCE" tag were cut).
  Import card itself now only shows a PDF chip (Gmail/Outlook chips removed); tapping opens a
  hidden `<input type=file>` via a `<label for=...>` (no real parsing, just a picker for show).
- **`s7`** ("Building your draft…" transient loading screen) — removed. `s6`'s CTAs now nav
  straight to `s12`. The old auto-advance timer (`this._s7 = setTimeout(...)`) is still in
  `componentDidMount` but is inert/unreachable — harmless dead code, not cleaned up.

### `sPeople` — who's coming (real funnel step, not a post-hoc modal)
Originally built as an editable roster (rename inputs, blank "+Add person" rows) reached only
from the trip-complete screen's "Invite your group" button. Redesigned twice this session:
1. Moved to be its own numbered step, right after dates (was briefly after "lock draft", per
   user's initial ask, then moved earlier per follow-up: "we haven't added members and that
   step is nowhere to be found").
2. Simplified to **only** two inputs: toggle chips for the 5 hardcoded `FRIENDS` (people already
   "on Wandr" — instant include, not editable/nameable), and a +/− stepper (`suExtraCount`) for
   headcount not on the platform. No free-text add, no rename, no per-row remove.

**Bug fixed:** `suMembers` used to reseed as a copy of the *entire* `MEMBERS` array (which still
had the 3 default demo people — Aanya/Rohit/Dadi — baked in from `wandr-logic.js`), so picking
3 friends showed 7 total. Fixed to seed as `MEMBERS.filter(m=>m.id==='me')` — only yourself,
every reset site (11 occurrences, `suMembers: MEMBERS.filter(...)`, grep for the literal string
if adding a new one).

`peopleDone` commits into the **real global `MEMBERS` array** (mutates in place —
`MEMBERS.length=0; MEMBERS.push(...)`), then manually recomputes `APP_MEMBERS`/`ALL_COUNT`/
`APP_COUNT` right after, because those three are one-time `var` computations in
`wandr-logic.js` (not getters) and go stale otherwise. This is the one sharp edge in the whole
member system — if you add a new place that reads member count, it just reads the global
`ALL_COUNT`, no changes needed, but if you ever mutate `MEMBERS` again elsewhere you must also
recompute those three.

### Trip-complete screen (`s8`)
- No stepper (removed `progLabel`/`progPct` header row, just an X to close).
- Removed the "LOCKED · <draft name>" tag chip.
- Trip code chip is now tap-to-copy (`copyCode` handler, `navigator.clipboard.writeText`,
  wrapped in try/catch since clipboard access can silently reject in some embedded contexts).
- Illustration replaced with a filled green Phosphor `check-circle-fill` in a white circle with
  a soft green box-shadow (was a PNG, `ill_success_trip_synced.png` — that asset is now unused
  here but still on disk).
- Buttons pinned to the bottom (`margin-top:auto` wrapper) — "Invite your group" is primary
  (orange), "View itinerary" secondary (outline). `invite` now directly copies a fake invite
  link (`wandr.app/join/<code>`) and toasts — it no longer navigates anywhere (earlier version
  routed to `sPeople` for editing, removed once membership moved earlier in the funnel).

### Swipe deck (`s6`) footer, bottom to top
1. Skip / Bookmark row (always last, closest to the bottom edge).
2. "Skip to building a plan" — secondary/ghost button, shown only while `dkShowDone` (some
   cards already bookmarked but deck not finished) — sits *above* the Skip/Bookmark row.
3. Undo was removed entirely (`dkUndo`/`dkCanUndo` no longer rendered).
Both "Skip to building a plan" and the post-deck "Build my plan" (`dkDone` state) now nav to
`s12` directly (was `s7`).

### Lock & pick draft (`s12`) card layout
Redesigned per explicit spec:
- Radio-style selection circle top-left, next to the theme heading (was top-right, and used to
  double as a checkmark at the bottom-right of the card).
- Rating stays top-right.
- A "running line" under the heading/blurb: `"N stops · ₹X,XXX total"` (replaces the old
  3-column STOPS/PER PERSON/GROUP OF N footer stat block).
- Photo strip caps at 4 tiles: if a draft has more than 4 stops, the 4th tile is a dark
  `rgba(36,31,26,.62)` overlay showing `+N` — and does **not** show the place name label
  underneath (was barely legible at that tile size; `nameDisplay:'none'` on that one preview
  item only, others still show their name).
- Bottom row: "BEST FIT FOR YOU" badge (left, only for the recommended draft) and the
  **highlighted** per-person price (right) — same row, opposite ends. (There was a layout bug
  here: when the badge was `display:none` for non-best drafts, the price — the only remaining
  flex child — collapsed to the *left* under `justify-content:space-between` since there was
  nothing to space it against. Fixed by making price the first child unconditionally.)
- Lock CTA label simplified to `"Lock <draft name>"` — no arrow, no "→ view trip".
- "ABOUT TRIP" kicker added (was missing).

### Progress-bar/header standardization (earlier in the session, still in effect)
Every stepped screen shares one header pattern: back-button → `{{ progLabel }}` + fill bar
(`{{ progPct }}`) → exit-X (`exitSetupAsk`, opens an "Abandon this trip?" confirm dialog — this
was built once and is reused everywhere, don't rebuild it). `suProgFor` in `wandr-flow.js` is
the single source of truth for step numbers — screens must have **distinct** step numbers if
they're reachable via back/forward navigation, otherwise back-navigation looks like it did
nothing (this bit us once with `s7`/`s12` sharing a number before `s7` was removed outright).

---

## Illustrations

`assets/illustrations/` mixes real art and 69-byte placeholder PNGs (still present for a few
slots — bookmark-empty, inbox-empty, curated-theme-classic, group-empty — nobody's generated
those yet, don't assume every filename has real content, check file size before wiring one in).
Two files had a stray backtick in their name from an export glitch (`ill_packing_empty\`.png`,
`ill_quiz_pace_balanced\`.png`) — renamed to the correct names, they contained the real art that
was previously invisible.

Landscape illustrations (1100×600 or similar) were originally force-fit into small square
`<img>` boxes with `object-fit:contain`, which shrank them to a sliver with lots of dead
padding (this is the "aspect ratio seems odd" bug — check any new illustration wiring against
its actual dimensions with `file <path>.png`, don't assume square).

`Splash.png` (large, ~9.4MB, user-supplied) currently lives on the **auth welcome screen**
(after splash, first screen you see if not authed) — it was tried on the splash screen itself
first, then explicitly moved per feedback ("wrong place... remove it from the orange screen").
The splash screen itself (`viewSplash`, orange `--accent` background) is text-only: wordmark +
tagline, animated zoom-in + continuous bob (`wandrSplashZoomIn`/`wandrSplashBob` in
`wandr-styles.css`), zoom-out-and-fade exit (`wandrSplashTextZoomOut`, scale 20, 600ms) before
handing off to auth/home. Timers live in `componentDidMount` (`this._splashT`/`this._splashT2`).

---

## Phosphor icon gotchas

`ICONS` in `wandr-logic.js` is a flat `{name: 'svg path'}` map. Two real bugs found this
session, both worth checking for elsewhere if an icon looks "off" or "generic":
1. **Truncated path** — the trip-overview share button had a hand-typed inline path missing the
   three circle-node subpaths of `share-network`, so it rendered as a blob instead of the
   familiar 3-dot share glyph. Fixed by exposing `icShareNetwork: ICONS['share-network']` in
   `wandr-features.js` and referencing `{{ icShareNetwork }}` instead of an inline path — prefer
   this pattern (name the icon, reference by variable) over pasting raw path strings inline,
   it's much harder to silently truncate.
2. **Size/weight mismatch** — the setup-funnel back arrow and the exit-X used different circle
   sizes (38px vs 34px) and different icon sizes (18px vs 14px) even though they're the same
   Phosphor family — looked like "different icon sets" from a distance. Standardized both to
   38px circle / 18px icon.

---

## Illustration/asset folders
- `assets/illustrations/welcome/` — empty except `.gitkeep`, created for future post-splash art
  drops, nothing wired to it yet.
- `Splash.png` also copied to the project root (`v12/Splash.png`) per explicit request, in
  addition to `assets/illustrations/Splash.png` — the root copy isn't referenced by the app,
  it's just there because it was asked for.

---

## Misc fixes worth knowing about
- `.DS_Store` files got swept in by a `git add -A` at one point — removed, `.gitignore` added.
- Mobile double-scroll bug: `body` had no fixed height, so `100dvh` rounding on real devices
  could make it taller than the viewport, scrolling both `body` and the inner `.wandr-app`
  simultaneously. Fixed with `html,body{height:100%;overflow:hidden}` and making `.wandr-gallery`
  the single scroll container.
- Desktop preview: the phone-frame card had no visible border, so on wide desktop browsers
  content padded to the bottom of a `min(956px,100dvh)` box looked like it was floating
  mid-page with dead space below. Gave the card a shadow/radius and a grey gallery backdrop.
- Quiz "spend" question used to have `suBudget:'comfort'` as its initial value, so "Balanced"
  showed pre-selected before the user touched anything — changed default to `''`.
