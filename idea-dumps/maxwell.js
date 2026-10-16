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
const image=ctx.createImageData(W,H);
const explanations=["A localized oscillating current creates an electromagnetic disturbance that propagates outward.","The arriving field drives a small secondary current at the receiver. Coupling is deliberately simplified.","A lossy sheet attenuates fields crossing it, from either side. It is not a directional isolator.","Phase modulation carries the 144-bit message I love you Trishna across the numerical field.","A memory-side current modulator sends a signal to a processor-side field probe. RAM addressing and decoding are conceptual."];
function bit(i){return Number(bits[((i%bits.length)+bits.length)%bits.length]);}
function source(){if(mode<3)return Math.sin(TAU*time/24);const k=Math.floor(time/96),v=time%96;const a=Math.min(1,v/20);const smooth=a*a*(3-2*a);return Math.sin(TAU*time/24+Math.PI*(bit(k-1)+(bit(k)-bit(k-1))*smooth));}
function initialize(){
 e.fill(0);hx.fill(0);hy.fill(0);samples.fill(0);drivers.fill(0);time=0;pos=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,d=Math.min(x,y,W-1-x,H-1-y),z=Math.max(0,(18-d)/18);sponge[i]=.12*z*z*z;material[i]=mode===2&&x>118&&x<125?.09:0;}
 caption.textContent=explanations[mode];render();
}
function advance(){
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++){const i=y*W+x;hx[i]-=dt*(e[i+W]-e[i]);hy[i]+=dt*(e[i+1]-e[i]);}
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;e[i]=e[i]*(1-sponge[i]-material[i])+dt*((hy[i]-hy[i-1])-(hx[i]-hx[i-W]));}
 const tx=45,ty=72,signal=source();
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)e[(ty+y)*W+tx+x]+=.045*signal*Math.exp(-(x*x+y*y)/3);
 const rx=72*W+193;
 if(mode===1)e[rx]-=Math.max(-.01,Math.min(.01,e[rx]*.008));
 samples[pos]=e[rx];drivers[pos]=signal*.06;pos=(pos+1)%samples.length;time++;
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
 plot();const symbol=Math.floor(time/96);status.textContent="Simulation step "+time+" · 148-cell source/receiver separation"+(mode>=3?" · bit "+(symbol%144+1)+"/144: "+bit(symbol):"");
}
modeControl.addEventListener("change",()=>{mode=Number(modeControl.value);initialize();});
play.addEventListener("click",()=>{running=!running;play.textContent=running?"Pause":"Play";});
reset.addEventListener("click",initialize);
if(typeof IntersectionObserver!=="undefined")new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(field);
if(matchMedia("(prefers-reduced-motion: reduce)").matches){running=false;play.textContent="Play";}
function frame(now){if(running&&visible){carry+=Math.min(50,last?now-last:16)*Number(speed.value)/20;const steps=Math.min(20,Math.floor(carry));carry-=steps;for(let i=0;i<steps;i++)advance();render();}last=now;requestAnimationFrame(frame);}
initialize();requestAnimationFrame(frame);
})();