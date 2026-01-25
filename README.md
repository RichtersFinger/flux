![](assets/banner.jpg)

# flux
> a conservation law for your video library

`flux` is a simple web-application which allows you to easily host your own video streaming platform at home.

## Key features
* intuitive and streamlined UI
* continue watching where you left off
* user profiles
* manage your library contents through a combination of a command-line tool and the web interface
* organize your contents by the categories `movie`, `collection`, and `series`
* [platform-independent](#software-requirements) (works with Windows, Linux, and macOS)

## Software requirements
In order to run `flux` natively, an installation of `Python 3.10+` and `ffmpeg` (including `ffprobe`) is required.
These should be setup to be available on the system's PATH.
The web UI can be opened in any modern browser.

## Install
1. Download a release (`.whl`-file) for `flux` from [here](https://github.com/RichtersFinger/flux/releases/latest).
1. Create a working directory where you want `flux` to run and store the library index data. Open a terminal window.
1. (optional but recommended) Create and activate a virtual environment for your Python interpreter

   ```bash
   python -m venv venv
   ```
   then
   ```bash
   # windows (cmd.exe)
   venv\Scripts\activate.bat
   # linux/mac
   source venv/bin/activate
   ```
1. Install `flux`

   ```bash
   python -m pip install <path-to-whl>
   ```
1. Validate setup by calling the `flux`-CLI

   ```bash
   flux -h
   ```

To run `flux` automatically on system boot, use your system's default method for configuring startup programs.
On Linux, a command might look like
```bash
cd <path-dir-working-dir>
    && source venv/bin/activate
    && flux run
```

## First steps

After `flux` has been set up, interacting with the index via CLI requires to activate the virtual environment again.
After doing that, the `flux` CLI is available.

### Create index
Before a `flux` server can be run, a library index must be created.
To do this, simply enter
```bash
flux index create
```
This will create an index in the current working directory.
If you prefer a different directory, you can specify one using the option `--index-location`.
Note however, that this changed index-location needs to be passed in every call.

### Server startup
After an index has been created, the server application can be started by invoking
```bash
flux run
```
Some general information like the network address will be printed to the standard output.
The default port is `8620` (can be changed by setting the environment variable `PORT`).

### Add to index
There are three record categories in `flux`:
* **movie** for single videos
* **collection** for multiple (unstructured) files

  These files need to be placed inside a dedicated directory (subdirectories are allowed as well)
* **series** for multiple files, organized into multiple seasons and specials

  The expected directory structure is
  ```
  <series>
  ├── season1
  |    ├── episode1.mp4
  |    ├── ...
  |    └── episodeN.mp4
  ├── ...
  ├── seasonM
  |    └── ...
  ├── special1.mp4
  └── ...
  ```

Adding a record is as simple as
```bash
flux index add <path-to-record-1> <path-to-record-2> ...
```
You can either use the heuristic auto-detection or explicitly state the record type (`--type=movie|collection|series`).
As with all CLI-(sub-)commands, use `-h` to get a list of all available options.

`flux` only references these files and does not duplicate the source.
Note that if paths change at some point in time, the record will be in a broken state.

### Promote user to admin
In order to modify the metadata of a record (title, description) or upload custom thumbnails for records, an admin account is needed.
To this end, either create a regular account using the GUI or the CLI (`flux user create`).
Then, promote that user with `flux user promote <username>`.
This user will now see additional UI elements for updating record metadata.

## Development setup
> The following expects a Linux system

Both backend and CLI are implemented in Python (using Flask/befehl, respectively).
The `flux` frontend is a TypeScript+React app (using Vite).
Consequently, in a development setup, usually two servers are running at once.
In production, on the other hand, the static frontend client is served alongside the backend from the Python server.
The library index uses a SQLite database and the file system.

In order to build the frontend/run the frontend development server, either an installation of Node.js/npm (native) or docker (through the `Makefile`) are required.
The `Makefile` provided in this repository defines targets for setting up both the Python and JS environments as well as building and packaging the application.

### Command-line interface
Switch into the `backend`-directory.
Create a virtual environment, then install the package through pip
```
pip install ".[dev]"
```

### Backend
Follow the same steps as in the previous CLI setup section.
A development server is then started by running
```
MODE=dev flask run
```

Alternatively, run the corresponding `Makefile`-target with `make run-backend-dev-server`.

### Frontend
Change into the `frontend`-directory and run `npm install`.
Afterwards, you can start the development server using `npm run dev`.

This step can also be achieved (dockerized) via the `Makefile`-target `run-frontend-dev-server`.

### Test
The backend-package defines automated tests that cover the most important CLI-commands and api-endpoints.
To run the tests, from the `backend`-directory, simply run
```
pytest
```
(requires the previously installed package including the development-dependencies).

### Build
To build the project, the following steps must be taken:
1. Build the frontend client
   ```bash
   cd frontend
      && GENERATE_SOURCEMAP=false npm run build
   ```
1. Move the build-artifact into the Python-package
   ```bash
   rm -rf backend/src/flux/client
      && cp -r frontend/dist backend/src/flux/client
   ```
1. Build the Python package
   ```bash
   pip install setuptools build
      && cd backend
      && python -m build --wheel
   ```

The newly built `flux`-package can then be found in `backend/dist`.

Alternatively, run `make build` to automate this process.
