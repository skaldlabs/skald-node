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

### Memo Management

#### Create a Memo

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

**Required Fields:**
- `title` (string, max 255 chars) - The title of the memo
- `content` (string) - The full content of the memo

**Optional Fields:**
- `project_id` (string) - Project UUID (required when using Token Authentication)
- `metadata` (object) - Custom JSON metadata
- `reference_id` (string, max 255 chars) - An ID from your side that you can use to match Skald memo UUIDs with e.g. documents on your end
- `tags` (array of strings) - Tags for categorization
- `source` (string, max 255 chars) - An indication from your side of the source of this content, useful when building integrations
- `expiration_date` (string) - ISO 8601 timestamp for automatic memo expiration

#### Get a Memo

Retrieve a memo by its UUID or your reference ID:

```javascript
// Get by UUID
const memo = await skald.getMemo('550e8400-e29b-41d4-a716-446655440000');

// Get by reference ID
const memo = await skald.getMemo('external-id-123', 'reference_id');

console.log(memo.title);
console.log(memo.content);
console.log(memo.summary);
console.log(memo.tags);
console.log(memo.chunks);
```

The `getMemo()` method returns complete memo details including content, AI-generated summary, tags, and content chunks.

#### List Memos

List all memos with pagination:

```javascript
// Get first page with default page size (20)
const memos = await skald.listMemos();

// Get specific page with custom page size
const memos = await skald.listMemos({ page: 2, page_size: 50 });

console.log(`Total memos: ${memos.count}`);
console.log(`Results: ${memos.results.length}`);
console.log(`Next page: ${memos.next}`);
```

**Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `page_size` (number, optional) - Results per page (default: 20, max: 100)

#### Update a Memo

Update an existing memo by UUID or reference ID:

```javascript
// Update by UUID
await skald.updateMemo('550e8400-e29b-41d4-a716-446655440000', {
  title: 'Updated Title',
  metadata: { status: 'reviewed' }
});

// Update by reference ID and trigger reprocessing
await skald.updateMemo('external-id-123', {
  content: 'New content that will be reprocessed'
}, 'reference_id');
```

**Note:** When you update the `content` field, the memo will be automatically reprocessed (summary, tags, and chunks regenerated).

**Updatable Fields:**
- `title` (string)
- `content` (string)
- `metadata` (object)
- `client_reference_id` (string)
- `source` (string)
- `expiration_date` (string)

#### Delete a Memo

Permanently delete a memo and all associated data:

```javascript
// Delete by UUID
await skald.deleteMemo('550e8400-e29b-41d4-a716-446655440000');

// Delete by reference ID
await skald.deleteMemo('external-id-123', 'reference_id');
```

**Warning:** This operation permanently deletes the memo and all related data (content, summary, tags, chunks) and cannot be undone.

### Search Memos

Search through your memos using various search methods with optional filters:

```javascript
// Basic semantic search
const results = await skald.search({
  query: 'quarterly goals',
  search_method: 'chunk_vector_search',
  limit: 10
});

// Search with filters
const filtered = await skald.search({
  query: 'python tutorial',
  search_method: 'title_contains',
  filters: [
    {
      field: 'source',
      operator: 'eq',
      value: 'notion',
      filter_type: 'native_field'
    },
    {
      field: 'level',
      operator: 'eq',
      value: 'beginner',
      filter_type: 'custom_metadata'
    }
  ]
});

console.log(`Found ${filtered.results.length} results`);
filtered.results.forEach(memo => {
  console.log(`- ${memo.title} (distance: ${memo.distance})`);
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
- `filters` (array, optional) - Array of filter objects to narrow results (see Filters section below)

#### Search Response

```typescript
interface SearchResponse {
  results: Array<{
    uuid: string;
    title: string;
    summary: string;
    content_snippet: string;
    distance: number | null;
  }>;
}
```

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
- `filters` (array, optional) - Array of filter objects to focus chat context on specific sources (see Filters section below)
- `project_id` (string, optional) - Project UUID (required when using Token Authentication)


#### Chat Response

Non-streaming responses include:
- `ok` (boolean) - Success status
- `response` (string) - The AI's answer with inline citations in format `[[N]]`
- `intermediate_steps` (array) - Steps taken by the agent (for debugging)

Streaming responses yield events:
- `{ type: 'token', content: string }` - Each text token as it's generated
- `{ type: 'done' }` - Indicates the stream has finished

### Generate Documents

Generate documents based on prompts and retrieved context from your knowledge base. Similar to chat but optimized for document generation with optional style/format rules.

#### Non-Streaming Document Generation

```javascript
const result = await skald.generateDoc({
  prompt: 'Create a product requirements document for a new mobile app',
  rules: 'Use formal business language. Include sections for: Overview, Requirements, Technical Specifications, Timeline'
});

console.log(result.response);
// "# Product Requirements Document
// 
// ## Overview
// This document outlines the requirements for...
// 
// ## Requirements
// 1. User authentication [[1]]
// 2. Push notifications [[2]]..."

console.log(result.ok); // true
```

#### Streaming Document Generation

For real-time document generation, use streaming:

```javascript
const stream = skald.streamedGenerateDoc({
  prompt: 'Write a technical specification for user authentication',
  rules: 'Include sections for: Architecture, Security, API Endpoints, Data Models'
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

#### Generate Document Parameters

- `prompt` (string, required) - The prompt describing what document to generate
- `rules` (string, optional) - Optional style/format rules (e.g., "Use formal language. Include sections: X, Y, Z")
- `filters` (array, optional) - Array of filter objects to control which memos are used for generation (see Filters section below)
- `project_id` (string, optional) - Project UUID (required when using Token Authentication)

#### Generate Document Response

Non-streaming responses include:
- `ok` (boolean) - Success status
- `response` (string) - The generated document with inline citations in format `[[N]]`
- `intermediate_steps` (array) - Steps taken by the agent (for debugging)

Streaming responses yield events:
- `{ type: 'token', content: string }` - Each text token as it's generated
- `{ type: 'done' }` - Indicates the stream has finished

### Filters

Filters allow you to narrow down results based on memo metadata. You can filter by native fields or custom metadata fields. Filters are supported in `search()`, `chat()`, `generateDoc()`, and their streaming variants.

#### Filter Structure

```typescript
interface Filter {
  field: string;                      // Field name to filter on
  operator: FilterOperator;           // Comparison operator
  value: string | string[];           // Value(s) to compare against
  filter_type: 'native_field' | 'custom_metadata';
}
```

#### Native Fields

Native fields are built-in memo properties:
- `title` - Memo title
- `source` - Source system (e.g., "notion", "confluence")
- `client_reference_id` - Your external reference ID
- `tags` - Memo tags (array)

#### Custom Metadata Fields

You can filter on any field from the `metadata` object you provided when creating the memo.

#### Filter Operators

- **`eq`** - Equals (exact match)
- **`neq`** - Not equals
- **`contains`** - Contains substring (case-insensitive)
- **`startswith`** - Starts with prefix (case-insensitive)
- **`endswith`** - Ends with suffix (case-insensitive)
- **`in`** - Value is in array (requires array value)
- **`not_in`** - Value is not in array (requires array value)

#### Filter Examples

```javascript
// Filter by source
{
  field: 'source',
  operator: 'eq',
  value: 'notion',
  filter_type: 'native_field'
}

// Filter by multiple tags
{
  field: 'tags',
  operator: 'in',
  value: ['security', 'compliance'],
  filter_type: 'native_field'
}

// Filter by title containing text
{
  field: 'title',
  operator: 'contains',
  value: 'meeting',
  filter_type: 'native_field'
}

// Filter by custom metadata field
{
  field: 'department',
  operator: 'eq',
  value: 'engineering',
  filter_type: 'custom_metadata'
}

// Exclude specific sources
{
  field: 'source',
  operator: 'not_in',
  value: ['draft', 'archive'],
  filter_type: 'native_field'
}
```

#### Combining Multiple Filters

When you provide multiple filters, they are combined with AND logic (all filters must match):

```javascript
const results = await skald.search({
  query: 'security best practices',
  search_method: 'chunk_vector_search',
  filters: [
    {
      field: 'source',
      operator: 'eq',
      value: 'security-docs',
      filter_type: 'native_field'
    },
    {
      field: 'tags',
      operator: 'in',
      value: ['approved', 'current'],
      filter_type: 'native_field'
    },
    {
      field: 'status',
      operator: 'neq',
      value: 'draft',
      filter_type: 'custom_metadata'
    }
  ]
});
```

#### Filters with Chat

Focus chat context on specific sources:

```javascript
const result = await skald.chat({
  query: 'What are our security practices?',
  filters: [
    {
      field: 'tags',
      operator: 'in',
      value: ['security', 'compliance'],
      filter_type: 'native_field'
    }
  ]
});
```

#### Filters with Document Generation

Control which memos are used for document generation:

```javascript
const doc = await skald.generateDoc({
  prompt: 'Create an API integration guide',
  rules: 'Use technical language with code examples',
  filters: [
    {
      field: 'source',
      operator: 'in',
      value: ['api-docs', 'technical-specs'],
      filter_type: 'native_field'
    },
    {
      field: 'document_type',
      operator: 'eq',
      value: 'specification',
      filter_type: 'custom_metadata'
    }
  ]
});
```

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
  Memo,
  ListMemosResponse,
  UpdateMemoData,
  UpdateMemoResponse,
  IdType,
  Filter,
  FilterOperator,
  FilterType,
  SearchRequest,
  SearchResponse,
  SearchMethod,
  ChatRequest,
  ChatResponse,
  ChatStreamEvent,
  GenerateDocRequest,
  GenerateDocResponse,
  GenerateDocStreamEvent
} from '@skald-labs/skald-node';

const skald = new Skald('your-api-key-here');

// Create a memo with types
const memoData: MemoData = {
  title: 'My Memo',
  content: 'Content here',
  tags: ['tag1', 'tag2'],
  metadata: { department: 'engineering' }
};

const createResponse: CreateMemoResponse = await skald.createMemo(memoData);

// Get memo with types
const memo: Memo = await skald.getMemo('550e8400-e29b-41d4-a716-446655440000');
const memoByRef: Memo = await skald.getMemo('external-id-123', 'reference_id' as IdType);

// List memos with types
const memos: ListMemosResponse = await skald.listMemos({ page: 1, page_size: 20 });

// Update memo with types
const updateData: UpdateMemoData = {
  title: 'Updated Title',
  metadata: { status: 'reviewed' }
};
const updateResponse: UpdateMemoResponse = await skald.updateMemo(
  '550e8400-e29b-41d4-a716-446655440000',
  updateData
);

// Delete memo
await skald.deleteMemo('550e8400-e29b-41d4-a716-446655440000');

// Search with filters and types
const filters: Filter[] = [
  {
    field: 'source',
    operator: 'eq' as FilterOperator,
    value: 'notion',
    filter_type: 'native_field' as FilterType
  },
  {
    field: 'department',
    operator: 'eq' as FilterOperator,
    value: 'engineering',
    filter_type: 'custom_metadata' as FilterType
  }
];

const searchRequest: SearchRequest = {
  query: 'quarterly goals',
  search_method: 'chunk_vector_search' as SearchMethod,
  limit: 10,
  filters
};

const searchResponse: SearchResponse = await skald.search(searchRequest);

// Chat with filters and types
const chatResponse: ChatResponse = await skald.chat({
  query: 'What are our quarterly goals?',
  filters
});

// Streaming chat with types
const stream = skald.streamedChat({
  query: 'What are our quarterly goals?',
  filters
});

for await (const event of stream) {
  const typedEvent: ChatStreamEvent = event;
  if (typedEvent.type === 'token') {
    process.stdout.write(typedEvent.content || '');
  }
}

// Generate document with filters and types
const generateDocResponse: GenerateDocResponse = await skald.generateDoc({
  prompt: 'Create a product requirements document for a new mobile app',
  rules: 'Use formal business language. Include sections for: Overview, Requirements',
  filters
});

// Streaming document generation with types
const docStream = skald.streamedGenerateDoc({
  prompt: 'Write a technical specification',
  rules: 'Include Architecture and Security sections',
  filters
});

for await (const event of docStream) {
  const typedEvent: GenerateDocStreamEvent = event;
  if (typedEvent.type === 'token') {
    process.stdout.write(typedEvent.content || '');
  } else if (typedEvent.type === 'done') {
    console.log('\nDone!');
  }
}
```
