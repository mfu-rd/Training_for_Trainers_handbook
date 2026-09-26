---
name: ระบบแจก e-Token — TFT
description: A dark "mission-control" console for a live token ledger — playful spy-briefing energy on the one screen participants see, calm color-coded ops tooling everywhere a trainer or admin moves real balances.
colors:
  void-plum: "#16152e"
  card-plum: "#211f45"
  raised-plum: "#2a2855"
  hairline: "rgba(255,255,255,0.08)"
  text-primary: "#f3f2ff"
  text-secondary: "#b6b3de"
  mint-grant: "#3fe0ae"
  mint-grant-lit: "#6be8c3"
  danger-deduct: "#ff7a88"
  danger-deduct-lit: "#ff9ba5"
  amber-quota: "#ffd66b"
  amber-quota-lit: "#ffe192"
  pink-admin: "#ff6b9e"
  pink-admin-lit: "#ff8fb4"
  sun-decor: "#ffd23f"
typography:
  display:
    fontFamily: "'Mitr', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "clamp(40px, 6vw, 72px)"
    fontWeight: 700
    lineHeight: 1.05
  headline:
    fontFamily: "'Mitr', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "clamp(22px, 2.6vw, 32px)"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "'Mitr', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.14em"
  body:
    fontFamily: "'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "'Anuphan', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  numeral:
    fontFamily: "'Space Mono', ui-monospace, 'Noto Sans Thai', monospace"
    fontWeight: 700
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-grant:
    backgroundColor: "{colors.mint-grant}"
    textColor: "#0b241f"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-grant-hover:
    backgroundColor: "{colors.mint-grant-lit}"
  button-deduct:
    backgroundColor: "{colors.danger-deduct}"
    textColor: "#2c0a0d"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-deduct-hover:
    backgroundColor: "{colors.danger-deduct-lit}"
  button-secondary:
    backgroundColor: "{colors.raised-plum}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
---

# Design System: ระบบแจก e-Token — TFT

## Overview

**Creative North Star: "Mission Control for a Real Ledger"**

The user pinned "Token × Secret Buddy" — the existing TFT companion guide for the physical token game and the secret-buddy reveal — as visual inspiration for this app. That artifact is a fun, dark, spy-briefing checklist read by every participant for entertainment. This app is a different kind of surface entirely: a small number of trainers and one admin moving real balances in and out of real accounts, live, mid-lecture, in a dim room, with no room for a wrong tap. It borrows the reference's dark plum ground, its saturated confetti-bright accents, its chunky Thai display type, and its pill/badge/dashed-callout vocabulary — but it splits that one world into two registers by mode, not by page count:

- **Operate register** (Login, ChangePassword, GrantToken, TrainerHistory, AdminOverview, TrainerQuotaSettings, DeductToken, TransactionEditor, UserManagement, ExportData): the reference's playful chrome is stripped to its color logic only. One accent color per screen names the one action that screen performs, and nothing else competes for attention.
- **Read/Experience register** (ParticipantDashboard only): the one screen a participant actually opens for its own sake keeps the reference's full personality — gradient hero text, floating confetti shapes, a numeral that visibly ticks when it changes.

**Key Characteristics:**
- Same dark plum ground and five-accent palette everywhere — this is one product, not two skins glued together
- **The color IS the safety signal.** Grant is always mint, deduct is always danger-red, system/admin chrome is always pink. A trainer never confuses which irreversible action a button performs, because no other action on the entire site wears that color.
- Confetti, gradient text, and floating shapes are rationed to exactly one screen (ParticipantDashboard); every Operate screen is flat, high-contrast, and legible from an arm's length in a dim lecture hall
- Three Thai-friendly faces split by role — Mitr for display/headlines, Anuphan for body copy, Space Mono for every numeral — because this app's primary numerals (token counts, quotas) sit directly beside Thai labels constantly and deserve their own tabular rhythm
- Dark theme only, no light-mode toggle — this is a single committed console, not a public page that must suit every reading environment

**Palette provenance:** the specific hex values (dark-theme column only — this system stays dark-only) were carried over from a sibling TFT project's design.md, "Hybrid Buddy Board" (a separate buddy-pairing/mission/leaderboard app, unrelated in function). Only its color tokens and font family choices were adopted here; its component vocabulary (chips, leaderboard rows, sticker-style thick borders/offset shadows) was **not** — this system keeps its own existing components (buttons, cards, pills, quota bar) exactly as documented below, just recolored and re-fonted. The source file's `online`/`onsite` dual-track colors were explicitly reserved for that project's own online/onsite concept and are intentionally never used here.

## Colors

A near-black plum ground carries the whole app; five saturated accents each own exactly one meaning, borrowed from the reference's one-color-per-day system but reassigned to one-color-per-action.

### Primary (semantic, not decorative)
- **Mint Grant** (`#3fe0ae`): every "แจก" (grant) affordance — the GrantToken screen's primary button, the balance numeral on ParticipantDashboard, the "แจก" transaction-type badge. Means "a token is being added." Never used for anything else.
- **Danger Deduct** (`#ff7a88`): every "หัก" (deduct) affordance — the DeductToken screen's primary button, the "หัก" transaction-type badge, the destructive confirm in TransactionEditor. Means "a token is being removed." Never softened into a decorative shade elsewhere. (Carried over from the source palette's own `danger` token, defined there for "errors, delete/reset buttons" — a near-literal semantic match for this app's deduct action.)
- **Amber Quota** (`#ffd66b`): quota state — the trainer's remaining-quota bar and number, the dashed-border low-quota warning callout, TrainerQuotaSettings' editable quota field. Means "a limited pool." (Source palette's own `warn` token — "warning banners, confirm boxes" — another direct semantic match.)
- **Pink Admin** (`#ff6b9e`): system/admin-only chrome — the active nav-chip state, AdminOverview's headline accent, UserManagement's "create account" action, TransactionEditor's void/edit controls. Means "this changes system state, not a single ledger entry." (Source palette's own primary `accent` token — "primary buttons, selected tabs.")
- **Sun Decor** (`#ffd23f`): decorative only, confined to ParticipantDashboard's hero gradient and confetti shapes (paired with mint). Never appears on an Operate screen or as a button, and never doubles as pink/danger/amber's meaning even on this one screen.

### Neutral
- **Void Plum** (`#16152e`): page background everywhere, both registers.
- **Card Plum** (`#211f45`): cards, table rows, input fields.
- **Raised Plum** (`#2a2855`): nav bar, secondary buttons, the surface a step above a card.
- **Text Primary** (`#f3f2ff`): headlines and body text — warm off-white, never pure `#fff`.
- **Text Secondary** (`#b6b3de`): metadata, uppercase section labels, table headers, timestamps.
- **Hairline** (`rgba(255,255,255,0.08)`): the only border treatment; no drop shadows on Operate screens.

### Named Rules
**The One Color, One Meaning Rule.** Mint, danger, amber, and pink each mean exactly one thing across the entire app. A screen may feature only its own accent as an interactive color; borrowing another screen's accent for decoration (e.g., a pink icon on GrantToken) is not a style choice, it is a safety defect, because trainers learn "this color = this consequence" through repetition.

**The Confetti Quarantine.** Sun decor, gradient text, and floating geometric shapes exist only on ParticipantDashboard. If a later request adds decoration to any Operate screen, that decoration must use only that screen's own accent — never introduce sun decor or gradient text outside the quarantine.

## Typography

**Three fonts, split by role** (Google Fonts, carried over from the Hybrid Buddy Board source palette): **Mitr** (500–700) for display/headline/label, **Anuphan** (400–600) for body text and controls, **Space Mono** (400/700) for every numeral. Noto Sans Thai and system-ui as fallback throughout.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mitr:wght@500;600;700&family=Anuphan:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```
```css
:root {
  --font: 'Anuphan', 'Noto Sans Thai', system-ui, sans-serif;       /* body */
  --font-display: 'Mitr', 'Noto Sans Thai', system-ui, sans-serif;  /* display/headline/label */
  --font-mono: 'Space Mono', ui-monospace, 'Noto Sans Thai', monospace; /* every numeral */
}
```

### Hierarchy
- **Display** (Mitr 700, `clamp(40px, 6vw, 72px)`, line-height 1.05): the hero headline. (The token-balance numeral beside it is Space Mono, not Mitr — see Numeral below.)
- **Headline** (Mitr 600, `clamp(22px, 2.6vw, 32px)`, line-height 1.2): screen titles ("แจก Token", "หัก Token", ภาพรวมแอดมิน).
- **Label** (Mitr 500, 12px, letter-spacing 0.14em, uppercase, Text Secondary): section eyebrows ("โควตาคงเหลือ", "ประวัติการทำรายการ").
- **Body** (Anuphan 400, 15px, line-height 1.55): form fields, table cells, history rows.
- **Button** (Anuphan 600, 16px): all button labels.
- **Numeral** (Space Mono 700, tabular figures): the ParticipantDashboard balance, every quota number, every amount column in a table. Always this font, never Mitr or Anuphan, so figures line up column-to-column and read unambiguously as data.

### Named Rules
**Split by Role, Not by Script.** Unlike auction-app (which splits a Latin display face from a Thai sans purely because its numbers stand alone against a projector), this system splits by *function*: Mitr carries structure (headlines, labels), Anuphan carries prose, and Space Mono carries every figure — even though Mitr and Anuphan both render Thai perfectly well. The point is that a number must always look like a number at a glance in a dense form or table full of Thai text, not that any one face can't render the language.

## Layout

Two column disciplines by register. Operate screens use a single centered column (720px max-width for forms like GrantToken/DeductToken, 1100px for data-dense screens like AdminOverview/TransactionEditor) — administrative work read alone, so it stays the plainest layout that scans fast. ParticipantDashboard is full-bleed like the reference's hero, the balance numeral and hero art occupying the first viewport before any history list appears.

Spacing runs an 8px rhythm (8/12/16/24/32/48), with the widest gap reserved for separating a screen's one primary action from everything else around it — on GrantToken and DeductToken, the confirm button sits in visual isolation, never crowded by secondary controls.

## Elevation & Depth

Flat and tonal throughout: surfaces separate by the hairline border, never by shadow, on every Operate screen — consistent with the reference's own flat card style. ParticipantDashboard is the one exception, where the decorative confetti shapes and hero art may carry a soft glow consistent with the reference's playful mood.

## Shapes

Soft throughout: 10px on inputs and small tags, 14–20px on cards and secondary buttons, full pill (999px) on every primary button, nav chip, and status badge — directly inherited from the reference's rounded language. No sharp corners anywhere in the system.

## Components

### Buttons
- **Shape:** pill (`border-radius: 999px`) for every primary and secondary action.
- **Grant primary (`.btn-grant`):** mint fill, near-black-teal text, used only on GrantToken.
- **Deduct primary (`.btn-deduct`):** danger fill, near-black-danger text, used only on DeductToken and TransactionEditor's void action.
- **System primary (`.btn-admin`):** pink fill, used for UserManagement's create/reset actions and TrainerQuotaSettings' save action.
- **Secondary (`.btn`):** raised-plum fill, ivory text, hairline border; used for cancel/back everywhere.
- **Disabled:** 40% opacity, no hover response.

### Cards (AdminOverview tiles, TransactionEditor rows, history entries)
- **Corner Style:** 20px
- **Background:** card plum, hairline border, no shadow
- **Internal Padding:** 16–20px

### Vivid Card Band (AdminOverview's three role-group cards only)
Per the Hybrid Buddy Board reference's bold solid-color day cards: each of AdminOverview's three grouping cards (ผู้เข้าร่วม / วิทยากร / แอดมิน) carries a full-bleed, solid-color header band instead of a plain label row — mint for the participant group (their balances are mint), amber for the trainer group (their quotas are amber), pink for the admin group (system chrome is pink). This is **not** a new decorative license: each card's band color is the color that group's own numbers already wear everywhere else in the app, so it reinforces the One Color, One Meaning rule rather than breaking it. The table/list body under the band stays on the normal card-plum ground for legibility — only the header band is saturated. This exact treatment is scoped to these three cards; it does not license vivid full-color cards elsewhere in the Operate register.

### Status / Transaction-Type Pills
- **Shape:** pill (999px), 12px label-weight text
- **"แจก" pill:** mint background at 18% opacity, mint text
- **"หัก" pill:** danger background at 18% opacity, danger text
- **"ปรับโควตา" pill:** pink background at 18% opacity, pink text
- **"ยกเลิกแล้ว" (voided) pill:** text-secondary background at 12% opacity, strikethrough label text

### Signature Component: The Quota Bar
A thin horizontal progress bar (borrowed from the reference's mission-progress bar) showing a trainer's remaining quota out of their set total. Fills in amber; crosses to a dashed amber-bordered warning callout once remaining quota drops under 20%, reading "โควตาใกล้หมด — เหลือ N token." Never turns danger — quota running low is a warning, not the deduct action itself, and conflating the two colors would break the one-color-one-meaning rule.

### Signature Component: The Balance Tick (ParticipantDashboard only)
The one continuous piece of motion in the system: the mint display numeral rolls to its new value whenever a grant or deduct lands while the dashboard is open (via a live Firestore listener), landing with a slight overshoot rather than a hard stop — the spirit of auction-app's price odometer, restyled in mint instead of gold, reserved for this one screen.

### Nav Chips
Pill-shaped, horizontal, sticky under the header — directly inherited from the reference. Active state fills solid pink (system chrome color) regardless of which functional accent the active screen itself uses, so navigation always reads as "structure," never as "which action."

### Forms (GrantToken, DeductToken, UserManagement)
- **Fields:** card-plum fill, hairline border, 10px corners, label above field in Label style.
- **Amount / reason quick-pick:** row of pill buttons (1/3/5/10/15, "ตอบคำถาม"/"ร่วมกิจกรรม") in the screen's own accent at low opacity, filling solid on selection — plus one "ระบุเอง" pill that reveals a free-text/number field.
- **Focus:** border brightens to the screen's own accent color; keyboard focus adds a 2px outline ring in that same color.

### Tables (AdminOverview, TransactionEditor, ExportData)
- Card-plum header row, hairline row dividers, no vertical rules.
- Numeric columns right-aligned, tabular figures.
- Row hover: raised-plum tint.

## Do's and Don'ts

### Do:
- **Do** keep the color-to-meaning mapping absolute: mint = grant, danger = deduct, amber = quota, pink = system/admin, sun-decor = decorative-only-on-ParticipantDashboard (**The One Color, One Meaning Rule**).
- **Do** confine confetti, gradient text, and floating shapes to ParticipantDashboard alone (**The Confetti Quarantine**).
- **Do** set headlines/labels in Mitr, body copy in Anuphan, and every numeral in Space Mono; never mix these roles.
- **Do** keep every Operate screen's primary action visually isolated — one obvious button per screen, nothing competing beside it.
- **Do** reuse the reference's dashed-border callout shape for the quota-warning state, recolored in amber only.
- **Do** keep the balance-tick animation confined to ParticipantDashboard; Operate screens confirm state changes with a plain inline success message, not motion.

### Don't:
- **Don't** let a deduct action anywhere in the app render in any color but danger, even briefly, even as a hover tint.
- **Don't** add gradient text, confetti, or decorative floating shapes to any Operate screen — that vocabulary belongs to ParticipantDashboard alone.
- **Don't** add a light-mode toggle; this system commits to one dark console.
- **Don't** copy "Token × Secret Buddy" content, copy, or mission-checklist framing into this app — it is a visual-inspiration source only, not a shared codebase or shared content.
- **Don't** give AdminOverview, TransactionEditor, or UserManagement more than one accent color of interactive emphasis (pink) — they are system-state screens, not action screens, and should read calmer than GrantToken/DeductToken.
- **Don't** use sharp corners anywhere; every interactive shape stays in the rounded/pill vocabulary above.
