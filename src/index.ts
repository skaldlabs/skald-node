/**
 * Skald API Client for Node.js
 */

export interface MemoData {
  title: string;
  content: string;
  metadata?: Record<string, any>;
  reference_id?: string;
  tags?: string[];
  source?: string;
  expiration_date?: string;
}

export interface CreateMemoResponse {
  ok: boolean;
}

export interface UpdateMemoData {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  client_reference_id?: string;
  source?: string;
  expiration_date?: string;
}

export interface UpdateMemoResponse {
  ok: boolean;
}

export type IdType = 'memo_uuid' | 'reference_id';

export interface MemoTag {
  uuid: string;
  tag: string;
}

export interface MemoChunk {
  uuid: string;
  chunk_content: string;
  chunk_index: number;
}

export interface Memo {
  uuid: string;
  created_at: string;
  updated_at: string;
  title: string;
  content: string;
  summary: string;
  content_length: number;
  metadata: Record<string, any>;
  client_reference_id: string | null;
  source: string | null;
  type: string;
  expiration_date: string | null;
  archived: boolean;
  pending: boolean;
  tags: MemoTag[];
  chunks: MemoChunk[];
}

export interface MemoListItem {
  uuid: string;
  created_at: string;
  updated_at: string;
  title: string;
  summary: string;
  content_length: number;
  metadata: Record<string, any>;
  client_reference_id: string | null;
}

export interface ListMemosResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MemoListItem[];
}

export interface ListMemosParams {
  page?: number;
  page_size?: number;
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'startswith'
  | 'endswith'
  | 'in'
  | 'not_in';

export type FilterType = 'native_field' | 'custom_metadata';

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: string | string[];
  filter_type: FilterType;
}

export type SearchMethod =
  | 'chunk_vector_search'
  | 'title_contains'
  | 'title_startswith';

export interface SearchRequest {
  query: string;
  search_method: SearchMethod;
  limit?: number;
  filters?: Filter[];
}

export interface SearchResponse {
  results: Array<{
    uuid: string;
    title: string;
    summary: string;
    content_snippet: string;
    distance: number | null;
  }>;
}

export interface ChatRequest {
  query: string;
  stream?: boolean;
  filters?: Filter[];
}

export interface ChatResponse {
  ok: boolean;
  response: string;
  intermediate_steps: any[];
}

export interface ChatStreamEvent {
  type: 'token' | 'done';
  content?: string;
}

export interface GenerateDocRequest {
  prompt: string;
  rules?: string;
  stream?: boolean;
  filters?: Filter[];
}

export interface GenerateDocResponse {
  ok: boolean;
  response: string;
  intermediate_steps: any[];
}

export interface GenerateDocStreamEvent {
  type: 'token' | 'done';
  content?: string;
}

export interface SkaldConfig {
  apiKey: string;
  baseUrl?: string;
}

export class Skald {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.useskald.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
  }

  /**
   * Create a new memo. The memo will be automatically processed (summarized, chunked, and indexed for search).
   * 
   * @param memoData - The memo creation parameters
   * @param memoData.title - The title of the memo (required, max 255 characters)
   * @param memoData.content - The full content/body of the memo (required)
   * @param memoData.metadata - Optional custom JSON metadata (key-value pairs for additional context)
   * @param memoData.reference_id - Optional external reference ID (max 255 characters, used for linking Skald memos to IDs on your side)
   * @param memoData.tags - Optional array of tags for categorization and filtering
   * @param memoData.source - Optional source system name (max 255 characters, e.g., "notion", "confluence", "email")
   * 
   * @returns Promise resolving to { ok: true } on success
   * @throws Error if the API request fails with status code and error message
   * 
   * @example
   * ```typescript
   * const result = await skald.createMemo({
   *   title: 'Meeting Notes',
   *   content: 'Discussion about Q1 roadmap...',
   *   metadata: { type: 'notes', author: 'John Doe' },
   *   tags: ['meeting', 'q1'],
   *   source: 'notion'
   * });
   * ```
   */
  async createMemo(memoData: MemoData): Promise<CreateMemoResponse> {
    const url = `${this.baseUrl}/api/v1/memo`;

    memoData.metadata = memoData.metadata || {};

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(memoData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<CreateMemoResponse>;
  }

  /**
   * Get a memo by UUID or reference ID.
   *
   * @param memoId - The memo UUID or client reference ID
   * @param idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving to memo details with content, summary, tags, and chunks
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Get by UUID
   * const memo = await skald.getMemo('550e8400-e29b-41d4-a716-446655440000');
   *
   * // Get by reference ID
   * const memo = await skald.getMemo('external-id-123', 'reference_id');
   * ```
   */
  async getMemo(memoId: string, idType: IdType = 'memo_uuid'): Promise<Memo> {
    if (idType !== 'memo_uuid' && idType !== 'reference_id') {
      throw new Error(`Invalid idType: ${idType}. Must be 'memo_uuid' or 'reference_id'.`);
    }

    const url = new URL(`${this.baseUrl}/api/v1/memo/${encodeURIComponent(memoId)}`);
    if (idType !== 'memo_uuid') {
      url.searchParams.set('id_type', idType);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<Memo>;
  }

  /**
   * List all memos in the project with pagination.
   *
   * @param params - Optional pagination parameters
   * @param params.page - Page number (default: 1)
   * @param params.page_size - Number of results per page (default: 20, max: 100)
   *
   * @returns Promise resolving to paginated list of memos
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Get first page with default page size
   * const memos = await skald.listMemos();
   *
   * // Get specific page with custom page size
   * const memos = await skald.listMemos({ page: 2, page_size: 50 });
   *
   * // Navigate through pages
   * console.log(`Total memos: ${memos.count}`);
   * console.log(`Next page: ${memos.next}`);
   * ```
   */
  async listMemos(params: ListMemosParams = {}): Promise<ListMemosResponse> {
    const url = new URL(`${this.baseUrl}/api/v1/memo`);
    if (params.page) {
      url.searchParams.set('page', params.page.toString());
    }
    if (params.page_size) {
      url.searchParams.set('page_size', params.page_size.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<ListMemosResponse>;
  }

  /**
   * Update an existing memo by UUID or reference ID. If content is updated,
   * the memo will be reprocessed (summary, tags, chunks regenerated).
   *
   * @param memoId - The memo UUID or client reference ID
   * @param updateData - The fields to update (all optional)
   * @param idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving to { ok: true } on success
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Update by UUID
   * await skald.updateMemo('550e8400-e29b-41d4-a716-446655440000', {
   *   title: 'Updated Title',
   *   metadata: { status: 'reviewed' }
   * });
   *
   * // Update by reference ID and trigger reprocessing
   * await skald.updateMemo('external-id-123', {
   *   content: 'New content that will be reprocessed'
   * }, 'reference_id');
   * ```
   */
  async updateMemo(
    memoId: string,
    updateData: UpdateMemoData,
    idType: IdType = 'memo_uuid'
  ): Promise<UpdateMemoResponse> {
    if (idType !== 'memo_uuid' && idType !== 'reference_id') {
      throw new Error(`Invalid idType: ${idType}. Must be 'memo_uuid' or 'reference_id'.`);
    }

    const url = new URL(`${this.baseUrl}/api/v1/memo/${encodeURIComponent(memoId)}`);
    if (idType !== 'memo_uuid') {
      url.searchParams.set('id_type', idType);
    }

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<UpdateMemoResponse>;
  }

  /**
   * Delete a memo by UUID or reference ID. This permanently deletes the memo
   * and all associated data (content, summary, tags, chunks).
   *
   * @param memoId - The memo UUID or client reference ID
   * @param idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving when deletion is complete
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Delete by UUID
   * await skald.deleteMemo('550e8400-e29b-41d4-a716-446655440000');
   *
   * // Delete by reference ID
   * await skald.deleteMemo('external-id-123', 'reference_id');
   * ```
   */
  async deleteMemo(memoId: string, idType: IdType = 'memo_uuid'): Promise<void> {
    if (idType !== 'memo_uuid' && idType !== 'reference_id') {
      throw new Error(`Invalid idType: ${idType}. Must be 'memo_uuid' or 'reference_id'.`);
    }

    const url = new URL(`${this.baseUrl}/api/v1/memo/${encodeURIComponent(memoId)}`);
    if (idType !== 'memo_uuid') {
      url.searchParams.set('id_type', idType);
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }
  }

  /**
   * Search through memos using various search methods with optional filtering.
   *
   * @param searchParams - The search parameters
   * @param searchParams.query - The search query string (required)
   * @param searchParams.search_method - The search method to use (required):
   *   - `chunk_vector_search`: Semantic search on memo chunks for detailed content search
   *   - `title_contains`: Case-insensitive substring match on memo titles
   *   - `title_startswith`: Case-insensitive prefix match on memo titles
   * @param searchParams.limit - Maximum number of results to return (1-50, default 10)
   * @param searchParams.filters - Optional array of filters to narrow results
   *
   * @returns Promise resolving to search results with memo details and relevance scores
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Semantic search
   * const results = await skald.search({
   *   query: 'quarterly goals',
   *   search_method: 'chunk_vector_search',
   *   limit: 10,
   * });
   *
   * // Search with filters
   * const filtered = await skald.search({
   *   query: 'python tutorial',
   *   search_method: 'title_contains',
   *   filters: [
   *     {
   *       field: 'source',
   *       operator: 'eq',
   *       value: 'notion',
   *       filter_type: 'native_field'
   *     },
   *     {
   *       field: 'level',
   *       operator: 'eq',
   *       value: 'beginner',
   *       filter_type: 'custom_metadata'
   *     }
   *   ]
   * });
   * ```
   */
  async search(searchParams: SearchRequest): Promise<SearchResponse> {
    const url = `${this.baseUrl}/api/v1/search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(searchParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<SearchResponse>;
  }

  /**
   * Ask questions about your knowledge base using an AI agent with optional filtering (non-streaming).
   *
   * @param chatParams - The chat parameters
   * @param chatParams.query - The question to ask (required)
   * @param chatParams.filters - Optional array of filters to narrow the search context
   *
   * @returns Promise resolving to chat response with answer and citations
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Basic chat
   * const result = await skald.chat({
   *   query: 'What were the main points discussed in the Q1 meeting?'
   * });
   *
   * // Chat with filters to focus on specific sources
   * const filtered = await skald.chat({
   *   query: 'What are our security practices?',
   *   filters: [
   *     {
   *       field: 'source',
   *       operator: 'eq',
   *       value: 'security-docs',
   *       filter_type: 'native_field'
   *     },
   *     {
   *       field: 'tags',
   *       operator: 'in',
   *       value: ['security', 'compliance'],
   *       filter_type: 'native_field'
   *     }
   *   ]
   * });
   *
   * console.log(result.response);
   * // "The main points discussed in the Q1 meeting were:
   * // 1. Revenue targets [[1]]
   * // 2. Hiring plans [[2]]"
   * ```
   */
  async chat(chatParams: Omit<ChatRequest, 'stream'>): Promise<ChatResponse> {
    const url = `${this.baseUrl}/api/v1/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...chatParams,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<ChatResponse>;
  }

  /**
   * Ask questions about your knowledge base using an AI agent with streaming responses and optional filtering.
   * Returns an async generator that yields tokens as they arrive.
   *
   * @param chatParams - The chat parameters
   * @param chatParams.query - The question to ask (required)
   * @param chatParams.filters - Optional array of filters to narrow the search context
   *
   * @returns AsyncGenerator yielding chat stream events (tokens and done event)
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * const stream = skald.streamedChat({
   *   query: 'What were the main points discussed in the Q1 meeting?',
   *   filters: [
   *     {
   *       field: 'tags',
   *       operator: 'in',
   *       value: ['meeting', 'q1'],
   *       filter_type: 'native_field'
   *     }
   *   ]
   * });
   *
   * for await (const event of stream) {
   *   if (event.type === 'token') {
   *     process.stdout.write(event.content);
   *   } else if (event.type === 'done') {
   *     console.log('\nDone!');
   *   }
   * }
   *
   * ```
   */
  async *streamedChat(
    chatParams: Omit<ChatRequest, 'stream'>,
  ): AsyncGenerator<ChatStreamEvent> {
    const url = `${this.baseUrl}/api/v1/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...chatParams,
        stream: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data) as ChatStreamEvent;
              
              yield event;
              
              if (event.type === 'done') {
                return;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
          // Skip ping lines (": ping") and empty lines
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate documents based on prompts and retrieved context from the knowledge base with optional filtering (non-streaming).
   * Similar to chat but optimized for document generation with optional style/format rules.
   *
   * @param generateParams - The document generation parameters
   * @param generateParams.prompt - The prompt for document generation (required)
   * @param generateParams.rules - Optional style/format rules (e.g., "Use formal business language. Include sections for: Overview, Requirements")
   * @param generateParams.filters - Optional array of filters to control which memos are used as context
   *
   * @returns Promise resolving to generated document response
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Generate document without filters
   * const result = await skald.generateDoc({
   *   prompt: 'Create a product requirements document for a new mobile app',
   *   rules: 'Use formal business language. Include sections for: Overview, Requirements, Technical Specifications, Timeline'
   * });
   *
   * // Generate document with filters to use specific sources
   * const filtered = await skald.generateDoc({
   *   prompt: 'Create an API integration guide',
   *   rules: 'Use technical language with code examples',
   *   filters: [
   *     {
   *       field: 'source',
   *       operator: 'in',
   *       value: ['api-docs', 'technical-specs'],
   *       filter_type: 'native_field'
   *     },
   *     {
   *       field: 'document_type',
   *       operator: 'eq',
   *       value: 'specification',
   *       filter_type: 'custom_metadata'
   *     }
   *   ]
   * });
   *
   * console.log(result.response);
   * ```
   */
  async generateDoc(generateParams: Omit<GenerateDocRequest, 'stream'>): Promise<GenerateDocResponse> {
    const url = `${this.baseUrl}/api/v1/generate`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...generateParams,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<GenerateDocResponse>;
  }

  /**
   * Generate documents with streaming responses and optional filtering. Returns an async generator that yields tokens as they arrive.
   * Similar to chat but optimized for document generation with optional style/format rules.
   *
   * @param generateParams - The document generation parameters
   * @param generateParams.prompt - The prompt for document generation (required)
   * @param generateParams.rules - Optional style/format rules (e.g., "Use formal business language. Include sections for: Overview, Requirements")
   * @param generateParams.filters - Optional array of filters to control which memos are used as context
   *
   * @returns AsyncGenerator yielding document generation stream events (tokens and done event)
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * const stream = skald.streamedGenerateDoc({
   *   prompt: 'Create a product requirements document for a new mobile app',
   *   rules: 'Use formal business language. Include sections for: Overview, Requirements, Technical Specifications, Timeline',
   *   filters: [
   *     {
   *       field: 'tags',
   *       operator: 'in',
   *       value: ['mobile', 'product'],
   *       filter_type: 'native_field'
   *     }
   *   ]
   * });
   *
   * for await (const event of stream) {
   *   if (event.type === 'token') {
   *     process.stdout.write(event.content);
   *   } else if (event.type === 'done') {
   *     console.log('\nDone!');
   *   }
   * }
   *
   * ```
   */
  async *streamedGenerateDoc(
    generateParams: Omit<GenerateDocRequest, 'stream'>,
  ): AsyncGenerator<GenerateDocStreamEvent> {
    const url = `${this.baseUrl}/api/v1/generate`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...generateParams,
        stream: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data) as GenerateDocStreamEvent;
              
              yield event;
              
              if (event.type === 'done') {
                return;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
          // Skip ping lines (": ping") and empty lines
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
