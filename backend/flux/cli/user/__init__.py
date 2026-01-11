"""Definition of the user-subcommand."""

from befehl import Command

from .create import Create
from .password import Password
from .delete import Delete
from .promote import Promote
from .demote import Demote


class User(Command):
    """Subcommand for user management."""

    create = Create("create", helptext="create a new user")
    password = Password("password", helptext="change user password")
    delete = Delete("delete", helptext="delete user")
    promote = Promote("promote", helptext="promote user")
    demote = Demote("demote", helptext="demote user")

    def run(self, args):
        self._print_help()
