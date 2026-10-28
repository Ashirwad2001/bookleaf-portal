import { TicketCategory, Priority } from '@prisma/client';
import { BOOKLEAF_KNOWLEDGE_BASE } from './knowledgeBase';

export interface AuthorContext {
  name: string;
  email: string;
}

export interface BookContext {
  id: string;
  title: string;
  status: string;
  isbn?: string | null;
  mrp?: number | null;
  totalCopiesSold?: number | null;
  totalRoyaltyEarned?: number | null;
  royaltyPaid?: number | null;
  royaltyPending?: number | null;
  lastRoyaltyPayoutDate?: Date | string | null;
  printPartner?: string | null;
}

export interface AIAnalysisResult {
  category: TicketCategory;
  priority: Priority;
  priorityReasoning: string;
  draftResponse: string;
  confidence: number;
  engineUsed: 'gemini' | 'heuristic-fallback';
}

/**
 * Intelligent local fallback heuristic classifier & responder
 * Maps author intent to BookLeaf Knowledge Base policies and generates highly tailored,
 * query-specific responses reflecting authentic BookLeaf communication tone.
 */
export function analyzeWithFallbackEngine(
  subject: string,
  description: string,
  author: AuthorContext,
  book?: BookContext | null
): AIAnalysisResult {
  const query = `${subject} ${description}`.toLowerCase();
  const authorFirstName = author.name.split(' ')[0] || author.name;
  const bookTitleSnippet = book ? ` for "${book.title}"` : '';

  // 1. Determine Category
  let category: TicketCategory = TicketCategory.GENERAL_INQUIRY;

  if (
    query.includes('royalty') ||
    query.includes('payout') ||
    query.includes('payment') ||
    query.includes('money') ||
    query.includes('bank') ||
    query.includes('earnings') ||
    query.includes('threshold') ||
    query.includes('sold') ||
    query.includes('commission') ||
    query.includes('profit')
  ) {
    category = TicketCategory.ROYALTY_PAYMENTS;
  } else if (
    query.includes('isbn') ||
    query.includes('metadata') ||
    query.includes('imprint') ||
    query.includes('barcode') ||
    query.includes('wrong book') ||
    query.includes('description on amazon') ||
    query.includes('update description') ||
    query.includes('update bio') ||
    query.includes('subtitle')
  ) {
    category = TicketCategory.ISBN_METADATA;
  } else if (
    query.includes('print') ||
    query.includes('quality') ||
    query.includes('misprint') ||
    query.includes('binding') ||
    query.includes('page') ||
    query.includes('blurry') ||
    query.includes('defect') ||
    query.includes('smudge') ||
    query.includes('author copies') ||
    query.includes('terrible') ||
    query.includes('damaged')
  ) {
    category = TicketCategory.PRINTING_QUALITY;
  } else if (
    query.includes('unavailable') ||
    query.includes('out of stock') ||
    query.includes('amazon') ||
    query.includes('flipkart') ||
    query.includes('distribution') ||
    query.includes('store') ||
    query.includes('not showing') ||
    query.includes('listing')
  ) {
    category = TicketCategory.DISTRIBUTION_AVAILABILITY;
  } else if (
    query.includes('typesetting') ||
    query.includes('proofreading') ||
    query.includes('cover design') ||
    query.includes('production') ||
    query.includes('stage') ||
    query.includes('when will it be published') ||
    query.includes('manuscript') ||
    query.includes('proof') ||
    query.includes('still in')
  ) {
    category = TicketCategory.BOOK_STATUS_PRODUCTION;
  }

  // 2. Determine Priority & Specific Reasoning
  let priority: Priority = Priority.MEDIUM;
  let priorityReasoning = 'Standard operational support query requiring normal assistance.';

  const isCritical =
    query.includes('terrible') ||
    query.includes('ruined') ||
    query.includes('legal') ||
    query.includes('urgent') ||
    query.includes('immediate') ||
    (category === TicketCategory.PRINTING_QUALITY &&
      (query.includes('defective') || query.includes('misaligned') || query.includes('misprint') || query.includes('smudge')));

  const isHigh =
    query.includes('haven\'t received') ||
    query.includes('not received') ||
    query.includes('missing') ||
    query.includes('different isbn') ||
    query.includes('duplicate') ||
    query.includes('months') ||
    category === TicketCategory.ISBN_METADATA ||
    (category === TicketCategory.ROYALTY_PAYMENTS && (book?.royaltyPending || 0) > 1000);

  const isLow =
    query.includes('bio') ||
    query.includes('update description') ||
    query.includes('social media') ||
    query.includes('just wondering') ||
    query.includes('general question');

  if (isCritical) {
    priority = Priority.CRITICAL;
    priorityReasoning =
      category === TicketCategory.PRINTING_QUALITY
        ? 'Defective author copies reported (misprints/binding issues). Immediate reprint SLA triggered.'
        : 'Author reported critical impact issue requiring top-priority handling.';
  } else if (isHigh) {
    priority = Priority.HIGH;
    priorityReasoning =
      category === TicketCategory.ROYALTY_PAYMENTS
        ? `Royalty payout inquiry with pending balance of ₹${book?.royaltyPending ?? 'N/A'} (over threshold or overdue).`
        : 'Platform data integrity or critical operational dependency flagged.';
  } else if (isLow) {
    priority = Priority.LOW;
    priorityReasoning = 'Routine metadata or informational request with standard turnaround time.';
  }

  // 3. Sub-Intent Specific Knowledge Base Response Drafting
  let draftResponse = '';

  if (category === TicketCategory.ROYALTY_PAYMENTS) {
    // Sub-intent: Discrepancy / Calculation / Amount seems too low
    if (
      query.includes('low') ||
      query.includes('calculation') ||
      query.includes('how is') ||
      query.includes('why only') ||
      query.includes('breakdown') ||
      query.includes('profit') ||
      query.includes('discrepancy')
    ) {
      const sold = book?.totalCopiesSold ?? 0;
      const earned = book?.totalRoyaltyEarned ?? 0;
      const mrp = book?.mrp ?? 399;

      draftResponse = `Dear ${authorFirstName},\n\nThank you for reaching out to BookLeaf Author Support regarding your royalty earnings${bookTitleSnippet}.\n\nWe completely understand your concern regarding the earnings calculation. We believe in total financial transparency with our authors.\n\nBookLeaf operates on an 80/20 profit-sharing model:\n• Author Share: You receive 80% of the net profit per book.\n• Net Profit Calculation: Net Profit = Retail MRP (₹${mrp}) minus in-house printing cost, retailer platform commission (Amazon/Flipkart charge ~40–50%), and packaging/shipping charges.\n\n${
        book
          ? `For "${book.title}", your catalog currently reflects ${sold} total copies sold across platforms, with ₹${earned} in accumulated net royalty earnings.`
          : 'You can view the exact platform-by-platform split in your Author Dashboard under My Books.'
      }\n\nWe would be more than happy to generate and share a detailed line-by-line reconciliation report showing exact deductions per platform. Our finance team will review your ledger and follow up with the full breakdown within 48 hours.\n\nWarm regards,\nBookLeaf Finance & Support Team`;
    }
    // Sub-intent: Overdue / Delayed / Haven't received payout
    else if (
      query.includes('haven\'t received') ||
      query.includes('not received') ||
      query.includes('months') ||
      query.includes('delayed') ||
      query.includes('when will') ||
      query.includes('credited') ||
      query.includes('payout date')
    ) {
      const pending = book?.royaltyPending ?? 0;
      const lastPayout = book?.lastRoyaltyPayoutDate
        ? new Date(book.lastRoyaltyPayoutDate).toLocaleDateString('en-IN', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : null;

      draftResponse = `Dear ${authorFirstName},\n\nThank you for writing to us. We understand how important timely payouts are, and we acknowledge your concern regarding your pending royalty balance${bookTitleSnippet}.\n\nHere is how BookLeaf’s royalty disbursement cycle works:\n• Schedule: Royalties are calculated quarterly and disbursed within 45 days of the quarter ending.\n• Minimum Threshold: ₹1,000. Accumulated amounts below ₹1,000 roll over automatically to the subsequent quarter.\n• Payout Method: Direct bank transfer to the account linked in your author profile.\n\n${
        pending >= 1000
          ? `Your current pending balance is ₹${pending}, which meets our payout threshold. ${
              lastPayout ? `Your previous payout was processed on ${lastPayout}. ` : ''
            }Our accounts team is reviewing the current quarterly batch, and we will verify your transfer reference within 48 hours.`
          : `Your pending balance is currently ₹${pending}. Because this is under the ₹1,000 threshold, it will roll over to the upcoming quarterly cycle as per policy.`
      }\n\nPlease ensure your bank IFSC and account number are up to date on your profile so there are no bank rejection delays.\n\nWarm regards,\nBookLeaf Accounts Team`;
    }
    // General royalty inquiry
    else {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for contacting BookLeaf Author Support regarding your royalties${bookTitleSnippet}.\n\nWe have reviewed your inquiry: "${subject}".\n\nBookLeaf follows an 80/20 royalty model (80% net profit to the author). Royalties are reconciled on a quarterly cycle and disbursed within 45 days of quarter close via direct bank transfer, subject to the standard ₹1,000 payout threshold.\n\nOur operations team is pulling your platform sales figures and will provide a comprehensive status update within 24 to 48 hours.\n\nWarm regards,\nBookLeaf Support Team`;
    }
  } else if (category === TicketCategory.ISBN_METADATA) {
    // Sub-intent: Discrepancy / Different ISBN on Amazon vs Physical
    if (query.includes('different') || query.includes('wrong') || query.includes('barcode') || query.includes('incorrect')) {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for bringing this to our attention immediately${bookTitleSnippet}.\n\nA discrepancy between the ISBN printed on your physical volume and the digital listing on Amazon/retailers is a serious catalog data issue, and we are treating this ticket with HIGH priority.\n\nEvery book published with BookLeaf receives a unique, registered ISBN under our publisher imprint. We have escalated this directly to our production metadata team. They will audit the retailer API data feed, verify the barcode registration, and trigger a corrective sync with Amazon within 48 hours.\n\nWe will update you as soon as the platform confirms the corrected catalog record.\n\nWarm regards,\nBookLeaf Production Team`;
    }
    // Sub-intent: Updating Description or Bio
    else if (query.includes('update') || query.includes('change') || query.includes('bio') || query.includes('description')) {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for reaching out regarding metadata updates${bookTitleSnippet}.\n\nYes, you can update your book’s blurb, description, categories, and author biography even after the book is live.\n\nPlease reply directly to this ticket with your finalized description or text revisions. Once submitted, our catalog team will format and push the update to Amazon India, Flipkart, and the BookLeaf Store.\n\nPlease note that external platforms typically take 3 to 5 business days to re-index and display updated metadata publicly.\n\nWarm regards,\nBookLeaf Catalog Operations`;
    } else {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for contacting BookLeaf Support regarding your ISBN and catalog details${bookTitleSnippet}.\n\nAll BookLeaf titles receive unique ISBNs under our publisher imprint. If you are inquiring about independent imprints, note that authors must obtain these independently before production begins.\n\nOur team is reviewing your query regarding "${subject}" and will respond with next steps within 24–48 hours.\n\nWarm regards,\nBookLeaf Support Team`;
    }
  } else if (category === TicketCategory.PRINTING_QUALITY) {
    // Sub-intent: Physical defect / misprints / binding issues
    if (query.includes('blurry') || query.includes('misprint') || query.includes('binding') || query.includes('smudge') || query.includes('defect') || query.includes('damaged') || query.includes('misaligned')) {
      draftResponse = `Dear ${authorFirstName},\n\nWe sincerely apologise for the quality defects in your author copies${bookTitleSnippet}. We hold our printing facility to exacting standards, and receiving substandard copies is deeply disappointing.\n\nUnder BookLeaf’s Quality Guarantee Policy, any verified manufacturing defects (ink smudging, blurry text, binding misalignment, or miscut pages) qualify for a 100% FREE reprint.\n\nHere are the next steps to arrange your replacement:\n1. Please reply with 2–3 clear photographs showing the defect (the spine/binding, cover, or affected pages).\n2. Our print operations lead will inspect the photos and initiate a priority reprint through our Delhi print facility or print partner (Repro India/Epitome Books).\n3. Your replacement batch will be printed and dispatched within our standard 5–7 business days turnaround.\n\nWe will personally oversee this run to ensure pristine finish.\n\nWarm regards,\nBookLeaf Quality Assurance Team`;
    } else {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for checking in regarding print operations${bookTitleSnippet}.\n\nStandard print turnaround from our Delhi facility and print partners (Repro India / Epitome Books) is 5–7 business days from order confirmation.\n\nWe are checking the exact press status of your order with the dispatch desk and will confirm your courier tracking ID within 24 hours.\n\nWarm regards,\nBookLeaf Print Operations`;
    }
  } else if (category === TicketCategory.DISTRIBUTION_AVAILABILITY) {
    // Sub-intent: Showing Unavailable on Amazon/Flipkart
    if (query.includes('unavailable') || query.includes('out of stock') || query.includes('not available')) {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for alerting us regarding availability on retailer platforms${bookTitleSnippet}.\n\nWhen a published book displays as "Currently Unavailable" on Amazon or Flipkart, it almost always indicates an automated inventory stock synchronization lag between retailer distributor feeds, rather than a delisting of your title.\n\nOur distribution team is manually triggering an inventory re-sync with our distribution partners. Listings typically refresh and display active "In Stock" status within 24 to 48 hours.\n\nWe will monitor the listing link and follow up to confirm once availability reflects correctly.\n\nWarm regards,\nBookLeaf Distribution Team`;
    } else {
      draftResponse = `Dear ${authorFirstName},\n\nThank you for contacting us regarding distribution channels${bookTitleSnippet}.\n\nBookLeaf distributes titles across Amazon India, Flipkart, the BookLeaf Store, and international channels (Amazon US & UK). New listings go live within 7–10 business days following publication completion.\n\nOur distribution team is reviewing your platform status and will provide direct listing links within 24–48 hours.\n\nWarm regards,\nBookLeaf Distribution Desk`;
    }
  } else if (category === TicketCategory.BOOK_STATUS_PRODUCTION) {
    // Sub-intent: Typesetting / Cover Design milestone inquiries
    const currentStage = book?.status || 'Production';

    draftResponse = `Dear ${authorFirstName},\n\nThank you for checking in on the production progress of your book${bookTitleSnippet}.\n\nYour title is currently in the following active stage: "${currentStage}".\n\nOur standard production roadmap moves through:\nManuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.\n\n${
      query.includes('typesetting')
        ? 'Typesetting typically takes 7–10 business days. The team is currently styling the interior layout and pagination. You can expect your initial digital proof within 3 to 5 business days for your review.'
        : query.includes('cover')
        ? 'Our design team is crafting your custom cover concept. Delays at this stage typically occur during author review rounds. We will send the latest draft for your approval shortly.'
        : 'Delays typically occur during cover approvals and author proofreading rounds. We are checking with your assigned project editor and will provide a concrete milestone delivery date within 24 hours.'
    }\n\nWarm regards,\nBookLeaf Production Team`;
  } else {
    // General Inquiry
    draftResponse = `Dear ${authorFirstName},\n\nThank you for reaching out to BookLeaf Author Support${bookTitleSnippet}.\n\nWe have received your query regarding "${subject}". Our author relations team is reviewing your account and will provide complete assistance within 24 hours.\n\nIf you have any supporting documents, platform links, or screenshots, please feel free to attach them to this ticket thread.\n\nWarm regards,\nBookLeaf Support Team`;
  }

  return {
    category,
    priority,
    priorityReasoning,
    draftResponse,
    confidence: 0.92,
    engineUsed: 'heuristic-fallback',
  };
}
