"""Definition of the index-subcommand."""

from befehl import Command

from .create import CreateIndex
from .show import ShowIndex
from .add import AddToIndex
from .remove import RmFromIndex


class Index(Command):
    """Subcommand for indexing."""

    create = CreateIndex("create", helptext="create a new index")
    show = ShowIndex(
        "show", helptext="print information about an exiting index"
    )
    add = AddToIndex("add", helptext="add resources to an exiting index")
    rm = RmFromIndex("rm", helptext="delete resources from an exiting index")

    def run(self, args):
        self._print_help()
