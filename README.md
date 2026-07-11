# CookVerse Web

Next.js 14 (App Router) + TypeScript + Tailwind frontend — Phase 0 foundation: auth (email + Google), onboarding, and an empty authenticated shell. See `../08-phase-0-roadmap.md` for the stage-by-stage plan this implements, and `../06-design-system.md` for the tokens wired into `tailwind.config.ts`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase URL/anon key + the API URL
npm run dev
```

Requires `cookverse-api` running (or deployed) at the URL in `NEXT_PUBLIC_API_URL` — onboarding and the feed placeholder both call it.

## What's here

- `app/(marketing)/` — logged-out landing page
- `app/(auth)/` — login, signup, onboarding (skill level + real favorite-cuisine picker, backed by `GET /v1/cuisines`)
- `app/auth/callback/` — OAuth/email-confirmation redirect handler
- `app/(main)/` — authenticated shell with the adaptive nav (bottom tab bar under 1024px, left sidebar at 1024px+) and a placeholder feed page
- `components/ui/button.tsx` — the one shadcn-pattern primitive scaffolded so far; add the rest the same way (cva variants + `cn()`) as new components are needed
- `components/layout/AppNav.tsx` — the adaptive navigation itself

## Design tokens

`tailwind.config.ts` and `app/layout.tsx` wire in the six brand colors, the Fraunces/Public Sans/JetBrains Mono type stack, and the 6px/12px radius scale from `06-design-system.md`. Extend that file rather than hand-picking colors per component.

## Deploying to Vercel

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL` (pointing at the deployed Render API) as environment variables in the Vercel project settings — the `NEXT_PUBLIC_` prefix means these are safe to expose to the browser (this is the anon key, not the service role key).
