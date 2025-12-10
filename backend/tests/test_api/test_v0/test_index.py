"""Test index API."""

from urllib.parse import quote

from pathlib import Path

from flux.config import FluxConfig
from flux.cli import cli
from flux.app.app import app_factory


# pylint: disable=unused-argument
def test_index_list_records(patch_config, tmp_series: Path, login):
    """Test listing records in index."""
    # setup (create index and app)
    cli(["index", "create", "-i", str(FluxConfig.INDEX_LOCATION)])
    client = app_factory().test_client()

    login(client)

    response = client.get("/api/v0/index/records")
    assert response.status_code == 200
    assert "count" in response.json["content"]
    assert "records" in response.json["content"]
    assert response.json["content"]["count"] == 0
    assert response.json["content"]["records"] == []

    # add test-series
    name = "test series"
    description = "test description"
    cli(
        [
            "index",
            "add",
            "-i",
            str(FluxConfig.INDEX_LOCATION),
            "--type",
            "series",
            "--name",
            name,
            "--description",
            description,
            str(tmp_series),
        ]
    )

    # repeat api-call
    response = client.get("/api/v0/index/records")
    assert response.status_code == 200
    assert response.json["content"]["count"] == 1
    assert response.json["content"]["records"][0]["name"] == name
    assert response.json["content"]["records"][0]["description"] == description
    assert response.json["content"]["records"][0]["type"] == "series"
    assert response.json["content"]["records"][0]["thumbnailId"] is not None

    # search filter
    assert (
        client.get(f"/api/v0/index/records?search={quote(name[1:-1])}").json[
            "content"
        ]["count"]
        == 1
    )
    assert (
        client.get("/api/v0/index/records?search=other%20series").json[
            "content"
        ]["count"]
        == 0
    )

    # type filter
    assert (
        client.get("/api/v0/index/records?type=series").json["content"][
            "count"
        ]
        == 1
    )
    assert (
        client.get("/api/v0/index/records?type=unknown").json["meta"]["error"][
            "code"
        ]
        == 400
    )

    # range filter
    response = client.get("/api/v0/index/records?range=0-1").json
    assert response["content"]["count"] == 1
    assert len(response["content"]["records"]) == 1
    response = client.get("/api/v0/index/records?range=1-2").json
    assert response["content"]["count"] == 1
    assert len(response["content"]["records"]) == 0
