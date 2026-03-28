@AGENTS.md

# ScopePro

AI-powered scope of work generator for Australian painting contractors. Upload photos → add details → get a branded PDF scope in under 2 minutes. Credit-based pricing.

## Tech Stack
- Next.js 16 (App Router, Turbopack) + TypeScript
- Convex (backend, auth, real-time, file storage)
- Gemini (AI vision + text for scope generation)
- Stripe (credit pack purchases)
- @react-pdf/renderer (client-side PDF generation, dynamic import only)
- Resend (email delivery, "use node" in Convex)
- shadcn/ui v4 (base-nova, base-ui — uses `render` prop, NOT `asChild`)
- Tailwind CSS v4 (oklch colors, @theme inline)

## Key Patterns
- Convex Auth: `getAuthUserId` from `@convex-dev/auth/server` for all auth checks
- All public Convex functions verify userId ownership
- Internal mutations for system operations (updateStatus, addCredits, etc.)
- Frontend imports: use `@/convex/_generated/api` (with @/ alias)
- Convex source files excluded from tsconfig (typed by Convex's own system)
- Status high-water mark: draft → generated → sent → viewed (never backwards)
- Credit overdraft allowed to -2 (check `balance > -2` before deduction)
- 3 free credits for new users (lazy creation on first mutation)
- Max 6 photos per scope, max 100 items per scope

## Design System
- Warm/earthy palette: amber/copper accent `oklch(0.72 0.12 55)`
- Inter font (body), Geist Mono (quantities)
- Light mode only (dark mode deferred)
- See DESIGN.md for full specs

## Running
```bash
# Dev (requires Convex deployment + env vars)
npx convex dev        # Start Convex backend
npm run dev           # Start Next.js frontend

# Build
npm run build         # Production build

# Env vars needed (in Convex dashboard + .env.local):
# CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL
# GEMINI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
# STRIPE_PRICE_10_PACK, STRIPE_PRICE_25_PACK, STRIPE_PRICE_50_PACK
# RESEND_API_KEY
```
