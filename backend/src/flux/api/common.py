"""Common definitions for flux APIs."""

from typing import Optional, Mapping, Iterable, Callable, Any
from functools import wraps

from flask import request, Response, jsonify

from flux.db import Transaction
from flux.config import FluxConfig
from flux.exceptions import UnauthorizedException, NotFoundException


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
        def __(**kwargs):
            if FluxConfig.SESSION_COOKIE_NAME not in request.cookies:
                raise UnauthorizedException("Missing session cookie.")
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
                r = jsonify(
                    wrap_response_json(
                        {
                            "ok": False,
                            "error": {
                                "code": UnauthorizedException.status,
                                "short": UnauthorizedException.short,
                                "long": "Unknown session.",
                            },
                        },
                        None,
                    )
                )
                if delete_cookie_on_fail:
                    r.delete_cookie(FluxConfig.SESSION_COOKIE_NAME)
                return r, 200
            return route(session_id, t.data[0][0], **kwargs)

        return __

    return decorator


def validate_admin(username: str) -> tuple[bool, str]:
    """
    Validates user role to be admin. Returns `True` if ok, `False`
    alongside message otherwise.
    """
    with Transaction(
        FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
    ) as t:
        t.cursor.execute(
            "SELECT is_admin FROM users WHERE name=?",
            (username,),
        )

    if len(t.data) != 1:
        raise NotFoundException(f"Unknown user '{username}'.")

    if t.data[0][0] == 1:
        return True, ""
    return False, "Not allowed."


def run_validation(
    validation_steps: Iterable[Callable[[Any], tuple[bool, str]]],
    data: Any,
    *,
    required: bool = False,
    name: Optional[str] = None,
) -> tuple[bool, str]:
    """
    Runs `validation_steps` and exits on first failed validation.

    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    for step in validation_steps:
        if name is None:
            _name = ""
        else:
            _name = f" '{name}'"

        if required and data is None:
            return False, f"Missing required field{_name}."

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

    if not isinstance(data, str):
        return False, f"Bad type in field{name} (not a string)."
    if len(data) > maxlen:
        return False, f"Maximum allowed input length exceeded for field{name}."
    return True, ""


def validate_integer(
    data,
    *,
    minimum: Optional[int] = None,
    maximum: Optional[int] = None,
    name=None,
) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if name is None:
        name = ""
    else:
        name = f" '{name}'"

    if not isinstance(data, int):
        return False, f"Bad type in field{name} (not an integer)."
    if minimum is not None and data < minimum:
        return False, f"Value '{data}' too small for field{name}."
    if maximum is not None and data > maximum:
        return False, f"Value '{data}' too large for field{name}."
    return True, ""


def validate_number(
    data,
    *,
    minimum: Optional[int] = None,
    maximum: Optional[int] = None,
    name=None,
) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if name is None:
        name = ""
    else:
        name = f" '{name}'"

    if not isinstance(data, int) and not isinstance(data, float):
        return False, f"Bad type in field{name} (not a number)."
    if minimum is not None and data < minimum:
        return False, f"Value '{data}' too small for field{name}."
    if maximum is not None and data > maximum:
        return False, f"Value '{data}' too large for field{name}."
    return True, ""


def validate_boolean(
    data,
    *,
    name=None,
) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if name is None:
        name = ""
    else:
        name = f" '{name}'"

    if not isinstance(data, bool):
        return False, f"Bad type in field{name} (not a boolean)."
    return True, ""


def wrap_response_json(meta: Optional[Mapping], content: Optional[Mapping]):
    """
    Accepts a tuple of
    * a `meta` JSON-object or `None`, and
    * a `content` JSON-object or `None`

    and returns a JSONable-response.

    (Note that also the requestId-parameter is added automatically.)
    """

    if meta is None:
        meta = {}
    if request.args.get("requestId"):
        meta["id"] = request.args["requestId"]
    if "ok" not in meta:
        meta["ok"] = True

    response_json = {"meta": meta}
    if content is not None:
        response_json["content"] = content

    return response_json
