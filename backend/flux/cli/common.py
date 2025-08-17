"""Common definitions of the flux-cli."""

from typing import Optional
from pathlib import Path

from befehl import Option

from flux.config import FluxConfig

verbose = Option(("-v", "--verbose"), helptext="verbose output")


def parse_as_flux_dir(data) -> tuple[bool, Optional[str], Optional[Path]]:
    """
    Parses `data` as directory that is compatible with being used as a
    working directory with flux.
    """
    path = Path(data)
    if path.exists() and not path.is_dir():
        return False, f"path '{data}' is not a directory", None
    return True, None, path


index_location = Option(
    ("-i", "--index-location"),
    helptext="index/working directory (default uses current)",
    nargs=1,
    parser=parse_as_flux_dir,
)


def get_index(args):
    """Gets index from args or default from config."""
    index_path = None
    if index_location in args:
        index_path = args[index_location][0]
    else:
        index_path = FluxConfig.INDEX_DEFAULT_LOCATION
    return index_path.resolve()
