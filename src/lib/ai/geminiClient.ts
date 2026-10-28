import { GoogleGenerativeAI } from '@google/generative-ai';
import { TicketCategory, Priority } from '@prisma/client';
import { BOOKLEAF_KNOWLEDGE_BASE, COMMUNICATION_TONE_SYSTEM_PROMPT } from './knowledgeBase';
import { AuthorContext, BookContext, AIAnalysisResult, analyzeWithFallbackEngine } from './fallbackEngine';

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Builds token-conscious, relevant Knowledge Base excerpts.
 * Avoids dumping unnecessary context tokens to optimize cost and latency.
 */
function buildRelevantContext(subject: string, description: string): string {
  const combined = `${subject} ${description}`.toLowerCase();
  const relevantSnippets: string[] = [];

  if (combined.includes('royalty') || combined.includes('payout') || combined.includes('profit') || combined.includes('money') || combined.includes('sold')) {
    relevantSnippets.push(`[ROYALTY POLICY]:\n${BOOKLEAF_KNOWLEDGE_BASE.royalty.policies.join('\n')}`);
  }
  if (combined.includes('isbn') || combined.includes('metadata') || combined.includes('imprint') || combined.includes('barcode')) {
    relevantSnippets.push(`[ISBN & METADATA POLICY]:\n${BOOKLEAF_KNOWLEDGE_BASE.isbn.policies.join('\n')}`);
  }
  if (combined.includes('print') || combined.includes('quality') || combined.includes('defect') || combined.includes('binding') || combined.includes('page') || combined.includes('smudge')) {
    relevantSnippets.push(`[PRINTING & QUALITY GUARANTEE]:\n${BOOKLEAF_KNOWLEDGE_BASE.printing.policies.join('\n')}`);
  }
  if (combined.includes('unavailable') || combined.includes('stock') || combined.includes('amazon') || combined.includes('flipkart') || combined.includes('distribution')) {
    relevantSnippets.push(`[DISTRIBUTION & PLATFORM SYNC]:\n${BOOKLEAF_KNOWLEDGE_BASE.distribution.policies.join('\n')}`);
  }
  if (combined.includes('typesetting') || combined.includes('cover') || combined.includes('proof') || combined.includes('stage') || combined.includes('status')) {
    relevantSnippets.push(`[PRODUCTION STAGES & TURNAROUND]:\n${BOOKLEAF_KNOWLEDGE_BASE.production.policies.join('\n')}`);
  }

  // Fallback to essential summary if no specific keyword matched
  if (relevantSnippets.length === 0) {
    relevantSnippets.push(
      `[BOOKLEAF ESSENTIALS]:\n80/20 royalty split. Quarterly payouts within 45 days. Minimum ₹1,000 threshold. In-house print & Repro/Epitome turnaround 5-7 days. Amazon/Flipkart distribution. Free reprints on verified quality defects.`
    );
  }

  return relevantSnippets.join('\n\n');
}

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];

/**
 * Analyzes a support ticket with Google Gemini API, with automatic fallback on failure.
 */
export async function analyzeTicketWithAI(
  subject: string,
  description: string,
  author: AuthorContext,
  book?: BookContext | null
): Promise<AIAnalysisResult> {
  const activeApiKey = (process.env.GEMINI_API_KEY || '').trim();
  const configuredModel = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // If no API key configured, use intelligent fallback engine directly
  if (!activeApiKey) {
    console.log('[AI Service] No GEMINI_API_KEY detected. Using intelligent local Knowledge Base engine.');
    return analyzeWithFallbackEngine(subject, description, author, book);
  }

  const client = new GoogleGenerativeAI(activeApiKey);
  const relevantKB = buildRelevantContext(subject, description);

  const prompt = `
${COMMUNICATION_TONE_SYSTEM_PROMPT}

KNOWLEDGE BASE CONTEXT:
${relevantKB}

AUTHOR INFORMATION:
- Name: ${author.name}
- Email: ${author.email}
${
  book
    ? `ASSOCIATED BOOK DETAILS:
- Title: ${book.title}
- Status: ${book.status}
- ISBN: ${book.isbn || 'Pending'}
- MRP: ₹${book.mrp || 'N/A'}
- Copies Sold: ${book.totalCopiesSold || 0}
- Total Royalty Earned: ₹${book.totalRoyaltyEarned || 0}
- Royalty Paid: ₹${book.royaltyPaid || 0}
- Royalty Pending: ₹${book.royaltyPending || 0}
- Last Payout: ${book.lastRoyaltyPayoutDate ? new Date(book.lastRoyaltyPayoutDate).toISOString().split('T')[0] : 'None'}
- Print Partner: ${book.printPartner || 'In-House'}`
    : 'ASSOCIATED BOOK: General / Account Level Inquiry'
}

TICKET TO ANALYZE:
- Subject: "${subject}"
- Query Description: "${description}"

TASKS:
1. Classify into EXACTLY one category:
   - "ROYALTY_PAYMENTS" (Royalty & Payments)
   - "ISBN_METADATA" (ISBN & Metadata Issues)
   - "PRINTING_QUALITY" (Printing & Quality)
   - "DISTRIBUTION_AVAILABILITY" (Distribution & Availability)
   - "BOOK_STATUS_PRODUCTION" (Book Status & Production Updates)
   - "GENERAL_INQUIRY" (General Inquiry)

2. Determine priority score: "CRITICAL", "HIGH", "MEDIUM", or "LOW" based on business impact, author distress, or policy severity. Include 1 concise sentence of reasoning.

3. Draft a complete, empathetic, professional response grounded in the BookLeaf knowledge base and book data above. Sound like an authentic BookLeaf support representative, not generic AI fluff.

Return valid JSON adhering strictly to this format:
{
  "category": "ROYALTY_PAYMENTS" | "ISBN_METADATA" | "PRINTING_QUALITY" | "DISTRIBUTION_AVAILABILITY" | "BOOK_STATUS_PRODUCTION" | "GENERAL_INQUIRY",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "priorityReasoning": "1 sentence explanation of why this priority was assigned",
  "draftResponse": "Complete draft text ready for admin review and author dispatch"
}
`;

  const modelsToTry = [configuredModel, ...FALLBACK_MODELS.filter((m) => m !== configuredModel)];

  for (const modelToTest of modelsToTry) {
    try {
      const model = client.getGenerativeModel({
        model: modelToTest,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const response = await model.generateContent(prompt);
      let responseText = response.response.text().trim();

      // Strip markdown code fences if present
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(responseText);

      const validCategories: Record<string, TicketCategory> = {
        ROYALTY_PAYMENTS: TicketCategory.ROYALTY_PAYMENTS,
        ISBN_METADATA: TicketCategory.ISBN_METADATA,
        PRINTING_QUALITY: TicketCategory.PRINTING_QUALITY,
        DISTRIBUTION_AVAILABILITY: TicketCategory.DISTRIBUTION_AVAILABILITY,
        BOOK_STATUS_PRODUCTION: TicketCategory.BOOK_STATUS_PRODUCTION,
        GENERAL_INQUIRY: TicketCategory.GENERAL_INQUIRY,
      };

      const validPriorities: Record<string, Priority> = {
        CRITICAL: Priority.CRITICAL,
        HIGH: Priority.HIGH,
        MEDIUM: Priority.MEDIUM,
        LOW: Priority.LOW,
      };

      return {
        category: validCategories[parsed.category] || TicketCategory.GENERAL_INQUIRY,
        priority: validPriorities[parsed.priority] || Priority.MEDIUM,
        priorityReasoning: parsed.priorityReasoning || 'AI priority assessment based on ticket urgency and policy impact.',
        draftResponse: parsed.draftResponse,
        confidence: 0.95,
        engineUsed: 'gemini',
      };
    } catch (error: any) {
      console.warn(`[AI Service] Model ${modelToTest} failed: ${error?.message || error}. Trying next model...`);
    }
  }

  console.error('[AI Service Warning] All Gemini model attempts failed. Gracefully degrading to heuristic engine.');
  return analyzeWithFallbackEngine(subject, description, author, book);
}
