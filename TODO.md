# Addon Development TODO List

This document tracks the ongoing development tasks and bug fixes for the Stremio Adult Addon.

## High Priority

- [ ] **Fix Slow Search Performance:**
  - [ ] Search results are still loading slowly.
  - [ ] Investigate and refactor the `catalogHandler` to defer all non-essential operations (like poster generation).
  - [ ] Posters should be loaded in the `metaHandler` on-demand when a user clicks an item, not during the initial search.

- [ ] **Fix Multi-File Torrent Handling:**
  - [ ] Torrents with multiple video files (e.g., 73 clips) are not being listed individually.
  - [ ] The `streamHandler` needs to be fixed to correctly parse all torrent types (especially those from Jackett where the magnet is generated on-the-fly) and create a separate stream for each video file.

- [ ] **Fix FansDB Integration:**
  - [ ] The FansDB API request is failing with a `422 Unprocessable Entity` and an "unknown field" error.
  - [ ] Analyze the GraphQL query in `fansdbService.js` and compare it against the current FansDB API schema to find and fix the incorrect field.

## Medium Priority

- [ ] **Display Video Count in Metadata:**
  - [ ] Show the number of videos in a torrent (e.g., "Contains 73 video files").
  - [ ] This should be implemented in the `metaHandler` to avoid slowing down the catalog view. The handler will need to parse the torrent metadata to get the file count.

- [ ] **Improve TorBox Active Limit Handling:**
  - [ ] The current implementation to clear completed torrents when the limit is reached is not working reliably.
  - [ ] Ensure the error from the API is correctly interpreted and that the clearing process is robust.

## Low Priority

- [ ] **Investigate P2P Buffering:**
  - [ ] Users report significant buffering with P2P streams.
  - [ ] Research `stremio-addon-sdk` `behaviorHints` to see if the addon can suggest a larger cache or pre-fetch size to the client.
  - [ ] Add a note to the user that this is primarily a client-side setting.

- [ ] **Versioning and Commits:**
  - [ ] After each major fix, bump the version in `package.json` and `src/config/manifest.js`.
  - [ ] Create clear and meaningful commit messages for each set of changes.
