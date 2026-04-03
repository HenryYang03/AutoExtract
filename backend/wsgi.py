"""WSGI entrypoint for production servers (e.g. gunicorn)."""

import logging
import sys

from app import create_app
from model_manager import model_manager

logging.basicConfig(level=logging.INFO, stream=sys.stderr)
_log = logging.getLogger("autoextract.wsgi")

application = create_app()

if not model_manager.is_ready():
    _log.error(
        "BarGraphAnalyzer not ready — API will return errors until fixed. %s",
        model_manager.init_error or "unknown",
    )
