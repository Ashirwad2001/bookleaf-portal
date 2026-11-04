/**
 * Programmatic Seeding Script for Bubble Data API
 * 
 * Usage:
 *   export BUBBLE_APP_NAME="your-app-name"
 *   export BUBBLE_API_TOKEN="your-bubble-api-key"
 *   node seed-bubble-api.js
 */

const fs = require('fs');
const path = require('path');

const APP_NAME = process.env.BUBBLE_APP_NAME || 'bookleaf-royalty';
const API_TOKEN = process.env.BUBBLE_API_TOKEN || '';
const BASE_URL = `https://${APP_NAME}.bubbleapps.io/version-test/api/1.1/obj`;

const rawData = fs.readFileSync(path.join(__dirname, '../../bookleaf_sample_data.json'), 'utf-8');
const data = JSON.parse(rawData);

async function createRecord(typeName, payload) {
  if (!API_TOKEN) {
    console.warn(`[DRY-RUN] Would POST to ${BASE_URL}/${typeName}:`, JSON.stringify(payload));
    return { id: `mock_${Math.random().toString(36).substring(7)}` };
  }

  const res = await fetch(`${BASE_URL}/${typeName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create ${typeName}: ${res.status} ${errText}`);
  }

  const result = await res.json();
  return result;
}

async function seed() {
  console.log(`Starting Bubble Data API seed against ${APP_NAME}...`);
  if (!API_TOKEN) {
    console.log('NOTICE: BUBBLE_API_TOKEN not set. Running in DRY-RUN mode. Set environment variables to execute live.');
  }

  const authorIdMap = {};

  // 1. Seed Authors
  for (const author of data.authors) {
    console.log(`Seeding Author: ${author.name}...`);
    const res = await createRecord('author', {
      author_id: author.author_id,
      name: author.name,
      email: author.email,
      phone: author.phone,
      city: author.city,
      joined_date: author.joined_date
    });
    authorIdMap[author.author_id] = res.id;
  }

  // 2. Seed Books
  for (const author of data.authors) {
    for (const book of author.books) {
      console.log(`Seeding Book: ${book.title}...`);
      await createRecord('book', {
        book_id: book.book_id,
        author: authorIdMap[author.author_id] || author.author_id,
        author_id_str: author.author_id,
        title: book.title,
        isbn: book.isbn,
        genre: book.genre,
        publication_date: book.publication_date,
        status: book.status,
        mrp: book.mrp,
        author_royalty_per_copy: book.author_royalty_per_copy,
        total_copies_sold: book.total_copies_sold || 0,
        total_royalty_earned: book.total_royalty_earned || 0,
        royalty_paid: book.royalty_paid || 0,
        royalty_pending: book.royalty_pending || 0,
        last_royalty_payout_date: book.last_royalty_payout_date,
        print_partner: book.print_partner,
        available_on_raw: (book.available_on || []).join(', ')
      });
    }
  }

  console.log('Seeding complete! 10 Authors and 18 Books processed.');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});

