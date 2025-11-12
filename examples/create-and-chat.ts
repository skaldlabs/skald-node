/**
 * Create Memo, Wait, and Chat Example
 *
 * This example demonstrates a complete workflow:
 * 1. Create a memo with text content
 * 2. Poll the status until processing completes
 * 3. Ask questions about the memo using the chat API
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

// Helper function to wait for a specified time
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createMemoAndChat() {
  try {
    // Step 1: Create a memo with text content
    console.log('Step 1: Creating memo...');
    
    const memoContent = `
# Team Meeting Notes - Q4 Planning

## Date: November 12, 2025

## Attendees
- Sarah Chen (Product Manager)
- Marcus Rodriguez (Engineering Lead)
- Julia Kim (Design Lead)
- Ahmed Hassan (Marketing Director)

## Key Discussion Points

### Product Roadmap
- Launch of new AI-powered search feature planned for January 2026
- Mobile app redesign to begin in December
- Integration with third-party tools (Slack, Microsoft Teams) scheduled for Q1 2026

### Engineering Updates
- Migration to microservices architecture 60% complete
- Performance improvements reduced page load times by 40%
- New deployment pipeline reduces release time from 2 hours to 20 minutes

### Design Initiatives
- User research showed 85% satisfaction with current interface
- Accessibility improvements needed for WCAG 2.1 AA compliance
- Dark mode feature requested by 67% of surveyed users

### Marketing Strategy
- Q3 user growth exceeded targets by 23%
- Focus on enterprise customers for Q4
- Partnership with TechCrunch for product launch coverage
- Budget allocation: 40% digital ads, 30% content marketing, 30% events

## Action Items
1. Sarah to finalize product specifications by November 20
2. Marcus to hire 2 additional backend engineers
3. Julia to complete accessibility audit by end of month
4. Ahmed to schedule partnership meetings with potential clients

## Next Meeting
December 10, 2025 at 2:00 PM
    `.trim();

    const createResult = await skald.createMemo({
      title: 'Q4 Planning Meeting Notes',
      content: memoContent,
      metadata: {
        meetingDate: '2025-11-12',
        department: 'Product',
        confidentiality: 'internal'
      },
      tags: ['meeting-notes', 'Q4-2025', 'planning'],
      source: 'example-script'
    });

    console.log(`✓ Memo created successfully!`);
    console.log(`Memo UUID: ${createResult.memo_uuid}`);

    // Step 2: Poll the status until processing completes
    console.log('\nStep 2: Waiting for processing to complete...');

    let attempts = 0;
    const maxAttempts = 30; // Maximum 1 minute (30 * 2 seconds)
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      attempts++;

      const status = await skald.checkMemoStatus(createResult.memo_uuid);

      if (status.status === 'processed') {
        console.log('✓ Processing complete!');
        break;
      } else if (status.status === 'error') {
        console.error('✗ Processing failed');
        if (status.error_reason) {
          console.error(`Error reason: ${status.error_reason}`);
        }
        throw new Error('Processing failed');
      } else {
        // Still processing
        process.stdout.write(`⏳ Processing... (attempt ${attempts}/${maxAttempts})\r`);
        await sleep(pollInterval);
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Processing timeout: exceeded maximum wait time');
    }

    // Step 3: Retrieve the processed memo to see details
    console.log('\nStep 3: Retrieving processed memo...');
    const memo = await skald.getMemo(createResult.memo_uuid);

    console.log('\n=== Processed Memo ===');
    console.log(`Title: ${memo.title}`);
    console.log(`Summary: ${memo.summary}`);
    console.log(`Content Length: ${memo.content_length} characters`);
    console.log(`Tags: ${memo.tags.map(t => t.tag).join(', ')}`);
    console.log(`Chunks: ${memo.chunks.length}`);

    // Step 4: Ask questions about the memo
    console.log('\n=== Step 4: Asking Questions About the Memo ===\n');

    // Question 1: Summarize key points
    console.log('Q1: What were the main topics discussed in this meeting?');
    const answer1 = await skald.chat({
      query: 'What were the main topics discussed in this meeting?'
    });
    console.log(`A1: ${answer1.response}\n`);

    // Question 2: Specific information
    console.log('Q2: Who needs to hire additional engineers and how many?');
    const answer2 = await skald.chat({
      query: 'Who needs to hire additional engineers and how many?'
    });
    console.log(`A2: ${answer2.response}\n`);

    // Question 3: Timeline information
    console.log('Q3: What is the timeline for the mobile app redesign?');
    const answer3 = await skald.chat({
      query: 'What is the timeline for the mobile app redesign?'
    });
    console.log(`A3: ${answer3.response}\n`);

    // Question 4: Metrics and numbers
    console.log('Q4: What were the performance improvements mentioned?');
    const answer4 = await skald.chat({
      query: 'What were the performance improvements mentioned?'
    });
    console.log(`A4: ${answer4.response}\n`);

    return {
      memo,
      answers: [answer1, answer2, answer3, answer4]
    };
  } catch (error) {
    console.error('\nError:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  createMemoAndChat()
    .then(() => {
      console.log('\n✓ Complete workflow finished successfully!');
    })
    .catch((error) => {
      console.error('\n✗ Workflow failed:', error);
      process.exit(1);
    });
}

export { createMemoAndChat };

