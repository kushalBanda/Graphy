# Change Log

All notable changes to the "graphy" extension will be documented in this file.

## [0.0.8]

- Fix logo and screenshot not rendering on the Marketplace/OpenVSX listing pages (relative HTML `<img>` paths aren't rewritten by either registry; switched to absolute GitHub raw URLs)
- Fix package/README icon pointing at the Graphy.md report screenshot instead of the actual logo; add the report screenshot as an in-body image instead

## [0.0.7]

- Add Line Rank panel, nested in the Explorer, ranking files and folders by line count with an expandable per-language breakdown and a workspace line total
- Fix LineLens skipping small files with unrecognized extensions instead of counting them
- Fix LineLens file-watcher debounce dropping updates when multiple files changed in quick succession
- Fix README screenshot not rendering on case-sensitive filesystems (asset filename casing mismatch)
- Ignore virtual environments and dependency/cache directories in Graphy and LineLens scans
- Include `.adoc` files in LineLens line counts
- Simplify Graphy report output by removing project path and file list sections
- Reduce LineLens extension setup notifications, keep a single completion message after analysis

## [0.0.4]

- Add LineLens line-count badges and manual refresh command

## [0.0.3]

- Add Graphy.md report output for analyzed repositories

## [0.0.2]

- Add filesystem analysis for repository structure and stats
