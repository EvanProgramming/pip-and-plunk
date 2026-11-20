import {startAct,step,catchBeat,names,titles,targets} from './model.js';
import {drawStage,drawPoster,drawBow} from './art.js';
import {Band} from './sound.js';
const $=id=>document.getElementById(id), canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const music=new Band(), keys=new Set(), preference=matchMedia('(prefers-reduced-motion: reduce)');
export let show=startAct();
show.mode='poster';
let muted=false, aim=null, last=0, debt=0, posterTime=0, bowTime=0, pinnedPointer=null, touchMode=matchMedia('(pointer: coarse)').matches;
function setText(el,value){if(el.textContent!==value)el.textContent=value;}
function readout(){
  const playing=show.mode==='play', poster=show.mode==='poster';
  $('posterAction').hidden=!poster;
  $('pause').hidden=!playing && show.mode!=='paused';
  $('pause').textContent=show.mode==='paused'?'Resume':'Pause';
  $('pause').setAttribute('aria-label',show.mode==='paused'?'Resume performance':'Pause performance');
  const n=show.bells.filter(b=>b.hit).length;
  setText($('act'),poster?'THE MATCHBOX SERIES':'ACT '+['I','II','III'][show.act]+' · '+titles[show.act].toUpperCase());
  setText($('count'),poster?'ADMIT ONE':n+' / '+show.bells.length+' BELLS');
  let line='A two-flea percussion act';
  if(!poster){
    const who=names[show.waiting], b=targets(show)[0];
    if(show.combo>0)line='Two bells, one leap!';
    else if(show.retry>0)line='Here comes another tap…';
    else if(show.ending || show.mode==='interval' || show.mode==='bow')line='Every bell is singing.';
    else if(!b)line=who+' · Keep the duet going';
    else if(b.high && !show.wave?.back)line=who+' · Let it hit the rim for a high bell';
    else if(show.wave?.back)line=who+' · Catch the double ripple!';
    else if(n===0 && show.act===0)line=touchMode?'Pip · Release as the ripple reaches your feet':'Pip · Press Space or click as the ripple reaches your feet';
    else line=who+' · Move under a bell, then catch the ripple';
  }
  setText($('hint'),line);
}
function clearControls(){keys.clear();aim=null;pinnedPointer=null;debt=0;}
function focusStage(){canvas.focus({preventScroll:true});}
function live(act,prior=0){show=startAct(act,prior);show.reduced=preference.matches;clearControls();$('overlay').hidden=true;music.pause(false);focusStage();readout();}
function begin(){music.unlock();live(0);music.play('start');}
function modal(head,top,detail,action){
  clearControls();$('overlay').classList.toggle('curtain-call',show.mode==='bow');$('redo').hidden=show.mode!=='paused';$('overline').textContent=top;$('headline').textContent=head;$('detail').textContent=detail;
  $('continue').textContent=action;$('overlay').hidden=false;$('continue').focus({preventScroll:true});readout();
}
function pause(){if(show.mode!=='play')return;show.mode='paused';music.pause(true);modal('Intermission','THE DUET IS PAUSED','Your place at the drum is saved.','Resume duet');}
function advance(){
  music.unlock();
  if(show.mode==='paused'){show.mode='play';$('overlay').hidden=true;clearControls();focusStage();music.pause(false);readout();}
  else if(show.mode==='interval')live(show.act+1,show.prior+show.leaps);
  else if(show.mode==='bow')begin();
}
function toggleMute(){muted=!muted;music.mute(muted);$('mute').textContent=muted?'Sound off':'Sound on';$('mute').setAttribute('aria-label',muted?'Enable sound':'Mute sound');$('mute').setAttribute('aria-pressed',String(muted));music.unlock();}
$('redo').onclick=()=>live(show.act,show.prior);$('start').onclick=begin;$('continue').onclick=advance;$('mute').onclick=()=>{toggleMute();if(show.mode==='play')focusStage();};
$('pause').onclick=()=>{music.unlock();if(show.mode==='paused')advance();else pause();};
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(!['arrowleft','arrowright','a','d',' ','p','escape','r','m','enter'].includes(k))return;
  if((k===' '||k==='enter') && e.target instanceof HTMLButtonElement)return;
  e.preventDefault();music.unlock();
  if(['arrowleft','arrowright','a','d'].includes(k)){aim=null;keys.add(k);return;}
  if(e.repeat)return;
  if(k==='m')toggleMute();
  else if(k==='p'||k==='escape'){if(show.mode==='paused')advance();else pause();}
  else if(k==='r'&&['play','paused','interval'].includes(show.mode))live(show.act,show.prior);
  else if(k===' '||k==='enter'){if(show.mode==='poster')begin();else if(show.mode!=='play')advance();else catchBeat(show);}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function pos(e){const r=canvas.getBoundingClientRect();return (e.clientX-r.left)*960/r.width;}
canvas.onpointermove=e=>{if(show.mode==='play' && (e.pointerType==='mouse'||e.pointerId===pinnedPointer))aim=pos(e);};
canvas.onpointerdown=e=>{if(show.mode!=='play'||e.button!==0||!e.isPrimary||pinnedPointer!==null)return;touchMode=e.pointerType==='touch';e.preventDefault();focusStage();music.unlock();aim=pos(e);pinnedPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);if(e.pointerType==='mouse')catchBeat(show);};
canvas.onpointerup=e=>{if(e.pointerId!==pinnedPointer)return;if(show.mode==='play'&&e.pointerType!=='mouse')catchBeat(show);pinnedPointer=null;};
canvas.onpointercancel=e=>{if(e.pointerId===pinnedPointer){pinnedPointer=null;aim=null;}};
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function size(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.width*.5*dpr));}
new ResizeObserver(size).observe(canvas);size();
function frame(ms){
  const dt=Math.min(.06,(ms-(last||ms))/1000);last=ms;
  show.reduced=preference.matches;
  if(show.mode==='poster'){posterTime+=dt;ctx.setTransform(canvas.width/960,0,0,canvas.height/480,0,0);drawPoster(ctx,posterTime,show.reduced);}
  else {
    if(show.mode==='play'){
      debt+=dt;
      const axis=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
      while(debt>=1/120){step(show,1/120,axis,aim);debt-=1/120;}
      for(const [name,n] of show.events)music.play(name,n);
      show.events.length=0;music.tick(show.time,show.act+1);
      if(show.mode==='interval')modal('Bravo!','ACT '+['I','II'][show.act]+' COMPLETE',titles[show.act+1]+' is up next.','Play next act');
      if(show.mode==='bow')bowTime=0;
      if(show.mode==='bow')modal('Take a bow!','CURTAIN CALL','18 bells in '+(show.prior+show.leaps)+' leaps. The whole matchbox is on its feet.','Play again');
      readout();
    }
    ctx.setTransform(canvas.width/960,0,0,canvas.height/480,0,0);
    if(show.mode==='bow'){bowTime+=dt;drawBow(ctx,bowTime,show.reduced);}else drawStage(ctx,show);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
