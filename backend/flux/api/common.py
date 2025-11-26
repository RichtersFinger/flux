"""Common definitions for flux APIs."""

from typing import Optional
from functools import wraps

from flask import request, Response


def header_auth(password: Optional[str]):
    """Protect endpoint with auth via 'X-Flux-Auth'-header."""

    def decorator(route):
        @wraps(route)
        def __():
            if request.headers.get("X-Flux-Auth") != password:
                return Response("FAILED", mimetype="text/plain", status=401)
            return route()

        return __

    return decorator
