from pathlib import Path
import sys


def get_server_root() -> Path:
    return Path(__file__).parent.parent


def get_project_root() -> Path:
    return Path(__file__).parent.parent.parent


def add_graphy_root_to_path():
    graphy_root = get_project_root()
    graphy_root_str = str(graphy_root)
    if graphy_root_str not in sys.path:
        sys.path.insert(0, graphy_root_str)


def add_server_root_to_path():
    server_root = get_server_root()
    server_root_str = str(server_root)
    if server_root_str not in sys.path:
        sys.path.insert(0, server_root_str)


def add_server_root_from_script(script_path: Path):
    server_root = script_path.resolve().parents[2]
    server_root_str = str(server_root)
    if server_root_str not in sys.path:
        sys.path.insert(0, server_root_str)


def add_project_root_to_path():
    add_graphy_root_to_path()


add_server_root_to_path()
add_project_root_to_path()
