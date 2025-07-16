import json
import os
from pathlib import Path
from datetime import datetime


class LocalCacheController:
    """
    Local cache controller for storing data in a local file.
    """

    cache_file: Path

    def __init__(self, cache_file: str | Path):
        if isinstance(cache_file, str):
            cache_file = Path(cache_file)
        self.cache_file = cache_file

        self.cache_file.parent.mkdir(parents=True, exist_ok=True)

        self.cache_data = {}

    def load(self):
        if not self.cache_file.exists():
            return {}
        with open(self.cache_file, "r") as f:
            self.cache_data = json.load(f)

    def save(self):
        with open(self.cache_file, "w") as f:
            json.dump(self.cache_data, f)

    def get(self, key):
        return self.cache_data.get(key)

    def set(self, key, value):
        self.cache_data[key] = value


class DistributedCacheController:
    """
    Local cache controller for storing data in a local file.
    """

    cache_dir: Path
    cache_overview_file: Path
    cache_data_dir: Path

    def __init__(self, cache_dir: str | Path):
        if isinstance(cache_dir, str):
            cache_dir = Path(cache_dir)
        self.cache_dir = cache_dir
        self.cache_overview_file = self.cache_dir / "overview.json"
        self.cache_data_dir = self.cache_dir / "data"

        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_data_dir.mkdir(parents=True, exist_ok=True)

        self.cache_overview_data = {}

    def _get_data_file_path(self, key):
        return self.cache_data_dir / f"{key}.json"

    def load(self):
        if not self.cache_overview_file.exists():
            return {}
        self._load_overview()

        # sync between overview and data - remove keys from overview that are not in data
        delete_count = 0
        for key in self.cache_overview_data:
            if not self._get_data_file_path(key).exists():
                delete_count += 1
                del self.cache_overview_data[key]
        print(f"Deleting {delete_count} keys from overview...")

        # sync between data and overview - add keys to overview that are not in data
        now = datetime.now().isoformat()
        for file in self.cache_data_dir.iterdir():
            if file.is_file() and file.name.endswith(".json"):
                key = file.stem
                if key not in self.cache_overview_data:
                    self.cache_overview_data[key] = {
                        "last_synced": now,
                    }

        self._save_overview()

    def _save_overview(self):
        with open(self.cache_overview_file, "w") as f:
            json.dump(self.cache_overview_data, f)

    def _load_overview(self):
        if not self.cache_overview_file.exists():
            return {}
        with open(self.cache_overview_file, "r") as f:
            self.cache_overview_data = json.load(f)

    def _save_data(self, key, value):
        if not self.cache_data_dir.exists():
            self.cache_data_dir.mkdir(parents=True, exist_ok=True)
        with open(self._get_data_file_path(key), "w") as f:
            json.dump(value, f)

    def _load_data(self, key):
        file_path = self._get_data_file_path(key)
        if not self.cache_data_dir.exists() or not file_path.exists():
            return None
        with open(file_path, "r") as f:
            return json.load(f)

    def get(self, key):
        return self._load_data(key)

    def set(self, key: str, value: dict):
        self._save_data(key, value)

        self.cache_overview_data[key] = {
            "last_synced": datetime.now().isoformat(),
        }

        self._save_overview()

    def delete(self, key: str):
        self.cache_overview_data.pop(key, None)
        self._save_overview()
        file_path = self._get_data_file_path(key)
        if file_path.exists():
            file_path.unlink()

    def keys(self):
        return list(self.cache_overview_data.keys())
