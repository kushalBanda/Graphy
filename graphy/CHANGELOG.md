# Change Log

All notable changes to the "linetrace" extension will be documented in this file.

## [0.0.9]

- Add Line Rank panel, nested in the Explorer, ranking files and folders by line count with an expandable per-language breakdown and a workspace line total
- Fix LineLens skipping small files with unrecognized extensions instead of counting them
- Fix LineLens file-watcher debounce dropping updates when multiple files changed in quick succession
- Fix README screenshot not rendering on case-sensitive filesystems (asset filename casing mismatch)

## [0.0.8]

- Ignore virtual environments and dependency/cache directories in LineTrace and LineLens scans
- Include `.adoc` files in LineLens line counts

## [0.0.7]

- Simplify LineTrace report output by removing project path and file list sections
- Reduce LineLens extension setup notifications, keep a single completion message after analysis

## [0.0.4]

- Add LineLens line-count badges and manual refresh command

## [0.0.3]

- Add LineTrace.md report output for analyzed repositories

## [0.0.2]

- Add filesystem analysis for repository structure and stats
