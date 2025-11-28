"""User-API endpoints"""

from typing import Iterable, Callable, Any, Optional
from uuid import uuid4
from hashlib import sha512
import re

from flask import Flask, request, Response

from flux.db import Transaction
from flux.config import FluxConfig


def run_validation(
    validation_steps: Iterable[Callable[[Any], tuple[bool, str]]],
    data: Any,
    *,
    name: Optional[str] = None,
) -> tuple[bool, str]:
    """
    Runs `validation_steps` and exits on first failed validation.

    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    for step in validation_steps:
        valid, msg = step(data, name=name)
        if not valid:
            return valid, msg
    return True, ""


def validate_string(data, *, maxlen: int = 256, name=None) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if name is None:
        name = ""
    else:
        name = f" '{name}'"

    if data is None:
        return False, f"Missing required field{name}."
    if not isinstance(data, str):
        return False, f"Bad type in field{name} (not a string)."
    if len(data) > maxlen:
        return False, f"Maximum allowed input length exceeded for field{name}."
    return True, ""


def validate_username(username: str, *, name=None) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if len(username) < 4:
        return False, f"Username '{username}' too short."
    if not re.fullmatch(r"[a-zA-Z0-9\.@_-]+", username):
        return False, f"Username '{username}' contains invalid characters."
    with Transaction(
        FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
    ) as t:
        t.cursor.execute(
            "SELECT COUNT(*) FROM users WHERE name=?", (username,)
        )
    if t.data[0][0] > 0:
        return False, f"Username '{username}' alerady in use."
    return True, ""


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/user/register", methods=["POST"])
    def register():
        """Register new user."""
        # validate&parse request
        json = request.get_json(silent=True)
        if json is None:
            return Response("Missing JSON.", mimetype="text/plain", status=400)
        username = json.get("content", {}).get("username")
        password = json.get("content", {}).get("password")
        valid, msg = run_validation(
            [validate_string, validate_username], username
        )
        if not valid:
            return Response(msg, mimetype="text/plain", status=400)
        valid, msg = run_validation([validate_string], password)
        if not valid:
            return Response(msg, mimetype="text/plain", status=400)

        # create user
        salt = str(uuid4())
        hashed_password = sha512(
            (salt + password).encode(encoding="utf-8")
        ).hexdigest()
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                """INSERT INTO users (name) VALUES (?)""",
                (username,),
            )
            t.cursor.execute(
                """
                INSERT
                INTO user_secrets (id, username, salt, password)
                VALUES (?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    username,
                    salt,
                    hashed_password,
                ),
            )
        return Response("OK", mimetype="text/plain", status=200)
