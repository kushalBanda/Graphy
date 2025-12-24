from collections import defaultdict
from fnmatch import fnmatch
from math import log
from pathlib import Path
import string
from typing import Iterable, List, Optional, Tuple


def update_url_scores(old: dict[str, float], new: dict[str, float]) -> dict[str, float]:
    for url, score in new.items():
        if url in old:
            old[url] += score
        else:
            old[url] = score
    return old


def normalize_string(input_string: str) -> str:
    translation_table = str.maketrans(string.punctuation, " " * len(string.punctuation))
    string_without_punc = input_string.translate(translation_table)
    string_without_double_spaces = " ".join(string_without_punc.split())
    return string_without_double_spaces.lower()


class SearchEngine:
    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self._index: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self._documents: dict[str, str] = {}
        self.k1 = k1
        self.b = b

    @property
    def posts(self) -> List[str]:
        return list(self._documents.keys())

    @property
    def number_of_documents(self) -> int:
        return len(self._documents)

    @property
    def avdl(self) -> float:
        if not self._documents:
            return 0.0
        return sum(len(d) for d in self._documents.values()) / len(self._documents)

    def idf(self, kw: str) -> float:
        n_kw = len(self.get_urls(kw))
        if n_kw == 0:
            return 0.0
        return log((self.number_of_documents - n_kw + 0.5) / (n_kw + 0.5) + 1)

    def bm25(self, kw: str) -> dict[str, float]:
        result: dict[str, float] = {}
        idf_score = self.idf(kw)
        avdl = self.avdl
        if avdl == 0:
            return result
        for url, freq in self.get_urls(kw).items():
            numerator = freq * (self.k1 + 1)
            denominator = freq + self.k1 * (
                1 - self.b + self.b * len(self._documents[url]) / avdl
            )
            result[url] = idf_score * numerator / denominator
        return result

    def search(self, query: str) -> dict[str, float]:
        keywords = normalize_string(query).split(" ")
        url_scores: dict[str, float] = {}
        for kw in keywords:
            if not kw:
                continue
            kw_urls_score = self.bm25(kw)
            url_scores = update_url_scores(url_scores, kw_urls_score)
        return url_scores

    def index(self, url: str, content: str) -> None:
        self._documents[url] = content
        words = normalize_string(content).split(" ")
        for word in words:
            if not word:
                continue
            self._index[word][url] += 1

    def bulk_index(self, documents: List[Tuple[str, str]]) -> None:
        for url, content in documents:
            self.index(url, content)

    def get_urls(self, keyword: str) -> dict[str, int]:
        keyword = normalize_string(keyword)
        return self._index[keyword]


def code_search(
    query: str,
    path: Path,
    *,
    include_globs: Optional[Iterable[str]] = None,
    exclude_globs: Optional[Iterable[str]] = None,
    max_results: int = 20,
) -> List[Tuple[str, float]]:
    if not query or not path.exists():
        return []

    documents: List[Tuple[str, str]] = []
    for file_path in _iter_files(path, include_globs, exclude_globs):
        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        documents.append((_display_path(file_path, path), content))

    if not documents:
        return []

    engine = SearchEngine()
    engine.bulk_index(documents)
    results = engine.search(query)
    sorted_results = sorted(results.items(), key=lambda item: item[1], reverse=True)
    if max_results > 0:
        sorted_results = sorted_results[:max_results]
    return sorted_results


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


def _display_path(file_path: Path, base_path: Path) -> str:
    try:
        return str(file_path.relative_to(base_path))
    except ValueError:
        return str(file_path)


if __name__ == "__main__":
    root = Path(__file__).parent.parent.parent
    print(code_search("grep", root, include_globs=["*.py"], max_results=5))