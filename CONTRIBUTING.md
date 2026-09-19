# Contributing to Graphy

Thanks for improving Graphy. Small, focused pull requests are easiest to review and ship.

## Before you start

- Search existing issues and pull requests.
- Open an issue before substantial new behavior. Explain user problem, not only proposed solution.
- Bug fixes, tests, documentation, and small usability improvements are welcome.
- Do not add code to the legacy `graphy/src/` tree. Active code is in `graphy/client/` and `graphy/server/`.

## Development setup

Graphy needs Node.js 22 and Python 3.13 or newer. Run extension commands from `graphy/`.

```bash
cd graphy
npm ci
npm run compile
npm test
```

Press F5 from the repository workspace to launch an Extension Development Host.

## Pull requests

1. Branch from `main` and make one focused change.
2. Add or update tests when behavior changes.
3. Run the relevant validation commands above.
4. Update `graphy/CHANGELOG.md` for user-visible changes.
5. Complete every part of the pull request template.

Keep TypeScript strict, use four-space indentation, single quotes, and trailing commas. Keep Python documented with four-space indentation. Preserve matching ignore behavior between the TypeScript client and Python server.

By submitting a contribution, you agree that it may be licensed under this repository's [MIT License](LICENSE).
