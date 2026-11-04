# BookLeaf Assignment 2 — Screen Recording & Walkthrough Script (3–5 Minutes)

This script provides an exact, minute-by-minute narration and action guide for recording the technical demonstration video for BookLeaf's founders and reviewing engineers.

---

## Video Specifications
- **Target Duration**: 3 minutes 30 seconds to 4 minutes 30 seconds
- **Resolution**: 1080p (1920x1080)
- **Audio**: Clear microphone with background noise suppression

---

## Walkthrough Timeline

### 0:00 – 0:30 | Introduction & Architectural Framing
- **Screen**: Display the Bubble login page (`/login`) alongside the Mermaid architecture diagram (`ARCHITECTURE.md`).
- **Narration**:
  > *"Hello BookLeaf team. Today I am presenting my technical assignment 2: the Author Royalty Dashboard & Automated Notification System. This platform connects a Bubble.io frontend and native database with an n8n orchestration engine and an LLM AI policy agent. 
  > In this demo, I will walk you through the author portal, the operations admin portal, our deterministic financial calculations, our database-level privacy rules, and our live n8n webhook and callback integration."*

---

### 0:30 – 1:15 | Author Persona & Royalty Dashboard
- **Screen**: Log in as Priya Sharma (`priya.sharma@email.com` / `author123`).
- **Actions**:
  1. Click Sign In. The app navigates to `/author-dashboard`.
  2. Highlight the three consolidated KPI cards:
     - Total Royalty Earned: **₹19,908**
     - Total Royalty Paid: **₹16,338**
     - Outstanding Royalty Pending: **₹3,570**
  3. Point to the **YELLOW** status badge: *"Pending (In Normal Cycle)"*.
  4. Scroll down to the **"My Books"** section:
     - Show *Whispers of the Ganges* (342 sold, ₹3,570 pending, last payout: 2025-10-15).
     - Show *The Saffron Diaries* (189 sold, ₹0 pending, last payout: 2025-12-01).
- **Narration**:
  > *"Notice how the dashboard calculates consolidated numbers across Priya's published catalog. Now, let's look at the database privacy rules: Priya cannot see or query books belonging to Rohit Kapoor or any other author. Even if someone inspects network traffic, Bubble's server-side Privacy Rules enforce zero cross-author leakage."*

---

### 1:15 – 2:00 | Operations Admin Portal & Multi-Dimensional Triage
- **Screen**: Log out of Priya's account and log in as Admin (`admin@bookleaf.com` / `admin123`).
- **Actions**:
  1. Arrive at `/admin-dashboard`.
  2. Demonstrate the live Author Overview table:
     - Type `"Priya"` into the search box $\rightarrow$ shows Priya Sharma.
     - Clear search, select City filter `"Nagpur"` $\rightarrow$ isolates Kavita Deshmukh.
     - Clear city, select Status filter `"All Paid (Green)"` $\rightarrow$ isolates Farhan Sheikh.
  3. Highlight the KPI badges: Farhan is GREEN (₹0 pending), Vikram Joshi is RED (> 90 days overdue payout), and others are YELLOW.
- **Narration**:
  > *"Admins have real-time visibility across all 10 authors and 18 books. We can filter instantly by author name, city, or payout status. Notice our status badges: Farhan Sheikh is green because all royalties are settled. Vikram Joshi is flagged in red because his last payout was over 90 days ago."*

---

### 2:00 – 2:45 | Author Detail Inspection & Single Webhook Trigger
- **Screen**: Open the Author Detail drawer for Priya Sharma.
- **Actions**:
  1. Point out Priya's verified profile, book catalog, and payout history.
  2. Point to the button: **"Generate & Send Royalty Summary"**.
  3. Click the button.
  4. Point to the loading indicator: *"Orchestrating n8n AI workflow... Generating summary..."*
- **Narration**:
  > *"When an admin clicks 'Generate & Send Royalty Summary', Bubble first checks if an active duplicate request is already in progress. If not, it creates a NotificationLog entry with status 'PROCESSING' and fires an authenticated HTTP POST webhook to n8n carrying the unique request ID."*

---

### 2:45 – 3:30 | n8n Execution & Deterministic AI Summary Handshake
- **Screen**: Switch browser tab to the n8n canvas showing `bookleaf-royalty-summary.json`.
- **Actions**:
  1. Show the live execution path lighting up on n8n:
     - Webhook trigger $\rightarrow$ Auth validation $\rightarrow$ Fetch Author from Bubble $\rightarrow$ Fetch Books from Bubble $\rightarrow$ Deterministic Aggregator $\rightarrow$ AI LLM Node $\rightarrow$ Success Callback.
  2. Show the deterministic calculation node:
     - Highlight: `total_copies_sold = 531`, `total_earned = ₹19,908`, `total_paid = ₹16,338`, `total_pending = ₹3,570`.
  3. Switch back to Bubble:
     - The Author Detail drawer and Notification Log now display status: **SUCCESS**!
     - Show the generated email subject and full multi-paragraph body.
- **Narration**:
  > *"Here on the n8n canvas, you can see our 11-node architecture. Rather than relying on client data, n8n queries Bubble's Data API as the single source of truth. Our JavaScript node calculates the financial numbers deterministically before calling the LLM. 
  > The LLM receives pre-verified numbers and BookLeaf policies—our 80/20 split, quarterly 45-day cycle, and ₹1,000 threshold. Once generated, n8n calls back into Bubble's Backend Workflow to update the NotificationLog to SUCCESS in real time."*

---

### 3:30 – 4:00 | Bulk Trigger & Policy Edge Cases
- **Screen**: Back on `/admin-dashboard`.
- **Actions**:
  1. Click **"Generate Summaries for All Authors with Pending Royalties"**.
  2. Explain that the workflow iterates over authors with pending > ₹0, automatically skipping Farhan Sheikh.
  3. Mention the sub-₹1,000 rollover scenario (Kavita Deshmukh with ₹850).
- **Narration**:
  > *"For bulk operations, our 'Generate Summaries for All Authors with Pending Royalties' button triggers an asynchronous workflow on the author list. It filters out authors with zero pending balances and paces requests to respect API rate limits.
  > Furthermore, for authors like Kavita Deshmukh who have ₹850 pending, our policy engine automatically explains that amounts under ₹1,000 roll over safely into the next quarter without lapsing."*

---

### 4:00 – 4:20 | Conclusion & Wrap-Up
- **Screen**: Notification Audit Logs page showing all completed runs.
- **Narration**:
  > *"Every execution is audited with timestamps, request IDs, and full email contents. The entire system is production-ready, fully deterministic, and secured at the database layer. Thank you for your time, and I look forward to discussing the architecture during our final technical interview."*

