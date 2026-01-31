"""flux-backend definition."""

import sys
import socket
import urllib.request
from importlib.metadata import version
from uuid import uuid4
from traceback import format_exc

from werkzeug.exceptions import HTTPException
from flask import Flask, Response, send_from_directory, jsonify

from flux.config import FluxConfig
from flux.exceptions import APIException
from flux.api.static import register_api as register_static_api
from flux.api import common, v0 as api_v0


def load_cors(_app: Flask, url: str) -> None:
    """Loads CORS-extension if required."""
    try:
        # pylint: disable=import-outside-toplevel
        from flask_cors import CORS
    except ImportError:
        print(
            "\033[31mERROR: Missing 'Flask-CORS'-package for dev-server. "
            + "Install with 'pip install flask-cors'.\033[0m",
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        print("INFO: Configuring app for CORS.", file=sys.stderr)
        _ = CORS(
            _app,
            resources={"*": {"origins": url}},
            supports_credentials=True,
        )


def load_callback_url_options() -> list[dict]:
    """
    Returns a list of IP-addresses with a name.

    Every record contains the fields 'name' and 'address'.
    """
    options = []

    # get LAN-address (https://stackoverflow.com/a/28950776)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try:
        s.connect(("10.254.254.254", 1))
        options.append(
            {"address": "http://" + s.getsockname()[0], "name": "local"}
        )
    # pylint: disable=broad-exception-caught
    except Exception:
        pass
    finally:
        s.close()

    # get global IP
    try:
        with urllib.request.urlopen(
            "https://api.ipify.org", timeout=1
        ) as response:
            options.append(
                {
                    "address": "http://" + response.read().decode("utf-8"),
                    "name": "global",
                }
            )
    # pylint: disable=broad-exception-caught
    except Exception:
        pass

    return options


def print_welcome_message(config: FluxConfig) -> None:
    """Prints welcome message to stdout."""
    url_options = load_callback_url_options()
    lines = (
        (["Running in dev-mode."] if config.MODE == "dev" else [])
        + [
            "Your flux-instance will be available shortly.",
            "",
            "The following index location will be used:",
            (
                str(config.INDEX_LOCATION)[:30]
                + "..."
                + str(config.INDEX_LOCATION)[-30:]
                if len(str(config.INDEX_LOCATION)) > 70
                else str(config.INDEX_LOCATION)
            ),
        ]
        + (
            ["Password protection is active."]
            if config.PASSWORD is not None
            else []
        )
        + (
            ["", "The following addresses have been detected automatically:"]
            if url_options
            else []
        )
        + list(
            map(
                lambda o: f" * {o['name']}: {o['address']}:{config.PORT}",
                url_options,
            )
        )
    )
    delimiter = "#" * (max(map(len, lines)) + 4)
    print(delimiter)
    for line in lines:
        print(f"# {line}{' '*(len(delimiter) - len(line) - 4)} #")
    print(delimiter, flush=True)


def app_factory() -> Flask:
    """Returns flux-Flask app."""
    if not FluxConfig.INDEX_LOCATION.is_dir():
        print(
            "\033[1;31mERROR\033[0m: "
            + f"Index '{FluxConfig.INDEX_LOCATION}' does not exist.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not (FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE).is_file():
        print(
            "\033[1;31mERROR\033[0m: "
            + "Database "
            + f"'{FluxConfig.INDEX_LOCATION / FluxConfig.INDEX_DB_FILE}' does "
            + "not exist.",
            file=sys.stderr,
        )
        sys.exit(1)
    # TODO: run additional checks on database
    # * version-compatibility
    # * ..?
    if not FluxConfig.INDEX_LOCATION.is_absolute():
        FluxConfig.INDEX_LOCATION = FluxConfig.INDEX_LOCATION.resolve()

    # define Flask-app
    _app = Flask(__name__, static_folder=FluxConfig.STATIC_PATH)

    _app.config.from_object(FluxConfig)

    # extensions
    if FluxConfig.MODE == "dev":
        load_cors(_app, FluxConfig.DEV_CORS_FRONTEND_URL)

    # error handler
    @_app.errorhandler(Exception)
    def handle_exception(e):
        if isinstance(e, HTTPException):
            return e

        if isinstance(e, APIException):
            return (
                jsonify(
                    common.wrap_response_json(
                        {
                            "ok": False,
                            "error": {
                                "code": e.status,
                                "short": e.short,
                                "long": str(e),
                            },
                        },
                        None,
                    )
                ),
                200,
            )

        # print to log
        error_id = str(uuid4())
        print(
            "\033[31mERROR:\033[0m " + f" [{error_id}] " + format_exc(),
            file=sys.stderr,
        )

        if FluxConfig.MODE == "prod":
            return Response(
                f"INTERNAL SERVER ERROR (id: {error_id})",
                mimetype="text/plain",
                status=500,
            )
        return Response(
            f"INTERNAL SERVER ERROR: {e}",
            mimetype="text/plain",
            status=500,
        )

    # print welcome message
    if FluxConfig.MODE != "test":
        print_welcome_message(FluxConfig)

    @_app.route("/version", methods=["GET"])
    def get_version():
        """
        Returns app version.
        """
        return Response(version("flux"), mimetype="text/plain", status=200)

    register_static_api(_app)
    api_v0.default.register_api(_app)
    api_v0.user.register_api(_app)
    api_v0.index.register_api(_app)
    api_v0.playback.register_api(_app)

    @_app.route("/", defaults={"path": ""})
    @_app.route("/<path:path>")
    def get_client(path):
        """Serve static content."""
        if path != "" and (FluxConfig.STATIC_PATH / path).is_file():
            return send_from_directory(FluxConfig.STATIC_PATH, path)
        return send_from_directory(FluxConfig.STATIC_PATH, "index.html")

    return _app


def run(app=None):
    """Run flask-app."""
    # load default app
    if not app:
        app = app_factory()

    # not intended for production due to, e.g., cors
    if FluxConfig.MODE != "prod":
        print(
            "\033[1;33mWARNING\033[0m: "
            + f"Running in unexpected MODE '{FluxConfig.MODE}'.",
            file=sys.stderr,
        )

    # prioritize gunicorn over werkzeug
    try:
        import gunicorn.app.base
    except ImportError:
        print(
            "\033[1;33mWARNING\033[0m: "
            + "Running without proper wsgi-server.",
            file=sys.stderr,
        )
        app.run(host="0.0.0.0", port=FluxConfig.PORT)
    else:

        class StandaloneApplication(gunicorn.app.base.BaseApplication):
            """See https://docs.gunicorn.org/en/stable/custom.html"""

            def __init__(self, app_, options=None):
                self.options = options or {}
                self.application = app_
                super().__init__()

            def init(self, parser, opts, args):
                pass

            def load_config(self):
                _config = {
                    key: value
                    for key, value in self.options.items()
                    if key in self.cfg.settings and value is not None
                }
                for key, value in _config.items():
                    self.cfg.set(key.lower(), value)

            def load(self):
                return self.application

        StandaloneApplication(
            app,
            {
                "bind": f"0.0.0.0:{FluxConfig.PORT}",
                "workers": 1,
                "threads": FluxConfig.FLASK_THREADS,
            }
            | (FluxConfig.GUNICORN_OPTIONS or {}),
        ).run()
