import { Skald } from '../index';

// Mock the global fetch function
global.fetch = jest.fn();

describe('Skald Client', () => {
  let skald: Skald;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.test.com';

  beforeEach(() => {
    skald = new Skald(mockApiKey, mockBaseUrl);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key and base URL', () => {
      expect(skald).toBeInstanceOf(Skald);
    });

    it('should use default base URL when not provided', () => {
      const defaultSkald = new Skald(mockApiKey);
      expect(defaultSkald).toBeInstanceOf(Skald);
    });

    it('should remove trailing slash from base URL', () => {
      const skaldWithSlash = new Skald(mockApiKey, 'https://api.test.com/');
      expect(skaldWithSlash).toBeInstanceOf(Skald);
    });
  });

  describe('createMemo', () => {
    it('should successfully create a memo', async () => {
      const mockResponse = { ok: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
        metadata: { type: 'test' },
        tags: ['test'],
        source: 'test-source',
      };

      const result = await skald.createMemo(memoData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify(memoData),
        }
      );
    });

    it('should initialize metadata as empty object if not provided', async () => {
      const mockResponse = { ok: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
      };

      await skald.createMemo(memoData);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const bodyData = JSON.parse(callArgs.body);
      expect(bodyData.metadata).toEqual({});
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
      };

      await expect(skald.createMemo(memoData)).rejects.toThrow(
        'Skald API error (400): Bad Request'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const memoData = {
        title: 'Test Memo',
        content: 'Test content',
      };

      await expect(skald.createMemo(memoData)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('search', () => {
    it('should successfully search with chunk_vector_search', async () => {
      const mockResponse = {
        results: [
          {
            uuid: 'test-uuid',
            title: 'Test Memo',
            summary: 'Test summary',
            content_snippet: 'Test snippet',
            distance: 0.5,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const searchParams = {
        query: 'test query',
        search_method: 'chunk_vector_search' as const,
        limit: 10,
      };

      const result = await skald.search(searchParams);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify(searchParams),
        }
      );
    });

    it('should successfully search with title_contains', async () => {
      const mockResponse = {
        results: [
          {
            uuid: 'test-uuid',
            title: 'Test Memo',
            summary: 'Test summary',
            content_snippet: 'Test snippet',
            distance: null,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const searchParams = {
        query: 'test',
        search_method: 'title_contains' as const,
      };

      const result = await skald.search(searchParams);

      expect(result).toEqual(mockResponse);
    });

    it('should successfully search with title_startswith', async () => {
      const mockResponse = {
        results: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const searchParams = {
        query: 'test',
        search_method: 'title_startswith' as const,
        limit: 5,
      };

      const result = await skald.search(searchParams);

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const searchParams = {
        query: 'test query',
        search_method: 'chunk_vector_search' as const,
      };

      await expect(skald.search(searchParams)).rejects.toThrow(
        'Skald API error (500): Internal Server Error'
      );
    });
  });

  describe('chat', () => {
    it('should successfully get chat response', async () => {
      const mockResponse = {
        ok: true,
        response: 'This is the answer',
        intermediate_steps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const chatParams = {
        query: 'What is this about?',
      };

      const result = await skald.chat(chatParams);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify({
            ...chatParams,
            stream: false,
          }),
        }
      );
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const chatParams = {
        query: 'What is this about?',
      };

      await expect(skald.chat(chatParams)).rejects.toThrow(
        'Skald API error (401): Unauthorized'
      );
    });
  });

  describe('streamedChat', () => {
    it('should successfully stream chat responses', async () => {
      const mockStreamData = `data: {"type":"token","content":"Hello"}\ndata: {"type":"token","content":" world"}\ndata: {"type":"done"}\n`;

      const mockReader = {
        read: jest.fn()
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

      const chatParams = {
        query: 'Tell me something',
      };

      const events = [];
      for await (const event of skald.streamedChat(chatParams)) {
        events.push(event);
      }

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ type: 'token', content: 'Hello' });
      expect(events[1]).toEqual({ type: 'token', content: ' world' });
      expect(events[2]).toEqual({ type: 'done' });
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should handle chunked streaming data', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"token",'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('"content":"test"}\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"done"}\n'),
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
      for await (const event of skald.streamedChat({ query: 'test' })) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'token', content: 'test' });
      expect(events[1]).toEqual({ type: 'done' });
    });

    it('should skip invalid JSON lines', async () => {
      const mockStreamData = `data: {"type":"token","content":"valid"}\ndata: invalid json\ndata: {"type":"done"}\n`;

      const mockReader = {
        read: jest.fn()
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
      for await (const event of skald.streamedChat({ query: 'test' })) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'token', content: 'valid' });
      expect(events[1]).toEqual({ type: 'done' });
    });

    it('should skip ping lines', async () => {
      const mockStreamData = `: ping\ndata: {"type":"token","content":"test"}\n: ping\ndata: {"type":"done"}\n`;

      const mockReader = {
        read: jest.fn()
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
      for await (const event of skald.streamedChat({ query: 'test' })) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
    });

    it('should throw error when response body is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const generator = skald.streamedChat({ query: 'test' });

      await expect(generator.next()).rejects.toThrow('Response body is null');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      const generator = skald.streamedChat({ query: 'test' });

      await expect(generator.next()).rejects.toThrow(
        'Skald API error (403): Forbidden'
      );
    });
  });

  describe('generateDoc', () => {
    it('should successfully generate a document', async () => {
      const mockResponse = {
        ok: true,
        response: 'Generated document content',
        intermediate_steps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const generateParams = {
        prompt: 'Create a document',
        rules: 'Use formal language',
      };

      const result = await skald.generateDoc(generateParams);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify({
            ...generateParams,
            stream: false,
          }),
        }
      );
    });

    it('should work without rules parameter', async () => {
      const mockResponse = {
        ok: true,
        response: 'Generated document content',
        intermediate_steps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const generateParams = {
        prompt: 'Create a document',
      };

      const result = await skald.generateDoc(generateParams);

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      const generateParams = {
        prompt: 'Create a document',
      };

      await expect(skald.generateDoc(generateParams)).rejects.toThrow(
        'Skald API error (404): Not Found'
      );
    });
  });

  describe('streamedGenerateDoc', () => {
    it('should successfully stream document generation', async () => {
      const mockStreamData = `data: {"type":"token","content":"Generated"}\ndata: {"type":"token","content":" content"}\ndata: {"type":"done"}\n`;

      const mockReader = {
        read: jest.fn()
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

      const generateParams = {
        prompt: 'Create a document',
        rules: 'Use bullet points',
      };

      const events = [];
      for await (const event of skald.streamedGenerateDoc(generateParams)) {
        events.push(event);
      }

      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ type: 'token', content: 'Generated' });
      expect(events[1]).toEqual({ type: 'token', content: ' content' });
      expect(events[2]).toEqual({ type: 'done' });
      expect(mockReader.releaseLock).toHaveBeenCalled();
    });

    it('should work without rules parameter', async () => {
      const mockStreamData = `data: {"type":"token","content":"test"}\ndata: {"type":"done"}\n`;

      const mockReader = {
        read: jest.fn()
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
      for await (const event of skald.streamedGenerateDoc({ prompt: 'test' })) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
    });

    it('should handle chunked streaming data', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"token",'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('"content":"doc"}\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type":"done"}\n'),
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
      for await (const event of skald.streamedGenerateDoc({ prompt: 'test' })) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'token', content: 'doc' });
      expect(events[1]).toEqual({ type: 'done' });
    });

    it('should throw error when response body is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const generator = skald.streamedGenerateDoc({ prompt: 'test' });

      await expect(generator.next()).rejects.toThrow('Response body is null');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const generator = skald.streamedGenerateDoc({ prompt: 'test' });

      await expect(generator.next()).rejects.toThrow(
        'Skald API error (500): Internal Server Error'
      );
    });

    it('should skip invalid JSON and ping lines', async () => {
      const mockStreamData = `: ping\ndata: {"type":"token","content":"valid"}\ndata: invalid\n: ping\ndata: {"type":"done"}\n`;

      const mockReader = {
        read: jest.fn()
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
      for await (const event of skald.streamedGenerateDoc({ prompt: 'test' })) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'token', content: 'valid' });
      expect(events[1]).toEqual({ type: 'done' });
    });
  });
});
