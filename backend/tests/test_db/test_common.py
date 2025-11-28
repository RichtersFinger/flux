"""Test database."""

from pathlib import Path
from uuid import uuid4
from sqlite3 import OperationalError

import pytest

from flux.db import Transaction
from flux.config import FluxConfig


def test_simple_transaction(tmp: Path):
    """Test simple `Transaction`s."""
    db = tmp / str(uuid4())
    with Transaction(db) as t:
        t.cursor.execute("CREATE TABLE a (id TEXT)")
        t.cursor.execute("INSERT INTO a VALUES ('id')")

    with Transaction(db) as t:
        t.cursor.execute("SELECT * FROM a")

    assert len(t.data) == 1
    assert t.data[0] == ("id",)


def test_ro_transaction(tmp: Path):
    """Test read-only `Transaction`s."""
    db = tmp / str(uuid4())
    with Transaction(db) as t:
        t.cursor.execute("CREATE TABLE a (id TEXT)")
        t.cursor.execute("INSERT INTO a VALUES ('id')")

    with Transaction(db, readonly=True) as t:
        t.cursor.execute("SELECT * FROM a")

    assert len(t.data) == 1

    with pytest.raises(OperationalError):
        with Transaction(db, readonly=True) as t:
            t.cursor.execute("INSERT INTO a VALUES ('id2')")


def test_transaction_rollback(tmp: Path):
    """Test `Transaction` for bad queries."""
    db = tmp / str(uuid4())

    with Transaction(db) as t:
        t.cursor.execute("CREATE TABLE a (id TEXT)")

    with pytest.raises(OperationalError):
        with Transaction(db) as t:
            t.cursor.execute("INSERT INTO a VALUES ('id')")
            t.cursor.execute("CREATE TABLE a (id TEXT)")

    with Transaction(db, readonly=True) as t:
        t.cursor.execute("SELECT * FROM a")

    assert len(t.data) == 0


def test_schema(tmp: Path):
    """Test simple `Transaction`s."""
    db = tmp / str(uuid4())
    with Transaction(db) as t:
        t.cursor.executescript(
            FluxConfig.SCHEMA_LOCATION.read_text(encoding="utf-8")
        )
