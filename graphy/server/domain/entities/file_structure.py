from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class FileStructure:
    """
    Represents the structure of files and directories in a project
    """
    root_path: str
    files: List[str]
    directories: List[str]
    file_extensions: Dict[str, int]
    total_files: int
    total_directories: int
    structure_tree: Dict[str, Any]