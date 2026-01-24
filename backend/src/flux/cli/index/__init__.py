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
        "show", helptext="print information about an existing index"
    )
    add = AddToIndex("add", helptext="add resources to an existing index")
    rm = RmFromIndex("rm", helptext="delete resources from an existing index")

    def run(self, args):
        self._print_help()
