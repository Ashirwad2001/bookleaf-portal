# BookLeaf Author Royalty Dashboard & Automated Notification System — End-to-End Architecture

## 1. System Overview
The BookLeaf Royalty Platform is a hybrid no-code / low-code enterprise application connecting an author-facing portal, an operations management console, an n8n workflow automation pipeline, and an AI policy engine.

The platform guarantees:
- **Strict Data Segregation**: Authors access solely their personal books and royalty metrics via database-level Privacy Rules.
- **Financial Determinism**: Royalty accruals, disbursements, and pending balances are computed mathematically from database records. The LLM never calculates or hallucinates monetary figures.
- **Policy Compliance**: Every AI-generated communication incorporates BookLeaf's 80/20 royalty split, quarterly 45-day payment cycle, and ₹1,000 rollover threshold.
- **Operational Resilience**: Webhooks enforce shared-secret authentication, idempotency checks suppress duplicate active triggers, and failure branches ensure notifications never remain indefinitely stuck in `PROCESSING`.

---

## 2. System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer["User & Client Layer"]
        Author["Author (Web Browser)"]
        Admin["Operations Admin (Web Browser)"]
    end

    subgraph BubbleApp["Bubble.io Web Application"]
        subgraph BubbleUI["Bubble Frontend Views"]
            LoginView["Login & Role Redirect"]
            AuthorDashboard["Author Dashboard & My Books"]
            AdminDashboard["Admin Dashboard & Author Overview"]
            AuthorDetail["Author Detail & Trigger Modal"]
            AuditLogs["Notification Audit Logs"]
        end

        subgraph BubbleEngine["Bubble Server & Database Engine"]
            PrivacyRules["Database Privacy Rules (RBAC)"]
            BuiltInDB[("Bubble Database:
            - User
            - Author
            - Book
            - Payout
            - NotificationLog")]
            APIConnector["API Connector (Outbound Webhooks)"]
            BackendWorkflows["Backend Workflows:
            - n8n_callback_success
            - n8n_callback_failure"]
        end
    end

    subgraph AutomationLayer["n8n Orchestration Engine"]
        WebhookTrigger["Webhook Trigger (/bookleaf-royalty-summary)"]
        AuthValidator["Header & Secret Validator"]
        BubbleDataFetch["Bubble Data API Client (GET /obj/author & /obj/book)"]
        DeterministicMath["Deterministic Math & Policy Engine (Code Node)"]
        PromptAssembler["AI Prompt Assembler"]
        LLMNode["AI Model API (OpenAI / Gemini)"]
        ResponseValidator["JSON Output Validator"]
        SuccessBranch["Callback Success Worker"]
        FailureBranch["Callback Failure Worker"]
    end

    Author -->|Auth & Browse| LoginView
    Admin -->|Triage & Audit| AdminDashboard
    LoginView --> AuthorDashboard
    AdminDashboard --> AuthorDetail
    AdminDashboard --> AuditLogs

    AuthorDashboard --> PrivacyRules
    AdminDashboard --> PrivacyRules
    PrivacyRules --> BuiltInDB

    AuthorDetail -->|Trigger Single/Bulk| APIConnector
    APIConnector -->|POST Webhook + HMAC Secret| WebhookTrigger

    WebhookTrigger --> AuthValidator
    AuthValidator --> BubbleDataFetch
    BubbleDataFetch -->|Query Verified Records| BuiltInDB
    BubbleDataFetch --> DeterministicMath
    DeterministicMath --> PromptAssembler
    PromptAssembler --> LLMNode
    LLMNode --> ResponseValidator

    ResponseValidator -->|Valid JSON| SuccessBranch
    ResponseValidator -->|Malformed / API Error| FailureBranch

    SuccessBranch -->|POST Callback Success| BackendWorkflows
    FailureBranch -->|POST Callback Failure| BackendWorkflows
    BackendWorkflows -->|Update NotificationLog Status| BuiltInDB
```

---

## 3. Communication Sequences

### 3.1 Single Author Trigger Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Bubble as Bubble Application
    participant n8n as n8n Automation Engine
    participant LLM as LLM API (OpenAI/Gemini)

    Admin->>Bubble: Click "Generate & Send Royalty Summary" (Popup_AuthorDetail)
    Bubble->>Bubble: Check active duplicate (status = PROCESSING)
    Bubble->>Bubble: Create NotificationLog (request_id = REQ-UUID, status = PROCESSING)
    Bubble->>Bubble: Set UI state: is_processing = yes
    Bubble->>n8n: POST /webhook/bookleaf-royalty-summary (Header: X-Webhook-Secret)
    n8n->>n8n: Validate secret header & payload schema
    n8n->>Bubble: GET /api/1.1/obj/author (Query target author)
    Bubble-->>n8n: 200 OK (Author record)
    n8n->>Bubble: GET /api/1.1/obj/book (Query books for author)
    Bubble-->>n8n: 200 OK (Books array)
    n8n->>n8n: Execute deterministic math: sum(earned), sum(paid), sum(pending)
    n8n->>n8n: Apply BookLeaf policies (80/20 split, threshold check, status badge)
    n8n->>LLM: POST chat/completions (Structured JSON Prompt)
    LLM-->>n8n: 200 OK (email_subject, email_body, summary)
    n8n->>n8n: Validate JSON schema against deterministic numbers
    n8n->>Bubble: POST /api/1.1/wf/n8n_callback_success (request_id, email content)
    Bubble->>Bubble: Update NotificationLog (status = SUCCESS, completed_at = now)
    Bubble-->>Admin: Render generated email in UI viewer
```

---

## 4. Key Security & Resilience Controls

1. **Database-Level Data Isolation (Privacy Rules)**:
   - Data access is strictly bounded by `Current User's linked_author`. Even if an author captures their session JWT or cookies, direct database requests to other authors return empty results.
2. **Deterministic Financial Aggregation**:
   - The LLM never computes financial totals. All numbers (`total_copies_sold`, `total_royalty_earned`, `royalty_paid`, `royalty_pending`) are calculated by JavaScript code nodes directly from Bubble Data API responses before prompt generation.
3. **Shared Secret Authentication**:
   - Webhooks traveling in both directions (Bubble $\rightarrow$ n8n and n8n $\rightarrow$ Bubble) carry shared secrets in headers or payloads (`X-Webhook-Secret`, `auth_secret`), preventing unauthorized external triggers.
4. **Guaranteed State Transitions**:
   - To eliminate indefinite "Processing" states, n8n incorporates an automated failure branch and timeout guards that trigger `n8n_callback_failure` if the LLM API throttles or throws exceptions.

