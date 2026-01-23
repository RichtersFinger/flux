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
            "-v",
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
            "SELECT * FROM videos WHERE season_id=?", (season1_id,)
        )
    assert len(t.data) == 2
    assert record_id in t.data[0]
    assert record_id in t.data[1]
    assert "e01" in t.data[0]
    assert "e02" in t.data[1]
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute(
            "SELECT * FROM videos WHERE season_id=?", (season2_id,)
        )
    assert len(t.data) == 1
    assert record_id in t.data[0]
    assert "e01" in t.data[0]

    # specials
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM videos WHERE season_id IS NULL")
    assert len(t.data) == 1
    assert record_id in t.data[0]
    assert "a" in t.data[0]

    # thumbnails
    assert (tmp_index / FluxConfig.THUMBNAILS).is_dir()
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT path FROM thumbnails")
    assert len(t.data) == 4
    for row in t.data:
        assert (tmp_index / FluxConfig.THUMBNAILS / row[0]).is_file()


def test_index_add_movie(tmp_index: Path, tmp_movie: Path):
    """Test adding movie to index."""
    cli(
        [
            "index",
            "add",
            "-v",
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

    # records
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM records")
    assert len(t.data) == 1
    record_id = t.data[0][0]
    assert "movie" in t.data[0]
    assert "my movie" in t.data[0]
    assert "my movie description" in t.data[0]

    # video
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM videos")
    assert len(t.data) == 1
    assert record_id in t.data[0]

    # thumbnails
    assert (tmp_index / FluxConfig.THUMBNAILS).is_dir()
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT path FROM thumbnails")
    assert len(t.data) == 1
    for row in t.data:
        assert (tmp_index / FluxConfig.THUMBNAILS / row[0]).is_file()


def test_index_add_collection(tmp_index: Path, tmp_collection: Path):
    """Test adding collection to index."""
    cli(
        [
            "index",
            "add",
            "-v",
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

    # records
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM records")
    assert len(t.data) == 1
    record_id = t.data[0][0]
    assert "collection" in t.data[0]
    assert "my collection" in t.data[0]
    assert "my collection description" in t.data[0]

    # videos
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM videos")
    assert len(t.data) == 4
    assert record_id in t.data[0]
    for video in ["01", "02", "03", "04"]:
        assert any(video in row for row in t.data)

    # thumbnails
    assert (tmp_index / FluxConfig.THUMBNAILS).is_dir()
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT path FROM thumbnails")
    assert len(t.data) == 4
    for row in t.data:
        assert (tmp_index / FluxConfig.THUMBNAILS / row[0]).is_file()


def test_index_add_auto(
    tmp_index: Path, tmp_movie: Path, tmp_series: Path, tmp_collection: Path
):
    """Test adding to index without type."""
    for path, type_ in [
        (tmp_movie, "movie"),
        (tmp_series, "series"),
        (tmp_collection, "collection"),
    ]:
        cli(
            [
                "index",
                "add",
                "-v",
                "-i",
                str(tmp_index),
                str(path),
            ]
        )
        with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
            t.cursor.execute("SELECT * FROM records WHERE type = ?", (type_,))
        assert len(t.data) == 1, type_
