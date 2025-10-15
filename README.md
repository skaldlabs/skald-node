# Skald Node SDK

Node.js client library for the Skald API.

## Installation

```bash
npm install @skald-labs/skald-node
```

## Requirements

- Node 18.0.0 or higher

## Usage

### Initialize the client

```javascript
import { Skald } from '@skald-labs/skald-node';

const skald = new Skald('your-api-key-here');
```

### Create a Memo

Create a new memo that will be automatically processed (summarized, tagged, chunked, and indexed for search):

```javascript
const result = await skald.createMemo({
  title: 'Meeting Notes',
  content: 'Full content of the memo...',
  metadata: {
    type: 'notes',
    author: 'John Doe'
  },
  reference_id: 'external-id-123',
  tags: ['meeting', 'q1'],
  source: 'notion',
  expiration_date: '2024-12-31T23:59:59Z'
});

console.log(result); // { ok: true }
```

#### Required Fields

- `title` (string, max 255 chars) - The title of the memo
- `content` (string) - The full content of the memo

#### Optional Fields

- `project_id` (string) - Project UUID (required when using Token Authentication)
- `metadata` (object) - Custom JSON metadata
- `reference_id` (string, max 255 chars) - An ID from your side that you can use to match Skald memo UUIDs with e.g. documents on your end
- `tags` (array of strings) - Tags for categorization
- `source` (string, max 255 chars) - An indication from your side of the source of this content, useful when building integrations.

### Search Memos

Search through your memos using various search methods:

```javascript
const results = await skald.search({
  query: 'quarterly goals',
  search_method: 'chunk_vector_search',
  limit: 10,
  tags: ['meeting', 'q1']
});

console.log(`Found ${results.results.length} results`);
results.results.forEach(memo => {
  console.log(`- ${memo.title} (score: ${memo.score})`);
});
```

#### Search Methods

- **`chunk_vector_search`** - Semantic search on memo chunks for detailed content search
- **`title_contains`** - Case-insensitive substring match on memo titles
- **`title_startswith`** - Case-insensitive prefix match on memo titles

#### Search Parameters

- `query` (string, required) - The search query
- `search_method` (SearchMethod, required) - One of the search methods above
- `limit` (integer, optional) - Maximum results to return (1-50, default 10)
- `tags` (array of strings, optional) - Filter results by tags

#### Search Response

The search returns an array of results with the following fields:

export interface SearchResponse {
  results: Array<{
    uuid: string;
    title: string;
    summary: string;
    content_snippet: string;
    distance: number | null;
  }>;
}

- `uuid` - Unique identifier for the memo
- `title` - Memo title
- `summary` - Auto-generated summary for the memo
- `content_snippet` - A snippet containing the beginning of the memo
- `distance` - A decimal from 0 to 2 determining how close the result was deemed to be to the query when using semantic search (`chunk_vector_search`). The closer to 0 the more related the content is to the query. `null` if using `title_contains` or `title_startswith`. 


### Chat with Your Knowledge Base

Ask questions about your memos using an AI agent. The agent retrieves relevant context and generates answers with inline citations.

#### Non-Streaming Chat

```javascript
const result = await skald.chat({
  query: 'What were the main points discussed in the Q1 meeting?'
});

console.log(result.response);
// "The main points discussed in the Q1 meeting were:
// 1. Revenue targets [[1]]
// 2. Hiring plans [[2]]
// 3. Product roadmap [[1]][[3]]"

console.log(result.ok); // true
```

#### Streaming Chat

For real-time responses, use streaming chat:

```javascript
const stream = skald.streamedChat({
  query: 'What are our quarterly goals?'
});

for await (const event of stream) {
  if (event.type === 'token') {
    // Write each token as it arrives
    process.stdout.write(event.content);
  } else if (event.type === 'done') {
    console.log('\nDone!');
  }
}
```

#### Chat Parameters

- `query` (string, required) - The question to ask
- `project_id` (string, optional) - Project UUID (required when using Token Authentication)


#### Chat Response

Non-streaming responses include:
- `ok` (boolean) - Success status
- `response` (string) - The AI's answer with inline citations in format `[[N]]`
- `intermediate_steps` (array) - Steps taken by the agent (for debugging)

Streaming responses yield events:
- `{ type: 'token', content: string }` - Each text token as it's generated
- `{ type: 'done' }` - Indicates the stream has finished

### Error Handling

```javascript
try {
  const result = await skald.createMemo({
    title: 'My Memo',
    content: 'Content here'
  });
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

## TypeScript Support

This package includes TypeScript type definitions out of the box.

```typescript
import { 
  Skald, 
  MemoData, 
  CreateMemoResponse,
  SearchRequest,
  SearchResponse,
  SearchMethod,
  ChatRequest,
  ChatResponse,
  ChatStreamEvent,
  StreamChatOptions
} from '@skald-labs/skald-node';

const skald = new Skald('your-api-key-here');

// Create a memo with types
const memoData: MemoData = {
  title: 'My Memo',
  content: 'Content here',
  tags: ['tag1', 'tag2']
};

const createResponse: CreateMemoResponse = await skald.createMemo(memoData);

// Search with types
const searchRequest: SearchRequest = {
  query: 'quarterly goals',
  search_method: 'chunk_vector_search' as SearchMethod,
  limit: 10
};

const searchResponse: SearchResponse = await skald.search(searchRequest);

// Chat with types
const chatResponse: ChatResponse = await skald.chat({
  query: 'What are our quarterly goals?'
});

// Streaming chat with types
const stream = skald.streamedChat({
  query: 'What are our quarterly goals?'
});

for await (const event of stream) {
  const typedEvent: ChatStreamEvent = event;
  if (typedEvent.type === 'token') {
    process.stdout.write(typedEvent.content || '');
  }
}

// Streaming chat with auto-console
const options: StreamChatOptions = { streamToConsole: true };
const autoStream = skald.streamedChat({
  query: 'What are our quarterly goals?'
}, options);

for await (const event of autoStream) {
  if (event.type === 'done') {
    console.log('Done!');
  }
}
```
