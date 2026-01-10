"""Playback-API endpoints"""

from math import floor
from time import time

from flask import Flask, request, jsonify

from flux.db import Transaction
from flux.config import FluxConfig
from flux import exceptions
from flux.api import common


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/playback/<record_id>", methods=["POST"])
    @common.session_cookie_auth()
    def update_playback(
        # pylint: disable=unused-argument
        _: str,
        username: str,
        record_id: str,
    ):
        """Create or update playback."""
        json = request.get_json(silent=True)
        if json is None:
            raise exceptions.BadRequestException("Missing JSON data.")

        # parse and validate
        if "content" not in json:
            raise exceptions.BadRequestException(
                "Missing required 'content' in JSON data."
            )
        if "videoId" not in json["content"]:
            raise exceptions.BadRequestException(
                "Missing required 'content.videoId' in JSON data."
            )
        if "timestamp" not in json["content"]:
            raise exceptions.BadRequestException(
                "Missing required 'content.timestamp' in JSON data."
            )

        valid, msg = common.run_validation(
            [common.validate_string],
            json["content"]["videoId"],
            name="content.videoId",
        )
        if not valid:
            raise exceptions.BadRequestException(msg)
        valid, msg = common.run_validation(
            [common.validate_number],
            json["content"]["timestamp"],
            name="content.timestamp",
        )
        if not valid:
            raise exceptions.BadRequestException(msg)

        # run db update
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                """
                INSERT OR REPLACE
                INTO playbacks (
                    username, record_id, video_id, timestamp, changed
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    username,
                    record_id,
                    json["content"]["videoId"],
                    json["content"]["timestamp"],
                    floor(time()),
                ),
            )

        return jsonify(common.wrap_response_json(None, None)), 200

    @app.route("/api/v0/playback/<record_id>", methods=["DELETE"])
    @common.session_cookie_auth()
    def delete_playback(
        # pylint: disable=unused-argument
        _: str,
        username: str,
        record_id: str,
    ):
        """Delete playback."""
        # run db update
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                """
                DELETE FROM playbacks
                WHERE username=? AND record_id=?
                """,
                (username, record_id),
            )
        return jsonify(common.wrap_response_json(None, None)), 200
