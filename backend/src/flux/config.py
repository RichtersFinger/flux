"""`flux`-configuration definition."""

import os
from pathlib import Path
from uuid import uuid4

from flux import db


class FluxConfig:
    """`flux`-configuration singleton."""

    INDEX_LOCATION = (
        Path(os.environ["INDEX_LOCATION"])
        if "INDEX_LOCATION" in os.environ
        else Path(".flux")
    ).resolve()
    INDEX_DB_FILE = Path("index.db")
    SCHEMA_LOCATION = Path(db.__file__).parent / "schema.sql"
    THUMBNAILS = Path(".thumbnails")
    THUMBNAILS_SIZE_UPPER_BOUND_UPLOAD = 10 * 2**20  # ~ 10MB
    THUMBNAILS_SIZE_UPPER_BOUND = 2**18  # ~ 256KB

    MODE = os.environ.get("MODE", "prod")  # "prod" | "dev" | "test"
    DEV_CORS_FRONTEND_URL = os.environ.get(
        "DEV_CORS_FRONTEND_URL", "http://localhost:3000"
    )
    BIND_ADDRESS = os.environ.get(
        "BIND_ADDRESS", "0.0.0.0" if MODE == "prod" else "127.0.0.1"
    )
    PORT = os.environ.get("PORT", "8620" if MODE == "prod" else "5000")
    FLASK_WORKERS = 1
    FLASK_THREADS = 5
    GUNICORN_OPTIONS = None

    STATIC_PATH = Path(__file__).parent / "client"
    SECRET_KEY = os.environ.get("SECRET_KEY", str(uuid4()))
    PASSWORD = os.environ.get("PASSWORD")
    SESSION_COOKIE_NAME = "fluxSession"
