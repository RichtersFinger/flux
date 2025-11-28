"""Common definitions for SQLite3-database."""

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
        self.connection = sqlite3.connect(
            f"file:{self.path.resolve()}{'?mode=ro' if self.readonly else ''}",
            autocommit=False,
            uri=True,
        )
        self.connection.execute("PRAGMA foreign_keys = 1")
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
