# Graphy Positioning Alignment

## Goal

Position Graphy as the VS Code extension that helps developers understand unfamiliar codebases fast.

## Audience

Developers joining, inheriting, or returning to an unfamiliar repository.

## Product Message

- Product name: Graphy
- Primary promise: Understand any codebase fast.
- Supporting capabilities:
  - Generate a `Graphy.md` structural report.
  - Show file and folder line counts through LineLens.
  - Rank code by line count through Line Rank.
- Proof: Show the live Open VSX download count with a Shields.io badge linked to the Graphy listing.

Graphy must not claim to track where code is used. Current behavior provides repository structure and line-count visibility, not reference or dependency analysis.

## Scope

Align all current product surfaces:

- Root repository README
- Extension README used by Open VSX and VS Code Marketplace
- Extension manifest metadata
- Python package metadata and lock file
- Server module descriptions
- User-facing commands, report names, and messages
- Repository and marketplace links
- Current build artifacts only where they are source-controlled and intended for release

Keep LineLens as a named Graphy feature. Preserve historical changelog wording when it documents a past release, but remove stale active-product naming.

## README Structure

1. Graphy logo and product name
2. Promise: Understand any codebase fast.
3. Live Open VSX download badge
4. Short explanation for unfamiliar-codebase use
5. Three core capabilities: Graphy report, LineLens, Line Rank
6. Screenshots
7. Installation links and usage
8. Accurate performance notes and limitations
9. License and changelog links

The root README and extension README must present the same product story. The extension README may use absolute asset URLs because registries require them.

## Release Boundary

This work updates and verifies repository content. Publishing a new extension version or posting on LinkedIn requires a separate final review and explicit approval immediately before each public action.

## Verification

- Search active files for stale `LineTrace` and `linetrace` references.
- Verify README image and marketplace links.
- Verify the live badge resolves for `kushalBanda.graphy`.
- Run type checking, lint, tests, and production packaging from `graphy/`.
- Inspect the packaged VSIX metadata and README before release.
