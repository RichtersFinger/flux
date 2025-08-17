"""Definition of the flux-api"""

from typing import Optional
from functools import wraps
import re

from flask import Flask, Response, jsonify, request

from flux.config import FluxConfig


def login_required(password: Optional[str]):
    """Protect endpoint with auth via 'X-Flux-Auth'-header."""

    def decorator(route):
        @wraps(route)
        def __():
            if request.headers.get("X-Flux-Auth") != password:
                return Response("FAILED", mimetype="text/plain", status=401)
            return route()

        return __

    return decorator


def register_api(app: Flask, config: FluxConfig):
    """Sets up api endpoints."""

    @app.route("/api/v0/configuration", methods=["GET"])
    def get_configuration():
        """
        Get basic info on configuration.
        """
        return jsonify({"passwordRequired": config.PASSWORD is not None}), 200

    @app.route("/api/v0/login", methods=["GET"])
    @login_required(config.PASSWORD)
    def get_login():
        """
        Test login.
        """
        return Response("OK", mimetype="text/plain", status=200)

    @app.route("/api/v0/video", methods=["GET"])
    @login_required(config.PASSWORD)
    def video():
        headers = request.headers
        if "range" not in headers:
            return Response(status=400)

        video_path = config.STATIC_PATH / request.args.get("id")
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
