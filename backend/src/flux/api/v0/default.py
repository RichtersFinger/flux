"""Default-API endpoints"""

from flask import Flask, jsonify

from flux.api.common import wrap_response_json


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/ping", methods=["GET"])
    def ping():
        return jsonify(wrap_response_json(None, None)), 200
