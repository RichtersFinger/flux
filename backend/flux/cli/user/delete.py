"""Definition of the delete-subcommand."""

import sys

from befehl import Command, Option, Argument

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index


class Delete(Command):
    """Subcommand for deleting a user."""

    index_location = index_location
    verbose = verbose
    yes = Option("-y", helptext="skip confirmation", nargs=0)

    user = Argument("user", helptext="user to be deleted", nargs=1)

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

        # get confirmation
        yes = self.yes in args
        if not yes:
            yes = input(
                f"Do you really want to delete user '{user}' and all their "
                + "data? [yes/no]"
            ).lower() == "yes"

        if verbose and not yes:
            print(f"Did not delete user '{user}'")
            return

        # update database
        with Transaction(index_db) as t:
            t.cursor.execute(
                "DELETE FROM users WHERE name = ?",
                (user,)
            )

        if verbose:
            print(f"User '{user}' deleted")
