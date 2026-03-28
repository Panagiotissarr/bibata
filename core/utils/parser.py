import base64
import json
from dataclasses import dataclass
from logging import Logger
from typing import Any, List, Literal


@dataclass
class UploadFormData:
    name: str
    frames: List[bytes]
    platform: str
    size: int
    delay: int
    mode: Literal["left", "right"]
    errors: List[str]


def parse_upload_formdata(request: Any, logger: Logger):
    errors: List[str] = []

    name: str = ""
    mode: Literal["left", "right"] = "left"
    size: int = 0
    delay: int = 0
    platform: str = ""
    frames: List[bytes] = []

    try:
        data = request.get_json(silent=True)

        if data is None:
            raw_data = request.get_data(cache=True, parse_form_data=False)

            if raw_data:
                try:
                    data = json.loads(raw_data.decode("utf-8"))
                except Exception:
                    data = None

        if isinstance(data, dict) and "data" in data and isinstance(data["data"], dict):
            data = data["data"]

        if isinstance(data, str):
            data = json.loads(data)

        if data is None:
            form_data = request.form.get("data")

            if form_data:
                data = json.loads(form_data)
            elif request.form:
                form_dict = request.form.to_dict(flat=True)
                frames_data = request.form.getlist("frames")

                if len(frames_data) == 0:
                    frames_value = form_dict.get("frames")
                    if frames_value:
                        try:
                            parsed_frames = json.loads(frames_value)
                            if isinstance(parsed_frames, list):
                                frames_data = parsed_frames
                        except Exception:
                            frames_data = [frames_value]

                data = {
                    "name": form_dict.get("name"),
                    "size": form_dict.get("size"),
                    "delay": form_dict.get("delay"),
                    "platform": form_dict.get("platform"),
                    "mode": form_dict.get("mode"),
                    "frames": frames_data,
                }
            else:
                raise ValueError(
                    "JSON data not found in request body, JSON 'data' key, FormData 'data' key, or direct form fields."
                )

        if type(data) is not dict:
            raise ValueError("Invalid upload payload. Expected a JSON object.")

        s = data.get("size", None)
        if not s:
            raise ValueError("'size' Not Found in JSON 'data' ")
        if type(s) is str:
            s = int(s)
        if type(s) is not int:
            raise ValueError("Invalid 'size' type. It must be type 'number'")
        else:
            size = s

        d = data.get("delay", None)
        if not d:
            raise ValueError("'delay' Not Found in JSON 'data' ")
        if type(d) is str:
            d = int(d)
        if type(d) is not int:
            raise ValueError("Invalid 'delay' type. It must be type 'number'")
        else:
            delay = d

        p = data.get("platform", None)
        if not p:
            raise ValueError("'platform' Not Found in JSON 'data' ")
        if p != "win" and p != "x11" and p != "png":
            raise ValueError(
                "Invalid 'platform' type. It must be type 'png','x11' or 'win'"
            )
        else:
            platform = p

        m = data.get("mode", None)
        if m != "left" and m != "right":
            raise ValueError("Invalid 'mode' type. It must be type 'left' or 'right'")
        else:
            mode = m

        n = data.get("name", None)
        if not n:
            raise ValueError("'name' Not Found in JSON 'data' ")
        if type(n) is not str:
            raise ValueError("Invalid 'name' type. It must be type 'string'")
        else:
            name = n

        f = data.get("frames", None)
        if not f:
            raise ValueError("'frames' Not Found in JSON 'data' ")
        if type(f) is not list:
            raise ValueError("Invalid 'frames' type. It must be type 'string[]'")
        else:
            for i, v in enumerate(f):
                if type(v) is not str:
                    raise ValueError(
                        f"Invalid 'frames[{i}]' type. It must  be type 'string'"
                    )
                else:
                    base64_str = v[len("data:image/png;base64,") :]
                    frames.append(base64.b64decode(base64_str))

    except Exception as e:
        errors.append(str(e))

    return UploadFormData(
        name=name,
        frames=frames,
        size=size,
        delay=delay,
        platform=platform,
        mode=mode,
        errors=errors,
    )


@dataclass
class DownloadParams:
    name: str
    version: str
    platform: Literal["win", "x11", "png"]
    errors: List[str]


def parse_download_params(request: Any, logger: Logger):
    platform: Literal["win", "x11", "png"] = "x11"
    name: str = ""
    version: str = ""
    errors: List[str] = []

    try:
        p = request.args.get("platform")
        if not p:
            raise ValueError("'platform' Param Not Found.")

        if p != "win" and p != "x11" and p != "png":
            raise ValueError(
                f"Invalid Platform '{platform}'. It should be 'png','x11' or 'win'"
            )
        else:
            platform = p

        n = request.args.get("name")
        if not n:
            raise ValueError("'name' Param Not Found.")
        if type(n) is not str:
            raise ValueError(f"Invalid filename '{n}'. It should be type 'string'")
        else:
            name = n

        v = request.args.get("v")
        if not v:
            raise ValueError("'v' Param Not Found.")
        if type(v) is not str:
            raise ValueError(f"Invalid version '{v}'. It should be type 'string'")
        else:
            version = v

    except Exception as e:
        errors.append(str(e))

    return DownloadParams(platform=platform, name=name, version=version, errors=errors)
