"""Assemble downloaded module artifacts into the GitHub Pages site."""

from html import escape
from pathlib import Path
import shutil


def assemble(artifacts: Path, output: Path) -> None:
    sites = sorted(artifacts.glob("site-*"))
    if not sites:
        raise ValueError(f"No module sites found in {artifacts}")
    for site in sites:
        if not (site / "index.html").is_file():
            raise ValueError(f"Missing module entry point: {site / 'index.html'}")

    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    links: list[str] = []
    for site in sites:
        module = site.name.removeprefix("site-")
        shutil.copytree(site, output / module)
        links.append(f'      <li><a href="./{escape(module)}/">{escape(module)}</a></li>')

    (output / ".nojekyll").touch()
    (output / "index.html").write_text(
        '<!doctype html>\n<html lang="en">\n<head>\n'
        '  <meta charset="utf-8">\n'
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '  <title>Modern Swift documentation</title>\n'
        '</head>\n<body>\n  <main>\n'
        '    <h1>Modern Swift documentation</h1>\n    <ul>\n'
        + "\n".join(links)
        + '\n    </ul>\n  </main>\n</body>\n</html>\n',
        encoding="utf-8",
    )


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    assemble(root / ".build/modules", root / ".build/site")
