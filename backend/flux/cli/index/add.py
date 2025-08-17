"""Definition of the add-subcommand."""

from pathlib import Path

import filetype
from befehl import Parser, Option, Command, Argument

from ..common import verbose, index_location
from .common import batch, dry_run


class AddToIndex(Command):
    """Subcommand for adding to index."""

    index_location = index_location
    batch = batch
    auto = Option(
        "--auto",
        helptext="heuristically detect content type",
    )
    type_ = Option(
        "--type",
        helptext=(
            "explicitly specify content type (one of 'movie', 'series', "
            + "'collection')"
        ),
        nargs=1,
        parser=Parser.parse_with_values(["movie", "series", "collection"]),
    )
    dry_run = dry_run
    verbose = verbose

    target = Argument(
        "target",
        helptext="target directory/file that should be added to the index",
        nargs=-1,
        parser=Parser.parse_as_path,
    )

    def validate(self, args):
        if self.type_ not in args and self.auto not in args:
            return (
                False,
                "Either '--auto' or '--type' is required for this operation.",
            )
        return True, ""

    def run(self, args):
        target: Path = args[self.target][0]
        for file in target.glob("**/*"):
            if file.is_file():
                ft = filetype.guess(file)
                print(file, " -> ", "-" if ft is None else ft.mime)
