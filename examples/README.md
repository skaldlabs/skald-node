# Skald Node.js SDK Examples

This directory contains example scripts demonstrating how to use the Skald Node.js SDK.

## Prerequisites

1. Install the SDK:
   ```bash
   npm install @skald-labs/skald-node
   ```

2. Set your API key:
   ```bash
   export SKALD_API_KEY=your_api_key_here
   ```

3. For file upload examples, place a sample PDF file named `sample-document.pdf` in this directory.

## Examples

### 1. File Upload (`file-upload.ts`)

Demonstrates how to upload a file (PDF, DOC, DOCX, or PPTX) to Skald.

```bash
npx tsx examples/file-upload.ts
```

Features:
- Reading files from disk
- Uploading with metadata and tags
- Specifying a reference ID
- Error handling

### 2. Check Status (`check-status.ts`)

Shows how to check the processing status of a memo.

```bash
npx tsx examples/check-status.ts <memo-uuid>
```

Features:
- Checking processing status
- Handling different status states (processing, processed, error)
- Interpreting error reasons

### 3. Upload and Wait (`upload-and-wait.ts`)

Complete workflow example that:
1. Uploads a file
2. Polls the status until processing completes
3. Retrieves the processed memo

```bash
npx tsx examples/upload-and-wait.ts
```

Features:
- Complete file processing workflow
- Status polling with timeout
- Retrieving processed memo details

## Supported File Types

The Skald API supports the following file types:
- **PDF** (.pdf)
- **Microsoft Word** (.doc, .docx)
- **Microsoft PowerPoint** (.pptx)

Maximum file size: **100MB**

## Status States

When checking memo status, you'll receive one of these states:

- `processing`: The memo is currently being processed (parsed, summarized, chunked, indexed)
- `processed`: Processing completed successfully, memo is ready to use
- `error`: An error occurred during processing, check `error_reason` for details

## Error Handling

All examples include error handling for common scenarios:
- Invalid API key
- File not found
- Network errors
- API errors (file too large, unsupported format, etc.)
- Processing timeouts

## TypeScript Compilation

These examples are written in TypeScript. To run them:

```bash
# Using tsx (recommended for examples)
npx tsx examples/file-upload.ts

# Or compile first, then run
npx tsc examples/file-upload.ts
node examples/file-upload.js
```

## Need Help?

- Check the main README at the project root
- Visit the [Skald documentation](https://docs.useskald.com)
- Open an issue on [GitHub](https://github.com/skaldlabs/skald-node/issues)
