"""Helper functions for interaction with GitHub-API."""

from typing import Optional
import urllib.request
import json


BASE_URL = "https://api.github.com/repos/RichtersFinger/flux"


def get_latest_version(project_url: Optional[str] = None) -> Optional[str]:
    """Loads latest release version from GitHub."""
    with urllib.request.urlopen(
        (project_url or BASE_URL) + "/releases/latest"
    ) as url:
        data = json.loads(url.read().decode())
        return data.get("tag_name")


def get_latest_wheel_url(project_url: Optional[str] = None) -> Optional[str]:
    """Loads wheel for latest release version from GitHub."""
    with urllib.request.urlopen(
        (project_url or BASE_URL) + "/releases/latest"
    ) as url:
        data = json.loads(url.read().decode())

    for asset in data.get("assets", []):
        if asset.get("name", "").endswith(".whl"):
            return asset.get("browser_download_url")
    return None


if __name__ == "__main__":
    wheel = get_latest_wheel_url()
    if wheel:
        print(
            urllib.request.urlretrieve(wheel, wheel.rsplit("/", maxsplit=1)[1])
        )
