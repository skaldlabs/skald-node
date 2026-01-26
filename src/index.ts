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
  scopes?: Record<string, string>;
}

export interface CreateMemoResponse {
  memo_uuid: string;
}

export interface MemoFileData {
  file: Buffer | Blob;
  filename: string;
  title?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  source?: string;
  scopes?: Record<string, string>;
}

export interface CreateMemoFromFileResponse {
  ok: boolean;
  memo_uuid: string;
}

export type MemoStatus = 'processing' | 'processed' | 'error';

export interface MemoStatusResponse {
  status: MemoStatus;
  error_reason?: string;
}

export interface UpdateMemoResponse {
  ok: boolean;
}

export interface DeleteMemoResponse {
  ok: boolean;
}

export type IdType = 'memo_uuid' | 'reference_id';

export interface GetMemoRequest {
  memoId: string;
  idType?: IdType;
}

export interface UpdateMemoRequest {
  memoId: string;
  updateData: Partial<MemoData>;
  idType?: IdType;
}

export interface DeleteMemoRequest {
  memoId: string;
  idType?: IdType;
}

export interface CheckMemoStatusRequest {
  memoId: string;
  idType?: IdType;
}

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
  scopes: Record<string, string> | null;
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

export type FilterType = 'native_field' | 'custom_metadata' | 'scope';

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: string | string[];
  filter_type: FilterType;
}


export interface SearchRequest {
  query: string;
  limit?: number;
  filters?: Filter[];
  scopes?: Record<string, string>;
}

export interface SearchResponse {
  results: Array<{
    memo_uuid: string;
    chunk_uuid: string;
    memo_title: string;
    memo_summary: string;
    content_snippet: string;
    distance: number | null;
  }>;
}

export type LLMProvider = 'openai' | 'anthropic' | 'groq';

export interface QueryRewriteConfig {
  enabled: boolean;
}

export interface VectorSearchConfig {
  topK: number;
  similarityThreshold: number;
}

export interface RerankingConfig {
  enabled: boolean;
  topK: number;
}

export interface ReferencesConfig {
  enabled: boolean;
}

export interface RAGConfig {
  llmProvider?: LLMProvider;
  queryRewrite?: QueryRewriteConfig;
  vectorSearch?: VectorSearchConfig;
  reranking?: RerankingConfig;
  references?: ReferencesConfig;
}

export interface ChatRequest {
  query: string;
  stream?: boolean;
  system_prompt?: string;
  scopes?: Record<string, string>;
  filters?: Filter[];
  chat_id?: string;
  rag_config?: RAGConfig;
}

export interface MemoReference {
  memo_uuid: string;
  memo_title: string;
}

export interface References {
  [key: string]: MemoReference;
}

export interface ChatResponse {
  ok: boolean;
  response: string;
  intermediate_steps: any[];
  chat_id: string;
  references?: References;
}

export interface ChatStreamEvent {
  type: 'token' | 'done' | 'references';
  content?: string;
  chat_id?: string;
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
   * @param memoData.scopes - Optional key-value pairs for access control scopes (used for filtering retrieval)
   *
   * @returns Promise resolving to { memo_uuid: string } containing the UUID of the created memo
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * const result = await skald.createMemo({
   *   title: 'Meeting Notes',
   *   content: 'Discussion about Q1 roadmap...',
   *   metadata: { type: 'notes', author: 'John Doe' },
   *   tags: ['meeting', 'q1'],
   *   source: 'notion',
   *   scopes: { department: 'engineering', team: 'backend' }
   * });
   * console.log(result.memo_uuid); // '550e8400-e29b-41d4-a716-446655440000'
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
   * @param request - The request parameters
   * @param request.memoId - The memo UUID or client reference ID
   * @param request.idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving to memo details with content, summary, tags, and chunks
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Get by UUID
   * const memo = await skald.getMemo({ memoId: '550e8400-e29b-41d4-a716-446655440000' });
   *
   * // Get by reference ID
   * const memo = await skald.getMemo({ memoId: 'external-id-123', idType: 'reference_id' });
   * ```
   */
  async getMemo(request: GetMemoRequest): Promise<Memo> {
    const { memoId, idType = 'memo_uuid' } = request;
    
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
   * @param request - The request parameters
   * @param request.memoId - The memo UUID or client reference ID
   * @param request.updateData - The fields to update (all optional)
   * @param request.idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving to { ok: true } on success
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Update by UUID
   * await skald.updateMemo({
   *   memoId: '550e8400-e29b-41d4-a716-446655440000',
   *   updateData: {
   *     title: 'Updated Title',
   *     metadata: { status: 'reviewed' }
   *   }
   * });
   *
   * // Update by reference ID and trigger reprocessing
   * await skald.updateMemo({
   *   memoId: 'external-id-123',
   *   updateData: {
   *     content: 'New content that will be reprocessed'
   *   },
   *   idType: 'reference_id'
   * });
   * ```
   */
  async updateMemo(request: UpdateMemoRequest): Promise<UpdateMemoResponse> {
    const { memoId, updateData, idType = 'memo_uuid' } = request;
    
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
   * @param request - The request parameters
   * @param request.memoId - The memo UUID or client reference ID
   * @param request.idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving to { ok: true } when deletion is complete
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Delete by UUID
   * await skald.deleteMemo({ memoId: '550e8400-e29b-41d4-a716-446655440000' });
   *
   * // Delete by reference ID
   * await skald.deleteMemo({ memoId: 'external-id-123', idType: 'reference_id' });
   * ```
   */
  async deleteMemo(request: DeleteMemoRequest): Promise<DeleteMemoResponse> {
    const { memoId, idType = 'memo_uuid' } = request;
    
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

    return { ok: true };
  }

  /**
   * Search through memos using semantic search with optional filtering.
   *
   * @param searchParams - The search parameters
   * @param searchParams.query - The search query string (required)
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
   *   limit: 10,
   * });
   *
   * // Search with filters
   * const filtered = await skald.search({
   *   query: 'python tutorial',
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
   *
   * // Search with scope filtering
   * const scoped = await skald.search({
   *   query: 'deployment guide',
   *   filters: [
   *     {
   *       field: 'department',
   *       operator: 'eq',
   *       value: 'engineering',
   *       filter_type: 'scope'
   *     }
   *   ]
   * });
   * ```
   */
  async search(searchParams: SearchRequest): Promise<SearchResponse> {
    const url = `${this.baseUrl}/api/v1/search`;

    if (searchParams.scopes) {
      searchParams = {
        ...searchParams,
        filters: [
          ...(searchParams.filters || []),
          ...Object.entries(searchParams.scopes).map(([key, value]) => ({
            field: key,
            operator: 'eq' as FilterOperator,
            value: value,
            filter_type: 'scope' as FilterType,
          })),

        ]
      }
    }
    
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
   * @param chatParams.scopes - Optional key-value pairs for access control scopes (used for filtering retrieval)
   * @param chatParams.chat_id - Optional chat ID to continue a conversation
   * @param chatParams.system_prompt - Optional system prompt to guide the AI's behavior
   * @param chatParams.filters - Optional array of filters to narrow the search context
   *
   * @returns Promise resolving to the response text
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
   *   system_prompt: 'You are a security expert. You are responsible for answering questions about our security practices.',
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
   * // Chat with scopes to focus on specific departments
   * const scoped = await skald.chat({
   *   query: 'What are our security practices?',
   *   scopes: { department: 'engineering' }
   * });
   *
   * console.log(result);
   * // "The main points discussed in the Q1 meeting were:
   * // 1. Revenue targets [[1]]
   * // 2. Hiring plans [[2]]"
   * ```
   */
  async chat(chatParams: Omit<ChatRequest, 'stream'>): Promise<ChatResponse> {
    const url = `${this.baseUrl}/api/v1/chat`;


    if (chatParams.scopes) {
      chatParams = {
        ...chatParams,
        filters: [
          ...(chatParams.filters || []),
          ...Object.entries(chatParams.scopes).map(([key, value]) => ({
            field: key,
            operator: 'eq' as FilterOperator,
            value: value,
            filter_type: 'scope' as FilterType,
          })),
        ]
      }
    }

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

    const jsonResponse = await response.json() as ChatResponse;
    return jsonResponse;
  }

  /**
   * Ask questions about your knowledge base using an AI agent with streaming responses and optional filtering.
   * Returns an async generator that yields tokens as they arrive.
   *
   * @param chatParams - The chat parameters
   * @param chatParams.query - The question to ask (required)
   * @param chatParams.chat_id - Optional chat ID to continue a conversation
   * @param chatParams.system_prompt - Optional system prompt to guide the AI's behavior
   * @param chatParams.filters - Optional array of filters to narrow the search context
   *
   * @returns AsyncGenerator yielding chat stream events (tokens and done event)
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * const stream = skald.streamedChat({
   *   query: 'What were the main points discussed in the Q1 meeting?',
   *   system_prompt: 'You are a security expert. You are responsible for answering questions about our security practices.',
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

    // Convert scopes shorthand to filters
    if (chatParams.scopes) {
      chatParams = {
        ...chatParams,
        filters: [
          ...(chatParams.filters || []),
          ...Object.entries(chatParams.scopes).map(([key, value]) => ({
            field: key,
            operator: 'eq' as FilterOperator,
            value: value,
            filter_type: 'scope' as FilterType,
          })),
        ],
      };
      delete (chatParams as any).scopes;
    }

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
   * Create a memo from a file upload. Supports PDF, DOC, DOCX, and PPTX files up to 100MB.
   * The file will be processed asynchronously and converted into a memo.
   *
   * @param fileData - The file upload parameters
   * @param fileData.file - The file content as Buffer or Blob (required)
   * @param fileData.title - The title of the memo (optional, max 255 characters)
   * @param fileData.filename - The name of the file including extension (required)
   * @param fileData.reference_id - Optional external reference ID (max 255 characters)
   * @param fileData.metadata - Optional custom JSON metadata
   * @param fileData.tags - Optional array of tags for categorization
   * @param fileData.source - Optional source system name (max 255 characters)
   * @param fileData.scopes - Optional key-value pairs for access control scopes (used for filtering retrieval)
   *
   * @returns Promise resolving to { ok: true, memo_uuid: string } with the UUID for status tracking
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * import * as fs from 'fs';
   *
   * const fileBuffer = fs.readFileSync('./document.pdf');
   * const result = await skald.createMemoFromFile({
   *   file: fileBuffer,
   *   filename: 'document.pdf',
   *   metadata: { type: 'report', department: 'engineering' },
   *   tags: ['report', '2024'],
   *   source: 'google-drive',
   *   scopes: { department: 'engineering', access_level: 'internal' }
   * });
   * console.log(result.memo_uuid); // '550e8400-e29b-41d4-a716-446655440000'
   *
   * // Poll for processing status
   * const status = await skald.checkMemoStatus(result.memo_uuid);
   * console.log(status.status); // 'processing' | 'processed' | 'error'
   * ```
   */
  async createMemoFromFile(fileData: MemoFileData): Promise<CreateMemoFromFileResponse> {
    const url = `${this.baseUrl}/api/v1/memo`;

    const formData = new FormData();
    formData.append('file', new Blob([fileData.file]), fileData.filename);

    if (fileData.title) {
      formData.append('title', fileData.title);
    }
    if (fileData.reference_id) {
      formData.append('reference_id', fileData.reference_id);
    }
    if (fileData.metadata) {
      formData.append('metadata', JSON.stringify(fileData.metadata));
    }
    if (fileData.tags) {
      formData.append('tags', JSON.stringify(fileData.tags));
    }
    if (fileData.source) {
      formData.append('source', fileData.source);
    }
    if (fileData.scopes) {
      formData.append('scopes', JSON.stringify(fileData.scopes));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Skald API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<CreateMemoFromFileResponse>;
  }

  /**
   * Check the processing status of a memo by UUID or reference ID.
   * Use this to monitor asynchronous processing of uploaded files or created memos.
   *
   * @param request - The request parameters
   * @param request.memoId - The memo UUID or client reference ID
   * @param request.idType - The type of identifier ('memo_uuid' or 'reference_id', default: 'memo_uuid')
   *
   * @returns Promise resolving to status response with processing state and optional error reason
   * @throws Error if the API request fails with status code and error message
   *
   * @example
   * ```typescript
   * // Check status by UUID
   * const status = await skald.checkMemoStatus({ memoId: '550e8400-e29b-41d4-a716-446655440000' });
   * console.log(status.status); // 'processing' | 'processed' | 'error'
   *
   * if (status.status === 'error') {
   *   console.error('Processing failed:', status.error_reason);
   * }
   *
   * // Check by reference ID
   * const status2 = await skald.checkMemoStatus({ memoId: 'my-ref-id', idType: 'reference_id' });
   *
   * // Poll until processing completes
   * while (true) {
   *   const status = await skald.checkMemoStatus({ memoId: memoUuid });
   *   if (status.status === 'processed') {
   *     console.log('Processing complete!');
   *     break;
   *   } else if (status.status === 'error') {
   *     console.error('Processing failed:', status.error_reason);
   *     break;
   *   }
   *   await new Promise(resolve => setTimeout(resolve, 2000));
   * }
   * ```
   */
  async checkMemoStatus(request: CheckMemoStatusRequest): Promise<MemoStatusResponse> {
    const { memoId, idType = 'memo_uuid' } = request;
    
    if (idType !== 'memo_uuid' && idType !== 'reference_id') {
      throw new Error(`Invalid idType: ${idType}. Must be 'memo_uuid' or 'reference_id'.`);
    }

    const url = new URL(`${this.baseUrl}/api/v1/memo/${encodeURIComponent(memoId)}/status`);
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

    return response.json() as Promise<MemoStatusResponse>;
  }

}
