"""Definitions of the run-subcommand."""

import sys
from pathlib import Path
from importlib.metadata import version

from befehl import Command, Option

from flux import app, config
from flux.config import FluxConfig
from flux.db import Transaction
from .common import verbose, index_location, get_index
from .index.create import create_index


class Run(Command):
    """Subcommand for running flux."""

    index_location = index_location
    auto_create = Option(
        "--auto-create",
        helptext="automatically create index if it does not exist yet",
    )
    skip_version_check = Option(
        "--skip-version-check",
        helptext="ignore mismatch in app- and db-versions",
    )
    verbose = verbose

    def cleanup_thumbnails(
        # pylint: disable=redefined-outer-name
        self, index: Path, verbose: bool
    ):
        """
        Cleans up unreferenced thumbnails from database and filesystem.
        """
        # find thumbnails to clean up
        with Transaction(index / config.FluxConfig.INDEX_DB_FILE) as t:
            t.cursor.execute(
                """
                DELETE FROM thumbnails
                WHERE
                    NOT EXISTS (
                        SELECT 1 FROM records
                        WHERE thumbnails.id = records.thumbnail_id
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM videos
                        WHERE thumbnails.id = videos.thumbnail_id
                    )
                RETURNING thumbnails.id, thumbnails.path
                """
            )
            # this explicit fetchall is required because of the
            # RETURNING-clause
            thumbnail_rows = t.cursor.fetchall()

        if verbose and len(thumbnail_rows) > 0:
            print(f"  {len(thumbnail_rows)} thumbnail(s) to be deleted..")

        # run cleanup
        for thumbnail_id, path in thumbnail_rows:
            if verbose:
                print(
                    f"  deleting thumbnail '{thumbnail_id}' at "
                    + f"'{config.FluxConfig.THUMBNAILS / path}'"
                )
            (index / config.FluxConfig.THUMBNAILS / path).unlink(
                missing_ok=True
            )

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        # create index if necessary
        if (
            self.auto_create in args
            and not (index / FluxConfig.INDEX_DB_FILE).is_file()
        ):
            create_index(index, verbose)

        # validate index
        if not (index / FluxConfig.INDEX_DB_FILE).is_file():
            print(
                f"ERROR: No valid index at '{index}'.",
                file=sys.stderr,
            )
            if self.index_location not in args:
                print(
                    f"Run with option '{self.index_location.names[0]}' to "
                    + "specify a different index location.",
                    file=sys.stderr
                )
            if self.auto_create not in args:
                print(
                    f"Run with option '{self.auto_create.names[0]}' to "
                    + "automatically create a new index.",
                    file=sys.stderr
                )
            sys.exit(1)

        if index is not None:
            if verbose:
                print(f"Using index at '{index}'")
            config.FluxConfig.INDEX_LOCATION = index

        # validate app- and db-version
        flux_version = version("flux")
        with Transaction(index / config.FluxConfig.INDEX_DB_FILE) as t:
            t.cursor.execute("SELECT schema_version FROM index_metadata")
            db_version = (t.cursor.fetchone() or ("unknown",))[0]
            if verbose:
                print(f"App-version: {flux_version}")
                print(f"Database-version: {db_version}")
            if db_version != flux_version:
                if self.skip_version_check in args:
                    print(
                        "WARNING: Mismatch in database schema version. "
                        + "Please run 'flux update migrate'.",
                        file=sys.stderr,
                    )
                else:
                    print(
                        "ERROR: Mismatch in database schema version. "
                        + "Please run 'flux update migrate'.",
                        file=sys.stderr,
                    )
                    sys.exit(1)

        # cleanup
        if verbose:
            print("Running cleanup-routine..")
        self.cleanup_thumbnails(index, verbose)

        app.app.run()
