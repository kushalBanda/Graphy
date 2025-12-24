#!/usr/bin/env python3
"""
Main entry point for the LineTrace analysis engine
"""
import sys
import json

# Setup path for imports using the paths utility
from utils.paths import add_project_root_to_path
add_project_root_to_path()

from server.infrastructure.adapters.filesystem_adapter import FilesystemAdapter

def analyze_project(project_path: str):
    """
    Analyze a project and return the file structure as JSON
    """
    # Initialize the filesystem adapter
    adapter = FilesystemAdapter()

    # Perform the analysis
    file_structure = adapter.analyze_project_structure(project_path)

    # Convert to dictionary for JSON serialization
    result = {
        "root_path": file_structure.root_path,
        "files": file_structure.files,
        "directories": file_structure.directories,
        "file_extensions": file_structure.file_extensions,
        "total_files": file_structure.total_files,
        "total_directories": file_structure.total_directories,
        "structure_tree": file_structure.structure_tree
    }

    return result

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python main.py <project_path>"}), file=sys.stderr)
        sys.exit(1)

    project_path = sys.argv[1]

    try:
        result = analyze_project(project_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
