# Unit Tests

This directory contains comprehensive unit tests for the Skald Node.js client library.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite includes:

- **Constructor tests**: Verifying initialization with API key, base URL, and trailing slash handling
- **createMemo tests**: Testing memo creation, error handling, and metadata initialization
- **search tests**: Testing all search methods (chunk_vector_search, title_contains, title_startswith)
- **chat tests**: Testing non-streaming chat responses and error handling
- **streamedChat tests**: Testing streaming chat with chunked data, invalid JSON handling, and ping line filtering
- **generateDoc tests**: Testing document generation with and without rules parameter
- **streamedGenerateDoc tests**: Testing streaming document generation with various edge cases

## Mocking Strategy

All tests use mocked fetch responses and do not connect to an actual Skald instance. The test suite mocks:

- HTTP responses using `jest.fn()` for the global `fetch` function
- Streaming responses using mocked `ReadableStream` readers
- Various error conditions (network errors, API errors, null responses)

## Test Structure

Tests are organized by method and use the following patterns:

- Success cases with expected responses
- Error handling for API failures
- Network error handling
- Edge cases (null bodies, invalid JSON, chunked data)
- Parameter variations (optional parameters, different search methods)

## Coverage

Current test coverage is **97.56%** with:

- 97.56% statement coverage
- 94.28% branch coverage
- 100% function coverage
- 100% line coverage
