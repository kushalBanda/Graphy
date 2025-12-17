# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Graphy is a VS Code extension that creates graphical representations of codebases as markdown files. The extension is built with TypeScript and uses esbuild for bundling.

## Architecture

The extension follows the standard VS Code extension architecture:

- **Entry point**: `src/extension.ts` - Contains the `activate()` function that runs when the extension loads. All command registration and initialization happens here.
- **Build process**: esbuild bundles the extension code from `src/extension.ts` to `dist/extension.js` for distribution.
- **Configuration**: `package.json` defines VS Code-specific metadata (commands, activation events, settings).
- **Commands**: Registered via `vscode.commands.registerCommand()` in the activate function. Each command is defined in `package.json` under `contributes.commands`.

The extension currently activates on all events (`"*"` in `activationEvents`) and provides a basic "Hello World" command as a template.

## Common Development Commands

Run these from the `graphy/` directory:

- **Compile and type-check**: `npm run compile` - Runs type checking, linting, and bundles code with esbuild
- **Watch mode**: `npm run watch` - Parallel watch for TypeScript (`watch:tsc`) and esbuild (`watch:esbuild`). Rebuilds on file changes
- **Type checking only**: `npm run check-types` - Runs TypeScript compiler without emitting
- **Linting**: `npm run lint` - Runs ESLint on `src/`
- **Package for distribution**: `npm run package` - Produces minified, production-ready bundle
- **Run tests**: `npm run test` - Runs VS Code extension tests via `@vscode/test-cli`
- **Compile tests**: `npm run compile-tests` - Compiles test files to `out/` directory
- **Watch tests**: `npm run watch-tests` - Watches and recompiles test files

## Key Files and Directories

- `src/extension.ts` - Main extension code; implement functionality here
- `src/test/` - Test files; tests run against the compiled extension
- `dist/extension.js` - Bundled output (auto-generated)
- `package.json` - VS Code extension manifest; update here to add commands, settings, or activation events
- `esbuild.js` - Build configuration; handles bundling and production optimization
- `eslint.config.mjs` - Linting rules for TypeScript
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)

## Development Workflow

1. Make changes in `src/extension.ts`
2. Run `npm run watch` during development for real-time compilation
3. Press F5 in VS Code to launch the extension in a debug window (uses default `.vscode/launch.json`)
4. To add new commands: update `src/extension.ts` with `vscode.commands.registerCommand()` and add metadata to `package.json` `contributes.commands`
5. Run `npm run test` before committing to ensure tests pass

## Testing

Test files are in `src/test/` and use Mocha test framework. The test configuration in `.vscode-test.mjs` points to compiled test files in `out/test/`.

## Dependencies

- **vscode** (^1.80.0) - VS Code API
- **TypeScript** (^5.9.3) - Language
- **esbuild** (^0.27.1) - Bundler
- **eslint** (^9.39.1) - Linter
- **typescript-eslint** (^8.48.1) - ESLint TypeScript support
- **@vscode/test-cli** - Test runner
- **npm-run-all** - Run scripts in parallel/series
