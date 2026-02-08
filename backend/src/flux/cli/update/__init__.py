"""Definition of the update-subcommand."""

import sys
import subprocess
from importlib.metadata import version
import tempfile
import urllib.request

from befehl import Command

from flux import github
from ..common import verbose
from .common import compare_versions
from .migrate import Migrate


class Update(Command):
    """Subcommand for updating flux."""

    verbose = verbose
    migrate = Migrate("migrate", helptext="migrate index-database")

    def _install(self, file: str, verbose: bool):
        # pylint: disable=redefined-outer-name
        """Install new package."""
        if verbose:
            print("Installing...")
        p = subprocess.run(["pip", "install", file], check=False)
        if p.returncode != 0:
            print(
                "ERROR: Unable to install new package.", file=sys.stderr
            )
            sys.exit(1)

    def _update(self, verbose: bool):
        # pylint: disable=redefined-outer-name
        """
        Run update procedure.
        """
        latest = github.get_latest_version()
        current = version("flux")
        if verbose:
            print(f"Latest release is {latest}.")
            print(f"Currently installed is {current}.")

        needs_update = compare_versions(latest, current)
        if verbose:
            if needs_update:
                print("Updating..")
            else:
                print("Already up to date.")

        if not needs_update:
            return

        with tempfile.TemporaryDirectory() as temp:
            url = github.get_latest_wheel_url()
            path = f"{temp}/flux-{latest}-py3-none-any.whl"
            if verbose:
                print(f"Downloading wheel '{url}' to '{temp}'")
            urllib.request.urlretrieve(url, path)
            self._install(path, verbose)

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # find and install latest package
        self._update(verbose)
