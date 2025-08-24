"""Test subcommand `flux index add`."""

from pathlib import Path

from flux.cli import cli
from flux.config import FluxConfig
from flux.db import Transaction


def test_index_add_series(tmp_index: Path, tmp_series: Path):
    """Test adding series to index."""
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

    # records
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM records")
    assert len(t.data) == 1
    record_id = t.data[0][0]
    assert "series" in t.data[0]
    assert str(tmp_series.resolve()) in t.data[0]
    assert "my series" in t.data[0]
    assert "my series description" in t.data[0]

    # seasons
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM seasons")
    assert len(t.data) == 2
    season1_id = t.data[0][0]
    season2_id = t.data[1][0]
    assert record_id in t.data[0]
    assert record_id in t.data[1]
    assert "s1" in t.data[0]
    assert "s2" in t.data[1]

    # episodes
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute(
            "SELECT * FROM episodes WHERE season_id=?", (season1_id,)
        )
    assert len(t.data) == 2
    assert record_id in t.data[0]
    assert record_id in t.data[1]
    assert "e01" in t.data[0]
    assert "e02" in t.data[1]
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute(
            "SELECT * FROM episodes WHERE season_id=?", (season2_id,)
        )
    assert len(t.data) == 1
    assert record_id in t.data[0]
    assert "e01" in t.data[0]

    # specials
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM specials;")
    assert len(t.data) == 1
    assert record_id in t.data[0]
    assert "a" in t.data[0]

    # thumbnails
    assert (tmp_index / FluxConfig.THUMBNAILS).is_dir()
    assert (tmp_index / FluxConfig.THUMBNAILS / record_id).is_dir()
    files = list(
        filter(
            lambda p: p.is_file(),
            (tmp_index / FluxConfig.THUMBNAILS / record_id).glob("**/*"),
        )
    )
    assert len(files) == 4
    assert (
        tmp_index / FluxConfig.THUMBNAILS / record_id / "a.mp4.jpg"
    ).is_file()
    assert (
        tmp_index / FluxConfig.THUMBNAILS / record_id / "s1" / "e01.mp4.jpg"
    ).is_file()
    assert (
        tmp_index / FluxConfig.THUMBNAILS / record_id / "s1" / "e02.mp4.jpg"
    ).is_file()
    assert (
        tmp_index / FluxConfig.THUMBNAILS / record_id / "s2" / "e01.mp4.jpg"
    ).is_file()


# TODO:
# * test batch add
# * test multiple args in single call
# * test non-video files in target
# * test cli-args validation
#   * combination of name/description and batch/multi-args
# * test behavior for adding previously added items?
# * test auto-detecting content type
