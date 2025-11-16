import { Skald } from '../index';

// Mock the global fetch function
global.fetch = jest.fn();

describe('Skald Client - New Features', () => {
  let skald: Skald;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.test.com';

  beforeEach(() => {
    skald = new Skald(mockApiKey, mockBaseUrl);
    jest.clearAllMocks();
  });

  describe('getMemo', () => {
    it('should get memo by UUID', async () => {
      const mockMemo = {
        uuid: 'test-uuid',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        title: 'Test Memo',
        content: 'Test content',
        summary: 'Test summary',
        content_length: 1234,
        metadata: { type: 'test' },
        client_reference_id: null,
        source: 'notion',
        type: 'document',
        expiration_date: null,
        archived: false,
        pending: false,
        tags: [{ uuid: 'tag-uuid', tag: 'test' }],
        chunks: [{ uuid: 'chunk-uuid', chunk_content: 'chunk', chunk_index: 0 }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMemo,
      });

      const result = await skald.getMemo({ memoId: 'test-uuid' });

      expect(result).toEqual(mockMemo);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo/test-uuid`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
          },
        }
      );
    });

    it('should get memo by reference ID', async () => {
      const mockMemo = {
        uuid: 'test-uuid',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        title: 'Test Memo',
        content: 'Test content',
        summary: 'Test summary',
        content_length: 1234,
        metadata: {},
        client_reference_id: 'ref-123',
        source: null,
        type: 'document',
        expiration_date: null,
        archived: false,
        pending: false,
        tags: [],
        chunks: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMemo,
      });

      const result = await skald.getMemo({ memoId: 'ref-123', idType: 'reference_id' });

      expect(result).toEqual(mockMemo);
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('id_type=reference_id');
      expect(callUrl).toContain('/api/v1/memo/ref-123');
    });

    it('should handle special characters in memo ID', async () => {
      const mockMemo = {
        uuid: 'test-uuid',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        title: 'Test',
        content: 'Test',
        summary: 'Test',
        content_length: 4,
        metadata: {},
        client_reference_id: 'ref/with/slashes',
        source: null,
        type: 'document',
        expiration_date: null,
        archived: false,
        pending: false,
        tags: [],
        chunks: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMemo,
      });

      await skald.getMemo({ memoId: 'ref/with/slashes', idType: 'reference_id' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('ref%2Fwith%2Fslashes');
    });

    it('should throw error when memo not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Memo not found',
      });

      await expect(skald.getMemo({ memoId: 'nonexistent' })).rejects.toThrow(
        'Skald API error (404): Memo not found'
      );
    });
  });

  describe('listMemos', () => {
    it('should list memos with default parameters', async () => {
      const mockResponse = {
        count: 45,
        next: 'http://api.example.com/api/v1/memo?page=2',
        previous: null,
        results: [
          {
            uuid: 'memo-1',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            title: 'Memo 1',
            summary: 'Summary 1',
            content_length: 100,
            metadata: {},
            client_reference_id: null,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await skald.listMemos();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
          },
        }
      );
    });

    it('should list memos with pagination parameters', async () => {
      const mockResponse = {
        count: 100,
        next: null,
        previous: 'http://api.example.com/api/v1/memo?page=1',
        results: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await skald.listMemos({ page: 2, page_size: 50 });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('page_size=50');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(skald.listMemos()).rejects.toThrow(
        'Skald API error (500): Internal Server Error'
      );
    });
  });

  describe('updateMemo', () => {
    it('should update memo by UUID', async () => {
      const mockResponse = { ok: true };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const updateData = {
        title: 'Updated Title',
        metadata: { status: 'reviewed' },
      };

      const result = await skald.updateMemo({ memoId: 'test-uuid', updateData });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo/test-uuid`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify(updateData),
        }
      );
    });

    it('should update memo by reference ID', async () => {
      const mockResponse = { ok: true };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const updateData = {
        content: 'New content',
      };

      await skald.updateMemo({ memoId: 'ref-123', updateData, idType: 'reference_id' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('id_type=reference_id');
      expect(callUrl).toContain('/api/v1/memo/ref-123');
    });

    it('should update all fields', async () => {
      const mockResponse = { ok: true };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const updateData = {
        title: 'New Title',
        content: 'New content',
        metadata: { key: 'value' },
        client_reference_id: 'new-ref',
        source: 'updated-source',
        expiration_date: '2025-12-31T23:59:59Z',
      };

      await skald.updateMemo({ memoId: 'test-uuid', updateData });

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody).toEqual(updateData);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Access denied',
      });

      await expect(
        skald.updateMemo({ memoId: 'test-uuid', updateData: { title: 'New' } })
      ).rejects.toThrow('Skald API error (403): Access denied');
    });
  });

  describe('deleteMemo', () => {
    it('should delete memo by UUID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await skald.deleteMemo({ memoId: 'test-uuid' });

      expect(result).toEqual({ ok: true });
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo/test-uuid`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
          },
        }
      );
    });

    it('should delete memo by reference ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await skald.deleteMemo({ memoId: 'ref-123', idType: 'reference_id' });

      expect(result).toEqual({ ok: true });
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('id_type=reference_id');
      expect(callUrl).toContain('/api/v1/memo/ref-123');
    });

    it('should throw error when memo not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Memo not found',
      });

      await expect(skald.deleteMemo({ memoId: 'nonexistent' })).rejects.toThrow(
        'Skald API error (404): Memo not found'
      );
    });

    it('should throw error on access denied', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Resource does not belong to the project',
      });

      await expect(skald.deleteMemo({ memoId: 'test-uuid' })).rejects.toThrow(
        'Skald API error (403): Resource does not belong to the project'
      );
    });
  });

  describe('filters support', () => {
    describe('search with filters', () => {
      it('should search with native field filter', async () => {
        const mockResponse = {
          results: [
            {
              uuid: 'test-uuid',
              title: 'Test Memo',
              summary: 'Summary',
              content_snippet: 'Snippet',
              distance: 0.5,
            },
          ],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await skald.search({
          query: 'test',
          filters: [
            {
              field: 'source',
              operator: 'eq',
              value: 'notion',
              filter_type: 'native_field',
            },
          ],
        });

        expect(result).toEqual(mockResponse);
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters).toHaveLength(1);
        expect(callBody.filters[0]).toEqual({
          field: 'source',
          operator: 'eq',
          value: 'notion',
          filter_type: 'native_field',
        });
      });

      it('should search with multiple filters', async () => {
        const mockResponse = { results: [] };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.search({
          query: 'test',
          filters: [
            {
              field: 'source',
              operator: 'eq',
              value: 'notion',
              filter_type: 'native_field',
            },
            {
              field: 'level',
              operator: 'eq',
              value: 'beginner',
              filter_type: 'custom_metadata',
            },
            {
              field: 'tags',
              operator: 'in',
              value: ['tutorial', 'guide'],
              filter_type: 'native_field',
            },
          ],
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters).toHaveLength(3);
      });

      it('should search with array value filters', async () => {
        const mockResponse = { results: [] };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.search({
          query: 'test',
          filters: [
            {
              field: 'tags',
              operator: 'in',
              value: ['tag1', 'tag2', 'tag3'],
              filter_type: 'native_field',
            },
          ],
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters[0].value).toEqual(['tag1', 'tag2', 'tag3']);
      });
    });

    describe('chat with filters', () => {
      it('should chat with filters', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer with citations [[1]]',
          intermediate_steps: [],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await skald.chat({
          query: 'What is this?',
          filters: [
            {
              field: 'source',
              operator: 'eq',
              value: 'docs',
              filter_type: 'native_field',
            },
          ],
        });

        expect(result).toEqual(mockResponse);
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters).toBeDefined();
        expect(callBody.filters).toHaveLength(1);
      });

      it('should chat without filters', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'What is this?',
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters).toBeUndefined();
      });
    });

    describe('streamedChat with filters', () => {
      it('should stream chat with filters', async () => {
        const mockStreamData = `data: {"type":"token","content":"test"}\ndata: {"type":"done"}\n`;

        const mockReader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockStreamData),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
          releaseLock: jest.fn(),
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => mockReader,
          },
        });

        const events = [];
        for await (const event of skald.streamedChat({
          query: 'test',
          filters: [
            {
              field: 'tags',
              operator: 'in',
              value: ['meeting'],
              filter_type: 'native_field',
            },
          ],
        })) {
          events.push(event);
        }

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters).toBeDefined();
        expect(events).toHaveLength(2);
      });
    });

    describe('filter operators', () => {
      it('should support eq operator', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        });

        await skald.search({
          query: 'test',
          filters: [
            {
              field: 'source',
              operator: 'eq',
              value: 'notion',
              filter_type: 'native_field',
            },
          ],
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters[0].operator).toBe('eq');
      });

      it('should support contains operator', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        });

        await skald.search({
          query: 'test',
          filters: [
            {
              field: 'title',
              operator: 'contains',
              value: 'tutorial',
              filter_type: 'native_field',
            },
          ],
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters[0].operator).toBe('contains');
      });

      it('should support in operator with array', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        });

        await skald.search({
          query: 'test',
          filters: [
            {
              field: 'source',
              operator: 'in',
              value: ['notion', 'confluence', 'docs'],
              filter_type: 'native_field',
            },
          ],
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.filters[0].operator).toBe('in');
        expect(Array.isArray(callBody.filters[0].value)).toBe(true);
        expect(callBody.filters[0].value).toHaveLength(3);
      });
    });
  });

  describe('RAG config support', () => {
    describe('chat with rag_config', () => {
      it('should send rag_config with all properties', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer with references [[1]]',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await skald.chat({
          query: 'What is this?',
          rag_config: {
            llmProvider: 'anthropic',
            queryRewrite: {
              enabled: true,
            },
            vectorSearch: {
              topK: 150,
              similarityThreshold: 0.7,
            },
            reranking: {
              enabled: true,
              topK: 30,
            },
            references: {
              enabled: true,
            },
          },
        });

        expect(result).toEqual(mockResponse);
        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config).toBeDefined();
        expect(callBody.rag_config.llmProvider).toBe('anthropic');
        expect(callBody.rag_config.queryRewrite.enabled).toBe(true);
        expect(callBody.rag_config.vectorSearch.topK).toBe(150);
        expect(callBody.rag_config.vectorSearch.similarityThreshold).toBe(0.7);
        expect(callBody.rag_config.reranking.enabled).toBe(true);
        expect(callBody.rag_config.reranking.topK).toBe(30);
        expect(callBody.rag_config.references.enabled).toBe(true);
      });

      it('should send partial rag_config', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'What is this?',
          rag_config: {
            llmProvider: 'openai',
            reranking: {
              enabled: false,
              topK: 20,
            },
          },
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config).toBeDefined();
        expect(callBody.rag_config.llmProvider).toBe('openai');
        expect(callBody.rag_config.reranking.enabled).toBe(false);
        expect(callBody.rag_config.reranking.topK).toBe(20);
        expect(callBody.rag_config.queryRewrite).toBeUndefined();
        expect(callBody.rag_config.vectorSearch).toBeUndefined();
      });

      it('should work without rag_config', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'What is this?',
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config).toBeUndefined();
      });

      it('should combine rag_config with filters and system_prompt', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'What are best practices?',
          system_prompt: 'You are a helpful assistant.',
          filters: [
            {
              field: 'source',
              operator: 'eq',
              value: 'docs',
              filter_type: 'native_field',
            },
          ],
          rag_config: {
            llmProvider: 'groq',
            vectorSearch: {
              topK: 100,
              similarityThreshold: 0.8,
            },
          },
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.query).toBe('What are best practices?');
        expect(callBody.system_prompt).toBe('You are a helpful assistant.');
        expect(callBody.filters).toHaveLength(1);
        expect(callBody.rag_config).toBeDefined();
        expect(callBody.rag_config.llmProvider).toBe('groq');
      });

      it('should support all LLM providers', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        const providers: Array<'openai' | 'anthropic' | 'groq'> = ['openai', 'anthropic', 'groq'];

        for (const provider of providers) {
          (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
          });

          await skald.chat({
            query: 'test',
            rag_config: {
              llmProvider: provider,
            },
          });

          const calls = (global.fetch as jest.Mock).mock.calls;
          const callBody = JSON.parse(calls[calls.length - 1][1].body);
          expect(callBody.rag_config.llmProvider).toBe(provider);
        }
      });
    });

    describe('streamedChat with rag_config', () => {
      it('should send rag_config with streaming', async () => {
        const mockStreamData = `data: {"type":"token","content":"test"}\ndata: {"type":"done","chat_id":"chat-123"}\n`;

        const mockReader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockStreamData),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
          releaseLock: jest.fn(),
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => mockReader,
          },
        });

        const events = [];
        for await (const event of skald.streamedChat({
          query: 'test',
          rag_config: {
            llmProvider: 'anthropic',
            queryRewrite: {
              enabled: false,
            },
            vectorSearch: {
              topK: 80,
              similarityThreshold: 0.9,
            },
            reranking: {
              enabled: true,
              topK: 40,
            },
          },
        })) {
          events.push(event);
        }

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config).toBeDefined();
        expect(callBody.rag_config.llmProvider).toBe('anthropic');
        expect(callBody.rag_config.queryRewrite.enabled).toBe(false);
        expect(callBody.rag_config.vectorSearch.topK).toBe(80);
        expect(callBody.stream).toBe(true);
        expect(events).toHaveLength(2);
      });

      it('should stream without rag_config', async () => {
        const mockStreamData = `data: {"type":"token","content":"test"}\ndata: {"type":"done"}\n`;

        const mockReader = {
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockStreamData),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
          releaseLock: jest.fn(),
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => mockReader,
          },
        });

        const events = [];
        for await (const event of skald.streamedChat({
          query: 'test',
        })) {
          events.push(event);
        }

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config).toBeUndefined();
        expect(callBody.stream).toBe(true);
      });
    });

    describe('rag_config edge cases', () => {
      it('should handle empty rag_config object', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'test',
          rag_config: {},
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config).toEqual({});
      });

      it('should handle only references config', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer [[1]]',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'test',
          rag_config: {
            references: {
              enabled: true,
            },
          },
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config.references.enabled).toBe(true);
      });

      it('should handle boundary values for vectorSearch', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'test',
          rag_config: {
            vectorSearch: {
              topK: 1,
              similarityThreshold: 0.0,
            },
          },
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config.vectorSearch.topK).toBe(1);
        expect(callBody.rag_config.vectorSearch.similarityThreshold).toBe(0.0);
      });

      it('should handle maximum boundary values', async () => {
        const mockResponse = {
          ok: true,
          response: 'Answer',
          intermediate_steps: [],
          chat_id: 'chat-123',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        await skald.chat({
          query: 'test',
          rag_config: {
            vectorSearch: {
              topK: 200,
              similarityThreshold: 1.0,
            },
            reranking: {
              enabled: true,
              topK: 100,
            },
          },
        });

        const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(callBody.rag_config.vectorSearch.topK).toBe(200);
        expect(callBody.rag_config.vectorSearch.similarityThreshold).toBe(1.0);
        expect(callBody.rag_config.reranking.topK).toBe(100);
      });
    });
  });
});
