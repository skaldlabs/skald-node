# Skald Node SDK

Node.js client library for the Skald API.

> Please note that Skald is evolving fast and we may ship breaking changes across **minor** versions.

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

console.log(result); // { memo_uuid: '550e8400-e29b-41d4-a716-446655440000' }
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

#### Create a Memo from File Upload

Upload a document file (PDF, DOC, DOCX, PPTX) that will be processed asynchronously and converted into a memo:

```javascript
import * as fs from 'fs';

const fileBuffer = fs.readFileSync('./document.pdf');

const result = await skald.createMemoFromFile({
  file: fileBuffer,
  filename: 'document.pdf',
  metadata: {
    type: 'report',
    department: 'engineering'
  },
  tags: ['report', '2024'],
  source: 'google-drive',
  reference_id: 'external-file-123'
});

console.log(result); // { ok: true, memo_uuid: '550e8400-e29b-41d4-a716-446655440000' }

// Poll for processing status
const status = await skald.checkMemoStatus({ memoId: result.memo_uuid });
console.log(status.status); // 'processing' | 'processed' | 'error'
```

**Supported File Types:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft PowerPoint (.pptx)
- Maximum file size: 100MB

**Required Fields:**
- `file` (Buffer | Blob) - The file content
- `filename` (string) - The name of the file including extension

**Optional Fields:**
- `reference_id` (string, max 255 chars) - Your external reference ID
- `metadata` (object) - Custom JSON metadata
- `tags` (array of strings) - Tags for categorization
- `source` (string, max 255 chars) - Source system identifier

**Note:** File processing is asynchronous. Use `checkMemoStatus()` to monitor the processing status.

#### Check Memo Processing Status

Monitor the processing status of a memo, especially useful after uploading files:

```javascript
// Check status by UUID
const status = await skald.checkMemoStatus({ memoId: '550e8400-e29b-41d4-a716-446655440000' });
console.log(status.status); // 'processing' | 'processed' | 'error'

if (status.status === 'error') {
  console.error('Processing failed:', status.error_reason);
}

// Check by reference ID
const status2 = await skald.checkMemoStatus({ memoId: 'external-id-123', idType: 'reference_id' });

// Poll until processing completes
while (true) {
  const status = await skald.checkMemoStatus({ memoId: memoUuid });

  if (status.status === 'processed') {
    console.log('Processing complete!');
    break;
  } else if (status.status === 'error') {
    console.error('Processing failed:', status.error_reason);
    break;
  }

  // Wait 2 seconds before checking again
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

**Status Values:**
- `processing` - The memo is currently being processed (parsed, summarized, chunked, indexed)
- `processed` - Processing completed successfully, memo is ready to use
- `error` - An error occurred during processing, check `error_reason` for details

**Parameters:**
Takes a request object with the following properties:
- `memoId` (string, required) - The memo UUID or client reference ID
- `idType` (string, optional) - Either `'memo_uuid'` or `'reference_id'` (default: `'memo_uuid'`)

#### Get a Memo

Retrieve a memo by its UUID or your reference ID:

```javascript
// Get by UUID
const memo = await skald.getMemo({ memoId: '550e8400-e29b-41d4-a716-446655440000' });

// Get by reference ID
const memo = await skald.getMemo({ memoId: 'external-id-123', idType: 'reference_id' });

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
await skald.updateMemo({
  memoId: '550e8400-e29b-41d4-a716-446655440000',
  updateData: {
    title: 'Updated Title',
    metadata: { status: 'reviewed' }
  }
});

// Update by reference ID and trigger reprocessing
await skald.updateMemo({
  memoId: 'external-id-123',
  updateData: {
    content: 'New content that will be reprocessed'
  },
  idType: 'reference_id'
});
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
await skald.deleteMemo({ memoId: '550e8400-e29b-41d4-a716-446655440000' });

// Delete by reference ID
await skald.deleteMemo({ memoId: 'external-id-123', idType: 'reference_id' });
```

**Warning:** This operation permanently deletes the memo and all related data (content, summary, tags, chunks) and cannot be undone.

### Search Memos

Search through your memos using semantic search. Returns :

```javascript
// Basic semantic search
const results = await skald.search({
  query: 'quarterly goals',
  limit: 10
});

// Search with filters
const filtered = await skald.search({
  query: 'python tutorial',
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


#### Search Parameters

- `query` (string, required) - The search query
- `limit` (integer, optional) - Maximum results to return (1-50, default 10)
- `filters` (array, optional) - Array of filter objects to narrow results (see Filters section below)

#### Search Response

```typescript
interface SearchResponse {
  results: Array<{
    memo_uuid: string;
    chunk_uuid: string;
    memo_title: string;
    memo_summary: string;
    content_snippet: string;
    distance: number | null;
  }>;
}
```

- `memo_uuid` - Unique identifier for the memo
- `memo_uuid` - Unique identifier for the chunk
- `memo_title` - Memo title
- `memo_summary` - Auto-generated summary for the memo
- `content_snippet` - A snippet containing the beginning of the chunk content. 
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
console.log(result.chat_id); // '550e8400-e29b-41d4-a716-446655440000'

// Continue the conversation by passing the chat_id
const followUp = await skald.chat({
  query: 'What were the revenue targets?',
  chat_id: result.chat_id  // Maintains conversation context
});

console.log(followUp.response);
// "Based on the Q1 meeting notes, the revenue targets were... [[1]]"
```

#### Streaming Chat

For real-time responses, use streaming chat:

```javascript
let chatId;

const stream = skald.streamedChat({
  query: 'What are our quarterly goals?'
});

for await (const event of stream) {
  if (event.type === 'token') {
    // Write each token as it arrives
    process.stdout.write(event.content);
  } else if (event.type === 'done') {
    // Capture the chat_id for continuing the conversation
    chatId = event.chat_id;
    console.log('\nDone!');
  }
}

// Continue the conversation with the captured chat_id
const followUpStream = skald.streamedChat({
  query: 'Can you elaborate on the first goal?',
  chat_id: chatId  // Maintains conversation context
});

for await (const event of followUpStream) {
  if (event.type === 'token') {
    process.stdout.write(event.content);
  } else if (event.type === 'done') {
    console.log('\nDone!');
  }
}
```

#### Chat Parameters

- `query` (string, required) - The question to ask
- `chat_id` (string, optional) - Chat ID to continue an existing conversation. When provided, the AI will have context from previous messages in the same conversation
- `system_prompt` (string, optional) - A system prompt to guide the AI's behavior
- `filters` (array, optional) - Array of filter objects to focus chat context on specific sources (see Filters section below)
- `rag_config` (object, optional) - Advanced RAG (Retrieval-Augmented Generation) configuration to customize the search and retrieval behavior (see RAG Configuration section below)
- `project_id` (string, optional) - Project UUID (required when using Token Authentication)


#### Chat Response

**Non-Streaming Response:**

Non-streaming responses include:
- `ok` (boolean) - Success status
- `response` (string) - The AI's answer with inline citations in format `[[N]]` (e.g., `[[1]]`, `[[2]]`)
- `chat_id` (string) - Unique identifier for this conversation. Use this to continue the conversation with follow-up questions
- `intermediate_steps` (array) - Steps taken by the agent (for debugging)
- `references` (object, optional) - Mapping of citation numbers to memo information (only included when `rag_config.references.enabled` is `true`)

**Streaming Response:**

Streaming responses yield events:
- `{ type: 'token', content: string }` - Each text token as it's generated
- `{ type: 'references', content: string }` - JSON string containing the references object (only sent when `rag_config.references.enabled` is `true`)
- `{ type: 'done', chat_id: string }` - Indicates the stream has finished and includes the chat_id for continuing the conversation

#### Understanding References

When you enable references in your RAG config (`rag_config.references.enabled: true`), the chat response will include inline citations and a references object that maps citation numbers to the source memos.

**Citation Format:**

The AI's response will include citations in the format `[[N]]` where N is a number (e.g., `[[1]]`, `[[2]]`, `[[3]]`). These citations appear inline in the response text to indicate which source memos support specific statements.

**References Object Structure:**

```typescript
interface References {
  [key: string]: {
    memo_uuid: string;    // UUID of the referenced memo
    memo_title: string;   // Title of the referenced memo
  };
}
```

**Non-Streaming Example with References:**

```javascript
const result = await skald.chat({
  query: 'What is the main topic discussed in the documentation?',
  rag_config: {
    references: {
      enabled: true
    }
  }
});

console.log(result.response);
// "Based on the documentation, the main topic is about API authentication 
// and authorization. The system uses API keys for authentication [[1]], 
// and supports role-based access control [[2]]. For more details on 
// implementation, see the security guide [[3]]."

console.log(result.references);
// {
//   "1": {
//     "memo_uuid": "123e4567-e89b-12d3-a456-426614174000",
//     "memo_title": "API Authentication Guide"
//   },
//   "2": {
//     "memo_uuid": "223e4567-e89b-12d3-a456-426614174001",
//     "memo_title": "Role-Based Access Control"
//   },
//   "3": {
//     "memo_uuid": "323e4567-e89b-12d3-a456-426614174002",
//     "memo_title": "Security Best Practices"
//   }
// }
```

**Streaming Example with References:**

```javascript
let fullResponse = '';
let references = {};

const stream = skald.streamedChat({
  query: 'What are our security best practices?',
  rag_config: {
    references: {
      enabled: true
    }
  }
});

for await (const event of stream) {
  if (event.type === 'token') {
    // Accumulate response text with citations
    fullResponse += event.content;
    process.stdout.write(event.content);
  } else if (event.type === 'references') {
    // Parse references object
    references = JSON.parse(event.content);
    console.log('\nReferences:', references);
  } else if (event.type === 'done') {
    console.log('\nChat ID:', event.chat_id);
  }
}

// Example output:
// fullResponse: "Our security practices include regular audits [[1]], 
// encryption at rest [[2]], and multi-factor authentication [[1]][[3]]."
//
// references: {
//   "1": { 
//     "memo_uuid": "123e4567-...", 
//     "memo_title": "Security Audit Procedures" 
//   },
//   "2": { 
//     "memo_uuid": "223e4567-...", 
//     "memo_title": "Data Encryption Standards" 
//   },
//   "3": { 
//     "memo_uuid": "323e4567-...", 
//     "memo_title": "Authentication Setup Guide" 
//   }
// }
```


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

### RAG Configuration

The `rag_config` parameter allows you to customize the Retrieval-Augmented Generation (RAG) behavior for chat operations. This gives you fine-grained control over how documents are retrieved, ranked, and used to generate responses.

#### RAG Config Structure

```typescript
interface RAGConfig {
  llmProvider?: 'openai' | 'anthropic' | 'groq';
  queryRewrite?: {
    enabled: boolean;
  };
  vectorSearch?: {
    topK: number;              // 1-200
    similarityThreshold: number; // 0.0-1.0
  };
  reranking?: {
    enabled: boolean;
    topK: number;              // 1-100
  };
  references?: {
    enabled: boolean;
  };
}
```

#### RAG Config Options

**`llmProvider`** (string, optional)
- Specifies which LLM provider to use for generating responses
- Options: `'openai'`, `'anthropic'`, `'groq'`
- Defaults to your project's configured provider

**`queryRewrite`** (object, optional)
- `enabled` (boolean) - Whether to rewrite the user's query for better retrieval
- Query rewriting can improve search results by reformulating vague queries
- Default: `false`

**`vectorSearch`** (object, optional)
- `topK` (number, 1-200) - How many chunks to retrieve from vector search
- `similarityThreshold` (number, 0.0-1.0) - Minimum similarity score (0 = most similar)
- Lower similarity thresholds are more restrictive
- Default: `topK: 100`, `similarityThreshold: 0.8`

**`reranking`** (object, optional)
- `enabled` (boolean) - Whether to rerank search results for better relevance
- `topK` (number, 1-100) - How many top results to keep after reranking (must be ≤ vectorSearch.topK)
- Reranking uses a more sophisticated model to order results by relevance
- Default: `enabled: true`, `topK: 50`

**`references`** (object, optional)
- `enabled` (boolean) - Whether to include inline citations in the response (e.g., `[[1]]`, `[[2]]`)
- Default: `false`

#### Basic RAG Config Examples

**Enable References with Citations:**

```javascript
const result = await skald.chat({
  query: 'What are our security best practices?',
  rag_config: {
    references: {
      enabled: true
    }
  }
});

console.log(result.response);
// "Our security practices include: 1) Regular audits [[1]], 
// 2) Encryption at rest [[2]], and 3) Multi-factor authentication [[1]][[3]]"
```

**Customize Vector Search Parameters:**

```javascript
const result = await skald.chat({
  query: 'Tell me about our product roadmap',
  rag_config: {
    vectorSearch: {
      topK: 150,                  // Retrieve more chunks
      similarityThreshold: 0.7    // Be less restrictive
    },
    reranking: {
      enabled: true,
      topK: 30                    // Keep top 30 after reranking
    }
  }
});
```

**Use a Specific LLM Provider:**

```javascript
const result = await skald.chat({
  query: 'Summarize our Q4 goals',
  rag_config: {
    llmProvider: 'anthropic',    // Use Claude
    references: {
      enabled: true
    }
  }
});
```

**Enable Query Rewriting for Better Results:**

```javascript
const result = await skald.chat({
  query: 'how do we handle that thing with customers?',  // Vague query
  rag_config: {
    queryRewrite: {
      enabled: true  // AI will reformulate this into a clearer query
    },
    vectorSearch: {
      topK: 100,
      similarityThreshold: 0.8
    }
  }
});
```

**Disable Reranking for Faster Responses:**

```javascript
const result = await skald.chat({
  query: 'What is our company mission?',
  rag_config: {
    reranking: {
      enabled: false,  // Skip reranking for faster response
      topK: 50
    }
  }
});
```

#### Advanced RAG Config Examples

**Fine-tune All RAG Parameters:**

```javascript
const result = await skald.chat({
  query: 'What security measures do we have in place?',
  system_prompt: 'You are a security expert. Provide detailed, technical answers.',
  rag_config: {
    llmProvider: 'anthropic',
    queryRewrite: {
      enabled: true
    },
    vectorSearch: {
      topK: 200,                  // Maximum retrieval
      similarityThreshold: 0.6    // Cast a wider net
    },
    reranking: {
      enabled: true,
      topK: 50                    // Keep top 50 most relevant
    },
    references: {
      enabled: true               // Include citations
    }
  },
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

**Streaming Chat with RAG Config:**

```javascript
const stream = skald.streamedChat({
  query: 'Explain our data processing pipeline',
  rag_config: {
    llmProvider: 'groq',        // Use Groq for fast streaming
    vectorSearch: {
      topK: 120,
      similarityThreshold: 0.75
    },
    reranking: {
      enabled: true,
      topK: 40
    },
    references: {
      enabled: true
    }
  }
});

for await (const event of stream) {
  if (event.type === 'token') {
    process.stdout.write(event.content);
  } else if (event.type === 'done') {
    console.log('\nChat ID:', event.chat_id);
  }
}
```

**Optimize for Precision (Narrow, Focused Results):**

```javascript
const result = await skald.chat({
  query: 'What is the exact version number of our API?',
  rag_config: {
    vectorSearch: {
      topK: 50,                   // Fewer chunks
      similarityThreshold: 0.9    // Very strict matching
    },
    reranking: {
      enabled: true,
      topK: 10                    // Only keep top 10
    }
  }
});
```

**Optimize for Recall (Broad, Comprehensive Results):**

```javascript
const result = await skald.chat({
  query: 'Tell me everything about our customer onboarding process',
  rag_config: {
    vectorSearch: {
      topK: 200,                  // Maximum chunks
      similarityThreshold: 0.5    // More permissive
    },
    reranking: {
      enabled: true,
      topK: 80                    // Keep more results
    }
  }
});
```

#### RAG Config Best Practices

1. **Start with defaults**: The default settings work well for most use cases. Only customize when you have specific needs.

2. **Enable references for transparency**: If you need to verify information or provide source attribution, enable `references.enabled: true`.

3. **Balance topK values**: 
   - Higher `vectorSearch.topK` = more comprehensive but slower
   - Ensure `reranking.topK` ≤ `vectorSearch.topK`
   - Typical range: vectorSearch 80-150, reranking 30-60

4. **Adjust similarity threshold based on need**:
   - Strict matching (0.9-1.0): Use when you need exact information
   - Balanced (0.7-0.8): Good default for most queries
   - Broad matching (0.5-0.6): Use for exploratory or vague queries

5. **Use query rewriting for user-facing applications**: Enable `queryRewrite.enabled: true` when users might provide unclear or ambiguous queries.

6. **Choose LLM provider based on requirements**:
   - `anthropic` (Claude): Great for nuanced understanding and longer context
   - `openai` (GPT): Fast and reliable for most use cases
   - `groq`: Optimized for speed with streaming responses

#### TypeScript Support for RAG Config

```typescript
import { Skald, RAGConfig, LLMProvider } from '@skald-labs/skald-node';

const ragConfig: RAGConfig = {
  llmProvider: 'anthropic' as LLMProvider,
  queryRewrite: {
    enabled: true
  },
  vectorSearch: {
    topK: 150,
    similarityThreshold: 0.75
  },
  reranking: {
    enabled: true,
    topK: 50
  },
  references: {
    enabled: true
  }
};

const result = await skald.chat({
  query: 'What are our company values?',
  rag_config: ragConfig
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
  MemoFileData,
  CreateMemoFromFileResponse,
  MemoStatus,
  MemoStatusResponse,
  Memo,
  ListMemosResponse,
  UpdateMemoData,
  UpdateMemoResponse,
  DeleteMemoResponse,
  IdType,
  GetMemoRequest,
  UpdateMemoRequest,
  DeleteMemoRequest,
  CheckMemoStatusRequest,
  Filter,
  FilterOperator,
  FilterType,
  SearchRequest,
  SearchResponse,
  ChatRequest,
  ChatResponse,
  ChatStreamEvent,
  RAGConfig,
  LLMProvider,
  QueryRewriteConfig,
  VectorSearchConfig,
  RerankingConfig,
  ReferencesConfig,
  MemoReference,
  References
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
const memo: Memo = await skald.getMemo({ memoId: '550e8400-e29b-41d4-a716-446655440000' });
const memoByRef: Memo = await skald.getMemo({ memoId: 'external-id-123', idType: 'reference_id' as IdType });

// List memos with types
const memos: ListMemosResponse = await skald.listMemos({ page: 1, page_size: 20 });

// Update memo with types
const updateData: UpdateMemoData = {
  title: 'Updated Title',
  metadata: { status: 'reviewed' }
};
const updateResponse: UpdateMemoResponse = await skald.updateMemo({
  memoId: '550e8400-e29b-41d4-a716-446655440000',
  updateData
});

// Delete memo
await skald.deleteMemo({ memoId: '550e8400-e29b-41d4-a716-446655440000' });

// Upload a file
import * as fs from 'fs';
const fileBuffer = fs.readFileSync('./document.pdf');
const fileData: MemoFileData = {
  file: fileBuffer,
  filename: 'document.pdf',
  metadata: { type: 'report' },
  tags: ['document'],
  source: 'local'
};
const uploadResponse: CreateMemoFromFileResponse = await skald.createMemoFromFile(fileData);

// Check processing status
const statusResponse: MemoStatusResponse = await skald.checkMemoStatus({ memoId: uploadResponse.memo_uuid });
const status: MemoStatus = statusResponse.status; // 'processing' | 'processed' | 'error'

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

// Chat with references and types
const chatWithRefs: ChatResponse = await skald.chat({
  query: 'What are our security best practices?',
  rag_config: {
    references: {
      enabled: true
    }
  }
});

console.log(chatWithRefs.response); // Response with [[1]], [[2]], etc.

if (chatWithRefs.references) {
  const refs: References = chatWithRefs.references;
  Object.entries(refs).forEach(([num, ref]) => {
    const memoRef: MemoReference = ref;
    console.log(`[${num}] ${memoRef.memo_title} (${memoRef.memo_uuid})`);
  });
}

// Streaming chat with references and types
let fullResponse = '';
let streamedRefs: References | undefined;

const streamWithRefs = skald.streamedChat({
  query: 'Explain our authentication system',
  rag_config: {
    references: {
      enabled: true
    }
  }
});

for await (const event of streamWithRefs) {
  const typedEvent: ChatStreamEvent = event;
  
  if (typedEvent.type === 'token') {
    fullResponse += typedEvent.content || '';
    process.stdout.write(typedEvent.content || '');
  } else if (typedEvent.type === 'references') {
    streamedRefs = JSON.parse(typedEvent.content || '{}') as References;
    console.log('\nReferences received:', Object.keys(streamedRefs).length);
  } else if (typedEvent.type === 'done') {
    console.log('\nChat completed:', typedEvent.chat_id);
  }
}

```
