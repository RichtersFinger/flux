"""Test database."""

from pathlib import Path
from uuid import uuid4

import pytest

from flux.db import Transaction
from flux.config import FluxConfig
from flux.cli import cli
from flux.app.app import app_factory


@pytest.fixture(name="patch_config")
def _patch_config(tmp: Path, request):
    original_mode = FluxConfig.MODE
    original_index = FluxConfig.INDEX_LOCATION

    def reset():
        FluxConfig.MODE = original_mode
        FluxConfig.INDEX_LOCATION = original_index

    request.addfinalizer(reset)

    FluxConfig.MODE = "test"
    FluxConfig.INDEX_LOCATION = tmp / str(uuid4())


# pylint: disable=unused-argument
def test_simple_transaction(patch_config):
    """Test simple `Transaction`s."""
    cli(["index", "create", "-i", str(FluxConfig.INDEX_LOCATION)])
    client = app_factory().test_client()
    assert client.post(
        "/api/v0/user/register",
        json={"content": {"username": "user0", "password": "password0"}},
    ).status_code == 200

    with Transaction(FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE) as t:
        t.cursor.execute("SELECT name FROM users WHERE name='user0'")
        username = t.cursor.fetchone()[0]
        t.cursor.execute(
            "SELECT salt, password FROM user_secrets WHERE username='user0'"
        )
        salt, password = t.cursor.fetchone()

    assert username == "user0"
    assert salt is not None
    assert "password0" not in password
