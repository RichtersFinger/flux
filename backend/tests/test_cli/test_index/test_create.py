"""Test subcommand `flux index create`."""

from pathlib import Path
from uuid import uuid4
from importlib.metadata import version

from flux.cli import cli
from flux.config import FluxConfig
from flux.db import Transaction


def test_create_index(tmp: Path):
    """Test creating new index."""
    index = tmp / str(uuid4())
    cli(["index", "create", "-i", str(index)])
    assert index.is_dir()
    assert (index / FluxConfig.INDEX_DB_FILE).is_file()
    with Transaction(index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM index_metadata")

    # initialized-flag
    assert (None, 1) in t.data
    # schema-version
    assert (version("flux"), None) in t.data


def test_fixture_tmp_index(tmp_index: Path):
    """Test fixture for pre-initialized index."""
    assert tmp_index.is_dir()
    assert (tmp_index / FluxConfig.INDEX_DB_FILE).is_file()
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM index_metadata")

    # initialized-flag
    assert (None, 1) in t.data
    # schema-version
    assert (version("flux"), None) in t.data
