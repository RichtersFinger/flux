"""Test subcommand `flux index rm`."""

from pathlib import Path

from flux.cli import cli
from flux.config import FluxConfig
from flux.db import Transaction


def test_index_rm(
    tmp_index: Path, tmp_series: Path, tmp_movie: Path, tmp_collection: Path
):
    """Test removing records from index."""
    cli(
        [
            "index",
            "add",
            "-i",
            str(tmp_index),
            "--type",
            "series",
            "--name",
            "my series",
            "--description",
            "my series description",
            str(tmp_series),
        ]
    )
    cli(
        [
            "index",
            "add",
            "-i",
            str(tmp_index),
            "--type",
            "movie",
            "--name",
            "my movie",
            "--description",
            "my movie description",
            str(tmp_movie),
        ]
    )
    cli(
        [
            "index",
            "add",
            "-i",
            str(tmp_index),
            "--type",
            "collection",
            "--name",
            "my collection",
            "--description",
            "my collection description",
            str(tmp_collection),
        ]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT id FROM records")

    assert len(t.data) == 3

    cli(
        [
            "index",
            "rm",
            "-v",
            "--dry-run",
            "-i",
            str(tmp_index),
            t.data[0][0],
            t.data[1][0],
        ]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT id FROM records")

    assert len(t.data) == 3

    cli(
        ["index", "rm", "-v", "-i", str(tmp_index), t.data[0][0], t.data[1][0]]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT id FROM records")

    assert len(t.data) == 1
