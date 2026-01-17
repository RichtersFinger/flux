"""Definition of the promote-subcommand."""

import sys

from befehl import Command, Argument

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index


class Promote(Command):
    """Subcommand for promoting a user."""

    index_location = index_location
    verbose = verbose

    user = Argument("user", helptext="user to be promoted", nargs=1)

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        # get username
        user = args.get(self.user)[0]

        index_db = index / FluxConfig.INDEX_DB_FILE

        # check database
        with Transaction(index_db, readonly=True) as t:
            t.cursor.execute(
                "SELECT name FROM users WHERE name = ?",
                (user,)
            )

        if len(t.data) == 0:
            if verbose:
                print(f"Unknown user '{user}'")
            sys.exit(1)

        # update database
        with Transaction(index_db) as t:
            t.cursor.execute(
                "UPDATE users SET is_admin = 1 WHERE name = ?",
                (user,)
            )

        if verbose:
            print(f"User '{user}' promoted to administrator")
