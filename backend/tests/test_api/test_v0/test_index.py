"""Test index API."""

from urllib.parse import quote

from pathlib import Path

from flux.config import FluxConfig
from flux.cli import cli
from flux.app.app import app_factory


# pylint: disable=unused-argument
def test_index_list_records_series(patch_config, tmp_series: Path, login):
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
    assert response.json["meta"]["ok"]
    assert response.json["content"]["count"] == 1
    assert response.json["content"]["records"][0]["name"] == name
    assert response.json["content"]["records"][0]["description"] == description
    assert response.json["content"]["records"][0]["type"] == "series"
    assert response.json["content"]["records"][0]["thumbnailId"] is not None
    assert response.json["content"]["records"][0]["id"] is not None
    record_id = response.json["content"]["records"][0]["id"]

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

    # get record
    response = client.get(f"/api/v0/index/record/{record_id}")
    assert response.status_code == 200
    assert response.json["meta"]["ok"]
    for key in ["id", "type", "name", "description", "thumbnailId", "content"]:
        assert key in response.json["content"]
        assert response.json["content"][key] is not None
    assert isinstance(response.json["content"]["content"]["seasons"], list)
    assert len(response.json["content"]["content"]["seasons"]) == 2
    for season in response.json["content"]["content"]["seasons"]:
        for key in ["id", "name", "episodes"]:
            assert key in season
            assert season is not None
        assert isinstance(season["episodes"], list)
        assert len(season["episodes"]) > 0
        for episode in season["episodes"]:
            for key in [
                "id",
                "name",
                "description",
                "trackId",
                "metadata",
                "thumbnailId",
            ]:
                assert key in episode
                assert episode[key] is not None

    assert isinstance(response.json["content"]["content"]["specials"], list)
    assert len(response.json["content"]["content"]["specials"]) == 1
    for special in response.json["content"]["content"]["specials"]:
        for key in [
            "id",
            "name",
            "description",
            "trackId",
            "metadata",
            "thumbnailId",
        ]:
            assert key in special
            assert special[key] is not None

    # get record but use video-id instead
    assert (
        client.get(
            f"/api/v0/index/record/{response.json['content']['content']['specials'][0]['id']}"
        ).json
        == response.json
    )

    # get current video
    response_current_video = client.get(
        f"/api/v0/index/record/{record_id}/current-video"
    )
    assert response_current_video.json["meta"]["ok"]
    assert "video" in response_current_video.json["content"]
    assert (
        response_current_video.json["content"]["video"]
        == response.json["content"]["content"]["seasons"][0]["episodes"][0]
    )


# pylint: disable=unused-argument
def test_index_list_records_movie(patch_config, tmp_movie: Path, login):
    """Test listing records in index."""
    # setup (create index and app)
    cli(["index", "create", "-i", str(FluxConfig.INDEX_LOCATION)])
    client = app_factory().test_client()

    login(client)

    # add test-movie
    name = "test movie"
    description = "test description"
    cli(
        [
            "index",
            "add",
            "-i",
            str(FluxConfig.INDEX_LOCATION),
            "--type",
            "movie",
            "--name",
            name,
            "--description",
            description,
            str(tmp_movie),
        ]
    )

    # list api-call
    response = client.get("/api/v0/index/records")
    assert response.status_code == 200
    assert response.json["meta"]["ok"]
    assert response.json["content"]["count"] == 1
    assert response.json["content"]["records"][0]["name"] == name
    assert response.json["content"]["records"][0]["description"] == description
    assert response.json["content"]["records"][0]["type"] == "movie"
    assert response.json["content"]["records"][0]["thumbnailId"] is not None
    assert response.json["content"]["records"][0]["id"] is not None
    record_id = response.json["content"]["records"][0]["id"]

    # get record
    response = client.get(f"/api/v0/index/record/{record_id}")
    assert response.status_code == 200
    assert response.json["meta"]["ok"]
    for key in ["id", "type", "name", "description", "thumbnailId", "content"]:
        assert key in response.json["content"]
        assert response.json["content"][key] is not None
    assert isinstance(response.json["content"]["content"], dict)
    for key in [
        "id",
        "name",
        "description",
        "trackId",
        "metadata",
        "thumbnailId",
    ]:
        assert key in response.json["content"]["content"]
        assert response.json["content"]["content"][key] is not None

    # get current video
    response_current_video = client.get(
        f"/api/v0/index/record/{record_id}/current-video"
    )
    assert response_current_video.json["meta"]["ok"]
    assert "video" in response_current_video.json["content"]
    assert (
        response_current_video.json["content"]["video"]
        == response.json["content"]["content"]
    )


# pylint: disable=unused-argument
def test_index_list_records_collection(
    patch_config, tmp_collection: Path, login
):
    """Test listing records in index."""
    # setup (create index and app)
    cli(["index", "create", "-i", str(FluxConfig.INDEX_LOCATION)])
    client = app_factory().test_client()

    login(client)

    # add test-collection
    name = "test collection"
    description = "test description"
    cli(
        [
            "index",
            "add",
            "-i",
            str(FluxConfig.INDEX_LOCATION),
            "--type",
            "collection",
            "--name",
            name,
            "--description",
            description,
            str(tmp_collection),
        ]
    )

    # list api-call
    response = client.get("/api/v0/index/records")
    assert response.status_code == 200
    assert response.json["meta"]["ok"]
    assert response.json["content"]["count"] == 1
    assert response.json["content"]["records"][0]["name"] == name
    assert response.json["content"]["records"][0]["description"] == description
    assert response.json["content"]["records"][0]["type"] == "collection"
    assert response.json["content"]["records"][0]["thumbnailId"] is not None
    assert response.json["content"]["records"][0]["id"] is not None
    record_id = response.json["content"]["records"][0]["id"]

    # get record
    response = client.get(f"/api/v0/index/record/{record_id}")
    assert response.status_code == 200
    assert response.json["meta"]["ok"]
    for key in ["id", "type", "name", "description", "thumbnailId", "content"]:
        assert key in response.json["content"]
        assert response.json["content"][key] is not None
    assert isinstance(response.json["content"]["content"], list)
    assert len(response.json["content"]["content"]) == 4
    for video in response.json["content"]["content"]:
        for key in [
            "id",
            "name",
            "description",
            "trackId",
            "metadata",
            "thumbnailId",
        ]:
            assert key in video
            assert video[key] is not None

    # get current video
    response_current_video = client.get(
        f"/api/v0/index/record/{record_id}/current-video"
    )
    assert response_current_video.json["meta"]["ok"]
    assert "video" in response_current_video.json["content"]
    assert (
        response_current_video.json["content"]["video"]
        == response.json["content"]["content"][0]
    )
