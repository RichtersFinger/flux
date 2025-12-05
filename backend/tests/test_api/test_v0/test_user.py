"""Test user API."""

from pathlib import Path
from uuid import uuid4

import pytest

from flux.db import Transaction
from flux.config import FluxConfig
from flux.cli import cli
from flux.app.app import app_factory


# pylint: disable=unused-argument
def test_user_api_workflow(patch_config):
    """Test user-api workflow."""
    # setup (create index and app)
    cli(["index", "create", "-i", str(FluxConfig.INDEX_LOCATION)])
    client = app_factory().test_client()

    # register
    # * make request
    assert client.post(
        "/api/v0/user/register",
        json={"content": {"username": "user0", "password": "password0"}},
    ).json["meta"]["ok"]
    # * check database
    with Transaction(
        FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
    ) as t:
        t.cursor.execute("SELECT name FROM users WHERE name='user0'")
        username = t.cursor.fetchone()[0]
        t.cursor.execute(
            "SELECT salt, password FROM user_secrets WHERE username='user0'"
        )
        salt, password = t.cursor.fetchone()
    assert username == "user0"
    assert salt is not None
    assert "password0" not in password

    # create session
    # * not logged in
    assert (
        client.get("/api/v0/user/session").json["meta"]["error"]["code"] == 401
    )
    # * login (bad-credentials)
    assert (
        client.post(
            "/api/v0/user/session",
            json={"content": {"username": "user0", "password": "password1"}},
        ).json["meta"]["error"]["code"]
        == 401
    )
    # * login
    assert client.post(
        "/api/v0/user/session",
        json={"content": {"username": "user0", "password": "password0"}},
    ).json["meta"]["ok"]
    # * logged in
    assert client.get("/api/v0/user/session").json["meta"]["ok"]

    # test configuration
    response = client.get("/api/v0/user/configuration")
    assert response.json["meta"]["ok"]
    assert response.json["content"]["user"]["name"] == "user0"
    assert not response.json["content"]["settings"]["autoplay"]
    assert client.put(
        "/api/v0/user/configuration", json={"content": {"autoplay": True}}
    ).json["meta"]["ok"]
    assert client.get("/api/v0/user/configuration").json["content"][
        "settings"
    ]["autoplay"]

    # delete session
    # * logout
    assert client.delete("/api/v0/user/session").json["meta"]["ok"]
    # * not logged in
    assert (
        client.get("/api/v0/user/session").json["meta"]["error"]["code"] == 401
    )
    # * not logged in
    assert (
        client.delete("/api/v0/user/session").json["meta"]["error"]["code"]
        == 401
    )
