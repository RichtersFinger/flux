"""Definition of the password-subcommand."""

import os
import sys
from getpass import getpass
from uuid import uuid4

from befehl import Command, Argument, Option

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index
from .common import hash_password


class Password(Command):
    """Subcommand for changing user password."""

    index_location = index_location
    verbose = verbose
    password = Option(
        ("-p", "--password"),
        helptext="user password; value is read from stdin, if omitted",
        nargs=1,
        strict=False,
    )

    user = Argument(
        "user",
        helptext="target user",
        nargs=1,
    )

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        # get username and password/salt
        user = args.get(self.user)[0]
        password = args.get(self.password, [None])[0]
        if password is None:
            if os.isatty(sys.stdin.fileno()):
                password = getpass()
            else:
                password = sys.stdin.readline().strip()
        salt = str(uuid4())

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
                """
                UPDATE user_secrets
                SET salt = ?, password = ?
                WHERE username = ?
                """,
                (salt, hash_password(password, salt), user),
            )
            t.cursor.execute(
                """DELETE FROM sessions WHERE username = ?""",
                (user,)
            )

        if verbose:
            print(f"Updated password for user '{user}'")
