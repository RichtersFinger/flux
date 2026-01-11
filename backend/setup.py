import os
from pathlib import Path
from setuptools import setup


try:
    long_description = (Path(__file__).parent.parent / "README.md").read_text(
        encoding="utf8"
    )
except FileNotFoundError:
    long_description = "See docs at https://github.com/RichtersFinger/flux"


setup(
    version=os.environ.get("VERSION", "0.1.0"),
    name="flux",
    description="...",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Steffen Richters-Finger",
    author_email="srichters@uni-muenster.de",
    license="MIT",
    project_urls={"Source": "https://github.com/RichtersFinger/flux"},
    python_requires=">=3.10",
    install_requires=[
        "Flask>=3,<4",
        "gunicorn",
        "befehl>=0.1.2,<1.0.0",
        "filetype>=1.2.0,<2.0.0",
    ],
    packages=[
        "flux",
        "flux.db",
        "flux.app",
        "flux.api",
        "flux.api.v0",
        "flux.cli",
        "flux.cli.index",
        "flux.cli.user",
    ],
    package_data={"flux": ["client/**/*", "db/schema.sql"]},
    entry_points={
        "console_scripts": [
            "flux = flux:cli",
        ],
    },
    classifiers=[
        "Development Status :: 2 - Pre-Alpha",
        "Intended Audience :: End Users/Desktop",
        "Topic :: Multimedia :: Video",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Framework :: Flask",
    ],
)
