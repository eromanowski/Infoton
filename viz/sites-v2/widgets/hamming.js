(function (global) {
  'use strict';

  var HAMMING_STUB =
    '<div class="stage">' +
      '<div class="work">' +
        '<div class="work-head">' +
          '<div class="demo-control-block">' +
            '<div class="demo-cmd-row">' +
              '<span class="demo-cmd-lab">Mode</span>' +
              '<div class="demo-tabs">' +
                '<button type="button" class="demo-tab active" id="tabWord">Single word</button>' +
                '<button type="button" class="demo-tab" id="tabTweet">Full tweet</button>' +
              '</div>' +
            '</div>' +
            '<div class="demo-cmd-row controls">' +
              '<span class="demo-cmd-lab">Run</span>' +
              '<div class="demo-run-btns">' +
                '<button type="button" class="btn primary" id="playBtn">Play</button>' +
                '<button type="button" class="btn" id="stepBtn">Step</button>' +
                '<button type="button" class="btn" id="resetBtn">Reset</button>' +
                '<button type="button" class="btn danger" id="flipBtn">Flip a bit</button>' +
              '</div>' +
            '</div>' +
            '<div class="demo-cmd-row">' +
              '<span class="demo-cmd-lab">Speed</span>' +
              '<div class="speed-tiers" id="speedTiers">' +
                '<button type="button" class="tier-btn active" data-delay="156">Demo</button>' +
                '<button type="button" class="tier-btn" data-delay="40">Fast</button>' +
                '<button type="button" class="tier-btn" data-delay="8">Turbo</button>' +
                '<button type="button" class="tier-btn" data-delay="6">Real‑ish</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="demo-status-strip">' +
          '<div class="phase-tag" id="phaseTag">Idle</div>' +
          '<div class="run-timer" id="runTimer" aria-live="polite">' +
            '<span class="run-timer-elapsed" id="timerElapsed">0 ms</span>' +
            '<span class="run-timer-meta" id="timerMeta">0 / 12,264 ops</span>' +
          '</div>' +
        '</div>' +
        '<div class="word-progress" id="wordTag"></div>' +
        '<div class="tweet-banner" id="tweetBanner" style="display:none">' +
          '<div class="tweet-text" id="tweetText"></div>' +
          '<div class="tweet-meta"><span id="tweetMeta">163 characters · 1,304 bits · 21 words of 64 bits</span></div>' +
        '</div>' +
        '<div class="grid-wrap" id="gridWrap"></div>' +
        '<div class="caption" id="caption">Press <b>Play</b> to watch the machine encode, then read, one 64-bit word. Or step through one operation at a time. Then press <b>Flip a bit</b> to see why a single error obligates all eight bytes.</div>' +
        '<div class="speed-note" id="speedNote">Real hardware would run this far faster; this animation slows the operation model for inspection.</div>' +
      '</div>' +
      '<div class="panel-wrap">' +
        '<div class="panel" id="panel">' +
          '<div class="p-block">' +
            '<div class="p-title">Operations Performed</div>' +
            '<div class="counter write"><span class="c-name">Write overhead</span><span class="c-val" id="cWrite">0</span></div>' +
            '<div class="counter read"><span class="c-name">Read overhead</span><span class="c-val" id="cRead">0</span></div>' +
            '<div class="counter total"><span class="c-name">Total ECC</span><span class="c-val" id="cTotal">0</span></div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">Storage Tax</div>' +
            '<div class="store-readout">' +
              '<div class="store-row"><span class="store-lab">Data delivered</span><span class="store-val data">64 bits · 8 bytes</span></div>' +
              '<div class="store-row"><span class="store-lab">Check bits stored</span><span class="store-val check">8 bits · 1 byte</span></div>' +
              '<div class="store-row total"><span class="store-lab">Physically stored</span><span class="store-val total">72 bits · 9 bytes</span></div>' +
              '<div class="store-row"><span class="store-lab">Space spent on checks</span><span class="store-val check">12.5% · 1 byte in 9</span></div>' +
            '</div>' +
            '<div class="store-cap">A ninth byte of pure overhead rides with every eight. The 8 check bits follow a Hsiao (72,64) matrix, each covering 26 of the 64 data bits.</div>' +
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
            '<div class="p-title">Granularity of Correction</div>' +
            '<div class="bytes-readout">' +
              '<span class="bytes-lab">Bytes the machine must touch to locate one flipped bit</span>' +
              '<span class="bytes-val" id="bytesVal">0 / 8</span>' +
            '</div>' +
            '<div class="byte-pips" id="bytePips"></div>' +
            '<div class="bytes-cap">You cannot pay for one byte. The redundancy is spread across the whole word.</div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">Signal vs Overhead</div>' +
            '<div class="ratio-wrap">' +
              '<div class="bar-row"><span class="bar-lab">Real work</span>' +
                '<div class="bar-track"><div class="bar-fill work" id="barWork"></div></div>' +
                '<span class="bar-num">64</span></div>' +
              '<div class="bar-row"><span class="bar-lab">Checking</span>' +
                '<div class="bar-track"><div class="bar-fill over" id="barOver"></div></div>' +
                '<span class="bar-num">584</span></div>' +
            '</div>' +
            '<div class="ratio-big" id="ratioBig">9.1×</div>' +
            '<div class="ratio-cap">operations of checking per 64-bit word, for every 64 operations of real work</div>' +
          '</div>' +
          '<div class="p-block">' +
            '<div class="p-title">The Alternative</div>' +
            '<div class="p30">' +
              '<div class="p30-head">' +
                '<span class="p30-name">P30 Encoding</span>' +
                '<span class="p30-val" id="p30Val">0</span>' +
              '</div>' +
              '<div class="p30-cap">Reaches its result in <b>3 operations per character</b> — about <b>24</b> for these 8 bytes — and waits.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="scroll-hint" id="scrollHint">Scroll for more<span class="arrow">↓</span></div>' +
      '</div>' +
    '</div>';

  function mountHamming(root, opts) {
    root.innerHTML = '<div class="wgt wgt-hamming"><div class="wgt-hamming-inner">' + HAMMING_STUB + '</div></div>';
    var inner = root.querySelector('.wgt-hamming-inner');
    var embed = opts && Object.prototype.hasOwnProperty.call(opts, 'embed') ? !!opts.embed : true;
    var coreOpts = {
      embed: embed,
      delay: (opts && opts.delay) || (embed ? 8 : 156),
      emit: opts && opts.onState,
      onReady: opts && opts.onReady,
    };
    var api = global.P30HammingCore.mount(inner, coreOpts);
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
  global.P30Widgets.hamming = { mount: mountHamming };
})(window);
