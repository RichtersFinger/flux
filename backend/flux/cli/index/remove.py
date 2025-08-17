"""Definition of the rm-subcommand."""

from befehl import Parser, Command, Argument

from ..common import verbose, index_location
from .common import dry_run, batch


class RmFromIndex(Command):
    """Subcommand for removing from index."""

    dry_run = dry_run
    index_location = index_location
    batch = batch
    verbose = verbose

    target = Argument(
        "target",
        helptext="target directory/file that should be removed from index",
        nargs=-1,
        parser=Parser.parse_as_path,
    )

    def run(self, args):
        pass
