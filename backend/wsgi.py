"""Define app for flask-cli."""

from flux.config import FluxConfig
from flux.app import app_factory


config = FluxConfig()
app = app_factory(config)
