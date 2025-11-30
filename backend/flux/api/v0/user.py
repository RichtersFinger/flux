"""User-API endpoints"""

from typing import Iterable, Callable, Any, Optional
import sys
from uuid import uuid4
from hashlib import sha512
import re

from flask import Flask, request, Response, jsonify

from flux.db import Transaction
from flux.config import FluxConfig
from flux.api.common import session_cookie_auth


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


def validate_username(
    # pylint: disable=unused-argument
    username: str,
    *,
    name=None,
) -> tuple[bool, str]:
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
        return False, f"Username '{username}' already in use."
    return True, ""


def hash_password(password: str, salt: str) -> str:
    """Returns hashed password."""
    return sha512((salt + password).encode(encoding="utf-8")).hexdigest()


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
        hashed_password = hash_password(password, salt)
        print(f"INFO: New user '{username}' created.", file=sys.stderr)
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                "INSERT INTO users (name) VALUES (?)", (username,)
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

    @app.route("/api/v0/user/session", methods=["GET"])
    @session_cookie_auth(True)
    def validate_session(
        # pylint: disable=unused-argument
        *args,
    ):
        """Validate session."""
        return Response("OK", mimetype="text/plain", status=200)

    @app.route("/api/v0/user/session", methods=["POST"])
    def create_session():
        """Login/Create session."""
        # validate&parse request
        json = request.get_json(silent=True)
        if json is None:
            return Response("Missing JSON.", mimetype="text/plain", status=400)
        username = json.get("content", {}).get("username")
        password = json.get("content", {}).get("password")
        valid, msg = run_validation([validate_string], username)
        if not valid:
            return Response(msg, mimetype="text/plain", status=400)
        valid, msg = run_validation([validate_string], password)
        if not valid:
            return Response(msg, mimetype="text/plain", status=400)

        # read from database to validate credentials
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
        ) as t:
            t.cursor.execute(
                "SELECT salt, password FROM user_secrets WHERE username=?",
                (username,),
            )
        try:
            salt, hashed_password = t.data[0]
        except IndexError:
            # no row matched/unknown user
            print(
                f"INFO: Failed login attempt for username '{username}' "
                + "(unknown).",
                file=sys.stderr,
            )
            return Response("UNAUTHORIZED", mimetype="text/plain", status=401)

        # validate credentials
        if hashed_password != hash_password(password, salt):
            # password does not match
            print(
                f"INFO: Failed login attempt for username '{username}' "
                + "(bad password).",
                file=sys.stderr,
            )
            return Response("UNAUTHORIZED", mimetype="text/plain", status=401)

        # create session
        session_id = str(uuid4())
        print(
            f"INFO: Successful login for username '{username}' "
            + f"(session '{session_id}').",
            file=sys.stderr,
        )
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                "INSERT INTO sessions (id, username) VALUES (?, ?)",
                (session_id, username),
            )
        r = Response("OK", mimetype="text/plain", status=200)
        r.set_cookie(
            FluxConfig.SESSION_COOKIE_NAME,
            session_id,
            max_age=365 * 24 * 60 * 60,
        )
        return r

    @app.route("/api/v0/user/session", methods=["DELETE"])
    @session_cookie_auth(True)
    def delete_session(session_id: str, username: str):
        """Logout from session."""
        print(
            f"INFO: Logout for username '{username}' "
            + f"(session '{session_id}').",
            file=sys.stderr,
        )
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute("DELETE FROM sessions WHERE id=?", (session_id,))
        r = Response("OK", mimetype="text/plain", status=200)
        r.delete_cookie(FluxConfig.SESSION_COOKIE_NAME)
        return r

    @app.route("/api/v0/user/configuration", methods=["GET"])
    @session_cookie_auth()
    def get_configuration(_: str, username: str):
        """Returns configuration."""
        request_id = request.args.get("requestId")
        meta = {} if request_id is None else {"id": request_id}

        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                "SELECT volume, autoplay FROM users WHERE name=?", (username,)
            )

        if len(t.data) == 0:
            return (
                jsonify(
                    meta=meta
                    | {
                        "ok": False,
                        "error": {
                            "code": 404,
                            "short": "NOT FOUND",
                            "long": f"Unknown username '{username}'.",
                        },
                    },
                ),
                200,
            )

        return (
            jsonify(
                meta=meta | {"ok": True},
                content={
                    "user": {"name": username, "isAdmin": False},
                    "settings": {
                        "volume": t.data[0][0],
                        "autoplay": t.data[0][1] == 1,
                    },
                },
            ),
            200,
        )

    @app.route("/api/v0/user/configuration", methods=["PUT"])
    @session_cookie_auth()
    def put_configuration(_: str, username: str):
        """Returns configuration."""
        json = request.get_json(silent=True)
        if json is None:
            return (
                jsonify(
                    meta={
                        "ok": False,
                        "error": {
                            "code": 400,
                            "short": "BAD REQUEST",
                            "long": "Missing JSON data.",
                        },
                    },
                ),
                200,
            )
        request_id = json.get("meta", {}).get("id")
        meta = {} if request_id is None else {"id": request_id}

        cols = {}
        if "volume" in json.get("content", {}):
            cols["volume"] = json["content"]["volume"]
        if "autoplay" in json.get("content", {}):
            cols["autoplay"] = 1 if json["content"]["autoplay"] else 0

        if len(cols) == 0:
            return jsonify(meta=meta | {"ok": True}), 200

        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                # pylint: disable=consider-using-f-string
                "UPDATE users SET {} WHERE name=?".format(
                    ", ".join(map(lambda k: f"{k}=?", cols.keys()))
                ),
                tuple(cols.values()) + (username,),
            )

        return jsonify(meta=meta | {"ok": True}), 200
