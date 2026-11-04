const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting BookLeaf Assignment 2 Verification Test Suite...\n');

// Test 1: Verify bookleaf_sample_data.json existence and completeness
console.log('Test 1: Dataset Verification (10 Authors, 18 Books)');
const dataPath = path.join(__dirname, '../../bookleaf_sample_data.json');
assert.ok(fs.existsSync(dataPath), 'Dataset file must exist');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

assert.equal(data.authors.length, 10, 'Must contain exactly 10 authors');
let bookCount = 0;
data.authors.forEach(a => {
  bookCount += a.books.length;
});
assert.equal(bookCount, 18, 'Must contain exactly 18 books');
console.log('✓ Test 1 Passed: Exactly 10 authors and 18 books verified.\n');

// Test 2: Verify Financial Integrity (No hallucinated amounts)
console.log('Test 2: Financial Aggregations');
let totalCopies = 0;
let totalEarned = 0;
let totalPaid = 0;
let totalPending = 0;

data.authors.forEach(a => {
  a.books.forEach(b => {
    totalCopies += b.total_copies_sold || 0;
    totalEarned += b.total_royalty_earned || 0;
    totalPaid += b.royalty_paid || 0;
    totalPending += b.royalty_pending || 0;
  });
});

assert.equal(totalCopies, 7205, 'Total copies sold must equal 7,205');
assert.equal(totalEarned, 243382, 'Total royalty earned must equal ₹243,382');
assert.equal(totalPaid, 202543, 'Total royalty paid must equal ₹202,543');
assert.equal(totalPending, 40839, 'Total royalty pending must equal ₹40,839');
console.log('✓ Test 2 Passed: Exact financial totals verified across 18 books.\n');

// Test 3: Verify Sub-₹1,000 Threshold Policy (Kavita Deshmukh)
console.log('Test 3: Sub-₹1,000 Threshold Rollover Logic');
const kavita = data.authors.find(a => a.author_id === 'AUTH009');
assert.ok(kavita, 'Kavita Deshmukh must exist');
let kavitaPending = 0;
kavita.books.forEach(b => { kavitaPending += b.royalty_pending || 0; });
assert.equal(kavitaPending, 850, 'Kavita pending royalty must be exactly ₹850');
assert.ok(kavitaPending < 1000, 'Pending balance must be below ₹1,000 threshold to trigger rollover policy');
console.log('✓ Test 3 Passed: Sub-threshold rollover case verified for AUTH009.\n');

// Test 4: Verify Fully Paid GREEN Status (Farhan Sheikh)
console.log('Test 4: Fully Settled Status Logic (Farhan Sheikh)');
const farhan = data.authors.find(a => a.author_id === 'AUTH008');
assert.ok(farhan, 'Farhan Sheikh must exist');
let farhanPending = 0;
farhan.books.forEach(b => { farhanPending += b.royalty_pending || 0; });
assert.equal(farhanPending, 0, 'Farhan pending royalty must be exactly ₹0');
console.log('✓ Test 4 Passed: Fully paid GREEN status verified for AUTH008.\n');

// Test 5: Verify In-Production Books (Sneha Kulkarni & Kavita Deshmukh)
console.log('Test 5: Books in Production Handling');
const sneha = data.authors.find(a => a.author_id === 'AUTH007');
const midnightInMysore = sneha.books.find(b => b.book_id === 'BK013');
assert.ok(midnightInMysore, 'Midnight in Mysore must exist');
assert.equal(midnightInMysore.status, 'In Production - Cover Design');
assert.equal(midnightInMysore.publication_date, null);
assert.equal(midnightInMysore.mrp, null);
assert.equal(midnightInMysore.total_royalty_earned, 0);

const raisingRoots = kavita.books.find(b => b.book_id === 'BK015');
assert.ok(raisingRoots, 'Raising Roots must exist');
assert.equal(raisingRoots.status, 'In Production - Typesetting');
assert.equal(raisingRoots.publication_date, null);
console.log('✓ Test 5 Passed: Production status and null fields verified for BK013 and BK015.\n');

// Test 6: Verify CSV Files Export for Bubble Data Import
console.log('Test 6: Bubble CSV Files Verification');
const authorsCsv = fs.readFileSync(path.join(__dirname, '../data/authors.csv'), 'utf8').trim().split('\n');
const booksCsv = fs.readFileSync(path.join(__dirname, '../data/books.csv'), 'utf8').trim().split('\n');
const usersCsv = fs.readFileSync(path.join(__dirname, '../data/users.csv'), 'utf8').trim().split('\n');
const payoutsCsv = fs.readFileSync(path.join(__dirname, '../data/payouts.csv'), 'utf8').trim().split('\n');

assert.equal(authorsCsv.length, 11, 'authors.csv must have 1 header + 10 rows');
assert.equal(booksCsv.length, 19, 'books.csv must have 1 header + 18 rows');
assert.equal(usersCsv.length, 12, 'users.csv must have 1 header + 1 admin + 10 authors');
assert.equal(payoutsCsv.length, 13, 'payouts.csv must have 1 header + 12 recorded disbursements');
console.log('✓ Test 6 Passed: All 4 CSV import files verified.\n');

// Test 7: Verify n8n Workflow JSON Export Validity
console.log('Test 7: n8n Workflow JSON Export Validation');
const wfPath = path.join(__dirname, '../n8n/bookleaf-royalty-summary.json');
assert.ok(fs.existsSync(wfPath), 'n8n workflow JSON must exist');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
assert.equal(wf.name, 'BookLeaf - Author Royalty Summary & Notification Engine');
assert.ok(wf.nodes.length >= 10, 'Workflow must contain at least 10 nodes');

const nodeTypes = wf.nodes.map(n => n.type);
assert.ok(nodeTypes.includes('n8n-nodes-base.webhook'), 'Must include Webhook trigger node');
assert.ok(nodeTypes.includes('n8n-nodes-base.httpRequest'), 'Must include HTTP Request nodes');
assert.ok(nodeTypes.includes('n8n-nodes-base.code'), 'Must include JavaScript code nodes');
assert.ok(nodeTypes.includes('n8n-nodes-base.if'), 'Must include conditional IF nodes');
console.log('✓ Test 7 Passed: Valid n8n workflow JSON structure verified.\n');

console.log('🎉 ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!');

