from langchain_core.tools import tool
from pathlib import Path
from server.ai.tools.codeSearch import code_search
from server.ai.tools.grep import grep
from server.ai.tools.globFileSearch import glob_file_search
from server.ai.tools.readFile import read_file
from server.ai.tools.listDirectories import list_directories

def tools_compiler(target_path: Path):
    """Create path-bound versions of the analysis tools."""
    
    @tool
    def search_code(query: str, max_results: int = 20) -> list:
        """Search for code patterns and functions in the codebase."""
        return code_search(query, target_path, max_results=max_results)
    
    @tool
    def search_pattern(pattern: str, max_results: int = 200) -> list:
        """Search for code patterns using grep-like functionality."""
        return grep(pattern, target_path, max_results=max_results)
    
    @tool
    def find_files(pattern: str, recursive: bool = True) -> list:
        """Find files matching a glob pattern."""
        results = glob_file_search(pattern, root_dir=target_path, recursive=recursive)
        return [str(p) for p in results]
    
    @tool
    def read_code_file(file_path: str, max_bytes: int = None) -> str:
        """Read the contents of a code file."""
        file_path_obj = target_path / file_path if not Path(file_path).is_absolute() else Path(file_path)
        return read_file(file_path_obj, max_bytes=max_bytes)
    
    @tool
    def list_code_directories(recursive: bool = False, max_depth: int = None) -> list:
        """List directories in the codebase."""
        results = list_directories(target_path, recursive=recursive, max_depth=max_depth)
        return [str(p.relative_to(target_path)) for p in results]
    
    return [search_code, search_pattern, find_files, read_code_file, list_code_directories]
