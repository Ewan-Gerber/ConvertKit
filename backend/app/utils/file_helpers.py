import tempfile
import os
from pathlib import Path

def create_temp_file(suffix: str) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.close()
    return tmp.name

def cleanup_files(*paths: str):
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            pass

def get_safe_filename(filename: str) -> str:
    return Path(filename).stem