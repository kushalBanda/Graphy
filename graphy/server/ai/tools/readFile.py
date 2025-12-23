from pathlib import Path
from typing import Optional


def read_file(
    path: Path,
    *,
    encoding: str = "utf-8",
    errors: str = "strict",
    max_bytes: Optional[int] = None,
    start: int = 0,
) -> str:
    if not path.exists() or path.is_dir():
        return ""

    if max_bytes is None:
        return path.read_text(encoding=encoding, errors=errors)

    with path.open("rb") as handle:
        if start > 0:
            handle.seek(start)
        data = handle.read(max_bytes)
    return data.decode(encoding, errors=errors)


if __name__ == "__main__":
    print(read_file(Path(__file__)))
