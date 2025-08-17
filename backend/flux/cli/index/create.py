"""Definition of the create-subcommand."""

import sys
from importlib.metadata import version
import sqlite3

from befehl import Parser, Option, Command

from flux.config import FluxConfig
from ..common import verbose, index_location, get_index


class CreateIndex(Command):
    """Subcommand for creating index."""

    index_location = index_location
    verbose = verbose
    root = Option(
        "--root",
        helptext=(
            "data source root-directory for all records; all records to be "
            + "added to the index must be located in that directory; providing"
            + " a root allows to easily migrate the flux index later on if the"
            + " data source moves to a different location"
        ),
        nargs=1,
        parser=Parser.parse_as_dir,
    )

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        if verbose:
            print(f"Creating index at '{index}'")

        index.mkdir(parents=True, exist_ok=True)

        # read and process root-location
        root = args.get(self.root, [None])[0]

        if root is not None and verbose:
            print(f"Setting root to '{root}'")

        # create database
        index_db = index / FluxConfig.INDEX_DB_FILE
        if index_db.is_file():
            print(f"File '{index_db}' already exists", file=sys.stderr)
            sys.exit(1)

        if verbose:
            print(f"Creating database at '{index_db}'")

        db = sqlite3.connect(index_db)
        cursor = db.cursor()
        cursor.executescript(
            FluxConfig.SCHEMA_LOCATION.read_text(encoding="utf-8")
        )
        db.commit()

        # initialize database
        if verbose:
            print("Initializing database")

        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO index_metadata (schema_version) VALUES "
            + f"('{version('flux')}')"
        )
        if root is not None:
            cursor.execute(
                f"INSERT INTO index_metadata (root) VALUES ({str(root)})"
            )
        cursor.execute("INSERT INTO index_metadata (initialized) VALUES (1)")
