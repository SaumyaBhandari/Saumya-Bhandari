(() => {
"use strict";
const TAU=Math.PI*2, ids=["scene-one","scene-two","scene-three","scene-four","scene-five"];
const message="I love you Trishna";
const bits=Array.from(new TextEncoder().encode(message),n=>n.toString(2).padStart(8,"0")).join("");
const scenes=[];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const sin=Math.sin,cos=Math.cos,hyp=Math.hypot;
const C=142, HZ=1.5, BITRATE=3;
function bit(n){return Number(bits[((n%bits.length)+bits.length)%bits.length]);}
// Smooth coherent BPSK: use carrier with integer cycles/symbol and
// a short smooth phase transition inside each symbol boundary.
function binaryCarrier(t){
 if(t<0)return 0;
 const k=Math.floor(t*BITRATE),u=t*BITRATE-k;
 const previous=bit(k-1),current=bit(k);
 const transition=Math.min(1,Math.max(0,u/.22));
 const blend=transition*transition*(3-2*transition);
 const phase=Math.PI*(previous+(current-previous)*blend);
 return sin(TAU*4*u+phase);
}
function sourceSignal(t,encoded){
 if(t<0)return 0;
 const startup=Math.min(1,t/0.35);
 return startup*(encoded?binaryCarrier(t):sin(TAU*HZ*t));
}
function fieldAt(px,py,s,side,encoded){
 const srcX=s.w*(side==="left"?.18:.82), srcY=s.h*.59;
 const dx=px-srcX,dy=py-srcY,r=hyp(dx,dy);
 const time=s.time-r/C;
 if(time<0)return 0;
 // A simplified radiative dipole cross-section. Finite core radius
 // prevents a singularity at the drawn charge.
 const angular=(dx*dx+100)/(r*r+100);
 const envelope=1/Math.sqrt(1+r/62);
 return sourceSignal(time,encoded)*envelope*angular;
}
function totalField(x,y,s){
 const m=s.mode,base=fieldAt(x,y,s,"left",m===3);
 if(m===1){
  const delay=(s.w*.64)/C;
  // Idealized return response starts after arrival at B.
  const former=s.time;s.time=former-delay;
  const back=fieldAt(x,y,s,"right",false)*.68;
  s.time=former;return base+back;
 }
 if(m===2){
  const delay=(s.w*.64)/C,former=s.time;
  s.time=former-delay;
  const back=fieldAt(x,y,s,"right",false);
  s.time=former;
  const boundary=s.w*.5;
  const admit=Math.max(0,Math.min(1,(x-boundary)/27));
  return base+.6*back*admit;
 }
 return base;
}
function line(c,x,y,X,Y,color,width=1){
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();
}
function vector(c,x,y,value){
 const intensity=Math.min(1,Math.abs(value));
 const len=4+intensity*19;
 const up=value>=0?1:-1;
 const alpha=.25+.75*intensity;
 const color=value>=0?"91,220,244":"250,173,132";
 const stroke="rgba("+color+","+alpha+")";
 const a=y+len*up*.5,b=y-len*up*.5;
 line(c,x,a,x,b,stroke,1.6);
 const head=3.6;
 line(c,x,b,x-head,b+up*head*1.4,stroke,1.45);
 line(c,x,b,x+head,b+up*head*1.4,stroke,1.45);
}
function circle(c,x,y,r,color){
 c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}
function label(c,text,x,y,color="#bed1db",size=12){
 c.font=size+"px system-ui";c.fillStyle=color;c.fillText(text,x,y);
}
function draw(s){
 const c=s.context,w=s.w,h=s.h,t=s.time;
 c.fillStyle="#070e17";c.fillRect(0,0,w,h);
 c.textAlign="left";
 const names=["TWO CHARGES • FIELD RESPONSE","ONE-WAY LAYER • DIRECTIONAL FILTER","BINARY PHASE SHIFT KEYING • FIELD AND SIGNAL","DIRECT EM PROPAGATION • MEMORY LINK","RAM → TRANSMITTER → SPACE → RECEIVER → CPU"];
 label(c,names[s.mode-1],16,22,"#efd19a",11);
 label(c,"Cyan / coral arrows show signed field displacement · time slowed for visibility",16,42,"#91adbe",10);
 const bottom=h*.85, spacing=w<550?25:23;
 // The complete field consists of local arrows sampled independently.
 // No fake 3D ground plane or manually drawn discontinuous sine path.
 for(let y=68;y<bottom;y+=spacing){
  for(let x=17;x<w-10;x+=spacing){
   const f=totalField(x,y,s);
   vector(c,x,y,f);
  }
 }
 const ax=w*.18,bx=w*.82,cy=h*.59;
 if(s.mode===2){
  const x=w*.5;c.fillStyle="rgba(231,194,133,.13)";c.fillRect(x-7,58,14,bottom-54);
  line(c,x,58,x,bottom,"rgba(242,205,136,.85)",1.5);
  c.textAlign="center";label(c,"ISOLATOR",x-26,56,"#ecd29e",10);
 }
 if(s.mode===3){
  // Correctly sampled 1D signal: time at each location is retarded.
  // The phase is a smooth function of retarded time (no jumps).
  c.strokeStyle="#f5d487";c.lineWidth=2.2;c.beginPath();
  const x0=ax+12,x1=bx-12;
  for(let i=0;i<=320;i++){
   const x=x0+(x1-x0)*i/320;
   const v=sourceSignal(t-(x-ax)/C,true);
   const y=h*.79-v*17;
   if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
  }
  c.stroke();
  const i=Math.floor(t*BITRATE)%bits.length;
  const status=document.getElementById("current-bit");
  if(status)status.textContent="Symbol "+(i+1)+"/"+bits.length+": "+bit(i);
  label(c,"Coherent phase-coded carrier (field slice)",Math.max(14,ax-25),h*.92,"#b2c7d0",11);
 }
 const transmitted=sourceSignal(t,s.mode===3),delay=(bx-ax)/C;
 const received=sourceSignal(t-delay,s.mode===3);
 const chargeY=(v)=>cy-18*v;
 for(const [x,v,name] of [[ax,transmitted,s.mode>=4?"RAM / TX":"A / TX"],[bx,received,s.mode>=4?"CPU / RX":"B / RX"]]){
   line(c,x,cy-34,x,cy+34,"rgba(239,210,158,.24)");
   c.save();c.shadowColor="#f5ca7f";c.shadowBlur=17;circle(c,x,chargeY(v),8,"#ffd493");c.restore();
   c.textAlign="center";label(c,name,x-24,bottom+23,"#e2ebef",11);
 }
 if(s.mode>=4){
   label(c,"ADDRESS → MODULATE → PROPAGATE → DETECT",16,h-12,"#99bdcc",10);
 }
}
function resize(s){
 const rect=s.canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
 s.w=Math.max(280,rect.width);s.h=Math.max(200,rect.height);
 s.canvas.width=Math.round(s.w*dpr);s.canvas.height=Math.round(s.h*dpr);
 s.context.setTransform(dpr,0,0,dpr,0,0);draw(s);
}
ids.forEach((id,i)=>{
 const canvas=document.getElementById(id);
 if(!canvas)return;
 const ctx=canvas.getContext("2d");
 if(!ctx)return;
 const s={canvas,context:ctx,mode:i+1,w:300,h:250,time:0,speed:1,playing:!reduce,visible:true,last:0};
 scenes.push(s);
 const button=document.querySelector('[data-toggle="'+id+'"]');
 if(button){button.textContent=s.playing?"Pause animation":"Play animation";button.addEventListener("click",()=>{s.playing=!s.playing;s.last=0;button.textContent=s.playing?"Pause animation":"Play animation";});}
 const speed=document.querySelector('[data-speed="'+id+'"]');
 if(speed)speed.addEventListener("input",()=>{s.speed=Number(speed.value);});
 resize(s);
});
addEventListener("resize",()=>scenes.forEach(resize),{passive:true});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
 const s=scenes.find(v=>v.canvas===e.target);
 if(s){s.visible=e.isIntersecting;s.last=0;}
}));
scenes.forEach(s=>observer.observe(s.canvas));
document.addEventListener("visibilitychange",()=>scenes.forEach(s=>s.last=0));
function tick(now){
 for(const s of scenes){
  if(!s.playing||!s.visible){s.last=0;continue;}
  const dt=s.last?Math.min(.045,(now-s.last)/1000):0;
  s.last=now;s.time+=dt*s.speed;draw(s);
 }
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();