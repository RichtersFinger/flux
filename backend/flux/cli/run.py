"""Definitions of the run-subcommand."""

from befehl import Command

from .common import verbose, index_location


class Run(Command):
    """Subcommand for running flux."""

    index_location = index_location
    verbose = verbose

    def run(self, args):
        print("Not implemented yet.")
