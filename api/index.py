import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_path = str(Path(__file__).parent.parent / "backend")
if backend_path not in sys.path:
    sys.path.append(backend_path)

from server import app
