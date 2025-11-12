import { Skald } from '../index';

// Mock the global fetch function
global.fetch = jest.fn();

describe('Skald Client - File Upload and Status Features', () => {
  let skald: Skald;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.test.com';

  beforeEach(() => {
    skald = new Skald(mockApiKey, mockBaseUrl);
    jest.clearAllMocks();
  });

  describe('createMemoFromFile', () => {
    it('should successfully upload a file', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: '550e8400-e29b-41d4-a716-446655440000',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fileBuffer = Buffer.from('test file content');
      const result = await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'test.pdf',
        metadata: { type: 'report' },
        tags: ['test', 'document'],
        source: 'google-drive',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo/upload`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
          },
        })
      );

      // Verify FormData was created properly
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeInstanceOf(FormData);
    });

    it('should upload a file with minimal parameters', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: 'test-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fileBuffer = Buffer.from('test content');
      const result = await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'document.docx',
      });

      expect(result).toEqual(mockResponse);
      expect(result.memo_uuid).toBe('test-uuid');
    });

    it('should upload a file with reference_id', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: 'test-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fileBuffer = Buffer.from('test content');
      await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'presentation.pptx',
        reference_id: 'external-ref-123',
      });

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeInstanceOf(FormData);
    });

    it('should handle PDF files', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: 'pdf-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fileBuffer = Buffer.from('%PDF-1.4 mock pdf content');
      const result = await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'report.pdf',
        metadata: { department: 'engineering', year: '2024' },
      });

      expect(result.memo_uuid).toBe('pdf-uuid');
    });

    it('should handle DOCX files', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: 'docx-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fileBuffer = Buffer.from('mock docx content');
      const result = await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'document.docx',
      });

      expect(result.memo_uuid).toBe('docx-uuid');
    });

    it('should handle Blob instead of Buffer', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: 'blob-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const result = await skald.createMemoFromFile({
        file: blob,
        filename: 'blob-test.pdf',
      });

      expect(result.memo_uuid).toBe('blob-uuid');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'File too large',
      });

      const fileBuffer = Buffer.from('test content');

      await expect(
        skald.createMemoFromFile({
          file: fileBuffer,
          filename: 'large.pdf',
        })
      ).rejects.toThrow('Skald API error (400): File too large');
    });

    it('should throw error for unsupported file type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Unsupported file type',
      });

      const fileBuffer = Buffer.from('test content');

      await expect(
        skald.createMemoFromFile({
          file: fileBuffer,
          filename: 'unsupported.txt',
        })
      ).rejects.toThrow('Skald API error (400): Unsupported file type');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const fileBuffer = Buffer.from('test content');

      await expect(
        skald.createMemoFromFile({
          file: fileBuffer,
          filename: 'test.pdf',
        })
      ).rejects.toThrow('Network error');
    });

    it('should properly encode metadata and tags as JSON', async () => {
      const mockResponse = {
        ok: true,
        memo_uuid: 'test-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const fileBuffer = Buffer.from('test content');
      const metadata = { complex: { nested: 'value' }, array: [1, 2, 3] };
      const tags = ['tag1', 'tag2', 'tag3'];

      await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'test.pdf',
        metadata,
        tags,
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('checkMemoStatus', () => {
    it('should check status by UUID with processing status', async () => {
      const mockStatus = {
        status: 'processing' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await skald.checkMemoStatus('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toEqual(mockStatus);
      expect(result.status).toBe('processing');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/memo/550e8400-e29b-41d4-a716-446655440000/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
          },
        }
      );
    });

    it('should check status with processed status', async () => {
      const mockStatus = {
        status: 'processed' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await skald.checkMemoStatus('test-uuid');

      expect(result.status).toBe('processed');
      expect(result.error_reason).toBeUndefined();
    });

    it('should check status with error status and error reason', async () => {
      const mockStatus = {
        status: 'error' as const,
        error_reason: 'Failed to parse PDF: corrupted file',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await skald.checkMemoStatus('error-uuid');

      expect(result.status).toBe('error');
      expect(result.error_reason).toBe('Failed to parse PDF: corrupted file');
    });

    it('should check status by reference ID', async () => {
      const mockStatus = {
        status: 'processed' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await skald.checkMemoStatus('ref-123', 'reference_id');

      expect(result).toEqual(mockStatus);
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('id_type=reference_id');
      expect(callUrl).toContain('/api/v1/memo/ref-123/status');
    });

    it('should handle special characters in memo ID', async () => {
      const mockStatus = {
        status: 'processed' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      await skald.checkMemoStatus('ref/with/slashes', 'reference_id');

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('ref%2Fwith%2Fslashes');
    });

    it('should throw error for invalid idType', async () => {
      await expect(
        // @ts-expect-error Testing invalid idType
        skald.checkMemoStatus('test-uuid', 'invalid_type')
      ).rejects.toThrow("Invalid idType: invalid_type. Must be 'memo_uuid' or 'reference_id'.");
    });

    it('should throw error when memo not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Memo not found',
      });

      await expect(
        skald.checkMemoStatus('nonexistent-uuid')
      ).rejects.toThrow('Skald API error (404): Memo not found');
    });

    it('should throw error on unauthorized access', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        skald.checkMemoStatus('test-uuid')
      ).rejects.toThrow('Skald API error (401): Unauthorized');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        skald.checkMemoStatus('test-uuid')
      ).rejects.toThrow('Network error');
    });
  });

  describe('File upload and status workflow', () => {
    it('should support complete upload and status check workflow', async () => {
      // Mock file upload
      const uploadResponse = {
        ok: true,
        memo_uuid: 'workflow-test-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => uploadResponse,
      });

      // Upload file
      const fileBuffer = Buffer.from('test document content');
      const uploadResult = await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'workflow-test.pdf',
        metadata: { test: 'workflow' },
      });

      expect(uploadResult.memo_uuid).toBe('workflow-test-uuid');

      // Mock status check - processing
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processing' }),
      });

      const status1 = await skald.checkMemoStatus(uploadResult.memo_uuid);
      expect(status1.status).toBe('processing');

      // Mock status check - processed
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processed' }),
      });

      const status2 = await skald.checkMemoStatus(uploadResult.memo_uuid);
      expect(status2.status).toBe('processed');
    });

    it('should handle error during processing workflow', async () => {
      // Mock file upload
      const uploadResponse = {
        ok: true,
        memo_uuid: 'error-workflow-uuid',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => uploadResponse,
      });

      const fileBuffer = Buffer.from('corrupted content');
      const uploadResult = await skald.createMemoFromFile({
        file: fileBuffer,
        filename: 'corrupted.pdf',
      });

      // Mock status check - error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'error',
          error_reason: 'Corrupted PDF file',
        }),
      });

      const status = await skald.checkMemoStatus(uploadResult.memo_uuid);
      expect(status.status).toBe('error');
      expect(status.error_reason).toBe('Corrupted PDF file');
    });
  });
});
