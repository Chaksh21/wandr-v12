# Wandr — Consolidated User Feedback (v11 → v12 input)

Source: 3 people testing different personas of the app (2026-07-04).
- **Chakshu** — logged-in user, mid-trip (Home / Live / Explore / Trips)
- **Yashika** — new user, signup → create-a-trip flow (Signup / Home / Setup / Import / Shortlist)
- **Anusha** — mixed persona (Home / Search / Explore / Onboarding / Itinerary), notes originally Hinglish, translated below preserving intent

## How to use this doc
- **Section A** = issues 2+ personas hit independently → likely a real **consistency** (same element styled/copied differently across screens) or **logic** (broken/contradictory state) bug, not just taste. Fix these first.
- **Sections B/C/D** = single-persona feedback by screen, in the order they gave it.
- Tags: `[BUG]` broken functionality · `[LOGIC]` state/flow contradiction · `[CONSISTENCY]` same thing styled/worded differently elsewhere · `[COPY]` text/microcopy · `[UX]` layout/interaction/visual · `[NEW]` proposed new feature.

---

## A. Cross-cutting — Consistency & Logic Issues (fix first)

1. `[BUG]` **Swipe-to-shortlist gesture doesn't work.** Yashika: "swipe to shortlist is not working." Anusha: "Continue booking ke baad, swipe wala option hain but I can't swipe" — if it's click-driven right now, gesture should still support actual swipe.
2. `[LOGIC]` **Shortlist deck forces full pass before continuing.** Yashika: user shouldn't have to swipe through every card after saving one — give an explicit "continue" option. Anusha: same ask — "even after 2 or 3 saves we should show the done button."
3. `[CONSISTENCY]` **"Trending on Wandr" section differs between Home and Explore**, and has scroll-affordance/readability/meaning problems on both. Chakshu: make descriptions 2 lines (Home); ensure Home/Explore versions match (Explore). Anusha: increase card spacing so the 3rd card peeks off-frame as a scroll hint (Home), same pattern used elsewhere in the app. Yashika: the "92%"/"82%" badges on these cards give no indication what they mean — needs a label or explanation (this is distinct from the match-% pill on "Matched to your style" cards, which has the same unclear-meaning problem — fix both together).
4. `[LOGIC]` **Star vs. bookmark icon for shortlisting is semantically wrong and inconsistent across surfaces.** Chakshu: star implies "I've been" not "I want to go" — use bookmark instead; once already on a trip to that destination, action should be "add to plan" not save/bookmark at all. Anusha: after shortlisting, screen reopens and a toast appears, but from outside (list view) only a mark should indicate shortlisted state. Yashika: use the **same bookmark icon** everywhere a save/shortlist action exists — swipe-to-plan deck, Explore feed top-right corner, etc. — currently star and bookmark are mixed across these surfaces.
5. `[CONSISTENCY]/[COPY]` **"Coming soon" destinations tab is underbuilt inconsistently.** Chakshu: keep the tab, but clicking through should show real content + "we're still collecting data for [city], be the first to plan it" instead of a dead end. Anusha: the "coming soon" tab itself should be positioned higher/first, not buried.
6. `[UX]/[CONSISTENCY]` **Draft-lock screen** ("Select a draft to lock" / "Locked on Active & Out"): Yashika — copy causes anxiety ("shared with your group" when it hasn't been; remove pointless "SYNCED" tag). Anusha — the lock button's orange shadow should be a stroke or different color, orange is overused here.
7. `[BUG]/[LOGIC]` **Import-booking flow has a broken navigation branch.** Anusha: clicking the destination field during import sent her to onboarding step 3 instead of staying in the import flow. Yashika (same flow, different angle): headers ("Please confirm"), low-confidence hotel badge, and the final redundant "continue" click all add friction/anxiety without telling the user what to do next — worth auditing the whole import-booking path together.
8. `[CONSISTENCY]` **Screen headers inconsistent across the app.** Chakshu flags this directly for Live Day 1 vs. rest of app — worth a full header-pattern audit (title size/weight/placement) rather than a one-off fix.
9. `[COPY]` **"No 40-message threads" messaging reads as a negative/absence-framed pitch in multiple places** and should be reframed around what Wandr *does* provide, plus made less repetitive. Yashika: flagged on Home subtext and bottom-of-home message (same idea repeated twice). Anusha: same line flagged on Home again ("neeche ho sakta hain" — suggests moving/cutting it).
10. `[UX]` **Default-orange overuse as a UI signal** is causing multiple false "error/active" reads. Yashika: input focus state uses orange border, reads as an error state. Anusha: draft-lock CTA orange shadow (see #6). Chakshu: weather card / primary CTA font-color token not resolving against orange (Live page). Suggests the orange token needs a broader pass — reserve it for a narrower, deliberate set of states.
11. `[LOGIC]` **"Plan a trip from scratch" becomes unreachable once a user already has a planned trip.** Yashika: this option should stay available regardless of existing trips — users plan multiple trips. Related to Anusha's A5/A7 observations that the create/import/onboarding funnel has several dead-ends and misrouted entry points — worth auditing trip-creation entry points as one pass.

---

## B. Chakshu — logged-in, mid-trip

### Home
- `[UX]` Unclear what the live/ongoing-trip card is — needs a label like "Ongoing."
- `[COPY]` CTA "Open today" feels odd — rename.
- `[NEW]` Show next stop + travel time to it on the card.
- `[UX]` "Trending on Wandr" card descriptions → 2 lines. *(see A3)*
- `[UX]` Add ~2px inner padding to text inside cards.
- `[NEW]` Add a tag/nudge signaling "worth visiting."
- `[COPY]` "Great for groups" → "Great for groups your size."
- `[LOGIC]` Trending + "great for groups" sections feel out of place once user is already on a trip — surface trip-related cards on Home instead in that state. *(see A3)*

### Live (Day 1)
- `[CONSISTENCY]` Header inconsistent vs. rest of app. *(see A8)*
- `[UX]` "Online" page feels redundant.
- `[UX]` This page should visually reflect the current stop (e.g. Shimla) or next stop, not be generic.
- `[CONSISTENCY]` Weather card too heavy visually; primary CTA font-color token broken against background. *(see A10)*
- `[UX]` Move "Nearby Food" to sit between places, not off to the side.
- `[NEW]` Show ideal time-to-spend at each stop.
- `[NEW]` Show travel time between consecutive stops.
- `[NEW]` Add a navigation screen per monument/stop.
- `[LOGIC]` No way to see pending decisions/votes from this page.
- `[LOGIC]` Page doesn't show check-in progress (how many checked in vs. not).
- `[LOGIC]` Kufri card (dark red, appears "closed") — if it's not actually part of the plan, showing a closure state makes no sense; if it was removed for that reason, the CTA on it is now broken. Needs a logic decision, not just a visual fix.
- `[NEW]` Per-day spend summary per member (name + amount spent) — keep simple.
- `[LOGIC]` After Day 1 completes, Day 2 isn't defined/reachable.
- `[UX]` Recap feature makes sense at trip-end, feels excessive as a per-day thing — restrict to trip level.

### Explore
- `[CONSISTENCY]` "Trending on Wandr" differs from Home version — align. *(see A3)*
- `[UX]` Match-percentage should be colored pills, more vibrant at higher %, in a non-orange color (orange is overused).
- `[UX]` "Matched to your style" cards: subtext too small — enlarge; price needs distinct visual treatment; add another descriptive tag for the place.
- `[LOGIC]` When user is already on a trip to that place, allow "add to plan" directly from these cards instead of star/bookmark. *(see A4)*
- `[LOGIC]` Star icon → bookmark icon (semantics). *(see A4)*
- `[UX]` "Coming soon" tab — keep, but content shouldn't dead-end. *(see A5)*
- `[BUG]` Explore filters don't actually filter. If kept, cards should also carry price + time-of-day tags to match.

### Trips (list)
- `[UX]` Add Live / Upcoming / Past sections, Past bifurcated by year; Live/Upcoming currently unlabeled.
- `[UX]` Opening a trip shows too much at once — needs breathing room; timing/size elements feel off.
- `[BUG]` Card says "+3 items" but detail view only shows the same 3 items already visible.
- `[UX]` Remove "Who brings what."
- `[UX]` Improve cost display.
- `[LOGIC]` Unclear whether shown cost/info is for Day 1, Day 2, or whole trip — needs explicit scope label.
- `[UX]` "Share" can just be an icon, no label needed.

#### Trips → Itinerary
- `[UX]` Day 1/Day 2 selector feels heavy next to the "3 things to know" card — consider different colors/styles, or let "3 things" open full-width. Needs a design decision.
- `[UX]` Stop cards feel heavy — more spacing, better element hierarchy.
- `[UX]` "Show route" should open as a proper section/map, not inline.
- `[UX]` Pin cost to the bottom of the screen.

#### Trips → Group
- `[UX]` Screen tries to do too much; top tab bar (itinerary/decisions) feels heavy.
- `[LOGIC]` Remove that top tab bar — redundant with the voting section already present.
- `[UX]` Voting should be surfaced more prominently across the whole UI, not just here.

---

## C. Yashika — new user, signup → create trip

### Signup
- `[UX]` Signup screen too plain, no playful branding element.
- `[COPY]` App sub-description too complex — simplify, make it feel fun/collaborative.
- `[COPY]` Subtext under signup header ("Pick whichever - takes ten seconds") is unnecessary/vague — cut.
- `[UX]` Auth option buttons (Apple/Google/phone) need bigger, brand-accurate icons (real Apple/Google marks + colors).
- `[UX]` Add a "already have an account? Log in" link.
- `[COPY]` OTP subtext "auto-detects in a sec" is odd — just show status, don't over-explain a common pattern.
- `[LOGIC]` "Resend code" still available right after auto-fill/auto-detect — doesn't make sense in that state.
- `[BUG]` "Auto-detected • confirmed" toast lingers too long into the next (name) screen.

### Home (new user)
- `[COPY]` "Vote, veto and re-plan together. No 40-message threads." → reframe positively, make it fun. *(see A9)*
- `[UX]` "Start your first trip" primary CTA icon too small relative to text — enlarge.
- `[COPY]` Search bar placeholder should hint at what's searchable, e.g. "search places, activities, locations, plans…" — keep short, use ellipsis.
- `[COPY]` Bottom-of-home message ("One living plan… no 40-message threads") feels unnecessary and repeats the same pitch as above — cut or consolidate. *(see A9)*

### Trip setup
- `[COPY]` "What do we call you?" on trip-start is confusing — unclear if asking user's name (already captured at signup) or the trip/group name. Redundant either way if it's the former.
- `[UX]` Active/selected field state uses an orange border that reads as an error — fix or repurpose. *(see A10)*
- `[UX]` Pace selection shouldn't have a default pre-selected option (biases user to just accept it). Same for Style selection.
- `[COPY]` Spend-tier terms too jargon-heavy — use plain language.
- `[COPY]` "Groups are planning together right now." reads like a status message, not motivational/social-proof copy — rewrite with clearer intent.
- `[UX]` After selecting a destination from "where to," don't require a separate "Next" tap — navigate directly.
- `[COPY]` Post-dates/name step, header "How do we start it?" doesn't indicate what the step is about — rename.
- `[COPY]` Import-booking confirm screen: header "Please confirm" gives no direction; subheader ("We parsed this... tap any field to fix it before we build the trip") reads as a threat; bottom label "CONFIRM TO CONTINUE - REQUIRED" also reads as an error state — rewrite all three in a friendlier, clearer tone. *(see A7)*
- `[UX]` "Low confidence" hotel badge flags a problem but offers no resolution path — causes anxiety without a next step.
- `[LOGIC]` After confirming the booking, still asked to click "Continue" again — redundant step.

### Shortlist / swipe deck
- `[BUG]` Swipe-to-shortlist doesn't work. *(see A1)*
- `[UX]` Unnecessary white space at bottom of swipe cards.
- `[COPY]` Match-% tag ("92% match") doesn't say match *of what* — clarify relevance.
- `[COPY]` Subheader "Save what excites the group - it weights the draft. 0 SAVED" is vague — simplify.
- `[LOGIC]` No way to continue after saving just one card — forced to swipe through the whole deck. *(see A2)*
- `[COPY]` "Build draft" CTA — unclear/odd term, conflicts with "building a plan" mental model. Rename.

### Draft / itinerary handoff
- `[COPY]/[LOGIC]` "Locked on Active & Out - shared with your group." — implies it's already shared when it isn't; causes anxiety. Rewrite status + next-step copy. *(see A6)*
- `[UX]` "SYNCED" tag serves no purpose — remove. *(see A6)*
- `[LOGIC]` After viewing itinerary and hitting back, user doesn't return to the "invite group" screen — loses that option.
- `[LOGIC]` Invite-group action isn't available anywhere else if that screen is lost — needs a persistent entry point.

### Itinerary / Live
- `[COPY]` Rain-alert CTA "Got it, swap it on the day" unclear language; also visually acting as primary CTA when "Wrap up the day" should be primary.
- `[UX]` "Nearby food" too subtle/hidden — give it visual weight.
- `[COPY]` CTA "This was the last day - see recap" — improve wording.
- `[UX]` Trip/group name captured at setup is never used anywhere downstream — remove the field or use it somewhere.

### Explore flow
- `[LOGIC]` **Plan-from-scratch unreachable once a trip already exists** — should stay available. *(see A11)*
- `[UX]` Spend shown as a single ₹ sign doesn't convey anything useful — use the budget filter more meaningfully instead (e.g. actual range/tier).
- `[UX]` "Time of day" filter takes up feed space for little payoff — move it into the filter panel instead of showing inline on cards.
- `[LOGIC]` Save icon should be the same **bookmark** icon used in the swipe-to-plan deck, and in the Explore feed's top-right corner — star icon is inconsistent and confusing. *(see A4)*
- `[COPY]` "Trending on Wandr" cards show "92%"/"82%" etc. in the top-right with no explanation of what the number means. *(see A3)*

### Itinerary detail
- `[UX]` Descriptive tags like "Reliable group dinner, vegetarian-friendly, valley view." are crammed into one line — restructure as separate checked/tagged options for a quicker scan.
- `[UX]` Time and money icons should be minimal-stroke style, not the current treatment.
- `[UX]` "1,428 travellers visited last month" — currently disrupts reading flow, reposition somewhere it doesn't interrupt the main content.
- `[UX]` Same repositioning treatment for the hint text at the bottom of the screen.

### Profile
- `[LOGIC]` "My trips" from Profile navigates to the generic Trips section instead of showing the user's own trips/history specifically.
- `[UX]` User preference tags (Balanced, Luxury, etc.) are displayed as loose tags — group them under a proper "Manage preferences" category instead.
- `[NEW]` Add ability to edit profile information.

---

## D. Anusha — mixed persona (translated from Hinglish, intent preserved)

### Home
- `[COPY]` "No 40-message threads" line — consider moving lower or cutting. *(see A9)*
- `[UX]` "Start your first trip" — either a large plus icon, or remove the icon entirely.
- `[UX]` Increase spacing in "Trending" row so the 3rd card peeks off-frame as a scroll cue, matching the pattern used elsewhere lower on the page. *(see A3)*
- `[UX]` "One living plan…" section — instead of a boxed/framed treatment, consider a banner style.

### Search
- `[UX]` "Slow / Balanced / Packed" (pace) tags aren't positioned mid-content — currently too high, reposition.
- `[NEW]` Add a tab bar for Cities vs. Places — otherwise users don't discover places exist unless they scroll down.
- `[UX]` Search results page scrolls too far with nothing anchoring it — consider a sticky element or at least keep the nav bar visible.

### Explore
- `[LOGIC]` After shortlisting, the same screen reopens with a toast — from the outside/list view, a star/mark indicator should suffice instead. *(see A4)*
- `[UX]` "Coming soon" tab should be positioned near the top, not buried. *(see A5)*
- `[UX]` "New trip" — use a chevron icon instead of current icon for consistency.
- `[UX]` Onboarding question screens: side line + text aren't aligned.
- `[LOGIC]` Onboarding "Just exploring" option should route directly to Home, not further into the funnel.
- `[UX]` Selecting a suggestion changes its color but gives no "selected" label — decide if a text label is needed or if color alone should communicate state.
- `[LOGIC]` "Plan from scratch" — shouldn't open to a blank state first; needs a better default/starting point.
- `[UX]` The checkmark icon after "Yes, this is right" could be bigger; also revisit pill colors here.
- `[COPY]` Is the word "parsed" (import flow) understandable to users? — consider plainer wording.
- `[BUG]` Import flow: tapping the destination field navigates to onboarding step 3 instead of staying in import. *(see A7)*
- `[BUG]` After continuing from import booking, the swipe screen doesn't actually support swiping. *(see A1)*
- `[UX]` Swipe cards should respond to an actual swipe gesture if they're currently click/button-driven.
- `[LOGIC]` Shortlist deck: show a "done" button after 2–3 saves rather than forcing a full pass. *(see A2)*

### Draft / lock
- `[UX]` "Select a draft to lock" button — use a stroke instead of orange shadow, or a non-orange color. *(see A6)*

### Itinerary
- `[CONSISTENCY]` "Live" pill text is smaller than other pills on the same page — normalize sizing.
- `[UX]` If line-style illustrations are used elsewhere, the "Who brings what" section icon should match that style — current icon is unclear/inconsistent.
- `[UX]` "Day 1 at a glance" section needs more top spacing/separation from the section above it.
- `[UX]` Replace arrow icons with chevrons throughout.
- `[UX]` Spot-detail screen (when choosing a stop) feels visually chaotic — needs cleanup.
- `[UX]` "Updated plan" screen — replace with a popup, or add a top banner (e.g. "Updated") on the actual plan screen instead of a separate screen.
- `[BUG]` Completing a day doesn't scroll/open from the top — lands showing only the last 2 buttons on screen.

---

## Suggested next step
Feed **Section A** to Claude Code first as a standalone batch (it's the highest-leverage set — real bugs/logic gaps, not just polish), then work through B/C/D screen-by-screen. Each `[BUG]`/`[LOGIC]` item is worth a quick repro pass before coding a fix, per the `verify` skill.
