import json
import os
from typing import Dict, List, Any
from pathlib import Path

# Using absolute import since path is added in main.py
from server.domain.entities.file_structure import FileStructure

# Single source of truth shared with client/linelens/LineLens.ts, so client
# badges and server reports agree on what's excluded.
# NOTE: parents[3] assumes this file stays at
# server/infrastructure/adapters/filesystem_adapter.py (3 levels above the
# graphy/ root). Moving this file changes that depth — update this if so.
_SHARED_CONFIG_PATH = Path(__file__).resolve().parents[3] / 'client' / 'shared' / 'ignoredDirs.json'


def _load_ignored_dirs() -> tuple:
    try:
        with open(_SHARED_CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return set(config.get('simpleNames', [])), tuple(config.get('nestedPaths', []))
    except (OSError, json.JSONDecodeError):
        # Fallback keeps the server usable even if the shared file moves/breaks.
        return {
            '.git', '.vscode', '__pycache__', 'node_modules', 'venv', '.venv',
            '.tox', '.pytest_cache', '.mypy_cache', '.ruff_cache', 'vendor',
            'dist', 'build', 'out', 'target', '.gradle', '.m2', '.cargo',
            '.npm', '.yarn', '.pnpm-store', '.bundle',
        }, ()


IGNORED_DIRS, NESTED_IGNORED_PATHS = _load_ignored_dirs()


def _is_nested_ignored(root: str, project_path: str, name: str) -> bool:
    """Checks a directory's path (e.g. public/assets) against NESTED_IGNORED_PATHS."""
    rel = os.path.relpath(os.path.join(root, name), project_path).replace(os.sep, '/')
    return any(rel == pattern or rel.endswith('/' + pattern) for pattern in NESTED_IGNORED_PATHS)

class FilesystemAdapter:
    """
    Adapter for file system operations analyzes directory structure
    """
    
    def analyze_project_structure(self, project_path: str) -> FileStructure:
        """
        Analyzes the project structure and returns a FileStructure object
        """
        files = []
        directories = []
        file_extensions = {}
        structure_tree = self._build_tree(project_path)
        
        for root, dirs, file_list in os.walk(project_path):
            # Skip hidden directories, common ignore directories, and nested ignore paths
            dirs[:] = [
                d for d in dirs
                if not d.startswith('.')
                and d not in IGNORED_DIRS
                and not _is_nested_ignored(root, project_path, d)
            ]

            for file in file_list:
                if not file.startswith('.'):
                    file_path = os.path.join(root, file)
                    files.append(file_path)
                    
                    # Count file extensions
                    _, ext = os.path.splitext(file)
                    if ext:
                        file_extensions[ext] = file_extensions.get(ext, 0) + 1
        
        # Get all directories
        for root, dirs, _ in os.walk(project_path):
            # Skip hidden, common ignore directories, and nested ignore paths
            dirs[:] = [
                d for d in dirs
                if not d.startswith('.')
                and d not in IGNORED_DIRS
                and not _is_nested_ignored(root, project_path, d)
            ]
            for d in dirs:
                dir_path = os.path.join(root, d)
                directories.append(dir_path)
        
        return FileStructure(
            root_path=project_path,
            files=files,
            directories=directories,
            file_extensions=file_extensions,
            total_files=len(files),
            total_directories=len(directories),
            structure_tree=structure_tree
        )
    
    def _build_tree(self, path: str, project_root: str = None) -> Dict[str, Any]:
        """
        Builds a nested dictionary representing the directory tree
        """
        tree: Dict[str, Any] = {}
        root = project_root if project_root is not None else path

        try:
            for item in os.listdir(path):
                if item.startswith('.') or item in IGNORED_DIRS:
                    continue
                if os.path.isdir(os.path.join(path, item)) and _is_nested_ignored(path, root, item):
                    continue

                item_path = os.path.join(path, item)

                if os.path.isdir(item_path):
                    tree[item] = self._build_tree(item_path, root)
                else:
                    tree[item] = item  # Could store more metadata if needed

        except PermissionError:
            # Handle cases where we don't have permission to read a directory
            pass
            
        return tree
