# Changelog

# 0.2.2

- Updated the return type for `createMemo` -- now returns `{ "memo_uuid": <uuid> }`

# 0.2.1

- Removed `generate` and `streamedGenerate` methods
- Removed `search_method` from search, now uses semantic search and is no longer configurable
- `chat` method now returns the actual response content from the model rather than a JSON response.