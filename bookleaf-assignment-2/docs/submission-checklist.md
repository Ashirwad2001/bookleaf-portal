# BookLeaf Technical Assignment 2 — Final Submission & Interview Prep

This document serves as the final review checklist before submitting Assignment 2 and preparing for the technical interview with BookLeaf's founders.

---

## 1. Submission Deliverables Inventory

| Deliverable | Location in Workspace | Description | Status |
| :--- | :--- | :--- | :--- |
| **Deliverable 1: Bubble Application Specs** | `BUBBLE_DATABASE_SCHEMA.md`<br>`BUBBLE_IMPLEMENTATION_GUIDE.md`<br>`BUBBLE_WORKFLOWS.md`<br>`PRIVACY_RULES.md` | Complete database schema, click-by-click UI guide, workflow configurations, and server-side privacy rules | **READY** |
| **Deliverable 2: n8n Workflow Export** | `n8n/bookleaf-royalty-summary.json`<br>`n8n/workflow-setup.md`<br>`n8n/sample-payloads.json` | 11-node valid, importable n8n workflow with authentication, data fetching, deterministic math, and callbacks | **READY** |
| **Deliverable 3: Project README** | `README.md` | Comprehensive overview, architecture, security, idempotency, testing, and limitations | **READY** |
| **Deliverable 4: Screen Recording Script** | `docs/screen-recording-script.md` | 3–5 minute step-by-step walkthrough covering both personas, live n8n execution, and AI content updates | **READY** |
| **Data Import Package** | `data/authors.csv`<br>`data/books.csv`<br>`data/users.csv`<br>`data/payouts.csv`<br>`data/import-instructions.md` | Sanitized CSV files ready for 1-click import into Bubble App Data | **READY** |
| **Verification & Simulation Test Suite**| `tests/test-suite.js`<br>`n8n/simulate-automation.js`<br>`TESTING_CHECKLIST.md` | Automated test assertions and local simulation harness validating 10 authors, 18 books, and edge cases | **READY** |

---

## 2. Anticipated Founder & Lead Engineer Interview Questions

### Q1: "Why did you separate Bubble and n8n instead of running the entire AI workflow inside Bubble's Backend Workflows?"
**Strong Answer**:
> *"While Bubble could technically make HTTP requests via its API Connector, separating UI from heavy automation adheres to the Single Responsibility Principle. 
> LLM calls can take 15–30 seconds and may experience rate limits, provider downtime, or malformed JSON responses. Offloading this orchestration to n8n keeps Bubble lightweight and responsive. Furthermore, n8n provides visual branching, sophisticated retry policies, and easy integration with external messaging channels (such as WhatsApp, SendGrid, or Slack) as BookLeaf scales to thousands of titles."*

---

### Q2: "How do you guarantee that the AI never hallucinates sales or payout amounts?"
**Strong Answer**:
> *"We enforce a strict separation between financial math and prose generation. In our n8n pipeline, Node 6 runs deterministic JavaScript code that calculates cumulative sales, royalties earned, royalties paid, and pending balances directly from Bubble Data API responses. 
> The LLM is never asked to add, subtract, or infer amounts. We inject pre-verified numbers and explicit policy flags (such as whether the author has met the ₹1,000 threshold) directly into the prompt. The LLM's sole task is empathetic, professional communication adhering to BookLeaf's tone."*

---

### Q3: "How do you prevent an author from inspecting browser traffic to see other authors' data?"
**Strong Answer**:
> *"We do not rely on frontend element hiding. Instead, we implement Bubble's server-side Privacy Rules. In Bubble, privacy rules are evaluated on the database server before any query results leave the API. 
> For the `Book` data type, our rule specifies `Current User's linked_author is This Book's author`. If an author captures their session cookies and executes an unconstrained database search, Bubble's server intercepts the request and returns an empty array. Data isolation is guaranteed at the database layer."*

---

### Q4: "How does the system handle bulk triggers without crashing or exceeding LLM rate limits?"
**Strong Answer**:
> *"The bulk action on the Admin Dashboard uses Bubble's `Schedule API Workflow on a list` with a built-in interval delay of 2 seconds between author dispatches. 
> In addition, the query filters out authors who have zero pending royalties (such as Farhan Sheikh). Each webhook call carries a unique request ID and verifies active idempotency keys, preventing duplicate executions and avoiding API quota exhaustion."*

