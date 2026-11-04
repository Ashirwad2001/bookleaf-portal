# BookLeaf Bubble Application — Click-by-Click Implementation Guide

This guide is designed for a developer familiar with React, Next.js, and SQL who is new to Bubble.io. It provides exact, component-by-component instructions for building the responsive Author and Operations Admin portals in Bubble's Visual Editor.

---

## 1. Bubble Mental Model Translation

| Software Engineering Concept | Bubble Equivalent | How It Works |
| :--- | :--- | :--- |
| Database Table / Entity | **Data Type** | Defined in **Data $\rightarrow$ Data types** |
| Database Row / Object | **Thing** | A single record of a Data Type |
| React Component / Container | **Group** | Div-like container with Column, Row, or Align to Parent layout |
| React `.map(item => <Card />)` | **Repeating Group (RG)** | Iterates over an array/list; cell accesses `Current cell's Thing` |
| State Variable (`useState`) | **Custom State** | Set on any element (e.g. `rg_authors's selected_city`) |
| Event Handler (`onClick`) | **Workflow** | Triggered by events (e.g. "When Button Submit is clicked") |
| API / Middleware | **Backend Workflows** | Endpoints that receive webhooks from n8n or trigger async jobs |

---

## 2. App Settings & Styling Setup

1. **Colors (Style Variables)**:
   - Go to **Settings** $\rightarrow$ **General** $\rightarrow$ **Color palette**.
   - Primary: `#1E3A8A` (BookLeaf Navy)
   - Accent: `#D97706` (Warm Amber)
   - Success Green: `#16A34A`
   - Warning Yellow: `#CA8A04`
   - Danger Red: `#DC2626`
   - Background: `#F8FAFC`
   - Card Background: `#FFFFFF`
   - Border: `#E2E8F0`

2. **Typography**:
   - Font family: `Inter` or `Plus Jakarta Sans`
   - Base size: 14px / 16px

---

## 3. Page 1: `login` (Authentication)

### 3.1 Layout Structure
- **Page Container**: Type: Column, Width: 100%, Height: 100vh, Background: `#F8FAFC`, Centered alignment.
- **Card Container** (`Group_LoginCard`): Type: Column, Width: 420px, Padding: 32px, Background: `#FFFFFF`, Border-radius: 12px, Box shadow: subtle.

### 3.2 Elements Inside Card
1. **Logo / Heading**:
   - Element: `Text`
   - Value: `BookLeaf Publishing`
   - Subtitle: `Author & Operations Portal`
2. **Email Input**:
   - Element: `Input`
   - Name: `Input_Email`
   - Content format: `Email`
   - Placeholder: `Enter your email (e.g. priya.sharma@email.com)`
3. **Password Input**:
   - Element: `Input`
   - Name: `Input_Password`
   - Content format: `Password`
   - Placeholder: `Enter your password`
4. **Login Button**:
   - Element: `Button`
   - Name: `Btn_Login`
   - Text: `Sign In`
5. **Role Switcher Demo Helper (Evaluation Ease)**:
   - Element: `Text`
   - Text: `Demo Logins: admin@bookleaf.com (Admin) | priya.sharma@email.com (Author)`

### 3.3 Workflow: `Btn_Login is clicked`
1. **Action 1**: `Account` $\rightarrow$ `Log the user in`
   - Email: `Input_Email's value`
   - Password: `Input_Password's value`
2. **Action 2**: `Navigation` $\rightarrow$ `Go to page...`
   - Page: `admin-dashboard`
   - **Only when**: `Current User's role is 'ADMIN'`
3. **Action 3**: `Navigation` $\rightarrow$ `Go to page...`
   - Page: `author-dashboard`
   - **Only when**: `Current User's role is 'AUTHOR'`

---

## 4. Page 2: `author-dashboard` & `royalty-overview`

This can be built as a single responsive page with tabs or two clean sub-pages.

### 4.1 Header Bar (`Group_AuthorHeader`)
- Layout: Row, Width: 100%, Padding: 16px 32px, Background: `#FFFFFF`, Border-bottom: 1px solid `#E2E8F0`.
- Left: `BookLeaf Author Portal`
- Right: `Current User's linked_author's name` + `Logout Button` (Action: `Log the user out` $\rightarrow$ Redirect `login`).

---

### 4.2 KPI Summary Cards (`Group_MetricsRow`)
Layout: Row, Spacing: 16px, Width: 100%, Max-width: 1200px.

#### Card 1: Total Royalties Earned
- Element: `Group` (Card style)
- Label: `Total Royalty Earned`
- Dynamic Expression:
  ```
  Current User's linked_author's books's total_royalty_earned:sum:formatted as currency (₹)
  ```
- Subtext: `Calculated from 80/20 net profit split`

#### Card 2: Royalty Disbursed (Paid)
- Element: `Group` (Card style)
- Label: `Royalty Paid to Date`
- Dynamic Expression:
  ```
  Current User's linked_author's books's royalty_paid:sum:formatted as currency (₹)
  ```
- Subtext: `Direct bank transfers`

#### Card 3: Pending Royalty
- Element: `Group` (Card style)
- Label: `Pending Royalty`
- Dynamic Expression:
  ```
  Current User's linked_author's books's royalty_pending:sum:formatted as currency (₹)
  ```
- Subtext: If pending < ₹1,000, display: `⚠️ Below ₹1,000 threshold (rolls over to next quarter)`

#### Card 4: Overall Status Badge
- Element: `Group` with nested `Text`
- Dynamic Badge Expression & Conditionals:
  - **Condition 1 (GREEN)**:
    - When: `Current User's linked_author's books's royalty_pending:sum is 0`
    - Background: `#DCFCE7`, Text Color: `#16A34A`, Text: `● ALL ROYALTIES PAID`
  - **Condition 2 (RED)**:
    - When: `Current User's linked_author's books:filtered(royalty_pending > 0 and last_royalty_payout_date < Current date/time +(days): -90):count > 0`
    - Background: `#FEE2E2`, Text Color: `#DC2626`, Text: `● PAYOUT OVERDUE (> 90 DAYS)`
  - **Condition 3 (YELLOW - Default)**:
    - When: Not Green and Not Red
    - Background: `#FEF9C3`, Text Color: `#CA8A04`, Text: `● PENDING (IN NORMAL CYCLE)`

---

### 4.3 Section: "My Books" (`RepeatingGroup_AuthorBooks`)
- Type of Content: `Book`
- Data Source: `Current User's linked_author's books`
- Layout: Column, Row height: 90px, Spacing: 12px.

#### Inside Each Cell:
1. **Title & ISBN**:
   - `Current cell's Book's title` (Font: 16px Bold)
   - `ISBN: ` + `Current cell's Book's isbn` + ` • Genre: ` + `Current cell's Book's genre`
2. **Status Badge**:
   - Text: `Current cell's Book's status`
   - If contains `"Published"` $\rightarrow$ Green badge (`#DCFCE7`)
   - If contains `"In Production"` $\rightarrow$ Purple badge (`#F3E8FF`, text `#7E22CE`)
3. **Copies Sold**:
   - `Current cell's Book's total_copies_sold:formatted as 1,234` + ` units`
4. **Royalty Breakdown**:
   - Earned: `Current cell's Book's total_royalty_earned:formatted as currency`
   - Paid: `Current cell's Book's royalty_paid:formatted as currency`
   - Pending: `Current cell's Book's royalty_pending:formatted as currency`
5. **Last Payout Date**:
   - Dynamic Expression:
     - When `Current cell's Book's last_royalty_payout_date is not empty`: `Current cell's Book's last_royalty_payout_date:formatted as dd mmm yyyy`
     - When `Current cell's Book's last_royalty_payout_date is empty`: `No payouts recorded yet`
6. **Distribution Platforms**:
   - Text: `Available on: ` + `Current cell's Book's available_on_raw`

---

## 5. Page 3: `admin-dashboard` (Operations Admin)

The admin portal provides operations leads with full visibility, filtering, author inspection, and summary trigger capabilities.

### 5.1 Controls & Filters Bar (`Group_AdminFilters`)
Layout: Row, Width: 100%, Spacing: 16px, Padding: 16px.

1. **Search Input**:
   - Element: `Input`
   - Name: `Input_SearchAuthor`
   - Placeholder: `Search author by name...`
2. **City Dropdown Filter**:
   - Element: `Dropdown`
   - Name: `Dropdown_City`
   - Choices: `Search for Authors's city:unique elements` (includes "All Cities", "Mumbai", "Delhi", "Hyderabad", "Pune", "Kochi", "Chandigarh", "Bangalore", "Lucknow", "Nagpur", "Kolkata")
3. **Payout Status Dropdown Filter**:
   - Element: `Dropdown`
   - Name: `Dropdown_Status`
   - Choices: `All Statuses`, `All Paid (Green)`, `Pending (Yellow)`, `Overdue (Red)`
4. **Bulk Action Button**:
   - Element: `Button`
   - Name: `Btn_BulkTrigger`
   - Text: `⚡ Generate Summaries for All Authors with Pending Royalties`
   - Style: High-emphasis Primary Blue with bolt icon.

---

### 5.2 Authors Table (`RepeatingGroup_AllAuthors`)
- Type of Content: `Author`
- Data Source:
  ```
  Search for Authors
    where name contains Input_SearchAuthor's value (ignore if empty)
    and city = Dropdown_City's value (ignore if empty)
  ```
  *(Filtered further in frontend for Dropdown_Status if selected).*

#### Columns in Table:
1. **Author Name & ID**: `Current cell's Author's name` (`Current cell's Author's author_id`)
2. **City**: `Current cell's Author's city`
3. **Books Count**: `Current cell's Author's books:count`
4. **Total Royalty Earned**: `Current cell's Author's books's total_royalty_earned:sum:formatted as currency`
5. **Pending Royalty**: `Current cell's Author's books's royalty_pending:sum:formatted as currency`
6. **Status Pill**:
   - Green / Yellow / Red badge based on the 3-state logic.
7. **Action Button**:
   - Element: `Button`
   - Text: `View Details & Trigger`
   - Action: Open `Popup_AuthorDetail` (or navigate to `admin-author-detail?id=Current cell's Author's author_id`).

---

## 6. Author Detail Modal / Drawer (`Popup_AuthorDetail`)

Type of Content: `Author`

### 6.1 Content Elements:
1. **Author Profile**: Name, Email, Phone, City, Joined Date.
2. **Book Catalog Repeating Group**: All books for this author with sales, earned, paid, pending, and last payout dates.
3. **Payout History List**: Shows verified disbursements from the `Payout` data type for this author.
4. **Trigger Action Container**:
   - **Trigger Button**:
     - Name: `Btn_TriggerSingleSummary`
     - Text: `✉️ Generate & Send Royalty Summary`
   - **Loading State Indicator**:
     - Element: `Group` (contains animated spinner and text `"Orchestrating n8n AI workflow... Generating summary..."`)
     - Visible only when `Popup_AuthorDetail's is_processing is 'yes'`
   - **Generated Email Content Viewer**:
     - Visible when `Popup_AuthorDetail's latest_log's status is 'SUCCESS'`
     - Displays:
       - Subject: `Popup_AuthorDetail's latest_log's email_subject`
       - Completed At: `Popup_AuthorDetail's latest_log's completed_at:formatted as dd mmm yyyy HH:MM`
       - Content Box: Multi-line text displaying `Popup_AuthorDetail's latest_log's generated_email_content`

---

## 7. Page 4: `admin-notification-logs`

A dedicated audit log page for tracking all webhook runs and AI executions.

### Elements:
- Repeating Group: `NotificationLog`
- Columns:
  1. `Request ID`: `Current cell's NotificationLog's request_id`
  2. `Author`: `Current cell's NotificationLog's author's name`
  3. `Triggered At`: `Current cell's NotificationLog's triggered_at:formatted as dd mmm yyyy HH:MM:ss`
  4. `Status`:
     - `PROCESSING` $\rightarrow$ Blue pill
     - `SUCCESS` $\rightarrow$ Green pill
     - `FAILED` $\rightarrow$ Red pill
  5. `Completed At`: `Current cell's NotificationLog's completed_at`
  6. `Email Subject`: `Current cell's NotificationLog's email_subject`
  7. `Error Details`: `Current cell's NotificationLog's error_message` (visible if status is FAILED)
  8. `Action`: Button `View Full Email Body` $\rightarrow$ Opens viewer modal.

