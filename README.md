![](assets/banner.jpg)

# flux
> a conservation law for your video library

`flux` is a simple web-application which allows you to easily host your own video streaming platform at home.

## Key features
* intuitive and streamlined UI
* continue watching where you left off
* user-profiles
* manage your library's contents through a combination of a command-line tool and the web-interface
* organize your contents by the categories `movie`, `series`, and `collection`
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

### Server startup

### Add to index

### Promote user to admin

## Development setup

