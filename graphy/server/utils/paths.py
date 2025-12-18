"""
Common path utilities for the Graphy server
"""
from pathlib import Path
import sys

def get_server_root() -> Path:
    """Get the root directory of the server package"""
    return Path(__file__).parent.parent

def get_project_root() -> Path:
    """Get the root directory of the entire project (parent of server)"""
    return Path(__file__).parent.parent.parent

def add_project_root_to_path():
    """Add the project root directory to the Python path if not already present"""
    project_root = get_project_root()
    project_root_str = str(project_root)

    if project_root_str not in sys.path:
        sys.path.insert(0, project_root_str)

# Add the project root to the Python path when this module is imported
add_project_root_to_path()