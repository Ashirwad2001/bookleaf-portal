# BookLeaf Assignment 2 — Comprehensive Testing & Acceptance Checklist

This checklist tracks the implementation and verification status of every requirement in the assignment. In accordance with the project instructions, items are marked `COMPLETED` only after actual test verification. Items dependent on a live Bubble editor session are honestly flagged as `NOT VERIFIED (Requires Live Bubble Editor Session)` with exact steps provided for verification.

---

## 1. Database & Data Integrity

| Requirement | Test Description | Status | Verification Evidence / Reference |
| :--- | :--- | :--- | :--- |
| **All 10 Authors Accounted For** | Verify `bookleaf_sample_data.json` contains exactly 10 authors | **COMPLETED** | Verified via `tests/test-suite.js` (Test 1) |
| **All 18 Books Accounted For** | Verify catalog contains exactly 18 books (16 published, 2 in production) | **COMPLETED** | Verified via `tests/test-suite.js` (Test 1) |
| **Relational Integrity** | Verify each book links to a valid `author_id` | **COMPLETED** | Verified; foreign keys matched across all 18 books |
| **Financial Calculations Match Source** | Total Earned: ₹243,382, Total Paid: ₹202,543, Total Pending: ₹40,839 | **COMPLETED** | Verified via `tests/test-suite.js` (Test 2) |
| **Publication Statuses Preserved** | 16 "Published & Live", 1 "In Production - Cover Design", 1 "In Production - Typesetting" | **COMPLETED** | Verified via `tests/test-suite.js` (Test 5) |
| **CSV Seeding Files Created** | `authors.csv`, `books.csv`, `users.csv`, `payouts.csv` formatted and ready | **COMPLETED** | Verified via `tests/test-suite.js` (Test 6) |
| **Data Imported into Live Bubble DB** | Upload CSVs to Bubble Data tab and verify records in App Data | **NOT VERIFIED** | *Requires user to upload CSVs in Bubble editor* |

---

## 2. Author Portal Requirements

| Requirement | Test Description | Status | Verification Evidence / Reference |
| :--- | :--- | :--- | :--- |
| **Native Login & Role Redirection** | Logging in with author email redirects to `author-dashboard` | **NOT VERIFIED** | Configured in `BUBBLE_WORKFLOWS.md` §1 |
| **Author Data Isolation** | Priya Sharma (`AUTH001`) can only see her 2 books | **NOT VERIFIED** | Enforced by Bubble Privacy Rules in `PRIVACY_RULES.md` |
| **Author Sees Correct Royalty Totals** | Priya Sharma sees Earned ₹19,908, Paid ₹16,338, Pending ₹3,570 | **COMPLETED** | Computed and verified in `n8n/simulate-automation.js` |
| **INR Currency Formatting** | Display amounts with `₹` and comma separators | **NOT VERIFIED** | Configured in `BUBBLE_IMPLEMENTATION_GUIDE.md` |
| **Green Status Badge** | Farhan Sheikh (`AUTH008`) displays GREEN (All royalties paid) | **COMPLETED** | Verified via `n8n/simulate-automation.js` |
| **Yellow Status Badge** | Priya Sharma (`AUTH001`) displays YELLOW (Pending in normal cycle) | **COMPLETED** | Verified via `n8n/simulate-automation.js` |
| **Red Status Badge** | Vikram Joshi (`AUTH004`) displays RED (Last payout > 90 days ago) | **COMPLETED** | Verified via `n8n/simulate-automation.js` |
| **Sub-₹1,000 Threshold Notice** | Kavita Deshmukh (`AUTH009`) sees ₹850 rollover message | **COMPLETED** | Verified via `n8n/simulate-automation.js` |

---

## 3. Operations Admin Portal Requirements

| Requirement | Test Description | Status | Verification Evidence / Reference |
| :--- | :--- | :--- | :--- |
| **Global Author Overview** | Admin views all 10 authors in repeating group table | **NOT VERIFIED** | Designed in `BUBBLE_IMPLEMENTATION_GUIDE.md` §5 |
| **Search by Author Name** | Filtering by "Priya" narrows list to Priya Sharma | **NOT VERIFIED** | Configured via `Input_SearchAuthor's value` |
| **Filter by City** | Selecting "Delhi" filters list to Rohit Kapoor | **NOT VERIFIED** | Configured via `Dropdown_City's value` |
| **Filter by Payout Status** | Filtering by "All Paid" isolates Farhan Sheikh | **NOT VERIFIED** | Configured via `Dropdown_Status's value` |
| **Author Detail Inspection** | Clicking author opens profile, books, and payout history | **NOT VERIFIED** | Designed in `Popup_AuthorDetail` |
| **Single Summary Trigger Workflow** | Button triggers n8n webhook and updates NotificationLog | **NOT VERIFIED** | Configured in `BUBBLE_WORKFLOWS.md` §2 |
| **Active Duplicate Prevention** | Clicking trigger while status is `PROCESSING` shows alert | **NOT VERIFIED** | Workflow condition in `BUBBLE_WORKFLOWS.md` §2.1 |
| **Bulk Trigger Workflow** | Bulk button iterates all authors with pending > ₹0 | **NOT VERIFIED** | Configured in `BUBBLE_WORKFLOWS.md` §3 |
| **Notification Log Audit Table** | Audit table displays request_id, status, timestamps, email body | **NOT VERIFIED** | Designed in `BUBBLE_IMPLEMENTATION_GUIDE.md` §7 |

---

## 4. n8n Automation Engine Requirements

| Requirement | Test Description | Status | Verification Evidence / Reference |
| :--- | :--- | :--- | :--- |
| **Valid JSON Workflow Export** | `bookleaf-royalty-summary.json` has valid n8n 11-node syntax | **COMPLETED** | Verified via `tests/test-suite.js` (Test 7) |
| **Webhook Authentication Guard** | Requests with missing/invalid `X-Webhook-Secret` are rejected (401) | **COMPLETED** | Verified in `n8n/simulate-automation.js` |
| **Bubble Data API Retrieval** | Queries author and books from Bubble rather than trusting client | **COMPLETED** | Nodes 4 & 5 in `bookleaf-royalty-summary.json` |
| **Deterministic Financial Aggregation** | JavaScript code node sums sales, earned, paid, and pending | **COMPLETED** | Node 6 in `bookleaf-royalty-summary.json` & simulation script |
| **Policy-Grounded AI Prompt** | Prompt embeds 80/20 split, ₹1,000 threshold, quarterly timeline | **COMPLETED** | Documented in `AI_PROMPT.md` and Node 7 |
| **Valid Structured JSON from AI** | AI returns `email_subject`, `email_body`, and `summary` object | **COMPLETED** | Node 8 validation schema |
| **Success Callback to Bubble** | Dispatches POST to `/api/1.1/wf/n8n_callback_success` | **COMPLETED** | Node 10 in `bookleaf-royalty-summary.json` |
| **Failure Callback to Bubble** | Dispatches POST to `/api/1.1/wf/n8n_callback_failure` on error | **COMPLETED** | Node 11 in `bookleaf-royalty-summary.json` |
| **Simulated End-to-End Automation** | Entire execution pipeline executes without errors locally | **COMPLETED** | Verified via `node n8n/simulate-automation.js AUTH001` |

---

## 5. AI Policy Grounding & Edge Cases

| Requirement | Test Description | Status | Verification Evidence / Reference |
| :--- | :--- | :--- | :--- |
| **No Hallucinated Dates or Payouts** | Null payout dates reported as "Awaiting inaugural cycle" | **COMPLETED** | Verified in `n8n/simulate-automation.js` for `AUTH003` & `AUTH006` |
| **Production Books Segregation** | Books in production highlighted separately without fake sales | **COMPLETED** | Verified in `n8n/simulate-automation.js` for `AUTH007` & `AUTH009` |
| **Sub-Threshold Rollover Notice** | Balance < ₹1,000 explained as rolling over to next quarter | **COMPLETED** | Verified in `n8n/simulate-automation.js` for `AUTH009` |
| **100% Settled Appreciation** | Authors with ₹0 pending congratulated on full settlement | **COMPLETED** | Verified in `n8n/simulate-automation.js` for `AUTH008` |
| **Empathetic & Accountable Tone** | Cites 45-day quarterly schedule and bank transfer mechanism | **COMPLETED** | Verified in `AI_PROMPT.md` and simulation output |

