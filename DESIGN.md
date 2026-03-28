# ScopePro Design System

## Visual Identity

- **Palette:** Warm/earthy. Slate/charcoal base + amber/copper accent.
- **Mode:** Light only at launch. Dark mode deferred.
- **Font:** Inter (variable, via next/font/google). Geist Mono for quantities/measurements.
- **Component library:** shadcn/ui base-nova, overridden with accent color + font + radius.

## Colors (oklch — defined in globals.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.985 0 0)` | Page background (near-white) |
| `--foreground` | `oklch(0.145 0.02 260)` | Body text (slate-950) |
| `--muted` | `oklch(0.965 0.01 260)` | Muted backgrounds (slate-100) |
| `--muted-foreground` | `oklch(0.55 0.02 260)` | Secondary text (slate-500) |
| `--primary` / `--accent` | `oklch(0.72 0.12 55)` | Amber/copper — CTAs, links, focus rings |
| `--accent-foreground` | `oklch(0.25 0.05 55)` | Dark amber for text on accent bg |
| `--destructive` | `oklch(0.55 0.22 27)` | Error states, delete actions |
| `--success` | `oklch(0.65 0.17 145)` | Success states, high confidence |
| `--warning` | `oklch(0.75 0.15 80)` | Warning states, medium confidence |
| `--border` | `oklch(0.90 0.01 260)` | Borders (slate-200) |
| `--ring` | `oklch(0.72 0.12 55)` | Focus ring = accent |

## Typography Scale

| Level | Mobile | Desktop | Weight |
|-------|--------|---------|--------|
| h1 | 36px | 48px | Inter 600 |
| h2 | 24px | 30px | Inter 600 |
| h3 | 18px | 24px | Inter 600 |
| Body | 14px / 22px line-height | 14px / 22px | Inter 400 |
| Small | 12px / 16px line-height | 12px / 16px | Inter 400 |
| Mono (quantities) | 14px | 14px | Geist Mono 400 |

## Spacing & Radius

- **Spacing base:** 4px. Scale: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96.
- **Radius:** 6px (buttons), 8px (cards, `--radius: 0.5rem`), 12px (modals).

## Information Hierarchy (per screen)

### Landing Page
Hero (headline + phone mockup showing real scope) → How it works (3 numbered steps with screenshots, NOT icon cards) → Sample scope output (full-width) → Pricing table (NOT cards) → Trust ("Built by a tradie" pre-launch) → Final CTA

### Photo Upload
Drop zone/camera button (primary) → Photo thumbnails → "Next" button → Step indicator

### Details Form
Photo thumbs (context) → Property type → Interior/exterior → Description → "Generate Scope" CTA (sticky on mobile)

### Processing
Stage indicator (Analyzing → Generating → Validating) → Photo thumbnails (reassurance) → Progress animation

### Scope Editor
Scope header → Collapsible category groups (all collapsed mobile, all expanded desktop) → Item rows (description | quantity | unit | toggle) → Action bar (Download PDF | Send Email) → Confidence indicators (subtle) → Add Item → Credit balance

### Dashboard
Credit balance + Buy CTA → Scope list (most recent first) → "New Scope" button → Analytics summary

## Interaction States

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Photo Upload | Progress bar per photo | Drop zone + camera icon + "Drop photos or tap to browse" | Red outline on failed thumb + "Upload failed. Tap to retry." | Thumbnail grid with remove btn | Some uploaded, some failed: show both |
| AI Generation | 3-stage progress + photo thumbs visible | — | "Generation failed. Credit refunded." + [Try Again] | Auto-redirect to editor | — |
| Scope Editor | Skeleton rows per category | "Your scope is empty. Add items manually or regenerate." | Red toast for save failures, auto-retry on reconnect | Subtle "Saved" fade (1.5s) | Spinner per saving item |
| PDF Download | "Generating PDF" spinner on button | — | "PDF generation failed." [Retry] | Browser download triggers | — |
| Email Send | "Sending..." spinner in dialog | — | "Email failed to send." [Retry] | "Scope sent to {name}!" + checkmark | — |
| Dashboard | 3 skeleton cards | Guided redirect to create flow (new users) | "Couldn't load scopes." [Retry] | Scope card list | — |
| Credit Balance | Skeleton number | "0 credits" + [Buy Credits] | "Couldn't load balance." [Retry] | Balance + pack options | — |
| Tracking Page | Skeleton scope | — | "This scope is no longer available." | Full scope view + Download PDF | — |
| Credit Purchase | "Confirming payment..." spinner | — | "Payment failed." [Try Again] | "Credits added!" + balance update | Webhook pending: "Confirming..." |

## First-Time User Flow

New users (0 scopes) bypass dashboard → guided redirect to create flow with welcome message: "Welcome to ScopePro! You have 3 free scopes. Let's create your first one." Dashboard appears after first scope exists.

## Credit Warning

Amber banner on dashboard when balance <= 2: "You have {n} credits left. [Buy More]"

## Confidence Indicators (accessible)

| Level | Visual | Label |
|-------|--------|-------|
| HIGH | Green filled circle | "High confidence" (tooltip desktop) |
| MEDIUM | Amber half-circle | "Verify this" (tooltip desktop) |
| LOW | Red outline circle | "AI guessing" (always visible label) |

Accessible: shape + color + text (not color-only).

## PDF Design

- **Header:** Logo top-left, business name top-right, contact details below. Full-width header bar.
- **Body:** Items grouped by category. Each item: description, quantity, unit. Excluded items not shown.
- **Footer:** "Generated by ScopePro" + date.
- **Placeholder:** "Your Business Name" with prompt to complete for incomplete profiles.

## Email Template

Branded HTML: ScopePro header → scope summary (job name, item count, categories) → "View Scope" button (tracking link) → PDF attached.

## Scope Card (dashboard)

Job description (truncated), status badge (draft/generated/sent/viewed), date, property type icon. "Viewed" status appears when recipient opens tracking link.

## Responsive Specs

| Screen | Mobile (<640px) | Desktop (>1024px) |
|--------|----------------|-------------------|
| Photo Upload | Full-width drop zone, camera button prominent, 2-col thumbnail grid | Drop zone left + thumbnails right, 3-col grid |
| Details Form | Single column, sticky "Generate" button | Two columns (selectors left, description right) |
| Processing | Centered stages, photo strip horizontal scroll | Stage indicator left, photo grid right |
| Scope Editor | Collapsible categories, sticky bottom action bar, item fields stacked | All expanded, top-right action bar, item fields in one row |
| Tracking Page | Full-width scope, sticky bottom Download button | Max-width 768px centered, inline Download |
| Dashboard | Single column scope cards, credit balance top | 2-3 column card grid |
| Landing Hero | Stacked: headline → phone mockup → CTA | Side by side: left text + right phone mockup |

## Accessibility

- **Touch targets:** 44px minimum.
- **Color contrast:** WCAG AA (4.5:1 body, 3:1 large text).
- **Keyboard:** Tab through all interactive, Enter/Space activate, Arrow keys for item reorder, Escape close dialogs.
- **Screen readers:** ARIA landmarks (main, nav, form), aria-label on icon buttons, aria-live on auto-save + errors, role="status" on credit balance.
- **Focus:** 2px accent ring, focus trap in modals.
- **Images:** Alt text on thumbnails, PDF preview.
- **Motion:** prefers-reduced-motion respected.

## Landing Page Anti-Slop Rules

- NO 3-column icon-card feature grid
- NO purple/violet gradients
- NO centered-everything
- NO generic hero copy ("Welcome to...", "Unlock the power of...")
- NO decorative blobs or wavy SVG dividers
- Pricing as a table, not cards
- Steps as numbered list with screenshots, not icon cards
- Hero shows the PRODUCT (phone mockup with real scope), not abstract imagery
