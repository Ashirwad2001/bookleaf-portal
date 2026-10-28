import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';

describe('Integration Tests: Prisma ORM & Database Schema', () => {
  after(async () => {
    await prisma.$disconnect();
  });

  test('Database contains seeded authors and admin', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@bookleaf.com' },
    });

    assert.ok(admin, 'Admin account must exist');
    assert.equal(admin?.role, 'ADMIN');

    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR' },
    });

    assert.ok(authors.length >= 10, 'Must have at least 10 seeded authors');
  });

  test('Books are properly linked to authors with royalty records', async () => {
    const priya = await prisma.user.findUnique({
      where: { email: 'priya.sharma@email.com' },
      include: { books: true },
    });

    assert.ok(priya, 'Priya Sharma must exist');
    assert.ok(priya?.books.length >= 1, 'Priya must have linked books');

    const whispers = priya?.books.find((b) => b.title === 'Whispers of the Ganges');
    assert.ok(whispers, 'Whispers of the Ganges must exist');
    assert.equal(whispers?.status, 'Published & Live');
    assert.equal(whispers?.totalCopiesSold, 342);
    assert.equal(whispers?.royaltyPending, 3570);
  });

  test('Tickets have relational cascade with messages and author', async () => {
    const tickets = await prisma.ticket.findMany({
      include: {
        author: true,
        messages: true,
        book: true,
      },
      take: 5,
    });

    assert.ok(tickets.length > 0, 'Database must have tickets');
    const firstTicket = tickets[0];
    assert.ok(firstTicket.author, 'Ticket must link to author');
    assert.ok(firstTicket.messages.length >= 1, 'Ticket must contain initial message');
    assert.ok(firstTicket.category, 'Ticket must have category');
    assert.ok(firstTicket.priority, 'Ticket must have priority');
  });
});
