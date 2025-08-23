"""`flux`-configuration definition."""

import os
from pathlib import Path
from uuid import uuid4

from flux import db


class FluxConfig:
    """`flux`-configuration."""

    INDEX_LOCATION = (
        Path(os.environ["INDEX_LOCATION"])
        if "INDEX_LOCATION" in os.environ
        else Path(".flux")
    ).resolve()
    INDEX_DB_FILE = Path("index.db")
    SCHEMA_LOCATION = Path(db.__file__).parent / "schema.sql"
    THUMBNAILS = Path(".thumbnails")

    MODE = os.environ.get("MODE", "prod")  # "prod" | "dev"
    DEV_CORS_FRONTEND_URL = os.environ.get(
        "DEV_CORS_FRONTEND_URL", "http://localhost:3000"
    )
    PORT = os.environ.get("PORT", "8620" if MODE == "prod" else "5000")
    FLASK_THREADS = 5
    GUNICORN_OPTIONS = None

    STATIC_PATH = Path(__file__).parent / "client"
    SECRET_KEY = os.environ.get("SECRET_KEY", str(uuid4()))
    PASSWORD = os.environ.get("PASSWORD")
