"""Definitions of the run-subcommand."""

from befehl import Command

from flux import app, config
from .common import verbose, index_location, get_index


class Run(Command):
    """Subcommand for running flux."""

    index_location = index_location
    verbose = verbose

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        if index is not None:
            if verbose:
                print(f"Using index at '{index}'")
            config.FluxConfig.INDEX_LOCATION = index

        app.app.run()
