# n8n Automation Setup & Deployment Guide

This guide provides instructions for setting up, configuring, and testing the BookLeaf Author Royalty Notification workflow (`bookleaf-royalty-summary.json`) in n8n.

---

## 1. Quick Start Options for Running n8n

### Option A: Local Execution via NPX (Zero Setup, Recommended for Testing)
Run n8n directly in your terminal without installing Docker or signing up for cloud:
```bash
npx n8n
```
Once started, open **[http://localhost:5678](http://localhost:5678)** in your browser.

### Option B: Local Execution via Docker
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Option C: n8n Cloud
Log in to your [n8n.cloud](https://n8n.cloud) dashboard.

---

## 2. Importing the Workflow

1. In the n8n UI, navigate to **Workflows**.
2. Click the **+ Add Workflow** button (or three dots menu in the top right).
3. Select **Import from File...**
4. Browse and select:
   `bookleaf-assignment-2/n8n/bookleaf-royalty-summary.json`
5. The full 11-node visual orchestration pipeline will immediately appear on your canvas:
   - `Bubble Webhook Trigger`
   - `Validate Auth & Payload`
   - `Is Authorized & Valid?`
   - `Fetch Author from Bubble`
   - `Fetch Books from Bubble`
   - `Deterministic Aggregator & Policies`
   - `Call AI API (LLM)`
   - `Validate AI Response`
   - `Is AI Valid?`
   - `Bubble Callback - Success`
   - `Bubble Callback - Failure`

---

## 3. Configuring Environment Variables & Secrets

In n8n (or in your `.env` file when running n8n locally), configure the following environment variables:

| Variable Name | Default / Sample Value | Description |
| :--- | :--- | :--- |
| `WEBHOOK_SECRET` | `bookleaf_secure_webhook_secret_2026` | Secret verified on incoming Bubble webhook (`X-Webhook-Secret`) |
| `BUBBLE_BASE_URL` | `https://bookleaf-royalty.bubbleapps.io/version-test` | Base URL of your Bubble development application |
| `BUBBLE_API_TOKEN` | `your_bubble_api_key_here` | Bearer token from Bubble (Settings $\rightarrow$ API $\rightarrow$ Generate API token) |
| `BUBBLE_CALLBACK_SECRET`| `bookleaf_secure_webhook_secret_2026` | Secret sent in the callback payload to Bubble |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key for `gpt-4o-mini` |

*Tip: If you do not have environment variables configured in n8n, double-click each node and paste your credentials directly into the node headers or credential picker.*

---

## 4. Testing the Workflow via cURL

To test the workflow independently of Bubble, start the test webhook in n8n (click **Listen for Test Event** on the webhook node), then run one of the following cURL commands in your terminal:

### Test 1: Standard Author Test (Priya Sharma - `AUTH001`)
```bash
curl -X POST http://localhost:5678/webhook-test/bookleaf-royalty-summary \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: bookleaf_secure_webhook_secret_2026" \
  -d '{
    "request_id": "REQ-AUTH001-CURL",
    "author_id": "AUTH001",
    "author_name": "Priya Sharma",
    "author_email": "priya.sharma@email.com",
    "triggered_by": "admin@bookleaf.com",
    "triggered_at": "2026-11-03T08:30:00Z"
  }'
```

### Test 2: Sub-Threshold Rollover Author (Kavita Deshmukh - `AUTH009`)
```bash
curl -X POST http://localhost:5678/webhook-test/bookleaf-royalty-summary \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: bookleaf_secure_webhook_secret_2026" \
  -d '{
    "request_id": "REQ-AUTH009-CURL",
    "author_id": "AUTH009",
    "author_name": "Kavita Deshmukh",
    "author_email": "kavita.deshmukh@email.com",
    "triggered_by": "admin@bookleaf.com",
    "triggered_at": "2026-11-03T08:30:00Z"
  }'
```

### Test 3: Unauthorized Security Test (Invalid Secret)
```bash
curl -X POST http://localhost:5678/webhook-test/bookleaf-royalty-summary \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: INVALID_SECRET" \
  -d '{
    "request_id": "REQ-UNAUTH",
    "author_id": "AUTH001",
    "triggered_by": "attacker",
    "triggered_at": "2026-11-03T08:30:00Z"
  }'
```
*Expected Result: Workflow rejects request and routes directly to the failure branch.*

---

## 5. Activating for Production

1. Toggle the workflow switch in n8n from **Inactive** to **Active** (top right).
2. Note the production webhook URL:
   `https://[YOUR_N8N_DOMAIN]/webhook/bookleaf-royalty-summary`
3. Enter this URL into Bubble's API Connector under `Trigger Royalty Summary`.

