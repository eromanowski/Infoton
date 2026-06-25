(function (global) {
  "use strict";

  var DEFAULT_SENTENCE = global.P30_DEFAULT_SENTENCE ||
    "The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.";

  var TEMPLATE = "<div class=\"wgt wgt-compare\">\n<header class=\"header\">\n  <div class=\"header-top\">\n    <div>\n      <h1>Same Sentence, Two Encoding Systems</h1>\n      <p class=\"header-intro\">Watch the same sentence get encoded two ways: with <b>P30 Prime Encoding</b> and with a traditional <b>64-bit byte system + ECC</b>. Compare symbolic storage, modeled operations, and error checking in real time.</p>\n    </div>\n    <a class=\"home-link\" href=\"#/\">Brief v2</a>\n  </div>\n\n  <details class=\"theory\">\n    <summary>Show theory</summary>\n    <div class=\"theory-body\">\n      <p>The two sides count <i>different kinds</i> of operation: P30 ops are <i>symbol-level</i> (Locate / Emit / Verify per character); Hamming ops are <i>bit-level</i> (XORs across each 64-bit word). P30's count is the write path; Hamming's is a full round trip with syndrome checks on every read.</p>\n      <p style=\"margin-top:.45rem\">They guarantee different things \u2014 P30 confirms <i>coprimality</i> (structurally valid); Hamming <span class=\"tip\" tabindex=\"0\" data-tip=\"An error-correcting code that can detect two-bit errors and correct one-bit errors.\">SECDED</span> detects and <i>corrects</i> bit-flips. Timers are slow-motion replay \u2014 this compares <i>operation counts</i>, not hardware speed.</p>\n    </div>\n  </details>\n\n  <div class=\"sentence-block\">\n    <div class=\"sentence-top\">\n      <span class=\"sentence-label\">Sentence being encoded</span>\n      <span class=\"sentence-meta\" id=\"sentenceMeta\">\u2014</span>\n    </div>\n    <textarea class=\"sentence-input\" id=\"sentenceInput\" rows=\"2\" spellcheck=\"false\">The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.</textarea>\n    <div class=\"sentence-live\" id=\"sentenceLive\" hidden aria-live=\"polite\"></div>\n  </div>\n\n  <div class=\"pause-banner\" id=\"pauseBanner\">Paused at operation <b id=\"pauseOps\">\u2014</b> \u2014 P30 <b id=\"pauseP30\">\u2014</b>, Traditional <b id=\"pauseTrad\">\u2014</b></div>\n\n  <div class=\"command-bar\">\n    <div class=\"controls\">\n      <button class=\"btn primary\" id=\"runBtn\" type=\"button\">Run comparison</button>\n      <button class=\"btn\" id=\"stepBtn\" type=\"button\">Next step</button>\n      <button class=\"btn ghost\" id=\"resetBtn\" type=\"button\">Reset</button>\n    </div>\n    <div class=\"speed-group\">\n      <span class=\"toolbar-lab\">Speed</span>\n      <button class=\"speed-btn\" type=\"button\" data-delay=\"500\">Snail</button>\n      <button class=\"speed-btn\" type=\"button\" data-delay=\"22\">Slow</button>\n      <button class=\"speed-btn active\" type=\"button\" data-delay=\"8\">Normal</button>\n      <button class=\"speed-btn\" type=\"button\" data-delay=\"2\">Fast</button>\n    </div>\n    <details class=\"legend-drop\">\n      <summary>Legend</summary>\n      <div class=\"legend-drop-body\">\n        <span class=\"legend-item\"><span class=\"legend-swatch gold\"></span> P30 active</span>\n        <span class=\"legend-item\"><span class=\"legend-swatch burden\"></span> ECC / traditional burden</span>\n        <span class=\"legend-item\"><span class=\"legend-swatch green\"></span> P30 complete</span>\n        <span class=\"legend-item\"><span class=\"legend-swatch purple\"></span> Inactive</span>\n      </div>\n    </details>\n  </div>\n\n  <div class=\"progress-strip\" id=\"progressStrip\">\n    <span class=\"strip-lead\" id=\"stripLead\">Press <b>Run comparison</b> to begin</span>\n    <span class=\"strip-lead strip-complete-lead\" id=\"stripCompleteLead\">\n      Complete \u2014 scroll to the result below, or reset to replay.\n    </span>\n    <span class=\"strip-stats\">\n      <span>P30 <b id=\"stripP30\">0 / 489</b></span>\n      <span>Traditional <b id=\"stripTrad\">0 / 12,264</b></span>\n      <span>Ops gap <b class=\"gap-val\" id=\"stripGap\">\u2014</b></span>\n    </span>\n  </div>\n</header>\n\n<section class=\"mechanics-section\" id=\"mechanicsSection\">\n  <p class=\"mechanics-bridge\">The panels below show <b>where that work comes from</b>: P30 verifies symbolic prime positions, while the traditional path recomputes ECC check bits across byte groups.</p>\n\n<div class=\"panes\">\n  <div class=\"pane\">\n    <div class=\"pane-head\">\n      <div class=\"pane-title-row\">\n        <div>\n          <div class=\"pane-title\">P30 Prime Encoding</div>\n          <div class=\"pane-sub\">Characters become positions on a 30-point prime clock</div>\n        </div>\n        <span class=\"pane-phase\" id=\"p30Phase\">Idle</span>\n      </div>\n      <div class=\"pane-pills\">\n        <span class=\"pill\">Char: <b id=\"p30Char\">\u2014</b></span>\n        <span class=\"pill\">Position: <b id=\"p30Pos\">\u2014</b></span>\n        <span class=\"pill\">Glyphs: <b id=\"p30Glyphs\">0</b></span>\n        <span class=\"pill\">Ops: <b id=\"p30OpsShort\">0</b></span>\n      </div>\n      <div class=\"pane-progress\" id=\"p30PaneProg\">\n        <span class=\"pane-progress-lab\" id=\"p30PaneProgLab\">0 / 489 ops</span>\n        <div class=\"pane-progress-track\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"0\" id=\"p30PaneProgTrack\">\n          <div class=\"pane-progress-fill p30\" id=\"p30PaneBar\"></div>\n        </div>\n      </div>\n    </div>\n    <div class=\"pane-now\" id=\"p30Now\">\n      <div class=\"now-main\" id=\"p30NowMain\">Ready</div>\n      <div class=\"now-sub\" id=\"p30NowSub\">P30 will map each character to a prime-clock position.</div>\n      <div class=\"now-meta\" id=\"p30NowMeta\"></div>\n    </div>\n    <div class=\"process-flow p30-flow\" id=\"p30Flow\">\n      <span class=\"flow-chain\">Character \u2192 glyph \u2192 prime-clock position \u2192 verify</span>\n      <span class=\"flow-detail\" id=\"p30FlowDetail\">Each character maps to a glyph position, then P30 verifies that position on the prime clock.</span>\n    </div>\n    <div class=\"pane-body\"><div class=\"pane-mount\" id=\"p30Mount\"></div></div>\n  </div>\n  <div class=\"divider\" aria-hidden=\"true\"></div>\n  <div class=\"pane trad-pane\">\n    <div class=\"pane-head\">\n      <div class=\"pane-title-row\">\n        <div>\n          <div class=\"pane-title\">Traditional Encoding</div>\n          <div class=\"pane-sub\">64-bit bytes with ECC check bits</div>\n        </div>\n        <span class=\"pane-phase\" id=\"hamPhase\">Idle</span>\n      </div>\n      <div class=\"pane-pills\">\n        <span class=\"pill\">Byte: <b id=\"hamByte\">\u2014</b></span>\n        <span class=\"pill\">Word: <b id=\"hamWord\">\u2014</b></span>\n        <span class=\"pill\">Bytes: <b id=\"hamBytes\">0</b></span>\n        <span class=\"pill\">Check bits: <b id=\"hamChecks\">8</b></span>\n      </div>\n      <div class=\"pane-progress\" id=\"hamPaneProg\">\n        <span class=\"pane-progress-lab\" id=\"hamPaneProgLab\">0 / 12,264 ops</span>\n        <div class=\"pane-progress-track\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"0\" id=\"hamPaneProgTrack\">\n          <div class=\"pane-progress-fill trad\" id=\"hamPaneBar\"></div>\n        </div>\n      </div>\n    </div>\n    <div class=\"pane-now\" id=\"hamNow\">\n      <div class=\"now-main\" id=\"hamNowMain\">Ready</div>\n      <div class=\"now-sub\" id=\"hamNowSub\">Traditional encoding will store each character as bytes, then run ECC checks.</div>\n      <div class=\"now-meta\" id=\"hamNowMeta\"></div>\n    </div>\n    <div class=\"process-flow trad-flow\" id=\"tradFlow\">\n      <span class=\"flow-chain\">Character \u2192 byte \u2192 8 bits \u2192 ECC check bits</span>\n      <span class=\"flow-detail\" id=\"tradFlowDetail\">Each character becomes one byte, then every bit is visited by the ECC verification pass.</span>\n    </div>\n    <div class=\"pane-body\"><div class=\"pane-mount\" id=\"hamMount\"></div></div>\n  </div>\n</div>\n\n<div class=\"result-panel\" id=\"resultPanel\" aria-live=\"polite\">\n  <div class=\"result-panel-inner\">\n    <h3>Result</h3>\n    <section class=\"summary\" aria-label=\"Comparison at a glance\">\n      <span class=\"summary-title\">Comparison at a glance</span>\n      <div class=\"summary-cards\">\n        <div class=\"stat-card p30\">\n          <h3>P30 Prime <span class=\"tip\" tabindex=\"0\" data-tip=\"Characters mapped to positions on a 30-point prime clock.\">Encoding</span></h3>\n          <div class=\"stat-big\" id=\"cardP30Time\">0 ms</div>\n          <div class=\"stat-line\" id=\"cardP30Store\">0 symbolic positions</div>\n          <div class=\"stat-line stat-unit\">Symbolic units in this model</div>\n          <div class=\"stat-line\" id=\"cardP30Ops\">0 / 489 modeled ops</div>\n          <div class=\"stat-status\" id=\"cardP30Err\">\u2014</div>\n          <div class=\"card-progress\"><div class=\"card-progress-fill p30\" id=\"p30Bar\"></div></div>\n        </div>\n        <div class=\"stat-card trad\">\n          <h3>Traditional 64-bit + <span class=\"tip\" tabindex=\"0\" data-tip=\"Error-correcting check bits alongside each 64-bit word.\">ECC</span></h3>\n          <div class=\"stat-big\" id=\"cardTradTime\">0 ms</div>\n          <div class=\"stat-line\" id=\"cardTradStore\">163 bytes + 8 check bits</div>\n          <div class=\"stat-line stat-unit\">Bytes plus ECC per 64-bit word</div>\n          <div class=\"stat-line\" id=\"cardTradOps\">0 / 12,264 modeled ops</div>\n          <div class=\"stat-status\" id=\"cardTradErr\">\u2014</div>\n          <div class=\"card-progress\"><div class=\"card-progress-fill trad\" id=\"tradBar\"></div></div>\n        </div>\n        <div class=\"stat-card efficiency\">\n          <h3>Efficiency</h3>\n          <p class=\"eff-headline\" id=\"ratioHeadline\">Run the comparison to see the operation gap.</p>\n          <div class=\"eff-ops-pair\">\n            <p class=\"eff-ops-line\">P30: <span id=\"effP30Ops\">\u2014</span></p>\n            <p class=\"eff-ops-line\">Traditional: <span id=\"effTradOps\">\u2014</span></p>\n          </div>\n          <div class=\"eff-bars\" aria-hidden=\"false\">\n            <div class=\"eff-bar-row p30\">\n              <span class=\"eff-bar-lab\">P30</span>\n              <div class=\"eff-bar-track\"><div class=\"eff-bar-fill p30\" id=\"effP30Bar\"></div></div>\n            </div>\n            <div class=\"eff-bar-row trad\">\n              <span class=\"eff-bar-lab\">Traditional</span>\n              <div class=\"eff-bar-track\"><div class=\"eff-bar-fill trad\" id=\"effTradBar\"></div></div>\n            </div>\n          </div>\n          <div class=\"eff-math\" id=\"ratioMath\">\u2014</div>\n          <div class=\"eff-expl\">\n            <p>ECC verification revisits bit positions across byte groups.</p>\n            <p>P30 verifies symbolic positions in this model.</p>\n          </div>\n          <div class=\"stat-foot\" id=\"ratioFootnote\">Modeled operation count \u2014 not CPU speed.</div>\n        </div>\n      </div>\n    </section>\n    <div class=\"result-block\" id=\"resultP30\"></div>\n    <div class=\"result-block trad-block\" id=\"resultTrad\"></div>\n    <div class=\"result-takeaway\" id=\"resultTakeaway\"></div>\n    <p class=\"storage-note\"><b>Storage is not byte-equivalent.</b> P30 positions are symbolic units in this model. Traditional storage is measured in bytes plus ECC overhead. This demo compares encoding structure and modeled operation count, not direct memory footprint on current hardware.</p>\n    <p class=\"result-note\" id=\"resultNote\"></p>\n    <p class=\"replay-note\">Replay timers are slow-motion. This demo compares <b>modeled operation counts</b>, not wall-clock hardware speed.</p>\n  </div>\n</div>\n\n<div class=\"footer-status\" id=\"status\">Press <b>Run comparison</b> to encode the sentence on both sides in lockstep.</div>\n</section>\n</div>";

  function mountCompare(root, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var standalone = !!opts.standalone;

    root.innerHTML = TEMPLATE;
    var wgt = root.querySelector(".wgt-compare");
    wgt.classList.toggle("wgt-compare-compact", compact);
    wgt.classList.toggle("wgt-compare-standalone", standalone);
    wgt.classList.toggle("wgt-compare-embed", !standalone);

    function ge(id) { return root.querySelector("#" + id); }

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

var limits={p30Max:489, hamMax:12264, chars:163, words:21, p30Glyphs:167};

var state={
  p30:{ops:0,progress:0,finished:false,playing:false,ms:0,char:'',position:'',glyphs:0,opsMax:489,charIndex:-1,opPhase:''},
  ham:{ops:0,progress:0,finished:false,playing:false,word:1,ms:0,byteIdx:'',bytesUsed:0,opsMax:12264,charIndex:-1,bitIndex:'',stepPhase:''}
};



function fmt(n){ return n.toLocaleString(); }

function calcLimits(text){
  var chars=text.length;
  var words=Math.max(1, Math.ceil(chars/8));
  return {chars:chars,p30Max:chars*3,hamMax:words*584,words:words,p30Glyphs:chars+4,bytes:chars,checkBits:8};
}

function updateSentenceMeta(){
  var L=calcLimits(sentenceInput.value);
  limits=L;
  ge('sentenceMeta').innerHTML=
    '<b>'+L.chars+'</b> characters &middot; <b>'+fmt(L.p30Max)+'</b> P30 ops &middot; <b>'+L.p30Glyphs+'</b> positions &middot; <b>'+L.words+'</b> 64-bit words';
}

function pushSentence(){
  var text=sentenceInput.value.trim()||DEFAULT_SENTENCE;
  if(sentenceInput.value.trim()==='') sentenceInput.value=DEFAULT_SENTENCE;
  updateSentenceMeta();
  postBoth('setSentence',{text:text});
}

function dispChar(c){
  if(c==='\u2423'||c===' ') return '\u2423';
  return c;
}

function getP30HighlightIndex(){
  if(!runStarted) return -1;
  if(state.p30.finished) return limits.chars;
  if(state.p30.charIndex>=0) return state.p30.charIndex;
  return Math.max(state.p30.progress,0);
}

function getTradHighlightIndex(){
  if(!runStarted) return -1;
  if(state.ham.finished) return limits.chars;
  if(state.ham.charIndex>=0) return state.ham.charIndex;
  return -1;
}

function getTradReadWord(){
  if(!runStarted||state.ham.finished||state.ham.stepPhase!=='READ') return -1;
  var w=state.ham.word;
  if(typeof w!=='number'||w<1) return 0;
  return w-1;
}

function updateSentenceHighlight(){
  var text=sentenceInput.value;
  var live=ge('sentenceLive');
  var ta=sentenceInput;
  if(!runStarted){
    live.hidden=true;
    ta.classList.remove('hidden');
    return;
  }
  live.hidden=false;
  ta.classList.add('hidden');
  var p30Idx=getP30HighlightIndex();
  var tradIdx=getTradHighlightIndex();
  var tradWord=getTradReadWord();
  var html='';
  for(var i=0;i<text.length;i++){
    var cls='ch';
    if(state.p30.finished||i<p30Idx) cls+=' p30-done';
    if(i===p30Idx&&p30Idx<limits.chars&&!state.p30.finished) cls+=' p30-active';
    if(tradWord>=0){
      var ws=tradWord*8, we=Math.min(ws+8,text.length);
      if(i>=ws&&i<we) cls+=' trad-read';
      if(i===tradIdx&&tradIdx>=ws&&tradIdx<we) cls+=' trad-active';
    }else if(state.ham.finished||i<tradIdx) cls+=' trad-done';
    if(tradWord<0&&i===tradIdx&&tradIdx<limits.chars&&!state.ham.finished&&state.ham.stepPhase==='WRITE'){
      cls+=' trad-active';
    }
    var c=text[i];
    html+='<span class="'+cls+'">'+(c===' '?'\u00a0':esc(c))+'</span>';
  }
  live.innerHTML=html;
}

function renderPaneNow(side, main, sub, meta){
  ge(side+'NowMain').innerHTML=main;
  ge(side+'NowSub').innerHTML=sub||'';
  ge(side+'NowMeta').textContent=meta||'';
  ge(side+'NowSub').style.display=sub?'block':'none';
  ge(side+'NowMeta').style.display=meta?'block':'none';
  var wrap=ge(side+'Now');
  if(wrap) wrap.classList.toggle('is-p30-complete', side==='p30'&&state.p30.finished);
}

function buildP30PaneNow(p){
  var pMax=state.p30.opsMax||limits.p30Max;
  if(p.finished){
    return {main:'<span class="complete-mark" aria-hidden="true">✓</span> Encoding <b>complete</b>',
      sub:'All characters mapped to prime-clock positions.', meta:''};
  }
  if(p.ops===0){
    return {main:'<b>Ready</b>', sub:'P30 will map each character to a prime-clock position.', meta:''};
  }
  var ci=(p.charIndex>=0?p.charIndex:p.progress)+1;
  var ch=p.char?dispChar(p.char):'';
  var phase=p.opPhase||'Processing';
  var sub={
    Locate:'P30 finds the glyph position on the prime clock.',
    Emit:'P30 emits the symbolic position.',
    Verify:'P30 verifies the position is structurally valid.'
  }[phase]||'P30 maps each character to a symbolic prime-clock position.';
  return {
    main:phase+' — character <b>'+ci+'</b> / '+limits.chars+(ch?' (“'+esc(ch)+'”)':''),
    sub:sub,
    meta:'Operation '+fmt(p.ops)+' / '+fmt(pMax)+(p.position&&p.position!=='—'?' · position '+p.position:'')
  };
}

function buildHamPaneNow(h){
  var hMax=state.ham.opsMax||limits.hamMax;
  if(h.finished){
    return {main:'ECC check <b>complete</b>', sub:'Full verification round trip finished.', meta:''};
  }
  if(h.ops===0){
    return {main:'<b>Ready</b>', sub:'Traditional encoding will store each character as bytes, then run ECC checks.', meta:''};
  }
  if(h.stepPhase==='WRITE'&&h.charIndex>=0){
    var ci=h.charIndex+1;
    var ch=sentenceInput.value[h.charIndex]||'';
    return {
      main:'Encoding character <b>“'+esc(dispChar(ch))+'”</b> ('+ci+' / '+limits.chars+')',
      sub:'Byte '+h.byteIdx+', bit '+h.bitIndex+' is folded into the ECC check total (XOR + AND mask).',
      meta:'Every bit must be visited to verify the word · '+fmt(h.ops)+' / '+fmt(hMax)+' ops'
    };
  }
  if(h.stepPhase==='READ'){
    return {
      main:'Verification pass — recomputing check bits',
      sub:'Every bit in the 64-bit word must be visited again.',
      meta:'Word '+formatHamWord(h)+' · '+fmt(h.ops)+' / '+fmt(hMax)+' ops'
    };
  }
  return {
    main:'Processing word '+formatHamWord(h),
    sub:'Traditional encoding visits each bit to protect the word.',
    meta:fmt(h.ops)+' / '+fmt(hMax)+' modeled ops'
  };
}

function updatePauseBanner(){
  var banner=ge('pauseBanner');
  if(!paused||playing){
    banner.classList.remove('visible');
    return;
  }
  banner.classList.add('visible');
  ge('pauseOps').textContent=fmt(state.p30.ops)+' P30 · '+fmt(state.ham.ops)+' traditional';
  ge('pauseP30').textContent=fmt(state.p30.ops)+' / '+fmt(state.p30.opsMax||limits.p30Max);
  ge('pauseTrad').textContent=fmt(state.ham.ops)+' / '+fmt(state.ham.opsMax||limits.hamMax);
}

function updateProgressStrip(p,h,pMax,hMax){
  ge('stripP30').textContent=fmt(p.ops)+' / '+fmt(pMax);
  ge('stripTrad').textContent=fmt(h.ops)+' / '+fmt(hMax);
  var gapEl=ge('stripGap');
  var lead=ge('stripLead');
  var strip=ge('progressStrip');
  var bothDone=p.finished&&h.finished;
  wgt.classList.toggle('run-complete', bothDone);
  strip.classList.toggle('is-complete', bothDone);
  if(bothDone){
    if(pMax>0) gapEl.textContent=(hMax/pMax).toFixed(1)+'×';
    else gapEl.textContent='—';
    return;
  }
  if(paused){
    lead.innerHTML='Paused — press <b>Resume comparison</b> to continue';
  }else if(playing){
    lead.textContent='Running — P30 verifies symbolic positions, traditional recomputes ECC checks';
  }else if(p.ops>0||h.ops>0){
    lead.textContent='In progress';
    if(p.ops>0) gapEl.textContent=(h.ops/Math.max(p.ops,1)).toFixed(1)+'×';
    else gapEl.textContent='—';
  }else{
    lead.innerHTML='Press <b>Run comparison</b> to begin';
    gapEl.textContent='—';
    return;
  }
  if(p.ops>0) gapEl.textContent=(h.ops/Math.max(p.ops,1)).toFixed(1)+'×';
  else gapEl.textContent='—';
}

function charBits(ch){
  var code=(ch||' ').charCodeAt(0)&0xFF;
  return code.toString(2).padStart(8,'0');
}

function updateP30Flow(p){
  var el=ge('p30FlowDetail');
  if(!el) return;
  if(p.finished){
    el.textContent='Complete — every character mapped and verified on the prime clock.';
    return;
  }
  if(p.ops===0){
    el.textContent='Each character maps to a glyph position, then P30 verifies that position on the prime clock.';
    return;
  }
  if(p.opPhase&&p.charIndex>=0){
    var ch=sentenceInput.value[p.charIndex]||'';
    var ci=p.charIndex+1;
    el.innerHTML='<b>'+esc(p.opPhase)+'</b> — character <b>'+ci+'</b> / '+limits.chars+
      (ch?' (“'+esc(ch===' '?'\u2423':ch)+'”)':'')+
      (p.position&&p.position!=='—'?' → position <b>'+esc(p.position)+'</b>':'');
  }else{
    el.textContent='Each character maps to a glyph position, then P30 verifies that position on the prime clock.';
  }
}

function updateTradFlow(h){
  var el=ge('tradFlowDetail');
  if(!el) return;
  if(h.finished){
    el.innerHTML='Complete — all bytes verified with ECC checks.';
    return;
  }
  if(h.ops===0){
    el.textContent='Each character becomes one byte, then every bit is visited by the ECC verification pass.';
    return;
  }
  if(h.stepPhase==='WRITE'&&h.charIndex>=0){
    var ch=sentenceInput.value[h.charIndex]||' ';
    var bits=charBits(ch);
    el.innerHTML='<b>"'+esc(ch===' '?'\u2423':ch)+'"</b> → '+bits+' → folded into ECC check totals (byte '+h.byteIdx+', bit '+h.bitIndex+')';
  }else if(h.stepPhase==='READ'){
    el.textContent='Verification pass — every bit in the 64-bit word is revisited.';
  }else{
    el.textContent='Processing word '+formatHamWord(h)+' — bytes become bits, bits feed check-bit recomputation.';
  }
}
function setControlsState(){
  var p=state.p30, h=state.ham;
  var bothDone=p.finished&&h.finished;
  var btn=ge('runBtn');
  var stepBtn=ge('stepBtn');
  if(playing) btn.textContent='Pause';
  else if(paused&&runStarted) btn.textContent='Resume comparison';
  else if(bothDone) btn.textContent='Replay comparison';
  else btn.textContent='Run comparison';
  btn.classList.toggle('primary', !bothDone);
  stepBtn.disabled=bothDone;
  stepBtn.setAttribute('aria-hidden', bothDone?'true':'false');
}
function setRunButton(){ setControlsState(); }

function flashP30Complete(){
  ['p30Phase','p30Now','p30PaneProg'].forEach(function(id){
    var el=ge(id);
    if(!el) return;
    el.classList.remove('flash-once');
    void el.offsetWidth;
    el.classList.add('flash-once');
    function onEnd(e){
      if(e.animationName!=='complete-flash'&&e.animationName!=='check-flash') return;
      el.classList.remove('flash-once');
      el.removeEventListener('animationend', onEnd);
    }
    el.addEventListener('animationend', onEnd);
  });
}

function setPhaseLabel(elId, finished, playing, doneText, activeText){
  var el=ge(elId);
  var isTrad=elId==='hamPhase';
  if(finished){
    el.textContent=doneText;
    el.className='pane-phase '+(isTrad?'done-trad':'done-p30');
  }else if(playing){
    el.textContent=activeText;
    el.className='pane-phase '+(isTrad?'active-trad':'active-p30');
  }else{
    el.textContent='Idle';
    el.className='pane-phase idle';
  }
}

function formatHamWord(h){
  if(h.finished) return 'complete';
  var w=Math.min(h.word||1, limits.words);
  return w+' / '+limits.words;
}

function updatePaneProgress(side, ops, max, finished){
  var bar=ge(side+'PaneBar');
  var lab=ge(side+'PaneProgLab');
  var wrap=ge(side+'PaneProg');
  var track=ge(side+'PaneProgTrack');
  if(!bar||!lab||!wrap) return;
  var pct=max>0?Math.min(100, ops/max*100):0;
  bar.style.width=pct.toFixed(1)+'%';
  if(track) track.setAttribute('aria-valuenow', String(Math.round(pct)));
  wrap.classList.toggle('is-done', finished);
  wrap.classList.toggle('p30-done', finished&&side==='p30');
  if(finished) lab.textContent=(side==='p30'?'✓ Complete · ':'Complete · ')+fmt(ops)+' ops';
  else if(ops===0) lab.textContent='0 / '+fmt(max)+' ops';
  else lab.textContent=fmt(ops)+' / '+fmt(max)+' · '+Math.round(pct)+'%';
}

function updateSummary(){
  var p=state.p30, h=state.ham;
  var pMax=state.p30.opsMax||limits.p30Max;
  var hMax=state.ham.opsMax||limits.hamMax;
  var pPct=Math.min(100, pMax>0?p.ops/pMax*100:0);
  var hPct=Math.min(100, hMax>0?h.ops/hMax*100:0);

  ge('cardP30Time').textContent='Animation: '+fmt(Math.round(p.ms))+' ms';
  ge('cardTradTime').textContent='Animation: '+fmt(Math.round(h.ms))+' ms';
  ge('cardP30Store').textContent=fmt(p.finished?(p.glyphs||limits.chars):(p.glyphs||p.progress))+' symbolic positions';
  ge('cardTradStore').textContent=fmt(limits.bytes)+' bytes + '+limits.checkBits+' check bits per word';
  ge('cardP30Ops').textContent=fmt(p.ops)+' / '+fmt(pMax)+' modeled ops';
  ge('cardTradOps').textContent=fmt(h.ops)+' / '+fmt(hMax)+' modeled ops';
  ge('cardP30Err').textContent=p.finished?'✓ Prime-valid · 100%':(p.ops>0?'Encoding… · '+Math.round(pPct)+'%':'Waiting');
  ge('cardTradErr').textContent=h.finished?'ECC-valid · 100%':(h.ops>0?'Checking… · '+Math.round(hPct)+'%':'Waiting');
  root.querySelector('.stat-card.p30').classList.toggle('is-valid', p.finished);
  root.querySelector('.stat-card.trad').classList.toggle('is-valid', h.finished);

  ge('p30Bar').style.width=pPct.toFixed(1)+'%';
  ge('tradBar').style.width=hPct.toFixed(1)+'%';
  updatePaneProgress('p30', p.ops, pMax, p.finished);
  updatePaneProgress('ham', h.ops, hMax, h.finished);

  updateEfficiencyCard(p, h, pMax, hMax);

  setPhaseLabel('p30Phase', p.finished, p.playing, 'Encoding complete', 'Encoding');
  setPhaseLabel('hamPhase', h.finished, h.playing, 'ECC check complete', 'Checking');
  if(p.finished&&!p30CompleteSeen){
    p30CompleteSeen=true;
    flashP30Complete();
  }
  if(!p.finished) p30CompleteSeen=false;

  ge('p30Char').textContent=p.char||'—';
  ge('p30Pos').textContent=p.position||'—';
  ge('p30OpsShort').textContent=fmt(p.ops);
  ge('p30Glyphs').textContent=fmt(p.glyphs||p.progress);

  var byteLabel=h.byteIdx;
  if(typeof byteLabel==='number') byteLabel=String(byteLabel);
  else if(typeof byteLabel==='string'&&byteLabel.indexOf('Byte')===0) byteLabel=byteLabel.replace('Byte ','');
  ge('hamByte').textContent=h.finished?'—':(byteLabel||'—');
  ge('hamWord').textContent=formatHamWord(h);
  ge('hamBytes').textContent=fmt(h.finished?limits.bytes:(h.bytesUsed||0));
  ge('hamChecks').textContent=h.finished?'8 per word':'8';

  var p30Now=buildP30PaneNow(p);
  renderPaneNow('p30', p30Now.main, p30Now.sub, p30Now.meta);
  var hamNow=buildHamPaneNow(h);
  renderPaneNow('ham', hamNow.main, hamNow.sub, hamNow.meta);

  updateSentenceHighlight();
  updateProgressStrip(p,h,pMax,hMax);
  updateP30Flow(p);
  updateTradFlow(h);
  updatePauseBanner();
  updateResult();
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function updateEfficiencyCard(p, h, pMax, hMax){
  var head=ge('ratioHeadline');
  var p30OpsEl=ge('effP30Ops');
  var tradOpsEl=ge('effTradOps');
  var mathEl=ge('ratioMath');
  var p30Bar=ge('effP30Bar');
  var tradBar=ge('effTradBar');
  if(!head||!p30OpsEl||!tradOpsEl||!mathEl) return;

  var bothDone=p.finished&&h.finished;
  var pShow, hShow, pMath, hMath;

  if(bothDone){
    pShow=pMax; hShow=hMax; pMath=pMax; hMath=hMax;
    head.innerHTML='Traditional performs <span class="num-gap">'+(hMax/Math.max(pMax,1)).toFixed(1)+'×</span> more modeled operations';
  }else if(p.ops>0||h.ops>0){
    pShow=p.ops; hShow=h.ops; pMath=Math.max(p.ops,1); hMath=h.ops;
    head.innerHTML='Traditional performing <span class="num-gap">'+(h.ops/Math.max(p.ops,1)).toFixed(1)+'×</span> more operations <span class="eff-sofar">(so far)</span>';
  }else if(runStarted){
    pShow=0; hShow=0; pMath=0; hMath=0;
    head.textContent='Encoding the same sentence on both sides…';
  }else{
    pShow=pMax; hShow=hMax; pMath=pMax; hMath=hMax;
    head.innerHTML='Up to <span class="num-gap">'+(hMax/Math.max(pMax,1)).toFixed(1)+'×</span> more modeled operations';
  }

  p30OpsEl.innerHTML=pShow>0||!runStarted||bothDone?'<span class="num-p30">'+fmt(pShow)+' ops</span>':'—';
  tradOpsEl.innerHTML=hShow>0||!runStarted||bothDone?'<span class="num-trad">'+fmt(hShow)+' ops</span>':'—';

  var barMax=Math.max(pShow,hShow,1);
  if(p30Bar) p30Bar.style.width=(pShow/barMax*100).toFixed(1)+'%';
  if(tradBar) tradBar.style.width=(hShow/barMax*100).toFixed(1)+'%';

  if(bothDone){
    mathEl.innerHTML='<span class="num-trad">'+fmt(hMax)+'</span> ÷ <span class="num-p30">'+fmt(pMax)+'</span> = <span class="num-gap">'+(hMax/Math.max(pMax,1)).toFixed(1)+'×</span>';
  }else if(p.ops>0||h.ops>0){
    mathEl.innerHTML='<span class="num-trad">'+fmt(hMath)+'</span> ÷ <span class="num-p30">'+fmt(pMath)+'</span> = <span class="num-gap">'+(hMath/Math.max(pMath,1)).toFixed(1)+'×</span> <span class="eff-sofar">(so far)</span>';
  }else if(!runStarted){
    mathEl.innerHTML='<span class="num-trad">'+fmt(hMax)+'</span> ÷ <span class="num-p30">'+fmt(pMax)+'</span> = <span class="num-gap">'+(hMax/Math.max(pMax,1)).toFixed(1)+'×</span>';
  }else{
    mathEl.textContent='—';
  }
}

function updateResult(){
  var p=state.p30, h=state.ham;
  if(!p.finished||!h.finished) return;
  var pMax=state.p30.opsMax||limits.p30Max;
  var hMax=state.ham.opsMax||limits.hamMax;
  var ratio=(hMax/pMax).toFixed(1);

  ge('resultP30').innerHTML=
    '<b>P30</b> completed in <span class="num-p30">'+fmt(pMax)+' ops</span>.';
  ge('resultTrad').innerHTML=
    '<b>Traditional</b> completed in <span class="num-trad">'+fmt(hMax)+' ops</span>.';
  ge('resultTakeaway').innerHTML=
    'Traditional used <span class="num-gap">'+ratio+'×</span> more operations in this simulation. '+
    'P30: <span class="num-p30">'+fmt(pMax)+' ops</span> · Traditional: <span class="num-trad">'+fmt(hMax)+' ops</span>.';
  ge('resultNote').textContent=
    'Storage units are not byte-equivalent; this compares modeled encoding and verification behavior.';
}

function updateStatus(){
  var p=state.p30, h=state.ham;
  var st=ge('status');
  if(p.finished&&h.finished){
    st.innerHTML='Both finished — scroll to the <b>Result</b> below, <b>Replay comparison</b> to run again, or <b>Reset</b>.';
  }else if(p.finished&&!h.finished){
    st.innerHTML='P30 is <b>done</b> ('+fmt(p.ops)+' ops). Traditional is still checking ('+Math.round(h.ops/(state.ham.opsMax||limits.hamMax)*100)+'%).';
  }else if(playing){
    st.innerHTML='Lockstep replay — both sides advance one operation per tick.';
  }else if(paused){
    st.innerHTML='Paused — press <b>Resume comparison</b> to continue, or <b>Reset</b> to start over.';
  }else{
    st.innerHTML='Press <b>Run comparison</b> to start. Use <b>Next step</b> to advance one operation at a time.';
  }
  setRunButton();
  updateSummary();
}

function postFrame(side,cmd,extra){
  var api=side==='p30'?p30Api:hamApi;
  if(!api) return;
  if(cmd==='step') api.step();
  else if(cmd==='pause') api.pause();
  else if(cmd==='reset') api.reset();
  else if(cmd==='setSpeed'&&extra) api.setSpeed(extra.delay);
  else if(cmd==='setSentence'&&extra) api.setSentence(extra.text);
}
function postBoth(cmd,extra){ postFrame('p30',cmd,extra); postFrame('ham',cmd,extra); }

function applySpeed(delay){
  opDelay=delay;
  root.querySelectorAll('.speed-btn').forEach(function(b){
    b.classList.toggle('active', parseInt(b.dataset.delay,10)===delay);
  });
  postBoth('setSpeed',{delay:delay});
}

function stopLockstep(completed){
  playing=false;
  if(tickTimer){ clearTimeout(tickTimer); tickTimer=null; }
  postBoth('pause');
  if(completed){
    paused=false;
    runStarted=false;
  }else if(runStarted&&(state.p30.ops>0||state.ham.ops>0)&&!(state.p30.finished&&state.ham.finished)){
    paused=true;
  }else{
    paused=false;
    if(state.p30.ops===0&&state.ham.ops===0) runStarted=false;
  }
  setRunButton();
}

function lockstepTick(){
  if(!playing) return;
  if(state.p30.finished&&state.ham.finished){
    stopLockstep(true);
    updateStatus();
    return;
  }
  if(!state.p30.finished) postFrame('p30','step');
  if(!state.ham.finished) postFrame('ham','step');
  tickTimer=setTimeout(lockstepTick, opDelay);
}

function resetState(){
  stopLockstep(true);
  p30CompleteSeen=false;
  state.p30={ops:0,progress:0,finished:false,playing:false,ms:0,char:'',position:'',glyphs:0,opsMax:limits.p30Max,charIndex:-1,opPhase:''};
  state.ham={ops:0,progress:0,finished:false,playing:false,word:1,ms:0,byteIdx:'',bytesUsed:0,opsMax:limits.hamMax,charIndex:-1,bitIndex:'',stepPhase:''};
  pushSentence();
  postBoth('reset');
  updateStatus();
}

function runComparison(){
  if(playing){
    stopLockstep(false);
    updateStatus();
    return;
  }
  if(paused&&runStarted){
    playing=true;
    paused=false;
    setRunButton();
    lockstepTick();
    updateStatus();
    return;
  }
  pushSentence();
  stopLockstep(true);
  p30CompleteSeen=false;
  state.p30={ops:0,progress:0,finished:false,playing:false,ms:0,char:'',position:'',glyphs:0,opsMax:limits.p30Max,charIndex:-1,opPhase:''};
  state.ham={ops:0,progress:0,finished:false,playing:false,word:1,ms:0,byteIdx:'',bytesUsed:0,opsMax:limits.hamMax,charIndex:-1,bitIndex:'',stepPhase:''};
  postBoth('reset');
  playing=true;
  paused=false;
  runStarted=true;
  setRunButton();
  lockstepTick();
  updateStatus();
}

function stepOnce(){
  if(state.p30.finished&&state.ham.finished) return;
  if(playing) stopLockstep(false);
  paused=false;
  pushSentence();
  if(state.p30.ops===0&&state.ham.ops===0){
    postBoth('reset');
  }
  runStarted=true;
  if(!state.p30.finished) postFrame('p30','step');
  if(!state.ham.finished) postFrame('ham','step');
  updateStatus();
}

function reset(){ resetState(); }

ge('runBtn').addEventListener('click',runComparison);
ge('stepBtn').addEventListener('click',stepOnce);
ge('resetBtn').addEventListener('click',reset);
sentenceInput.addEventListener('input',function(){
  updateSentenceMeta();
  if(!runStarted) updateSentenceHighlight();
});
root.querySelectorAll('.speed-btn').forEach(function(btn){
  btn.addEventListener('click',function(){ applySpeed(parseInt(this.dataset.delay,10)); });
});

updateSentenceMeta();
updateStatus();

    function onChildState(d) {
      if (!d || d.type !== "state") return;
      if (d.source === "p30") {
        Object.assign(state.p30, {
          ops: d.ops, progress: d.progress, finished: d.finished, playing: d.playing,
          ms: d.ms || 0, char: d.char || "", position: d.position || "",
          glyphs: d.glyphs != null ? d.glyphs : d.progress,
          charIndex: d.charIndex != null ? d.charIndex : -1,
          opPhase: d.opPhase || "",
        });
        if (d.opsMax) state.p30.opsMax = d.opsMax;
      } else if (d.source === "hamming") {
        Object.assign(state.ham, {
          ops: d.ops, progress: d.progress, finished: d.finished, playing: d.playing,
          word: d.word || 1, ms: d.ms || 0, byteIdx: d.byteIdx != null ? d.byteIdx : "",
          bytesUsed: d.bytesUsed != null ? d.bytesUsed : 0,
          charIndex: d.charIndex != null ? d.charIndex : -1,
          bitIndex: d.bitIndex != null ? d.bitIndex : "",
          stepPhase: d.stepPhase || "",
        });
        if (d.opsMax) state.ham.opsMax = d.opsMax;
      }
      if (state.p30.finished && state.ham.finished && playing) stopLockstep(true);
      updateStatus();
    }

    var mountReady = { p30: false, ham: false };
    p30Api = global.P30Widgets.encoder.mount(ge("p30Mount"), {
      delay: opDelay,
      embed: true,
      onState: onChildState,
      onReady: function () {
        mountReady.p30 = true;
        if (mountReady.p30 && mountReady.ham) { applySpeed(opDelay); pushSentence(); }
      },
    });

    hamApi = global.P30Widgets.hamming.mount(ge("hamMount"), {
      delay: opDelay,
      embed: true,
      onState: onChildState,
      onReady: function () {
        mountReady.ham = true;
        if (mountReady.p30 && mountReady.ham) { applySpeed(opDelay); pushSentence(); }
      },
    });

    ge("runBtn").addEventListener("click", runComparison);
    ge("stepBtn").addEventListener("click", stepOnce);
    ge("resetBtn").addEventListener("click", reset);
    sentenceInput.addEventListener("input", function () {
      updateSentenceMeta();
      if (!runStarted) updateSentenceHighlight();
    });
    root.querySelectorAll(".speed-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { applySpeed(parseInt(btn.dataset.delay, 10)); });
    });

    updateSentenceMeta();
    updateStatus();

    return {
      destroy: function () {
        stopLockstep(true);
        if (p30Api) p30Api.destroy();
        if (hamApi) hamApi.destroy();
        root.innerHTML = "";
      },
    };
  }

  global.P30Widgets = global.P30Widgets || {};
  global.P30Widgets.compare = { mount: mountCompare };
})(window);
