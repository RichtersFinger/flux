"""Definition of the flux-api"""

import re

from flask import Flask, Response, request, send_from_directory

from flux.config import FluxConfig
from flux.db import Transaction
from flux import exceptions
from .common import header_auth, session_cookie_auth


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/thumbnail/<thumbnail_id>", methods=["GET"])
    @session_cookie_auth()
    def thumbnail(
        # pylint: disable=unused-argument
        *args,
        thumbnail_id: str,
    ):
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
        ) as t:
            t.cursor.execute(
                "SELECT path FROM thumbnails WHERE id=?", (thumbnail_id,)
            )
        if len(t.data) == 0:
            raise exceptions.NotFoundException(
                f"Unknown thumbnail id '{thumbnail_id}'."
            )
        if not (
            FluxConfig.INDEX_LOCATION / FluxConfig.THUMBNAILS / t.data[0][0]
        ).is_file():
            raise exceptions.NotFoundException(
                f"Thumbnail '{thumbnail_id}' does not exist."
            )
        return send_from_directory(
            FluxConfig.INDEX_LOCATION / FluxConfig.THUMBNAILS, t.data[0][0]
        )

    @app.route("/video", methods=["GET"])
    @header_auth(FluxConfig.PASSWORD)
    def video():
        headers = request.headers
        if "range" not in headers:
            return Response(status=400)

        video_path = FluxConfig.STATIC_PATH / request.args.get("id")
        print(video_path.resolve())
        size = video_path.stat().st_size

        chunk_size = 10**6  # ~1MB
        print(headers["range"], int(re.sub(r"\D", "", headers["range"])))
        start = int(re.sub(r"\D", "", headers["range"]))
        end = min(start + chunk_size, size - 1)

        content_lenght = end - start + 1

        def get_chunk(video_path, start, chunk_size):
            with open(video_path, "rb") as f:
                f.seek(start)
                chunk = f.read(chunk_size)
            return chunk

        headers = {
            "Content-Range": f"bytes {start}-{end}/{size}",
            "Accept-Ranges": "bytes",
            "Content-Length": content_lenght,
            "Content-Type": "application/octet-stream",
        }

        return Response(get_chunk(video_path, start, chunk_size), 206, headers)
