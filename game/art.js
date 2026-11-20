import { names, targets } from './model.js';

// The artwork is drawn in the same 960 × 480 coordinates as the simulation.
const W = 960, H = 480;
const ink = "#26392f", paper = "#f4e3b9", light = "#fff0c9";
const red = "#b74630", darkRed = "#823a2b", gold = "#cb9840", paleGold = "#e5bf71";
const paths = new Map();
function path(d) {
  if (!paths.has(d)) paths.set(d, new Path2D(d));
  return paths.get(d);
}
function shape(c,d,fill,stroke,width=1) {
  const p = path(d);
  if (fill) { c.fillStyle=fill; c.fill(p,"evenodd"); }
  if (stroke) { c.strokeStyle=stroke; c.lineWidth=width; c.stroke(p); }
}
function line(c,x,y,X,Y,color,width=1) {
  c.beginPath(); c.moveTo(x,y); c.lineTo(X,Y);
  c.strokeStyle=color; c.lineWidth=width; c.stroke();
}
function oval(c,x,y,rx,ry,fill,stroke,width=1,rot=0) {
  c.beginPath(); c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);
  if (fill) { c.fillStyle=fill; c.fill(); }
  if (stroke) { c.strokeStyle=stroke; c.lineWidth=width; c.stroke(); }
}
function star(c,x,y,r,color,points=4) {
  c.beginPath();
  for(let i=0;i<points*2;i++) {
    const a=i*Math.PI/points-Math.PI/2, s=i%2?r*.28:r;
    if(i) c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);
    else c.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s);
  }
  c.closePath(); c.fillStyle=color; c.fill();
}
function newCanvas() {
  return typeof OffscreenCanvas==="function" ? new OffscreenCanvas(W,H)
    : Object.assign(document.createElement("canvas"),{width:W,height:H});
}
let grain;
function printGrain(c) {
  if(!grain) {
    grain=newCanvas();
    const g=grain.getContext("2d"), pixels=g.createImageData(W,H);
    let seed=381749;
    const rand=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    for(let i=0;i<pixels.data.length;i+=4) {
      const v=rand(), pale=v>.65;
      pixels.data[i]=pale?255:67; pixels.data[i+1]=pale?245:49;
      pixels.data[i+2]=pale?208:26; pixels.data[i+3]=Math.floor(rand()*(pale?48:28));
    }
    g.putImageData(pixels,0,0);
    for(let i=0;i<3400;i++) {
      const x=rand()*W,y=rand()*H;
      g.fillStyle=i%3?"rgba(255,242,204,.31)":"rgba(79,61,33,.12)";
      g.fillRect(x,y,.4+rand()*2.3,.3+rand()*.8);
    }
  }
  c.drawImage(grain,0,0);
}
function frame(c) {
  c.fillStyle=paper; c.fillRect(0,0,W,H);
  c.strokeStyle=ink; c.lineWidth=3; c.strokeRect(6.5,6.5,947,467);
  c.lineWidth=1; c.strokeRect(11.5,11.5,937,457);
  c.strokeStyle=red; c.strokeRect(15.5,15.5,929,449);
}
function ornament(c,x,y,scale=1) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  shape(c,"M-44 0 Q-35 -2 -29 -1 Q-20 3 -14 0 Q-18 -7 -24 -6 Q-20 -2 -14 0 Q-4 3 0 0 Q4 3 14 0 Q18 -7 24 -6 Q20 -2 14 0 Q20 3 29 -1 Q35 -2 44 0",null,ink,1.3);
  star(c,0,0,5,red); oval(c,-46,0,1.2,1.2,ink); oval(c,46,0,1.2,1.2,ink);
  c.restore();
}
function wing(c,mirrored) {
  c.save(); if(mirrored) { c.translate(W,0); c.scale(-1,1); }
  shape(c,"M13 13H170 Q124 20 112 49 Q82 99 51 121 L40 135 Q53 167 65 184 Q44 181 35 168 Q38 211 46 228 Q25 214 20 200 L13 202Z",red,ink,2);
  shape(c,"M15 17H164 Q117 25 101 54 Q76 103 45 120 Q77 74 86 55 Q44 96 31 117 Q43 82 70 41 Q36 69 18 104 Q22 67 43 35 Q28 48 15 64Z",darkRed);
  shape(c,"M18 19H151 Q108 28 92 44 Q107 27 124 23 Q79 27 61 47 Q76 28 93 23 Q50 29 30 48 Q42 29 61 23Z",paleGold);
  shape(c,"M16 116 Q29 128 49 120 L45 131 Q28 138 15 129Z",gold,ink,1.7);
  for(let i=0;i<7;i++) line(c,17+i*4.4,120+Math.sin(i*.55)*4,18+i*4,128+Math.sin(i*.55)*4,ink,.75);
  shape(c,"M42 129 Q63 134 53 159 M45 131 Q65 136 55 159",null,ink,1.5);
  shape(c,"M51 158 Q55 155 58 160 L60 173 L49 170Z",gold,ink,1.2);
  shape(c,"M18 136 Q29 171 37 202 M24 137 Q34 157 49 173 M16 148 Q20 173 24 185",null,ink,1.3);
  c.restore();
}
// Profile engravings, with the feet anchored to the local origin.
function flea(c,x,y,scale,face,below,kind,t,air=0) {
  c.save(); c.translate(x,y); c.scale(scale*face,below?-scale:scale);
  const pose=Math.min(1,Math.max(0,air/36)), bob=Math.sin(t*3+kind)*.65;
  c.translate(0,bob*.3);
  c.lineJoin="round"; c.lineCap="round";
  // The far hind leg is pale, so both folded jumping legs read at poster scale.
  shape(c,"M-8 -20 Q-20 -16 -26 -10 L-18 -6 L-29 -3 L-29 -4 L-21 -8 L-30 -10 Q-22 -20 -12 -23Z",gold,ink,1.25);
  shape(c,"M-5 -23 Q-2 -34 8 -35 Q12 -36 14 -31 L13 -24 Q10 -18 5 -17Z",ink);
  shape(c,"M5 -30 Q13 -38 19 -34 Q23 -34 24 -29 Q29 -28 30 -25 L23 -25 Q20 -20 13 -21 Q8 -23 5 -30Z",ink);
  // Curved plates and short bristles follow the beetle-like abdomen.
  shape(c,"M-26 -15 Q-29 -24 -22 -31 Q-15 -38 -4 -35 Q5 -32 5 -26 Q2 -20 -9 -15 Q-17 -12 -26 -15Z",ink);
  shape(c,"M-24 -22 Q-23 -30 -16 -32 M-22 -17 Q-21 -29 -12 -34 M-16 -16 Q-15 -27 -7 -33 M-10 -17 Q-8 -26 -3 -30 M-3 -20 Q-2 -24 1 -26",null,paleGold,.95);
  shape(c,"M-26 -25 L-30 -27 M-22 -31 L-25 -34 M-17 -34 L-19 -37 M-11 -35 L-10 -38",null,ink,1.2);
  oval(c,18,-29.5,2.9,3.2,light,ink,.6); oval(c,19,-29.5,1.3,1.55,ink);
  shape(c,"M24 -23 Q27 -21 28 -24 M22 -22 Q25 -18 29 -21",null,ink,1.1);
  c.save(); c.translate(-7,-17); c.rotate(-pose*.24);
  shape(c,"M2 -6 Q-4 -5 -12 5 L-18 13 Q-16 16 -13 13 L-2 4 L1 13 L-6 15 Q-9 19 -3 17 L5 16 L4 13 L3 0 Q9 -4 6 -7Z",ink);
  shape(c,"M0 -4 Q-7 0 -13 9",null,paleGold,1);
  c.restore();
  shape(c,pose>.4?"M2 -20 Q7 -17 14 -13 L21 -15 M9 -22 L19 -19 L26 -23":"M2 -20 Q9 -14 5 -11 L11 -5 L17 -5 M9 -22 L15 -15 L16 -11 L21 -11",null,ink,1.65);
  if(kind===0) {
    c.save(); c.translate(13,-34); c.rotate(-.14);
    shape(c,"M-9 -1 Q-5 -3 -5 -4 L-7 -14 Q-1 -17 7 -14 L5 -4 Q12 -2 12 0 Q2 3 -9 1Z",ink);
    shape(c,"M-5 -7 Q0 -6 6 -7 L5 -4 Q0 -3 -5 -4Z",red); line(c,-4,-13,-3,-8,paleGold,.9);
    c.restore();
    shape(c,"M8 -21 L4 -23 L5 -17 L9 -20 L13 -17 L14 -23Z",red,ink,.6);
  } else {
    shape(c,"M6 -28 Q8 -24 13 -23 L11 -19 Q5 -20 3 -24Z",red,ink,.9);
    shape(c,"M5 -24 Q-1 -26 -4 -21 Q-8 -15 -15 -19 Q-11 -12 -6 -15 L-8 -12 Q-2 -12 0 -20 Q3 -22 6 -21Z",red,ink,.9);
    shape(c,"M11 -34 Q9 -40 12 -42 M15 -34 Q16 -39 18 -40",null,ink,1.2);
  }
  c.restore();
}
function drum(c) {
  c.save(); c.translate(0,240);
  shape(c,"M81 -12 Q463 -17 879 -12 L879 11 Q487 19 81 11Z",red,ink,2);
  shape(c,"M81 -12 Q458 -20 879 -12 Q487 -7 81 -12Z",light,ink,1.8);
  shape(c,"M83 12 Q461 18 877 12",null,ink,2);
  for(let i=0;i<23;i++) {
    const x=84+i*34.4;
    line(c,x,-9,x+16,11,ink,2.8); line(c,x+16,11,x+32,-9,ink,2.8);
    line(c,x-.1,-9,x+16,10,paleGold,1.3); line(c,x+16,10,x+32,-9,paleGold,1.3);
    oval(c,x+16,10,2,1.8,light,ink,.7);
  }
  for(const y of [-12,11]) {
    c.fillStyle=gold; c.fillRect(80,y-2,800,4); c.strokeStyle=ink; c.lineWidth=1.2; c.strokeRect(80,y-2,800,4);
    for(let i=0;i<49;i++) line(c,83+i*16.4,y-1,84+i*16.4,y+1,ink,.75);
  }
  c.restore();
}
function drawBell(c,x,y,side,high,t,hitAge) {
  c.save(); c.translate(x,y); c.scale(1,side?-1:1);
  if(hitAge!=null) {
    if(hitAge>.62){ c.restore(); return; }
    c.globalAlpha=Math.max(0,1-hitAge/.62);
    c.scale(1+hitAge*.35,1+hitAge*.35);
    c.rotate(Math.sin(hitAge*32)*.2);
    for(let i=0;i<8;i++){ const a=i*Math.PI/4; star(c,Math.cos(a)*(19+hitAge*35),Math.sin(a)*(19+hitAge*35),3,gold); }
  } else c.rotate(Math.sin(t*2.2+x)*.065);
  if(high) {
    oval(c,0,0,25,24,null,gold,1.2); oval(c,0,0,28.5,27.5,null,gold,.75);
    star(c,-25,-12,3.6,red); star(c,24,13,3.6,red);
  }
  oval(c,0,-13,3.8,4,null,ink,2); oval(c,.8,11.5,3.5,3.8,ink);
  shape(c,"M-15 10 Q-10 5 -10 -1 Q-10 -11 -2 -13 Q8 -15 10 -4 Q10 4 15 8 L16 10 Q2 15 -15 12Z",gold,ink,1.8);
  shape(c,"M-10 7 Q-5 3 -5 -2 Q-5 -8 -1 -10 Q-7 -9 -8 -1Z",light);
  shape(c,"M4 -10 Q8 -5 7 0 Q8 5 12 8 M2 -9 Q6 -4 5 -1",null,darkRed,1);
  shape(c,"M-14 10 Q0 12 14 8",null,ink,1.6);
  c.restore();
}
function staticStage() {
  const canvas=newCanvas(),c=canvas.getContext("2d"); frame(c);
  // Fine row marks on the sides evoke the stitched edge of a paper theatre.
  for (let y=190;y<446;y+=12) for(const x of [22,938]) oval(c,x,y,1,1,red);
  for(const side of [false,true]) {
    wing(c,side);
    c.save(); c.translate(side?W:0,H); c.scale(side?-1:1,-1);
    shape(c,"M16 16H111 Q68 22 49 44 Q41 54 37 68 Q35 48 46 38 Q20 48 16 73Z",ink);
    shape(c,"M22 22H87 Q56 28 42 42 Q45 34 51 29 Q30 35 22 49Z",gold);
    shape(c,"M24 26 Q40 24 50 24 M23 33 L38 28",null,ink,1); c.restore();
  }
  ornament(c,480,28,.85); ornament(c,480,451,.85);
  for(const x of [83,877]) {
    line(c,x,176,x,305,gold,1); star(c,x,172,4,ink); star(c,x,309,4,ink);
  }
  return canvas;
}
let stageBase, drumPlate;
function drawSnare(c,s) {
  if (!drumPlate) {drumPlate=newCanvas(); drum(drumPlate.getContext("2d"));}
  if (!(s.impact>0) || s.reduced) {c.drawImage(drumPlate,0,0); return;}
  // Two joined shear transforms keep the point of impact attached to both rims.
  const dent=(s.waiting===0?-1:1)*s.impact*6*Math.sin((1-s.impact)*8+.6);
  const x=Math.min(861,Math.max(99,s.lastOrigin));
  for(const [from,to,start,end] of [[76,x,0,dent],[x,884,dent,0]]) {
    c.save(); c.translate(from,start); c.transform(1,(end-start)/(to-from),0,1,0,0);
    c.drawImage(drumPlate,from,218,to-from,44,0,218,to-from,44); c.restore();
  }
}
function recoveryPedal(c,s) {
  const active=s.retry>0, stroke=active?(s.reduced ? .7 : Math.sin(Math.PI*Math.min(1,Math.max(0,s.retry/.46)))):0;
  c.save(); c.translate(77,275);
  shape(c,"M-27 5H6L9 9H-31Z",ink);
  shape(c,"M-5 4L0 -8L5 4Z",gold,ink,1.4);
  c.save();c.rotate(stroke*.48);
  shape(c,"M-26 -5 Q-28 -7 -26 -10 L-4 -3 L0 -2 L0 1Z",active?red:gold,ink,1.5);
  line(c,0,0,4,-19,ink,2.4); oval(c,4,-19,3.2,3.2,active?red:gold,ink,1);
  c.restore(); oval(c,0,0,2.4,2.4,paleGold,ink,1);
  if(active)for(let i=0;i<3;i++)line(c,-18-i*4,-14+i*3,-20-i*5,-20+i*3,red,1.1);
  c.restore();
}
function doubleDing(c,s) {
  const b=s.bells.reduce((recent,bell)=>bell.hit && (!recent||bell.hitAt>=recent.hitAt)?bell:recent,null);
  if(!b)return;
  const x=b.x+(b.swing||0)*Math.sin(b.hitAt*1.8+(b.phase||0));
  const y=(b.side===0?226-b.h:254+b.h)-27;
  c.save(); c.globalAlpha=Math.min(1,s.combo*4);c.translate(Math.max(68,Math.min(W-68,x)),Math.max(33,y));
  c.rotate(-.075);c.font="bold italic 15px Georgia, serif";c.textAlign="center";c.textBaseline="middle";
  c.lineJoin="round";c.lineWidth=4;c.strokeStyle=light;c.strokeText("DING! DING!",0,0);
  c.fillStyle=red;c.fillText("DING! DING!",0,0);c.restore();
}
function plumb(c,x,y,surface,t) {
  const sign=surface>y?1:-1;
  c.save(); c.setLineDash([2,5]); c.lineDashOffset=-t*5;
  line(c,x,y+sign*18,x,surface-sign*4,"#967644",1);c.restore();
  line(c,x-5,surface-sign*4,x,surface,red,1.4);
  line(c,x,surface,x+5,surface-sign*4,red,1.4);
}
function handoff(c,s) {
  const f=s.fleas[s.waiting], top=s.waiting===0, sign=top?-1:1;
  const opacity=Math.min(1,s.catchFx*3), x=f.x, y=(top?226:254)+sign*66;
  c.save(); c.globalAlpha=opacity; c.translate(x,y);
  shape(c,"M-34 -8H34L30 0L34 8H-34L-30 0Z",ink);
  c.fillStyle=light; c.textAlign="center"; c.textBaseline="middle"; c.font="bold 11px Georgia, serif";
  c.fillText(names[s.waiting].toUpperCase().split("").join(" "),0,.5);c.restore();
}
export function drawStage(c,s) {
  c.save(); c.drawImage(stageBase??=staticStage(),0,0);
  const t=s.time||0;
  c.save();
  if(!s.reduced && s.rimFx>0) {
    const j=s.rimFx**2*Math.sin((1-s.rimFx)*25+.8);
    c.translate(s.rim*j*5.5,-j*1.5);
  }
  drawSnare(c,s);
  recoveryPedal(c,s);
  const eligible=[...targets(s,0),...targets(s,1)];
  for(const b of s.bells) {
    if(!b.hit && !eligible.includes(b))continue;
    const surface=b.side===0?226:254, y=surface+(b.side===0?-1:1)*b.h;
    const x=b.x+(b.swing||0)*Math.sin(t*1.8+(b.phase||0));
    if(!b.hit && b.side===s.waiting) plumb(c,x,y,surface,s.reduced?0:t);
    c.save();
    if(!b.hit && b.side!==s.waiting && s.air===null)c.globalAlpha=.48;
    drawBell(c,x,y,b.side,b.high,s.reduced?0:t,b.hit?Math.max(0,t-b.hitAt):null);
    c.restore();
  }
  if(s.wave) {
    const w=s.wave, hot=w.back?red:ink, y=s.waiting===0?226:254,sign=s.waiting===0?-1:1;
    c.save(); c.beginPath(); c.rect(76,200,808,80); c.clip();
    const direction=w.dir||1, peaks=w.back?2:1;
    for(let n=0;n<peaks;n++) {
      const sx=w.x-n*direction*20;
      c.save(); c.translate(sx,y); c.scale(direction,sign);
      shape(c,"M-21 1 Q-13 3 -6 10 Q-3 14 0 17 Q3 8 11 2 L19 0 Q7 1 1 6 Q-1 9 -3 8 Q-8 2 -21 1Z",hot,light,.9);
      c.restore();
    }
    star(c,w.x,y,6,hot); c.restore();
  }
  for(let i=0;i<s.fleas.length;i++) {
    const f=s.fleas[i], waiting=i===s.waiting,sign=i===0?-1:1, surface=i===0?226:254;
    if(waiting && f.h<7) {
      const r=8+(s.reduced?0:1+Math.sin(t*5)),y=surface+sign*1;
      oval(c,f.x,y,r+9,3,red); oval(c,f.x,y,r,2,light);
      for(const d of [-1,1]) {
        line(c,f.x+d*20,y+sign*2,f.x+d*27,y+sign*5,red,2);
        line(c,f.x+d*20,y-sign*2,f.x+d*24,y-sign*3,red,1);
      }
    }
    flea(c,f.x,surface+sign*f.h,1.02,(f.vx<-.1?-1:f.vx>.1?1:i===0?1:-1),i===1,i,s.reduced?0:t,f.h);
  }
  if(s.rimFx>0) {
    const x=s.rim<0?82:878;
    c.save(); c.globalAlpha=Math.min(1,s.rimFx*4); star(c,x,240,18,paleGold,8); star(c,x,240,9,red,6); c.restore();
  }
  if(s.catchFx>0)handoff(c,s);
  if(s.combo>0)doubleDing(c,s);
  for(const p of (s.particles||[])) {
    c.save(); c.globalAlpha=Math.min(1,Math.max(0,p.life*3)); star(c,p.x,p.y,2.4+Math.min(1,p.life)*2,p.vx<0?red:gold); c.restore();
  }
  c.restore(); printGrain(c); c.restore();
}
// A small cut-letter alphabet. The deep split serifs and bevel strokes are part of each drawing.
const letters={
  P:{w:59,d:"M0 0 L35 0 Q57 0 58 21 Q61 45 37 49 L25 49 L25 74 L33 80 L32 85 L1 85 L0 81 L8 75 L8 10 L0 5Z M25 14 L25 36 L32 36 Q42 36 41 25 Q42 14 32 14Z",v:"M12 12V72 M30 5 Q49 4 52 15 M30 41 Q44 41 48 33"},
  I:{w:35,d:"M0 0 H35 L34 5 L26 11 V74 L35 80 V85 H0 V80 L9 74 V11 L0 5Z",v:"M13 12V72 M6 4H27"},
  L:{w:55,d:"M0 0 H34 V5 L25 11 V71 H35 L47 54 L53 52 L52 85 H0 V80 L8 74 V11 L0 5Z",v:"M12 12V73 M29 76 H40 L47 65"},
  U:{w:66,d:"M0 0H32V5L24 11V59 Q24 71 33 72 Q44 71 44 59 V11 L37 5V0 H65 V5 L58 11 V60 Q58 85 33 87 Q7 86 7 62 V11 L0 5Z",v:"M11 12V59 Q11 74 21 78 M47 12V58"},
  N:{w:68,d:"M0 0H26 L48 48 V11 L40 5V0 H68 V5 L61 11 V85 H46 L21 36 V74 L29 80 V85 H0 V80 L8 74 V11 L0 5Z",v:"M12 73V14 M24 10 L49 60 M52 13V45"},
  K:{w:68,d:"M0 0H32V5L25 11V35L43 11L37 5V0H66V5L57 11L39 36L60 74L68 80V85H34V80L40 74L28 48L25 51V74L32 80V85H0V80L8 74V11L0 5Z",v:"M12 12V73 M35 47L49 73 M44 23L51 13"}
};
function lettering(c,word,cx,cy,scale,face,arch) {
  const spacing=5, width=[...word].reduce((sum,ch)=>sum+letters[ch].w+spacing,-spacing);
  let left=-width/2;
  for(const ch of word) {
    const l=letters[ch], middle=left+l.w/2, unit=middle/(width/2);
    c.save(); c.translate(cx+middle*scale,cy+arch*unit*unit); c.rotate(unit*arch/(width*scale)*2.4);
    c.scale(scale,scale); c.translate(-l.w/2,0);
    c.save(); c.translate(3,5); shape(c,l.d,ink,ink,3.8); c.restore();
    shape(c,l.d,light,light,4.2); shape(c,l.d,face,ink,2.3);
    shape(c,l.v,null,face===red?paleGold:"#b6b893",1.25);
    c.restore(); left+=l.w+spacing;
  }
}
function cameo(c,x,flip) {
  c.save(); c.translate(x,238);
  // Broken concentric rules sit behind the performer, like a nineteenth-century trade card.
  oval(c,0,0,113,132,null,ink,1.4);
  oval(c,0,0,109,128,null,red,2.3);
  oval(c,0,0,104,123,null,ink,.8);
  for(let i=0;i<100;i++) {
    const a=i*Math.PI*2/100, k=i%5?2.4:4.5;
    line(c,Math.cos(a)*110,Math.sin(a)*129,Math.cos(a)*(110+k),Math.sin(a)*(129+k),ink,.65);
  }
  c.save(); c.beginPath(); c.ellipse(0,0,102,121,0,0,7); c.clip();
  for(let i=0;i<67;i++) {
    const a=i*Math.PI/66;
    const x0=Math.cos(a)*72,y0=43-Math.sin(a)*85;
    line(c,x0,y0,Math.cos(a)*156,43-Math.sin(a)*181,"#91784d",i%4?.47:1);
  }
  for(let i=0;i<12;i++) {
    line(c,-104+i*5,71+i*3,104-i*5,71+i*3,i%3?"#c7ac76":"#9f8e61",.65);
  }
  c.restore();
  for(const sign of [-1,1]) {
    c.save(); c.translate(sign*86,80); c.scale(sign,1);
    shape(c,"M5 25 Q14 30 22 22 Q18 37 4 43 Q11 44 15 40 Q7 53 -10 54 Q-12 61 -24 60 Q-7 50 2 39 Q6 31 5 25Z",ink);
    shape(c,"M-11 53 Q7 45 15 31",null,paleGold,1); c.restore();
  }
  c.scale(flip,1);
  shape(c,"M-47 66 Q-5 58 51 66 L54 71 Q0 77 -51 71Z",gold,ink,1.5);
  for(let n=0;n<7;n++) line(c,-41+n*13,70,-38+n*13,65,ink,1);
  star(c,-73,-28,7,red); star(c,69,-52,5,ink); star(c,79,4,3,red);
  c.restore();
}
function posterCorner(c,right,bottom) {
  c.save(); c.translate(right?W:0,bottom?H:0); c.scale(right?-1:1,bottom?-1:1);
  shape(c,"M16 16H135 Q112 22 88 22 Q67 22 60 31 Q47 48 34 46 Q39 62 22 83 Q24 95 16 109Z",red,ink,1.25);
  shape(c,"M20 19 H104 Q62 24 54 34 Q45 44 34 42 Q36 54 24 69 Q25 55 28 49 Q22 53 20 57Z",ink);
  shape(c,"M23 24 Q45 19 56 24 Q40 24 31 32 Q28 36 23 37Z",paleGold);
  shape(c,"M38 41 Q48 37 55 28 M31 48 Q31 56 25 63",null,paleGold,1);
  shape(c,"M18 126 Q27 109 21 93 M140 17 Q119 24 99 24",null,ink,1.1);
  star(c,48,57,3.7,ink); star(c,69,34,3,red); c.restore();
}
function posterBase() {
  const canvas=newCanvas(),c=canvas.getContext("2d"); frame(c);
  // A broad curved rule crowns the lettering and continues through the ornaments.
  shape(c,"M85 72 Q237 52 344 72 M616 72 Q723 52 875 72 M82 75 Q220 58 300 68 M660 68 Q751 58 878 75",null,ink,1.1);
  for(let i=0;i<4;i++) posterCorner(c,i%2,i>1);
  for(const x of [173,787]) {
    for(let i=-4;i<=4;i++) {
      const a=i*.19;
      line(c,x+Math.sin(a)*19,96-Math.cos(a)*14,x+Math.sin(a)*(i%2?28:34),96-Math.cos(a)*(i%2?23:30),gold,1.5);
    }
    star(c,x,92,9,red); star(c,x,92,3,ink);
  }
  for(const x of [173,787]) cameo(c,x,x<480?1:-1);
  // The performers' ornamental name ribbons also sit outside the title silhouette.
  for(let i=0;i<2;i++) {
    c.save(); c.translate(i?787:173,358);
    shape(c,"M-56 -8 L-90 -12 L-82 -2 L-92 8 L-52 12 L-39 5 H39 L52 12 L92 8 L82 -2 L90 -12 L56 -8Z",red,ink,1.65);
    shape(c,"M-63 -14 Q0 -5 63 -14 L58 6 Q0 18 -58 6Z",light,ink,1.65);
    c.font="bold 14px Georgia,serif"; c.textAlign="center"; c.fillStyle=ink;
    c.fillText(i?"P L U N K":"P I P",0,3); c.restore();
  }
  lettering(c,"PIP",480,56,1.43,red,6);
  lettering(c,"PLUNK",480,236,1.10,ink,10);
  // Flourishes give the ampersand its own horizontal line.
  for(const sign of [-1,1]) {
    c.save(); c.translate(480,210); c.scale(sign,1);
    shape(c,"M28 0 Q57 -13 73 -4 Q85 4 105 0 Q128 -6 147 -2 Q124 -13 112 -8 Q88 -2 81 -9 Q63 -20 28 0Z",gold,ink,1.15);
    shape(c,"M32 3 Q64 -7 78 0 Q95 12 108 5 Q100 16 82 10 Q66 1 50 5Z",red);
    star(c,154,-2,4,ink); c.restore();
  }
  c.save(); c.translate(480,206); c.font="bold italic 56px Georgia,serif"; c.textAlign="center"; c.textBaseline="middle";
  c.fillStyle=ink; c.fillText("&",1.8,3); c.fillStyle=red;c.fillText("&",0,0); c.restore();
  ornament(c,480,372,1.15);
  for(const sign of [-1,1]) {
    c.save(); c.translate(480,426); c.scale(sign,1);
    shape(c,"M115 0 Q147 -10 182 0 Q219 13 255 4 Q279 -3 298 4 Q278 -8 253 -1 Q218 8 185 -1 Q145 -14 115 0Z",gold,ink,.8);
    star(c,309,4,5,red); c.restore();
  }
  return canvas;
}
let posterPlate;
export function drawPoster(c,t=0,reduced=false) {
  c.save(); c.drawImage(posterPlate??=posterBase(),0,0);
  for(let i=0;i<2;i++) {
    const x=i?787:173, face=i?-1:1, time=reduced?0:t;
    const bounce=reduced?0:Math.max(0,Math.sin(time*1.9+i*2.3))**5;
    c.save();c.translate(x,302-bounce*6); c.rotate(face*(-.075+.022*bounce));
    flea(c,0,0,2.62,face,false,i,time,bounce*8);c.restore();
  }
  printGrain(c); c.restore();
}

function bowBase() {
  const canvas=newCanvas(),c=canvas.getContext("2d");frame(c);
  wing(c,false);wing(c,true);
  posterCorner(c,false,true);posterCorner(c,true,true);
  // A shallow garland and the two footlit plinths leave a quiet central bill.
  shape(c,"M78 20 Q179 67 281 33 Q382 68 480 29 Q578 68 679 33 Q781 67 882 20",null,ink,1.5);
  for(const x of [281,480,679]) {
    oval(c,x,30,3.5,3.5,gold,ink,1);line(c,x,34,x,44,ink,.9);
    star(c,x,49,5.2,red);
  }
  for(const side of [-1,1]) {
    const x=480+side*307;
    c.save();c.translate(x,321);
    for(let j=0;j<17;j++) {
      const a=(j-8)*.135,dx=Math.sin(a),dy=-Math.cos(a);
      line(c,dx*(j%2?101:113),-55+dy*(j%2?101:113),dx*(j%2?111:136),-55+dy*(j%2?111:136),j%4?gold:ink,j%2?.8:1.4);
    }
    shape(c,"M-93 -3 Q0 -17 93 -3 L91 12 L85 36 Q0 51 -85 36 L-91 12Z",red,ink,2);
    shape(c,"M-93 -3 Q0 -17 93 -3 Q1 11 -93 -3Z",light,ink,1.6);
    for(let j=-3;j<=3;j++) {
      const xx=j*24.5, yy=9-Math.pow(j/3,2)*4;
      line(c,xx-10,yy,xx,yy+22,ink,2.8);line(c,xx,yy+22,xx+10,yy,ink,2.8);
      line(c,xx-10,yy,xx,yy+21,paleGold,1.5);line(c,xx,yy+21,xx+10,yy,paleGold,1.5);
    }
    shape(c,"M-85 34 Q0 47 85 34 L85 38 Q0 52 -85 38Z",gold,ink,1.4);
    shape(c,"M-70 58 Q-46 66 -10 60 M70 58 Q46 66 10 60",null,ink,1);
    star(c,0,60,5,red);c.restore();
  }
  ornament(c,480,422,1.4);
  return canvas;
}
let bowPlate;
export function drawBow(c,t=0,reduced=false) {
  c.save(); c.drawImage(bowPlate??=bowBase(),0,0);
  const time=reduced?0:t;
  for(let i=0;i<2;i++) {
    const face=i?-1:1,x=i?787:173,phase=time*1.6+i*.25;
    const lean=reduced?.65:(1-Math.cos(phase))*.5;
    c.save();c.translate(x,317);c.scale(face,1);c.rotate(.07+lean*.33);
    flea(c,0,0,2.74,1,false,i,time,0);c.restore();
    for(let j=0;j<12;j++) {
      const seed=j*39+i*13, drift=reduced?0:time*11;
      const yy=67+((seed*7+drift)%231);
      const xx=x+Math.sin(seed*1.91)*104+(reduced?0:Math.sin(time*.8+seed)*5);
      if(yy>165 && yy<319 && Math.abs(xx-x)<82)continue;
      if(j%3===0)star(c,xx,yy,4+j%4,j%2?gold:red);
      else {
        c.save();c.translate(xx,yy);c.rotate(seed+time*.4);
        c.fillStyle=j%2?gold:red;c.fillRect(-1.3,-3.2,2.6,6.4);c.restore();
      }
    }
  }
  printGrain(c);c.restore();
}
