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
}

export interface CreateMemoResponse {
  ok: boolean;
}

export type SearchMethod = 
  | 'chunk_vector_search'
  | 'title_contains'
  | 'title_startswith';

export interface SearchRequest {
  query: string;
  search_method: SearchMethod;
  limit?: number;
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
   * Search through memos using various search methods.
   * 
   * @param searchParams - The search parameters
   * @param searchParams.query - The search query string (required)
   * @param searchParams.search_method - The search method to use (required):
   *   - `chunk_vector_search`: Semantic search on memo chunks for detailed content search
   *   - `title_contains`: Case-insensitive substring match on memo titles
   *   - `title_startswith`: Case-insensitive prefix match on memo titles
   * @param searchParams.limit - Maximum number of results to return (1-50, default 10)
   * 
   * @returns Promise resolving to search results with memo details and relevance scores
   * @throws Error if the API request fails with status code and error message
   * 
   * @example
   * ```typescript
   * // Semantic search on memo summaries
   * const results = await skald.search({
   *   query: 'quarterly goals',
   *   search_method: 'chunk_vector_search',
   *   limit: 10,
   * });
   * 
   * // Title search
   * const titleResults = await skald.search({
   *   query: 'Meeting',
   *   search_method: 'title_contains',
   *   limit: 5
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
   * Ask questions about your knowledge base using an AI agent (non-streaming).
   * 
   * @param chatParams - The chat parameters
   * @param chatParams.query - The question to ask (required)
   * @param chatParams.stream - Must be false or undefined for this method
   * 
   * @returns Promise resolving to chat response with answer and citations
   * @throws Error if the API request fails with status code and error message
   * 
   * @example
   * ```typescript
   * const result = await skald.chat({
   *   query: 'What were the main points discussed in the Q1 meeting?'
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
   * Ask questions about your knowledge base using an AI agent with streaming responses.
   * Returns an async generator that yields tokens as they arrive.
   * 
   * @param chatParams - The chat parameters
   * @param chatParams.query - The question to ask (required)
   * @param options - Streaming options
   * @param options.streamToConsole - If true, automatically logs tokens to console as they arrive (default: false)
   * 
   * @returns AsyncGenerator yielding chat stream events (tokens and done event)
   * @throws Error if the API request fails with status code and error message
   * 
   * @example
   * ```typescript
   * // Manual streaming
   * const stream = skald.streamedChat({
   *   query: 'What were the main points discussed in the Q1 meeting?'
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
   * // Auto-streaming to console
   * const stream2 = skald.streamedChat({
   *   query: 'What are our quarterly goals?'
   * }, { streamToConsole: true });
   * 
   * for await (const event of stream2) {
   *   // Tokens are automatically logged, just wait for completion
   *   if (event.type === 'done') {
   *     console.log('Stream completed!');
   *   }
   * }
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
}
