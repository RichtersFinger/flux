"""Definition of the create-subcommand."""

import os
import sys
from getpass import getpass
from uuid import uuid4

from befehl import Command, Argument, Option

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index
from .common import validate_username, hash_password


class Create(Command):
    """Subcommand for creating a user."""

    index_location = index_location
    verbose = verbose
    password = Option(
        ("-p", "--password"),
        helptext="set user password; value is read from stdin, if omitted",
        nargs=1,
        strict=False,
    )

    user = Argument("user", helptext="user to be created", nargs=1)

    def validate(self, args):
        ok, msg = validate_username(
            args.get(self.user)[0], index=get_index(args)
        )
        if not ok:
            return ok, msg
        return True, None

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

        if len(t.data) > 0:
            if verbose:
                print(f"User '{user}' already exists")
            sys.exit(1)

        # update database
        with Transaction(index_db) as t:
            t.cursor.execute(
                "INSERT INTO users (name) VALUES (?)",
                (user,)
            )
            t.cursor.execute(
                """
                INSERT
                INTO user_secrets (id, username, salt, password)
                VALUES (?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    user,
                    salt,
                    hash_password(password, salt),
                ),
            )

        if verbose:
            print(f"User '{user}' created")
