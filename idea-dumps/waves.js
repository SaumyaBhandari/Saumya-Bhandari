(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const SPEED = 335; // Visual pixels per second (illustrative, not SI units).
  const PULSE_LENGTH = 0.96;
  const FIRST_PUSH = 0.08;
  const MESSAGE = 'I love you Trishna';
  const BITS = Array.from(new TextEncoder().encode(MESSAGE), n => n.toString(2).padStart(8, '0')).join('');
  const SCENE_IDS = ['scene-one', 'scene-two', 'scene-three', 'scene-four', 'scene-five'];
  const scenes = new Map();

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smoothstep = x => { const a = clamp(x, 0, 1); return a * a * (3 - 2 * a); };
  const pulse = time => {
    if (time <= 0 || time >= PULSE_LENGTH) return 0;
    const u = time / PULSE_LENGTH;
    return Math.sin(TAU * u) * Math.sin(Math.PI * u) ** 2;
  };
  const bit = n => Number(BITS[((n % BITS.length) + BITS.length) % BITS.length]);

  function carrier(time) {
    if (time < 0) return 0;
    const symbolDuration = 0.36;
    const n = Math.floor(time / symbolDuration);
    const u = time / symbolDuration - n;
    // Two full carrier cycles per symbol, continuous at symbol boundaries.
    const phase = Math.PI * (bit(n - 1) + (bit(n) - bit(n - 1)) * smoothstep(u / 0.28));
    return Math.sin(TAU * 2 * u + phase) * smoothstep(time / 0.28);
  }

  function createScene(id, index) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = {
      id, index, canvas, ctx, w: 760, h: 310, time: 0,
      visible: false, seen: false, playing: true,
      speed: 1, last: 0, grid: [],
      phaseNode: document.getElementById('phase-' + id)
    };
    scenes.set(id, state);
    const startButton = document.querySelector('[data-start="' + id + '"]');
    const pauseButton = document.querySelector('[data-pause="' + id + '"]');
    const resetButton = document.querySelector('[data-reset="' + id + '"]');
    const slider = document.querySelector('[data-speed="' + id + '"]');
    const updateButtons = () => {
      if (startButton) startButton.disabled = state.playing;
      if (pauseButton) pauseButton.disabled = !state.playing;
      if (state.phaseNode) state.phaseNode.dataset.playback = state.playing ? 'running' : 'paused';
    };
    updateButtons();
    if (startButton) startButton.addEventListener('click', () => {
      state.playing = true;
      state.last = 0;
      updateButtons();
      draw(state);
    });
    if (pauseButton) pauseButton.addEventListener('click', () => {
      state.playing = false;
      state.last = 0;
      updateButtons();
      draw(state);
    });
    if (resetButton) resetButton.addEventListener('click', () => {
      state.time = 0;
      state.seen = true;
      state.playing = false;
      state.last = 0;
      updateButtons();
      draw(state);
    });
    if (slider) slider.addEventListener('input', () => { state.speed = Number(slider.value); });
    resize(state);
  }

  function resize(s) {
    const box = s.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    s.w = Math.max(320, box.width || 760);
    s.h = Math.max(230, box.height || 310);
    s.canvas.width = Math.round(s.w * pixelRatio);
    s.canvas.height = Math.round(s.h * pixelRatio);
    s.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const space = s.w < 530 ? 23 : 25;
    s.grid = [];
    const lower = s.index === 3 ? s.h * 0.67 : s.h * 0.87;
    for (let y = 65; y < lower - 9; y += space) {
      for (let x = 15; x < s.w - 11; x += space) s.grid.push({x, y});
    }
    draw(s);
  }

  function geometry(s) {
    return {left: s.w * 0.16, right: s.w * 0.84, y: s.index === 3 ? s.h * 0.41 : s.h * 0.50,
      barrier: s.w * 0.50, speed: (s.w * 0.68) / 1.7};
  }

  function events(s, g) {
    const travel = (g.right - g.left) / g.speed;
    const t = s.time;
    if (s.index === 0) {
      // One deliberate oscillation per arrival. Every subsequent push occurs
      // only after the previous pulse reaches the other charge.
      const all = [];
      for (let n = 0; n < 100; n++) {
        const start = FIRST_PUSH + n * travel;
        if (start > t + 0.02) break;
        if (t - start > 4.2) continue;
        all.push({side: n % 2 ? 'right' : 'left', start, gain: 1});
      }
      return all;
    }
    if (s.index === 1) {
      // A -> B -> absorbing plane. A stays still after the blocked return.
      const cycleLength = FIRST_PUSH + 2 * travel + PULSE_LENGTH + 1.3;
      const phaseTime = t % cycleLength;
      const cycleStart = t - phaseTime;
      const all = [{side:'left', start:cycleStart + FIRST_PUSH, gain:1}];
      if (phaseTime >= FIRST_PUSH + travel) all.push({side:'right', start:cycleStart + FIRST_PUSH + travel, gain:1, blocked:true});
      // Include previous cycle if its wave is still visibly present.
      if (t >= cycleLength) {
        all.push({side:'left', start:cycleStart - cycleLength + FIRST_PUSH, gain:1});
        all.push({side:'right', start:cycleStart - cycleLength + FIRST_PUSH + travel, gain:1, blocked:true});
      }
      return all;
    }
    if (s.index === 3) {
      const cycleLength = FIRST_PUSH + travel + 6.3;
      const phaseTime = t % cycleLength;
      const cycleStart = t - phaseTime;
      const all = [{side:'left',start:cycleStart+FIRST_PUSH,gain:1}];
      if (phaseTime >= FIRST_PUSH + travel) {
        all.push({side:'right',start:cycleStart+FIRST_PUSH+travel,gain:0.72,oscillator:true});
      }
      return all;
    }
    return [];
  }

  function rightWave(time) {
    if (time <= 0 || time >= 5.0) return 0;
    const rise = smoothstep(time / 0.35);
    const fall = smoothstep((5.0 - time) / 0.65);
    return rise * fall * Math.sin(TAU * 1.15 * time);
  }

  function sourceValue(event, t) {
    return (event.oscillator ? rightWave(t - event.start) : pulse(t - event.start)) * event.gain;
  }

  function valueAt(s, x, y, g, ev) {
    const sx = ev.side === 'left' ? g.left : g.right;
    const dx = x - sx, dy = y - g.y;
    const r = Math.hypot(dx, dy);
    const retardedTime = s.time - ev.start - r / g.speed;
    if (retardedTime < 0) return 0;
    const v = ev.oscillator ? rightWave(retardedTime) : pulse(retardedTime);
    if (v === 0) return 0;
    if (ev.blocked) {
      // A schematic directional stop: the returning field fades as it
      // approaches the idealized isolator, never appearing to its left.
      const fade = smoothstep((x - g.barrier) / 35);
      if (fade <= 0) return 0;
      return v * ev.gain * fade * radiationPattern(dx, dy, r);
    }
    return v * ev.gain * radiationPattern(dx, dy, r);
  }

  function radiationPattern(dx, dy, radius) {
    const verticalDipolePattern = 0.13 + 0.87 * (dx * dx + 120) / (radius * radius + 120);
    const attenuation = 1 / Math.sqrt(1 + radius / 180);
    return verticalDipolePattern * attenuation;
  }

  function background(c, s) {
    const {w, h} = s;
    c.fillStyle = '#07131f';
    c.fillRect(0, 0, w, h);
    const glow = c.createRadialGradient(w/2, h*.5, 8, w/2, h*.5, w*.65);
    glow.addColorStop(0, '#112c40');
    glow.addColorStop(1, '#07131f');
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
  }

  function line(c, x, y, xx, yy, color, width=1) {
    c.strokeStyle = color; c.lineWidth = width;
    c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.stroke();
  }

  function arrow(c, x, y, v) {
    const strength = Math.min(1, Math.abs(v));
    const up = v >= 0 ? -1 : 1;
    const length = 4 + 17 * strength;
    const alpha = 0.16 + 0.80 * strength;
    const color = v >= 0 ? '119,220,247' : '248,176,130';
    const rgba = 'rgba(' + color + ',' + alpha.toFixed(3) + ')';
    const ya = y - up * length / 2, yb = y + up * length / 2;
    line(c, x, ya, x, yb, rgba, 1.4);
    line(c, x, yb, x - 3.4, yb - up * 4.5, rgba, 1.15);
    line(c, x, yb, x + 3.4, yb - up * 4.5, rgba, 1.15);
  }

  function wavefronts(c, s, g, ev) {
    const elapsed = s.time - ev.start;
    if (elapsed <= 0) return;
    for (const u of [0.16,0.42,0.70]) {
      const r = g.speed * (elapsed - PULSE_LENGTH * u);
      if (r < 5 || r > s.w * 1.6) continue;
      c.save();
      c.strokeStyle = ev.side === 'left' ? 'rgba(108,220,245,.16)' : 'rgba(239,179,139,.17)';
      c.lineWidth = 1.1;
      c.beginPath();
      c.arc(ev.side === 'left' ? g.left : g.right, g.y, r, 0, TAU);
      if (ev.blocked) {
        // Clip reflected rings on the source side of the barrier.
        c.beginPath();c.rect(g.barrier,0,s.w-g.barrier,s.h);c.clip();
        c.beginPath();c.arc(g.right,g.y,r,0,TAU);
      }
      c.stroke();c.restore();
    }
  }

  function movingDot(c, x, y, q, title, active) {
    line(c,x,y-35,x,y+35,'rgba(245,216,177,.19)',1);
    c.save();
    c.shadowBlur = active ? 20 : 7;
    c.shadowColor = '#f6ce88';
    c.fillStyle = '#ffda9b';
    c.beginPath();c.arc(x,y-21*q,7.3,0,TAU);c.fill();c.restore();
    c.textAlign='center';c.font='12px system-ui';c.fillStyle='#e3d6bd';
    c.fillText(title,x,y+53);
  }

  function drawScope(c, s, g, onset) {
    const x0=s.w*.33, x1=s.w*.95, y=s.h*.83;
    const half=22, span=3.0;
    c.save();
    c.fillStyle='rgba(5,12,19,.79)';
    c.fillRect(x0-8,y-half-17,x1-x0+16,half*2+42);
    line(c,x0,y,x1,y,'rgba(179,198,207,.30)',1);
    c.font='11px system-ui';c.textAlign='left';c.fillStyle='#d7c292';
    c.fillText('Right-charge motion / sampled waveform',x0,y-half-24);
    const phaseTime=s.time-onset;
    if(phaseTime<=0){c.fillStyle='#889da8';c.fillText('Waiting for the incoming wave...',x0+8,y+4);c.restore();return;}
    const to=Math.min(span,phaseTime);
    c.beginPath();c.strokeStyle='#91dbfb';c.lineWidth=2.0;
    const samples=180;
    for(let i=0;i<=samples;i++){
      const tm=(i/samples)*to, xx=x0+(x1-x0)*tm/span;
      const yy=y-half*rightWave(tm);
      if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
    }
    c.stroke();
    let decoded='';
    for(let k=0;k<7;k++){
      for(const [fraction,digit] of [[.25,'1'],[.75,'0']]){
        const at=(k+fraction)/1.15;
        if(at>to)continue;
        const xx=x0+(x1-x0)*at/span;
        if(xx>x1)continue;
        const yy=y-half*rightWave(at);
        c.fillStyle='#f5d194';c.beginPath();c.arc(xx,yy,3.2,0,TAU);c.fill();
        c.textAlign='center';c.font='bold 11px ui-monospace,monospace';
        c.fillText(digit,xx,yy+(digit==='1'?-12:17));
        decoded+=digit;
      }
    }
    c.fillStyle='#c0d0d7';c.textAlign='left';c.font='11px ui-monospace,monospace';
    c.fillText('Captured: '+(decoded||'...'),x0,y+half+30);
    c.restore();
  }

  function phaseLabel(s, text) {
    // Keep the current phase in a readable caption beneath the canvas.
    // Avoid duplicating this text over the moving vector field.
    if(s.phaseNode)s.phaseNode.textContent=text;
    s.canvas.dataset.phase=text;
  }

  function draw(s) {
    const c=s.ctx, g=geometry(s);
    background(c,s);
    const ev=events(s,g);
    const t=s.time,travel=(g.right-g.left)/g.speed;
    const leftDriven = ev.filter(e=>e.side==='left').reduce((v,e)=>v+sourceValue(e,t),0);
    const rightDriven = ev.filter(e=>e.side==='right').reduce((v,e)=>v+sourceValue(e,t),0);

    for(const pt of s.grid){
      let v=0;
      if(s.index===2||s.index===4){
        const r=Math.hypot(pt.x-g.left,pt.y-g.y);
        v=carrier(t-r/g.speed)*radiationPattern(pt.x-g.left,pt.y-g.y,r);
      }else{
        for(const e of ev) v+=valueAt(s,pt.x,pt.y,g,e);
      }
      arrow(c,pt.x,pt.y,clamp(v,-1,1));
    }

    if(s.index===1){
      const barrier=g.barrier;
      c.fillStyle='rgba(236,200,130,.10)';c.fillRect(barrier-8,55,16,s.h*.8-42);
      line(c,barrier,55,barrier,s.h*.8+12,'rgba(249,210,136,.90)',2);
      c.textAlign='center';c.fillStyle='#f1d5a7';c.font='11px system-ui';c.fillText('ONE-WAY LAYER',barrier,50);
      const cycle=FIRST_PUSH+2*travel+PULSE_LENGTH+1.3;
      const local=t%cycle;
      const hit=FIRST_PUSH+travel+(g.right-barrier)/g.speed;
      const flash=Math.exp(-Math.pow((local-hit)/.27, 2));
      if(flash>.05){c.fillStyle='rgba(250,133,122,'+(flash*.65)+')';c.fillRect(barrier-6,g.y-43,12,86);}
    }
    if(s.index===0||s.index===1||s.index===3){
      for(const e of ev)wavefronts(c,s,g,e);
    }

    if(s.index===2||s.index===4){
      const transmitted=carrier(t),received=carrier(t-travel);
      movingDot(c,g.left,g.y,transmitted,s.index===4?'RAM / TX':'TRANSMITTER',Math.abs(transmitted)>.1);
      movingDot(c,g.right,g.y,received,s.index===4?'CPU / RX':'RECEIVER',Math.abs(received)>.1);
      if(s.index===2){
        const sy=s.h*.84,from=g.left+14,to=g.right-12;
        line(c,from,sy,to,sy,'rgba(188,212,225,.25)',1);
        c.beginPath();c.strokeStyle='#e9d19f';c.lineWidth=1.7;
        for(let i=0;i<=220;i++){
          const x=from+(to-from)*i/220,v=carrier(t-(x-g.left)/g.speed);
          const y=sy-v*16;if(i)c.lineTo(x,y);else c.moveTo(x,y);
        }c.stroke();
        const n=Math.floor(t/.36);
        phaseLabel(s,'III / BPSK transmitter: symbol '+(n%BITS.length+1)+' / 144, bit '+bit(n));
        const bitText=document.getElementById('current-bit');
        if(bitText)bitText.textContent='Symbol '+(n%BITS.length+1)+' / 144: '+bit(n);
      }else{
        phaseLabel(s,'V / RAM field link: waves carry phase-coded symbols toward the CPU');
        c.textAlign='left';c.font='11px system-ui';c.fillStyle='#b9c7cd';
        c.fillText('MEMORY CELLS',19,s.h-12);
        for(let k=0;k<8;k++){
          c.fillStyle=bit(Math.floor(t/.36)+k)?'#ebc98f':'#405f73';
          c.fillRect(g.left-38+(k%4)*18,s.h-60+Math.floor(k/4)*15,12,8);
        }
      }
    }else{
      movingDot(c,g.left,g.y,leftDriven,s.index===3?'TRIGGER / A':'CHARGE A',Math.abs(leftDriven)>.025);
      movingDot(c,g.right,g.y,rightDriven,s.index===3?'RECEIVER / B':'CHARGE B',Math.abs(rightDriven)>.025);
      if(s.index===0){
        const n=Math.floor((t-FIRST_PUSH)/travel);
        phaseLabel(s,n<0?'I / Left charge is about to move':n%2===0?'I / Left charge moves once; its field travels to B':'I / Right charge responds; its field travels back to A');
      }else if(s.index===1){
        const cycle=FIRST_PUSH+2*travel+PULSE_LENGTH+1.3,local=t%cycle;
        let desc='II / Left charge makes one push';
        if(local>=FIRST_PUSH+travel)desc='II / Right charge wobbles and emits a returning wave';
        if(local>=FIRST_PUSH+travel+(g.right-g.barrier)/g.speed)desc='II / The return hits the layer and stops; left stays still';
        phaseLabel(s,desc);
      }else{
        const cycle=FIRST_PUSH+travel+6.3,local=t%cycle;
        const onset=t-local+FIRST_PUSH+travel;
        phaseLabel(s,local<FIRST_PUSH+travel?'IV / Waiting for the incoming trigger':'IV / Right charge wobbles; crests 1, troughs 0');
        drawScope(c,s,g,onset);
      }
    }
  }

  SCENE_IDS.forEach(createScene);
  if(typeof ResizeObserver !== 'undefined'){
    const resizeObserver = new ResizeObserver(entries=>{
      for(const entry of entries){
        const scene=scenes.get(entry.target.id);
        if(!scene)continue;
        const w=entry.contentRect.width,h=entry.contentRect.height;
        if(Math.abs(w-scene.w)>1||Math.abs(h-scene.h)>1)resize(scene);
      }
    });
    scenes.forEach(s=>resizeObserver.observe(s.canvas));
  }else window.addEventListener('resize',()=>scenes.forEach(resize),{passive:true});

  if(typeof IntersectionObserver !== 'undefined'){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const s=scenes.get(entry.target.id);if(!s)continue;
        s.visible=entry.isIntersecting;
        if(s.visible&&!s.seen){s.seen=true;s.time=0;draw(s);}
        s.last=0;
      }
    },{threshold:0.02});
    scenes.forEach(s=>observer.observe(s.canvas));
  }else scenes.forEach(s=>{s.visible=true;s.seen=true;});

  document.addEventListener('visibilitychange',()=>scenes.forEach(s=>{s.last=0;}));
  function tick(now){
    for(const s of scenes.values()){
      if(!s.visible||!s.playing) {s.last=0;continue;}
      const seconds=s.last?Math.min(.045,(now-s.last)/1000):0;
      s.last=now;s.time+=seconds*s.speed;
      if(s.index===0 && s.time>80)s.time=0;
      if((s.index===2||s.index===4)&&s.time>100)s.time=0;
      draw(s);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Diagnostics available only on local test pages opened with ?debug=1.
  if(new URLSearchParams(window.location.search).has('debug') || window.__runWaveTest){
    window.__ideaWaveDebug={
      seek(id,time){const s=scenes.get(id);if(!s)return; s.time=time;draw(s);},
      phase(id){return scenes.get(id)?.canvas.dataset.phase;},
      snapshot(id){const s=scenes.get(id);return s?{t:s.time,phase:s.canvas.dataset.phase,w:s.w,h:s.h}:null;}
    };
  }
})();
