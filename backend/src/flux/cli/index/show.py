"""Definition of the show-subcommand."""

import os
from pathlib import Path

from befehl import Command

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index


class ShowIndex(Command):
    """Subcommand for showing index content."""

    index_location = index_location
    verbose = verbose

    def show_verbose(self, index: Path):
        """Print index contents in verbose/table-format."""
        try:
            columns, _ = os.get_terminal_size()
        except OSError:
            columns = 80

        columns = min(columns, 120)

        lines = []
        lines.append(f"{'ID':<36} | {'Type':<10} | Name ")
        lines.append("-" * columns)

        with Transaction(index / FluxConfig.INDEX_DB_FILE, readonly=True) as t:
            t.cursor.execute("SELECT id, type, name FROM records")

        for row in t.data:
            lines.append(f"{row[0]:<36} | {row[1]:<10} | {row[2]}")

        for line in lines:
            if len(line) > columns:
                print(line[0 : columns - 1] + "…")
            else:
                print(line)

    def show_non_verbose(self, index: Path):
        """Print index contents in plain identifiers."""
        with Transaction(index / FluxConfig.INDEX_DB_FILE, readonly=True) as t:
            t.cursor.execute("SELECT id FROM records")

        for row in t.data:
            print(row[0])

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        if verbose:
            self.show_verbose(index)
        else:
            self.show_non_verbose(index)
