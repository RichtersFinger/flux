"""`flux`-configuration definition."""

import os
from pathlib import Path


class FluxConfig:
    """`flux`-configuration."""

    INDEX_DEFAULT_LOCATION = (
        Path(os.environ["INDEX_DEFAULT_LOCATION"])
        if "INDEX_DEFAULT_LOCATION" in os.environ
        else Path(".flux")
    )
