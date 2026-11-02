(()=>{
"use strict";
const field=document.getElementById("fdtd-field");if(!field)return;
const ctx=field.getContext("2d"),scope=document.getElementById("fdtd-scope").getContext("2d");
const modeControl=document.getElementById("fdtd-mode"),play=document.getElementById("fdtd-play"),reset=document.getElementById("fdtd-reset"),speed=document.getElementById("fdtd-speed"),caption=document.getElementById("fdtd-caption"),status=document.getElementById("fdtd-status");
const W=240,H=144,L=W*H,dt=.42,TAU=Math.PI*2;
const e=new Float32Array(L),hx=new Float32Array(L),hy=new Float32Array(L),sponge=new Float32Array(L),material=new Float32Array(L);
const samples=new Float32Array(400),drivers=new Float32Array(400);
const bits=Array.from(new TextEncoder().encode("I love you Trishna"),n=>n.toString(2).padStart(8,"0")).join("");
let time=0,pos=0,mode=0,running=true,visible=true,last=0,carry=0;
const PULSE=64,LOOP=1150,TRAVEL=355;
let responseAt=-1,receiverWobble=0,leftWobble=0,arrived=false,decoded="",sampleIndex=0;
const image=ctx.createImageData(W,H);
const explanations=[
"One up-and-down push creates a finite electromagnetic pulse. When it reaches the right receiver, the right charge makes one wobble and sends a response wave back. When the response returns, the left charge wobbles again. This idealized coupling repeats.",
"The left pulse reaches the receiver, which emits a response. A time-controlled absorbing screen activates before the response returns, so the original charge stays still. A real nonreciprocal device needs additional material physics.",
"A lossy sheet attenuates fields crossing it, from either side. It is not a directional isolator.",
"I love you Trishna (my dear wife's name): the source transmits a 144-bit BPSK message. After the right receiver begins wobbling, a sine-like pickup trace shows how crests and troughs can be sampled into symbolic 1 and 0 values.",
"A memory-side current modulator sends a signal to a processor-side field probe. RAM addressing and decoding are conceptual."
];
function bit(i){return Number(bits[((i%bits.length)+bits.length)%bits.length]);}
function pulse(t){if(t<0||t>=PULSE)return 0;const u=t/PULSE;return Math.sin(TAU*u)*Math.pow(Math.sin(Math.PI*u),2);}
function source(){
 if(mode<2)return pulse(time%LOOP);
 if(mode===2)return Math.sin(TAU*time/24);const k=Math.floor(time/96),v=time%96;const a=Math.min(1,v/20);const smooth=a*a*(3-2*a);return Math.sin(TAU*time/24+Math.PI*(bit(k-1)+(bit(k)-bit(k-1))*smooth));}
function initialize(){
 e.fill(0);hx.fill(0);hy.fill(0);samples.fill(0);drivers.fill(0);time=0;pos=0;responseAt=-1;receiverWobble=0;leftWobble=0;arrived=false;decoded="";sampleIndex=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=Math.min(x,y,W-1-x,H-1-y),z=Math.max(0,(18-d)/18);sponge[i]=.12*z*z*z;material[i]=mode===2&&x>118&&x<125?.09:0;}
 caption.textContent=explanations[mode];render();
}
function advance(){
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const i=y*W+x;hx[i]-=dt*(e[i+W]-e[i]);hy[i]+=dt*(e[i+1]-e[i]);}
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;e[i]=e[i]*(1-sponge[i]-material[i])+dt*((hy[i]-hy[i-1])-(hx[i]-hx[i-W]));}
 const tx=45,ty=72,signal=source();
 const cycle=time%LOOP;
 if(mode<2&&cycle===0){responseAt=-1;arrived=false;receiverWobble=0;leftWobble=0;}
 // In scene II the right-to-left reply meets a gated absorber.
 if(mode===1){
  const active=responseAt>=0&&cycle>responseAt+PULSE+17;
  for(let y=1;y<H-1;y++)for(let x=119;x<=126;x++)material[y*W+x]=active?.32:0;
 }
 leftWobble=mode<2?signal:signal;

 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)e[(ty+y)*W+tx+x]+=.045*signal*Math.exp(-(x*x+y*y)/3);
 const rx=72*W+193;
 if(mode<2){
  if(!arrived&&cycle>220&&Math.abs(e[rx])>.000025){arrived=true;responseAt=cycle;}
  receiverWobble=responseAt>=0?pulse(cycle-responseAt):0;
  if(receiverWobble!==0){
   for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)
    e[(72+y)*W+193+x]+=.044*receiverWobble*Math.exp(-(x*x+y*y)/3);
  }
  // Physical return field is read from the same Yee grid; the left-dot
  // movement is driven by that local field only after a round trip.
  if(mode===0&&responseAt>=0&&cycle>responseAt+280)leftWobble=Math.max(-1,Math.min(1,e[72*W+45]*36));
 }
 if(mode===3){
  // A visual detector: it starts once the field has reached the probe.
  receiverWobble=time>260?Math.max(-1,Math.min(1,e[rx]*33)):0;
  if(time>280&&time%12===0&&Math.abs(receiverWobble)>.07){
   decoded+=(receiverWobble>0?"1":"0");
   decoded=decoded.slice(-28);
  }
 }
 samples[pos]=mode===3?receiverWobble*.06:e[rx];drivers[pos]=signal*.06;pos=(pos+1)%samples.length;time++;
}
function plot(){
 const c=scope,w=640,h=110;c.fillStyle="#091522";c.fillRect(0,0,w,h);
 c.strokeStyle="#455766";c.beginPath();c.moveTo(0,55);c.lineTo(w,55);c.stroke();
 for(const [buffer,color] of [[drivers,"#e9be7b"],[samples,"#79daf4"]]){
 c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();
 for(let x=0;x<w;x++){const i=(pos+Math.floor(x/w*400))%400,v=buffer[i],y=55-Math.max(-48,Math.min(48,v*500));if(x===0)c.moveTo(x,y);else c.lineTo(x,y);}
 c.stroke();
 }
}
function render(){
 const p=image.data;
 for(let i=0;i<L;i++){const v=e[i],a=Math.min(1,Math.abs(v)*7),j=4*i,bar=material[i]>.01;p[j]=bar?110:Math.floor(6+a*(v>=0?232:35));p[j+1]=bar?83:Math.floor(13+a*(v>=0?104:170));p[j+2]=bar?40:Math.floor(24+a*(v>=0?62:218));p[j+3]=255;}
 ctx.putImageData(image,0,0);
 for(const x of [45,193]){ctx.strokeStyle="#ffdaa2";ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,72,4,0,TAU);ctx.stroke();}
 // Dot positions are actual sampled source / response amplitudes.
 const wobbleLeft=mode<2?leftWobble:signal;
 const wobbleRight=mode===0||mode===1||mode===3?receiverWobble:Math.max(-1,Math.min(1,e[72*W+193]*33));
 ctx.fillStyle="#ffe4ac";
 for(const [x,w] of [[45,wobbleLeft],[193,wobbleRight]]){
  ctx.beginPath();ctx.arc(x,72-9*w,2.8,0,TAU);ctx.fill();
 }
 plot();
 if(mode===3){scope.fillStyle="#ffe0a1";scope.font="12px monospace";scope.fillText("Crest=1 / trough=0: "+(decoded||"waiting for arrival"),9,16);}
 const symbol=Math.floor(time/96);
 status.textContent="Step "+time+" · source-to-probe distance 148 cells"+(mode<2?" · "+(!arrived?"outgoing pulse":mode===1?"return absorbed by switched screen":"return wave traveling") : mode===3?" · sampled "+(decoded||"…")+" · transmitted bit "+bit(symbol):mode===4?" · transmitted bit "+bit(symbol):"");

}
modeControl.addEventListener("change",()=>{mode=Number(modeControl.value);initialize();});
play.addEventListener("click",()=>{running=!running;play.textContent=running?"Pause":"Play";});
reset.addEventListener("click",initialize);
if(typeof IntersectionObserver!=="undefined")new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(field);
if(matchMedia("(prefers-reduced-motion: reduce)").matches){running=false;play.textContent="Play";}
function frame(now){if(running&&visible){if(mode<2&&time>LOOP)initialize();carry+=Math.min(50,last?now-last:16)*Number(speed.value)/20;const steps=Math.min(20,Math.floor(carry));carry-=steps;for(let i=0;i<steps;i++)advance();render();}last=now;requestAnimationFrame(frame);}
initialize();requestAnimationFrame(frame);
})();