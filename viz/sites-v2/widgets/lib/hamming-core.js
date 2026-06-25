(function (global) {
  "use strict";

  function mountHammingCore(root, opts) {
    opts = opts || {};
    var listeners = [];

    function q(id) { return root.querySelector("#" + id); }
    function ge(id) {
      var el = q(id);
      if (el) return el;
      return null;
    }

    "use strict";
    const N_BYTES=8, BITS_PER_BYTE=8, N_DATA=64, N_CHECK=8;
    const TOTAL=584, WRITE_MAX=128, READ_MAX=456, WORK=64;
    const kB=1.380649e-23, ln2=Math.log(2);
    let opTemp=350;
    function landauerPerOp(T){return kB*T*ln2;}
    let TWEET_WORDS=21;
    let TWEET_TOTAL=TWEET_WORDS*TOTAL;
    function refreshTweetLimits(){
      TWEET_WORDS=Math.max(1,Math.ceil(TWEET_STR.length/8));
      TWEET_TOTAL=TWEET_WORDS*TOTAL;
    }
    function updateTweetMetaLine(){
      const tm=ge('tweetMeta');
      if(tm) tm.textContent=TWEET_STR.length+' characters \u00b7 '+(TWEET_STR.length*8)+' bits \u00b7 '+TWEET_WORDS+' words of 64 bits';
    }
    let mode='word';
    let stepDelay=156;
    var EMBED_COMPARE=!!opts.embed;
    if(EMBED_COMPARE){root.classList.add('embed-compare');if(!opts.delay)stepDelay=6;}
    if(opts.delay) stepDelay=parseInt(opts.delay,10);
    let TWEET_STR="The Great Salt Lake can be fully restored to full health within as little as 3 years by returning 1,150,000 AF/yr. Resulting Utah's lake effect and water security.";
    refreshTweetLimits();
    function wordChars(w){
      const slice=TWEET_STR.slice(w*8,w*8+8);
      const out=[];
      for(let i=0;i<8;i++) out.push(slice[i]!==undefined?slice[i]:' ');
      return out;
    }
    function charBits(ch){
      const code=ch.charCodeAt(0)&0xFF;
      return code.toString(2).padStart(8,'0').split('').map(Number);
    }
    function dispChar(ch){
      if(ch===' ')return '\u2423';
      return ch;
    }
    const HSIAO_WATCHERS={0:[0,1,2],1:[0,1,3],2:[0,1,4],3:[0,1,5],4:[0,1,6],5:[0,1,7],6:[0,2,3],7:[0,2,4],8:[0,2,5],9:[0,2,6],10:[0,2,7],11:[0,3,4],12:[0,3,5],13:[0,3,6],14:[0,3,7],15:[0,4,5],16:[0,4,6],17:[0,4,7],18:[0,5,6],19:[0,5,7],20:[0,6,7],21:[1,2,3],22:[1,2,4],23:[1,2,5],24:[1,2,6],25:[1,2,7],26:[1,3,4],27:[1,3,5],28:[1,3,6],29:[1,3,7],30:[1,4,5],31:[1,4,6],32:[1,4,7],33:[1,5,6],34:[1,5,7],35:[1,6,7],36:[2,3,4],37:[2,3,5],38:[2,3,6],39:[2,3,7],40:[2,4,5],41:[2,4,6],42:[2,4,7],43:[2,5,6],44:[2,5,7],45:[2,6,7],46:[3,4,5],47:[3,4,6],48:[3,4,7],49:[3,5,6],50:[3,5,7],51:[3,6,7],52:[4,5,6],53:[4,5,7],54:[4,6,7],55:[5,6,7],56:[3,4,5,6,7],57:[2,4,5,6,7],58:[2,3,5,6,7],59:[0,1,5,6,7],60:[0,1,3,4,7],61:[0,1,2,4,6],62:[0,1,2,3,5],63:[0,1,2,3,4]};
    function checksWatching(globalBit){
      return HSIAO_WATCHERS[globalBit] ? HSIAO_WATCHERS[globalBit].slice() : [];
    }
    function highlightCoverage(ci){
      for(let g=0;g<64;g++){
        if(checksWatching(g).includes(ci)){
          const b=Math.floor(g/8), i=g%8;
          if(bitCells[b]&&bitCells[b][i]) bitCells[b][i].classList.add('coverage');
        }
      }
      if(checkCells[ci]) checkCells[ci].classList.add('cov-active');
      if(el&&el.caption&&!playing){
        el.caption.innerHTML='<b>C'+ci+'</b> watches these 26 highlighted data bits. Each of the 64 data bits is watched by a unique set of 3 or 5 check bits, so any single flip leaves a unique fingerprint across C0 to C7.';
      }
    }
    function clearCoverage(){
      for(let b=0;b<N_BYTES;b++)for(let i=0;i<BITS_PER_BYTE;i++){
        if(bitCells[b]&&bitCells[b][i]) bitCells[b][i].classList.remove('coverage');
      }
      checkCells.forEach(c=>c.classList.remove('cov-active'));
    }
    function checkParity(ci){
      let bits;
      if(mode==='tweet'){
        const chars=wordChars(curWord);
        bits=[];
        for(let b=0;b<N_BYTES;b++) bits=bits.concat(charBits(chars[b]));
      }else{
        bits=[];for(let k=0;k<64;k++) bits.push(k%3===0?1:0);
      }
      let p=0;
      for(let k=0;k<64;k++){ if(checksWatching(k).includes(ci) && bits[k]) p^=1; }
      return p;
    }
    function showCheckValue(ci){
      const e=ge('cv'+ci);
      if(e) e.textContent=checkParity(ci);
    }
    function fmtJ(j){
      if(j===0)return '0 J';
      const units=[['J',1],['mJ',1e-3],['\u00b5J',1e-6],['nJ',1e-9],['pJ',1e-12],['fJ',1e-15],['aJ',1e-18],['zJ',1e-21]];
      for(const [u,scale] of units){ if(j>=scale){ return (j/scale).toFixed(3)+' '+u; } }
      return (j/1e-21).toFixed(3)+' zJ';
    }
    const gridWrap=ge('gridWrap');
    const bitCells=[];
    const byteRows=[];
    const checkCells=[];
    function buildGrid(){
      gridWrap.innerHTML='';
      const wrap=document.createElement('div');wrap.className='word-grid';
      const dataCol=document.createElement('div');dataCol.className='bytes-col';
      if(EMBED_COMPARE){
        const bitHdr=document.createElement('div');bitHdr.className='bit-header-row';
        const spacer=document.createElement('div');spacer.className='byte-tag';bitHdr.appendChild(spacer);
        for(let i=7;i>=0;i--){
          const lab=document.createElement('div');lab.className='bit-hdr';lab.textContent='bit '+i;
          bitHdr.appendChild(lab);
        }
        dataCol.appendChild(bitHdr);
      }
      for(let b=0;b<N_BYTES;b++){
        const row=document.createElement('div');row.className='byte-row';
        const tag=document.createElement('div');tag.className='byte-tag';
        tag.innerHTML='<span class="byte-lab">Byte '+b+'</span><span class="byte-arr" aria-hidden="true">→</span><span class="byte-char" id="bc'+b+'"></span>';row.appendChild(tag);
        const rowCells=[];
        for(let i=0;i<BITS_PER_BYTE;i++){
          const globalBit=b*BITS_PER_BYTE+i;
          const c=document.createElement('div');c.className='bit';
          c.innerHTML='<span class="bn">'+globalBit+'</span>';
          rowCells.push(c);row.appendChild(c);
        }
        bitCells.push(rowCells);byteRows.push(row);dataCol.appendChild(row);
      }
      wrap.appendChild(dataCol);
      if(EMBED_COMPARE){
        const bridge=document.createElement('div');
        bridge.className='ecc-bridge';
        bridge.setAttribute('aria-label','Data bits feed ECC checks');
        bridge.innerHTML='<div class="ecc-bridge-arrow" aria-hidden="true">→</div>';
        wrap.appendChild(bridge);
      }
      const checkCol=document.createElement('div');checkCol.className='check-col';
      const ct=document.createElement('div');ct.className='ctitle';
      ct.innerHTML=EMBED_COMPARE
        ?'Verification pass<span class="ctitle-sub">ECC overhead · Hsiao (72,64)</span>'
        :'8 Check Bits<span class="ctitle-sub">Hsiao (72,64)</span>';
      checkCol.appendChild(ct);
      for(let i=0;i<N_CHECK;i++){
        const cc=document.createElement('div');cc.className='check-cell';
        cc.innerHTML='C'+i+'<span class="ccov">watches 26</span><span class="cval" id="cv'+i+'">&middot;</span>';
        cc.addEventListener('mouseenter',()=>highlightCoverage(i));
        cc.addEventListener('mouseleave',()=>clearCoverage());
        checkCells.push(cc);checkCol.appendChild(cc);
      }
      const nt=document.createElement('div');nt.className='ninth-tag';nt.textContent='the 9th byte: pure overhead';checkCol.appendChild(nt);
      wrap.appendChild(checkCol);
      gridWrap.appendChild(wrap);
    }
    buildGrid();
    function loadWord(w){
      const chars=wordChars(w);
      for(let b=0;b<N_BYTES;b++){
        const bcEl=ge('bc'+b);
        if(mode==='tweet'){
          bcEl.textContent=dispChar(chars[b]||' ');
          const bits=charBits(chars[b]);
          for(let i=0;i<BITS_PER_BYTE;i++){
            bitCells[b][i].innerHTML='<span class="bn">'+bits[i]+'</span>';
          }
        }else{
          bcEl.textContent='';
          for(let i=0;i<BITS_PER_BYTE;i++){
            const gb=b*BITS_PER_BYTE+i;
            bitCells[b][i].innerHTML='<span class="bn">'+gb+'</span>';
          }
        }
      }
    }
    const tweetCharEls=[];
    function buildTweetText(){
      const host=ge('tweetText');
      if(!host) return;
      host.innerHTML=''; tweetCharEls.length=0;
      host.appendChild(document.createTextNode('\u201c'));
      for(let i=0;i<TWEET_STR.length;i++){
        const s=document.createElement('span');
        s.className='tw-ch';
        s.textContent=TWEET_STR[i]===' ' ? '\u00a0' : TWEET_STR[i];
        tweetCharEls.push(s);
        host.appendChild(s);
      }
      host.appendChild(document.createTextNode('\u201d \u2014 January Walker'));
      updateTweetMetaLine();
    }
    buildTweetText();
    function applySentence(text){
      if(!text||typeof text!=='string') return;
      if(text===TWEET_STR) return;
      TWEET_STR=text;
      refreshTweetLimits();
      buildTweetText();
      setMode('tweet');
    }
    function clearTweetHighlight(){
      tweetCharEls.forEach(s=>s.classList.remove('tw-active','tw-done'));
    }
    function highlightTweetChar(globalCharIdx){
      tweetCharEls.forEach((s,i)=>{
        s.classList.toggle('tw-done', i<globalCharIdx);
        s.classList.toggle('tw-active', i===globalCharIdx);
      });
    }
    const bytePips=[];
    (function buildPips(){
      const wrap=ge('bytePips');
      for(let b=0;b<N_BYTES;b++){const p=document.createElement('div');p.className='pip';wrap.appendChild(p);bytePips.push(p);}
    })();
    let steps=[];
    function buildSteps(){
      steps=[];
      for(let b=0;b<N_BYTES;b++){
        for(let i=0;i<BITS_PER_BYTE;i++){
          const gb=b*BITS_PER_BYTE+i;
          steps.push({phase:'WRITE',type:'databit',byte:b,bit:i,write:2,
            cap:'Writing bit <b>'+gb+'</b> (Byte '+b+'): XOR into the running check total, AND with a mask to route it to its check groups.'});
        }
      }
      for(let i=0;i<N_CHECK;i++){
        steps.push({phase:'WRITE',type:'checkdone',check:i,
          cap:'Check bit <b>C'+i+'</b> computed and stored alongside the word.'});
      }
      for(let i=0;i<N_CHECK;i++){
        steps.push({phase:'READ',type:'checkstart',check:i,
          cap:'Recomputing <b>C'+i+'</b>. To do it, the machine must re-examine data bits spread across every byte.'});
        steps.push({phase:'READ',type:'checksweep',check:i,read:64,
          cap:'<b>C'+i+'</b> recompute: 64 XOR operations sweeping across all eight bytes of the word.'});
        steps.push({phase:'READ',type:'checkcompare',check:i,read:1,
          cap:'Compare recomputed <b>C'+i+'</b> against the stored value. (+1 comparison)'});
      }
      steps.push({phase:'READ',type:'correct',read:1,
        cap:'The syndrome points to the flipped bit. One XOR flips it back. (+1 correction)'});
    }
    buildSteps();
    let idx=0, playing=false, timer=null;
    const runClock={accumulated:0,running:false,t0:0,tick:null};

    function formatElapsed(ms){
      if(ms<1000) return ms.toFixed(0)+' ms';
      if(ms<60000) return (ms/1000).toFixed(2)+' s';
      const m=Math.floor(ms/60000), s=((ms%60000)/1000).toFixed(1);
      return m+'m '+s+'s';
    }
    function runClockMs(){
      let t=runClock.accumulated;
      if(runClock.running) t+=performance.now()-runClock.t0;
      return t;
    }
    function updateRunTimer(){
      const te=ge('timerElapsed');
      const tm=ge('timerMeta');
      if(!te||!tm) return;
      const ms=runClockMs();
      const total=accWrite+accRead+writeOps+readOps;
      const opMax=(mode==='tweet')?TWEET_TOTAL:TOTAL;
      te.textContent=formatElapsed(ms);
      if(EMBED_COMPARE){
        const wLab=(mode==='tweet')?('Word <b>'+(Math.min(curWord+1,totalWords))+'</b> / '+totalWords+' &middot; '):'';
        tm.innerHTML=wLab+'<b>'+total.toLocaleString()+'</b> / '+opMax.toLocaleString()+' ops';
      }else{
        const perOp=(total>0&&ms>0)?(ms/total).toFixed(2):'—';
        tm.innerHTML=total.toLocaleString()+' / '+opMax.toLocaleString()+' ops &middot; <b>'+perOp+'</b> ms/op';
      }
    }
    function runClockStart(){
      if(!runClock.running){
        runClock.t0=performance.now();
        runClock.running=true;
      }
      clearInterval(runClock.tick);
      runClock.tick=setInterval(updateRunTimer,50);
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

    let writeOps=0, readOps=0;
    let corrupted=null;
    let curWord=0;
    let totalWords=1;
    let embedCurByte=-1;
    let embedBytesUsed=0;
    let embedCharIndex=-1;
    let embedBitIndex=-1;
    let embedStepPhase='Idle';
    let accWrite=0, accRead=0;
    const el={
      cWrite:ge('cWrite'),cRead:ge('cRead'),
      cTotal:ge('cTotal'),barWork:ge('barWork'),
      barOver:ge('barOver'),
      ratioBig:ge('ratioBig'),p30:ge('p30Val'),
      caption:ge('caption'),phaseTag:ge('phaseTag'),
      bytesVal:ge('bytesVal'),
      ePerOp:ge('ePerOp'),eRun:ge('eRun'),eOps:ge('eOps')
    };
    const wordTag=ge('wordTag');
    function clearBitStates(){
      for(let b=0;b<N_BYTES;b++){
        byteRows[b].classList.remove('examining','done-sweep','active-byte');
        for(let i=0;i<BITS_PER_BYTE;i++){
          const c=bitCells[b][i];
          c.classList.remove('active','watched','fixed','coverage');
          if(corrupted&&corrupted.byte===b&&corrupted.bit===i)c.classList.add('corrupted');
          else c.classList.remove('corrupted');
        }
      }
      checkCells.forEach(c=>c.classList.remove('computing','reading','match','mismatch','cov-active'));
    }
    function syncEmbedPhaseClass(){
      if(!EMBED_COMPARE||!gridWrap) return;
      gridWrap.classList.toggle('phase-read', embedStepPhase==='READ');
      gridWrap.classList.toggle('phase-write', embedStepPhase==='WRITE');
    }
    function setBytesTouched(n){
      el.bytesVal.textContent=n+' / 8';
      bytePips.forEach((p,b)=>p.classList.toggle('lit',b<n));
    }
    function updatePanel(){
      const wTot = accWrite + writeOps;
      const rTot = accRead + readOps;
      const total = wTot + rTot;
      el.cWrite.textContent=wTot;
      el.cRead.textContent=rTot;
      el.cTotal.textContent=total;
      el.barWork.style.width=(64/584*90)+'%';
      el.barOver.style.width='90%';
      el.ratioBig.textContent=(TOTAL/WORK).toFixed(1)+'\u00d7';
      el.p30.textContent=(playing||idx>0||curWord>0)?(mode==='tweet'?489:24):0;
      const ePer=landauerPerOp(opTemp);
      el.ePerOp.textContent=fmtJ(ePer);
      el.eOps.textContent=total;
      el.eRun.textContent=fmtJ(total*ePer);
      if(wordTag) wordTag.textContent = (mode==='tweet') ? ('Word '+(Math.min(curWord+1,totalWords))+' / '+totalWords) : '';
      updateRunTimer();
      broadcastEmbed();
    }
    function refreshByteRowStates(activeByte){
      if(!EMBED_COMPARE) return;
      for(let b=0;b<N_BYTES;b++){
        if(!byteRows[b]) continue;
        byteRows[b].classList.remove('future-byte','done-byte');
        if(activeByte>=0){
          if(b<activeByte) byteRows[b].classList.add('done-byte');
          else if(b>activeByte) byteRows[b].classList.add('future-byte');
        }else if(idx>=steps.length||curWord>0){
          byteRows[b].classList.add('done-byte');
        }else{
          byteRows[b].classList.add('future-byte');
        }
      }
    }
    function applyStep(s){
      clearBitStates();
      el.phaseTag.textContent=s.phase;
      el.caption.innerHTML=s.cap;
      if(s.type==='databit'){
        embedCurByte=s.byte;
        embedCharIndex=curWord*8+s.byte;
        embedBitIndex=s.bit;
        embedStepPhase='WRITE';
        embedBytesUsed=Math.min(TWEET_STR.length, curWord*8+s.byte+1);
        refreshByteRowStates(s.byte);
        bitCells[s.byte][s.bit].classList.add('active');
        byteRows[s.byte].classList.add('examining','active-byte');
        writeOps=Math.min(WRITE_MAX,writeOps+s.write);
        if(mode==='tweet'){
          const ch=wordChars(curWord)[s.byte];
          el.caption.innerHTML='Encoding character "<b>'+dispChar(ch)+'</b>"<br>Byte '+s.byte+', bit '+s.bit+' is folded into the ECC check total (XOR + AND mask).<br><i>Every bit must be visited to verify the word.</i>';
          highlightTweetChar(curWord*8+s.byte);
        }else{
          const gb=s.byte*8+s.bit;
          el.caption.innerHTML='Encoding data bit <b>'+gb+'</b> (Byte '+s.byte+'): XOR into the running check total, AND with a mask to route it. Two operations per bit, just to be checked.';
        }
      }else if(s.type==='checkdone'){
        checkCells[s.check].classList.add('done');
        showCheckValue(s.check);
      }else if(s.type==='checkstart'){
        embedStepPhase='READ';
        checkCells.forEach(c=>c.classList.remove('done','computing'));
        checkCells[s.check].classList.remove('match','mismatch');
        checkCells[s.check].classList.add('computing');
        showCheckValue(s.check);
        let touchedBytes=new Set();
        for(let g=0;g<64;g++){
          if(checksWatching(g).includes(s.check)){
            const b=Math.floor(g/8), i=g%8;
            bitCells[b][i].classList.add('watched');
            byteRows[b].classList.add('examining');
            touchedBytes.add(b);
          }
        }
        el.caption.innerHTML='Recomputing <b>C'+s.check+'</b> — every data bit in the word must be visited again.';
      }else if(s.type==='checksweep'){
        embedStepPhase='READ';
        checkCells[s.check].classList.add('computing');
        showCheckValue(s.check);
        let touchedBytes=new Set();
        for(let g=0;g<64;g++){
          if(checksWatching(g).includes(s.check)){
            const b=Math.floor(g/8), i=g%8;
            bitCells[b][i].classList.add('watched');
            byteRows[b].classList.add('examining');
            touchedBytes.add(b);
          }
        }
        setBytesTouched(touchedBytes.size);
        el.caption.innerHTML='<b>C'+s.check+'</b> recompute: XOR over its 26 watched data bits (highlighted). They span '+touchedBytes.size+' of the 8 bytes, so locating any error still pulls in most of the word.';
        readOps=Math.min(READ_MAX,readOps+s.read);
      }else if(s.type==='checkcompare'){
        embedStepPhase='READ';
        showCheckValue(s.check);
        if(corrupted){
          const gbit=corrupted.byte*8+corrupted.bit;
          const watchers=checksWatching(gbit);
          if(watchers.includes(s.check)){
            checkCells[s.check].classList.add('mismatch');
            el.caption.innerHTML='<b>C'+s.check+'</b> watches the flipped bit, so its recomputed parity <b>disagrees</b> with the stored value. C'+s.check+' is part of the error fingerprint. (+1 comparison)';
          }else{
            checkCells[s.check].classList.add('match');
            el.caption.innerHTML='<b>C'+s.check+'</b> does not watch the flipped bit, so it still <b>matches</b>. The pattern of which checks disagree is the syndrome that locates the error. (+1 comparison)';
          }
        }else{
          checkCells[s.check].classList.add('match');
          el.caption.innerHTML='Reading stored <b>C'+s.check+'</b> back: it <b>matches</b> the recompute. No error in the bits it watches. (+1 comparison)';
        }
        readOps=Math.min(READ_MAX,readOps+s.read);
      }else if(s.type==='correct'){
        readOps=Math.min(READ_MAX,readOps+s.read);
        setBytesTouched(8);
        if(corrupted){
          const gbit=corrupted.byte*8+corrupted.bit;
          const watchers=checksWatching(gbit);
          watchers.forEach(c=>checkCells[c].classList.add('mismatch'));
          const cell=bitCells[corrupted.byte][corrupted.bit];
          cell.classList.remove('corrupted');cell.classList.add('fixed');
          const synd=watchers.map(c=>'C'+c).join('+');
          el.caption.innerHTML='Syndrome <b>'+synd+'</b> fingerprints bit <b>'+gbit+'</b> (Byte '+corrupted.byte+') uniquely. One XOR flips it back. In this Hsiao code, the pattern of disagreeing check bits <b>is</b> the address of the error.';
        }
      }
      updatePanel();
      syncEmbedPhaseClass();
    }
    function step(){
      if(idx>=steps.length){ advanceWord(); return; }
      applyStep(steps[idx]);idx++;
    }
    function advanceWord(){
      accWrite+=writeOps; accRead+=readOps;
      writeOps=0; readOps=0;
      curWord++;
      if(curWord>=totalWords){ finishAll(); return; }
      idx=0;
      checkCells.forEach(c=>c.classList.remove('done','computing','reading','match','mismatch'));
      if(mode==='tweet') loadWord(curWord);
      el.phaseTag.textContent='WRITE';
      el.caption.innerHTML='Word <b>'+(curWord+1)+'</b> of '+totalWords+' ("'+wordChars(curWord).map(dispChar).join('')+'"): the machine begins the entire 584-operation round trip again, from scratch, for the next 64 bits.';
      updatePanel();
      if(!playing){ }
    }
    function finishAll(){
      stop();el.phaseTag.textContent='Complete';
      embedStepPhase='Idle';
      const total=accWrite+accRead;
      if(mode==='tweet'){
        el.caption.innerHTML='Whole tweet verified: <b>'+totalWords+'</b> words, <b>'+total.toLocaleString()+'</b> bit-level operations, every one spent only to confirm the message did not change. P30 covers the same 163 characters in <b>489</b> symbol-level operations (3 per character).';
      }else{
        el.caption.innerHTML='Round trip complete: <b>584</b> bit-level operations to protect <b>64</b> bits, all eight bytes recomputed as one unit. P30 covers these 8 bytes in about <b>24</b> symbol-level operations (3 per character).';
      }
      setBytesTouched(8);
      if(mode==='tweet'){tweetCharEls.forEach(s=>{s.classList.remove('tw-active');s.classList.add('tw-done');});}
      updatePanel();
      syncEmbedPhaseClass();
    }
    function stepDuration(){
      if(EMBED_COMPARE) return stepDelay;
      const s=steps[idx];
      if(s && s.type==='correct') return Math.max(stepDelay, 250);
      const prev=steps[idx-1];
      if(prev && prev.type==='checkcompare') return stepDelay+220;
      return stepDelay;
    }
    function play(){
      if(playing){stop();return;}
      playing=true;ge('playBtn').textContent='Pause';
      runClockStart();
      const tick=()=>{
        if(!playing) return;
        if(idx>=steps.length){
          advanceWord();
          if(!playing) return;
        } else { step(); }
        timer=setTimeout(tick, stepDuration());
      };
      timer=setTimeout(tick, stepDuration());
      updatePanel();
    }
    function stop(){
      playing=false;
      clearTimeout(timer);
      clearInterval(timer);
      runClockPause();
      ge('playBtn').textContent='Play';
    }
    function reset(){
      stop();idx=0;writeOps=0;readOps=0;accWrite=0;accRead=0;curWord=0;corrupted=null;setBytesTouched(0);
      embedCurByte=-1; embedBytesUsed=0; embedCharIndex=-1; embedBitIndex=-1; embedStepPhase='Idle';
      syncEmbedPhaseClass();
      runClockReset();
      totalWords=(mode==='tweet')?TWEET_WORDS:1;
      clearBitStates();checkCells.forEach(c=>c.classList.remove('done','computing','reading','match','mismatch'));
      for(let i=0;i<N_CHECK;i++){const e=ge('cv'+i);if(e)e.textContent='\u00b7';}
      loadWord(0);clearTweetHighlight(); refreshByteRowStates(-1);
      el.phaseTag.textContent='Idle';
      if(mode==='tweet'){
        el.caption.innerHTML='Full tweet mode: the machine will run the complete 584-operation round trip <b>'+TWEET_WORDS+'</b> times, once per 64-bit word, for <b>'+TWEET_TOTAL.toLocaleString()+'</b> operations total. Press <b>Play</b>.';
      }else{
        el.caption.innerHTML='Press <b>Play</b> to watch the machine encode, then read, one 64-bit word. Or step through one operation at a time. Then press <b>Flip a Bit</b> to see why a single error obligates all eight bytes.';
      }
      updatePanel();el.p30.textContent=0;
    }
    function flipBit(){
      stop();
      const b=Math.floor(Math.random()*N_BYTES), i=Math.floor(Math.random()*BITS_PER_BYTE);
      corrupted={byte:b,bit:i};
      accWrite=0;accRead=0;curWord=0;totalWords=1;
      setBytesTouched(0);
      clearBitStates();
      checkCells.forEach(c=>c.classList.remove('done','computing','reading','match','mismatch'));
      el.caption.innerHTML='A bit at position <b>'+(b*8+i)+'</b> in Byte '+b+' has silently flipped. Watch: to find this one bit, the read must sweep <b>all eight bytes</b>. Press <b>Play</b> or <b>Step</b> through the read.';
      let readStart=steps.findIndex(s=>s.phase==='READ');
      idx=readStart>=0?readStart:0;
      writeOps=WRITE_MAX;readOps=0;
      checkCells.forEach(c=>c.classList.add('done'));
      updatePanel();
    }
    ge('playBtn').addEventListener('click',play);
    ge('stepBtn').addEventListener('click',()=>{stop();step();});
    ge('resetBtn').addEventListener('click',reset);
    ge('flipBtn').addEventListener('click',flipBit);
    ge('tempSel').addEventListener('change',function(){
      opTemp=parseFloat(this.value);updatePanel();
    });
    const tierNotes={
      '156':'Demo &middot; ~156 ms per operation, slow enough to narrate. Real hardware runs a word\'s full round trip in about a nanosecond, roughly 100 million times faster than even Real&#8209;ish; every visible speed is a slow-motion replay.',
      '40':'Fast &middot; ~40 ms per operation. Quick enough to move through a word in a few seconds, still readable step to step.',
      '8':'Turbo &middot; ~8 ms per operation, near the edge of what the eye can follow. The full tweet runs through in under two minutes.',
      '6':'Real&#8209;ish &middot; ~6 ms per operation, faster than the eye can resolve individual steps. The whole round trip blurs into a single rush. Real silicon is still ~100 million times faster, this is past the floor of human perception.'
    };
    document.querySelectorAll('.tier-btn').forEach(btn=>{
      btn.addEventListener('click',function(){
        stepDelay=parseInt(this.dataset.delay);
        document.querySelectorAll('.tier-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        const note=ge('speedNote');
        if(note) note.innerHTML=tierNotes[this.dataset.delay]||'';
        if(playing){stop();play();}
      });
    });
    const tabWord=ge('tabWord'),tabTweet=ge('tabTweet');
    const tweetBanner=ge('tweetBanner');
    function setMode(m){
      mode=m;
      totalWords=(m==='tweet')?TWEET_WORDS:1;
      reset();
      tabWord.classList.toggle('active',m==='word');
      tabTweet.classList.toggle('active',m==='tweet');
      tweetBanner.style.display=(m==='tweet')?'flex':'none';
    }
    tabWord.addEventListener('click',()=>setMode('word'));
    tabTweet.addEventListener('click',()=>setMode('tweet'));
    setBytesTouched(0);
    setMode('tweet');
    (function(){
      const panel=ge('panel'), hint=ge('scrollHint');
      if(!panel||!hint) return;
      function upd(){
        const more=panel.scrollHeight - panel.clientHeight - panel.scrollTop > 8;
        hint.classList.toggle('hidden', !more);
      }
      panel.addEventListener('scroll',upd);
      window.addEventListener('resize',upd);
      setTimeout(upd,100);
    })();
    function embedNowLine(){
      const cap=ge('caption');
      return cap?cap.textContent.replace(/\s+/g,' ').trim():'';
    }
    function broadcastEmbed(){
      if(!opts.emit) return;
      const total=accWrite+accRead+writeOps+readOps;
      const finished=el.phaseTag.textContent==='Complete';
      opts.emit({
        source:'hamming',type:'state',
        ops:total,opsMax:TWEET_TOTAL,
        progress:curWord+(idx/Math.max(steps.length,1)),
        progressMax:TWEET_WORDS,
        playing:playing,finished:finished,
        word:finished?totalWords:Math.min(curWord+1,totalWords),
        wordFinished:finished,
        ms:runClockMs(),
        byteIdx:embedCurByte>=0?embedCurByte:'',
        charIndex:embedCharIndex,
        bitIndex:embedBitIndex>=0?embedBitIndex:'',
        stepPhase:embedStepPhase,
        bytesUsed:finished?TWEET_STR.length:embedBytesUsed,
        nowLine:embedNowLine()
      });
    }

    var api = {
      play: play,
      pause: stop,
      reset: reset,
      step: function () {
        if (el.phaseTag.textContent === "Complete") return;
        stop();
        if (!runClock.running) runClockStart();
        step();
      },
      setSpeed: function (d) { stepDelay = parseInt(d, 10); },
      setSentence: function (t) { applySentence(t); },
      destroy: function () {
        stop();
        root.innerHTML = "";
      },
    };

    if (EMBED_COMPARE) {
      setMode("tweet");
      broadcastEmbed();
      if (opts.onReady) opts.onReady("hamming");
    }

    return api;
  }

  global.P30HammingCore = { mount: mountHammingCore };
})(window);
