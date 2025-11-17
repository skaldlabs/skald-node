/**
 * Upload File and Wait for Processing Example
 *
 * This example demonstrates a complete workflow:
 * 1. Upload a file
 * 2. Poll the status until processing completes
 * 3. Retrieve the processed memo
 *
 * Prerequisites:
 * - Set SKALD_API_KEY environment variable
 * - Have a file to upload (PDF, DOC, DOCX, or PPTX)
 */

import { Skald } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

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

async function uploadAndWaitForProcessing() {
  try {
    // Step 1: Upload the file
    const filePath = path.join(__dirname, 'localcurrency-snippet.pdf');

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      console.log('Please place a sample PDF in the examples directory');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);

    console.log('Step 1: Uploading file...');
    const uploadResult = await skald.createMemoFromFile({
      file: fileBuffer,
      filename: filename,
      metadata: {
        uploadedAt: new Date().toISOString(),
        type: 'example-document'
      },
      tags: ['example', 'automated-workflow'],
      source: 'example-script'
    });

    console.log(`✓ File uploaded successfully!`);
    console.log(`Memo UUID: ${uploadResult.memo_uuid}`);

    // Step 2: Poll the status until processing completes
    console.log('\nStep 2: Waiting for processing to complete...');

    let attempts = 0;
    const maxAttempts = 30; // Maximum 1 minute (30 * 2 seconds)
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      attempts++;

      const status = await skald.checkMemoStatus({ memoId: uploadResult.memo_uuid });

      if (status.status === 'processed') {
        console.log('✓ Processing complete!');

        // Step 3: Retrieve the processed memo
        console.log('\nStep 3: Retrieving processed memo...');
        const memo = await skald.getMemo({ memoId: uploadResult.memo_uuid });

        console.log('\n=== Processed Memo ===');
        console.log(`Title: ${memo.title}`);
        console.log(`Summary: ${memo.summary}`);
        console.log(`Content Length: ${memo.content_length} characters`);
        console.log(`Tags: ${memo.tags.map(t => t.tag).join(', ')}`);
        console.log(`Chunks: ${memo.chunks.length}`);

        return memo;
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

    throw new Error('Processing timeout: exceeded maximum wait time');
  } catch (error) {
    console.error('\nError:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  uploadAndWaitForProcessing()
    .then(() => {
      console.log('\n✓ Complete workflow finished successfully!');
    })
    .catch((error) => {
      console.error('\n✗ Workflow failed:', error);
      process.exit(1);
    });
}

export { uploadAndWaitForProcessing };
