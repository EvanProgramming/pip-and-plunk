"""Bundle the static game at the root of an itch.io HTML5 ZIP."""

import argparse
import base64
import json
import re
import os
from pathlib import Path
import tempfile
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "game"


def build(destination):
    destination = destination.resolve()
    if destination.suffix.lower() != ".zip" or GAME in destination.parents:
        raise ValueError("Use a .zip destination outside game/.")

    files = {
        path.relative_to(GAME).as_posix(): path
        for path in sorted(GAME.rglob("*"))
        if path.is_file()
    }
    if "index.html" not in files or not files["index.html"].stat().st_size:
        raise ValueError("game/index.html is required and must contain data.")
    if "LICENSE" in files:
        raise ValueError("game/LICENSE would conflict with the project LICENSE.")
    files["LICENSE"] = ROOT / "LICENSE"

    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as temporary:
        staging = Path(temporary.name)
    try:
        with ZipFile(staging, "w", ZIP_DEFLATED, compresslevel=9) as archive:
            for name, source in files.items():
                archive.write(source, name)
        with ZipFile(staging) as archive:
            if archive.testzip() or sorted(archive.namelist()) != sorted(files):
                raise ValueError("Archive failed its entry or checksum check.")
            for entry in archive.infolist():
                if entry.file_size != files[entry.filename].stat().st_size:
                    raise ValueError(f"Size mismatch for {entry.filename}.")
        os.replace(staging, destination)
    finally:
        staging.unlink(missing_ok=True)
    print(f"{destination} ({len(files)} files, {destination.stat().st_size:,} bytes)")


def standalone(destination):
    """Inline the same sources for players who want to double-click a local file."""
    def data_uri(mime, data):
        return "data:" + mime + ";base64," + base64.b64encode(data).decode("ascii")

    modules = {}
    for path in sorted(GAME.glob("*.js")):
        code = re.sub(r"""(from\s+['"])\./([\w-]+)\.js""", r"\1pip-game/\2", path.read_text())
        modules["pip-game/" + path.stem] = data_uri("text/javascript", code.encode())
    css = (GAME / "style.css").read_text().replace("./assets/barlow.ttf", data_uri(
        "font/ttf", (GAME / "assets/barlow.ttf").read_bytes()))
    notices = (ROOT / "LICENSE").read_text() + "\n" + (GAME / "assets/OFL.txt").read_text()
    html = (GAME / "index.html").read_text().replace('<link rel="stylesheet" href="./style.css">',
        "<style>" + css + "</style>").replace('<script type="module" src="./main.js"></script>',
        '<script type="importmap">' + json.dumps({"imports": modules}) + '</script>'
        '<script type="module">import "pip-game/main"</script>')
    destination.write_text(html.replace("</body>", "<!--\n" + notices + "\n-->\n</body>"), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", nargs="?", type=Path,
                        default=ROOT.parent / "pip-and-plunk-itch.zip")
    parser.add_argument("--html", type=Path, help="Also generate a self-contained offline HTML file")
    args = parser.parse_args()
    try:
        build(args.destination)
        if args.html:
            standalone(args.html)
    except (ValueError, OSError) as error:
        parser.exit(1, f"Build failed: {error}\n")
