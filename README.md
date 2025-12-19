# Graphy

Graphy is a VS Code extension that generates a `Graphy.md` report for your workspace, summarizing the codebase structure with tree views, file counts, and extension breakdowns for quick AI-friendly context.

## Features

- Workspace Analysis: Scans the active workspace and gathers structure stats
- Graphy.md Output: Writes a markdown report at the workspace root
- Directory Tree: Includes a readable tree of folders and files
- File Summary: Lists total files, directories, and extension counts
- One-Command Flow: Run `Graphy: Generate Analysis` from the Command Palette
- Auto-Open: Opens the generated `Graphy.md` when complete

## Screenshot

![Graphy codebase analysis report](assets/image.png)


## Usage

Once installed, open a folder in VS Code and run the command:

- Command Palette: `Graphy: Generate Analysis`
- Output: A `Graphy.md` file appears in the workspace root and opens automatically

## Performance Notes

- Analysis runs on the first workspace folder when multiple folders are open
- Large repositories may take longer to process depending on filesystem size

## Installation

1. Install the extension from the VS Code Marketplace
2. Reload VS Code
3. Run `Graphy: Generate Analysis` from the Command Palette

## Extension Settings

This extension has no configurable settings at this time.

## License

This extension is licensed under the MIT License.
