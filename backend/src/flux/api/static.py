"""Definition of the flux-api"""

import re
from pathlib import Path

from flask import Flask, Response, request, send_from_directory

from flux.config import FluxConfig
from flux.db import Transaction
from flux import exceptions
from .common import session_cookie_auth


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

    # local cache for association between trackId and filepath
    track_cache: dict[str, Path] = {}

    @app.route("/video/<track_id>", methods=["GET"])
    @session_cookie_auth()
    def video(
        # pylint: disable=unused-argument
        *args,
        track_id: str,
    ):
        if "range" not in request.headers:
            return Response(status=400)

        video_path = track_cache.get(track_id)
        if video_path is None:
            with Transaction(
                FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE,
                readonly=True
            ) as t:
                t.cursor.execute(
                    "SELECT path FROM tracks WHERE id=?",
                    (track_id,),
                )
            if len(t.data) > 0 and t.data[0][0] is not None:
                track_cache[track_id] = Path(t.data[0][0])
                video_path = track_cache[track_id]

        if video_path is None:
            raise exceptions.NotFoundException(f"Unknown track '{track_id}'.")

        size = video_path.stat().st_size

        chunk_size = 10**6  # ~1MB
        # print(
        #     request.headers["range"],
        #     int(re.sub(r"\D", "", request.headers["range"])),
        # )
        start = int(re.sub(r"\D", "", request.headers["range"]))
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
