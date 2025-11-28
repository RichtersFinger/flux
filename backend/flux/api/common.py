"""Common definitions for flux APIs."""

from typing import Optional
from functools import wraps

from flask import request, Response

from flux.db import Transaction
from flux.config import FluxConfig


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


def session_cookie_auth(delete_cookie_on_fail: bool = False):
    """
    Protect endpoint with auth via session-cookie.

    If credentials are valid, decorated view functions are called with
    session-id and username passed as positional arguments.
    """

    def decorator(route):
        @wraps(route)
        def __():
            if FluxConfig.SESSION_COOKIE_NAME not in request.cookies:
                return Response(
                    "UNAUTHORIZED", mimetype="text/plain", status=401
                )
            session_id = request.cookies[FluxConfig.SESSION_COOKIE_NAME]
            with Transaction(
                FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE,
                readonly=True,
            ) as t:
                t.cursor.execute(
                    "SELECT username FROM sessions WHERE id=?", (session_id,)
                )
            if len(t.data) == 0:
                # unknown session
                r = Response("UNAUTHORIZED", mimetype="text/plain", status=401)
                if delete_cookie_on_fail:
                    r.delete_cookie(FluxConfig.SESSION_COOKIE_NAME)
                return r
            return route(session_id, t.data[0][0])

        return __

    return decorator
