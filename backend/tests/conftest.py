"""Common test-fixtures."""

from pathlib import Path
from shutil import rmtree, copy
from uuid import uuid4

import pytest

from flux.cli.index.create import CreateIndex
from flux.config import FluxConfig


@pytest.fixture(scope="session", name="tmp")
def _tmp(request) -> Path:
    """Temporary directory"""
    __tmp = Path("tests/tmp")

    def _tmp_cleanup(target):
        if target.is_dir():
            rmtree(target)

    request.addfinalizer(lambda: _tmp_cleanup(__tmp))

    _tmp_cleanup(__tmp)
    __tmp.mkdir(parents=True, exist_ok=False)
    return __tmp


@pytest.fixture(scope="session", name="fixtures")
def _fixtures() -> Path:
    """Fixture directory"""
    return Path("tests/fixtures")


@pytest.fixture()
def tmp_index(tmp) -> Path:
    """Returns a pre-created flux index."""
    _tmp_index = tmp / str(uuid4())
    CreateIndex("").run({CreateIndex.index_location: [_tmp_index]})
    return _tmp_index


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


@pytest.fixture(scope="session", name="cli_tmp_data")
def _cli_tmp_data(tmp) -> Path:
    """Temporary test sub-directory"""
    return tmp / str(uuid4())


@pytest.fixture(scope="session")
def tmp_series(fixtures: Path, cli_tmp_data: Path) -> Path:
    """Generate fake series and return path"""
    series = cli_tmp_data / "fake-series"
    series.mkdir(exist_ok=False, parents=True)
    for p in [
        series / "s1" / "e01.mp4",
        series / "s1" / "e02.mp4",
        series / "s2" / "e01.mp4",
        series / "a.mp4",
    ]:
        p.parent.mkdir(exist_ok=True)
        copy(fixtures / "sample.mp4", p)
    return series


@pytest.fixture(scope="session")
def tmp_movie(fixtures: Path, cli_tmp_data: Path) -> Path:
    """Generate fake movie and return path"""
    movie = cli_tmp_data / "fake-movie.mp4"
    copy(fixtures / "sample.mp4", movie)
    return movie


@pytest.fixture(name="login")
def _login():
    def _(client):
        assert client.post(
            "/api/v0/user/register",
            json={"content": {"username": "user0", "password": "password0"}},
        ).json["meta"]["ok"]
        assert client.post(
            "/api/v0/user/session",
            json={"content": {"username": "user0", "password": "password0"}},
        ).json["meta"]["ok"]
        assert client.get("/api/v0/user/session").json["meta"]["ok"]

    return _
