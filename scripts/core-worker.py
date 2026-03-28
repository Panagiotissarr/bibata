import base64
import json
import logging
import platform as python_platform
import shutil
import sys
from pathlib import Path
from typing import Any, Literal

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.builder.compress import png_compress, win_compress, x11_compress
from core.builder.config import gtmp
from core.builder.cursor import store_cursors
from core.utils.parser import DownloadParams, UploadFormData


logger = logging.getLogger("bibata-worker")


def emit(payload: dict[str, Any]) -> int:
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    return 0


def data_url_to_bytes(value: str) -> bytes:
    if "," in value:
        _, encoded = value.split(",", 1)
    else:
        encoded = value

    return base64.b64decode(encoded)


def handle_doctor() -> int:
    return emit(
        {
            "ok": True,
            "python": sys.version,
            "platform": python_platform.platform(),
        }
    )


def handle_upload(build_id: str, payload_path: str) -> int:
    payload = json.loads(Path(payload_path).read_text(encoding="utf-8"))

    data = UploadFormData(
        name=str(payload["name"]),
        frames=[data_url_to_bytes(frame) for frame in payload["frames"]],
        platform=str(payload["platform"]),
        size=int(payload["size"]),
        delay=int(payload["delay"]),
        mode=payload["mode"],
        errors=[],
    )

    name, errors = store_cursors(build_id, data, logger)
    return emit(
        {
            "id": build_id,
            "files": [name] if name and not errors else [],
            "error": errors or None,
        }
    )


def handle_download(
    build_id: str,
    platform: Literal["png", "win", "x11"],
    name: str,
    version: str,
) -> int:
    params = DownloadParams(
        name=name,
        version=version,
        platform=platform,
        errors=[],
    )

    if platform == "win":
        result = win_compress(build_id, params, logger)
    elif platform == "png":
        result = png_compress(build_id, params, logger)
    else:
        result = x11_compress(build_id, params, logger)

    return emit(
        {
            "id": build_id,
            "path": str(result.file) if result.file else None,
            "name": result.file.name if result.file else None,
            "error": result.errors or None,
        }
    )


def handle_destroy(build_id: str) -> int:
    shutil.rmtree(gtmp(build_id), ignore_errors=True)
    return emit({"id": build_id, "ok": True})


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        return emit({"error": ["Missing worker command."]})

    command = argv[1]

    try:
        if command == "doctor":
            return handle_doctor()

        if command == "upload":
            if len(argv) != 4:
                return emit({"error": ["Usage: upload <build_id> <payload_path>"]})
            return handle_upload(argv[2], argv[3])

        if command == "download":
            if len(argv) != 6:
                return emit(
                    {
                        "error": [
                            "Usage: download <build_id> <platform> <name> <version>"
                        ]
                    }
                )
            return handle_download(argv[2], argv[3], argv[4], argv[5])

        if command == "destroy":
            if len(argv) != 3:
                return emit({"error": ["Usage: destroy <build_id>"]})
            return handle_destroy(argv[2])

        return emit({"error": [f"Unknown worker command: {command}"]})
    except Exception as error:
        return emit({"error": [str(error)]})


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
