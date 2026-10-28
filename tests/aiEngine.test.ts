import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWithFallbackEngine, AuthorContext, BookContext } from '../src/lib/ai/fallbackEngine';
import { BOOKLEAF_KNOWLEDGE_BASE } from '../src/lib/ai/knowledgeBase';

describe('Unit Tests: AI Classification & Knowledge Base Grounding', () => {
  const mockAuthor: AuthorContext = {
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
  };

  const mockBook: BookContext = {
    id: 'BK001',
    title: 'Whispers of the Ganges',
    status: 'Published & Live',
    isbn: '978-93-5XXXX-01-1',
    mrp: 399,
    totalCopiesSold: 342,
    totalRoyaltyEarned: 11970,
    royaltyPaid: 8400,
    royaltyPending: 3570,
    printPartner: 'In-House',
  };

  test('Classifies royalty payout inquiry correctly with HIGH/CRITICAL priority', () => {
    const analysis = analyzeWithFallbackEngine(
      'Royalty payout delayed',
      'I have 3570 pending royalty that has not reached my bank account yet.',
      mockAuthor,
      mockBook
    );

    assert.equal(analysis.category, 'ROYALTY_PAYMENTS');
    assert.equal(analysis.engineUsed, 'heuristic-fallback');
    assert.ok(['CRITICAL', 'HIGH'].includes(analysis.priority), 'Payout delay must be prioritized high');
    assert.ok(analysis.draftResponse.includes('Priya'), 'Draft must be personalized with author name');
    assert.ok(analysis.draftResponse.includes('3570'), 'Draft must reference specific pending amount');
    assert.ok(analysis.draftResponse.includes('quarterly') || analysis.draftResponse.includes('45 days'), 'Draft must explain quarterly payout policy');
  });

  test('Classifies print defect inquiry with HIGH/CRITICAL priority and reprint guarantee', () => {
    const analysis = analyzeWithFallbackEngine(
      'Spine glue defective on author copies',
      'The binding has separated and loose pages are falling out from the book.',
      mockAuthor,
      mockBook
    );

    assert.equal(analysis.category, 'PRINTING_QUALITY');
    assert.ok(['CRITICAL', 'HIGH'].includes(analysis.priority), 'Defective binding must be high or critical priority');
    assert.ok(analysis.draftResponse.includes('reprint') || analysis.draftResponse.includes('photo'), 'Must reference free reprint or photo verification');
    assert.ok(analysis.draftResponse.includes('Repro') || analysis.draftResponse.includes('Delhi'), 'Must reference print facility or partner');
  });

  test('Classifies ISBN discrepancy query correctly', () => {
    const analysis = analyzeWithFallbackEngine(
      'Incorrect ISBN printed on copyright page',
      'The barcode has an imprint discrepancy with the government allocation.',
      mockAuthor,
      mockBook
    );

    assert.equal(analysis.category, 'ISBN_METADATA');
    assert.ok(analysis.draftResponse.includes('ISBN') || analysis.draftResponse.includes('metadata'));
  });

  test('Classifies platform inventory / stock sync query correctly', () => {
    const analysis = analyzeWithFallbackEngine(
      'Amazon showing currently unavailable',
      'Readers say the Flipkart listing is active but Amazon India says out of stock.',
      mockAuthor,
      mockBook
    );

    assert.equal(analysis.category, 'DISTRIBUTION_AVAILABILITY');
    assert.ok(analysis.draftResponse.includes('24 to 48 hours') || analysis.draftResponse.includes('synchronization'));
  });

  test('Classifies typesetting / production timeline query correctly', () => {
    const analysis = analyzeWithFallbackEngine(
      'When will my typesetting proof be ready?',
      'I submitted my manuscript revisions last week and need a stage update.',
      mockAuthor,
      {
        id: 'BK015',
        title: 'Raising Roots',
        status: 'In Production - Typesetting',
      }
    );

    assert.equal(analysis.category, 'BOOK_STATUS_PRODUCTION');
    assert.ok(analysis.draftResponse.includes('Typesetting') || analysis.draftResponse.includes('proof'));
  });

  test('Knowledge Base includes all mandatory BookLeaf publishing parameters', () => {
    const royaltyPolicyText = BOOKLEAF_KNOWLEDGE_BASE.royalty.policies.join(' ');
    assert.ok(royaltyPolicyText.includes('80/20 royalty split'), 'Must include 80/20 split');
    assert.ok(royaltyPolicyText.includes('₹1,000'), 'Must include minimum ₹1,000 threshold');
    assert.ok(royaltyPolicyText.includes('45 days'), 'Must include 45-day quarterly payout window');

    const printingPolicyText = BOOKLEAF_KNOWLEDGE_BASE.printing.policies.join(' ');
    assert.ok(printingPolicyText.includes('5–7 business days'), 'Must include 5-7 business days printing turnaround');

    const distributionPolicyText = BOOKLEAF_KNOWLEDGE_BASE.distribution.policies.join(' ');
    assert.ok(distributionPolicyText.includes('Amazon India') && distributionPolicyText.includes('Flipkart'), 'Must cover distribution channels');
  });
});
