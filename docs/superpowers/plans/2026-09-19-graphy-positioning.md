# Graphy Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every active repository and extension surface around Graphy as the fastest way for developers to understand an unfamiliar codebase.

**Architecture:** Update product copy and package metadata without changing runtime behavior. Keep one shared message across repository and registry READMEs, preserve LineLens as a feature name, regenerate lock metadata, then validate the packaged extension as the release artifact.

**Tech Stack:** Markdown, VS Code extension manifest, TypeScript, Python 3.13, uv, npm, esbuild, VSCE

**Spec:** `docs/superpowers/specs/2026-09-19-graphy-positioning-design.md`

## Global Constraints

- Product name: Graphy.
- Primary promise: Understand any codebase fast.
- Primary audience: developers joining, inheriting, or returning to an unfamiliar repository.
- Keep LineLens as a named Graphy feature.
- Do not claim Graphy tracks code usage, references, or dependencies.
- Show live Open VSX downloads for `kushalBanda.graphy`.
- Do not publish the extension or LinkedIn post without explicit final approval.

---

### Task 1: Align Repository and Registry READMEs

**Files:**
- Modify: `README.md`
- Modify: `graphy/README.md`

**Interfaces:**
- Consumes: Graphy product name, audience, promise, and current feature behavior from the approved spec.
- Produces: matching repository and registry product narratives; registry-safe absolute asset URLs in `graphy/README.md`.

- [ ] **Step 1: Record current stale-copy evidence**

Run:

```bash
rg -n -i "LineTrace|tracks where code is used" README.md graphy/README.md
```

Expected: root README contains LineTrace; extension README contains inaccurate usage-tracking tagline.

- [ ] **Step 2: Rewrite root README**

Use this content structure:

```markdown
# Graphy

Understand any codebase fast.

[Live Open VSX downloads badge linked to https://open-vsx.org/extension/kushalBanda/graphy]

Explain the unfamiliar-codebase problem, then document Graphy.md, LineLens, and Line Rank with accurate screenshots, install links, usage, limitations, changelog, and license.
```

Use relative asset paths under `graphy/assets/`.

- [ ] **Step 3: Rewrite extension README**

Mirror root README messaging. Use absolute `raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/...` image URLs so Open VSX and VS Code Marketplace can render images.

- [ ] **Step 4: Validate links, images, and stale copy**

Run:

```bash
rg -n -i "LineTrace|tracks where code is used" README.md graphy/README.md
curl -fsSI "https://img.shields.io/open-vsx/dt/kushalBanda/graphy?style=flat-square&label=Open%20VSX%20downloads"
curl -fsSI "https://raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/icon.png"
curl -fsSI "https://raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/Graphy.png"
curl -fsSI "https://raw.githubusercontent.com/kushalBanda/Graphy/main/graphy/assets/full.png"
```

Expected: first command returns no matches; each HTTP request returns success.

- [ ] **Step 5: Commit README alignment**

```bash
git add README.md graphy/README.md
git commit -m "docs: position Graphy for codebase discovery"
```

### Task 2: Align Package and Runtime Metadata

**Files:**
- Modify: `graphy/package.json`
- Modify: `graphy/pyproject.toml`
- Modify: `graphy/uv.lock`
- Modify: `graphy/bun.lock`
- Modify: `graphy/server/main.py`
- Modify: `graphy/CHANGELOG.md`

**Interfaces:**
- Consumes: public package ID `kushalBanda.graphy`; existing command IDs beginning with `graphy.`; LineLens feature name.
- Produces: Graphy-only active metadata while preserving runtime command compatibility.

- [ ] **Step 1: Update extension description**

Set `graphy/package.json` description to:

```json
"description": "Understand any codebase fast with structural reports, line-count badges, and file rankings."
```

Do not rename existing command IDs.

- [ ] **Step 2: Update Python project metadata**

Set `graphy/pyproject.toml` project name to `graphy` and description to:

```toml
description = "Graphy codebase structure analysis engine"
```

Change `graphy/server/main.py` module docstring from LineTrace to Graphy.

- [ ] **Step 3: Regenerate lock metadata**

Run from `graphy/`:

```bash
uv lock
bun install --lockfile-only
```

Expected: root workspace package names in `uv.lock` and `bun.lock` become `graphy`; dependency versions change only when required by lock tooling.

- [ ] **Step 4: Add unreleased changelog entry**

Add an `Unreleased` section describing Graphy naming alignment, accurate positioning, README refresh, and live Open VSX download badge. Do not rewrite historical release facts.

- [ ] **Step 5: Verify active naming**

Run from repository root:

```bash
rg -n -i "LineTrace|linetrace|tracks where code is used" . \
  --glob '!docs/superpowers/**' \
  --glob '!graphy/dist/**' \
  --glob '!graphy/out/**' \
  --glob '!graphy/node_modules/**' \
  --glob '!graphy/*.vsix' \
  --glob '!graphy/CHANGELOG.md'
```

Expected: no matches.

- [ ] **Step 6: Commit metadata alignment**

```bash
git add graphy/package.json graphy/pyproject.toml graphy/uv.lock graphy/bun.lock graphy/server/main.py graphy/CHANGELOG.md
git commit -m "chore: align Graphy product metadata"
```

### Task 3: Verify Release Artifact

**Files:**
- Verify: `graphy/package.json`
- Verify: `graphy/README.md`
- Verify: generated VSIX contents

**Interfaces:**
- Consumes: aligned documentation and metadata from Tasks 1 and 2.
- Produces: verified local package ready for explicit release approval.

- [ ] **Step 1: Run static checks**

Run from `graphy/`:

```bash
npm run check-types
npm run lint
npm test
```

Expected: all commands pass.

- [ ] **Step 2: Build production bundle**

Run:

```bash
npm run package
```

Expected: type checking, lint, and production esbuild bundle pass.

- [ ] **Step 3: Create local VSIX without publishing**

Run:

```bash
npx vsce package --out graphy-positioning-review.vsix
```

Expected: VSCE creates `graphy-positioning-review.vsix`; no registry changes occur.

- [ ] **Step 4: Inspect packaged product surface**

Run:

```bash
unzip -p graphy-positioning-review.vsix extension/package.json | rg '"name"|"displayName"|"description"|"version"'
unzip -p graphy-positioning-review.vsix extension/README.md | rg -n -i "Graphy|Open VSX downloads|LineLens|Line Rank|LineTrace"
```

Expected: package identity is `graphy`; display name and copy use Graphy; features and badge exist; LineTrace does not appear.

- [ ] **Step 5: Review final diff and release boundary**

Run from repository root:

```bash
git status --short
git diff --check
git log -3 --oneline
```

Expected: no uncommitted source changes, no whitespace errors, no publishing performed.

Do not publish. Present results and request explicit approval for release and LinkedIn drafting as separate actions.

