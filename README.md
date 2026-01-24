![](assets/banner.jpg)

# flux
> a conservation law for your video library

`flux` is a simple web-application which allows you to easily host your own video streaming platform at home.

## Key features
* intuitive and streamlined UI
* continue watching where you left off
* user-profiles
* manage your library's contents through a combination of a command-line tool and the web-interface
* organize your contents by the categories `movie`, `collection`, and `series`
* [platform independent](#software-requirements) (works with Windows, Linux, and macOS)

## Software requirements
In order to run `flux` natively, an installation of `python3.10+` and `ffmpeg`/`ffprobe` is required.
The web-ui can be opened in any modern browser.

## Install
1. Download `flux`.
1. Create a working directory where you want `flux` to run and store the library index data. Open a terminal window.
1. (optional but recommended) Create and activate a virtual environment for your python interpreter

   ```bash
   python3 -m venv venv
   ```
   then
   ```bash
   # windows
   venv\Scripts\activate
   # linux/mac
   source venv/bin/activate
   ```
1. Install `flux`

   ```bash
   python3 -m pip install <path-to-file>
   ```
1. Validate setup by calling the `flux`-cli

   ```bash
   flux -h
   ```

To automate running the `flux`-server on system boot, use your systems default method for configuring startup-programs.
On Linux, a command might look like
```bash
cd <path-dir-working-dir>\
    && source venv/bin/activate
    && flux run
```

## First steps

### Add to index
Before a `flux`-server can be run, a library index must be created.
To do this, simply enter
```bash
flux index create
```

### Server startup
After an index has been created, the server-application can be started by invoking
```bash
flux run
```
Some general information like the network address will be printed to the standard output.
The default port is `8620`.

### Add to index
There are three record categories in `flux`:
* **movie** for single videos
* **collection** for multiple (unstructured) files

  these need to be placed inside a dedicated directory (subdirectories are allowed as well)
* **series** for multiple files, organized into multiple seasons and specials

  the expected directory structure is
  ```
  <series>
  ├── season1
  |    ├── episode1.mp4
  |    ├── ...
  |    └── episodeM.mp4
  ├── ...
  ├── seasonN
  ├── special1.mp4
  └── ...
  ```

Adding a record is as simple as
```bash
flux index add <path-to-record 1> <path-to-record 2> ...
```
You can either use the heuristic auto-detection or explicitly state the record-type (`--type=movie|collection|series`).
As with all cli-(sub-)commands, use `-h` to get a list of all available options.

### Promote user to admin
In order to modify the metadata of a record (title, description) or upload custom thumbnails for records, an admin-account is needed.
To this end, either create a regular account using the GUI or the cli (`flux user create`).
Then, promote that user with `flux user promote <username>`.
This user will now see additional UI-elements for updating record-metadata.

## Development setup

