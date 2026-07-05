# StorePilot Browser Security & Access Hub

> A safer browser workspace for your store team — organized links, secure access practices,
> password manager support, and monthly browser safety checks.

StorePilot helps multi-store businesses organize their daily browser workflow, reduce unsafe
password sharing, and keep important store tools easier to access. It ships as a **SaaS web
dashboard** (Next.js) plus a **Chrome extension** (Manifest V3) for store PCs.

**Positioning:** We help make store computers safer for daily business use by organizing browser
access, reducing risky password sharing, reviewing suspicious extensions, supporting 2FA setup,
and helping teams follow safer login practices. StorePilot is **not** antivirus software and
does **not** store passwords.

---

## 1. Project overview

| Part | Location | Description |
| --- | --- | --- |
| Web dashboard | `src/` | Next.js 14 App Router app: stores, links, templates, team, devices, safety checks, support requests, billing, audit logs |
| API | `src/app/api/` | REST endpoints with Zod validation, server-side permission checks, Stripe billing, extension API |
| Database | `prisma/` | Prisma schema + seed script (PostgreSQL) |
| Chrome extension | `extension/` | Manifest V3 popup + options page ("StorePilot Access Hub") |

### Core features

- Store access/link organization (per-store, categorized, URL-sanitized)
- Customer reply templates with one-click copy
- Support request system (dashboard + extension)
- Device/PC tracking with last-seen heartbeats
- Monthly browser safety checklist records
- Team roles: OWNER, ADMIN, MANAGER, STAFF, VIEWER (enforced server-side)
- Stripe monthly subscriptions with gating (Starter $99 / Business $199 / Pro $299)
- Audit logs for important admin actions

## 2. Tech stack

- Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components
- Prisma ORM + PostgreSQL
- NextAuth (credentials, JWT sessions in secure HTTP-only cookies)
- Stripe subscriptions (Checkout + Customer Portal + webhooks)
- Zod validation + React Hook Form
- Chrome Extension Manifest V3 (permissions: `storage`, `tabs` only)

## 3. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL for NextAuth (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL used for Stripe redirects |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | Stripe Price ID for the $99/mo Starter plan |
| `STRIPE_PRICE_BUSINESS` | Stripe Price ID for the $199/mo Business plan |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the $299/mo Pro plan |

> Stripe secret keys are used **only** in server code. They are never sent to the frontend or
> the Chrome extension.

## 4. Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
copy .env.example .env   # (Windows) then edit values

# 3. Create the database schema
npm run db:migrate       # prisma migrate dev

# 4. Seed demo data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open http://localhost:3000. Demo login (from seed):

- Email: `owner@demo-retail.example.com`
- Password: `DemoPassword123!`

## 5. Prisma migration commands

```bash
npm run db:generate   # Regenerate the Prisma client
npm run db:migrate    # Create/apply a dev migration (prisma migrate dev)
npm run db:deploy     # Apply migrations in production (prisma migrate deploy)
npm run db:push       # Push schema without migrations (prototyping only)
npm run db:studio     # Browse data with Prisma Studio
```

## 6. Seed command

```bash
npm run db:seed
```

Creates the **Demo Retail Group** workspace with stores (Style Home Furniture, Academy Fence,
Home Decor Outlet), 12 tool links, 7 reply templates, a demo device, and an example browser
safety check.

## 7. Stripe setup

1. Create a Stripe account and open the Dashboard.
2. Create a **Product** for each plan with a **recurring monthly price**:
   - Starter — $99/month
   - Business — $199/month
   - Pro — $299/month
3. Copy the three Price IDs into `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_BUSINESS`,
   `STRIPE_PRICE_PRO`.
4. Copy your secret key into `STRIPE_SECRET_KEY`.

Backend endpoints (all Stripe logic is server-side):

- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/create-portal-session`
- `POST /api/stripe/webhook`

Handled webhook events: `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`,
`invoice.payment_failed`.

Subscription status is stored on the `Workspace` record. Only workspaces with `ACTIVE` or
`TRIALING` status can use the dashboard and extension API; otherwise the extension API returns:
`"Subscription inactive. Please contact your workspace owner."`

## 8. Stripe webhook local testing

```bash
# Install the Stripe CLI, then:
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` value printed by the CLI into `STRIPE_WEBHOOK_SECRET` and restart the dev
server. Trigger test events with e.g. `stripe trigger checkout.session.completed`.

## 9. Chrome extension local install

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` folder.
4. In the StorePilot dashboard, go to **Settings → Chrome extension setup** and generate a
   connection token (shown once).
5. Right-click the extension icon → **Options**:
   - API base URL: `http://localhost:3000` (or your production URL)
   - Paste the connection token
   - Enter a device name (e.g. "Front Counter PC") and choose the store
   - Click **Connect & register device**
6. Open the popup — you'll see the store's quick links, reply templates, and the support
   request form.

Extension API endpoints:

- `GET  /api/extension/bootstrap` — workspace, assigned store, links, templates, permissions, subscription status
- `POST /api/extension/device-heartbeat` — updates `lastSeenAt`
- `POST /api/extension/support-request` — creates a support request (rate limited)
- `POST /api/extension/register-device` — registers a device/PC

Authentication uses a bearer token generated in the dashboard. Only a SHA-256 hash is stored in
the database; the extension keeps the raw token in `chrome.storage.local`. No passwords are
ever stored.

## 10. Production deployment notes

- **App:** Deploy the Next.js app to Vercel. Set all environment variables in the Vercel
  project settings.
- **Database:** Use managed PostgreSQL from Supabase, Neon, or Railway. Run
  `npm run db:deploy` during release.
- **Stripe:** Switch to live keys, create live Products/Prices, and configure the webhook
  endpoint `https://your-domain.com/api/stripe/webhook` in the Stripe Dashboard (copy the live
  webhook secret into `STRIPE_WEBHOOK_SECRET`).
- **Extension:** Zip the `extension/` folder for distribution. Either publish to the Chrome
  Web Store or install privately on client PCs via "Load unpacked" / enterprise policy.
- **Rate limiting:** The included rate limiter is in-memory (fine for a single instance). For
  multi-instance deployments, swap `src/lib/rate-limit.ts` for a shared store (e.g. Upstash
  Redis) with the same interface.

## 11. Security notes

- **No passwords for business tools are ever stored.** There are no password fields for store
  tools anywhere in the product. Only the dashboard login password is stored, as a bcrypt hash.
- All inputs are validated with Zod on the server.
- URLs are sanitized: only `http://` and `https://` are accepted; `javascript:`, `data:` and
  other schemes are rejected.
- Server-side permission checks on every API route (roles: OWNER > ADMIN > MANAGER > STAFF >
  VIEWER). Frontend checks are cosmetic only.
- Extension tokens are random 32-byte values; only their SHA-256 hash is stored and tokens can
  be revoked.
- Rate limiting on registration, support request, heartbeat and device registration endpoints.
- Audit logs record: store/link/template create/update/delete, member invite/remove/role
  change, device register/update, support request status changes, safety check creation, and
  billing status changes from webhooks.
- Secure HTTP-only cookies for web sessions; security headers set in `next.config.mjs`.
- Stripe secret keys and webhook secrets live only on the backend.
- The extension uses least-privilege permissions: `storage` and `tabs` only. No `history`,
  `cookies`, `webRequest`, or broad host permissions.

## 12. What this product does NOT do

- **Does not store passwords.** Use an approved password manager (1Password or Bitwarden).
- **Does not replace antivirus.** Keep reputable endpoint protection on all PCs.
- **Does not guarantee full protection.** No product can make a computer or browser 100% safe;
  StorePilot helps reduce common risks through organization and checklists.
- **Does not monitor employees secretly.** Devices report only a name and last-seen time,
  visible to the whole team. No browsing history, cookies, or keystrokes are ever collected.

---

© StorePilot Browser Security & Access Hub. See [Privacy Policy](/privacy) and [Terms](/terms).
