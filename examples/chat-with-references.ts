/**
 * Chat with References Example
 *
 * This example demonstrates how to use the references feature in the Skald SDK.
 * When enabled, the chat API returns citation markers (e.g., [[1]], [[2]]) in the
 * response along with a references object that maps these markers to the source memos.
 *
 * This is useful for:
 * - Tracking which memos contributed to the answer
 * - Providing source attribution in your application
 * - Building trust with users by showing information sources
 * - Linking back to original documents
 *
 * Prerequisites:
 * - Set SKALD_API_KEY environment variable
 * - Have some memos already created in your project
 *
 * Usage:
 * npx tsx examples/chat-with-references.ts
 */

import { Skald } from '../src/index';

const apiKey = process.env.SKALD_API_KEY;
if (!apiKey) {
  console.error('Error: SKALD_API_KEY environment variable not set');
  process.exit(1);
}

const skald = new Skald(apiKey);

async function chatWithReferences() {
  try {
    console.log('=== Chat with References Example ===\n');

    // Example 1: Basic chat with references enabled
    console.log('Example 1: Basic Chat with References\n');
    console.log('Query: "What are the key features of our product?"\n');

    const response = await skald.chat({
      query: 'What are the key features of our product?',
      rag_config: {
        references: {
          enabled: true,
        },
      },
    });

    console.log('Response:', response.response);
    console.log();

    // Display references if available
    if (response.references && Object.keys(response.references).length > 0) {
      console.log('Sources:');
      for (const [refNum, refData] of Object.entries(response.references)) {
        console.log(`  [${refNum}] ${refData.memo_title}`);
        console.log(`      UUID: ${refData.memo_uuid}`);
      }
    } else {
      console.log('No references found in the response.');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Example 2: Streaming chat with references
    console.log('Example 2: Streaming Chat with References\n');
    console.log('Query: "Summarize the latest meeting notes"\n');
    console.log('Streaming response:');

    let fullResponse = '';
    let chatReferences: any = null;
    let chatId: string | undefined;

    for await (const event of skald.streamedChat({
      query: 'Summarize the latest meeting notes',
      rag_config: {
        references: {
          enabled: true,
        },
      },
    })) {
      if (event.type === 'token') {
        process.stdout.write(event.content || '');
        fullResponse += event.content || '';
      } else if (event.type === 'references') {
        // References arrive as a JSON string in the content
        chatReferences = JSON.parse(event.content || '{}');
      } else if (event.type === 'done') {
        chatId = event.chat_id;
      }
    }

    console.log('\n');

    if (chatReferences && Object.keys(chatReferences).length > 0) {
      console.log('\nSources:');
      for (const [refNum, refData] of Object.entries(chatReferences)) {
        const ref = refData as { memo_uuid: string; memo_title: string };
        console.log(`  [${refNum}] ${ref.memo_title}`);
        console.log(`      UUID: ${ref.memo_uuid}`);
      }
    }

    if (chatId) {
      console.log(`\nChat ID: ${chatId}`);
      console.log('(You can use this chat_id to continue the conversation with context)');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Example 3: Using references to retrieve full memo content
    console.log('Example 3: Retrieving Full Memo from Reference\n');

    if (response.references && Object.keys(response.references).length > 0) {
      // Get the first reference
      const firstRef = Object.values(response.references)[0];
      console.log(`Retrieving full content for: ${firstRef.memo_title}\n`);

      const memo = await skald.getMemo({ memoId: firstRef.memo_uuid });

      console.log('Memo Details:');
      console.log(`  Title: ${memo.title}`);
      console.log(`  Summary: ${memo.summary}`);
      console.log(`  Content Length: ${memo.content_length} characters`);
      console.log(`  Tags: ${memo.tags.map(t => t.tag).join(', ')}`);
      console.log(`  Source: ${memo.source || 'N/A'}`);
      console.log(`  Created: ${memo.created_at}`);
      console.log();
      console.log('Content Preview (first 500 chars):');
      console.log(memo.content.substring(0, 500) + '...');
    } else {
      console.log('No references available to demonstrate memo retrieval.');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    return {
      regularChat: response,
      streamingReferences: chatReferences,
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  chatWithReferences()
    .then(() => {
      console.log('\n✓ References example completed successfully!');
    })
    .catch((error) => {
      console.error('\n✗ Example failed:', error);
      process.exit(1);
    });
}

export { chatWithReferences };
