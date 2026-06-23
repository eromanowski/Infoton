#!/usr/bin/env python3
"""Prepare open viz copies from extracted Infoton reference widgets."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "viz" / "infoton_reference"
OUT = ROOT / "viz"
OUT.mkdir(parents=True, exist_ok=True)

BANNER = """
<div id="open-repro-banner" style="background:#1a1a1a;color:#fada24;font:600 11px/1.4 Cinzel,serif;
  letter-spacing:.12em;text-transform:uppercase;text-align:center;padding:6px 12px;
  border-bottom:2px solid #350498">
  Open P30 reproduction &mdash; visualization adapted from
  <a href="https://infoton.ai/infoton-p30" style="color:#fff">infoton.ai/infoton-p30</a>
  (reference in viz/infoton_reference/)
</div>
"""

FIXES = [
    ("--bg:##f6f6f6", "--bg:#f6f6f6"),
    ("--bg:##f6f6f6", "--bg:#f6f6f6"),
]

RUN_CLOCK_JS = r"""var idx=0, playing=false, stepTimer=null, stepDelay=150, finished=false, tokensSoFar=0;
var runClock={accumulated:0, running:false, tick:null};

function formatElapsed(ms){
  if(ms<1000) return ms.toFixed(0)+' ms';
  if(ms<60000) return (ms/1000).toFixed(2)+' s';
  var m=Math.floor(ms/60000), s=((ms%60000)/1000).toFixed(1);
  return m+'m '+s+'s';
}

function runClockMs(){
  var t=runClock.accumulated;
  if(runClock.running) t+=performance.now()-runClock.t0;
  return t;
}

function updateRunTimer(){
  var ms=runClockMs();
  var te=document.getElementById('timerElapsed');
  var tm=document.getElementById('timerMeta');
  if(!te||!tm) return;
  te.textContent=formatElapsed(ms);
  var n=Math.min(idx, CHARS);
  var perChar=(n>0&&ms>0)?(ms/n).toFixed(1):'—';
  var eta='';
  if(playing&&n>0&&n<CHARS){
    var remain=(CHARS-n)*(ms/n);
    eta=' &middot; ~'+formatElapsed(remain)+' left';
  }
  tm.innerHTML=n+' / '+CHARS+' &middot; <b>'+perChar+'</b> ms/char'+eta;
}

function runClockStart(){
  if(!runClock.running){
    runClock.t0=performance.now();
    runClock.running=true;
  }
  clearInterval(runClock.tick);
  runClock.tick=setInterval(updateRunTimer, 50);
  updateRunTimer();
}

function runClockPause(){
  if(runClock.running){
    runClock.accumulated+=performance.now()-runClock.t0;
    runClock.running=false;
  }
  clearInterval(runClock.tick);
  runClock.tick=null;
  updateRunTimer();
}

function runClockReset(){
  runClock.accumulated=0;
  runClock.running=false;
  clearInterval(runClock.tick);
  runClock.tick=null;
  updateRunTimer();
}"""


def inject_encoder_timer(text: str) -> str:
    """Add wall-clock timer to encoder widget (idempotent)."""
    if "run-timer" in text:
        return text
    text = text.replace(
        ".work-head{display:flex;justify-content:space-between;align-items:baseline}",
        ".work-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}\n"
        ".work-head-right{display:flex;flex-direction:column;align-items:flex-end;gap:.45rem;flex-shrink:0}\n"
        ".run-timer{display:flex;flex-direction:column;align-items:flex-end;gap:2px;\n"
        "  padding:6px 12px;border-radius:6px;background:rgba(0,0,0,.22);border:1px solid rgba(250,218,36,.35)}\n"
        ".run-timer-elapsed{font:600 20px/1 'Cinzel',serif;color:var(--center);font-variant-numeric:tabular-nums}\n"
        ".run-timer-meta{font:400 13px/1 'Cormorant Garamond',serif;color:rgba(255,255,255,.72)}\n"
        ".run-timer-meta b{color:var(--center);font-weight:600}",
    )
    text = text.replace(
        '      <div class="phase-tag" id="phaseTag">Idle</div>',
        '      <div class="work-head-right">\n'
        '        <div class="phase-tag" id="phaseTag">Idle</div>\n'
        '        <div class="run-timer" id="runTimer" aria-live="polite">\n'
        '          <span class="run-timer-elapsed" id="timerElapsed">0.00 s</span>\n'
        '          <span class="run-timer-meta" id="timerMeta">0 / 163 &middot; — ms/char</span>\n'
        "        </div>\n"
        "      </div>",
    )
    text = text.replace(
        "var idx=0, playing=false, timer=null, stepDelay=150, finished=false, tokensSoFar=0;",
        RUN_CLOCK_JS,
    )
    text = text.replace(
        "  if(rc) rc.textContent='operations of Hamming SECDED checking for the same 163 characters, 21 sixty-four-bit words at 584 operations each, against P30\\u2019s '+p30Full;\n}",
        "  if(rc) rc.textContent='operations of Hamming SECDED checking for the same 163 characters, 21 sixty-four-bit words at 584 operations each, against P30\\u2019s '+p30Full;\n"
        "  updateRunTimer();\n}",
    )
    old_play = """function play(){
  if(playing){ stop(); return; }
  if(idx>=CHARS){
    // restart the sweep; in BIOS mode keep passCount so reads accumulate, in encoder mode full reset
    idx=0; finished=false; tokensSoFar=0; litRes=-1; litVal=null; highlightChar(-1);
    for(var i=0;i<tweetCharEls.length;i++){ tweetCharEls[i].classList.remove('tw-done'); }
  }
  playing=true; document.getElementById('playBtn').textContent='Pause';
  el.phaseTag.textContent = (p30mode==='bios' && passCount>0) ? 'Reading' : 'Encode';
  (function tick(){
    if(!playing) return;
    if(idx>=CHARS){ finish(); return; }
    stepChar();
    timer=setTimeout(tick, stepDuration());
  })();
}
function stop(){ playing=false; clearTimeout(timer); document.getElementById('playBtn').textContent='Play'; }
function reset(){
  stop(); idx=0; finished=false; tokensSoFar=0; passCount=0; errOps=0; litRes=-1; litVal=null; errState=null;
  highlightChar(-1); el.phaseTag.textContent='Idle';
  el.caption.innerHTML='Press <b>Play</b> to encode the sentence character by character, or <b>Step</b> through one at a time. Each character lights the spoke it lands on; a value on a spoke is valid by construction.';
  draw(); updatePanel();
}"""
    new_play = """function play(){
  if(playing){ stop(); return; }
  if(idx>=CHARS){
    // restart the sweep; in BIOS mode keep passCount so reads accumulate, in encoder mode full reset
    idx=0; finished=false; tokensSoFar=0; litRes=-1; litVal=null; highlightChar(-1);
    for(var i=0;i<tweetCharEls.length;i++){ tweetCharEls[i].classList.remove('tw-done'); }
    runClockReset();
  }
  playing=true; document.getElementById('playBtn').textContent='Pause';
  el.phaseTag.textContent = (p30mode==='bios' && passCount>0) ? 'Reading' : 'Encode';
  runClockStart();
  (function tick(){
    if(!playing) return;
    if(idx>=CHARS){ finish(); return; }
    stepChar();
    stepTimer=setTimeout(tick, stepDuration());
  })();
}
function stop(){
  playing=false;
  clearTimeout(stepTimer);
  runClockPause();
  document.getElementById('playBtn').textContent='Play';
}
function reset(){
  stop(); idx=0; finished=false; tokensSoFar=0; passCount=0; errOps=0; litRes=-1; litVal=null; errState=null;
  runClockReset();
  highlightChar(-1); el.phaseTag.textContent='Idle';
  el.caption.innerHTML='Press <b>Play</b> to encode the sentence character by character, or <b>Step</b> through one at a time. Each character lights the spoke it lands on; a value on a spoke is valid by construction.';
  draw(); updatePanel();
}"""
    text = text.replace(old_play, new_play)
    text = text.replace(
        "  el.stTokens.textContent='167';\n  updatePanel();\n}",
        "  el.stTokens.textContent='167';\n  updatePanel();\n  updateRunTimer();\n}",
    )
    return text


def prepare(name: str, src: str, dst: str, inject_banner: bool = True) -> None:
    text = (REF / src).read_text(encoding="utf-8")
    for old, new in FIXES:
        text = text.replace(old, new)
    if inject_banner:
        text = text.replace("<body>", "<body>" + BANNER, 1)
    if dst == "encoder.html":
        text = inject_encoder_timer(text)
    (OUT / dst).write_text(text, encoding="utf-8")
    print("wrote", dst, len(text))


def main() -> None:
    prepare("encoder", "widget_2.html", "encoder.html")
    prepare("hamming", "widget_1.html", "hamming.html")
    prepare("impact", "widget_3.html", "impact.html")
    prepare("video", "widget_0.html", "video.html", inject_banner=False)

    hub = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>P30 Open Visualization Hub</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#f6f6f6;font-family:Cinzel,serif;color:#350498}
  header{padding:1.5rem 2rem;border-bottom:2px solid #350498;background:#fff}
  h1{margin:0;font-size:1.5rem}
  p{margin:.5rem 0 0;font-family:Georgia,serif;font-size:1rem;color:#444;max-width:60rem}
  nav{display:flex;gap:1rem;flex-wrap:wrap;padding:1rem 2rem}
  nav a{color:#350498;text-decoration:none;border:1px solid #6e54a3;padding:.6rem 1rem;border-radius:6px;background:#fff}
  nav a:hover{background:#fada24}
  iframe{display:block;width:100%;border:0;border-top:2px solid #350498}
</style>
</head>
<body>
<header>
  <h1>P30 Open Visualization Hub</h1>
  <p>Matches Infoton&apos;s embedded demos: Prime 30 clock encoder, Hamming 584-op animation, and datacenter impact panel.
     Metrics verified via <code>tools/verify_demo.py</code>.</p>
</header>
<nav>
  <a href="encoder.html" target="viz">P30 Encoder + Panel</a>
  <a href="hamming.html" target="viz">Hamming SECDED (584 ops)</a>
  <a href="impact.html" target="viz">Datacenter Impact</a>
  <a href="video.html" target="viz">Video</a>
</nav>
<iframe name="viz" src="encoder.html" height="920" title="P30 visualization"></iframe>
</body>
</html>
"""
    (OUT / "hub.html").write_text(hub, encoding="utf-8")
    print("wrote hub.html")


if __name__ == "__main__":
    main()
