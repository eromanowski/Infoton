#!/usr/bin/env python3
"""Extract embedded Infoton calculator HTML from saved page dump."""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
page = (ROOT / "_infoton_page.html").read_text(encoding="utf-8", errors="replace")
out_dir = ROOT / "viz" / "infoton_reference"
out_dir.mkdir(parents=True, exist_ok=True)

# srcDoc="..." style= on outer iframes
for i, m in enumerate(re.finditer(r'srcDoc="(.*?)"\s+style=', page, re.DOTALL)):
    raw = m.group(1)
    decoded = html.unescape(raw)
    # inner document starts after optional postMessage script
    if "<!DOCTYPE html>" in decoded or "<html" in decoded:
        start = decoded.find("<!DOCTYPE")
        if start == -1:
            start = decoded.find("<html")
        body = decoded[start:]
        # trim duplicate closing
        if body.endswith("</body>"):
            pass
        path = out_dir / f"widget_{i}.html"
        path.write_text(body, encoding="utf-8")
        title = re.search(r"<title>([^<]+)", body)
        print(f"widget_{i}.html", len(body), title.group(1) if title else "")
