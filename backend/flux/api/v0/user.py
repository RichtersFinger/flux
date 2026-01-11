"""User-API endpoints"""

import sys
from uuid import uuid4

from flask import Flask, request, jsonify

from flux.db import Transaction
from flux.config import FluxConfig
from flux import exceptions
from flux.cli.user.common import validate_username, hash_password
from flux.api import common


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/user/register", methods=["POST"])
    def register():
        """Register new user."""
        # validate&parse request
        json = request.get_json(silent=True)
        if json is None:
            raise exceptions.BadRequestException("Missing JSON data.")
        username = json.get("content", {}).get("username")
        password = json.get("content", {}).get("password")
        valid, msg = common.run_validation(
            [common.validate_string, validate_username],
            username,
            required=True,
            name="username",
        )
        if not valid:
            raise exceptions.BadRequestException(msg)
        valid, msg = common.run_validation(
            [common.validate_string],
            password,
            required=True,
            name="password",
        )
        if not valid:
            raise exceptions.BadRequestException(msg)

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
        return jsonify(common.wrap_response_json(None, None)), 200

    @app.route("/api/v0/user/session", methods=["GET"])
    @common.session_cookie_auth(True)
    def validate_session(
        # pylint: disable=unused-argument
        *args,
    ):
        """Validate session."""
        return jsonify(common.wrap_response_json(None, None)), 200

    @app.route("/api/v0/user/session", methods=["POST"])
    def create_session():
        """Login/Create session."""
        # validate&parse request
        json = request.get_json(silent=True)
        if json is None:
            raise exceptions.BadRequestException("Missing JSON data.")
        username = json.get("content", {}).get("username")
        password = json.get("content", {}).get("password")
        valid, msg = common.run_validation(
            [common.validate_string],
            username,
            required=True,
            name="username",
        )
        if not valid:
            raise exceptions.BadRequestException(msg)
        valid, msg = common.run_validation(
            [common.validate_string],
            password,
            required=True,
            name="password",
        )
        if not valid:
            raise exceptions.BadRequestException(msg)

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
        except IndexError as exc_info:
            # no row matched/unknown user
            print(
                f"INFO: Failed login attempt for username '{username}' "
                + "(unknown).",
                file=sys.stderr,
            )
            raise exceptions.UnauthorizedException(
                "Bad credentials."
            ) from exc_info

        # validate credentials
        if hashed_password != hash_password(password, salt):
            # password does not match
            print(
                f"INFO: Failed login attempt for username '{username}' "
                + "(bad password).",
                file=sys.stderr,
            )
            raise exceptions.UnauthorizedException("Bad credentials.")

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
        r = jsonify(common.wrap_response_json(None, None))
        r.set_cookie(
            FluxConfig.SESSION_COOKIE_NAME,
            session_id,
            max_age=365 * 24 * 60 * 60,
        )
        return r, 200

    @app.route("/api/v0/user/session", methods=["DELETE"])
    @common.session_cookie_auth(True)
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
        r = jsonify(common.wrap_response_json(None, None))
        r.delete_cookie(FluxConfig.SESSION_COOKIE_NAME)
        return r, 200

    @app.route("/api/v0/user/configuration", methods=["GET"])
    @common.session_cookie_auth()
    def get_configuration(_: str, username: str):
        """Returns configuration."""
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                "SELECT volume, muted, autoplay FROM users WHERE name=?",
                (username,),
            )

        if len(t.data) == 0:
            raise exceptions.NotFoundException(
                f"Unknown username '{username}'."
            )

        return (
            jsonify(
                common.wrap_response_json(
                    None,
                    {
                        "user": {"name": username, "isAdmin": False},
                        "settings": {
                            "volume": t.data[0][0],
                            "muted": t.data[0][1] == 1,
                            "autoplay": t.data[0][2] == 1,
                        },
                    },
                )
            ),
            200,
        )

    @app.route("/api/v0/user/configuration", methods=["PUT"])
    @common.session_cookie_auth()
    def put_configuration(_: str, username: str):
        """Returns configuration."""
        json = request.get_json(silent=True)
        if json is None:
            raise exceptions.BadRequestException("Missing JSON data.")

        # parse and validate
        cols = {}
        if "volume" in json.get("content", {}):
            valid, msg = common.run_validation(
                [common.validate_integer],
                json["content"]["volume"],
                name="content.volume",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            cols["volume"] = json["content"]["volume"]
        if "autoplay" in json.get("content", {}):
            valid, msg = common.run_validation(
                [common.validate_boolean],
                json["content"]["autoplay"],
                name="content.autoplay",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            cols["autoplay"] = 1 if json["content"]["autoplay"] else 0
        if "muted" in json.get("content", {}):
            valid, msg = common.run_validation(
                [common.validate_boolean],
                json["content"]["muted"],
                name="content.muted",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            cols["muted"] = 1 if json["content"]["muted"] else 0

        if len(cols) == 0:
            return jsonify(common.wrap_response_json(None, None)), 200

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

        return jsonify(common.wrap_response_json(None, None)), 200
