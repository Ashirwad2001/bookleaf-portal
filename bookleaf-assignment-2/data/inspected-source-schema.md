# BookLeaf Sample Dataset — Detailed Source Schema Inspection

## 1. Overview
The source dataset is located at `bookleaf_sample_data.json` in the workspace root. It serves as the single source of truth for all author profiles, book catalogs, sales volumes, and royalty disbursements.

- **Total Authors**: 10
- **Total Books**: 18
- **Total Catalog Copies Sold**: 7,205
- **Total Royalty Earned**: ₹243,382
- **Total Royalty Disbursed (Paid)**: ₹202,543
- **Total Royalty Outstanding (Pending)**: ₹40,839

---

## 2. Source Entity Breakdown

### 2.1 Author Object (`authors[]`)
| Field Name | Type | Description | Sample Value | Nullable |
| :--- | :--- | :--- | :--- | :--- |
| `author_id` | String | Unique author identifier | `"AUTH001"` | No |
| `name` | String | Full legal/pen name | `"Priya Sharma"` | No |
| `email` | String | Unique login and contact email | `"priya.sharma@email.com"` | No |
| `phone` | String | Contact phone number | `"+91-98765-43210"` | No |
| `city` | String | Geographic location in India | `"Mumbai"` | No |
| `joined_date` | String (ISO date) | Onboarding date at BookLeaf | `"2023-03-15"` | No |
| `books` | Array of Objects | Nested array of book objects | `[...]` | No |

### 2.2 Book Object (`authors[].books[]`)
| Field Name | Type | Description | Sample Value | Nullable / Edge Case |
| :--- | :--- | :--- | :--- | :--- |
| `book_id` | String | Unique book identifier | `"BK001"` | No |
| `title` | String | Book title | `"Whispers of the Ganges"` | No |
| `isbn` | String | 13-digit ISBN imprint | `"978-93-5XXXX-01-1"` | No |
| `genre` | String | Category / classification | `"Literary Fiction"` | No |
| `publication_date` | String (ISO date) | Release date | `"2023-06-20"` | **Yes (`null` for In Production)** |
| `status` | String | Current publishing lifecycle | `"Published & Live"` | No (`"Published & Live"`, `"In Production - Cover Design"`, `"In Production - Typesetting"`) |
| `mrp` | Number (INR) | Maximum Retail Price | `399` | **Yes (`null` for In Production)** |
| `author_royalty_per_copy`| Number (INR) | Author's contract share per unit | `35` | **Yes (`null` for In Production)** |
| `total_copies_sold` | Number | Units sold to date | `342` | No (`0` for In Production) |
| `total_royalty_earned` | Number (INR) | `copies_sold * royalty_per_copy` | `11970` | No (`0` for In Production) |
| `royalty_paid` | Number (INR) | Disbursed royalties | `8400` | No (`0` for unpaid/production) |
| `royalty_pending` | Number (INR) | Unpaid balance | `3570` | No |
| `last_royalty_payout_date`| String (ISO date) | Date of last disbursement | `"2025-10-15"` | **Yes (`null` if never paid)** |
| `print_partner` | String | Fulfilment printing house | `"In-House"` | **Yes (`null` for In Production)** |
| `available_on` | Array of Strings | Retail & distribution channels | `["Amazon India", "Flipkart"]`| **Yes (empty `[]` for In Production)** |

---

## 3. Complete Catalog Inventory (10 Authors, 18 Books)

| Author ID | Author Name | City | Book ID | Book Title | Status | Copies Sold | Earned (₹) | Paid (₹) | Pending (₹) | Last Payout | Notable Edge Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH001** | Priya Sharma | Mumbai | BK001 | Whispers of the Ganges | Published & Live | 342 | 11,970 | 8,400 | 3,570 | 2025-10-15 | Standard quarterly payout due |
| | | | BK002 | The Saffron Diaries | Published & Live | 189 | 7,938 | 7,938 | 0 | 2025-12-01 | Fully settled (₹0 pending) |
| **AUTH002** | Rohit Kapoor | Delhi | BK003 | Code & Karma | Published & Live | 876 | 26,280 | 21,000 | 5,280 | 2025-09-01 | High pending balance |
| | | | BK004 | Startup Sutra | Published & Live | 1,203 | 57,744 | 50,000 | 7,744 | 2025-11-15 | Catalog bestseller |
| **AUTH003** | Ananya Reddy | Hyderabad | BK005 | Between Two Temples | Published & Live | 67 | 2,546 | 0 | 2,546 | `null` | **Never received payout** (> ₹1,000 threshold met) |
| **AUTH004** | Vikram Joshi | Pune | BK006 | Debugging Life | Published & Live | 534 | 13,350 | 10,000 | 3,350 | 2025-08-20 | Last payout > 90 days ago (**RED status**) |
| | | | BK007 | The Last Monsoon | Published & Live | 123 | 1,845 | 1,845 | 0 | 2025-12-01 | Fully settled (₹0 pending) |
| **AUTH005** | Meera Nair | Kochi | BK008 | Cardamom & Chaos | Published & Live | 445 | 14,240 | 14,240 | 0 | 2025-12-01 | Fully settled (₹0 pending) |
| | | | BK009 | Letters from Lakshadweep | Published & Live | 201 | 11,055 | 8,000 | 3,055 | 2025-10-15 | Normal quarterly cycle |
| **AUTH006** | Arjun Malhotra | Chandigarh | BK010 | Turban Tales | Published & Live | 88 | 2,464 | 0 | 2,464 | `null` | **Never received payout** (> ₹1,000 threshold met) |
| **AUTH007** | Sneha Kulkarni | Bangalore | BK011 | The Algorithm of Love | Published & Live | 1,567 | 39,175 | 35,000 | 4,175 | 2025-11-15 | High volume seller |
| | | | BK012 | Ctrl+Alt+Delete My Ex | Published & Live | 723 | 21,690 | 18,000 | 3,690 | 2025-10-15 | Normal cycle |
| | | | BK013 | Midnight in Mysore | In Production - Cover Design | 0 | 0 | 0 | 0 | `null` | **In Production (Cover Design)** — no royalties |
| **AUTH008** | Farhan Sheikh | Lucknow | BK014 | Ghazal of the Forgotten | Published & Live | 156 | 3,120 | 3,120 | 0 | 2025-12-01 | **100% Fully Settled (₹0 pending)** |
| **AUTH009** | Kavita Deshmukh| Nagpur | BK015 | Raising Roots | In Production - Typesetting | 0 | 0 | 0 | 0 | `null` | **In Production (Typesetting)** — no royalties |
| | | | BK016 | The Nagpur Notebooks | Published & Live | 34 | 850 | 0 | 850 | `null` | **Sub-₹1,000 Rollover Policy**: ₹850 < ₹1,000 threshold |
| **AUTH010** | Diya Chatterjee| Kolkata | BK017 | Durga’s Daughters | Published & Live | 612 | 27,540 | 25,000 | 2,540 | 2025-11-15 | Normal cycle |
| | | | BK018 | Howrah Nights | Published & Live | 45 | 1,575 | 0 | 1,575 | `null` | Recently published (Jan 2025), first cycle |

---

## 4. Key Business Policy & Edge Cases Identified

1. **Sub-Threshold Rollover (Kavita Deshmukh - BK016)**:
   - Total pending royalty is ₹850, which is below BookLeaf's minimum payout threshold of ₹1,000.
   - Per BookLeaf policy, this balance does not trigger an immediate disbursement but rolls over to the next quarter. The AI notification must clearly inform her of this policy.

2. **Books In Production (Sneha Kulkarni - BK013 & Kavita Deshmukh - BK015)**:
   - Neither book has an MRP, publication date, or sales.
   - Statuses are `"In Production - Cover Design"` and `"In Production - Typesetting"`.
   - The dashboard and AI summaries must cleanly segregate these from published books and inform the author of their current production milestone.

3. **Published Books with No Previous Payouts (Ananya Reddy - BK005, Arjun Malhotra - BK010, Diya Chatterjee - BK018)**:
   - `last_royalty_payout_date` is `null`.
   - These books have sales and pending royalties > ₹1,000. They are awaiting their inaugural quarterly payout cycle. The system must not crash or invent fallback dates.

4. **100% Fully Settled Authors (Farhan Sheikh - AUTH008)**:
   - Has 0 pending royalty.
   - Payout status is GREEN.
   - The bulk trigger must skip Farhan Sheikh since pending royalty is ₹0.

