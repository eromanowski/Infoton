#!/usr/bin/env python3
"""Extract embed-compare CSS from standalone demos into sites-v2 shared CSS."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "sites-v2" / "shared"


def extract_style_block(html_path: Path) -> str:
    text = html_path.read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", text, re.DOTALL)
    if not m:
        raise SystemExit(f"No <style> in {html_path}")
    return m.group(1)


def embed_rules(css: str) -> str:
    """Keep rules that target body.embed-compare (including multi-line)."""
    out = []
    i = 0
    while i < len(css):
        m = re.search(r"body\.embed-compare", css[i:])
        if not m:
            break
        start = i + m.start()
        brace = css.find("{", start)
        if brace < 0:
            break
        depth = 0
        j = brace
        while j < len(css):
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        out.append(css[start:j])
        i = j
    return "\n".join(out)


def keyframes(css: str, names: list[str]) -> str:
    chunks = []
    for name in names:
        m = re.search(rf"@keyframes\s+{re.escape(name)}\s*\{{", css)
        if not m:
            continue
        start = m.start()
        brace = css.find("{", start)
        depth = 0
        j = brace
        while j < len(css):
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        chunks.append(css[start:j])
    return "\n".join(chunks)


HAMMING_BASE = """
.wgt-hamming-inner.embed-compare .word-grid { display: flex; gap: 14px; align-items: flex-start; }
.wgt-hamming-inner.embed-compare .bytes-col { display: flex; flex-direction: column; gap: 5px; flex: 1 1 0; min-width: 0; }
.wgt-hamming-inner.embed-compare .check-col { display: flex; flex-direction: column; gap: 7px; min-width: 96px; flex: 0 0 auto; border-radius: 8px; border: 1.5px solid rgba(248,113,113,.42); }
.wgt-hamming-inner.embed-compare .check-cell { display: flex; align-items: center; gap: 6px; justify-content: flex-start; border-radius: 5px; transition: all .12s ease; }
.wgt-hamming-inner.embed-compare .check-cell .cval { font: 600 16px/1 'Cormorant Garamond', serif; opacity: .9; background: rgba(255,255,255,.12); border-radius: 4px; min-width: 22px; text-align: center; padding: 1px 0; }
.wgt-hamming-inner.embed-compare .check-col .ctitle { font: 600 12px/1.2 'Cinzel', serif; letter-spacing: .06em; text-align: center; margin-bottom: 2px; }
.wgt-hamming-inner.embed-compare .ctitle-sub { display: block; font: 400 10px/1.2 'Cormorant Garamond', serif; font-style: italic; letter-spacing: .02em; margin-top: 1px; }
.wgt-hamming-inner.embed-compare .ninth-tag { font: 400 10px/1.3 'Cormorant Garamond', serif; color: rgba(248,113,113,.75); text-align: center; font-style: italic; margin-top: 4px; }
.wgt-hamming-inner.embed-compare .bit { border-radius: 5px; display: flex; align-items: center; justify-content: center; transition: all .1s ease; }
.wgt-hamming-inner.embed-compare .bit-hdr { min-width: 0; text-align: center; font: 500 10px/1 'Cormorant Garamond', serif; letter-spacing: .02em; }
.wgt-hamming-inner.embed-compare .pane-mount,
.wgt-hamming-inner.embed-compare .wgt-hamming,
.wgt-hamming-inner.embed-compare .wgt-hamming-inner {
  width: 100%;
  height: 100%;
  min-height: 100%;
}
"""


def scope_embed(css: str, scope: str) -> str:
    css = css.replace("body.embed-compare", scope)
    return css


def _find_block_end(css: str, brace: int) -> int:
    depth = 0
    j = brace
    while j < len(css):
        if css[j] == "{":
            depth += 1
        elif css[j] == "}":
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    return len(css)


def prefix_css(css: str, scope: str, root_class: str = ".wgt-hamming") -> str:
    """Prefix each rule block with scope (skip @keyframes)."""
    out = []
    i = 0
    n = len(css)
    while i < n:
        while i < n and css[i].isspace():
            i += 1
        if i >= n:
            break
        if css.startswith("@keyframes", i):
            brace = css.find("{", i)
            end = _find_block_end(css, brace)
            out.append(css[i:end])
            i = end
            continue
        if css.startswith("@media", i):
            brace = css.find("{", i)
            inner_start = brace + 1
            end = _find_block_end(css, brace)
            header = css[i:inner_start]
            inner = css[inner_start : end - 1]
            out.append(header + prefix_css(inner, scope, root_class) + "}")
            i = end
            continue
        brace = css.find("{", i)
        if brace < 0:
            break
        selector = css[i:brace].strip()
        end = _find_block_end(css, brace)
        body = css[brace:end]
        if selector.startswith("@"):
            out.append(css[i:end])
        elif selector.startswith(":root"):
            out.append(selector.replace(":root", root_class, 1) + body)
        elif selector.startswith("body"):
            out.append(f"{scope}{body}")
        else:
            parts = [p.strip() for p in selector.split(",") if p.strip()]
            prefixed = ", ".join(
                p
                if p.startswith(scope)
                or p.startswith(root_class)
                or p.startswith(".wgt-hamming")
                or p.startswith(".wgt-encoder")
                else f"{scope} {p}"
                for p in parts
            )
            out.append(prefixed + body)
        i = end
    return "".join(out)


def write_hamming_full():
    css = extract_style_block(ROOT / "hamming.html")
    cut = css.find("body.embed-compare")
    if cut > 0:
        css = css[:cut]
    scope = ".wgt-hamming-inner:not(.embed-compare)"
    scoped = prefix_css(css, scope)
    extra = f"""
.wgt-hamming {{ width: 100%; }}
{scope} {{
  background: var(--bg);
  color: var(--text);
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  line-height: 1.5;
  overflow: hidden;
}}
{scope} .stage {{
  height: auto;
  min-height: min(640px, 68vh);
  max-height: min(760px, 75vh);
}}
{scope} #open-repro-banner {{ display: none !important; }}
"""
    content = (
        "/* Auto-extracted from viz/hamming.html — re-run extract_embed_css.py */\n"
        + scoped
        + extra
        + "\n"
    )
    (OUT / "hamming-full.css").write_text(content, encoding="utf-8")
    print("hamming-full.css", len(content), "bytes")


def write_hamming():
    css = extract_style_block(ROOT / "hamming.html")
    rules = embed_rules(css)
    kf = keyframes(css, ["embed-burden-pulse", "pulse-err"])
    scope = ".wgt-hamming-inner.embed-compare"
    scoped = scope_embed(rules, scope)
    # Hide chrome not used in compare embed
    scoped += f"""
{scope} #phaseTag,
{scope} .run-timer,
{scope} .word-progress,
{scope} .tweet-banner,
{scope} .caption {{ display: none !important; }}
{scope} {{ overflow: hidden; background: #0E0618 !important; color: rgba(248,244,255,.88); }}
"""
    content = f"/* Auto-extracted from viz/hamming.html — re-run extract_embed_css.py */\n{kf}\n\n{HAMMING_BASE}\n{scoped}\n"
    (OUT / "hamming-embed.css").write_text(content, encoding="utf-8")
    print("hamming-embed.css", len(content), "bytes")


def write_encoder_full():
    css = extract_style_block(ROOT / "encoder.html")
    cut = css.find("body.embed-compare")
    if cut > 0:
        css = css[:cut]
    scope = ".wgt-encoder-inner:not(.embed-compare)"
    scoped = prefix_css(css, scope, ".wgt-encoder")
    extra = f"""
.wgt-encoder {{ width: 100%; }}
{scope} {{
  background: var(--bg);
  color: var(--text);
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  line-height: 1.5;
  overflow: hidden;
}}
{scope} .stage {{
  height: auto;
  min-height: min(680px, 70vh);
  max-height: min(860px, 78vh);
}}
{scope} #open-repro-banner {{ display: none !important; }}
"""
    content = (
        "/* Auto-extracted from viz/encoder.html — re-run extract_embed_css.py */\n"
        + scoped
        + extra
        + "\n"
    )
    (OUT / "encoder-full.css").write_text(content, encoding="utf-8")
    print("encoder-full.css", len(content), "bytes")


def write_encoder():
    css = extract_style_block(ROOT / "encoder.html")
    rules = embed_rules(css)
    scope = ".wgt-encoder-inner.embed-compare"
    scoped = scope_embed(rules, scope)
    scoped += f"""
{scope} .phase-tag,
{scope} .run-timer,
{scope} .tweet-banner,
{scope} .caption,
{scope} .work-tabs,
{scope} .controls,
{scope} .speed-note {{ display: none !important; }}
{scope} {{ overflow: hidden; background: #3D0094 !important; }}
"""
    content = f"/* Auto-extracted from viz/encoder.html — re-run extract_embed_css.py */\n{scoped}\n"
    (OUT / "encoder-embed.css").write_text(content, encoding="utf-8")
    print("encoder-embed.css", len(content), "bytes")


if __name__ == "__main__":
    write_hamming_full()
    write_hamming()
    write_encoder_full()
    write_encoder()
