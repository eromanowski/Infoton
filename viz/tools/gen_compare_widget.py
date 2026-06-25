#!/usr/bin/env python3
"""Generate sites-v2/widgets/compare.js from viz/compare.html."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "compare.html").read_text(encoding="utf-8")

start = html.index('<header class="header">')
script_i = html.index("<script>", start)
end = html.rindex("</section>", start, script_i) + len("</section>")
body_html = html[start:end]

body_html = body_html.replace("sites-v2/index.html#/compare", "#/")
body_html = re.sub(
    r'<div class="pane-body"><iframe id="p30Frame"[^>]*></iframe></div>',
    '<div class="pane-body"><div class="pane-mount" id="p30Mount"></div></div>',
    body_html,
)
body_html = re.sub(
    r'<div class="pane-body"><iframe id="hamFrame"[^>]*></iframe></div>',
    '<div class="pane-body"><div class="pane-mount" id="hamMount"></div></div>',
    body_html,
)

template = '<div class="wgt wgt-compare">\n' + body_html + "\n</div>"

script_m = re.search(r"<script>\s*(.*?)\s*</script>\s*</body>", html, re.DOTALL)
js = script_m.group(1)

# Drop bootstrap / frame wiring (replaced by mountCompare)
js = re.sub(r'"use strict";\s*', "", js, count=1)
js = re.sub(
    r"var DEFAULT_SENTENCE=.*?;\s*",
    "",
    js,
    count=1,
)
js = re.sub(
    r"var playing=false;\s*var paused=false;\s*var runStarted=false;\s*"
    r"var p30CompleteSeen=false;\s*var opDelay=8;\s*var tickTimer=null;\s*"
    r"var framesReady=\{p30:false,ham:false\};\s*",
    "",
    js,
    count=1,
)
js = re.sub(
    r"var p30Frame=document\.getElementById\('p30Frame'\);\nvar hamFrame=.*?\n",
    "",
    js,
)
js = re.sub(r"var sentenceInput=document\.getElementById\('sentenceInput'\);\n", "", js)
js = re.sub(
    r"function onFramesReady\(\)\{.*?\}\s*function markFrameReady\(side\)\{.*?\}\s*",
    "",
    js,
    flags=re.DOTALL,
)
js = re.sub(r"p30Frame\.addEventListener\('load'.*?\n", "", js)
js = re.sub(r"hamFrame\.addEventListener\('load'.*?\n", "", js)
js = re.sub(
    r"window\.addEventListener\('message',function\(e\)\{.*?\n\}\);\n\n",
    "",
    js,
    flags=re.DOTALL,
)

js = js.replace("document.getElementById(", "ge(")
js = js.replace("document.querySelectorAll(", "root.querySelectorAll(")
js = js.replace("document.querySelector(", "root.querySelector(")
js = js.replace("document.body.classList", "wgt.classList")

js = re.sub(
    r"function postFrame\(frame,cmd,extra\)\{\s*try\{frame\.contentWindow\.postMessage\(Object\.assign\(\{cmd:cmd\},extra\|\|\{\}\),'\*'\);\}catch\(e\)\{\}\s*\}",
    """function postFrame(side,cmd,extra){
  var api=side==='p30'?p30Api:hamApi;
  if(!api) return;
  if(cmd==='step') api.step();
  else if(cmd==='pause') api.pause();
  else if(cmd==='reset') api.reset();
  else if(cmd==='setSpeed'&&extra) api.setSpeed(extra.delay);
  else if(cmd==='setSentence'&&extra) api.setSentence(extra.text);
}""",
    js,
)
js = js.replace("postFrame(p30Frame,'", "postFrame('p30','")
js = js.replace("postFrame(hamFrame,'", "postFrame('ham','")
js = js.replace("postFrame(p30Frame,", "postFrame('p30',")
js = js.replace("postFrame(hamFrame,", "postFrame('ham',")
js = js.replace(
    "function postBoth(cmd,extra){ postFrame(p30Frame,cmd,extra); postFrame(hamFrame,cmd,extra); }",
    "function postBoth(cmd,extra){ postFrame('p30',cmd,extra); postFrame('ham',cmd,extra); }",
)

js = re.sub(
    r"ge\('runBtn'\)\.addEventListener\('click',runComparison\);\n"
    r"ge\('stepBtn'\)\.addEventListener\('click',stepOnce\);\n"
    r"ge\('resetBtn'\)\.addEventListener\('click',reset\);\n"
    r"sentenceInput\.addEventListener\('input',function\(\)\{\n"
    r"  updateSentenceMeta\(\);\n"
    r"  if\(!runStarted\) updateSentenceHighlight\(\);\n"
    r"\}\);\n"
    r"root\.querySelectorAll\('\.speed-btn'\)\.forEach\(function\(btn\)\{\n"
    r"  btn\.addEventListener\('click',function\(\)\{ applySpeed\(parseInt\(this\.dataset\.delay,10\)\); \}\);\n"
    r"\}\);\n\n"
    r"updateSentenceMeta\(\);\n"
    r"updateStatus\(\);\n",
    "",
    js,
)

tpl_json = json.dumps(template)

out = f"""(function (global) {{
  "use strict";

  var DEFAULT_SENTENCE = global.P30_DEFAULT_SENTENCE ||
    "The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.";

  var TEMPLATE = {tpl_json};

  function mountCompare(root, opts) {{
    opts = opts || {{}};
    var compact = !!opts.compact;
    var standalone = !!opts.standalone;

    root.innerHTML = TEMPLATE;
    var wgt = root.querySelector(".wgt-compare");
    wgt.classList.toggle("wgt-compare-compact", compact);
    wgt.classList.toggle("wgt-compare-standalone", standalone);
    wgt.classList.toggle("wgt-compare-embed", !standalone);

    function ge(id) {{ return root.querySelector("#" + id); }}

    var sentenceInput = ge("sentenceInput");
    if (sentenceInput && !sentenceInput.value.trim()) sentenceInput.value = DEFAULT_SENTENCE;

    var playing = false;
    var paused = false;
    var runStarted = false;
    var p30CompleteSeen = false;
    var opDelay = opts.delay || 8;
    var tickTimer = null;
    var p30Api = null;
    var hamApi = null;

{js}

    function onChildState(d) {{
      if (!d || d.type !== "state") return;
      if (d.source === "p30") {{
        Object.assign(state.p30, {{
          ops: d.ops, progress: d.progress, finished: d.finished, playing: d.playing,
          ms: d.ms || 0, char: d.char || "", position: d.position || "",
          glyphs: d.glyphs != null ? d.glyphs : d.progress,
          charIndex: d.charIndex != null ? d.charIndex : -1,
          opPhase: d.opPhase || "",
        }});
        if (d.opsMax) state.p30.opsMax = d.opsMax;
      }} else if (d.source === "hamming") {{
        Object.assign(state.ham, {{
          ops: d.ops, progress: d.progress, finished: d.finished, playing: d.playing,
          word: d.word || 1, ms: d.ms || 0, byteIdx: d.byteIdx != null ? d.byteIdx : "",
          bytesUsed: d.bytesUsed != null ? d.bytesUsed : 0,
          charIndex: d.charIndex != null ? d.charIndex : -1,
          bitIndex: d.bitIndex != null ? d.bitIndex : "",
          stepPhase: d.stepPhase || "",
        }});
        if (d.opsMax) state.ham.opsMax = d.opsMax;
      }}
      if (state.p30.finished && state.ham.finished && playing) stopLockstep(true);
      updateStatus();
    }}

    var mountReady = {{ p30: false, ham: false }};
    p30Api = global.P30Widgets.encoder.mount(ge("p30Mount"), {{
      delay: opDelay,
      embed: true,
      onState: onChildState,
      onReady: function () {{
        mountReady.p30 = true;
        if (mountReady.p30 && mountReady.ham) {{ applySpeed(opDelay); pushSentence(); }}
      }},
    }});

    hamApi = global.P30Widgets.hamming.mount(ge("hamMount"), {{
      delay: opDelay,
      embed: true,
      onState: onChildState,
      onReady: function () {{
        mountReady.ham = true;
        if (mountReady.p30 && mountReady.ham) {{ applySpeed(opDelay); pushSentence(); }}
      }},
    }});

    ge("runBtn").addEventListener("click", runComparison);
    ge("stepBtn").addEventListener("click", stepOnce);
    ge("resetBtn").addEventListener("click", reset);
    sentenceInput.addEventListener("input", function () {{
      updateSentenceMeta();
      if (!runStarted) updateSentenceHighlight();
    }});
    root.querySelectorAll(".speed-btn").forEach(function (btn) {{
      btn.addEventListener("click", function () {{ applySpeed(parseInt(btn.dataset.delay, 10)); }});
    }});

    updateSentenceMeta();
    updateStatus();

    return {{
      destroy: function () {{
        stopLockstep(true);
        if (p30Api) p30Api.destroy();
        if (hamApi) hamApi.destroy();
        root.innerHTML = "";
      }},
    }};
  }}

  global.P30Widgets = global.P30Widgets || {{}};
  global.P30Widgets.compare = {{ mount: mountCompare }};
}})(window);
"""

(ROOT / "sites-v2" / "widgets" / "compare.js").write_text(out, encoding="utf-8")
print("wrote compare.js", len(out), "bytes")
print("template length", len(template))
