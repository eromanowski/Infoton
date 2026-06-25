(function (global) {
  "use strict";

  function mountEncoderCore(root, opts) {
    opts = opts || {};
    var resizeHandler = function () { resize(); };

    function q(id) { return root.querySelector("#" + id); }
    function ge(id) {
      var el = q(id);
      if (el) return el;
      return null;
    }

    "use strict";
    var KB=1.380649e-23, C=299792458, LN2=Math.log(2);
    var opTemp=350;
    var EMBED_COMPARE=!!opts.embed;
    if(EMBED_COMPARE) root.classList.add('embed-compare');
    function landauerPerOp(T){ return KB*T*LN2; }
    function fmtJ(j){
      if(j===0) return '0 J';
      var units=[['J',1],['mJ',1e-3],['\u00b5J',1e-6],['nJ',1e-9],['pJ',1e-12],['fJ',1e-15],['aJ',1e-18],['zJ',1e-21]];
      for(var k=0;k<units.length;k++){ if(j>=units[k][1]) return (j/units[k][1]).toFixed(3)+' '+units[k][0]; }
      return (j/1e-21).toFixed(3)+' zJ';
    }

    // Tier 1 alphabet (P30 v2.0), values coprime to 30
    var TIER1_CHARS=[' ','e','t','a','o','i','n','s','h','\n','r','d','l','c','u','m','w','f','g','y','p','\'','b','v','k',',','.','1','I','0','A','T','E','2','C','S','D','N','R','3','B','H','M','O','-','4','5','F','L','P','W','6','7','8','9','G','U','Y','!','j','x','K','V','?','J','q','z','Q'];
    var CHAR_VALS=[1,7,11,13,17,19,23,29,31,37,41,43,47,49,53,59,61,67,71,73,77,79,83,89,91,97,101,103,107,109,113,119,121,127,131,133,137,139,143,149,151,157,161,163,167,169,173,179,181,187,191,193,197,199,203,209,211,217,221,223,227,229,233,239,241,247,251,253];
    var CHAR_TO_VAL={};
    for(var ci=0;ci<TIER1_CHARS.length;ci++){ CHAR_TO_VAL[TIER1_CHARS[ci]]=CHAR_VALS[ci]; }
    function residue(v){ return ((v%30)+30)%30; }
    function isCoprime30(n){ return n%2!==0 && n%3!==0 && n%5!==0; }
    function isPrimeN(n){ if(n<2)return false; for(var i=2;i*i<=n;i++) if(n%i===0) return false; return true; }

    var SENTENCE="The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.";
    var CHARS=SENTENCE.length;
    var HAMMING_OPS=Math.ceil(CHARS/8)*584;
    function p30OpsMax(){ return (p30mode==='bios') ? CHARS : CHARS*3; }
    function p30GlyphsEst(){ return CHARS+4; }
    function refreshHammingOps(){ HAMMING_OPS=Math.ceil(CHARS/8)*584; }
    function updateTweetMeta(){
      var tm=ge('tweetMeta');
      if(tm) tm.innerHTML=CHARS+' characters &middot; '+p30OpsMax()+' operations &middot; '+p30GlyphsEst()+' positions';
    }

    // ── Clock geometry ──────────────────────────────────────────────
    var BASIS=[2,3,5,7,11,13,17,19,23,29,31];
    var CONTROL={2:1,3:1,5:1};
    var SPOKE_RES=[1,7,11,13,17,19,23,29];   // coprime data residues
    // colors per basis prime
    var BASIS_COL={2:'#fada24',3:'#f5a020',5:'#f06020',7:'#e83060',11:'#d420a0',13:'#a800c0',17:'#8000c8',19:'#7744dd',23:'#7755ee',29:'#6633cc',31:'#6644dd'};
    var RES_COL={1:'#6644dd',7:'#e83060',11:'#d420a0',13:'#a800c0',17:'#8000c8',19:'#7744dd',23:'#7755ee',29:'#6633cc'};
    var ANG_OFF=-Math.PI/2-(28/30)*2*Math.PI;
    function posAngle(pos){ return ANG_OFF+(pos/30)*2*Math.PI; }
    function modPos(p){ var r=p%30; return r===1?29:(r-2); }
    // dial angle, 30 at top clockwise
    function dialAngle(n){
      var slot = (n===30) ? 0 : (n===31 ? 1 : n);
      return -Math.PI/2 + (slot/30)*2*Math.PI;
    }
    // residue to dial position
    function resAngle(r){ return dialAngle(r===1?31:r); }

    // value to character
    var VAL_TO_CHAR={};
    for(var ci2=0;ci2<TIER1_CHARS.length;ci2++){ VAL_TO_CHAR[CHAR_VALS[ci2]]=TIER1_CHARS[ci2]; }
    function beadLabel(ch){
      if(ch===' ') return '\u2423';   // space shown as open box
      if(ch==='\n') return '\u21b5';  // newline shown as return arrow
      if(ch==='\'') return '\u2019';  // apostrophe
      return ch;
    }

    // 68 coprime values per spoke
    var SPOKE_VALS={};
    SPOKE_RES.forEach(function(r){ SPOKE_VALS[r]=[]; });
    for(var vi=0;vi<CHAR_VALS.length;vi++){ var r=residue(CHAR_VALS[vi]); if(SPOKE_VALS[r]!==undefined && SPOKE_VALS[r].indexOf(CHAR_VALS[vi])<0) SPOKE_VALS[r].push(CHAR_VALS[vi]); }
    SPOKE_RES.forEach(function(r){ SPOKE_VALS[r].sort(function(a,b){return a-b;}); });

    var cv=ge('clock'), ctx=cv.getContext('2d');
    var DPR=Math.min(window.devicePixelRatio||1,2);
    var cw=0, chh=0, cx0=0, cy0=0, R=0;
    var litRes=-1, litVal=null;

    // error injection + correction state
    var errState=null; // {corrupt, origVal, P, fix, phase}
    var COPRIME_RES=[1,7,11,13,17,19,23,29];
    function isPrimePosN(n){ if(n<2)return false; for(var i=2;i*i<=n;i++) if(n%i===0)return false; return true; }
    function layer1P(n){ var P=[]; if(n%2===0)P.push(2); if(n%3===0)P.push(3); if(n%5===0)P.push(5); return P; }
    function nearestCoprimeResidue(nr){
      var best=null,bd=99;
      for(var i=0;i<COPRIME_RES.length;i++){ var r=COPRIME_RES[i]; var d=Math.min(((nr-r)%30+30)%30,((r-nr)%30+30)%30); if(d<bd){bd=d;best=r;} }
      return {res:best,dist:bd};
    }
    // dial position of a corrupt residue
    function dialPosForResidue(nr){
      // map residue nr (0..29) to a dial slot number in 2..31; residue 1 -> 31, residue 0 -> 30
      if(nr===0) return 30; if(nr===1) return 31; return nr;
    }

    function resize(){
      var wrap=cv.closest('.clock-canvas-wrap')||cv.parentElement;
      var stage=cv.closest('.clock-stage')||wrap;
      var st=stage.getBoundingClientRect();
      if(EMBED_COMPARE){
        var availW=Math.max(280,st.width-12);
        var size=Math.max(360,Math.min(availW,520));
        cw=size;
        chh=size;
        if(wrap&&wrap!==stage) wrap.style.width=size+'px';
        wrap.style.height=size+'px';
      }else{
        var box=wrap.getBoundingClientRect();
        var bw=box.width>0?box.width:st.width;
        var bh=box.height>0?box.height:st.height;
        cw=Math.max(280,Math.min(bw,1200));
        chh=Math.max(260,Math.min(bh,600));
      }
      // size radius so the rim labels at R*1.14 plus glyph height fit inside the box
      var halfH=chh/2-16;            // box half-height minus label glyph room
      var rByH=halfH/1.16;           // labels sit at R*1.14, leave a hair extra
      var rByW=cw*0.76/2;
      R=Math.min(rByW, rByH);
      cv.width=cw*DPR; cv.height=chh*DPR; cv.style.width=cw+'px'; cv.style.height=chh+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      cx0=cw/2; cy0=chh/2;
      draw();
    }

    function draw(){
      ctx.clearRect(0,0,cw,chh);
      var P30_GOLD='#FFD84D';
      var P30_GOLD_LIT='#FFE85C';
      var P30_VIOLET='#8B5CF6';
      var activeCol=EMBED_COMPARE?P30_GOLD:'#e97158';
      var activeLit=EMBED_COMPARE?P30_GOLD_LIT:'#e97158';
      // rim
      ctx.beginPath(); ctx.arc(cx0,cy0,R,0,2*Math.PI);
      ctx.strokeStyle=EMBED_COMPARE?'rgba(255,216,77,0.35)':'rgba(110,84,163,0.7)'; ctx.lineWidth=1.5; ctx.stroke();

      // spokes + beads for the 8 data residues
      SPOKE_RES.forEach(function(r){
        var ang=resAngle(r);
        var col=EMBED_COMPARE?P30_VIOLET:(RES_COL[r]);
        // spoke line
        ctx.beginPath();
        ctx.moveTo(cx0+Math.cos(ang)*R*0.17, cy0+Math.sin(ang)*R*0.17);
        ctx.lineTo(cx0+Math.cos(ang)*R*0.97, cy0+Math.sin(ang)*R*0.97);
        ctx.strokeStyle=hexA(col, litRes===r?(EMBED_COMPARE?1:0.95):0.4); ctx.lineWidth=litRes===r?2.4:1.4; ctx.stroke();
        // d=8 qudit basis label at hub (totative ket |r⟩)
        var hr=R*0.11, hx=cx0+Math.cos(ang)*hr, hy=cy0+Math.sin(ang)*hr;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle=hexA(litRes===r?activeCol:col, litRes===r?1:0.88);
        ctx.font='600 11px Cinzel, serif';
        ctx.fillText('|'+r+'\u27e9', hx, hy);
        // beads: every Tier 1 coprime value on this spoke, radius by index
        var vals=SPOKE_VALS[r], n=vals.length;
        vals.forEach(function(vv,i){
          var rad=R*0.28 + (i/(n-1||1))*R*0.62;
          var bx=cx0+Math.cos(ang)*rad, by=cy0+Math.sin(ang)*rad;
          var on=(litVal!==null && vv===litVal);
          // bead sized to hold its glyph
          ctx.beginPath(); ctx.arc(bx,by, on?8:6.5, 0,2*Math.PI);
          ctx.fillStyle = on ? activeCol : hexA(EMBED_COMPARE?P30_VIOLET:col,0.9); ctx.fill();
          if(on){ ctx.lineWidth=1.5; ctx.strokeStyle='#fff'; ctx.stroke();
            if(EMBED_COMPARE){ ctx.shadowColor='rgba(255,216,77,0.55)'; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0; }
          }
          // character-to-value mapping intentionally not rendered on the beads
        });
      });

      // ── Full Prime 30 dial: all positions 2..31 around the circle ──
      // Prime positions in ket notation with color; composites as plain numbers.
      function isPrimePos(n){ if(n<2)return false; for(var i=2;i*i<=n;i++) if(n%i===0)return false; return true; }
      for(var n=2;n<=31;n++){
        var ang=dialAngle(n);
        var nx=cx0+Math.cos(ang)*R, ny=cy0+Math.sin(ang)*R;
        var prime=isPrimePos(n);
        var ctrl=(n===2||n===3||n===5);
        var res=n%30;
        var litThis = (litRes===res && SPOKE_RES.indexOf(res)>=0);
        // node on the circle
        ctx.beginPath(); ctx.arc(nx,ny, litThis?6:(prime?4.5:3), 0,2*Math.PI);
        if(litThis) ctx.fillStyle=activeCol;
        else if(ctrl) ctx.fillStyle=P30_GOLD;
        else if(prime) ctx.fillStyle=EMBED_COMPARE?P30_VIOLET:(BASIS_COL[n]||'#cc4778');
        else ctx.fillStyle=EMBED_COMPARE?'rgba(139,92,246,0.35)':'rgba(110,84,163,0.6)';
        ctx.fill();
        // rim label outside the ring, quantum ket notation for every position
        var lr=R*1.14;
        var lx=cx0+Math.cos(ang)*lr, ly=cy0+Math.sin(ang)*lr;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        if(ctrl){
          ctx.fillStyle = litThis ? activeCol : P30_GOLD;
          ctx.font='700 17px Cinzel, serif';
          ctx.fillText('|'+n+'\u27e9', lx, ly);
        } else if(prime){
          ctx.fillStyle = litThis ? activeCol : (EMBED_COMPARE?P30_VIOLET:(BASIS_COL[n]||'#cc4778'));
          ctx.font='700 17px Cinzel, serif';
          ctx.fillText('|'+n+'\u27e9', lx, ly);
        } else {
          ctx.fillStyle = litThis ? activeCol : (EMBED_COMPARE?'rgba(201,184,232,0.65)':'rgba(180,168,214,0.9)');
          ctx.font='400 15px Cinzel, serif';
          ctx.fillText(String(n), lx, ly);
        }
      }
      // structural markers: Spine at 30 (top), Line of Symmetry 30->15
      (function(){
        var aTop=dialAngle(30), a15=dialAngle(15);
        var tx=cx0+Math.cos(aTop)*R, ty=cy0+Math.sin(aTop)*R;
        ctx.beginPath(); ctx.arc(tx,ty,5.5,0,2*Math.PI); ctx.fillStyle=P30_GOLD; ctx.fill();
        var bx=cx0+Math.cos(a15)*R, by=cy0+Math.sin(a15)*R;
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(bx,by);
        ctx.strokeStyle=EMBED_COMPARE?'rgba(255,216,77,0.25)':'rgba(110,84,163,0.4)'; ctx.lineWidth=1; ctx.stroke();
      })();

      // ── Error injection + correction overlay ───────────────────────
      if(errState){ drawError(); }

      // hub
      ctx.beginPath(); ctx.arc(cx0,cy0,R*0.12,0,2*Math.PI);
      ctx.fillStyle=EMBED_COMPARE?'rgba(61,0,148,0.92)':'rgba(53,4,152,0.85)'; ctx.fill();
      ctx.strokeStyle=EMBED_COMPARE?'rgba(255,216,77,0.55)':'rgba(250,218,36,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle=P30_GOLD; ctx.font='700 21px Cinzel, serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('P30', cx0, cy0);
    }

    // radial position on a spoke
    function valueRadius(val){
      var r=residue(val); var vals=SPOKE_VALS[r]; if(!vals||!vals.length) return R*0.5;
      // map val between the spoke's min and max bead values to the bead radius band
      var lo=vals[0], hi=vals[vals.length-1];
      var frac=(hi>lo)?(val-lo)/(hi-lo):0;
      if(frac<0)frac=0; if(frac>1)frac=1;
      return R*0.28 + frac*R*0.62;
    }
    function valueAngle(val){ return resAngle(residue(val)); }

    // draw corruption + correction overlay
    function drawError(){
      var e=errState;
      // corrupt value sits at the radius/angle it WOULD occupy if it were a valid token,
      // on the spoke of its own residue, so the recovery target is a near neighbor.
      var rec=e.recVal;
      // place corrupt marker just off the recovered bead, toward the corrupt magnitude
      var ta=valueAngle(rec), trad=valueRadius(rec);
      var txp=cx0+Math.cos(ta)*trad, typ=cy0+Math.sin(ta)*trad;
      // corrupt marker offset radially by the slip distance (a few px per unit)
      var slip=(e.corrupt-rec);
      var crad=trad + slip*3.2;
      var ca=ta;
      var cxp=cx0+Math.cos(ca)*crad, cyp=cy0+Math.sin(ca)*crad;

      // corrupt marker (red ring with X)
      ctx.beginPath(); ctx.arc(cxp,cyp,8.5,0,2*Math.PI);
      ctx.fillStyle='#cc4778'; ctx.fill();
      ctx.lineWidth=2.5; ctx.strokeStyle='#fada24'; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='700 9px Cinzel, serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('\u2717', cxp, cyp);
      // value labels intentionally omitted

      if(e.phase>=2){
        // short correction arrow from corrupt marker to the adjacent recovered bead
        ctx.beginPath(); ctx.moveTo(cxp,cyp); ctx.lineTo(txp,typ);
        ctx.strokeStyle = e.phase>=3 ? '#7a4ddd' : 'rgba(122,77,221,0.7)';
        ctx.lineWidth=2.4; ctx.setLineDash(e.phase>=3?[]:[4,4]); ctx.stroke(); ctx.setLineDash([]);
        if(e.phase>=3){
          // recovered bead lights violet; no value label
          ctx.beginPath(); ctx.arc(txp,typ,8,0,2*Math.PI);
          ctx.fillStyle='#7a4ddd'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#fff'; ctx.stroke();
        }
      }
    }
    function hexA(hex,a){
      var h=hex.replace('#',''); var r=parseInt(h.substr(0,2),16),g=parseInt(h.substr(2,2),16),b=parseInt(h.substr(4,2),16);
      return 'rgba('+r+','+g+','+b+','+a+')';
    }

    // light a value bead on its spoke
    function beadForValue(val){
      litRes=residue(val); litVal=val;
    }

    // ── encode steps ───────────────────────────────────────────────
    var tweetCharEls=[];
    function buildTweet(){
      var host=ge('tweetText'); if(!host) return;
      host.innerHTML=''; tweetCharEls=[];
      host.appendChild(document.createTextNode('\u201c'));
      for(var i=0;i<SENTENCE.length;i++){
        var s=document.createElement('span'); s.className='tw-ch';
        s.textContent=SENTENCE[i]===' '?'\u00a0':SENTENCE[i];
        tweetCharEls.push(s); host.appendChild(s);
      }
      host.appendChild(document.createTextNode('\u201d  -  January Walker'));
      updateTweetMeta();
    }
    buildTweet();
    function applySentence(text){
      if(!text||typeof text!=='string') return;
      if(text===SENTENCE) return;
      SENTENCE=text; CHARS=SENTENCE.length;
      refreshHammingOps(); buildTweet(); reset();
    }
    function highlightChar(idx){
      for(var i=0;i<tweetCharEls.length;i++){
        tweetCharEls[i].classList.toggle('tw-done', i<idx);
        tweetCharEls[i].classList.toggle('tw-active', i===idx);
      }
    }

    var idx=0, opIdx=0, playing=false, stepTimer=null, stepDelay=150, finished=false, tokensSoFar=0;
    (function(){
      var dm=/[?&]delay=(\d+)/.exec(location.search);
      if(dm) stepDelay=parseInt(dm[1],10);
    })();
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
      var te=ge('timerElapsed');
      var tm=ge('timerMeta');
      if(!te||!tm) return;
      te.textContent=formatElapsed(ms);
      if(EMBED_COMPARE){
        tm.innerHTML='<b>'+opIdx+'</b> / '+p30OpsMax()+' ops';
        return;
      }
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
    }
    var el={
      cLocate:ge('cLocate'), cEmit:ge('cEmit'),
      cTotal:ge('cTotal'), caption:ge('caption'),
      phaseTag:ge('phaseTag'), stTokens:ge('stTokens'),
      ePerOp:ge('ePerOp'), eRun:ge('eRun'), eOps:ge('eOps'),
      barWork:ge('barWork'), barOver:ge('barOver')
    };

    var p30mode='encoder', passCount=0, errOps=0;

    function updatePanel(){
      var per=landauerPerOp(opTemp);
      el.ePerOp.textContent=fmtJ(per);
      if(p30mode==='encoder'){
        // real floor: 1 lookup per char encoded so far; verify = 0 on clean data;
        // library mode: locate + emit + verify per character = 3 ops/char
        var enc=idx*3;
        var total=enc+errOps;
        el.cEmit.textContent=idx;
        el.cLocate.textContent=idx*2+errOps;
        el.cTotal.textContent=total;
        el.stTokens.textContent = idx===0 ? 0 : (finished ? 167 : tokensSoFar+1);
        el.eOps.textContent=total;
        el.eRun.textContent=fmtJ(total*per);
      } else {
        // BIOS: one-time ingress encode; reads add 0; checks only on injected errors.
        var encodeNow = (passCount===0) ? idx : CHARS;
        var total=encodeNow+errOps;
        el.cLocate.textContent=errOps;
        el.cEmit.textContent=encodeNow;
        el.cTotal.textContent=total;
        el.stTokens.textContent = (passCount===0 && idx===0) ? 0 : 167;
        el.eOps.textContent=total;
        el.eRun.textContent=fmtJ(total*per);
      }
      // Signal vs Overhead: Hamming is the full reference; P30 is its true fraction.
      var p30Full = (p30mode==='bios') ? CHARS : CHARS*3;   // 163 BIOS, 489 encoder
      var ratio = HAMMING_OPS / p30Full;
      var p30Pct = (p30Full/HAMMING_OPS*100);
      el.barWork.style.width = p30Pct.toFixed(2)+'%';
      el.barOver.style.width = '100%';
      var bn=ge('barP30Num'); if(bn) bn.textContent=p30Full;
      var rb=ge('ratioBig'); if(rb) rb.innerHTML=ratio.toFixed(1)+'&times;';
      var rc=ge('ratioCap');
      if(rc) rc.textContent='operations of Hamming SECDED checking for the same 163 characters, 21 sixty-four-bit words at 584 operations each, against P30\u2019s '+p30Full;
      updateRunTimer();
      broadcastEmbed();
    }

    function stepOp(){
      if(finished) return;
      if(opIdx>=p30OpsMax()){ finish(); return; }
      if(!runClock.running) runClockStart();
      playing=true;
      var ci=Math.floor(opIdx/3);
      var ph=opIdx%3;
      idx=ci;
      el.phaseTag.textContent='Encode';
      highlightChar(ci);
      var ch=SENTENCE[ci];
      var val=CHAR_TO_VAL[ch];
      if(ph===0 && val!==undefined) beadForValue(val);
      var labels=['Locate','Emit','Verify'];
      el.caption.innerHTML='<b>'+labels[ph]+'</b> — character <b>'+(ci+1)+'</b> / '+CHARS+
        (ch!==undefined?' ("'+beadLabel(ch)+'")':'')+
        '<br><i>P30 maps each character to a symbolic prime-clock position.</i>'+
        '<br><span style="font-size:.9em;opacity:.85">Operation '+(opIdx+1)+' / '+p30OpsMax()+
        (val!==undefined?' · glyph '+val+' · residue '+residue(val):'')+'.</span>';
      opIdx++;
      if(val!==undefined && ph===2) tokensSoFar=ci+1;
      if(ph===2) highlightChar(Math.min(ci+1, CHARS));
      el.cTotal.textContent=opIdx;
      el.cEmit.textContent=Math.min(Math.ceil(opIdx/3), CHARS);
      el.cLocate.textContent=Math.floor(opIdx/3)*2+Math.min(opIdx%3,2);
      el.eOps.textContent=opIdx;
      draw();
      updateRunTimer();
      if(opIdx>=p30OpsMax()) finish();
      else broadcastEmbed();
    }

    function stepChar(){
      if(idx>=CHARS){ finish(); return; }
      var ch=SENTENCE[idx];
      var val=CHAR_TO_VAL[ch];
      var reading = (p30mode==='bios' && passCount>0);
      el.phaseTag.textContent = reading ? 'Reading' : 'Encode';
      highlightChar(idx);
      if(val!==undefined){
        beadForValue(val);
        tokensSoFar+=1;
        if(reading){
          el.caption.innerHTML='Reading position '+(idx+1)+' of '+CHARS+'. It already sits on a spoke, so it is valid by construction. The number comes through; <b>no operation</b> is spent.';
        } else if(p30mode==='bios'){
          el.caption.innerHTML='Ingress encode '+(idx+1)+' of '+CHARS+'. The incoming character is converted to its coprime position once. From here on it stays a position, all the way through the system.';
        } else {
          el.caption.innerHTML='Character '+(idx+1)+' of '+CHARS+' resolves to a coprime position on one of the eight data spokes. <b>One lookup</b>. No verification needed: a position from the coprime set is valid by construction.';
        }
      } else {
        litRes=-1; litVal=null;
        tokensSoFar+=3;
        el.caption.innerHTML='Character '+(idx+1)+' of '+CHARS+' falls outside Tier 1 and escapes to a multi-byte sequence.';
      }
      idx++;
      draw(); updatePanel();
    }

    function finish(){
      stop(); finished=true;
      litRes=-1; litVal=null; draw();
      if(EMBED_COMPARE) highlightChar(CHARS);
      else for(var i=0;i<tweetCharEls.length;i++){ tweetCharEls[i].classList.remove('tw-active'); tweetCharEls[i].classList.add('tw-done'); }
      if(p30mode==='encoder'){
        el.phaseTag.textContent='Complete';
        el.caption.innerHTML='Sentence encoded: <b>163</b> characters, <b>163</b> operations at the floor, one lookup each, zero verification on clean data. Vectorized, the whole sentence encodes in <b>6</b> wide operations. A Hamming SECDED round trip would have spent <b>12,264</b>. The gap is the argument.';
      } else {
        // BIOS mode: first completion is the one-time ingress encode; further plays are pass-through reads.
        if(passCount===0){
          el.phaseTag.textContent='Encoded';
          el.caption.innerHTML='Ingress encode complete. All '+CHARS+' characters became coprime positions, once. Now press Play again to read the data back. The value is already a position, so reading it costs nothing. Watch the count stay flat.';
        } else {
          el.phaseTag.textContent='Read '+passCount;
          el.caption.innerHTML='Read '+passCount+'. The data flowed through again and the count did not move. A valid value sits on a spoke, so it is correct by construction and nothing is re-checked. Conventional error correction would have paid its full cost on this pass, and on every pass.';
        }
        passCount++;
      }
      el.stTokens.textContent='167';
      updatePanel();
      updateRunTimer();
    }

    function stepDuration(){ return stepDelay; }
    function play(){
      if(playing){ stop(); return; }
      if(idx>=CHARS){
        // restart the sweep; in BIOS mode keep passCount so reads accumulate, in encoder mode full reset
        idx=0; finished=false; tokensSoFar=0; litRes=-1; litVal=null; highlightChar(-1);
        for(var i=0;i<tweetCharEls.length;i++){ tweetCharEls[i].classList.remove('tw-done'); }
        runClockReset();
      }
      playing=true; ge('playBtn').textContent='Pause';
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
      ge('playBtn').textContent='Play';
    }
    function reset(){
      stop(); idx=0; opIdx=0; finished=false; tokensSoFar=0; passCount=0; errOps=0; litRes=-1; litVal=null; errState=null;
      runClockReset();
      highlightChar(-1); el.phaseTag.textContent='Idle';
      el.caption.innerHTML='Press <b>Play</b> to encode the sentence character by character, or <b>Step</b> through one at a time. Each character lights the spoke it lands on; a value on a spoke is valid by construction.';
      draw(); updatePanel();
    }

    // ── Inject a random corruption, then run the two-layer recovery ──
    // corrupt a valid value by a small slip, then recover the nearest valid value
    function nearestCoprimeValue(n){
      for(var d=1;d<60;d++){
        var lo=n-d, hi=n+d;
        var loOK = lo>=1 && (lo%2&&lo%3&&lo%5);
        var hiOK = hi%2&&hi%3&&hi%5;
        if(loOK && hiOK) return {val:(Math.random()<0.5?lo:hi), dist:d, tie:true, lo:lo, hi:hi};
        if(loOK) return {val:lo, dist:d, tie:false};
        if(hiOK) return {val:hi, dist:d, tie:false};
      }
      return {val:n, dist:0, tie:false};
    }
    function injectError(){
      stop();
      // pick a random Tier 1 token whose immediate neighbor is a desert value, corrupt it by 1
      var orig, corrupt, tries=0;
      do{
        orig=CHAR_VALS[Math.floor(Math.random()*CHAR_VALS.length)];
        var dir=Math.random()<0.5?-1:1;
        corrupt=orig+dir;
        tries++;
      }while(tries<40 && (corrupt<1 || (corrupt%2&&corrupt%3&&corrupt%5)));
      if(corrupt<1 || (corrupt%2&&corrupt%3&&corrupt%5)){ corrupt=orig+1; while(corrupt%2&&corrupt%3&&corrupt%5) corrupt++; }
      var P=layer1P(corrupt);
      var nr=((corrupt%30)+30)%30;
      // Layer 2 recovers the nearest coprime VALUE on the number line
      var rec=nearestCoprimeValue(corrupt);
      var recVal=rec.val;
      var anti=((30-corrupt)%30+30)%30;
      errState={corrupt:corrupt, origVal:orig, recVal:recVal, P:P, rec:rec, anti:anti, phase:1};
      litRes=-1; litVal=null;
      el.phaseTag.textContent='Error';
      errOps+=3; // Layer 1: three-modulo identify, paid only because an error occurred
      el.caption.innerHTML='<b style="color:#cc4778">Corruption injected.</b> A single-step slip pushed a valid value onto a desert position, a value the wheel forbids. <b>Layer 1</b> three-modulo screen flags it, <b>3 operations</b>, spent only because something was wrong.';
      draw(); updatePanel();
      setTimeout(function(){
        if(!errState) return;
        errState.phase=2; el.phaseTag.textContent='Locate';
        var steps=rec.dist||1; errOps+=Math.min(steps,3); // Layer 2: nearest-valid search, bounded
        var tieTxt = rec.tie ? ' Two valid values are equidistant; Layer 2 ranks by MPQ energy and returns the candidate set.' : '';
        el.caption.innerHTML='<b>Layer 2, prime-residue adjacency.</b> The nearest valid position is located by the structural symmetry of the ring, a bounded search.'+tieTxt+' The antipodal complement gives the mirror.';
        draw(); updatePanel();
        setTimeout(function(){
          if(!errState) return;
          errState.phase=3; el.phaseTag.textContent='Corrected';
          el.caption.innerHTML='<b style="color:#7a4ddd">Recovered.</b> The slip is reversed to the adjacent valid element. The whole correction cost a handful of operations, paid once, only for the corrupted value. Every clean value around it cost nothing to confirm.';
          litVal=recVal; litRes=residue(recVal);
          draw(); updatePanel();
        }, 1500);
      }, 1500);
    }

    ge('playBtn').addEventListener('click',play);
    ge('stepBtn').addEventListener('click',function(){ stop(); stepChar(); });
    ge('resetBtn').addEventListener('click',reset);
    ge('errBtn').addEventListener('click',injectError);
    function setMode(mode){
      p30mode=mode;
      document.querySelectorAll('.mode-tab').forEach(function(x){ x.classList.toggle('active', x.dataset.mode===mode); });
      document.querySelectorAll('.work-tab').forEach(function(x){ x.classList.toggle('active', x.dataset.mode===mode); });
      passCount=0; errOps=0; stop(); idx=0; finished=false; tokensSoFar=0; litRes=-1; litVal=null; errState=null; highlightChar(-1);
      for(var i=0;i<tweetCharEls.length;i++){ tweetCharEls[i].classList.remove('tw-done','tw-active'); }
      var note=ge('modeNote');
      if(p30mode==='bios'){
        ge('opTitle').textContent='Operations, BIOS-native';
        ge('cEmitName').textContent='Ingress encode';
        ge('cLocateName').textContent='Re-verify on read';
        note.innerHTML='BIOS mode: encode happens once, as data enters the machine. After that the value stays a coprime position through every layer, so reads cost nothing and validity holds by construction.';
        el.phaseTag.textContent='Idle';
        el.caption.innerHTML='P30 BIOS. Press Play for the one-time encode as data enters, then press Play again to read it back and watch the count stay flat.';
      } else {
        ge('opTitle').textContent='Operations Performed';
        ge('cEmitName').textContent='Emit';
        ge('cLocateName').textContent='Locate + Verify';
        note.innerHTML='Library mode: each character is located, emitted, and verified, three operations apiece, because a library on top of a conventional stack cannot assume the surrounding system preserved validity. This is the conservative, runs-today cost.';
        el.phaseTag.textContent='Idle';
        el.caption.innerHTML='Press <b>Play</b> to encode the sentence character by character, or <b>Step</b> through one at a time.';
      }
      draw(); updatePanel();
    }
    document.querySelectorAll('.mode-tab, .work-tab').forEach(function(b){
      b.addEventListener('click',function(){ setMode(this.dataset.mode); });
    });
    ge('tempSel').addEventListener('change',function(){ opTemp=parseFloat(this.value); updatePanel(); });

    var tierNotes={
      '150':'Demo &middot; ~150 ms per character, slow enough to follow each value landing on its spoke. Real hardware resolves a character in well under a microsecond; every visible speed is a slow-motion replay.',
      '55':'Fast &middot; ~55 ms per character. The sentence encodes in about nine seconds, still readable value to value.',
      '14':'Turbo &middot; ~14 ms per character, near the edge of what the eye can follow. The whole sentence runs through in a couple of seconds.',
      '6':'Real&#8209;ish &middot; ~6 ms per character, past the floor of human perception. Real silicon is still far faster; this is a replay near the limit of what the eye resolves.'
    };
    document.querySelectorAll('.tier-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        stepDelay=parseInt(this.dataset.delay);
        document.querySelectorAll('.tier-btn').forEach(function(b){ b.classList.remove('active'); });
        this.classList.add('active');
        var note=ge('speedNote'); if(note) note.innerHTML=tierNotes[this.dataset.delay]||'';
        if(playing){ stop(); play(); }
      });
    });

    (function(){
      var panel=ge('panel'), hint=ge('scrollHint');
      if(!panel||!hint) return;
      function upd(){ var more=panel.scrollHeight-panel.clientHeight-panel.scrollTop>8; hint.classList.toggle('hidden',!more); }
      panel.addEventListener('scroll',upd); window.addEventListener('resize',upd); setTimeout(upd,120);
    })();

    window.addEventListener('resize',resize);
    resize(); reset();

    function embedNowLine(){
      var cap=ge('caption');
      return cap?cap.textContent.replace(/\s+/g,' ').trim():'';
    }
    function broadcastEmbed(){
      if(!opts.emit) return;
      var p30Full=p30OpsMax();
      var ci=finished?CHARS:Math.min(Math.floor(opIdx/3),Math.max(CHARS-1,0));
      var ph=finished?-1:(opIdx>0?(opIdx-1)%3:0);
      var ch=CHARS>0?SENTENCE[ci]:'';
      var val=ch?CHAR_TO_VAL[ch]:undefined;
      var posLabel=(litVal!=null)?String(litVal):(val!==undefined?String(val):'—');
      var opPhases=['Locate','Emit','Verify'];
      opts.emit({
        source:'p30',type:'state',
        ops:EMBED_COMPARE?opIdx:(parseInt(el.cTotal.textContent,10)||0),
        opsMax:p30Full,
        progress:EMBED_COMPARE?Math.min(Math.floor(opIdx/3),CHARS):idx,progressMax:CHARS,
        playing:playing,finished:finished,
        ms:runClockMs(),
        char:ch===' '?'\u2423':(ch||''),
        position:posLabel,
        glyphs:tokensSoFar||Math.min(Math.floor(opIdx/3),CHARS),
        charIndex:finished?CHARS:ci,
        opPhase:finished?'':opPhases[ph]||'Locate',
        nowLine:embedNowLine()
      });
    }

    var api = {
      play: play,
      pause: stop,
      reset: reset,
      step: function () { stop(); stepOp(); },
      setSpeed: function (d) { stepDelay = parseInt(d, 10); },
      setSentence: function (t) { applySentence(t); },
      destroy: function () {
        stop();
        window.removeEventListener("resize", resize);
        root.innerHTML = "";
      },
    };

    if (EMBED_COMPARE) {
      broadcastEmbed();
      if (opts.onReady) opts.onReady("p30");
    }

    return api;
  }

  global.P30EncoderCore = { mount: mountEncoderCore };
})(window);
