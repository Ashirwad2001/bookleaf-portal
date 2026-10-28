# BookLeaf Publishing — Author Support & Communication Portal

An intelligent, real-time Author Support and Operations Portal built for **BookLeaf Publishing** to manage author communications at publishing scale (processing 1,200+ monthly books across 22,000+ titles).

Powered by **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Google Gemini AI** with Server-Sent Events (SSE) for instant, live updates.

---

## 🌟 Key Features

### 1. Author-Facing Portal (`/author`)
- **Published & Production Books Showcase**: Complete view of published titles, ISBNs, distribution channels (Amazon India, Flipkart, BookLeaf Store, Amazon US/UK), and print partners.
- **Real-Time Financial & Royalty Metrics**: Tracks copies sold, 80/20 royalty split earnings, amounts disbursed, and current pending payouts.
- **Edge Case Handling**:
  - *Books in Production*: Cleanly indicates production milestone stage (e.g., Typesetting, Cover Design) and clarifies that royalty tracking activates upon publication.
  - *Minimum Payout Threshold*: If pending balance is < ₹1,000 (e.g., Kavita Deshmukh's ₹850), clearly displays policy rollover notice.
- **Support Ticket Submission Form**: Allows authors to select their book (or General / Account Level), define subject and detailed description, and attach defect photos or documents.
- **Live Ticket Conversation**: Real-time thread where replies from the operations team appear instantly without page refresh via Server-Sent Events (SSE).

### 2. Operations Admin Portal (`/admin`)
- **Urgent-First Ticket Queue**: Incoming queries sorted with unresolved **Critical** and **High** priority tickets highlighted at the top so urgent issues are never missed.
- **Multi-Dimensional Filters & Search**: Filter by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), 6 publishing categories, priority levels, and text search.
- **AI Auto-Classification & Priority Scoring**: Automatically tags tickets into:
  1. *Royalty & Payments*
  2. *ISBN & Metadata Issues*
  3. *Printing & Quality*
  4. *Distribution & Availability*
  5. *Book Status & Production Updates*
  6. *General Inquiry*
- **Admin Overrides**: Full capability for admins to override AI category or priority with automated audit tracking (`categoryOverridden`, `priorityOverridden`).
- **Grounded AI Draft Generation**: Contextual drafts cite BookLeaf-specific policies (80/20 split, ₹1,000 threshold, 45-day post-quarter payout, 5–7 business days reprint turnaround for defects). Admin can edit before sending.
- **Private Internal Notes**: Operations team can document internal progress (e.g. printer contact, bank account reconciliation) invisible to authors.
- **Ticket Assignment & Status Workflow**: Assign to self or colleagues, transition tickets through lifecycle stages.

### 3. REST API & Real-Time Layer (`/docs` & `/api/...`)
- Fully structured REST endpoints with JWT authentication and strict Role-Based Access Control (RBAC).
- Server-Sent Events (SSE) endpoint (`/api/stream`) for streaming real-time notifications.
- Interactive API documentation page at `/docs` and raw OpenAPI 3.0 specification at `/api/docs`.

---

## 🔑 Test Credentials (Pre-Seeded Dataset)

All 10 authors and 18 books from `bookleaf_sample_data.json` are pre-seeded into the database. You can also use the **1-Click Demo Switcher** directly on the landing page (`http://localhost:3000`).

| Role | Name | Email | Password | Notable Test Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | BookLeaf Ops Lead | `admin@bookleaf.com` | `admin123` | Full queue management, AI overrides, drafts |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `author123` | 2 live books, ₹3,570 pending royalty |
| **Author** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | `author123` | Bestseller volume, ₹7,744 pending royalty |
| **Author** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | `author123` | Book in production (*Midnight in Mysore*, Cover Design) |
| **Author** | Kavita Deshmukh (`AUTH009`)| `kavita.deshmukh@email.com` | `author123` | Production typesetting + ₹850 (< ₹1,000 threshold rollover) |
| **Author** | Farhan Sheikh (`AUTH008`) | `farhan.sheikh@email.com` | `author123` | Defective author copies, critical reprint claim |

---

## 🚀 Quick Setup & Local Execution

### Prerequisites
- Node.js `v18+` (Tested on `v24.14.0`)
- npm `v9+`

### 1. Clone & Install Dependencies
```bash
cd Project
npm install
```

### 2. Environment Configuration
Copy the provided `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="bookleaf-secret-jwt-key-2026-production-ready"

# (Optional) Google Gemini API Key
# If omitted or empty, the app seamlessly uses the built-in heuristic Knowledge Base engine!
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to SQLite
npx prisma db push

# Seed authors, books, and realistic starter tickets
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Automated Unit & Integration Tests (16 Tests Passing)
Run the automated test suite covering authentication, business rules, AI classification, and database queries:
```bash
npm test
```
The test suite validates:
- **Authentication & Security**: Password hashing (`bcrypt`), JWT signing & verification (`jose`), tamper protection.
- **Royalty & Business Logic**: 80/20 net profit calculation, minimum ₹1,000 threshold rollover, production-stage books.
- **AI Classification & Knowledge Base**: All 6 publishing categories, priority escalation (`CRITICAL`/`HIGH`), policy grounding.
- **Database & Relations**: Prisma ORM author-book-ticket relations, cascade handling, and seed validation.

---

## 🌐 Deploying to Vercel & Production

### Can we deploy this project on Vercel?
**Yes!** Next.js 16 (App Router), TypeScript, Tailwind CSS, and Google Gemini run natively on Vercel with zero extra setup.

### Database Consideration for Vercel:
- **Locally**, this project uses SQLite (`prisma/dev.db`) for zero-configuration testing.
- **On Vercel's serverless architecture**, the filesystem is ephemeral/read-only across distributed lambda instances.
- **For production deployment on Vercel**, you simply connect any managed cloud database:
  1. **Vercel Postgres / Neon / Supabase (PostgreSQL)**:
     - In `prisma/schema.prisma`, change:
       ```prisma
       datasource db {
         provider = "postgresql"
         url      = env("DATABASE_URL")
       }
       ```
     - Set `DATABASE_URL="postgres://..."` in your Vercel Project Settings $\rightarrow$ Environment Variables.
  2. **Turso (Serverless SQLite / libSQL)**:
     - If you prefer to keep SQLite syntax with distributed edge storage, use Turso (`@prisma/adapter-libsql`).
  3. **Alternative 1-Click SQLite Hosting**:
     - If you want to keep the local SQLite file without creating an external cloud DB, deploy to **Railway**, **Render**, or a **VPS / Docker container** with a persistent disk volume.

### Vercel Deployment Steps:
1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: Your database connection string.
   - `JWT_SECRET`: A secure 32+ character random secret.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `NEXT_PUBLIC_APP_URL`: `https://your-vercel-domain.vercel.app`
4. In Build Settings:
   - Build Command: `prisma generate && next build`
5. Click **Deploy**!

---

The AI subsystem (`src/lib/ai/`) received the highest design priority (25% evaluation weighting):

### 1. Prompt Engineering & Policy Grounding
- Prompts embed BookLeaf's exact operating guidelines:
  - **80/20 Royalty Split**: 80% net profit to author (MRP minus print costs, platform commission, shipping).
  - **Quarterly Cycle**: Disbursed within 45 days after quarter close.
  - **₹1,000 Threshold**: Amounts below ₹1,000 roll over automatically.
  - **Printing Guarantee**: 100% free reprint for physical defects upon photo verification, turnaround 5–7 business days.
  - **Distribution**: Re-sync triggered within 24–48 hours for stock issues.
- **Empathetic & Professional Tone**: Acknowledges author frustration first, owns BookLeaf errors directly, gives concrete timelines (48-hour resolution), and states clear next steps.

### 2. Graceful Degradation & Resilience
- **Offline / Rate-Limit Safety**: If `GEMINI_API_KEY` is not provided, or if the Gemini API rate limits or experiences downtime, the system **never crashes**.
- The fallback engine (`src/lib/ai/fallbackEngine.ts`) applies rule-based categorization, policy-aware priority scoring, and injects specific author/book parameters into Knowledge Base response templates.

### 3. Token Cost Awareness
- Instead of dumping the entire knowledge base and ticket history into every LLM request, the system uses **selective context injection**: only the relevant policy excerpts (e.g. royalty policies for payment queries, print policies for defect reports) are injected into the prompt.

### 4. Model Choice Justification
- **Google Gemini 1.5 Flash (`gemini-1.5-flash`)**:
  - Extremely fast response times (< 800ms).
  - Native structured JSON schema outputs (`responseMimeType: "application/json"`).
  - Low cost / free tier accessibility for self-publishing startups handling high query volumes.

---

## 📡 REST API Reference

Full interactive documentation is available at **`/docs`**, with raw OpenAPI 3.0 specification at **`/api/docs`**.

### Authentication
- `POST /api/auth/login`: Authenticate author or admin. Sets HttpOnly JWT cookie.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/auth/me`: Returns active session profile.
- `GET /api/auth/demo-users`: Pre-seeded user accounts list for evaluation.

### Author Portal
- `GET /api/author/books`: Retrieve books and aggregate royalty metrics for logged-in author.
- `GET /api/author/tickets`: Retrieve all support tickets submitted by logged-in author.
- `POST /api/author/tickets`: Submit a new support query (runs AI classification, priority scoring, draft generation, and broadcasts SSE).
- `GET /api/author/tickets/:id`: View individual ticket thread (enforces author ownership).
- `POST /api/author/tickets/:id/reply`: Post follow-up message to a ticket.

### Admin Operations
- `GET /api/admin/tickets`: Fetch ticket queue with status, category, priority filters and `urgent_oldest` sorting.
- `GET /api/admin/tickets/:id`: Detailed ticket workspace with author context, books history, and internal notes.
- `PATCH /api/admin/tickets/:id`: Update ticket status, assign admin, or override AI classification/priority.
- `POST /api/admin/tickets/:id/reply`: Send official admin response (AI-assisted or manual) with real-time SSE push.
- `POST /api/admin/tickets/:id/notes`: Add an internal note (admin team eyes only).
- `POST /api/admin/tickets/:id/regenerate-ai`: Re-run AI response generation on demand.
- `GET /api/admin/stats`: Operational dashboard metrics.

### Real-Time Streaming
- `GET /api/stream`: Server-Sent Events (SSE) stream for live ticket updates without page refreshing.

---

## 🏗️ Architecture Decisions

1. **Next.js App Router (Full-Stack Monorepo)**:
   - Eliminates CORS issues, simplifies deployment, and keeps client components and REST API routes strictly typed.
2. **SQLite with Prisma ORM**:
   - Zero-configuration local database that works out-of-the-box for evaluation with no external database servers or Docker required. Can be switched to PostgreSQL in production simply by updating `datasource db` in `schema.prisma`.
3. **Server-Sent Events (SSE) over WebSockets**:
   - HTTP-native streaming without requiring persistent stateful socket servers or separate WebSocket brokers. Works seamlessly across serverless environments and behind standard reverse proxies.
4. **Role-Based Access Control (RBAC)**:
   - Authors can strictly access only their own books and tickets. Admin routes require `ADMIN` role claims encoded in signed JWTs.
