"""flux-backend definition."""

import sys
import socket
import urllib.request
from importlib.metadata import version

from flask import Flask, Response, send_from_directory

from flux.config import FluxConfig
from .api import register_api


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
    print(delimiter)


def app_factory(config: FluxConfig) -> Flask:
    """Returns flux-Flask app."""
    if not config.INDEX_LOCATION.is_dir():
        print(
            "\033[1;31mERROR\033[0m: "
            + f"Index '{config.INDEX_LOCATION}' does not exist.",
            file=sys.stderr,
        )
        sys.exit(1)
    if not (config.INDEX_LOCATION / config.INDEX_DB_FILE).is_file():
        print(
            "\033[1;31mERROR\033[0m: "
            + f"Database '{config.INDEX_LOCATION / config.INDEX_DB_FILE}' does"
            + " not exist.",
            file=sys.stderr,
        )
        sys.exit(1)
    # TODO: run additional checks on database
    # * version-compatibility
    # * ..?
    if not config.INDEX_LOCATION.is_absolute():
        config.INDEX_LOCATION = config.INDEX_LOCATION.resolve()

    # define Flask-app
    _app = Flask(__name__, static_folder=config.STATIC_PATH)

    _app.config.from_object(config)

    # extensions
    if config.MODE == "dev":
        load_cors(_app, config.DEV_CORS_FRONTEND_URL)

    # print welcome message
    print_welcome_message(config)

    @_app.route("/ping", methods=["GET"])
    def ping():
        """
        Returns 'pong'.
        """
        return Response("pong", mimetype="text/plain", status=200)

    @_app.route("/version", methods=["GET"])
    def get_version():
        """
        Returns app version.
        """
        return Response(version("flux"), mimetype="text/plain", status=200)

    register_api(_app, config)

    @_app.route("/", defaults={"path": ""})
    @_app.route("/<path:path>")
    def get_client(path):
        """Serve static content."""
        if path != "":
            return send_from_directory(config.STATIC_PATH, path)
        return send_from_directory(config.STATIC_PATH, "index.html")

    return _app


def run(app=None, config=None):
    """Run flask-app."""
    # load default config
    if not config:
        config = FluxConfig()

    # load default app
    if not app:
        app = app_factory(config)

    # not intended for production due to, e.g., cors
    if config.MODE != "prod":
        print(
            "\033[1;33mWARNING\033[0m: "
            + f"Running in unexpected MODE '{config.Mode}'.",
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
        app.run(host="0.0.0.0", port=config.PORT)
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
                "bind": f"0.0.0.0:{config.PORT}",
                "workers": 1,
                "threads": config.FLASK_THREADS,
            }
            | (config.GUNICORN_OPTIONS or {}),
        ).run()
