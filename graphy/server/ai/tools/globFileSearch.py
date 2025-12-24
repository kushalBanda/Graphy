from __future__ import annotations

import glob
from pathlib import Path
from typing import Iterable, List, Optional


def glob_file_search(
    patterns: str | Iterable[str],
    *,
    root_dir: Path,
    recursive: bool = True,
    include_hidden: bool = False,
    exclude_patterns: Optional[Iterable[str]] = None,
) -> List[Path]:
    if not root_dir.exists():
        return []

    normalized_patterns = _normalize_patterns(patterns)
    matches: List[Path] = []
    root_dir_str = str(root_dir)
    for pattern in normalized_patterns:
        effective_pattern = _prefix_hidden(pattern) if include_hidden else pattern
        for match in glob.iglob(
            effective_pattern,
            root_dir=root_dir_str,
            recursive=recursive,
            include_hidden=include_hidden,
        ):
            path = Path(root_dir_str, match)
            if path.is_dir():
                continue
            if exclude_patterns and _match_any(path, exclude_patterns):
                continue
            matches.append(path)

    return sorted(set(matches))


def _normalize_patterns(patterns: str | Iterable[str]) -> List[str]:
    if isinstance(patterns, str):
        return [patterns]
    return list(patterns)


def _prefix_hidden(pattern: str) -> str:
    if pattern.startswith("**/"):
        return pattern
    return f"**/{pattern}"


def _match_any(path: Path, patterns: Iterable[str]) -> bool:
    return any(path.match(pattern) for pattern in patterns)


if __name__ == "__main__":
    print(glob_file_search("**/*.py", root_dir=Path.cwd()))
