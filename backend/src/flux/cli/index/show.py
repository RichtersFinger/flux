"""Definition of the show-subcommand."""

from befehl import Command

from ..common import verbose, index_location


class ShowIndex(Command):
    """Subcommand for showing index content."""

    index_location = index_location
    verbose = verbose

    def run(self, args):
        pass
