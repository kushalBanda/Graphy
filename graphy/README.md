# LineTrace

LineTrace tracks where code is used and where it isn’t.

## Details

LineTrace scans the first workspace folder, builds a lightweight structural summary, and writes a `LineTrace.md` report at the workspace root. The report includes a directory tree, file counts, and extension breakdowns so you can share or paste a high-signal overview into AI tools or code reviews.

## Features

- Generate a `LineTrace.md` report from `LineTrace: Generate Codebase Analysis`
- Summaries for total files, total directories, and extension breakdowns
- Readable directory tree for fast repo orientation
- Auto-open the generated report on completion
- LineLens badges showing line counts in the Explorer
- Refresh LineLens data with `LineLens: Refresh Line Counts`

## Screenshot

![LineTrace with LineLens line counts](assets/Full.png)


## Usage

Once installed, open a folder in VS Code and run the command:

- Command Palette: `LineTrace: Generate Codebase Analysis`
- Output: A `LineTrace.md` file appears in the workspace root and opens automatically
- LineLens: Line counts appear next to files and folders in the Explorer
- Manual refresh: Run `LineLens: Refresh Line Counts`

## Performance Notes

- Analysis runs on the first workspace folder when multiple folders are open
- Large repositories may take longer to process depending on filesystem size

## Installation

1. Install the extension from the VS Code Marketplace
2. Reload VS Code
3. Run `LineTrace: Generate Codebase Analysis` from the Command Palette

## Extension Settings

This extension has no configurable settings at this time.

## Changelog

See `CHANGELOG.md` for release notes and feature history.

## License

This extension is licensed under the MIT License.
