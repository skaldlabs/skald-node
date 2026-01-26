/**
 * Scopes Example
 *
 * This example demonstrates how to use scopes for access control:
 * 1. Create memos with different scopes (department, team, access level)
 * 2. Filter search results by scope
 * 3. Filter chat context by scope
 *
 * Scopes are key-value pairs that can be used to restrict which memos
 * are included in search and chat operations.
 *
 * Prerequisites:
 * - Set SKALD_API_KEY environment variable
 */

import { Skald } from '../src/index';

const apiKey = process.env.SKALD_API_KEY;
if (!apiKey) {
  console.error('Error: SKALD_API_KEY environment variable not set');
  process.exit(1);
}

const skald = new Skald(apiKey);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForProcessing(memoUuid: string): Promise<void> {
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;
    const status = await skald.checkMemoStatus({ memoId: memoUuid });

    if (status.status === 'processed') {
      return;
    } else if (status.status === 'error') {
      throw new Error(`Processing failed: ${status.error_reason}`);
    }

    await sleep(2000);
  }

  throw new Error('Processing timeout');
}

async function scopesExample() {
  try {
    console.log('=== Scopes Example ===\n');

    // Step 1: Create memos with different scopes
    console.log('Step 1: Creating memos with different scopes...\n');

    // Engineering department memo
    const engineeringMemo = await skald.createMemo({
      title: 'Backend API Guidelines',
      content: `
# Backend API Development Guidelines

## Authentication
All API endpoints must use JWT tokens for authentication.
Tokens expire after 24 hours and must be refreshed.

## Rate Limiting
- Public endpoints: 100 requests per minute
- Authenticated endpoints: 1000 requests per minute

## Error Handling
Always return structured error responses with error codes.
      `.trim(),
      scopes: {
        department: 'engineering',
        team: 'backend',
        access_level: 'internal',
      },
      tags: ['api', 'guidelines'],
    });
    console.log(`✓ Created engineering memo: ${engineeringMemo.memo_uuid}`);

    // Marketing department memo
    const marketingMemo = await skald.createMemo({
      title: 'Brand Guidelines 2024',
      content: `
# Brand Guidelines

## Logo Usage
- Primary logo should have 20px minimum padding
- Never distort or rotate the logo
- Use approved color variations only

## Brand Colors
- Primary: #2563EB (Blue)
- Secondary: #10B981 (Green)
- Accent: #F59E0B (Orange)

## Typography
- Headlines: Inter Bold
- Body: Inter Regular
      `.trim(),
      scopes: {
        department: 'marketing',
        access_level: 'public',
      },
      tags: ['brand', 'guidelines'],
    });
    console.log(`✓ Created marketing memo: ${marketingMemo.memo_uuid}`);

    // HR department memo (confidential)
    const hrMemo = await skald.createMemo({
      title: 'Salary Bands 2024',
      content: `
# Salary Bands - Confidential

## Engineering
- Junior: $80,000 - $100,000
- Mid-level: $100,000 - $140,000
- Senior: $140,000 - $180,000
- Staff: $180,000 - $220,000

## Marketing
- Coordinator: $50,000 - $70,000
- Manager: $80,000 - $110,000
- Director: $120,000 - $160,000
      `.trim(),
      scopes: {
        department: 'hr',
        access_level: 'confidential',
      },
      tags: ['salary', 'compensation'],
    });
    console.log(`✓ Created HR memo: ${hrMemo.memo_uuid}`);

    // Wait for all memos to be processed
    console.log('\nWaiting for processing...');
    await Promise.all([
      waitForProcessing(engineeringMemo.memo_uuid),
      waitForProcessing(marketingMemo.memo_uuid),
      waitForProcessing(hrMemo.memo_uuid),
    ]);
    console.log('✓ All memos processed!\n');

    // Step 2: Search with scope filtering
    console.log('Step 2: Searching with scope filters...\n');

    // Search only engineering department (using scopes shorthand)
    console.log('Searching for "guidelines" in engineering department only:');
    const engineeringResults = await skald.search({
      query: 'guidelines',
      scopes: { department: 'engineering' },
    });
    console.log(`Found ${engineeringResults.results.length} result(s)`);
    engineeringResults.results.forEach(r => {
      console.log(`  - ${r.memo_title}`);
    });

    // Search only public content
    console.log('\nSearching for "guidelines" with public access only:');
    const publicResults = await skald.search({
      query: 'guidelines',
      scopes: { access_level: 'public' },
    });
    console.log(`Found ${publicResults.results.length} result(s)`);
    publicResults.results.forEach(r => {
      console.log(`  - ${r.memo_title}`);
    });

    // Step 3: Chat with scope filtering (using scopes shorthand)
    console.log('\n\nStep 3: Chatting with scope filters...\n');

    // Ask about salary (should only see HR content if scoped correctly)
    console.log('Q: What are the salary ranges? (filtering to HR department)');
    const hrAnswer = await skald.chat({
      query: 'What are the salary ranges for engineers?',
      scopes: { department: 'hr' },
    });
    console.log(`A: ${hrAnswer.response}\n`);

    // Ask about API guidelines (filtering to engineering)
    console.log('Q: What is the rate limit? (filtering to engineering department)');
    const engineeringAnswer = await skald.chat({
      query: 'What is the rate limit for API endpoints?',
      scopes: { department: 'hr' },
    });
    console.log(`A: ${engineeringAnswer.response}\n`);

    // Multiple scope filters
    console.log('Q: What are the guidelines? (filtering to engineering + backend team)');
    const backendAnswer = await skald.chat({
      query: 'Summarize the guidelines',
      scopes: { department: 'engineering', team: 'backend' },
    });
    console.log(`A: ${backendAnswer.response}\n`);

    // Step 4: Cleanup - delete test memos
    console.log('Step 4: Cleaning up test memos...');
    await skald.deleteMemo({ memoId: engineeringMemo.memo_uuid });
    await skald.deleteMemo({ memoId: marketingMemo.memo_uuid });
    await skald.deleteMemo({ memoId: hrMemo.memo_uuid });
    console.log('✓ Test memos deleted\n');

    console.log('=== Scopes Example Complete ===');
  } catch (error) {
    console.error('\nError:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  scopesExample()
    .then(() => {
      console.log('\n✓ Example finished successfully!');
    })
    .catch((error) => {
      console.error('\n✗ Example failed:', error);
      process.exit(1);
    });
}

export { scopesExample };
