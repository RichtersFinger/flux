"""Test playback API."""

from pathlib import Path

from flux.config import FluxConfig
from flux.cli import cli
from flux.app.app import app_factory


# pylint: disable=unused-argument
def test_playback_post_delete(patch_config, tmp_movie: Path, login):
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

    record_id = client.get("/api/v0/index/records").json["content"]["records"][
        0
    ]["id"]
    video_id = client.get(f"/api/v0/index/record/{record_id}").json["content"][
        "content"
    ]["id"]

    # initial post
    response = client.post(
        f"/api/v0/playback/{record_id}",
        json={"content": {"videoId": video_id, "timestamp": 0}},
    )
    assert response.json["meta"]["ok"]
    assert (
        client.get(f"/api/v0/index/record/{record_id}/current-video").json[
            "content"
        ]["playback"]["timestamp"]
        == 0
    )

    # update
    response = client.post(
        f"/api/v0/playback/{record_id}",
        json={"content": {"videoId": video_id, "timestamp": 10}},
    )
    assert response.json["meta"]["ok"]
    assert (
        client.get(f"/api/v0/index/record/{record_id}/current-video").json[
            "content"
        ]["playback"]["timestamp"]
        == 10
    )

    # delete
    assert client.delete(f"/api/v0/playback/{record_id}").json["meta"]["ok"]
    assert (
        client.get(f"/api/v0/index/record/{record_id}/current-video").json[
            "content"
        ]["playback"]["timestamp"]
        == 0
    )
