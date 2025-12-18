import os
from typing import Dict, List, Any
from pathlib import Path

# Using absolute import since path is added in main.py
from server.domain.entities.file_structure import FileStructure

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
            # Skip hidden directories and common ignore directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', '.git', '.vscode']]
            
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
            # Skip hidden and common ignore directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', '.git', '.vscode']]
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
    
    def _build_tree(self, path: str) -> Dict[str, Any]:
        """
        Builds a nested dictionary representing the directory tree
        """
        tree: Dict[str, Any] = {}
        
        try:
            for item in os.listdir(path):
                if item.startswith('.') or item in ['node_modules', '__pycache__', '.git', '.vscode']:
                    continue
                    
                item_path = os.path.join(path, item)
                
                if os.path.isdir(item_path):
                    tree[item] = self._build_tree(item_path)
                else:
                    tree[item] = item  # Could store more metadata if needed
                    
        except PermissionError:
            # Handle cases where we don't have permission to read a directory
            pass
            
        return tree