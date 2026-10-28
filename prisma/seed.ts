import { PrismaClient, Role, TicketCategory, Priority, TicketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BookLeaf database seeding...');

  // 1. Seed Admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bookleaf.com' },
    update: {},
    create: {
      id: 'ADMIN001',
      name: 'BookLeaf Ops Lead',
      email: 'admin@bookleaf.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      city: 'Delhi',
      phone: '+91-11-4000-8000',
      joinedDate: new Date('2022-01-01'),
    },
  });
  console.log(`✓ Admin user verified: ${admin.email}`);

  // 2. Load sample data
  const sampleDataPath = path.join(process.cwd(), 'bookleaf_sample_data.json');
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data file not found at ${sampleDataPath}`);
  }

  const rawData = fs.readFileSync(sampleDataPath, 'utf-8');
  const sampleData = JSON.parse(rawData);

  const defaultAuthorPassword = await bcrypt.hash('author123', 10);

  // 3. Seed Authors and Books
  for (const authorData of sampleData.authors) {
    const author = await prisma.user.upsert({
      where: { email: authorData.email },
      update: {
        name: authorData.name,
        phone: authorData.phone,
        city: authorData.city,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : null,
      },
      create: {
        id: authorData.author_id,
        name: authorData.name,
        email: authorData.email,
        passwordHash: defaultAuthorPassword,
        role: Role.AUTHOR,
        phone: authorData.phone,
        city: authorData.city,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : null,
      },
    });

    console.log(`✓ Seeded Author: ${author.name} (${author.email})`);

    for (const bookData of authorData.books) {
      await prisma.book.upsert({
        where: { id: bookData.book_id },
        update: {
          title: bookData.title,
          isbn: bookData.isbn,
          genre: bookData.genre,
          publicationDate: bookData.publication_date ? new Date(bookData.publication_date) : null,
          status: bookData.status,
          mrp: bookData.mrp,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy,
          totalCopiesSold: bookData.total_copies_sold || 0,
          totalRoyaltyEarned: bookData.total_royalty_earned || 0,
          royaltyPaid: bookData.royalty_paid || 0,
          royaltyPending: bookData.royalty_pending || 0,
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : null,
          printPartner: bookData.print_partner,
          availableOnJson: JSON.stringify(bookData.available_on || []),
        },
        create: {
          id: bookData.book_id,
          authorId: author.id,
          title: bookData.title,
          isbn: bookData.isbn,
          genre: bookData.genre,
          publicationDate: bookData.publication_date ? new Date(bookData.publication_date) : null,
          status: bookData.status,
          mrp: bookData.mrp,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy,
          totalCopiesSold: bookData.total_copies_sold || 0,
          totalRoyaltyEarned: bookData.total_royalty_earned || 0,
          royaltyPaid: bookData.royalty_paid || 0,
          royaltyPending: bookData.royalty_pending || 0,
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : null,
          printPartner: bookData.print_partner,
          availableOnJson: JSON.stringify(bookData.available_on || []),
        },
      });
    }
  }

  // 4. Seed realistic starter tickets demonstrating AI classification and knowledge base responses
  const existingTicketsCount = await prisma.ticket.count();
  if (existingTicketsCount === 0) {
    console.log('Seeding initial realistic support tickets...');

    // Ticket 1: Priya Sharma - Royalty query (High priority, Royalty & Payments)
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-1001',
        authorId: 'AUTH001',
        bookId: 'BK001',
        subject: 'Pending royalty balance payout timeline',
        description:
          'I see a pending royalty balance of ₹3,570 on "Whispers of the Ganges". My last payout was on October 15, 2025. Could you please confirm when the remaining ₹3,570 will be credited to my bank account?',
        category: TicketCategory.ROYALTY_PAYMENTS,
        priority: Priority.HIGH,
        priorityReasoning: 'Unpaid royalty inquiry over ₹1,000 threshold with previous payout history.',
        status: TicketStatus.IN_PROGRESS,
        assignedToId: admin.id,
        aiDraft:
          'Dear Priya,\n\nThank you for reaching out to BookLeaf Author Support. We completely understand your query regarding your royalty payout for "Whispers of the Ganges".\n\nBookLeaf calculates and processes royalties on a quarterly cycle, with payments made within 45 days following the close of each calendar quarter. Because your pending balance of ₹3,570 is above our minimum payout threshold of ₹1,000, it is queued for the upcoming quarterly disbursement run.\n\nCould you please confirm if your bank account details on the author dashboard are up to date? Our accounts team is reviewing the payment queue, and we will follow up with an update within 48 hours.\n\nWarm regards,\nBookLeaf Support Team',
        aiDraftGeneratedAt: new Date(),
        aiModelUsed: 'gemini-1.5-flash',
        messages: {
          create: [
            {
              senderId: 'AUTH001',
              senderRole: Role.AUTHOR,
              content:
                'I see a pending royalty balance of ₹3,570 on "Whispers of the Ganges". My last payout was on October 15, 2025. Could you please confirm when the remaining ₹3,570 will be credited to my bank account?',
            },
            {
              senderId: admin.id,
              senderRole: Role.ADMIN,
              isAiAssisted: true,
              content:
                'Dear Priya, thank you for reaching out. Your pending balance of ₹3,570 exceeds our ₹1,000 threshold and is scheduled for the current quarterly cycle. We are verifying the bank transfer batch with our finance team and will confirm the reference ID shortly.',
            },
          ],
        },
        internalNotes: {
          create: [
            {
              adminId: admin.id,
              content: 'Verified finance ledger: Q4 reconciliation in progress. Bank details match HDFC account ending in 4102.',
            },
          ],
        },
      },
    });

    // Ticket 2: Kavita Deshmukh - Production typesetting status (Medium priority, Book Status & Production)
    await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-1002',
        authorId: 'AUTH009',
        bookId: 'BK015',
        subject: 'Typesetting progress for "Raising Roots"',
        description:
          'My book "Raising Roots" has been in Typesetting for about 2 weeks. Could you provide an update on when I will receive the PDF proof for review?',
        category: TicketCategory.BOOK_STATUS_PRODUCTION,
        priority: Priority.MEDIUM,
        priorityReasoning: 'Author inquiring about expected proof delivery timeline during typesetting stage.',
        status: TicketStatus.OPEN,
        aiDraft:
          'Dear Kavita,\n\nThank you for checking in on "Raising Roots". We understand you are eager to see the book take shape!\n\nAccording to our production workflow, the typesetting team is currently finalizing font styling, chapter headers, and pagination. Typical turnaround for typesetting is 7–10 business days before initial interior proof generation. Your typesetter is currently on the final layout check, and you can expect the digital proof in your inbox within 3 to 4 business days for your review.\n\nPlease let us know if you have specific font preferences or dedication page notes we should keep in mind before dispatching the proof.\n\nWarm regards,\nBookLeaf Production Team',
        aiDraftGeneratedAt: new Date(),
        aiModelUsed: 'gemini-1.5-flash',
        messages: {
          create: [
            {
              senderId: 'AUTH009',
              senderRole: Role.AUTHOR,
              content:
                'My book "Raising Roots" has been in Typesetting for about 2 weeks. Could you provide an update on when I will receive the PDF proof for review?',
            },
          ],
        },
      },
    });

    // Ticket 3: Farhan Sheikh - Defective print copies (Critical priority, Printing & Quality)
    await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-1003',
        authorId: 'AUTH008',
        bookId: 'BK014',
        subject: 'Author copies received with misaligned pages & ink smudges',
        description:
          'I received my package of 10 author copies of "Ghazal of the Forgotten" today. Unfortunately, pages 45–60 have ink smearing and the binding on 3 copies is noticeably misaligned. Please help!',
        category: TicketCategory.PRINTING_QUALITY,
        priority: Priority.CRITICAL,
        priorityReasoning: 'Defective physical print copies with misprint/binding issues require immediate verification and reprint.',
        status: TicketStatus.OPEN,
        aiDraft:
          'Dear Farhan,\n\nWe sincerely apologise for this experience. We take tremendous pride in the quality of every BookLeaf volume, and receiving defective copies is certainly not the standard you or your readers deserve.\n\nUnder BookLeaf’s quality assurance policy, we arrange a free reprint for defective copies upon photo verification. Could you please reply with 2–3 photos highlighting the ink smears and the binding misalignment? Once verified by our print operations team, we will expedite a fresh batch through our print partner within our standard 5–7 business days turnaround.\n\nWe will personally oversee this reprint order to ensure immaculate finish.\n\nWarm regards,\nBookLeaf Quality Team',
        aiDraftGeneratedAt: new Date(),
        aiModelUsed: 'gemini-1.5-flash',
        messages: {
          create: [
            {
              senderId: 'AUTH008',
              senderRole: Role.AUTHOR,
              content:
                'I received my package of 10 author copies of "Ghazal of the Forgotten" today. Unfortunately, pages 45–60 have ink smearing and the binding on 3 copies is noticeably misaligned. Please help!',
            },
          ],
        },
      },
    });

    console.log(`✓ Seeded starter tickets`);
  }

  console.log('✅ BookLeaf database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
