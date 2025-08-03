"""`flux`-CLI definition."""

from typing import Optional
from pathlib import Path
from importlib.metadata import version

import filetype
from befehl import Parser, Option, Cli, Command, Argument


def parse_as_flux_dir(data) -> tuple[bool, Optional[str], Optional[Path]]:
    """
    Parses `data` as directory that is compatible with being used as a
    working directory with flux.
    """
    path = Path(data)
    if path.exists() and not path.is_dir():
        return False, f"path '{data}' is not a directory", None
    return True, None, path


index_location = Option(
    ("-i", "--index-location"),
    helptext="index/working directory (default uses current)",
    nargs=1,
    parser=parse_as_flux_dir,
)
dry_run = Option(
    "--dry-run",
    helptext="test effects before committing",
    parser=Parser.parse_as_bool,
)
batch = Option(
    "--batch",
    helptext=(
        "process immediate children in given targets as if they were "
        + "passed individually"
    ),
)
verbose = Option(("-v", "--verbose"), helptext="verbose output")


class CreateIndex(Command):
    """Subcommand for creating index."""

    index_location = index_location
    verbose = verbose

    def run(self, args):
        pass


class AddToIndex(Command):
    """Subcommand for adding to index."""

    index_location = index_location
    batch = batch
    auto = Option(
        "--auto",
        helptext="heuristically detect content type",
    )
    type_ = Option(
        "--type",
        helptext=(
            "explicitly specify content type (one of 'movie', 'series', "
            + "'collection')"
        ),
        nargs=1,
        parser=Parser.parse_with_values(["movie", "series", "collection"]),
    )
    dry_run = dry_run
    verbose = verbose

    target = Argument(
        "target",
        helptext="target directory/file that should be added to the index",
        nargs=-1,
        parser=Parser.parse_as_path,
    )

    def validate(self, args):
        if self.type_ not in args and self.auto not in args:
            return (
                False,
                "Either '--auto' or '--type' is required for this operation.",
            )
        return True, ""

    def run(self, args):
        target: Path = args[self.target][0]
        for file in target.glob("**/*"):
            if file.is_file():
                ft = filetype.guess(file)
                print(file, " -> ", "-" if ft is None else ft.mime)


class RmFromIndex(Command):
    """Subcommand for removing from index."""

    dry_run = dry_run
    index_location = index_location
    batch = batch
    verbose = verbose

    target = Argument(
        "target",
        helptext="target directory/file that should be removed from index",
        nargs=-1,
        parser=Parser.parse_as_path,
    )

    def run(self, args):
        pass


class Index(Command):
    """Subcommand for indexing."""

    create = CreateIndex("create", helptext="create a new index")
    add = AddToIndex("add", helptext="add resources to an exiting index")
    rm = RmFromIndex("rm", helptext="delete resources from an exiting index")

    def run(self, args):
        self._print_help()


class Run(Command):

    index_location = index_location
    verbose = verbose

    def run(self, args):
        print("Not implemented yet.")


class FluxCli(Cli):
    """CLI for `flux`."""

    index = Index("index", helptext="create index for given source directory")
    run_ = Run("run", helptext="run flux app")
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
