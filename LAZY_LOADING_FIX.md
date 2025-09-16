# Refactoring for Performance: The Lazy Loading Fix

This document explains the architectural change made to the addon to dramatically improve search performance and reliability by implementing a "lazy loading" pattern.

## The Problem

The search feature was slow, often taking up to a minute to load results. It also frequently produced `404 Not Found` errors in the logs.

This was happening because the addon was trying to download the `.torrent` file for every single search result *before* displaying the results to the user. This approach had two major flaws:

1.  **Slowness:** Downloading dozens of files, even small ones, takes a long time and blocks the search results from being shown.
2.  **Errors:** Many indexers provide temporary or broken links to `.torrent` files. Attempting to download them resulted in errors that, while not crashing the addon, filled the logs and represented wasted work.

## The Solution: On-Demand Lazy Loading

We refactored the addon to follow a much more efficient "lazy loading" pattern. The principle is simple: **do the minimum work possible upfront, and defer heavy operations until the user explicitly requests them.**

Here is the new workflow:

1.  **Fast Catalog/Search (What you see first):**
    *   When you search, the addon now only fetches the basic metadata for each result (name, size, seeders, etc.).
    *   It **does not** download any files at this stage.
    *   If a magnet link is not immediately available, the addon simply saves the URL to the `.torrent` file and moves on.
    *   This makes the search results appear almost instantly.

2.  **On-Demand Download (When you click a poster):**
    *   When you click on an item, the addon checks if it already has a magnet link.
    *   If it doesn't, **only then** does it use the saved URL to download the `.torrent` file for that single item.
    *   It then generates the magnet link on-the-fly and presents you with the stream options.

## The Benefits

This new architecture provides a significantly better user experience:

*   **Blazing Fast Searches:** Search results are no longer blocked by slow network operations.
*   **Fewer Errors:** Errors from broken download links are now only encountered for the specific item you click on, not for the entire list of results.
*   **Improved Efficiency:** The addon no longer wastes time and resources downloading files for torrents you may never select.
