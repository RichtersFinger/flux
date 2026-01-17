"""Common definitions of the user-subcommand."""

from typing import Optional
from pathlib import Path
from hashlib import sha512
import re

from flux.config import FluxConfig
from flux.db import Transaction


def validate_username(
    # pylint: disable=unused-argument
    username: str,
    *,
    name=None,
    index: Optional[Path] = None
) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if len(username) < 4:
        return False, f"Username '{username}' too short."
    if not re.fullmatch(r"[a-z]", username[0]):
        return False, "Username must start with a lower case letter."
    if not re.fullmatch(r"[a-z0-9\.@_-]+", username):
        return (
            False,
            f"Username '{username}' contains invalid characters (allowed "
            + "characters are a-z, 0-9, ., @, _, and -).",
        )
    with Transaction(
        (index or FluxConfig.INDEX_LOCATION) / FluxConfig.INDEX_DB_FILE,
        readonly=True,
    ) as t:
        t.cursor.execute(
            "SELECT COUNT(*) FROM users WHERE name=?", (username,)
        )
    if t.data[0][0] > 0:
        return False, f"Username '{username}' already in use."
    return True, ""


def hash_password(password: str, salt: str) -> str:
    """Returns hashed password."""
    return sha512((salt + password).encode(encoding="utf-8")).hexdigest()
