# BookLeaf Bubble Privacy Rules & Data Access Control

## 1. Architectural Importance
Bubble's Privacy Rules enforce **database-level security**. Unlike frontend conditionals (which merely hide elements from the DOM while leaving underlying API endpoints open to network inspection), Privacy Rules prevent unauthorized data from ever leaving Bubble's servers.

Even if an author inspects browser network payloads or uses client-side JavaScript to query the database, data belonging to other authors returns empty.

---

## 2. Global Role Logic in Bubble

Every authenticated session in Bubble has access to `Current User`. In our schema:
- `Current User's role is 'ADMIN'` $\implies$ User is an Operations Administrator.
- `Current User's role is 'AUTHOR'` $\implies$ User is an Author, whose associated profile is stored in `Current User's linked_author`.

---

## 3. Data Type Privacy Rule Specifications

Navigate to **Data** $\rightarrow$ **Privacy** in the Bubble editor. Configure each Data Type as follows:

### 3.1 Data Type: `User`

#### Rule 1: "Admin Full Access"
- **Condition**: `Current User's role is ADMIN`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Rule 2: "Current User Self Access"
- **Condition**: `Current User is This User`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Everyone Else (Default):
- [ ] View all fields (**UNCHECKED**)
- [ ] Find this in searches (**UNCHECKED**)
- [ ] View attached files (**UNCHECKED**)

*Result: Users can never view another user's email, name, role, or linked records.*

---

### 3.2 Data Type: `Author`

#### Rule 1: "Admin Full Access"
- **Condition**: `Current User's role is ADMIN`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Rule 2: "Author Self Access"
- **Condition**: `Current User's linked_author is This Author`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Everyone Else (Default):
- [ ] View all fields (**UNCHECKED**)
- [ ] Find this in searches (**UNCHECKED**)
- [ ] View attached files (**UNCHECKED**)

*Result: Priya Sharma (`AUTH001`) can only retrieve her own Author profile. Any database search for Rohit Kapoor (`AUTH002`) returns null.*

---

### 3.3 Data Type: `Book`

#### Rule 1: "Admin Full Access"
- **Condition**: `Current User's role is ADMIN`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Rule 2: "Author Book Access"
- **Condition**: `Current User's linked_author is This Book's author`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Everyone Else (Default):
- [ ] View all fields (**UNCHECKED**)
- [ ] Find this in searches (**UNCHECKED**)
- [ ] View attached files (**UNCHECKED**)

*Result: When Sneha Kulkarni visits "My Books", Bubble executes `Search for Books where author = Current User's linked_author`. Even if another author attempts to query `Search for Books`, Bubble intercepts and returns only books where `author == Current User's linked_author`.*

---

### 3.4 Data Type: `Payout`

#### Rule 1: "Admin Full Access"
- **Condition**: `Current User's role is ADMIN`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Rule 2: "Author Payout Access"
- **Condition**: `Current User's linked_author is This Payout's author`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Everyone Else (Default):
- [ ] View all fields (**UNCHECKED**)
- [ ] Find this in searches (**UNCHECKED**)
- [ ] View attached files (**UNCHECKED**)

*Result: Financial disbursements are completely private to the author and admins.*

---

### 3.5 Data Type: `NotificationLog`

#### Rule 1: "Admin Full Access"
- **Condition**: `Current User's role is ADMIN`
- **Permissions**:
  - [x] View all fields
  - [x] Find this in searches
  - [x] View attached files

#### Rule 2: "Author View Own Completed Notifications"
- **Condition**: `Current User's linked_author is This NotificationLog's author and This NotificationLog's status is SUCCESS`
- **Permissions**:
  - [x] View all fields (or selectively `email_subject`, `generated_email_content`, `completed_at`)
  - [x] Find this in searches
  - [ ] View internal `error_message` or `idempotency_key` (**UNCHECKED**)

#### Everyone Else (Default):
- [ ] View all fields (**UNCHECKED**)
- [ ] Find this in searches (**UNCHECKED**)

*Result: An author can view completed summaries sent to them, but cannot see processing logs, failure stack traces, or notifications for other authors.*

---

## 4. Privacy Testing & Verification Protocol

To verify that privacy rules operate strictly at the database level:

### Test Scenario 1: Author Isolation
1. In Bubble's App Data, click **Run as** next to `priya.sharma@email.com` (Author `AUTH001`).
2. Navigate to `author-dashboard`.
3. Open browser Developer Tools $\rightarrow$ Network Tab.
4. Verify Priya can see *Whispers of the Ganges* (BK001) and *The Saffron Diaries* (BK002).
5. Attempt to navigate directly to a page or element displaying `BK003` (Rohit Kapoor's book).
6. **Observed Result**: The record is empty. No title, sales, or royalty numbers are returned.

### Test Scenario 2: Cross-Author Block
1. In the browser console, execute a fetch call querying Bubble's Data API for `/api/1.1/obj/author/AUTH002` using Priya's session cookie.
2. **Observed Result**: Bubble returns HTTP 403 Forbidden or an empty object `{ "response": {} }`.

### Test Scenario 3: Admin Global Visibility
1. In Bubble's App Data, click **Run as** next to `admin@bookleaf.com`.
2. Navigate to `admin-dashboard`.
3. **Observed Result**: All 10 authors, all 18 books, and all notification records are fully visible.

