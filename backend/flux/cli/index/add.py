"""Definition of the add-subcommand."""

from typing import Optional
import sys
from pathlib import Path
from dataclasses import dataclass

import filetype
from befehl import Parser, Option, Command, Argument

from ..common import verbose, index_location, get_index
from .common import batch, dry_run


@dataclass
class VideoFile:
    """Record class for a video-file."""

    path: str
    name: str
    mimetype: str


@dataclass
class Season:
    """Record class for a season in a series."""

    path: str
    name: str
    episodes: list[VideoFile]


@dataclass
class Series:
    """Record class for a series."""

    path: Path
    name: str
    seasons: list[Season]
    specials: list[VideoFile]


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
    name_ = Option(
        "--name",
        helptext=(
            "explicitly specify record-name (not available in batch-mode)"
        ),
        nargs=1,
    )
    dry_run = dry_run
    verbose = verbose

    target = Argument(
        "target",
        helptext="target directory/file to be processed",
        nargs=-1,
        parser=Parser.parse_as_path,
    )

    def validate(self, args):
        if self.type_ not in args and self.auto not in args:
            return (
                False,
                "Either '--auto' or '--type' is required for this operation.",
            )
        if self.target not in args or len(args[self.target]) == 0:
            return (
                False,
                "At least one target needs to be specified.",
            )
        if self.batch in args and self.name_ in args:
            return (
                False,
                f"Option '{self.name_.names[0]}' isincompatible with batch "
                + "mode.",
            )
        return True, ""

    INDENTATION = "   "

    @classmethod
    def process_video_file(
        # pylint: disable=redefined-outer-name
        cls,
        file: Path,
        context: str,
        *,
        verbose: bool = False,
    ) -> Optional[VideoFile]:
        """
        Process given file in given context. Returns a `VideoFile` if
        file is a valid video, otherwise `None`.

        Keyword arguments:
        file -- target file
        context -- context for processing
        verbose -- whether to run in verbose mode
                   (default False)
        """
        ft = filetype.guess(file)
        if (
            ft is not None
            and ft.mime is not None
            and ft.mime.startswith("video/")
        ):
            if verbose:
                print(
                    2 * cls.INDENTATION
                    + f"Adding file '{file.name}' as {context}"
                )
            return VideoFile(file.name, file.name, ft.mime)
        if verbose:
            print(2 * cls.INDENTATION + f"Skipping file '{file.name}'")
        return None

    @classmethod
    def process_series(
        # pylint: disable=redefined-outer-name
        cls,
        index: Path,
        target: Path,
        name: Optional[str] = None,
        *,
        verbose: bool = False,
        dry_run: bool = False,
    ):
        """
        Add target to index (no batch).

        Keyword arguments:
        index -- index location
        target -- target path
        name -- name of the series
                (default None; uses directory name)
        verbose -- whether to run in verbose mode
                   (default False)
        dry_run -- whether to run a simulation (automatically verbose)
                   (default False)
        """
        if dry_run:
            verbose = True

        series = Series(target.resolve(), name or target.name, [], [])

        if verbose:
            print("Processing:")
            print(cls.INDENTATION + f"Index Location: {index}")
            print(cls.INDENTATION + f"Target: {series.path}")
            print(cls.INDENTATION + "Content type: series")
            print(cls.INDENTATION + f"Assigned name: {series.name}")

        # seasons
        for directory in filter(lambda p: p.is_dir(), target.glob("*")):
            season = Season(directory.name, directory.name, [])
            if verbose:
                print(
                    cls.INDENTATION + f"Processing '{season.path}' as season"
                )

            # episodes
            for file in filter(
                lambda p: p.is_file(), (series.path / season.path).glob("*")
            ):
                episode = cls.process_video_file(
                    file, "episode", verbose=verbose
                )
                if episode is not None:
                    season.episodes.append(episode)

            series.seasons.append(season)

        # specials
        if verbose:
            print(cls.INDENTATION + "Processing specials")
        for file in filter(lambda p: p.is_file(), target.glob("*")):
            special = cls.process_video_file(file, "special", verbose=verbose)
            if special is not None:
                series.specials.append(special)

        # generate thumbnails
        # ...

        # write to database
        # ...

    def run(self, args):
        # pylint: disable=redefined-outer-name
        verbose = self.verbose in args
        dry_run = self.dry_run in args

        # read and process index-location
        index = get_index(args)

        # process
        if self.auto in args:
            print(
                "Not implemented yet, please provide an explicit type instead",
                file=sys.stderr,
            )
            sys.exit(1)

        match (args[self.type_][0]):
            case "series":
                if self.batch in args:
                    print(
                        "Batch-mode not implemented yet",
                        file=sys.stderr,
                    )
                    sys.exit(1)
                for t in args[self.target]:
                    self.process_series(
                        index,
                        t.resolve(),
                        args.get(self.name_, [None])[0],
                        verbose=verbose,
                        dry_run=dry_run,
                    )

            case _:
                print(
                    f"Type '{args[self.type_][0]}' is currently not supported",
                    file=sys.stderr,
                )
                sys.exit(1)
