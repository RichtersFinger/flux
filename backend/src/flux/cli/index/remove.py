"""Definition of the rm-subcommand."""

from befehl import Command, Argument

from flux.config import FluxConfig
from flux.db import Transaction
from ..common import verbose, index_location, get_index
from .common import dry_run


class RmFromIndex(Command):
    """Subcommand for removing from index."""

    dry_run = dry_run
    index_location = index_location
    verbose = verbose

    target = Argument(
        "target",
        helptext="target record to remove from index",
        nargs=-1,
    )

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args

        # read and process index-location
        index = get_index(args)

        # identify affected data
        number_of_videos = {}
        with Transaction(index / FluxConfig.INDEX_DB_FILE, readonly=True) as t:
            for record_id in args[self.target]:
                t.cursor.execute(
                    "SELECT COUNT(*) FROM videos WHERE record_id = ?",
                    (record_id,),
                )
                number_of_videos[record_id] = t.cursor.fetchone()[0]

        if verbose:
            print(
                "Deleting records: "
                + ("(dry-run)" if dry_run in args else "")
            )
            for record_id, videos in number_of_videos.items():
                print(f"{record_id}: {videos} videos")

        if self.dry_run in args:
            return

        with Transaction(index / FluxConfig.INDEX_DB_FILE) as t:
            for record_id in args[self.target]:
                t.cursor.execute(
                    "DELETE FROM records WHERE id = ?", (record_id,)
                )
