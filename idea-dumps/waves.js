(() => {
  'use strict';
  const TAU = 2 * Math.PI;
  const PHRASE = 'I love you Trishna';
  const BITS = Array.from(new TextEncoder().encode(PHRASE)).map(v => v.toString(2).padStart(8, '0')).join('');
  const ids = ['scene-one','scene-two','scene-three','scene-four','scene-five'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scenes = new Map();

  function create(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {alpha: false});
    if (!ctx) return;
    const s = {id,canvas,ctx,w:0,h:0,t:0,last:0,speed:1,playing:!reduceMotion,visible:true};
    scenes.set(id,s);
    resize(s);
    const toggle = document.querySelector('[data-toggle="' + id + '"]');
    if (toggle) {
      toggle.textContent = s.playing ? 'Pause animation' : 'Play animation';
      toggle.addEventListener('click', () => {
        s.playing = !s.playing;
        toggle.textContent = s.playing ? 'Pause animation' : 'Play animation';
        if (s.playing) s.last = 0;
      });
    }
    const speed = document.querySelector('[data-speed="' + id + '"]');
    if (speed) speed.addEventListener('input', () => { s.speed = Number(speed.value); });
    draw(s);
  }

  function resize(s) {
    const rect = s.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    s.w = Math.max(280,rect.width);
    s.h = Math.max(200,rect.height);
    s.canvas.width = Math.round(s.w * dpr);
    s.canvas.height = Math.round(s.h * dpr);
    s.ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(s);
  }

  function circle(c,x,y,r,fill,glow=0) {
    c.save();
    c.fillStyle=fill;c.shadowColor=fill;c.shadowBlur=glow;
    c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
  }

  function line(c,x1,y1,x2,y2,color,width=1) {
    c.beginPath();c.strokeStyle=color;c.lineWidth=width;
    c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  }
  function arrow(c,x,y,vx,vy,color,alpha) {
    const size = Math.hypot(vx,vy);
    if (size<0.00001)return;
    const ux=vx/size, uy=vy/size;
    const len=6 + Math.min(12,size*12);
    const ax=x-ux*len/2,ay=y-uy*len/2;
    const bx=x+ux*len/2,by=y+uy*len/2;
    const col='rgba('+color+','+alpha.toFixed(3)+')';
    line(c,ax,ay,bx,by,col,1.35);
    const head=4;
    line(c,bx,by,bx-ux*head-uy*head*.57,by-uy*head+ux*head*.57,col,1.25);
    line(c,bx,by,bx-ux*head+uy*head*.57,by-uy*head-ux*head*.57,col,1.25);
  }
  function background(s) {
    const {ctx:c,w,h}=s;
    c.fillStyle='#050a11';c.fillRect(0,0,w,h);
    const gradient=c.createRadialGradient(w*.5,h*.5,5,w*.5,h*.5,w*.7);
    gradient.addColorStop(0,'rgba(25,46,62,.36)');
    gradient.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=gradient;c.fillRect(0,0,w,h);
    line(c,0,h*.56,w,h*.56,'rgba(119,144,158,.18)',1);
  }
  function labels(s,title,sub) {
    const c=s.ctx;c.textAlign='left';
    c.font='600 11px system-ui';c.fillStyle='#e4c994';c.fillText(title,15,22);
    c.font='11px system-ui';c.fillStyle='#9db4c0';c.fillText(sub,15,39);
  }
  const origin = (s,side) => ({x:s.w*(side==='right'?.79:.21),y:s.h*.57});
  // A deliberately simplified transverse radiation field:
  // E proportional to sin(theta) * acceleration(t-r/v) / sqrt(r)
  // with a finite, smooth source radius. The time-retarded source supplies
  // the visible outward-moving phase fronts. This is not a Maxwell solver.
  function oscillator(t) {return Math.sin(TAU*1.05*t);}
  function gate(t,delay=0) {
    const x=t-delay;
    return x<=0 ? 0 : Math.min(1,x/.45);
  }
  function field(x,y,t,src,params={}) {
    const dx=x-src.x,dy=y-src.y;
    const r=Math.hypot(dx,dy);
    const effectiveR=Math.sqrt(r*r+14*14);
    const ux=dx/effectiveR,uy=dy/effectiveR;
    const speed=params.speed || 110;
    const rt=t-r/speed;
    if (rt<0)return {x:0,y:0,amp:0};
    const amp=gate(rt,params.start||0)*Math.sin(TAU*(params.freq||1.05)*rt+(params.phase||0));
    const atten = 2.9 / Math.sqrt(1+r/33);
    const transverse=Math.max(.03, 1-uy*uy);
    const ey=amp*atten*transverse;
    const ex=-ey*ux*uy*.65;
    return {x:ex,y:ey,amp:Math.abs(amp)*atten*transverse};
  }
  function composite(x,y,s,mode) {
    const left=origin(s,'left'),right=origin(s,'right');
    const a=field(x,y,s.t,left);
    if(mode===1) {
      // Reverse response arrives at B after the forward propagation delay,
      // then travels back toward A: schematic two-way coupling.
      const b=field(x,y,s.t,right,{start:(right.x-left.x)/110,phase:-.45});
      return {x:a.x+b.x*.7,y:a.y+b.y*.7,amp:a.amp+b.amp*.7};
    }
    if(mode===2) {
      const b=field(x,y,s.t,right,{start:(right.x-left.x)/110,phase:-.45});
      const boundary=(left.x+right.x)*.5;
      const screen=1/(1+Math.exp(-Math.max(-40,Math.min(40,(x-boundary+10)/8))));
      // Leftwards moving radiation is suppressed through the isolator.
      return {x:a.x+b.x*screen*.62,y:a.y+b.y*screen*.62,amp:a.amp+b.amp*screen*.62};
    }
    if(mode===3) return bpskField(x,y,s,left);
    return a;
  }
  function bitAt(symbol) {
    return BITS[((symbol%BITS.length)+BITS.length)%BITS.length]==='1'?1:0;
  }
  function carrier(time) {
    if(time<0)return 0;
    // Whole carrier cycles inside each bit interval make each bit boundary
    // a zero crossing. This avoids discontinuous line jumps on bit changes.
    const symbol=Math.floor(time*2.25);
    const local=time*2.25-symbol;
    return Math.sin(TAU*3*local+Math.PI*bitAt(symbol));
  }
  function bpskField(x,y,s,src) {
    const dx=x-src.x,dy=y-src.y;
    const r=Math.hypot(dx,dy);
    const u=dy/Math.max(14,r);
    const ret=s.t-r/128;
    if(ret<=0)return {x:0,y:0,amp:0};
    const v=carrier(ret)*gate(ret);
    const a=3.1/Math.sqrt(1+r/40)*(1-u*u);
    return {x:-u*dx/Math.max(r,14)*v*a*.65,y:v*a,amp:Math.abs(v*a)};
  }
  function pixelVectorGrid(s,mode) {
    const c=s.ctx;
    const spacing=s.w<520?24:22;
    const yStart=63;
    const xStart=13;
    for(let y=yStart;y<s.h-13;y+=spacing) {
      for(let x=xStart;x<s.w-11;x+=spacing) {
        const f=composite(x,y,s,mode);
        const mag=Math.hypot(f.x,f.y);
        // Keep the neutral lattice visible so a passing wavefront
        // is a recognizable change in local arrow orientation.
        const vx=f.x*.68, vy=f.y*.68+.095;
        const alpha=Math.min(.98,.19+mag*.42);
        arrow(c,x,y,vx,vy,'102,211,245',alpha);
      }
    }
  }
  function particles(s,mode) {
    const c=s.ctx;const a=origin(s,'left'),b=origin(s,'right');
    const span=(b.x-a.x)/110;
    const dyA=13*oscillator(s.t)*gate(s.t);
    const dyB=13*oscillator(s.t-span)*gate(s.t,span);
    line(c,a.x,a.y-36,a.x,a.y+36,'rgba(249,220,173,.23)');
    line(c,b.x,b.y-36,b.x,b.y+36,'rgba(249,220,173,.23)');
    circle(c,a.x,a.y+dyA,7,'#ffd18a',14);
    circle(c,b.x,b.y+dyB,7,'#ffd18a',14);
    c.fillStyle='#e9d4ac';c.font='11px system-ui';c.textAlign='center';
    c.fillText(mode===1?'CHARGE A':'TX',a.x,a.y+57);
    c.fillText(mode===1?'CHARGE B':'RX',b.x,b.y+57);
  }
  function isolator(s) {
    const c=s.ctx,x=s.w*.5;
    c.fillStyle='rgba(218,184,119,.075)';c.fillRect(x-9,52,18,s.h-67);
    line(c,x-9,52,x-9,s.h-15,'rgba(242,194,103,.7)',1.7);
    line(c,x+9,52,x+9,s.h-15,'rgba(242,194,103,.7)',1.7);
    c.textAlign='center';c.fillStyle='#f4d298';c.font='10px system-ui';
    c.fillText('ONE-WAY LAYER',x,56);
    // Incoming reverse pulses appear only to the right of the isolator.
    const b=origin(s,'right'),right=b.x;
    const t=s.t - (right-origin(s,'left').x)/110;
    if(t>0) {
      let progress=((t*.65)%1);
      const xPulse=right-progress*(right-(x+15));
      if(xPulse>x+15) {
        circle(c,xPulse,s.h*.57,Math.max(1.5,3*Math.sin(Math.PI*progress)),'rgba(255,128,153,.65)');
      }
    }
  }
  function bpskTrace(s) {
    const c=s.ctx;
    const a=origin(s,'left'),b=origin(s,'right');
    const left=a.x+12,right=b.x-12;
    const N=Math.max(160,Math.floor(right-left));
    c.beginPath();c.lineWidth=2.15;c.strokeStyle='#99e4fc';
    for(let i=0;i<=N;i++) {
      const x=left+(right-left)*i/N;
      const ret=s.t-(x-a.x)/128;
      const val=ret>=0 ? carrier(ret)*gate(ret) : 0;
      const y=s.h*.57-val*17;
      if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
    }
    c.stroke();
    const index=Math.floor(s.t*2.25)%BITS.length;
    const el=document.getElementById('current-bit');
    if(el)el.textContent='Symbol '+(index+1)+' / 144 · bit '+bitAt(index);
  }
  function block(s,x,title) {
    const c=s.ctx,y=s.h*.57;
    c.fillStyle='#182c3b';c.strokeStyle='#97bacc';c.lineWidth=1.3;
    c.beginPath();c.roundRect(x-37,y-22,74,44,6);c.fill();c.stroke();
    c.fillStyle='#ecedec';c.textAlign='center';c.font='600 12px system-ui';
    c.fillText(title,x,y+4);
  }
  function packet(s) {
    const c=s.ctx,a=origin(s,'left'),b=origin(s,'right');
    const p=((s.t*.34)%1+1)%1;
    const x=a.x+(b.x-a.x)*p,y=s.h*.57;
    c.save();c.strokeStyle='rgba(241,203,128,.82)';c.lineWidth=1.5;
    for(let j=1;j<=3;j++) {
      c.beginPath();c.ellipse(x,y,5+j*4,8+j*4,0,0,TAU);c.stroke();
    }
    c.restore();
  }
  function draw(s) {
    if(!s.w||!s.h)return;
    background(s);
    const mode=ids.indexOf(s.id)+1;
    pixelVectorGrid(s,mode);
    if(mode===2)isolator(s);
    if(mode===3)bpskTrace(s);
    if(mode<=3)particles(s,mode);
    if(mode===4||mode===5) {
      if(mode===5) {
        const a=origin(s,'left');
        for(let i=0;i<8;i++) {
          circle(s.ctx,a.x-24+(i%4)*16,a.y-54+Math.floor(i/4)*14,2.5,bitAt(Math.floor(s.t*2.25)+i)?'#f4cd8f':'#587584');
        }
      }
      block(s,origin(s,'left').x,'RAM');
      block(s,origin(s,'right').x,'CPU');
      packet(s);
    }
    const titles=[
      ['TWO VIBRATING CHARGES','Retarded disturbances in a 2D field'],
      ['DIRECTIONAL LAYER','A hypothetical nonreciprocal screen'],
      ['BINARY PHASE-SHIFT KEYING','144 bits • “I love you Trishna”'],
      ['FREE-SPACE MEMORY LINK','Direct propagation between memory and CPU'],
      ['RAM → FIELD → CPU','Address • modulate • transmit • decode']
    ];
    labels(s,...titles[mode-1]);
  }
  ids.forEach(create);
  window.addEventListener('resize',()=>scenes.forEach(resize),{passive:true});
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const s=scenes.get(entry.target.id);
    if(s){s.visible=entry.isIntersecting;s.last=0;}
  }),{threshold:0.01});
  scenes.forEach(s=>observer.observe(s.canvas));
  document.addEventListener('visibilitychange',()=>scenes.forEach(s=>s.last=0));
  function animate(now) {
    scenes.forEach(s=>{
      if(!s.visible||!s.playing){s.last=now;return;}
      const dt=s.last ? Math.min(.05,(now-s.last)/1000) : 0;
      s.last=now;s.t+=dt*s.speed;
      draw(s);
    });
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();