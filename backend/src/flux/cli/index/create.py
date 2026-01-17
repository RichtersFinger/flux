"""Definition of the create-subcommand."""

import sys
from importlib.metadata import version

from befehl import Command

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index


class CreateIndex(Command):
    """Subcommand for creating index."""

    index_location = index_location
    verbose = verbose

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        if verbose:
            print(f"Creating index at '{index}'")

        index.mkdir(parents=True, exist_ok=True)

        # create database
        index_db = index / FluxConfig.INDEX_DB_FILE
        if index_db.is_file():
            print(f"File '{index_db}' already exists", file=sys.stderr)
            sys.exit(1)

        if verbose:
            print(f"Creating database at '{index_db}'")

        # initialize database
        if verbose:
            print("Initializing database")

        with Transaction(index_db) as t:
            t.cursor.executescript(
                FluxConfig.SCHEMA_LOCATION.read_text(encoding="utf-8")
            )
            t.cursor.execute(
                "INSERT INTO index_metadata (schema_version) VALUES (?)",
                (version("flux"),)
            )
            t.cursor.execute(
                "INSERT INTO index_metadata (initialized) VALUES (1)"
            )

        if verbose:
            print("Created a new index")
