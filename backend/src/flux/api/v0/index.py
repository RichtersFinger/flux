"""Index-API endpoints"""

from typing import Optional, Mapping
import sys
import re
from json import loads
import base64
from uuid import uuid4
import subprocess

from flask import Flask, request, jsonify

from flux.db import Transaction
from flux.config import FluxConfig
from flux import exceptions
from flux.api import common


CONTENT_TYPES = [
    "series",
    "movie",
    "collection",
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


def parse_and_filter_track_metadata(
    metadata: Optional[str | Mapping],
) -> Optional[Mapping]:
    """Parses and filters ffprobe-metadata."""
    if metadata is None:
        return None
    if isinstance(metadata, str):
        metadata = loads(metadata)
    return {
        "duration": metadata.get("format", {}).get("duration"),
        "format_long_name": metadata.get("format", {}).get("format_long_name"),
        "format_name": metadata.get("format", {}).get("format_name"),
        "bit_rate": metadata.get("format", {}).get("bit_rate"),
    }


def get_record_info(id_: str):
    """
    Load record and record-content data from database.

    Keyword arguments:
    id_ -- recordId or videoId.
    """

    # * record: prioritize query with recordId
    with Transaction(
        FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
    ) as t:
        t.cursor.execute(
            """
            SELECT id, type, name, description, thumbnail_id
            FROM records
            WHERE id=?
            """,
            (id_,),
        )

    # * if no matching recordId, try as videoId
    if len(t.data) == 0:
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE,
            readonly=True,
        ) as t:
            t.cursor.execute(
                """
                SELECT
                    records.id,
                    records.type,
                    records.name,
                    records.description,
                    records.thumbnail_id
                FROM records
                JOIN videos ON records.id = videos.record_id
                WHERE videos.id = ?
                """,
                (id_,),
            )

    if len(t.data) == 0:
        raise exceptions.NotFoundException(f"Unknown record or video '{id_}'.")

    record = dict(
        zip(
            ("id", "type", "name", "description", "thumbnailId"),
            t.data[0],
        )
    )
    id_ = record["id"]

    match record["type"]:
        case "movie":
            with Transaction(
                FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE,
                readonly=True,
            ) as t:
                t.cursor.execute(
                    """
                    SELECT
                        videos.id,
                        tracks.id,
                        tracks.metadata_json
                    FROM
                        videos
                        JOIN tracks ON videos.id = tracks.video_id
                    WHERE videos.record_id=?
                    """,
                    (id_,),
                )
            if len(t.data) != 1:
                raise ValueError(f"Missing or bad data for record '{id_}'")
            record["content"] = dict(
                zip(
                    (
                        "id",
                        "trackId",
                        "metadata",
                        "name",
                        "description",
                        "thumbnailId",
                    ),
                    # the video-name/description/thumbnailId is omitted
                    # in db (use record instead)
                    t.data[0]
                    + (
                        record["name"],
                        record["description"],
                        record["thumbnailId"],
                    ),
                )
            )
            record["content"]["metadata"] = parse_and_filter_track_metadata(
                record["content"]["metadata"]
            )
        case "series":
            record["content"] = {}
            with Transaction(
                FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE,
                readonly=True,
            ) as t:
                # * seasons
                record["content"]["seasons"] = []
                t.cursor.execute(
                    """
                    SELECT id, name
                    FROM seasons
                    WHERE record_id=?
                    ORDER BY position
                    """,
                    (id_,),
                )
                for row in t.cursor.fetchall():
                    season = dict(zip({"id", "name"}, row))
                    record["content"]["seasons"].append(season)
                    t.cursor.execute(
                        """
                        SELECT
                            videos.id,
                            videos.name,
                            videos.description,
                            videos.thumbnail_id,
                            tracks.id,
                            tracks.metadata_json
                        FROM
                            videos
                            JOIN tracks ON videos.id = tracks.video_id
                        WHERE videos.record_id=? AND videos.season_id=?
                        ORDER BY videos.position
                        """,
                        (id_, row[0]),
                    )
                    season["episodes"] = []
                    for row_ in t.cursor.fetchall():
                        episode = dict(
                            zip(
                                (
                                    "id",
                                    "name",
                                    "description",
                                    "thumbnailId",
                                    "trackId",
                                    "metadata",
                                ),
                                row_,
                            )
                        )
                        episode["metadata"] = parse_and_filter_track_metadata(
                            episode["metadata"]
                        )
                        season["episodes"].append(episode)
                # * specials
                record["content"]["specials"] = []
                t.cursor.execute(
                    """
                    SELECT
                        videos.id,
                        videos.name,
                        videos.description,
                        videos.thumbnail_id,
                        tracks.id,
                        tracks.metadata_json
                    FROM
                        videos
                        JOIN tracks ON videos.id = tracks.video_id
                    WHERE videos.record_id=? AND videos.season_id IS NULL
                    ORDER BY videos.position
                    """,
                    (id_,),
                )
                for row in t.cursor.fetchall():
                    special = dict(
                        zip(
                            (
                                "id",
                                "name",
                                "description",
                                "thumbnailId",
                                "trackId",
                                "metadata",
                            ),
                            row,
                        )
                    )
                    special["metadata"] = parse_and_filter_track_metadata(
                        special["metadata"]
                    )
                    record["content"]["specials"].append(special)
        case "collection":
            record["content"] = []
            with Transaction(
                FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE,
                readonly=True,
            ) as t:
                t.cursor.execute(
                    """
                    SELECT
                        videos.id,
                        videos.name,
                        videos.description,
                        videos.thumbnail_id,
                        tracks.id,
                        tracks.metadata_json
                    FROM
                        videos
                        JOIN tracks ON videos.id = tracks.video_id
                    WHERE videos.record_id=?
                    """,
                    (id_,),
                )
            for row in t.data:
                video = dict(
                    zip(
                        (
                            "id",
                            "name",
                            "description",
                            "thumbnailId",
                            "trackId",
                            "metadata",
                        ),
                        row,
                    )
                )
                video["metadata"] = parse_and_filter_track_metadata(
                    video["metadata"]
                )
                record["content"].append(video)
        case _:
            raise ValueError(
                f"Unknown record-type '{record['type']}' for record/video "
                + f"'{id_}'."
            )
    return record


def register_api(app: Flask):
    """Sets up api endpoints."""

    @app.route("/api/v0/index/records", methods=["GET"])
    @common.session_cookie_auth()
    def list_records(
        _: str,
        username: str,
    ):
        """List records in index."""
        # validate&parse request
        search = request.args.get("search")
        type_ = request.args.get("type")
        range_ = request.args.get("range")
        continue_ = request.args.get("continue", "false") == "true"
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
            if continue_:
                filters += [
                    r"(records.name LIKE ? ESCAPE '\' OR records.description LIKE ? ESCAPE '\')",
                ]
            else:
                filters += [
                    r"(name LIKE ? ESCAPE '\' OR description LIKE ? ESCAPE '\')",
                ]
            filter_args += (f"%{search}%", f"%{search}%")
        if type_ is not None:
            if continue_:
                filters += ["records.type = ?"]
            else:
                filters += ["type = ?"]
            filter_args += (type_,)

        if continue_:
            filters += ["playbacks.username = ?"]
            filter_args += (username,)

        # run queries
        # * total number of records
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
        ) as t:
            t.cursor.execute(
                (
                    f"""
                    SELECT COUNT(*)
                    FROM records {
                        "JOIN playbacks ON records.id = playbacks.record_id"
                        if continue_ else
                        ""
                    }
                    {'WHERE' if filters else ''} {' AND '.join(filters)}
                    """
                ),
                filter_args,
            )
        count = t.data[0][0]

        # * collect records
        range_filter = ""
        range_filter_args = ()
        if range_ is not None:
            range_filter += "LIMIT ? OFFSET ?"
            range_filter_args += (range_[1] - range_[0], range_[0])

        # * order
        order_by = "playbacks.changed DESC" if continue_ else "id"

        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
        ) as t:
            t.cursor.execute(
                (
                    f"""
                    SELECT
                        records.id,
                        records.type,
                        records.name,
                        records.description,
                        records.thumbnail_id
                    FROM records {
                        "JOIN playbacks ON records.id = playbacks.record_id"
                        if continue_ else
                        ""
                    }
                    {'WHERE' if filters else ''} {' AND '.join(filters)}
                    ORDER BY {order_by}
                    {range_filter}
                    """
                ),
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

    @app.route("/api/v0/index/record/<id_>", methods=["GET"])
    @common.session_cookie_auth()
    def get_record(
        # pylint: disable=unused-argument
        *args,
        id_: str,
    ):
        """Get detailed record-info."""
        # run queries
        return (
            jsonify(common.wrap_response_json(None, get_record_info(id_))),
            200,
        )

    @app.route("/api/v0/index/<record_or_video>/<id_>", methods=["PUT"])
    @common.session_cookie_auth()
    def put_record_or_video(
        _: str,
        username: str,
        record_or_video: str,
        id_: str,
    ):
        """Updates record/video info."""
        valid, msg = common.validate_admin(username)
        if not valid:
            raise exceptions.BadRequestException(msg)

        if record_or_video not in ["record", "video"]:
            raise exceptions.NotFoundException(
                f"Unknown resource type '{record_or_video}'."
            )

        json = request.get_json(silent=True)
        if json is None:
            raise exceptions.BadRequestException("Missing JSON data.")

        # parse and validate metadata
        cols = {}
        if "name" in json.get("content", {}):
            valid, msg = common.run_validation(
                [common.validate_string],
                json["content"]["name"],
                name="content.name",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            cols["name"] = json["content"]["name"]
        if "description" in json.get("content", {}):
            valid, msg = common.run_validation(
                [
                    lambda *args, **kwargs: common.validate_string(
                        *args, **(kwargs | {"maxlen": 2048})
                    )
                ],
                json["content"]["description"],
                name="content.description",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            cols["description"] = json["content"]["description"]

        # process thumbnail
        thumbnail = None
        if "thumbnail" in json.get("content", {}):
            valid, msg = common.run_validation(
                [
                    lambda *args, **kwargs: common.validate_string(
                        *args, **(kwargs | {"maxlen": FluxConfig.THUMBNAILS_SIZE_UPPER_BOUND_UPLOAD})
                    )
                ],
                json["content"]["thumbnail"],
                name="content.thumbnail",
            )
            if not valid:
                raise exceptions.BadRequestException(msg)
            thumbnail = json["content"]["thumbnail"]

        thumbnail_id = None
        thumbnail_filename = None
        if thumbnail:
            thumbnail_id = str(uuid4())
            thumbnail_filename = thumbnail_id
            thumbnail_path = (
                FluxConfig.INDEX_LOCATION
                / FluxConfig.THUMBNAILS
                / thumbnail_filename
            )
            thumbnail_path.write_bytes(
                base64.decodebytes(thumbnail.split(",")[1].encode("utf-8"))
            )
            # for large files, try to rescale
            if len(thumbnail) > FluxConfig.THUMBNAILS_SIZE_UPPER_BOUND:
                try:
                    subprocess.run(
                        [
                            "ffmpeg",
                            "-y",
                            "-v",
                            "error",
                            "-i",
                            str(thumbnail_path),
                            "-vf",
                            "scale=720:-1",
                            str(thumbnail_path) + ".jpg",
                        ],
                        check=True,
                        capture_output=True,
                        text=True,
                    )
                except subprocess.CalledProcessError as exc_info:
                    print(
                        "\033[1;33m"
                        + "Failed to rescale thumbnail from "
                        + f"'{thumbnail_path}' at '{thumbnail_path}': "
                        + f"{exc_info} ({exc_info.stderr})"
                        + "\033[0m",
                        file=sys.stderr,
                    )
                    raise exc_info

            cols["thumbnail_id"] = thumbnail_id

        # run query to update metadata if needed
        if len(cols) > 0:
            with Transaction(
                FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE
            ) as t:
                if thumbnail_filename:
                    t.cursor.execute(
                        "INSERT INTO thumbnails VALUES (?, ?)",
                        (thumbnail_id, thumbnail_filename),
                    )
                t.cursor.execute(
                    # pylint: disable=consider-using-f-string
                    "UPDATE {}s SET {} WHERE id=?".format(
                        record_or_video,
                        ", ".join(map(lambda k: f"{k}=?", cols.keys()))
                    ),
                    tuple(cols.values()) + (id_,),
                )

        return jsonify(common.wrap_response_json(None, None)), 200

    @app.route("/api/v0/index/video/<video_id>", methods=["GET"])
    @common.session_cookie_auth()
    def get_video(
        # pylint: disable=unused-argument
        *args,
        video_id: str,
    ):
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
        ) as t:
            t.cursor.execute(
                """
                SELECT
                    videos.id,
                    videos.name,
                    videos.description,
                    videos.thumbnail_id,
                    tracks.id,
                    tracks.metadata_json
                FROM
                    videos
                    JOIN tracks ON videos.id = tracks.video_id
                WHERE videos.id=?
                """,
                (video_id,),
            )

        if len(t.data) == 0:
            raise exceptions.NotFoundException(f"Unknown video '{video_id}'.")

        video = dict(
            zip(
                (
                    "id",
                    "name",
                    "description",
                    "thumbnailId",
                    "trackId",
                    "metadata",
                ),
                t.data[0],
            )
        )
        video["metadata"] = parse_and_filter_track_metadata(video["metadata"])

        return (
            jsonify(common.wrap_response_json(None, video)),
            200,
        )

    @app.route(
        "/api/v0/index/record/<record_id>/current-video", methods=["GET"]
    )
    @common.session_cookie_auth()
    def get_current_video(
        _: str,
        username: str,
        record_id: str,
    ):
        """Get current video-info."""
        video = None
        timestamp = 0
        # * check for ongoing playbacks
        with Transaction(
            FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE, readonly=True
        ) as t:
            t.cursor.execute(
                """
                SELECT video_id, timestamp
                FROM playbacks
                WHERE username=? AND record_id=?
                """,
                (
                    username,
                    record_id,
                ),
            )
            query = t.cursor.fetchall()
            if len(query) > 0:
                timestamp = query[0][1]
                t.cursor.execute(
                    """
                    SELECT
                        videos.id,
                        videos.name,
                        videos.description,
                        videos.thumbnail_id,
                        tracks.id,
                        tracks.metadata_json
                    FROM
                        videos
                        JOIN tracks ON videos.id = tracks.video_id
                    WHERE videos.id=?
                    """,
                    (query[0][0],),
                )
                query = t.cursor.fetchall()
                if len(query) > 0:
                    video = dict(
                        zip(
                            (
                                "id",
                                "name",
                                "description",
                                "thumbnailId",
                                "trackId",
                                "metadata",
                            ),
                            query[0],
                        )
                    )

        # * start anew
        if video is None:
            # FIXME: this can be optimized to only fetch relevant parts from db
            # (instead of everything)
            record = get_record_info(record_id)
            match record["type"]:
                case "movie":
                    video = record["content"]
                case "series":
                    if len(record["content"]["seasons"]) > 0:
                        video = record["content"]["seasons"][0]["episodes"][0]
                    else:
                        video = record["content"]["specials"][0]
                case "collection":
                    video = record["content"][0]
                case _:
                    raise ValueError(
                        f"Unknown record-type '{record['type']}' for record "
                        + f"'{record_id}'."
                    )

        return (
            jsonify(
                common.wrap_response_json(
                    None,
                    {"video": video, "playback": {"timestamp": timestamp}},
                )
            ),
            200,
        )
