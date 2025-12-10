"""Index-API endpoints"""

from typing import Optional
import re

from flask import Flask, request, jsonify

from flux.db import Transaction
from flux.config import FluxConfig
from flux import exceptions
from flux.api import common


CONTENT_TYPES = [
    "series",
    # TODO: not supported yet
    # "movie",
    # "collection"
]


def validate_content_type(
    # pylint: disable=unused-argument
    type_: Optional[str],
    *,
    name=None,
) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if type_ is None:
        return None
    if type_ not in CONTENT_TYPES:
        return False, f"Unknown content type '{type_}'."
    return True, ""


def validate_range(
    # pylint: disable=unused-argument
    range_: Optional[str],
    *,
    name=None,
) -> tuple[bool, str]:
    """
    Returns tuple
    * validity
    * message (in case of invalidity)
    """
    if range_ is None:
        return None
    if not re.fullmatch(r"[0-9]+-[0-9]+", range_):
        return False, f"Bad range '{range_}'."
    return True, ""


def parse_range(range_: Optional[str]) -> Optional[tuple[int, int]]:
    """Returns either `None` or range-tuple."""
    if range_ is None:
        return None

    return tuple(map(int, range_.split("-")))


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/index/records", methods=["GET"])
    @common.session_cookie_auth(True)
    def list_records(
        # pylint: disable=unused-argument
        *args,
    ):
        """List records in index."""
        # validate&parse request
        search = request.args.get("search")
        type_ = request.args.get("type")
        range_ = request.args.get("range")
        if type_ is not None:
            valid, msg = common.run_validation(
                [validate_content_type],
                type_,
                required=False,
                name="content type",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
        if range_ is not None:
            valid, msg = common.run_validation(
                [validate_range],
                range_,
                required=False,
                name="range",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            range_ = parse_range(range_)

        # construct query filters
        filters = []
        filter_args = ()
        if search is not None:
            search = search.replace("%", r"\%").replace("_", r"\_")
            filters += [
                r"(name LIKE ? ESCAPE '\' OR description LIKE ? ESCAPE '\')",
            ]
            filter_args += (f"%{search}%", f"%{search}%")
        if type_ is not None:
            filters += ["type = ?"]
            filter_args += (type_,)

        # run queries
        # * total number of records
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                f"""
                SELECT COUNT(*)
                FROM records
                {'WHERE' if filters else ''} {' AND '.join(filters)}
                """,
                filter_args,
            )
        count = t.data[0][0]

        # * collect records
        range_filter = ""
        range_filter_args = ()
        if range_ is not None:
            range_filter += "LIMIT ? OFFSET ?"
            range_filter_args += (range_[1] - range_[0], range_[0])

        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
        ) as t:
            t.cursor.execute(
                f"""
                SELECT id, type, name, description, thumbnail_id
                FROM records
                {'WHERE' if filters else ''} {' AND '.join(filters)}
                {range_filter}
                """,
                filter_args + range_filter_args,
            )

        records = [
            dict(
                zip(("id", "type", "name", "description", "thumbnailId"), row)
            )
            for row in t.data
        ]

        return (
            jsonify(
                common.wrap_response_json(
                    None, {"count": count, "records": records}
                )
            ),
            200,
        )
