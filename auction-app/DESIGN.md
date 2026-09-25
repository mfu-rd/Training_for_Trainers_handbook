---
name: ประมูลของรางวัล — TFT
description: A keyboard-only, black-and-gold live auction stage for a single MC, built for one offline night at a TFT closing party.
colors:
  espresso-black: "#0a0806"
  coffee-bean: "#151210"
  dark-walnut: "#1d1814"
  antique-gold: "#cda94f"
  champagne-gold: "#f0d789"
  bronze-shadow: "#7a5c1e"
  warm-ivory: "#f3ead9"
  soft-taupe: "#a89f8f"
  muted-ember: "#d9564a"
  sage-green: "#4caf7d"
typography:
  display:
    fontFamily: "'Bahnschrift', 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(56px, 7.4vw, 116px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Segoe UI', 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "clamp(24px, 3vw, 38px)"
    fontWeight: 600
    lineHeight: 1.15
  label:
    fontFamily: "'Bahnschrift', 'Segoe UI', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.16em"
  body:
    fontFamily: "'Segoe UI', 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  xxl: "28px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "34px"
  xxl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.antique-gold}"
    textColor: "#26210b"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.champagne-gold}"
  button-secondary:
    backgroundColor: "{colors.dark-walnut}"
    textColor: "{colors.warm-ivory}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-secondary-disabled:
    backgroundColor: "{colors.dark-walnut}"
    textColor: "{colors.warm-ivory}"
---

# Design System: ประมูลของรางวัล — TFT

## Overview

**Creative North Star: "The Silent Rostrum"**

Two rooms, one palette. The MC's admin screens (setup, summary) stay an ordinary dark-gold operator tool — buttons, list rows, forms — because that work is done alone, at a desk, before the room is watching. The live auction stage is a different room entirely: a rostrum the MC controls in total silence, no button anywhere on it, because the moment it is live, every click would be a click the room can see. The keyboard is the only instrument; the object and its number are the only thing on screen.

This is a hard reset of that one screen, not a polish pass — it replaces the previous "Gilded Gavel" world's framed coin-tile digits, portrait spotlight frame, and on-screen bid/SOLD buttons outright, built directly from the user's own pinned reference (a dark-luxury antiquities/jewelry auction app) and their explicit brief: no clickable control anywhere on the stage, arrow keys move and bid, Enter strikes. The palette survives the reset almost untouched — same warm-black ground, same one gold metal — because the brief pinned "หรูหรา" (luxurious) like the reference image, not a new color story; what changed is composition, type, and the entire interaction model.

**Key Characteristics:**
- Two visitor modes sharing one palette: Operate (setup/summary, ordinary buttons) and Experience (the live stage, keyboard-only)
- Warm near-black, never cool navy or pure `#000`
- One accent metal (antique gold), now rendered flat — no per-digit frames, no boxed tiles
- A geometric grotesk (Bahnschrift) carries every number and Latin label; Thai copy stays in the Sarabun-safe sans
- The digit-roll price ticker survives the reset as the system's one continuous signature motion, restyled unframed
- Sage green is confined to the admin screens' "sold" badge; the live stage marks a sale in champagne gold instead, so nothing but gold ever appears on the stage itself

## Colors

A single warm-black ground and one gold accent metal carry the live stage entirely; sage green is an admin-only convenience that never reaches the stage.

### Primary
- **Antique Gold** (`#cda94f`): the accent metal — active nav state, the price numerals, the hairline divider, the item-counter badge text, focus rings. Carries value and, on the admin screens only, interactivity; on the live stage nothing is clickable, so gold there means "this is the fact," not "press this."
- **Champagne Gold** (`#f0d789`): the lit version of the gold — hover states on admin screens, the flash/confetti burst on strike, and the "ขายแล้ว" confirmation text once a sale is struck. Reserved for the instant something becomes true, never a resting state. Corrected from an earlier draft that used sage green here — green read as off-theme against an otherwise all-gold stage, so the sold moment stays inside the one accent metal.
- **Bronze Shadow** (`#7a5c1e`): the recessed version of the gold — the no-photo placeholder icon, anything gold that should read as structural rather than active.

### Neutral
- **Espresso Black** (`#0a0806`): page background, both rooms. Warm-black, not navy-black.
- **Coffee Bean** (`#151210`): the nav bar and input fields on the admin screens.
- **Dark Walnut** (`#1d1814`): cards, buttons, the item-row list on the admin screens. No longer used on the live stage itself — the item photo carries no background plate.
- **Warm Ivory** (`#f3ead9`): primary text. Ivory, not white — everything warm-tints toward the gold, including "white."
- **Soft Taupe** (`#a89f8f`): secondary text and metadata — item descriptions, the keyboard legend, hints. Never cool gray.

### Named Rules
**The One Green Rule.** Sage green (`#4caf7d`) exists in exactly one place: the admin screens' "sold" badge (setup/summary, Operate mode). It never appears on the live stage, never becomes a secondary accent, and never becomes a hover state. The live stage's own sold confirmation uses champagne gold, not green, so the stage stays inside the one accent metal.

**The No-Glow Rule.** Gold never halos. Emphasis on the price comes from size and weight, plus a real offset-and-blur shadow grounding it on the black surface — never a symmetric colored glow.

## Typography

**Display/Number Font:** Bahnschrift (with Segoe UI, system-ui fallback) — Latin and numerals only
**Body Font:** Segoe UI (with Sarabun, Noto Sans Thai, system-ui fallback) — everything in Thai

**Character:** The reset drops the previous world's serif entirely. A geometric grotesk now carries every number and every Latin label — the price, "Token," the item-counter badge, the keyboard legend — because the pinned reference's clean app-UI numerals read as confident rather than antique. Thai item copy, which the grotesk cannot set, stays in the existing Sarabun-safe sans; the two stacks split cleanly by script, not by role.

### Hierarchy
- **Display** (600, `clamp(56px, 7.4vw, 116px)`, line-height 1, Bahnschrift): the odometer price digits only.
- **Headline** (600, `clamp(24px, 3vw, 38px)`, line-height 1.15, Thai sans): the item name on the live stage.
- **Label** (400, 12px, letter-spacing 0.16em, uppercase, Bahnschrift): "TOKEN ปัจจุบัน", the item-counter badge.
- **Body** (400, 14px, line-height 1.5, Thai sans): admin-screen buttons, list rows, form labels, hints.

### Named Rules
**The Split-Script Rule.** Bahnschrift sets everything Latin or numeral; the moment Thai text appears — an item name, a hint sentence — it drops to the Sarabun-safe stack. Neither font is asked to render a script it wasn't chosen for.

## Layout

Two layouts for two visitor modes. The live stage is a full-bleed, edge-to-edge grid (`minmax(300px,.85fr) minmax(360px,1fr)`, fluid gap up to 88px) — the showcase plate at roughly 45% width, item identity and price at 55% — collapsing to a single stacked column under 760px. Nothing wraps it in a card; the stage *is* the screen. The setup and summary screens keep the prior world's single centered columns (900px / 800px max-width) — administrative, read by the MC alone, so they stay the plainest layout that scans fast.

Spacing still runs an 8px rhythm (8/12/16/24/34/56), with the widest gap reserved for the one place it matters: separating the showcase from the price.

## Elevation & Depth

Mostly flat and tonal, unchanged by the reset: surfaces separate by a warm-gold hairline border at low opacity rather than by shadow. The one exception is the item photo itself.

### Named Rules
**The One Shadow Rule.** Exactly one thing casts a real shadow: the item photo, via `filter: drop-shadow(0 26px 30px rgba(0,0,0,.5))` so it reads as one physical object resting on the stage. Corrected from an earlier draft that put this shadow on a card behind the photo (`box-shadow` on a bordered plate) — a rectangular shadow under a transparent-background photo still read as "picture in a frame," so the shadow moved onto the object's own silhouette instead. Nothing else on the stage earns a shadow.

## Shapes

Soft throughout, never sharp: 8px on small controls, 10–14px on admin buttons and panels, full pill (999px) on every button, badge, and nav pill. The live stage carries no card or frame around its item photo at all — no border, no background, no box-shadow, no rounded-rect boundary of any kind. A 28px-radius rounded square exists only as the photo's invisible layout footprint (`aspect-ratio: 1/1`, `object-fit: contain`), never as a visible shape; the object floats directly on the stage, grounded by its own drop shadow rather than sitting inside a card.

## Components

หรูหรานิ่ง สงบเก็บสง่า — quiet, composed, dignified — still governs both rooms. On the admin screens that shows up as restraint; on the live stage it shows up as silence: nothing moves or highlights unless it is reporting something true.

### Buttons (admin screens only — never on the live stage)
- **Shape:** pill (`border-radius: 999px`)
- **Primary (`.btn-gold`):** antique gold fill, near-black text (`#26210b`), 700 weight.
- **Secondary (`.btn`):** dark walnut fill, ivory text, hairline gold-tinted border; brightens to full antique gold on hover.
- **Disabled:** 40% opacity, no hover response.

### Cards (item-row, setup list)
- **Corner Style:** 14px
- **Background:** dark walnut, no shadow
- **Border:** 1px hairline, low-opacity gold
- **Internal Padding:** 10px 12px, 12px internal gap between thumbnail, text, and controls

### Inputs / Fields
- **Style:** coffee-bean fill, hairline gold-tinted border, 8px corners (admin forms); on the live stage the winner-name field drops the box entirely — see Inline Name Capture below.
- **Focus:** border brightens to full antique gold; keyboard focus additionally gets a 2px gold outline ring (`:focus-visible`).

### Signature Component: The Price Odometer
Retained from the prior world as the system's one continuous piece of motion, restyled flat for the reset: the per-digit gold coin-tile frames are gone. A fixed-width, seven-digit mechanical ticker now sets bold, unframed Bahnschrift numerals directly on the black ground, "Token" following as a smaller ivory unit label. Leading zeros still collapse to width 0 so "100" never shows as "0000100." Each digit still rolls independently, only the digits that actually changed, always forward on a carry, landing with a slight overshoot (`cubic-bezier(.2,.75,.15,1.1)`) rather than a hard stop.

### Signature Component: The Object on Stage
No card, no border, no background plate — corrected after the first cut still read as "a photo pasted in a frame" rather than "the object sitting on the stage." The item photo (a transparent-background PNG when the user supplies one) renders at its own natural shape with `object-fit: contain` inside a 1:1 footprint, no crop, no box. Depth comes from a `filter: drop-shadow(0 26px 30px rgba(0,0,0,.5))` on the image itself — a shape-following shadow that traces the object's real silhouette, not a rectangle's — so it reads as something resting on the dark surface, not artwork behind glass. A floating item-counter badge ("2 / 4") still sits glass-dark at the footprint's top-right corner, the one piece of chrome the live stage carries, translated from the pinned reference's "20 Bids" badge. When no photo exists yet, a drawn outline icon and "ยังไม่มีรูปภาพ" stand in — never a placeholder emoji.

### Signature Component: The Keyboard Legend
A quiet, centered row of `<kbd>` caps (1px hairline border, 6px radius, Bahnschrift, 11px) below the stage: `← →` move, `↑ ↓` bid, `Enter` strike, `F` fullscreen. It is the stage's entire instruction set and its entire chrome — no icon toolbar, no button row — togglable with `H` once the MC no longer needs it.

### Signature Component: Inline Name Capture
Replaces the prior world's button-driven confirm modal. On strike, a borderless text field fades in where the bid line was, underlined in a single gold hairline, auto-focused; the winner's name is typed and confirmed with `Enter`, or the strike is undone with `Escape`. No dialog, no overlay, no clickable button — the keyboard-only rule holds even for the one moment that used to need a modal.

### The Sold Moment (signature interaction, not a component)
A large gavel (up to 220px, scaled to the viewport) winds up and strikes (0.6s) → at contact, the sold sound, a radial flash, a scale-and-glow pulse on the price numerals themselves, and gold-and-ivory confetti all fire together, so the struck number is unmistakable → the sold line, set in champagne gold (not green — corrected after it read as off-theme against the stage), appears above a gold hairline divider, then the name-capture field takes its place below.

## Do's and Don'ts

### Do:
- **Do** keep the live stage free of every clickable control — no button, no icon toolbar, no modal with Cancel/Confirm. Arrow keys, Enter, F, and H are the entire instrument.
- **Do** keep gold as the only accent metal, in both rooms.
- **Do** keep sage green confined to the admin screens' "sold" badge only; the live stage's sold moment stays in champagne gold (**The One Green Rule**).
- **Do** set every number and Latin label in Bahnschrift; the instant Thai text appears, drop to the Sarabun-safe sans (**The Split-Script Rule**).
- **Do** keep the item photo's own drop-shadow as the system's only shadow, and never wrap it in a bordered or backgrounded card (**The One Shadow Rule**).
- **Do** draw new icons as single-stroke inline SVG in the gold/ivory palette. Never substitute an emoji for interface chrome.
- **Do** guard every live-stage keyboard action against `pendingStrike`, so a stray arrow press during the name-capture beat can't bid or navigate underneath it.

### Don't:
- **Don't** put a button, link, or clickable icon anywhere on the live stage — that is the one rule this reset exists to enforce.
- **Don't** add a glow/halo around gold text or borders (**The No-Glow Rule**).
- **Don't** use gradient text for the price or any other emphasis. Weight and size carry it.
- **Don't** reintroduce the coin-tile framed digit; the numerals are flat.
- **Don't** put a border, background, or box-shadow behind the item photo — it floats directly on the stage, grounded only by its own drop-shadow, never boxed into a card or frame.
- **Don't** reintroduce cool navy or blue-black anywhere; every dark surface in this system is warm-black.
- **Don't** give the setup/summary administrative screens the live stage's full-bleed, keyboard-only treatment — they are Operate-mode, read by the MC alone, and keep ordinary buttons.
