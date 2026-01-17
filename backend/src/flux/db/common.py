"""Common definitions for SQLite3-database."""

import sys
from typing import Optional, Any
from pathlib import Path
import sqlite3


class Transaction:
    """SQLite3-database transaction."""

    def __init__(self, path: Path, *, readonly: bool = False) -> None:
        self.path = path
        self.readonly = readonly
        self.connection: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None
        self.data: Optional[list[Any]] = None

    def __enter__(self):
        uri = (
            f"file:{self.path.resolve()}{'?mode=ro' if self.readonly else ''}"
        )
        if sys.version_info[1] >= 12:
            self.connection = sqlite3.connect(uri, autocommit=True, uri=True)
        else:
            self.connection = sqlite3.connect(
                uri, isolation_level=None, uri=True
            )
        self.connection.execute("PRAGMA foreign_keys = ON")
        if sys.version_info[1] >= 12:
            self.connection.autocommit = False
        else:
            self.connection.isolation_level = ""
        self.cursor = self.connection.cursor()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.connection.commit()
            self.data = self.cursor.fetchall()
        else:
            self.connection.rollback()

        self.cursor.close()
        self.connection.close()
