"""Definition of the add-subcommand."""

from typing import Optional
import sys
from pathlib import Path
from dataclasses import dataclass, field
from uuid import uuid4
import json
import subprocess

import filetype
from befehl import Parser, Option, Command, Argument

from flux.config import FluxConfig
from ..common import verbose, index_location, get_index
from .common import batch, dry_run


@dataclass
class VideoFile:
    """Record class for a video-file."""

    path: Path
    name: str
    metadata: dict
    id: str = field(default_factory=lambda: str(uuid4()))


@dataclass
class Season:
    """Record class for a season in a series."""

    path: Path
    name: str
    episodes: list[VideoFile]
    id: str = field(default_factory=lambda: str(uuid4()))


@dataclass
class Series:
    """Record class for a series."""

    path: Path
    name: str
    seasons: list[Season]
    specials: list[VideoFile]
    id: str = field(default_factory=lambda: str(uuid4()))


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
        if self.name_ in args:
            if len(args.get(self.target, [])) > 1:
                return (
                    False,
                    f"Option '{self.name_.names[0]}' is incompatible with "
                    + "multiple targets.",
                )
            if self.batch in args:
                return (
                    False,
                    f"Option '{self.name_.names[0]}' is incompatible with "
                    + "batch mode.",
                )
        return True, ""

    INDENTATION = "   "

    @staticmethod
    def get_metadata(file: Path) -> Optional[dict]:
        """
        Runs ffprobe to collect metadata of video file. Returns
        JSON or `None` if not successful.
        """
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-print_format",
                    "json",
                    "-show_format",
                    "-show_streams",
                    str(file),
                ],
                check=True,
                capture_output=True,
                text=True,
            )
        except subprocess.CalledProcessError as exc_info:
            print(
                "\033[1;33m"
                + f"Failed to collect metadata for '{file}': {exc_info} "
                + f"({exc_info.stderr})"
                + "\033[0m",
                file=sys.stderr,
            )
            return None
        # impose minimum requirements for metadata of video files
        result_json = json.loads(result.stdout)
        if (
            "format" not in result_json
            or any(
                key not in result_json["format"]
                for key in ["size", "duration", "nb_streams"]
            )
            or not isinstance(result_json["format"]["nb_streams"], int)
            or result_json["format"]["nb_streams"] < 1
        ):
            return None
        return result_json

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
        # file
        if not file.is_file():
            if verbose:
                print(
                    2 * cls.INDENTATION
                    + f"Skipping '{file.name}' (not a file)"
                )
            return None

        # mimetype
        ft = filetype.guess(file)
        if ft is None or ft.mime is None or not ft.mime.startswith("video/"):
            if verbose:
                print(
                    2 * cls.INDENTATION
                    + f"Skipping file '{file.name}' (filetype)"
                )
            return None

        # ffprobe
        metadata = cls.get_metadata(file)
        if metadata is None:
            print(
                2 * cls.INDENTATION + f"Skipping file '{file.name}' (ffprobe)"
            )
            return None

        # success
        if verbose:
            print(
                2 * cls.INDENTATION
                + f"Adding file '{file.name}' as {context} '{file.stem}'"
            )

        return VideoFile(file, file.stem, metadata)

    @staticmethod
    def generate_thumbnail(
        source: VideoFile, destination: Path, seek: Optional[str] = None
    ) -> None:
        """Creates a thumbnail of `source` at `destination`."""
        if seek is None:
            seek_seconds = int(
                0.1 * float(source.metadata["format"]["duration"])
            )
            seek = (
                "00" + f":0{seek_seconds // 60}" + f":{int(seek_seconds % 60)}"
            )
        try:
            result = subprocess.run(
                [
                    "ffmpeg",
                    "-v",
                    "error",
                    "-ss",
                    seek,
                    "-i",
                    str(source.path),
                    "-frames:v",
                    "1",
                    str(destination),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
        except subprocess.CalledProcessError as exc_info:
            print(
                f"Failed to create thumbnail from '{source.path}' at "
                + f"'{destination}': {exc_info}",
                file=sys.stderr,
            )
        if result.returncode != 0:
            print(
                f"Failed to create thumbnail from '{source.path}' at "
                + f"'{destination}': {result.stderr}",
                file=sys.stderr,
            )

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
            print(cls.INDENTATION + f"Index location: {index}")
            print(cls.INDENTATION + "Content type: series")
            print(cls.INDENTATION + f"Target location: {series.path}")
            print(cls.INDENTATION + f"Assigned name: {series.name}")

        # seasons
        for directory in filter(lambda p: p.is_dir(), target.glob("*")):
            season = Season(directory, directory.name, [])
            if verbose:
                print(
                    cls.INDENTATION
                    + f"Processing '{season.path.name}' as season"
                )

            # episodes
            for file in filter(lambda p: p.is_file(), season.path.glob("*")):
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
        # * general preparations
        thumbnails = (
            index
            / FluxConfig.THUMBNAILS
            / (series.path.name + "-" + series.id)
        ).resolve()
        if verbose:
            print(cls.INDENTATION + "Creating thumbnails")
            print(2 * cls.INDENTATION + f"Output location: {thumbnails}")
        if not dry_run:
            thumbnails.mkdir(parents=True, exist_ok=False)

        # * seasons
        for season in series.seasons:
            (thumbnails / season.path.name).mkdir()
            if verbose:
                print(
                    2 * cls.INDENTATION
                    + f"Creating thumbnails for season '{season.name}'"
                )
            for episode in season.episodes:
                if verbose:
                    print(
                        3 * cls.INDENTATION
                        + f"Creating thumbnail for episode '{episode.name}'"
                    )
                if not dry_run:
                    cls.generate_thumbnail(
                        episode,
                        thumbnails
                        / season.path.name
                        / (episode.path.name + ".jpg"),
                    )
        # * specials
        for special in series.specials:
            if verbose:
                print(
                    2 * cls.INDENTATION
                    + f"Creating thumbnail for special '{special.name}'"
                )
            if not dry_run:
                cls.generate_thumbnail(
                    special,
                    thumbnails / (special.path.name + ".jpg"),
                )

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
