# Addon Development TODO List

This document tracks the ongoing development tasks and bug fixes for the Stremio Adult Addon.

## High Priority

- [ ] **Restore Missing P2P Streams (Regression):**
  - [ ] P2P links are missing for torrents from all scrapers (1337x, Jackett), not just search.
  - [ ] This is a critical regression that needs to be fixed immediately.
  - [ ] Thoroughly investigate `streamHandler.js` to find and fix the logic error causing P2P streams to be omitted.

- [ ] **Fix Slow Search Performance:**
  - [ ] The `1337x` scraper is calling `getTorrentDetails` for every result, causing major slowdowns.
  - [ ] Refactor `1337x.js` to stop making extra network requests during the initial search. Defer this work to the `metaHandler` or `streamHandler` (lazy loading).

- [ ] **Fix Multi-File Torrent Handling:**
  - [ ] Torrents with many video files are still not being listed individually.
  - [ ] Re-verify the `streamHandler` logic to ensure it correctly parses all torrents (especially on-demand magnet links) and creates a stream for each video file.

## Medium Priority

- [ ] **Display Video Count in Metadata:**
  - [ ] Show the number of videos in a torrent (e.g., "Contains 73 video files").
  - [ ] This should be implemented in the `metaHandler`.

## Low Priority

- [ ] **Investigate P2P Buffering:**
  - [ ] Research `stremio-addon-sdk` `behaviorHints` for any flags that can influence client-side caching.
  - [ ] Add a description to P2P streams informing users that cache size can be increased in Stremio settings.

---

## Backlog

- [ ] **Fix FansDB Integration:**
  - [ ] The API request is failing with an "unknown field" error.
  - [ ] The official API documentation is available at: https://docs.fansdb.cc/
  - [ ] When working on this, use "Lena the Plug" as a test case.

- [ ] **Versioning and Commits:**
  - [ ] After each major fix, bump the version in `package.json` and `src/config/manifest.js`.
  - [ ] Create clear and meaningful commit messages.
