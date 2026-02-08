"""Definition of the migrate-subcommand."""

import sys
from pathlib import Path
from importlib.metadata import version
from datetime import datetime

from befehl import Command

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index
from .common import compare_versions


class Migrate(Command):
    """Subcommand for migrating flux-db."""

    index_location = index_location
    verbose = verbose

    @classmethod
    def migrate_database(cls, index: Path, verbose: bool) -> None:
        # pylint: disable=redefined-outer-name
        """Perform any required database migrations."""
        CATALOGUE = {
            # "0.1.0": [STATEMENT_0, STATEMENT_1],
            # "0.2.0": [STATEMENT_1],
            # ...
        }

        new = version("flux")
        with Transaction(index / FluxConfig.INDEX_DB_FILE) as t:
            t.cursor.execute("SELECT schema_version FROM index_metadata")
            old = (t.cursor.fetchone() or ("unknown",))[0]
            if verbose:
                print(f"Current app version is {new}.")
                print(f"Current database-schema version is {old}.")
            if new == old:
                if verbose:
                    print("Already up to date.")
                sys.exit(0)
            if not compare_versions(new, old):
                print(
                    "ERROR: App-version is behind or not canonical (cannot "
                    + "migrate). Please run 'flux update'.",
                    file=sys.stderr,
                )
                sys.exit(1)
            for s in CATALOGUE.get(new, []):
                t.cursor.execute(s)
            t.cursor.execute(
                """
                UPDATE index_metadata
                SET schema_version=?
                WHERE schema_version=?
                """,
                (new, old),
            )
            t.cursor.execute(
                """
                INSERT INTO migrations
                (from_version, to_version, completed_at)
                VALUES (?, ?, ?)
                """,
                (old, new, datetime.now().isoformat())
            )
        if verbose:
            print(f"New database-schema version is {new}.")

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        # validate index
        if not (index / FluxConfig.INDEX_DB_FILE).is_file():
            print(
                f"ERROR: No valid index at '{index}'.",
                file=sys.stderr,
            )

        if verbose:
            print(f"Using index at '{index}'")

        if verbose:
            print("Checking for database migrations...")

        self.migrate_database(index, verbose)
