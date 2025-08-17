"""Common definitions for SQLite3-database."""

from typing import Optional, Any
from pathlib import Path
import sqlite3


class Transaction:
    """SQLite3-database transaction."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.connection: Optional[sqlite3.Connection] = None
        self.cursor: Optional[sqlite3.Cursor] = None
        self.data: Optional[list[Any]] = None

    def __enter__(self):
        self.connection = sqlite3.connect(self.path, autocommit=False)
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
