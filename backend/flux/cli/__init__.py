"""Definition of the flux-cli"""

from importlib.metadata import version

from befehl import Option, Cli

from .index import Index
from .run import Run


class FluxCli(Cli):
    """CLI for `flux`."""

    index = Index("index", helptext="create or update a flux-index")
    run_ = Run("run", helptext="run flux app")
    version = Option(("-v", "--version"), helptext="prints library version")

    def run(self, args):
        if self.version in args:
            print(version("flux"))
            return
        self._print_help()


cli = FluxCli(
    "flux",
    helptext=f"flux-cli, v{version('flux')}",
).build()
