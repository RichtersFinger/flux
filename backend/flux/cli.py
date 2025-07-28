"""`flux`-CLI definition."""

from typing import Optional
import sys
from pathlib import Path
from importlib.metadata import version

import filetype
from befehl import Parser, Option, Cli, Command


def parse_as_flux_dir(data) -> tuple[bool, Optional[str], Optional[Path]]:
    """
    Parses `data` as directory that is compatible with being used as a
    working directory with flux.
    """
    path = Path(data)
    if path.exists() and not path.is_dir():
        return False, f"path '{data}' is not a directory", None
    return True, None, path


class Index(Command):
    """Subcommand for building index."""

    input_ = Option(
        ("-i", "--input"),
        helptext="target directory that should be indexed",
        nargs=1,
        parser=Parser.parse_as_dir,
    )
    output = Option(
        ("-o", "--output"),
        helptext="working directory (default uses current)",
        nargs=1,
        parser=parse_as_flux_dir,
    )
    verbose = Option(("-v", "--verbose"), helptext="verbose output")

    def validate(self, args):
        if self.input_ not in args:
            return False, "Missing input. Call with option '-h' for help."
        return True, None

    def run(self, args):
        input_: Path = args[self.input_][0]
        for file in input_.glob("**/*"):
            if file.is_file():
                ft = filetype.guess(file)
                print(file, " -> ", "-" if ft is None else ft.mime)


class FluxCli(Cli):
    """CLI for `flux`."""

    index = Index("index", helptext="create index for given source directory")

    version = Option(("-v", "--version"), helptext="prints library version")

    def run(self, args):
        if self.version in args:
            print(version("flux"))
            return
        self._print_help()


# validate + build entry-point
cli = FluxCli(
    "flux",
    helptext=f"flux-cli, v{version('flux')}",
).build()
