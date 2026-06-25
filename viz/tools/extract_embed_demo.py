#!/usr/bin/env python3
"""Extract inline demo scripts from viz HTML into mountable IIFE modules."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def extract_script(html_path: Path) -> str:
    text = html_path.read_text(encoding="utf-8")
    m = re.search(r"<script>\s*(.*?)\s*</script>\s*</body>", text, re.DOTALL)
    if not m:
        raise SystemExit(f"No script block in {html_path}")
    return m.group(1)


def wrap_hamming(body: str) -> str:
    body = body.replace(
        "const EMBED_COMPARE=/[?&]embed=compare\\b/.test(location.search);",
        "var EMBED_COMPARE=!!opts.embed;",
    )
    body = body.replace(
        "if(EMBED_COMPARE){document.body.classList.add('embed-compare');stepDelay=6;}",
        "if(EMBED_COMPARE){root.classList.add('embed-compare');if(!opts.delay)stepDelay=6;}",
    )
    body = body.replace(
        "(function(){\n  const dm=/[?&]delay=(\\d+)/.exec(location.search);\n  if(dm) stepDelay=parseInt(dm[1],10);\n})();",
        "if(opts.delay) stepDelay=parseInt(opts.delay,10);",
    )
    body = re.sub(
        r"if\(EMBED_COMPARE\)\{\s*window\.addEventListener\('message'.*?\}\s*\}",
        "/* embed commands wired below */",
        body,
        flags=re.DOTALL,
    )
    body = body.replace(
        "if(!EMBED_COMPARE||window.parent===window) return;",
        "if(!opts.emit) return;",
    )
    body = body.replace("window.parent.postMessage(", "opts.emit(")
    body = body.replace(
        "window.parent.postMessage({type:'embed-ready',source:'hamming'},'*');",
        "if(opts.onReady) opts.onReady('hamming');",
    )

    body = body.replace("document.getElementById", "ge")
    return f'''(function (global) {{
  "use strict";

  function mountHammingCore(root, opts) {{
    opts = opts || {{}};
    var listeners = [];

    function q(id) {{ return root.querySelector("#" + id); }}
    function ge(id) {{
      var el = q(id);
      if (el) return el;
      return null;
    }}

{indent(body, 4)}

    var api = {{
      play: play,
      pause: stop,
      reset: reset,
      step: function () {{
        if (el.phaseTag.textContent === "Complete") return;
        stop();
        if (!runClock.running) runClockStart();
        step();
      }},
      setSpeed: function (d) {{ stepDelay = parseInt(d, 10); }},
      setSentence: function (t) {{ applySentence(t); }},
      destroy: function () {{
        stop();
        root.innerHTML = "";
      }},
    }};

    if (EMBED_COMPARE) {{
      setMode("tweet");
      broadcastEmbed();
      if (opts.onReady) opts.onReady("hamming");
    }}

    return api;
  }}

  global.P30HammingCore = {{ mount: mountHammingCore }};
}})(window);
'''


def wrap_encoder(body: str) -> str:
    body = body.replace(
        "var EMBED_COMPARE=/[?&]embed=compare\\b/.test(location.search);",
        "var EMBED_COMPARE=!!opts.embed;",
    )
    body = body.replace(
        "if(EMBED_COMPARE) document.body.classList.add('embed-compare');",
        "if(EMBED_COMPARE) root.classList.add('embed-compare');",
    )
    body = re.sub(
        r"if\(EMBED_COMPARE\)\{\s*window\.addEventListener\('message'.*?\}\s*\}",
        "/* embed commands wired below */",
        body,
        flags=re.DOTALL,
    )
    body = body.replace(
        "if(!EMBED_COMPARE||window.parent===window) return;",
        "if(!opts.emit) return;",
    )
    body = body.replace("window.parent.postMessage(", "opts.emit(")
    body = body.replace(
        "window.parent.postMessage({type:'embed-ready',source:'p30'},'*');",
        "if(opts.onReady) opts.onReady('p30');",
    )

    body = body.replace("document.getElementById", "ge")
    return f'''(function (global) {{
  "use strict";

  function mountEncoderCore(root, opts) {{
    opts = opts || {{}};
    var resizeHandler = function () {{ resize(); }};

    function q(id) {{ return root.querySelector("#" + id); }}
    function ge(id) {{
      var el = q(id);
      if (el) return el;
      return null;
    }}

{indent(body, 4)}

    var api = {{
      play: play,
      pause: stop,
      reset: reset,
      step: function () {{ stop(); stepOp(); }},
      setSpeed: function (d) {{ stepDelay = parseInt(d, 10); }},
      setSentence: function (t) {{ applySentence(t); }},
      destroy: function () {{
        stop();
        window.removeEventListener("resize", resizeHandler);
        root.innerHTML = "";
      }},
    }};

    if (EMBED_COMPARE) {{
      broadcastEmbed();
      if (opts.onReady) opts.onReady("p30");
    }}

    return api;
  }}

  global.P30EncoderCore = {{ mount: mountEncoderCore }};
}})(window);
'''


def indent(s: str, n: int) -> str:
    pad = " " * n
    return "\n".join(pad + line if line.strip() else line for line in s.splitlines())


def main():
    out = ROOT / "sites-v2" / "widgets" / "lib"
    out.mkdir(parents=True, exist_ok=True)

    ham = extract_script(ROOT / "hamming.html")
    enc = extract_script(ROOT / "encoder.html")

    (out / "hamming-core.js").write_text(wrap_hamming(ham), encoding="utf-8")
    (out / "encoder-core.js").write_text(wrap_encoder(enc), encoding="utf-8")
    print("Wrote", out / "hamming-core.js")
    print("Wrote", out / "encoder-core.js")


if __name__ == "__main__":
    main()
