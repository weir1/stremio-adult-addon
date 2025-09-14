# Stremio Addon Playback Issue Summary

This document outlines a critical playback issue, its root cause, and the implemented solution for the Stremio Adult Addon.

## 1. The Problem

Initially, no content would play from the addon. After a fix was implemented, playback worked for some, but not all, video files. When an item was selected in Stremio, the client would display the error: “No addons were requested for this meta.” This indicated that the client was not associating the selected media with this addon, and therefore, was not sending a request to get a stream link, preventing the play button from appearing.

## 2. Root Cause Analysis

The issue stemmed from how the Stremio client discovers and routes requests for content that doesn't originate from a standard catalog (e.g., Cinemeta).

- **Missing Resource-Level `idPrefixes`**: The addon's manifest (`manifest.js`) was missing `idPrefixes` declarations at the individual resource level for `meta` and `stream`. Relying on a top-level `idPrefixes` array is insufficient for custom IDs, as some Stremio clients require per-resource declarations to associate content correctly.

- **Client-Addon Ownership Mismatch**: Stremio routes non-catalog requests by matching an item's ID prefix against the `idPrefixes` advertised by an addon's `meta` and `stream` resources. Without these specific declarations, the client had no way of knowing that this addon "owned" the metadata for the selected item.

- **Failed Stream Request**: Because the client never established the addon's ownership of the metadata, it never proceeded to the next step: requesting a stream. Even with a perfectly functional stream handler, it was never called.

## 3. The Solution

The fix involved updating the addon's manifest and implementing the necessary handlers to conform to the official Stremio addon documentation for handling custom and non-Cinemeta IDs.

- **Manifest Update**: In `src/config/manifest.js`, the `resources` array was modified. Instead of plain strings, `meta` and `stream` were declared as objects, each containing a `idPrefixes` array. This explicitly tells the Stremio client that this addon can provide metadata and streams for items whose IDs match the given prefixes.

  ```javascript
  // src/config/manifest.js
  const ID_PREFIXES = ['T25','TW9','TWl','UG9','Qnl','TW9t'];

  const manifest = {
    // ...
    resources: [
      'catalog',
      { name: 'meta', types: ['movie'], idPrefixes: ID_PREFIXES },
      { name: 'stream', types: ['movie'], idPrefixes: ID_PREFIXES }
    ],
    // ...
  };
  ```

- **Meta Handler Implementation**: A `metaHandler` was implemented (`src/handlers/metaHandler.js`). When the client finds a matching `idPrefixes` for a `meta` request, it calls this handler. The handler returns a `meta` object, confirming to the client that the addon owns the content.

- **Version Bump & Reinstall**: The addon version was incremented, and the addon was reinstalled in Stremio. This is a crucial step to force the client to discard its cached (and incorrect) manifest and fetch the new one.

## 4. Why This Fixed the Issue

By declaring `idPrefixes` for both the `meta` and `stream` resources, the addon now follows the correct Stremio event flow for custom content:

1.  **Click**: User clicks on a content item.
2.  **Meta Request**: Stremio client sees the item's ID prefix (e.g., `T25...`) and matches it to the `idPrefixes` in our addon's `meta` resource. It sends a `meta` request.
3.  **Meta Response**: The addon's `metaHandler` responds with the metadata for the item. The client now marks the item as "owned" by this addon.
4.  **Stream Request**: Because ownership is established, the client automatically sends a `stream` request to the same addon for the same ID.
5.  **Stream Response**: The addon's `streamHandler` responds with available stream URLs (P2P magnet link and/or TorBox link).
6.  **Playback**: The play button appears, and the user can start the stream.

This solution ensures reliable playback by correctly signaling the addon's capabilities to the Stremio client.

## 5. Torbox Integration Issue

### The Problem
The Torbox integration is not working as expected. When a user tries to play a video, the addon should check if the stream is already cached on Torbox. If it is, it should play instantly. If not, it should be added to the Torbox download queue, and the user should see a "downloading" status.

Currently, there's a status mismatch. Even when Torbox shows the content as cached, the addon reports "Not found" and fails to play.

### Desired Behavior
The addon's Torbox integration should function like other similar addons:
- **Instant Playback:** If the content is cached on Torbox, it should play immediately.
- **Show Downloading Status:** If the content is not cached, it should be added to the Torbox download queue, and the addon should display a "downloading" or "caching" status to the user.
- **Correct Status Symbols:** The addon should use appropriate symbols or UI elements to indicate whether a stream is cached, downloading, or available for instant playback.

## 6. FansDB Integration for OnlyFans Content

### The Goal
To expand the addon's content library, we will integrate with FansDB.cc to fetch metadata and posters for OnlyFans content.

### Requirements
- **API Integration:** Use the FansDB GraphQL API endpoint: `https://fansdb.cc/graphql`.
- **Metadata:** Fetch metadata, including posters, for OnlyFans performers and scenes.
- **Catalog:** Create new catalogs in the addon to display OnlyFans content.
- **Configuration:** Allow users to enable/disable the FansDB integration and provide their own API key in the addon's settings.
