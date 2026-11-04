# BookLeaf Technical Learning Log — Developer's Guide to Bubble & n8n

As a developer coming from a background in React, Next.js, TypeScript, SQL, and Node.js, navigating no-code and visual automation platforms can feel unfamiliar. This document translates familiar software engineering patterns into their Bubble.io and n8n equivalents, detailing the architectural insights gained while building this system.

---

## 1. Rosetta Stone: Code vs. Bubble & n8n

| Traditional Engineering Concept | Bubble.io Equivalent | n8n Automation Equivalent | How It Works in Practice |
| :--- | :--- | :--- | :--- |
| **SQL Table / Prisma Model** | **Data Type** | Data schema in HTTP nodes | Created in Bubble's Data tab. Every type has fields, types, and constraints. |
| **Database Row / JSON Object** | **Thing** | JSON Item (`$json`) | A single record in Bubble is called a "Thing". Access fields via `Thing's field_name`. |
| **Database RLS (Row-Level Security)** | **Privacy Rules** | N/A (Handled at API layer) | Enforced on Bubble's servers before data is sent to the client. Prevents cross-author leaks. |
| **Global Enum / Constants** | **Option Set** | Static JSON / Environment vars | Hardcoded global definitions (e.g. `UserRole: ADMIN, AUTHOR`) available anywhere in Bubble expressions. |
| **React Component / HTML Div** | **Group** | N/A | Flexible container with Flexbox layout modes (Row, Column, Align to parent). |
| **Array `.map()` / Virtualized List** | **Repeating Group (RG)** | Loop / Split in Batches node | Takes a list/search data source and repeats an inner cell template for each item (`Current cell's Thing`). |
| **React State (`useState`)** | **Custom State** | Node parameter / Execution state | Stored in memory on an element (e.g. `Popup_AuthorDetail's is_processing`). Reset on page refresh. |
| **Event Handler (`onClick`)** | **Visual Workflow** | Webhook / Trigger Node | "When Button is clicked $\rightarrow$ Step 1 $\rightarrow$ Step 2". Executed sequentially. |
| **Express / Next.js API Route** | **Backend Workflow (API Workflow)** | Webhook Node | Server-side endpoints running without a UI. Can be scheduled or exposed as webhooks. |
| **BullMQ / Background Worker Queue** | **Schedule API Workflow on a list** | n8n Workflow execution queue | Iterates through a database query asynchronously with a configurable interval delay. |
| **External REST Client (`fetch`/`axios`)** | **API Connector Plugin** | **HTTP Request Node** | Configures outbound HTTP requests with headers, secrets, and dynamic parameters. |

---

## 2. Key Architectural Decisions Explained

### Why Not Let the LLM Calculate Financial Numbers?
- **The Risk**: Large Language Models are probabilistic token predictors, not calculators. Asking an LLM to "sum the royalties across 3 books and subtract the paid amount" leads to subtle, catastrophic accounting errors (hallucinated arithmetic).
- **The Solution**: In our n8n pipeline, **Node 6 (Deterministic Aggregator & Policies)** runs pure JavaScript code that calculates:
  ```javascript
  total_earned = sum(book.total_royalty_earned)
  total_paid = sum(book.royalty_paid)
  total_pending = sum(book.royalty_pending)
  ```
  The LLM is only handed final, verified numbers. Its sole task is empathetic prose generation and policy explanation.

---

### Why Use Privacy Rules Instead of Hiding Elements in Bubble?
- **The Pitfall**: In Bubble, hiding a container with a condition (`This element is visible only when Current User's role is ADMIN`) only modifies CSS (`display: none`). An author inspecting browser network traffic or using client-side JavaScript can view the underlying JSON data returned by Bubble's database queries.
- **The Fix**: **Bubble Privacy Rules** (configured in **Data $\rightarrow$ Privacy**) intercept queries on Bubble's servers. If an author queries books belonging to another author, Bubble returns an empty array.

---

### Why Asynchronous Webhooks with Callbacks?
- **The Pitfall**: Calling an LLM synchronously from a browser button causes request timeouts if the AI model takes 10–25 seconds to generate text. The user is stuck staring at a frozen browser tab.
- **The Fix**:
  1. Bubble immediately creates a `NotificationLog` with status `PROCESSING`.
  2. Bubble fires an asynchronous webhook to n8n and returns HTTP 200 immediately to release the frontend.
  3. n8n orchestrates the multi-step pipeline (fetching data, deterministic math, LLM generation).
  4. n8n calls back into Bubble's Backend Workflow (`/n8n_callback_success`), which updates the record in real time.

