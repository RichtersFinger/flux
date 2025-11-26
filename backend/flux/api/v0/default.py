"""Default-API endpoints"""

from flask import Flask, Response


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/ping", methods=["GET"])
    def ping():
        return Response("pong", mimetype="text/plain", status=206)
