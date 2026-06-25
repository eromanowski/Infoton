(function (global) {
  'use strict';

  var ENCODER_STUB =
    '<div class="stage">' +
      '<div class="work">' +
        '<div class="work-head">' +
          '<div class="demo-control-block">' +
            '<div class="demo-cmd-row">' +
              '<span class="demo-cmd-lab">Mode</span>' +
              '<div class="work-tabs">' +
                '<button type="button" class="work-tab active" data-mode="encoder">Library</button>' +
                '<span class="work-tab-sep">·</span>' +
                '<button type="button" class="work-tab" data-mode="bios">BIOS native</button>' +
              '</div>' +
            '</div>' +
            '<div class="demo-cmd-row controls">' +
              '<span class="demo-cmd-lab">Run</span>' +
              '<div class="demo-run-btns">' +
                '<button type="button" class="btn primary" id="playBtn">Play</button>' +
                '<button type="button" class="btn" id="stepBtn">Step</button>' +
                '<button type="button" class="btn" id="resetBtn">Reset</button>' +
                '<button type="button" class="btn err" id="errBtn">Inject error</button>' +
              '</div>' +
            '</div>' +
            '<div class="demo-cmd-row">' +
              '<span class="demo-cmd-lab">Speed</span>' +
              '<div class="speed-tiers" id="speedTiers">' +
                '<button type="button" class="tier-btn active" data-delay="150">Demo</button>' +
                '<button type="button" class="tier-btn" data-delay="55">Fast</button>' +
                '<button type="button" class="tier-btn" data-delay="14">Turbo</button>' +
                '<button type="button" class="tier-btn" data-delay="6">Real‑ish</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="demo-status-strip">' +
          '<div class="phase-tag" id="phaseTag">Idle</div>' +
          '<div class="run-timer" id="runTimer" aria-live="polite">' +
            '<span class="run-timer-elapsed" id="timerElapsed">0.00 s</span>' +
            '<span class="run-timer-meta" id="timerMeta">0 / 163 · — ms/char</span>' +
          '</div>' +
        '</div>' +
        '<div class="tweet-banner" id="tweetBanner">' +
          '<div class="tweet-text" id="tweetText"></div>' +
          '<div class="tweet-meta"><span id="tweetMeta">163 characters · 489 operations · 167 positions</span></div>' +
        '</div>' +
        '<div class="clock-stage">' +
          '<div class="clock-visual">' +
            '<div class="clock-canvas-wrap">' +
              '<canvas id="clock"></canvas>' +
            '</div>' +
            '<aside class="p30-bridge" aria-label="P30 verification path">' +
              '<div class="p30-bridge-line"></div>' +
              '<div class="p30-bridge-arrow" aria-hidden="true">→</div>' +
              '<div class="p30-bridge-lab">Prime lanes converge</div>' +
              '<div class="p30-bridge-sub">into a glyph position</div>' +
              '<div class="p30-bridge-arrow-d" aria-hidden="true">↓</div>' +
              '<div class="p30-bridge-sub">then verify</div>' +
            '</aside>' +
          '</div>' +
        '</div>' +
        '<div class="caption" id="caption">Press <b>Play</b> to encode the sentence character by character, or <b>Step</b> through one at a time. Each character lights the spoke it lands on; a value on a spoke is valid by construction.</div>' +
        '<div class="speed-note" id="speedNote">Real hardware would run this far faster; this animation slows the operation model for inspection.</div>' +
      '</div>' +
      '<div class="panel-wrap">' +
        '<div class="panel" id="panel">' +
          '<div class="mode-tabs">' +
            '<button type="button" class="mode-tab active" data-mode="encoder">P30 Encoder</button>' +
            '<button type="button" class="mode-tab" data-mode="bios">P30 BIOS</button>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title" id="opTitle">Operations Performed</div>' +
            '<div class="counter locate"><span class="c-name" id="cLocateName">Locate + Verify</span><span class="c-val" id="cLocate">0</span></div>' +
            '<div class="counter emit"><span class="c-name" id="cEmitName">Emit</span><span class="c-val" id="cEmit">0</span></div>' +
            '<div class="counter total"><span class="c-name" id="cTotalName">Total P30</span><span class="c-val" id="cTotal">0</span></div>' +
            '<div class="mode-note" id="modeNote">Library mode: each character is located, emitted, and verified, three operations apiece, because a library on top of a conventional stack cannot assume the surrounding system preserved validity. This is the conservative, runs-today cost.</div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">Storage, verified against the codec</div>' +
            '<div class="store-readout">' +
              '<div class="store-row"><span class="store-lab">UTF-8 baseline</span><span class="store-val data">163 bytes</span></div>' +
              '<div class="store-row"><span class="store-lab">P30 positions (CHAR)</span><span class="store-val data" id="stTokens">0</span></div>' +
              '<div class="store-row"><span class="store-lab">CHAR mode, round-trips</span><span class="store-val data">167 bytes</span></div>' +
              '<div class="store-row"><span class="store-lab">PACKED mode, round-trips</span><span class="store-val data">171 bytes</span></div>' +
              '<div class="store-row total"><span class="store-lab">DIRECT packed, write-only</span><span class="store-val total">116 bytes</span></div>' +
            '</div>' +
            '<div class="store-cap">At short lengths P30 is not about making files smaller; on this sentence it is within a few bytes of UTF-8. What it buys instead is built-in integrity.</div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">Landauer Energy Floor</div>' +
            '<div class="temp-sel">' +
              '<label class="temp-lab">Operating temperature</label>' +
              '<select id="tempSel">' +
                '<option value="300">300 K · 27°C (lab reference)</option>' +
                '<option value="350" selected>350 K · 77°C (typical DRAM junction)</option>' +
                '<option value="358">358 K · 85°C (DRAM spec maximum)</option>' +
                '<option value="398">398 K · 125°C (silicon junction max)</option>' +
              '</select>' +
            '</div>' +
            '<div class="energy-readout">' +
              '<div class="erow"><span class="elab">Per operation</span><span class="eval" id="ePerOp">—</span></div>' +
              '<div class="erow"><span class="elab">This run (<span id="eOps">0</span> ops)</span><span class="eval" id="eRun">—</span></div>' +
            '</div>' +
            '<div class="energy-cap">E = k<sub>B</sub> T ln(2) per irreversible operation.</div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">Signal vs Overhead</div>' +
            '<div class="ratio-wrap">' +
              '<div class="bar-row"><span class="bar-lab">P30</span>' +
                '<div class="bar-track"><div class="bar-fill sigwork" id="barWork"></div></div>' +
                '<span class="bar-num" id="barP30Num">489</span></div>' +
              '<div class="bar-row"><span class="bar-lab">Hamming</span>' +
                '<div class="bar-track"><div class="bar-fill over" id="barOver"></div></div>' +
                '<span class="bar-num">12264</span></div>' +
            '</div>' +
            '<div class="ratio-big" id="ratioBig">25.1×</div>' +
            '<div class="ratio-cap" id="ratioCap">operations of Hamming SECDED checking for the same 163 characters, against P30\'s 489</div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">The Alternative It Answers</div>' +
            '<div class="p30">' +
              '<div class="p30-head">' +
                '<span class="p30-name">Hamming SECDED</span>' +
                '<span class="p30-val">12264</span>' +
              '</div>' +
              '<div class="p30-cap">Spends <b>584 operations per 64-bit word</b> protecting bits that may never flip. P30 reaches the same verified result in <b>3 per character</b>.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="scroll-hint" id="scrollHint">Scroll for more<span class="arrow">↓</span></div>' +
      '</div>' +
    '</div>';

  function mountEncoder(root, opts) {
    root.innerHTML = '<div class="wgt wgt-encoder"><div class="wgt-encoder-inner">' + ENCODER_STUB + '</div></div>';
    var inner = root.querySelector('.wgt-encoder-inner');
    var embed = opts && Object.prototype.hasOwnProperty.call(opts, 'embed') ? !!opts.embed : true;
    var coreOpts = {
      embed: embed,
      delay: (opts && opts.delay) || (embed ? 8 : 150),
      emit: opts && opts.onState,
      onReady: opts && opts.onReady,
    };
    var api = global.P30EncoderCore.mount(inner, coreOpts);
    return {
      play: api.play,
      pause: api.pause,
      reset: api.reset,
      step: api.step,
      setSpeed: api.setSpeed,
      setSentence: api.setSentence,
      destroy: function () {
        api.destroy();
        root.innerHTML = '';
      },
    };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.encode = { mount: mountEncoder };
  global.P30Widgets.encoder = { mount: mountEncoder };
})(window);
