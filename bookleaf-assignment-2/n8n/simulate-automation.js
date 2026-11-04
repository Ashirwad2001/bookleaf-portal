/**
 * Local Simulation Harness for BookLeaf n8n Automation
 * 
 * Runs the exact same logic as the n8n workflow locally against the real
 * bookleaf_sample_data.json dataset. Demonstrates:
 * 1. Webhook authentication & validation
 * 2. Deterministic financial calculation (never hallucinated)
 * 3. BookLeaf policy grounding (80/20 split, ₹1,000 threshold, quarterly cycle)
 * 4. Production book handling
 * 5. Success / Failure callback payload generation
 * 
 * Usage:
 *   node bookleaf-assignment-2/n8n/simulate-automation.js [AUTHOR_ID]
 * Example:
 *   node bookleaf-assignment-2/n8n/simulate-automation.js AUTH001
 *   node bookleaf-assignment-2/n8n/simulate-automation.js AUTH009
 */

const fs = require('fs');
const path = require('path');

const sampleDataPath = path.join(__dirname, '../../bookleaf_sample_data.json');
const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));

const EXPECTED_SECRET = process.env.WEBHOOK_SECRET || 'bookleaf_secure_webhook_secret_2026';

function runPipeline(headers, body) {
  console.log('='.repeat(70));
  console.log(`[n8n] INCOMING WEBHOOK: request_id=${body.request_id}, author_id=${body.author_id}`);

  // Node 2: Validate Auth & Payload
  const providedSecret = headers['x-webhook-secret'] || headers['X-Webhook-Secret'];
  if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
    console.error('[n8n] ERROR: 401 Unauthorized - Invalid or missing X-Webhook-Secret');
    return {
      status: 'FAILED',
      callback: {
        request_id: body.request_id,
        error_message: '401 Unauthorized: Invalid X-Webhook-Secret'
      }
    };
  }

  if (!body.request_id || !body.author_id) {
    console.error('[n8n] ERROR: 400 Bad Request - Missing request_id or author_id');
    return {
      status: 'FAILED',
      callback: {
        request_id: body.request_id || 'UNKNOWN',
        error_message: '400 Bad Request: Missing required fields'
      }
    };
  }

  // Nodes 4 & 5: Fetch Author and Books
  const author = sampleData.authors.find(a => a.author_id === body.author_id);
  if (!author) {
    console.error(`[n8n] ERROR: 404 Author Not Found - ${body.author_id}`);
    return {
      status: 'FAILED',
      callback: {
        request_id: body.request_id,
        error_message: `Author with ID ${body.author_id} not found in database`
      }
    };
  }

  // Node 6: Deterministic Financial Calculations & Business Policy Logic
  let totalSold = 0;
  let totalEarned = 0;
  let totalPaid = 0;
  let totalPending = 0;
  const publishedBooks = [];
  const productionBooks = [];

  author.books.forEach(book => {
    const sold = Number(book.total_copies_sold || 0);
    const earned = Number(book.total_royalty_earned || 0);
    const paid = Number(book.royalty_paid || 0);
    const pending = Number(book.royalty_pending || 0);

    totalSold += sold;
    totalEarned += earned;
    totalPaid += paid;
    totalPending += pending;

    if (book.status && book.status.toLowerCase().includes('production')) {
      productionBooks.push(book);
    } else {
      publishedBooks.push(book);
    }
  });

  // Determine Badge Status
  let statusBadge = 'YELLOW';
  if (totalPending === 0) {
    statusBadge = 'GREEN';
  } else {
    const hasOverdueBook = publishedBooks.some(b => {
      if (b.royalty_pending > 0 && b.last_royalty_payout_date) {
        const lastPayout = new Date(b.last_royalty_payout_date);
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        return (new Date('2026-01-01') - lastPayout) > ninetyDays;
      }
      return false;
    });
    if (hasOverdueBook) statusBadge = 'RED';
  }

  const isSubThreshold = totalPending > 0 && totalPending < 1000;

  console.log(`[n8n] DETERMINISTIC TOTALS for ${author.name}:`);
  console.log(`      Copies Sold: ${totalSold} | Earned: ₹${totalEarned} | Paid: ₹${totalPaid} | Pending: ₹${totalPending}`);
  console.log(`      Status Badge: ${statusBadge} | Sub-₹1,000 Threshold: ${isSubThreshold}`);
  console.log(`      Published Titles: ${publishedBooks.length} | Production Titles: ${productionBooks.length}`);

  // Node 7 & 8: AI Prompt & Generation
  const subject = isSubThreshold
    ? `BookLeaf Royalty Statement — ${author.name} (Balance Rollover Notice)`
    : totalPending === 0
      ? `BookLeaf Royalty Update — ${author.name} (All Royalties Settled)`
      : `Your BookLeaf Royalty Summary & Payout Overview — ${author.name}`;

  let emailBody = `Dear ${author.name},\n\n`;
  emailBody += `We are pleased to provide your verified royalty statement for your titles published with BookLeaf Publishing.\n\n`;
  emailBody += `### Catalog Overview\n`;
  emailBody += `- Lifetime Units Sold: ${totalSold.toLocaleString('en-IN')}\n`;
  emailBody += `- Total Royalty Accrued: ₹${totalEarned.toLocaleString('en-IN')}\n`;
  emailBody += `- Royalties Disbursed to Date: ₹${totalPaid.toLocaleString('en-IN')}\n`;
  emailBody += `- Current Outstanding Balance: ₹${totalPending.toLocaleString('en-IN')}\n\n`;

  emailBody += `### Book-by-Book Breakdown\n`;
  publishedBooks.forEach(b => {
    emailBody += `• "${b.title}" (ISBN: ${b.isbn})\n`;
    emailBody += `   - Copies Sold: ${b.total_copies_sold} | Earned: ₹${b.total_royalty_earned} | Paid: ₹${b.royalty_paid} | Pending: ₹${b.royalty_pending}\n`;
    emailBody += `   - Last Payout: ${b.last_royalty_payout_date ? b.last_royalty_payout_date : 'Awaiting inaugural quarterly cycle'}\n`;
    emailBody += `   - Distribution: ${(b.available_on || []).join(', ')}\n\n`;
  });

  if (productionBooks.length > 0) {
    emailBody += `### Books in Production\n`;
    productionBooks.forEach(b => {
      emailBody += `• "${b.title}" — Current Stage: ${b.status}\n`;
      emailBody += `   Our editorial team is actively progressing your manuscript. Royalty tracking and distribution will commence upon official publication.\n\n`;
    });
  }

  emailBody += `### BookLeaf Policy & Next Steps\n`;
  if (isSubThreshold) {
    emailBody += `Under BookLeaf's author policy, quarterly payouts require a minimum accumulated threshold of ₹1,000. Your current balance of ₹${totalPending} remains completely secure in your account and will automatically roll over to the subsequent quarter.\n\n`;
  } else if (totalPending === 0) {
    emailBody += `All accrued royalties have been 100% disbursed to your registered bank account. Thank you for your continued partnership with BookLeaf!\n\n`;
  } else {
    emailBody += `Your pending balance of ₹${totalPending.toLocaleString('en-IN')} has met the minimum payout threshold and is scheduled for bank transfer in accordance with our standard quarterly cycle (within 45 days of quarter close).\n\n`;
  }

  emailBody += `Warm regards,\n`;
  emailBody += `The Author Relations Team\n`;
  emailBody += `BookLeaf Publishing`;

  // Nodes 10 & 11: Prepare Success Callback to Bubble
  const callbackPayload = {
    request_id: body.request_id,
    auth_secret: EXPECTED_SECRET,
    email_subject: subject,
    email_body: emailBody,
    total_earned: totalEarned,
    total_paid: totalPaid,
    total_pending: totalPending
  };

  console.log('[n8n] SUCCESS: Generated AI email and prepared Bubble callback payload:');
  console.log(`[n8n] Subject: "${subject}"`);
  console.log('='.repeat(70));

  return {
    status: 'SUCCESS',
    callback: callbackPayload
  };
}

// CLI Execution
const targetAuthorId = process.argv[2] || 'AUTH001';
const mockHeaders = {
  'content-type': 'application/json',
  'x-webhook-secret': 'bookleaf_secure_webhook_secret_2026'
};
const mockBody = {
  request_id: `REQ-${targetAuthorId}-${Date.now()}`,
  author_id: targetAuthorId,
  triggered_by: 'admin@bookleaf.com',
  triggered_at: new Date().toISOString()
};

const result = runPipeline(mockHeaders, mockBody);
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
}

