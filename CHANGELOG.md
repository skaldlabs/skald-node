# Changelog

## 0.3.1

- Added support for the `chat_id` param on `chat` and `streamedChat`

## 0.3.0

- Added `createMemoFromFile` supporting document uploads (PDFs, Power Points, Word documents)
- Added `checkMemoStatus` to check if a memo has been fully processed
- Update `chat` to respond with `ChatResponse` instead of a string

## 0.2.2

- Updated the return type for `createMemo` -- now returns `{ "memo_uuid": <uuid> }`

## 0.2.1

- Removed `generate` and `streamedGenerate` methods
- Removed `search_method` from search, now uses semantic search and is no longer configurable
- `chat` method now returns the actual response content from the model rather than a JSON response.