# StorePilot — Deployment & Update Guide

## Infrastructure Overview

| Service | Purpose | URL |
|---|---|---|
| **GitHub** | Source code hosting | github.com/saniyad-hussain/storepilot-browser |
| **Vercel** | Next.js app hosting (auto-deploys on push) | https://storepilot-browser.vercel.app |
| **Neon** | PostgreSQL database | neon.tech |
| **Stripe** | Subscription billing | stripe.com |

---

## Local Development Setup

### First-time setup
```bash
# 1. Install dependencies
npm install

# 2. Make sure .env exists and has correct values (see .env.example)
# For local dev, use local or Neon DB URL

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed demo data (optional)
npm run db:seed

# 6. Start dev server
npm run dev
```

Open http://localhost:3000

### Demo login credentials (created by seed)

| Role | Email | Password |
|---|---|---|
| Owner | `owner@demo-retail.example.com` | `DemoPassword123!` |

> These are created by `npm run db:seed`. Use them on both local and production after seeding.

---

## Making & Deploying an Update

### Standard update flow (code changes only)

```bash
# 1. Make your code changes locally and test with npm run dev

# 2. Stage and commit
git add .
git commit -m "describe what you changed"

# 3. Push to GitHub — Vercel auto-deploys immediately
git push
```

Vercel will auto-detect the push, run `prisma generate && next build`, and deploy. No manual steps needed.

---

### Update that includes a database schema change

If you modify `prisma/schema.prisma`:

```bash
# 1. Create and apply migration locally
npm run db:migrate
# Enter a migration name when prompted (e.g. "add_store_color_field")

# 2. Apply migration to production Neon database
npm run db:deploy

# 3. Commit everything including the new migration files
git add prisma/
git add .
git commit -m "feat: add store color field"
git push
```

> Never use `db:push` in production — always use `db:deploy` to apply migrations safely.

---

### Update environment variables

If you need to add or change an env variable:

1. Update your local `.env` file
2. Go to **Vercel → Project → Settings → Environment Variables**
3. Add or update the variable there
4. Go to **Vercel → Deployments → click the latest → Redeploy**

> Vercel does NOT auto-deploy when you change env vars — you must manually redeploy.

---

## Key Files to Know

| File | What it does |
|---|---|
| `prisma/schema.prisma` | Database schema — edit this to add/change tables |
| `prisma/seed.ts` | Demo data seeder — run with `npm run db:seed` |
| `src/app/api/` | All backend API routes |
| `src/app/dashboard/` | All dashboard pages (UI) |
| `src/lib/plans.ts` | Subscription plan limits and Stripe price mapping |
| `src/lib/permissions.ts` | Role definitions and permission helpers |
| `src/lib/dashboard.ts` | Shared server helper for all dashboard pages |
| `extension/` | Chrome extension source files |
| `.env` | Local environment variables (never commit this) |
| `.env.example` | Template for env vars (safe to commit) |

---

## Prisma Commands Reference

```bash
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:migrate    # Create a new migration + apply it locally (dev only)
npm run db:deploy     # Apply pending migrations to production DB
npm run db:push       # Push schema without migration file (prototyping only)
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio to browse/edit DB visually
```

---

## Vercel Environment Variables

These must be set in Vercel → Project → Settings → Environment Variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session signing |
| `NEXTAUTH_URL` | Full app URL e.g. https://storepilot-browser.vercel.app |
| `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_... or sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) |
| `STRIPE_PRICE_STARTER` | Stripe Price ID for $99/mo Starter plan |
| `STRIPE_PRICE_BUSINESS` | Stripe Price ID for $199/mo Business plan |
| `STRIPE_PRICE_PRO` | Stripe Price ID for $299/mo Pro plan |

---

## Stripe Webhook

Endpoint URL (must be registered in Stripe Dashboard → Developers → Webhooks):
```
https://storepilot-browser.vercel.app/api/stripe/webhook
```

Required events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Chrome Extension

Extension source lives in the `extension/` folder.
Users can download it as a ZIP from **Dashboard → Settings → Download Extension (.zip)**.

### If you update extension files:
1. Edit files inside `extension/`
2. Commit and push — the download route auto-serves the latest files
3. Users need to re-download and re-load the extension in Chrome

### Manual install on a PC:
1. Unzip `storepilot-extension.zip`
2. Open `chrome://extensions` → enable Developer mode
3. Click "Load unpacked" → select the unzipped folder
4. Go to Dashboard → Settings → generate a token → paste into extension Options

---

## Connecting a Custom Domain

1. Go to **Vercel → Project → Settings → Domains** → add your domain
2. Add DNS records at your registrar (Hostinger or other):
   - `A` record: `@` → `76.76.21.21`
   - `CNAME` record: `www` → `cname.vercel-dns.com`
3. Update in Vercel env vars: `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain
4. Update Stripe webhook endpoint URL to your domain
5. Redeploy on Vercel

---

## Security Reminders

- Never commit `.env` — it is gitignored
- Never expose `STRIPE_SECRET_KEY` to the frontend or extension
- Rotate `NEXTAUTH_SECRET` if you suspect it is compromised (all sessions will be invalidated)
- Extension tokens are stored as SHA-256 hashes only — the raw token is shown once
- Revoke old extension tokens from Dashboard → Settings when a device is retired
