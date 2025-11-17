/**
 * Check Memo Status Example
 *
 * This example demonstrates how to check the processing status of a memo,
 * which is especially useful after uploading a file.
 *
 * Prerequisites:
 * - Set SKALD_API_KEY environment variable
 * - Have a memo UUID (from file upload or memo creation)
 *
 * Usage:
 * node examples/check-status.ts <memo-uuid>
 */

import { Skald } from '../src/index';

const apiKey = process.env.SKALD_API_KEY;
if (!apiKey) {
  console.error('Error: SKALD_API_KEY environment variable not set');
  process.exit(1);
}

const skald = new Skald(apiKey);

async function checkStatus(memoUuid: string) {
  try {
    console.log(`Checking status for memo: ${memoUuid}`);

    const status = await skald.checkMemoStatus({ memoId: memoUuid });

    console.log(`Status: ${status.status}`);

    switch (status.status) {
      case 'processing':
        console.log('⏳ The memo is still being processed...');
        break;
      case 'processed':
        console.log('✓ The memo has been processed successfully!');
        console.log('You can now search, chat, and retrieve this memo.');
        break;
      case 'error':
        console.log('✗ An error occurred during processing');
        if (status.error_reason) {
          console.log(`Error reason: ${status.error_reason}`);
        }
        break;
    }

    return status;
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  const memoUuid = process.argv[2];

  if (!memoUuid) {
    console.error('Usage: node examples/check-status.ts <memo-uuid>');
    process.exit(1);
  }

  checkStatus(memoUuid)
    .then(() => {
      console.log('\nDone!');
    })
    .catch((error) => {
      console.error('Failed to check status:', error);
      process.exit(1);
    });
}

export { checkStatus };
