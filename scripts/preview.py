"""Serve the assembled site at /docs/, matching GitHub Pages routes."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parents[1]
site = root / ".build/site"
if not (site / "index.html").is_file():
    raise SystemExit("Build the documentation site first: npm run build")
preview = root / ".build/preview"
preview.mkdir(parents=True, exist_ok=True)
link = preview / "docs"
if not link.exists():
    link.symlink_to(site, target_is_directory=True)
print("Preview: http://127.0.0.1:8000/docs/", flush=True)
ThreadingHTTPServer(("127.0.0.1", 8000), partial(SimpleHTTPRequestHandler, directory=str(preview))).serve_forever()
