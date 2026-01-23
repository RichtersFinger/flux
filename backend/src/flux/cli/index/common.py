"""Common definitions of the index-subcommand."""

from befehl import Parser, Option


dry_run = Option(
    "--dry-run",
    helptext="test effects before committing",
    parser=Parser.parse_as_bool,
)


DEFAULT_THUMBNAIL_EXTENSION = ".jpg"
