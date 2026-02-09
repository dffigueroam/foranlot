# AI Agent Coding Instructions for ForanLot

## Project Overview
**ForanLot** is a Colombian lottery prediction community platform (Next.js 16, React 19) with:
- Multi-lottery predictions (3, 4, 5-digit formats) covering Colombian, Spanish, and US lotteries
- JWT + bcrypt authentication with 7-day token expiration
- Stripe subscription management with automatic credit allocation
- Premium credit system (30/month or 365/year) for following numbers/users
- Automated verification via cron jobs comparing predictions to official results
- Real-time user rankings with accuracy tracking and earnings distribution (80% platform, 20% predictors)
- Admin approval workflow for manual payments
- All UI text is **Spanish** (Colombia/Latin America audience)

## Critical Architecture Patterns

### Database & Server Communication
- **Database**: Neon PostgreSQL with serverless connections via `neon()` from `@neondatabase/serverless`
- **Pattern**: Every `lib/*` file imports `const sql = neon(process.env.DATABASE_URL!)` at the top
- All queries use **tagged template literals**: `sql\`SELECT ... WHERE id = ${id}\`` (SQL injection safe)
- Queries return array of objects: `await sql\`...\`` returns type-safe query results
- Error handling: catch errors silently and return empty arrays/defaults (see [lib/predictions.ts](lib/predictions.ts#L29-L42))

### Three-Layer Request Pattern
**This is critical**: Form submissions follow a strict three-layer pattern:
1. **Client Component** (`"use client"`) - Form UI, sends `FormData` via form action
2. **Server Action** (`"use server"` in [app/actions/](app/actions/)) - Extracts FormData, calls lib functions, calls `revalidatePath()` to refresh cache
3. **Library Function** (in [lib/](lib/)) - Core business logic, database queries, error handling

Example flow for predictions:
- Client: [components/predictions/prediction-form.tsx](components/predictions/prediction-form.tsx) submits form
- Server action: [app/actions/predictions.ts#submitPrediction()](app/actions/predictions.ts#L8) validates and calls lib function
- Library: [lib/predictions.ts#createPrediction()](lib/predictions.ts#L59) does DB insert and lottery validation

**Key rule**: Server actions always end with `revalidatePath()` to bust Next.js cache on mutations.

### Authentication & Session Management
- `getCurrentUser()` in [lib/auth.ts](lib/auth.ts) reads JWT from cookies, returns `SessionData | null`
- `SessionData` interface includes: `userId`, `email`, `username`, `isPremium`, `role` ("user" | "admin")
- All API routes and server actions start with: `const user = await getCurrentUser(); if (!user) return { error: "..." }`
- Admin checks use: `if (user.role !== "admin") return { error: "Not authorized" }` (no thrown exceptions)
- JWT expiration: 7 days, set during login in [lib/auth.ts#login()](lib/auth.ts)

### Lottery Model
- **Lottery definitions**: [lib/lotteries.ts](lib/lotteries.ts) - array of `LOTTERIES` with `name`, `country`, `dias`, `digits[]`
- **Lottery types**: Stored as `lottery_type` = `"3_digits"` | `"4_digits"` | `"5_digits"`
- **Predictions**: Store `predicted_number` as **string** (space-separated if multiple, e.g., `"123 124 125"`) to preserve leading zeros
- **Digits validation**: When creating predictions, check `lottery.digits.includes(digitCount)` - each lottery supports specific digit counts
- **Verification**: Compare `predicted_number` against official lottery results fetched via API at 9 PM daily

### Credit & Selection System
- **Premium subscription**: Via Stripe checkout → webhook creates user, allocates credits via `initializeUserCredits()` in [lib/credits.ts](lib/credits.ts)
- **Credit amounts**: 30 credits/month (subscription) or 365/year, then decremented daily by active selections
- **Selection types**: 
  - `"number"` - Follow a specific lottery number, receive all predictions matching that number
  - `"user"` - Follow a user's all predictions
- **Daily cost**: Each active selection deducts 1 credit via `/api/cron/deduct-credits` at 12 AM
- **Expiration**: Selections auto-deactivate when user runs out of credits, with notifications
- **Credit transactions**: Logged in `credit_transactions` table with `transaction_type` and `description`

### Cron Job System (Vercel)
**Must be configured in Vercel Dashboard** > Settings > Cron Jobs, with `CRON_SECRET` env variable:
1. **9 PM daily** (`0 21 * * *`) - `GET /api/cron/verify` - Calls `verifyPendingPredictions()` from [lib/verification.ts](lib/verification.ts)
   - Fetches lottery API results, compares against predictions, sets `is_correct` flag
   - Distributes earnings: 20% to predictors with matches, 80% platform keeps
2. **12 AM daily** (`0 0 * * *`) - `GET /api/cron/deduct-credits` - Calls `checkExpiredSelections()` from [lib/credits.ts](lib/credits.ts)
   - Deducts 1 credit per active selection per user
   - Deactivates selections when credits hit zero

**Security**: Routes check `Authorization: Bearer ${CRON_SECRET}` header - use header not query param.

### Stripe Integration Points
- **Customer creation**: On user signup, create Stripe customer in [lib/stripe.ts#createOrUpdateStripeCustomer()](lib/stripe.ts)
- **Checkout sessions**: In [lib/stripe.ts#createCheckoutSession()](lib/stripe.ts), create session with `metadata.userId` for webhook lookup
- **Webhook handler**: [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts)
  - `checkout.session.completed` - Update `users.is_premium = true`, set `subscription_status`
  - `customer.subscription.deleted` - Set `is_premium = false`
  - Always verify signature: `stripe.webhooks.constructEvent(body, signature, webhookSecret)`
- **Never update DB on client** - All Stripe mutations happen server-side via webhooks only

## Code Patterns & Conventions

### Error Handling (No Exceptions)
- Server actions/API routes: Return `{ error: "Human readable message" }` or `{ success: true }`
- Never throw exceptions - use error objects for all error cases
- Log with `console.log("[v0] message")` prefix for debugging (v0 = codebase convention)
- Example: `return { error: "Lotería no válida" }` (Spanish error messages for user-facing text)

### Database Queries
All queries in `lib/*` follow this pattern:
```typescript
import "server-only" // Or "use server-only" at top
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

// Type the result
interface MyRow { id: number; name: string }
const result = await sql`SELECT id, name FROM table WHERE id = ${id}`
const typed = result as MyRow[]
```

### TypeScript Interfaces
Define at top of each `lib/*` file. Examples:
- `User` in [lib/auth.ts](lib/auth.ts#L18) - Database user row
- `UserCredits` in [lib/credits.ts](lib/credits.ts#L6) - Credit tracking
- `Prediction` in [lib/predictions.ts](lib/predictions.ts#L7) - Prediction row with lottery info
- `UserSelection` in [lib/credits.ts](lib/credits.ts#L17) - Premium selection record

### Form Validation
- Client: Use `react-hook-form` + `zod` schemas in component
- Server action: **Always re-validate** - extract from FormData, check again (never trust client)
- Example from [app/actions/predictions.ts#submitPrediction()](app/actions/predictions.ts#L25-L26):
  ```typescript
  if (!lotteryName || !lotteryType || !predictedNumber) return { error: "..." }
  ```

### UI Component Stack
- **Radix UI**: Low-level primitives (Dialog, Select, etc.) from `@radix-ui/*`
- **Shadcn/ui wrappers**: [components/ui/](components/ui/) - button, card, alert, etc.
- **Tailwind CSS v4**: Utility classes, custom animations via `tailwindcss-animate`
- **Form components**: Wrap `react-hook-form` with shadcn inputs for consistency
- **Icons**: `lucide-react` for all UI icons

## File Organization

| Path | Purpose |
|------|---------|
| [lib/](lib/) | Database queries, business logic, utilities - **server-only** |
| [app/actions/](app/actions/) | Server actions handling form submissions, call lib functions |
| [app/api/](app/api/) | API routes - cron jobs, webhooks, auth endpoints |
| [components/](components/) | React components; `ui/` subfolder for Radix wrappers |
| [app/](app/) | Next.js app router pages |
| [scripts/](scripts/) | SQL migration files (001_ through 005_) |
| [styles/](styles/) | Global CSS |

## Essential Files Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| [lib/auth.ts](lib/auth.ts) | JWT management, session | `getCurrentUser()`, `login()`, `register()` |
| [lib/predictions.ts](lib/predictions.ts) | Prediction CRUD | `createPrediction()`, `getPredictions()` |
| [lib/credits.ts](lib/credits.ts) | Credit tracking, selections | `getUserCredits()`, `addCredits()`, `addSelection()`, `checkExpiredSelections()` |
| [lib/verification.ts](lib/verification.ts) | Cron verification | `verifyPendingPredictions()` |
| [lib/ranking.ts](lib/ranking.ts) | User stats | `getUserStats()`, `getRanking()` |
| [lib/stripe.ts](lib/stripe.ts) | Stripe client & helpers | `createCheckoutSession()`, `initCustomer()` |
| [lib/lotteries.ts](lib/lotteries.ts) | Lottery definitions | `LOTTERIES` const array |

## Development Workflow

### Local Setup
```bash
npm install
npm run dev                    # http://localhost:3000
npm run build && npm start     # Test production build
npm run lint                   # ESLint
```

### Database
1. Set `DATABASE_URL` in `.env.local` (Neon PostgreSQL)
2. Run SQL scripts in `/scripts/` in order: 001_, 002_, 003_, 004_, 005_
3. Seed initial lottery data via `002_seed_data.sql`

### Environment Variables (`.env.local`)
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[db]
JWT_SECRET=your-random-32-char-string-minimum
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=your-random-cron-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Task Patterns

### Add a Feature Page
1. Create `app/feature-name/page.tsx` (Server Component)
2. Create `components/feature-name/` folder with UI components
3. For data mutations:
   - Add server action in `app/actions/feature-name.ts`
   - Add lib function in `lib/feature-name.ts` (if complex)
   - Call `revalidatePath()` after mutations

### Add a Database Table
1. Create migration in `scripts/006_add_my_table.sql`
2. Add interface to corresponding `lib/*.ts` file
3. Add queries in that lib file, import `neon()` and `sql`

### Protect an API Route
```typescript
// In app/api/route.ts
const user = await getCurrentUser()
if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
```

### Query Related Data (Predictions with Username)
Use JOIN to fetch related entities:
```typescript
const predictions = await sql`
  SELECT p.*, u.username 
  FROM predictions p
  JOIN users u ON p.user_id = u.id
  WHERE p.user_id = ${userId}
`
```

## Project-Specific Decisions

| Decision | Reason |
|----------|--------|
| No client-side DB access | Security; all queries in server-only `lib/` |
| FormData in server actions | Progressive enhancement, works without JS |
| Strings for prediction numbers | Preserve leading zeros (e.g., "003" vs 3) |
| 7-day JWT expiration | Short-lived tokens for security |
| Error objects not exceptions | Consistent error handling across async operations |
| [v0] log prefix | Distinguishes AI-generated code in logs |
| Spanish UI text | ForanLot serves Colombian/Latin American users |

---

**Last Updated**: February 2026 | Next.js 16 | React 19 | Neon PostgreSQL
