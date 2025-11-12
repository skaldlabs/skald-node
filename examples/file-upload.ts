/**
 * File Upload Example
 *
 * This example demonstrates how to upload a file (PDF, DOC, DOCX, or PPTX)
 * to Skald and monitor its processing status.
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

async function uploadFile() {
  try {
    // Read the file from disk
    const filePath = path.join(__dirname, 'localcurrency-snippet.pdf');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      console.log('Please place a sample PDF in the examples directory');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);

    console.log(`Uploading file: ${filename}`);
    console.log(`File size: ${fileBuffer.length} bytes`);

    // Upload the file
    const result = await skald.createMemoFromFile({
      file: fileBuffer,
      filename: filename,
      title: 'Overcoming Economic Stagnation with Programmable Money (Snippet)',
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
      tags: ['example', 'upload', 'pdf'],
      source: 'local-filesystem',
      reference_id: `upload-example-${Date.now()}` // Optional: your own reference ID
    });

    console.log('✓ File uploaded successfully!');
    console.log(`Memo UUID: ${result.memo_uuid}`);

    return result.memo_uuid;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  uploadFile()
    .then((memoUuid) => {
      if (memoUuid) {
        console.log('\nNext steps:');
        console.log('1. Use the memo UUID to check processing status');
        console.log('2. Run: node examples/check-status.ts ' + memoUuid);
      }
    })
    .catch((error) => {
      console.error('Failed to upload file:', error);
      process.exit(1);
    });
}

export { uploadFile };
