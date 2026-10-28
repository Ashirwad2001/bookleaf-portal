/**
 * BookLeaf Official Knowledge Base & Policy Engine
 * Used for grounding AI prompts and local fallback heuristic response drafting.
 */

export interface KnowledgeBaseTopic {
  id: string;
  category: string;
  title: string;
  policies: string[];
  toneDirectives: string[];
  sla: string;
}

export const BOOKLEAF_KNOWLEDGE_BASE: Record<string, KnowledgeBaseTopic> = {
  royalty: {
    id: 'royalty',
    category: 'Royalty & Payments',
    title: 'Royalty Calculation & Payout Policies',
    policies: [
      'BookLeaf follows an 80/20 royalty split: 80% of net profit goes to the author, 20% to BookLeaf.',
      'Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.',
      'Royalties are calculated quarterly and paid within 45 days of the quarter ending.',
      'Minimum payout threshold is ₹1,000. If accumulated royalties are below ₹1,000, they automatically roll over to the next quarter.',
      'Payouts are made via direct bank transfer to the account linked in the author’s dashboard.',
      'Authors can view their platform-by-platform sales and royalty breakdown in their author portal.'
    ],
    toneDirectives: [
      'Acknowledge financial anxiety/frustration empathetically.',
      'Explain the quarterly cycle and 45-day payout timeline clearly.',
      'State specific amounts, payout dates, and whether minimum ₹1,000 threshold has been met.',
      'Remind author to confirm bank details on their profile.',
      'If payment is genuinely overdue, own the issue and commit to a 48-hour resolution timeline.'
    ],
    sla: '48-hour escalation resolution'
  },
  isbn: {
    id: 'isbn',
    category: 'ISBN & Metadata Issues',
    title: 'ISBN Assignment & Metadata Policies',
    policies: [
      'Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.',
      'ISBNs are registered under BookLeaf’s publisher imprint. If an author wants an ISBN under their own imprint, they must obtain it independently.',
      'ISBN errors (such as duplicate ISBN, wrong book linked on platforms) are treated as HIGH priority and escalated directly to the production team.',
      'Metadata updates (book description, subtitle, author bio) take 3–5 business days to reflect on retailer platforms after submission.'
    ],
    toneDirectives: [
      'Treat metadata and ISBN discrepancies with high priority and urgency.',
      'Acknowledge data inaccuracies seriously without defensive deflection.',
      'Confirm escalation to the production metadata team with an explicit 48-hour timeline.'
    ],
    sla: '48-hour production escalation'
  },
  printing: {
    id: 'printing',
    category: 'Printing & Quality',
    title: 'Printing, Binding & Quality Assurance Policies',
    policies: [
      'In-house printing facility and warehouse are located in Delhi. Overflow or specialized formats are handled by print partners Repro India and Epitome Books.',
      'Standard print turnaround is 5–7 business days from order confirmation.',
      'Quality guarantee: If an author reports a quality issue (misprints, binding defects, ink smearing, color inconsistency), BookLeaf arranges a 100% FREE reprint after verification.',
      'The author is requested to share clear photos of the defective copies for verification.'
    ],
    toneDirectives: [
      'Apologise sincerely for any substandard physical copies.',
      'Request 2–3 photos of the defects (cover, binding, misprinted pages).',
      'Assure the author that verified defective copies receive a free reprint expedited within 5–7 business days.'
    ],
    sla: 'Free reprint expedited within 5–7 business days upon photo verification'
  },
  distribution: {
    id: 'distribution',
    category: 'Distribution & Availability',
    title: 'Distribution Channels & Stock Availability',
    policies: [
      'Books are distributed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.',
      'New listings typically go live within 7–10 business days after publication is complete.',
      'If a book shows "Currently Unavailable" on an external platform, it is usually a stock sync delay between retailer APIs.',
      'BookLeaf’s team can trigger an inventory re-sync with distribution partners within 24–48 hours.'
    ],
    toneDirectives: [
      'Reassure author that temporary "Currently Unavailable" tags are usually automated inventory sync lags.',
      'Confirm that our distribution ops team is triggering a catalog re-sync.',
      'Provide a clear 24–48 hour turnaround window for platform availability.'
    ],
    sla: '24–48 hours inventory re-sync'
  },
  production: {
    id: 'production',
    category: 'Book Status & Production Updates',
    title: 'Publishing Stages & Turnaround Times',
    policies: [
      'Standard workflow stages: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.',
      'Authors receive milestone status updates at each transition.',
      'Common delays occur during Cover Design (awaiting author feedback/approval) and Proofreading (author revisions rounds).',
      'Authors are partners; communicate production timelines honestly and collaboratively.'
    ],
    toneDirectives: [
      'Check current stage in the system and provide specific milestones.',
      'Be transparent about turnaround times without placing blame on the author.',
      'State the immediate next action required to advance to the subsequent production stage.'
    ],
    sla: 'Next milestone ETA provided within 24 hours'
  },
  general: {
    id: 'general',
    category: 'General Inquiry',
    title: 'General Support & Account Policies',
    policies: [
      'BookLeaf offers Standard Free (no upfront cost) and Bestseller Breakthrough (premium marketing & distribution) packages.',
      'Account settings, author bio, royalty payouts, and sales dashboards are self-service in the Author Portal.',
      'General support queries are reviewed Monday through Saturday.'
    ],
    toneDirectives: [
      'Warm, welcoming, and helpful tone.',
      'Provide concise step-by-step guidance.'
    ],
    sla: '24–48 hour response time'
  }
};

export const COMMUNICATION_TONE_SYSTEM_PROMPT = `
You are the BookLeaf Publishing Author Support Assistant.
BookLeaf is an author-first self-publishing platform operating across India and the US.

VOICE & TONE GUIDELINES:
1. Always empathetic, warm, and professional. Treat authors as creative partners, not support tickets.
2. Acknowledge the author's exact concern first before offering operational steps.
3. Be specific: mention exact book titles, royalty numbers, dates, turnaround times, and policy thresholds whenever context is provided.
4. If something is BookLeaf's fault (delayed royalty payout, ISBN linking error, defective printing), own it directly and sincerely without corporate deflection.
5. If investigation is needed, always commit to a concrete timeline ("Our team will look into this and update you within 48 hours") rather than vague promises.
6. Conclude with a clear next step for the author or for BookLeaf.
7. Format clearly with neat paragraphs, greeting, and signature ("Warm regards, BookLeaf Support Team").
`;
