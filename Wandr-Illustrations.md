# Wandr — Illustration System

Style inspired by Airbnb's illustration language, tuned for Gemini 2.5 Flash Image (Nano Banana) generation. Every prompt in this file is drop-in for Nano Banana.

---

## 1. Global style tokens

Paste this block at the top of every prompt (Nano Banana responds well to explicit style scaffolding).

```
STYLE:
- 2D vector illustration, flat with subtle depth
- Soft rounded organic shapes, no hard black outlines
- Warm gradient fills (2-3 stops), tiny grain/noise for texture
- Muted warm palette (coral, terracotta, cream, moss, deep ink)
- Diffused warm-dusk lighting; soft drop shadows, no harsh contrast
- Chunky friendly proportions if characters present (Airbnb Bélo family feel)
- Slight painterly imperfection, hand-drawn charm
- Transparent background (or cream #F1F0EE if bg required)
- Aspect ratio: [SPECIFY per illustration]
- No text, no logos, no watermark, no photorealism, no 3D render
```

## 2. Palette (locked to app tokens)

| Token             | Hex        | Role                        |
| ----------------- | ---------- | --------------------------- |
| Coral (primary)   | `#FF5A1F`  | Hero accents, CTAs          |
| Coral wash        | `#FFE9DF`  | Backgrounds, halos          |
| Terracotta        | `#B0451A`  | Shadow / secondary warm     |
| Cream (canvas)    | `#F1F0EE`  | Illustration background     |
| Warm ink          | `#241F1A`  | Character features, anchors |
| Warm grey         | `#6B6358`  | Mid-tones                   |
| Moss              | `#2E4034`  | Foliage, calm anchors       |
| Sand              | `#E8DFCC`  | Ground, sky wash            |
| Sky blue          | `#B8D3D8`  | Sky, water                  |

Use max 5 colors per illustration. Cream is the default background.

## 3. Character system

If people appear:
- Chunky torsos, small heads, rounded limbs, no fingers/toes detail
- Skin tones: warm range #E8B99B, #C68A66, #8A5A3E, #5B3924
- Hair: solid warm blocks, no strand detail
- Expression: soft eyes (dots or short curves), gentle smile
- Clothing: 1-2 blocks of color, no logos
- Diverse: rotate age, ability, body type, skin tone across illustrations

## 4. Composition rules

- Single focal object / person / vignette per illustration
- Airy negative space (35-50%)
- Foreground layer, mid layer, subtle background layer (parallax feel)
- Depth via overlap + soft shadow, not perspective lines
- Circular / bloblike halo behind subject in coral wash

---

## 5. Illustration catalogue

Each entry: **ID / location / purpose / aspect / prompt**.

Prompt = paste global style tokens above, then this block.

### `ill_empty_no_trips`

- **Where**: Home → guest / no-trips empty state (replaces `🧭` compass emoji)
- **Purpose**: encourage first trip creation, warm and inviting
- **Aspect**: 1:1, 320×320 render target
- **Prompt**:

```
Illustration of a small vintage travel compass resting on a soft rumpled map, top-down 3/4 view. Compass has a coral needle pointing to the upper right. Around it, tiny scattered elements: a folded paper plane, a coffee cup with steam, a leaf, a route line dotted from lower-left to upper-right ending in a coral pin. Warm cream background with a soft coral halo behind the compass. Palette: coral #FF5A1F, cream #F1F0EE, warm ink #241F1A, sand #E8DFCC, moss #2E4034. Inviting, quiet-adventure mood.
```

### `ill_splash_wordmark_backdrop`

- **Where**: Splash / welcome screen behind Wandr wordmark
- **Purpose**: brand intro, warm and grounded
- **Aspect**: 3:4 portrait, 900×1200
- **Prompt**:

```
Abstract landscape illustration: layered rolling hills and one small mountain silhouette, warm-dusk gradient sky in coral and cream, a single figure in silhouette on the tallest ridge with backpack, tiny birds, sun disc as a solid coral circle low on horizon. No wordmark. Large negative space in upper third for text overlay. Palette locked to coral #FF5A1F, cream #F1F0EE, sand #E8DFCC, moss #2E4034, terracotta #B0451A. Calm optimistic mood.
```

### `ill_search_empty`

- **Where**: Place search results screen when query returns 0 results
- **Purpose**: soften dead-end, invite different query
- **Aspect**: 1:1, 280×280
- **Prompt**:

```
Illustration of a chunky rounded magnifying glass held by a smiling character wearing a knit beanie, peeking through the lens at nothing (empty circle). One eyebrow raised, curious not sad. Loose sketch marks around lens hinting at movement. Warm cream background, coral halo behind character. Palette: coral #FF5A1F, cream, warm ink, warm skin #C68A66. Playful, not disappointing.
```

### `ill_bookmark_empty`

- **Where**: Bookmarks / shortlist view when empty
- **Purpose**: nudge saving without guilt
- **Aspect**: 1:1, 280×280
- **Prompt**:

```
Illustration of a lone paper bookmark tag with a small coral ribbon, floating gently at a tilt. Behind it, a soft cluster of little travel icons in cream outlines: mountain, palm tree, compass, coffee cup - all faded and non-focal. Palette: coral #FF5A1F for ribbon, cream body, warm ink outline. Warm minimal mood.
```

### `ill_group_empty`

- **Where**: Group / decisions tab when no group yet
- **Purpose**: nudge inviting a group
- **Aspect**: 4:3, 480×360
- **Prompt**:

```
Illustration of three chunky rounded characters sitting cross-legged in a loose triangle around a shared map on the floor, each pointing at a different spot. Two are chatting, one is smiling and pouring tea. Warm rug beneath in coral. Cream background. Diverse skin tones (#E8B99B, #C68A66, #8A5A3E). Palette locked. Cozy planning-together vibe.
```

### `ill_packing_empty`

- **Where**: Packing list empty state
- **Purpose**: playful reminder to start
- **Aspect**: 1:1, 280×280
- **Prompt**:

```
Illustration of an open duffle bag from a 3/4 top angle, cream fabric with coral piping, one folded t-shirt and a pair of socks inside. A small toothbrush and a book resting on top waiting to go in. Soft shadow beneath. Palette: cream bag, coral accents, warm ink details, sand ground. Friendly not overwhelmed mood.
```

### `ill_budget_empty`

- **Where**: Budget view when no expenses tracked
- **Purpose**: cheerful start
- **Aspect**: 1:1, 280×280
- **Prompt**:

```
Illustration of a rounded coin purse tipping slightly open, three chunky coins with warm faces on them tumbling out mid-air. One coin has a small smile. Coral drawstring. Cream background, warm coral halo. Palette: coral, warm gold #E4A85B, cream, warm ink. Cheerful money mood, not corporate.
```

### `ill_inbox_empty`

- **Where**: Inbox / notifications when none
- **Purpose**: signal calm, not neglect
- **Aspect**: 1:1, 240×240
- **Prompt**:

```
Illustration of a small rounded bell resting on a soft cushion, one tiny leaf beside it, a single Zzz floating above in a subtle coral bubble. Palette: cream bell, coral pillow, warm ink details, moss leaf. Restful mood.
```

### `ill_join_via_code`

- **Where**: Join trip via code screen
- **Purpose**: convey group welcome
- **Aspect**: 4:3, 480×360
- **Prompt**:

```
Illustration of a hand from off-canvas holding out a folded paper card with a small coral trip-code pattern on it, another hand from opposite side reaching to receive. Both hands in warm skin tones, sleeves in cream and moss. Small confetti dots (coral, sand) between them. Palette locked. Welcoming handoff mood.
```

### `ill_signup_persona_planner`

- **Where**: Auth / persona step, "The planner" option art
- **Purpose**: personify the persona
- **Aspect**: 1:1, 200×200
- **Prompt**:

```
Illustration of a rounded character sitting at a small desk with three sticky notes fanned out, one pinned map, and a coral coffee cup. Focused warm smile. Warm skin #C68A66. Cream background, coral desk. Palette locked. Organized-happy mood.
```

### `ill_signup_persona_floater`

- **Where**: Auth / persona step, "The floater"
- **Aspect**: 1:1, 200×200
- **Prompt**:

```
Illustration of a rounded character lying back on a coral pool floatie with one hand trailing in cream water ripples, sunglasses on, small palm frond hovering. Warm skin #8A5A3E. Palette locked. Easy-going mood.
```

### `ill_signup_persona_spark`

- **Where**: Auth / persona step, "The spark"
- **Aspect**: 1:1, 200×200
- **Prompt**:

```
Illustration of a rounded character mid-jump with arms raised, a small coral spark burst behind them, one shoe untied and floating. Warm skin #E8B99B. Palette locked. Playful-impulsive mood.
```

### `ill_quiz_pace_slow`

- **Where**: Setup quiz, pace step, "Slow & soft" option
- **Aspect**: 1:1, 180×180
- **Prompt**:

```
Illustration of a small snail with a coral spiral shell on a moss leaf, tiny steam trail from a coffee cup beside it. Cream background. Palette locked. Slow-morning mood.
```

### `ill_quiz_pace_balanced`

- **Aspect**: 1:1, 180×180
- **Prompt**:

```
Illustration of a chunky rounded character mid-stride walking with a small backpack, one hand in pocket, other holding a coffee. Warm skin. Coral shoes. Cream background. Palette locked. Comfortable pace mood.
```

### `ill_quiz_pace_packed`

- **Aspect**: 1:1, 180×180
- **Prompt**:

```
Illustration of a small rounded character sprinting with three tiny arrows behind them (motion lines) and a camera bouncing on strap. Coral shoes, cream shirt. Warm skin #C68A66. Palette locked. Energetic packed mood.
```

### `ill_quiz_budget_shoestring`

- **Aspect**: 1:1, 180×180
- **Prompt**:

```
Illustration of a single warm-gold coin balanced on a fingertip, a tiny character beside it beaming. Cream background. Palette locked. Frugal-proud mood.
```

### `ill_quiz_budget_comfort`

- **Aspect**: 1:1, 180×180
- **Prompt**:

```
Illustration of a rounded ceramic coffee cup with soft steam curl, one small biscuit on the saucer, a coral napkin folded beside. Cream background. Palette locked. Sensible-treat mood.
```

### `ill_quiz_budget_splurge`

- **Aspect**: 1:1, 180×180
- **Prompt**:

```
Illustration of a small rounded champagne flute with two sparkles above the rim, coral bubbles rising. Cream background. Palette locked. Celebratory mood.
```

### `ill_curated_theme_classic`

- **Where**: Curated itinerary preview hero (when photo not available)
- **Aspect**: 3:2, 720×480
- **Prompt**:

```
Illustration of a colonial-style clock tower on a hilltop with pine trees around, gentle warm-dusk sky, one small figure walking a dotted route toward it. Palette locked. Balanced-classic mood.
```

### `ill_curated_theme_chill`

- **Aspect**: 3:2, 720×480
- **Prompt**:

```
Illustration of a hammock strung between two palm silhouettes, cream sand foreground, sun disc coral low on horizon, one small figure in the hammock reading. Palette locked. Coastal-chill mood.
```

### `ill_curated_theme_adventure`

- **Aspect**: 3:2, 720×480
- **Prompt**:

```
Illustration of a river gorge with a rope bridge, one small backpacker mid-crossing, moss cliffs, warm sky. Palette locked. Grounded-adventure mood.
```

### `ill_live_alert_weather`

- **Where**: Live view weather heads-up card
- **Aspect**: 1:1, 200×200
- **Prompt**:

```
Illustration of a small cloud with two coral raindrops beneath, one warm-sun disc peeking behind. Cream background. Palette locked. Heads-up not alarming mood.
```

### `ill_success_trip_synced`

- **Where**: Live view "Alert resolved" and generic success toasts
- **Aspect**: 1:1, 200×200
- **Prompt**:

```
Illustration of a coral checkmark inside a soft rounded burst of tiny cream and sand petals, single character thumb-up peeking from bottom-right corner. Palette locked. Warm success mood.
```

### `ill_conflict_veto`

- **Where**: Group tab veto/deadlock state
- **Aspect**: 1:1, 260×260
- **Prompt**:

```
Illustration of two chunky rounded characters back-to-back with arms crossed, small coral question mark hovering between them, cream background. Diverse skin tones. Not hostile - playful stubborn. Palette locked. Gentle-conflict mood.
```

### `ill_wrap_story_cover`

- **Where**: Wrap story cover screen
- **Aspect**: 9:16, 720×1280
- **Prompt**:

```
Illustration of a small scrapbook open on a coral rug, with tiny travel keepsakes falling out: a postcard, a leaf, a bus ticket, a coin, a photo frame silhouette. Warm-dusk soft light. Palette locked. Nostalgic-warm mood.
```

---

## 6. Delivery checklist

For every generated illustration:

- [ ] Cream `#F1F0EE` or transparent background
- [ ] Max 5 colors from palette table
- [ ] No text baked into image
- [ ] Soft warm shadow, no hard black lines
- [ ] Single focal subject, airy composition
- [ ] Export as PNG (transparent) at 2× target render size
- [ ] File name matches ID (`ill_empty_no_trips.png` etc.)
- [ ] Store in `/assets/illustrations/`

## 7. Nano Banana usage tips

- Prefix every prompt with the STYLE block from §1 verbatim - Nano Banana repeats what it sees.
- Add `--no photorealism, 3D render, text, watermark, logo` at the end.
- For character illustrations, add `Airbnb-style flat vector illustration, chunky proportions, no outlines`.
- Set `aspect_ratio` explicitly.
- Generate 4 variants per prompt, pick one, then use Nano Banana's edit mode to unify palette across the set (paste one generated image + prompt: `restyle to match this palette and shape language`).
- For consistency across the whole set, keep one illustration as the reference and pass it in every subsequent prompt as an image conditioner.
