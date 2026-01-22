"""Test subcommand `flux index show`."""

from pathlib import Path

from flux.cli import cli


def test_index_show(
    tmp_index: Path, tmp_series: Path, tmp_movie: Path, tmp_collection: Path
):
    """Test showing records from index."""
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

    cli(["index", "show", "-v", "-i", str(tmp_index)])
