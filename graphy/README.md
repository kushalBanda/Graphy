<p align="center">
  <img src="https://raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/icon.png" alt="Graphy logo" width="128" />
</p>

<h1 align="center">Graphy</h1>

<p align="center"><strong>Understand any codebase fast.</strong></p>

<p align="center">
  <a href="https://open-vsx.org/extension/kushalBanda/graphy"><img src="https://img.shields.io/open-vsx/dt/kushalBanda/graphy?style=flat-square&amp;label=Open%20VSX%20downloads" alt="Open VSX downloads" /></a>
  <a href="https://open-vsx.org/extension/kushalBanda/graphy"><img src="https://img.shields.io/open-vsx/v/kushalBanda/graphy?style=flat-square&amp;label=Open%20VSX" alt="Open VSX version" /></a>
  <a href="https://github.com/kushalBanda/Graphy/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT license" /></a>
</p>

Graphy gives developers a quick, useful map of an unfamiliar repository without leaving the editor. See its structure, measure code size, and find the files that deserve attention first.

## What Graphy Shows

### Codebase report

Run `Graphy: Generate Codebase Report` to create `Graphy.md` in your workspace root. The report contains:

- A readable directory tree
- Total file and directory counts
- A breakdown by file extension
- A compact overview you can share in reviews or give to an AI coding tool

<p align="center">
  <img src="https://raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/Graphy.png" alt="Graphy codebase report open in VS Code" width="720" />
</p>

### LineLens

LineLens adds live line-count badges to files and folders in the Explorer. Counts refresh as files change, including edits made by Git, terminals, and other tools.

### Line Rank

Line Rank lists workspace files and folders by line count. Expand a folder to see its language breakdown, then open any ranked file directly from the panel.

![Graphy LineLens badges and Line Rank panel](https://raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/full.png)

## Install

[Install Graphy from Open VSX](https://open-vsx.org/extension/kushalBanda/graphy), or search for **Graphy** in an editor that uses the Open VSX Registry.

Graphy supports VS Code-compatible editors running VS Code API `1.91.0` or newer.

## Use

1. Open a folder or workspace.
2. Run `Graphy: Generate Codebase Report` from the Command Palette.
3. Read the generated `Graphy.md` report.
4. Use LineLens badges and the Line Rank panel in Explorer for live size signals.

Commands:

- `Graphy: Generate Codebase Report`
- `Graphy: Refresh Line Rank`
- `LineLens: Refresh Line Counts`

## Current Scope

- Graphy analyzes the first folder in a multi-root workspace.
- Large repositories take longer to scan.
- Graphy reports repository structure and line counts. It does not analyze symbol references, dependencies, or runtime usage.
- Graphy has no configurable settings yet.

## Source and License

Graphy is open source on [GitHub](https://github.com/kushalBanda/Graphy) and licensed under the [MIT License](https://github.com/kushalBanda/Graphy/blob/main/LICENSE).

See the [changelog](https://github.com/kushalBanda/Graphy/blob/main/graphy/CHANGELOG.md) for release history.
