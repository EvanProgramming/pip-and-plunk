import test from 'node:test';
import assert from 'node:assert/strict';
import {startAct,step,catchBeat,targets} from '../game/model.js';
const tick=s=>step(s,1/120);
function until(s,fn){for(let i=0;i<1800;i++){if(fn())return;tick(s);}assert.fail('event took over 15 seconds');}
test('first three bells teach catching, handoff, then a reflected catch',()=>{
 const s=startAct();
 for(const [i,b] of s.bells.slice(0,3).entries()){
   const who=s.waiting;
   assert.equal(who,b.side);
   until(s,()=>{step(s,1/120,0,b.x);return s.wave?.back===b.high && Math.abs(s.wave.x-b.x)<16 && Math.abs(s.fleas[who].x-b.x)<10;});
   catchBeat(s);assert.equal(s.air,who);assert.equal(s.waiting,1-who);
   until(s,()=>b.hit);assert.equal(s.leaps,i+1);
 }
 assert.ok(s.time<30);
});
test('missing a whole wave gives the same partner another direct wave',()=>{
 const s=startAct();until(s,()=>s.wave?.back);until(s,()=>s.retry>0);until(s,()=>s.wave);
 assert.equal(s.waiting,0);assert.equal(s.wave.back,false);assert.equal(s.leaps,0);
});
test('an ordinary leap cannot reach a high bell',()=>{
 const s=startAct();s.bells[0].hit=true;
 until(s,()=>s.wave && Math.abs(s.wave.x-s.fleas[0].x)<12);catchBeat(s);
 let maximum=0;until(s,()=>{maximum=Math.max(maximum,s.fleas[0].h);return s.air===null});
 assert.ok(maximum+15<targets(s,0)[0].h);
});
test('finale exposes two targets per face and a running jump can ring the pair',()=>{
 const s=startAct(2);s.air=null;s.wave={x:410,dir:1,back:false};Object.assign(s.fleas[0],{x:410,vx:350});s.fleas[1].h=0;
 assert.equal(targets(s,0).length,2);catchBeat(s);until(s,()=>s.air===null);
 assert.ok(s.bells[0].hit && s.bells[1].hit);
});
