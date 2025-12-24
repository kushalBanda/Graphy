from pathlib import Path
from typing import Iterable, List, Optional


def list_directories(
    path: Path,
    *,
    recursive: bool = False,
    max_depth: Optional[int] = None,
    include_hidden: bool = False,
    include_patterns: Optional[Iterable[str]] = None,
    exclude_patterns: Optional[Iterable[str]] = None,
) -> List[Path]:
    if not path.exists():
        return []

    if path.is_file():
        return []

    results: List[Path] = []
    base = path.resolve()
    for entry in _walk_directories(base, recursive=recursive, max_depth=max_depth):
        if not include_hidden and entry.name.startswith("."):
            continue
        if include_patterns and not _match_any(entry, include_patterns):
            continue
        if exclude_patterns and _match_any(entry, exclude_patterns):
            continue
        results.append(entry)
    return results


def _walk_directories(
    base: Path,
    *,
    recursive: bool,
    max_depth: Optional[int],
    _depth: int = 0,
) -> Iterable[Path]:
    if max_depth is not None and _depth > max_depth:
        return

    for entry in base.iterdir():
        if entry.is_dir():
            yield entry
            if recursive:
                yield from _walk_directories(
                    entry,
                    recursive=recursive,
                    max_depth=max_depth,
                    _depth=_depth + 1,
                )


def _match_any(path: Path, patterns: Iterable[str]) -> bool:
    return any(path.match(pattern) for pattern in patterns)


if __name__ == "__main__":
    print(list_directories(Path(__file__).parent.parent.parent))
