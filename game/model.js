export const faces = [226, 254];
export const names = ['Pip', 'Plunk'];
export const titles = ['Sound Check', 'Loose Change', 'The Double Bill'];
const left = 100, right = 860;
const scores = [
  [[0,380,69],[1,550,67],[0,475,141],[1,350,92]],
  [[0,355,71,23],[1,570,82,28],[0,674,145,14],[1,305,140,18],[0,475,84,34],[1,440,75,26]],
  [[0,432,50],[0,467,92],[1,564,62,10],[1,603,100,10],[0,666,139,17],[0,701,168,14],[1,378,137,18],[1,414,165,16]]
];
export const bellX = (b,t) => b.x + b.swing * Math.sin(t * 1.8 + b.phase);
const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
const flea = x => ({x,h:0,vx:0,vy:0});
export function startAct(act=0, prior=0) {
  const fleas=[flea(380),flea(180)];
  fleas[1].h=105;
  return { act, prior, leaps:0, time:0, mode:'play', waiting:0, fleas,
    bells:scores[act].map(([side,x,h,swing=0],i)=>({side,x,h,swing,phase:i*1.72,high:h>118,hit:false,hitAt:-10})),
    air:1,wave:null,impact:0,rim:0,rimFx:0,catchFx:0,missFx:0,particles:[],reduced:false,
    combo:0,flightHits:0,hold:0,retry:0,buffer:0,lastOrigin:180,events:[],ending:0 };
}
export function targets(s,side=s.waiting) {
  const remaining=s.bells.filter(b=>!b.hit && b.side===side);
  return remaining.slice(0,s.act===2?2:1);
}
function emit(s,name,pitch=0) { s.events.push([name,pitch]); }
function dust(s,x,y,n) {
  if(s.reduced) return;
  for(let i=0;i<n;i++) {
    const a=Math.random()*Math.PI*2, speed=20+Math.random()*80;
    s.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.18+Math.random()*.32});
  }
}
function newWave(s,x) {
  s.wave={x,dir:s.fleas[s.waiting].x>=x?1:-1,back:false};
  s.lastOrigin=x;
}
function jump(s) {
  const w=s.wave, i=s.waiting, f=s.fleas[i];
  const reach=s.act===0?39:34;
  if(!w || Math.abs(w.x-f.x)>reach) return false;
  f.vx*=.58; f.vy=w.back?587:416; f.h=.01;
  s.flightHits=0;s.air=i; s.waiting=1-i; s.wave=null; s.leaps++; s.buffer=0; s.catchFx=1;
  emit(s,w.back?'highCatch':'catch');
  if(w.back){s.hold=s.reduced?0:.033;dust(s,f.x,faces[i],12);}
  return true;
}
export function catchBeat(s) {
  if(s.mode!=='play' || s.ending) return;
  if(!jump(s)) {s.buffer=.14; s.missFx=.55;}
}
export function step(s,dt,axis=0,aim=null) {
  if(s.mode!=='play') return;
  if(s.hold>0){s.hold-=dt;return;}
  s.time+=dt;
  s.combo=Math.max(0,s.combo-dt);
  for(const k of ['impact','rimFx','missFx','catchFx'])s[k]=Math.max(0,s[k]-dt*2.5);
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=105*dt;p.life-=dt;}
  s.particles=s.particles.filter(p=>p.life>0);
  if(s.ending>0){
    s.ending-=dt;
    if(s.ending<=0){s.ending=0;s.mode=s.act===2?'bow':'interval';emit(s,s.act===2?'bow':'next');}
    return;
  }
  const f=s.fleas[s.waiting], speed=510;
  const desired=aim===null?axis*speed:clamp((aim-f.x)*16,-speed,speed);
  f.vx+=(desired-f.vx)*Math.min(1,dt*25);f.x=clamp(f.x+f.vx*dt,left+10,right-10);
  if(s.air!==null) {
    const i=s.air,a=s.fleas[i],old=a.h;
    a.h+=a.vy*dt; a.vy-=920*dt; a.x=clamp(a.x+a.vx*dt,left+10,right-10);
    if(s.leaps>0){
      for(const b of targets(s,i)){
        const near=Math.abs(a.x-bellX(b,s.time))<30;
        if(near && Math.min(old,a.h)<=b.h+6 && Math.max(old,a.h)+15>=b.h){
          b.hit=true;b.hitAt=s.time;s.flightHits++;if(s.flightHits===2)s.combo=.7;emit(s,'bell',s.bells.indexOf(b));dust(s,bellX(b,s.time),faces[i]+(i?1:-1)*b.h,9);
        }
      }
      if(s.bells.every(b=>b.hit)){s.ending=.52;return;}
    }
    if(a.h<=0){a.h=0;a.vy=0;a.vx=0;s.air=null;s.impact=1;newWave(s,a.x);emit(s,'land');}
  } else if(s.wave) {
    const w=s.wave;
    w.x+=w.dir*(s.act===0?285:310+s.act*18)*(w.back?1.05:1)*dt;
    if(w.x<left||w.x>right){
      w.x=clamp(w.x,left,right);
      if(w.back){s.wave=null;s.retry=.46;emit(s,'miss');}
      else {s.rim=w.dir;s.rimFx=1;w.dir*=-1;w.back=true;emit(s,'rim');dust(s,w.x,240,10);}
    }
  } else if(s.retry>0){s.retry-=dt;if(s.retry<=0){newWave(s,s.lastOrigin);s.impact=.65;emit(s,'land');}}
  if(s.buffer>0){s.buffer-=dt;jump(s);}
}
