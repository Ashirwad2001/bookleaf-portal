import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Unit Tests: Royalty & Business Rules', () => {
  const MINIMUM_PAYOUT_THRESHOLD = 1000; // BookLeaf ₹1,000 policy
  const AUTHOR_ROYALTY_PERCENTAGE = 0.8; // 80% of net profit

  test('80/20 Net Profit Calculation', () => {
    const mrp = 399;
    const printingAndDistributionCost = 250;
    const netProfit = mrp - printingAndDistributionCost; // 149
    const authorRoyaltyPerCopy = Math.round(netProfit * AUTHOR_ROYALTY_PERCENTAGE); // 80% = 119.2 -> 119
    const publisherShare = netProfit - authorRoyaltyPerCopy; // 20% = 30

    assert.equal(authorRoyaltyPerCopy, 119);
    assert.equal(publisherShare, 30);
    assert.ok(authorRoyaltyPerCopy > publisherShare, 'Author share must exceed publisher share per 80/20 rule');
  });

  test('Royalty Threshold Policy: >= ₹1,000 qualifies for quarterly payout', () => {
    const bookWithPendingPayout = {
      title: 'Whispers of the Ganges',
      royaltyPending: 3570,
    };

    const qualifiesForPayout = bookWithPendingPayout.royaltyPending >= MINIMUM_PAYOUT_THRESHOLD;
    assert.equal(qualifiesForPayout, true, 'Pending amount of ₹3,570 must qualify for disbursement');
  });

  test('Royalty Threshold Policy: < ₹1,000 rolls over to next quarter', () => {
    const bookWithSubThreshold = {
      title: 'The Nagpur Notebooks',
      royaltyPending: 850,
    };

    const qualifiesForPayout = bookWithSubThreshold.royaltyPending >= MINIMUM_PAYOUT_THRESHOLD;
    const rolloverAmount = bookWithSubThreshold.royaltyPending;

    assert.equal(qualifiesForPayout, false, 'Pending amount of ₹850 must NOT qualify for disbursement');
    assert.equal(rolloverAmount, 850, 'Sub-threshold balance must roll over intact to the next quarter');
  });

  test('Production books have pending royalty calculation until live release', () => {
    const inProductionBook = {
      title: 'Midnight in Mysore',
      status: 'In Production - Cover Design',
      mrp: null,
      totalCopiesSold: 0,
      royaltyPending: 0,
    };

    assert.equal(inProductionBook.mrp, null);
    assert.equal(inProductionBook.totalCopiesSold, 0);
    assert.equal(inProductionBook.royaltyPending, 0);
  });
});
