# BookLeaf System Architecture & Component Specifications

*(For complete technical diagrams and architectural flows, see [ARCHITECTURE.md](../ARCHITECTURE.md).)*

---

## 1. System Components Summary

### 1.1 Web Application: Bubble.io
- **Hosting**: Bubble Cloud (AWS Infrastructure)
- **Database**: Bubble native PostgreSQL-backed database
- **Security**: Strict Privacy Rules enforcing Role-Based Access Control (RBAC)
- **Integration Engine**: Bubble API Connector for outbound HTTP POST webhooks; Bubble Backend Workflows for inbound API callbacks.

### 1.2 Automation Engine: n8n
- **Runtime**: Self-hosted Docker container, local NPX execution, or n8n.cloud
- **Workflow Pipeline**: 11 nodes executing webhook authentication, Bubble Data API querying, deterministic financial aggregation, AI prompt compilation, and asynchronous callbacks.
- **Workflow Export**: `n8n/bookleaf-royalty-summary.json`

### 1.3 AI Model & Policy Engine
- **Model**: OpenAI `gpt-4o-mini` (or Google Gemini 1.5 Flash / Anthropic Claude 3.5 Haiku)
- **Grounding**: BookLeaf Knowledge Base (80/20 royalty split, quarterly 45-day payment cycle, ₹1,000 threshold rollover, production stage tracking).
- **Format**: Structured JSON output validated before transmission to Bubble.

---

## 2. Component Boundary Table

| Component | Responsibility | Boundary / Invariant |
| :--- | :--- | :--- |
| **Bubble Frontend** | UI presentation, table filtering, user auth | Never computes financial figures locally; never hides data solely via UI |
| **Bubble Database** | System of record for Authors, Books, Payouts | Enforces Privacy Rules at server level before emitting data to network |
| **n8n Orchestrator** | Asynchronous workflow execution | Never trusts client payloads; always fetches authoritative data from Bubble |
| **Code Aggregator** | Deterministic mathematical calculation | Ensures `total_copies_sold`, `earned`, `paid`, and `pending` are 100% mathematically exact |
| **LLM Node** | Natural language email generation | Strictly barred from inventing dates, sales numbers, or payment confirmations |

