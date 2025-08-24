"""Common test-fixtures."""

from pathlib import Path
from shutil import rmtree
from uuid import uuid4

import pytest

from flux.cli.index.create import CreateIndex


@pytest.fixture(scope="session", name="tmp")
def _tmp() -> Path:
    """Temporary directory"""
    __tmp = Path("tests/tmp")
    __tmp.mkdir(parents=True, exist_ok=False)
    return __tmp


@pytest.fixture()
def tmp_index(tmp) -> Path:
    """Returns a pre-created flux index."""
    _tmp_index = tmp / str(uuid4())
    CreateIndex("").run({CreateIndex.index_location: [_tmp_index]})
    return _tmp_index


@pytest.fixture(scope="session", autouse=True)
def tmp_cleanup(request, tmp):
    """Clean up temp_folder"""

    def _tmp_cleanup(target):
        if target.is_dir():
            rmtree(target)

    request.addfinalizer(lambda: _tmp_cleanup(tmp))
