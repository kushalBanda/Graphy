from fnmatch import fnmatch
from pathlib import Path
from typing import Iterable, List, Optional

from ast_grep_py import SgRoot

from server.ai.config.settings import LANGUAGE_BY_SUFFIX


def grep(
    query: str,
    path: Path,
    *,
    language: Optional[str] = None,
    include_globs: Optional[Iterable[str]] = None,
    exclude_globs: Optional[Iterable[str]] = None,
    max_results: int = 200,
    context_lines: int = 0,
    line_numbers: bool = True,
) -> List[str]:
    if not query or not path.exists():
        return []

    results: List[str] = []
    for file_path in _iter_files(path, include_globs, exclude_globs):
        file_language = language or _infer_language(file_path)
        if not file_language:
            continue

        try:
            source = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            source = file_path.read_text(encoding="utf-8", errors="ignore")

        try:
            root = SgRoot(source, file_language).root()
        except Exception:
            continue

        source_lines = source.splitlines()
        display_path = _display_path(file_path, path)
        for node in root.find_all(pattern=query):
            results.extend(
                _format_match(
                    display_path,
                    source_lines,
                    node.range(),
                    context_lines,
                    line_numbers,
                )
            )
            if max_results > 0 and len(results) >= max_results:
                return results[:max_results]

    return results


def _iter_files(
    path: Path,
    include_globs: Optional[Iterable[str]],
    exclude_globs: Optional[Iterable[str]],
) -> Iterable[Path]:
    if path.is_file():
        if _should_include_file(path, include_globs, exclude_globs):
            yield path
        return

    for file_path in path.rglob("*"):
        if not file_path.is_file() or file_path.is_symlink():
            continue
        if _should_include_file(file_path, include_globs, exclude_globs):
            yield file_path


def _should_include_file(
    file_path: Path,
    include_globs: Optional[Iterable[str]],
    exclude_globs: Optional[Iterable[str]],
) -> bool:
    name = file_path.name
    if include_globs and not any(fnmatch(name, pattern) for pattern in include_globs):
        return False
    if exclude_globs and any(fnmatch(name, pattern) for pattern in exclude_globs):
        return False
    return True


def _infer_language(file_path: Path) -> Optional[str]:
    return LANGUAGE_BY_SUFFIX.get(file_path.suffix.lower())


def _display_path(file_path: Path, base_path: Path) -> str:
    try:
        return str(file_path.relative_to(base_path))
    except ValueError:
        return str(file_path)


def _format_match(
    display_path: str,
    source_lines: List[str],
    rng,
    context_lines: int,
    line_numbers: bool,
) -> List[str]:
    if not source_lines:
        return []

    start_line = rng.start.line
    end_line = max(rng.end.line, start_line)
    window_start = max(start_line - context_lines, 0)
    window_end = min(end_line + context_lines, len(source_lines) - 1)

    formatted: List[str] = []
    for line_index in range(window_start, window_end + 1):
        prefix = f"{display_path}:{line_index + 1}:" if line_numbers else f"{display_path}:"
        formatted.append(f"{prefix}{source_lines[line_index]}")
    return formatted


if __name__ == "__main__":
    print(
        grep(
            "print($A)",
            Path(__file__).parent.parent.parent,
            include_globs=["*.py"],
            context_lines=1,
        )
    )
