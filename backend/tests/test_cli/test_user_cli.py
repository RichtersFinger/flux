"""Test subcommand `flux user`."""

from pathlib import Path

from flux.cli import cli
from flux.config import FluxConfig
from flux.db import Transaction


def test_user_workflow(tmp_index: Path):
    """Test creating new index."""

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM users")
    assert len(t.data) == 0

    # create user
    cli(
        [
            "user",
            "create",
            "-v",
            "-i",
            str(tmp_index),
            "--password",
            "admin",
            "admin",
        ]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT is_admin FROM users")
    assert len(t.data) == 1
    assert t.data[0][0] == 0

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM user_secrets")
    assert len(t.data) == 1

    # promote user
    cli(
        [
            "user",
            "promote",
            "-v",
            "-i",
            str(tmp_index),
            "admin",
        ]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT is_admin FROM users")
    assert t.data[0][0] == 1

    # demote user
    cli(
        [
            "user",
            "demote",
            "-v",
            "-i",
            str(tmp_index),
            "admin",
        ]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT is_admin FROM users")
    assert t.data[0][0] == 0

    # delete user
    cli(
        [
            "user",
            "delete",
            "-v",
            "-y",
            "-i",
            str(tmp_index),
            "admin",
        ]
    )

    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT is_admin FROM users")
    assert len(t.data) == 0
    with Transaction(tmp_index / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT * FROM user_secrets")
    assert len(t.data) == 0
