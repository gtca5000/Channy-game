import { useState, useEffect, useRef, useCallback } from "react";

const HOLE_RADIUS = 22, BALL_RADIUS = 10, FRICTION = 0.985, MIN_SPEED = 0.15, MAX_POWER = 18;

const COURSES = [
  { name: "Sweetheart Lane", ball: { x: 120, y: 400 }, hole: { x: 380, y: 120 }, par: 2,
    walls: [{ x:50,y:50,w:430,h:15 },{ x:50,y:50,w:15,h:430 },{ x:465,y:50,w:15,h:430 },{ x:50,y:465,w:430,h:15 },{ x:200,y:200,w:15,h:180 }],
    hearts: [{ x:300,y:300 },{ x:160,y:150 }], msg: "You make every day feel like a birdie 🏌️‍♀️" },
  { name: "Eagle's Nest", ball: { x: 100, y: 420 }, hole: { x: 420, y: 100 }, par: 3,
    walls: [{ x:50,y:50,w:430,h:15 },{ x:50,y:50,w:15,h:430 },{ x:465,y:50,w:15,h:430 },{ x:50,y:465,w:430,h:15 },{ x:150,y:150,w:15,h:200 },{ x:300,y:180,w:15,h:200 },{ x:150,y:350,w:170,h:15 }],
    hearts: [{ x:230,y:250 },{ x:400,y:400 },{ x:130,y:100 }], msg: "So proud of everything you do — on the field, through your art, in everything 💛" },
  { name: "North Adelaide Par 3", ball: { x: 260, y: 430 }, hole: { x: 260, y: 90 }, par: 3,
    walls: [{ x:50,y:50,w:430,h:15 },{ x:50,y:50,w:15,h:430 },{ x:465,y:50,w:15,h:430 },{ x:50,y:465,w:430,h:15 },{ x:120,y:180,w:180,h:15 },{ x:230,y:300,w:180,h:15 },{ x:120,y:180,w:15,h:80 },{ x:395,y:250,w:15,h:65 }],
    hearts: [{ x:400,y:130 },{ x:130,y:350 },{ x:350,y:420 }], msg: "Even when you beat me, I still win because I'm with you 😏" },
  { name: "Cupid's Arrow", ball: { x: 80, y: 260 }, hole: { x: 450, y: 260 }, par: 2,
    walls: [{ x:50,y:50,w:430,h:15 },{ x:50,y:50,w:15,h:430 },{ x:465,y:50,w:15,h:430 },{ x:50,y:465,w:430,h:15 },{ x:200,y:140,w:15,h:120 },{ x:200,y:320,w:15,h:120 },{ x:330,y:180,w:15,h:80 },{ x:330,y:320,w:15,h:80 }],
    hearts: [{ x:265,y:100 },{ x:265,y:420 },{ x:140,y:260 },{ x:390,y:260 }], msg: "Sink this one for something special..." },
];

const noMsgs = [
  { emoji:"😏", title:"Nice try...", sub:"That's not really an option though, is it?\nI still beat you on the scorecard 😉" },
  { emoji:"🤨", title:"Again?!", sub:"You're more stubborn than a lip-out on the 18th.\nBut the answer is still going to be yes." },
  { emoji:"😤", title:"Seriously Channy?", sub:"I'll just keep asking.\nI've got more patience than you have birdies." },
  { emoji:"🫠", title:"Ok now you're just being cheeky", sub:"Your pop would tell you to say yes.\nDon't make me get the triplets involved." },
];

const letterLines = [
  "Channy,", "",
  "From the first time we teed off together,", "I knew you were something special.", "",
  "You inspire me every single day —", "your strength, your art, your culture,",
  "the way you pour your heart into everything.", "",
  "Whether we're on the course at North Adelaide,", "cheering at the footy,",
  "or just together doing nothing at all —", "you make everything better.", "",
  "Your pop would be so proud of you.", "I know I am.",
];

const drawHeart = (ctx, x, y, size, color = "#e74c6f") => {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size, -size * 0.4, -size * 0.5, -size, 0, -size * 0.4);
  ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.4, 0, size * 0.3);
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
};

const drawDots = (ctx, cx, cy, r, n, s, color) => {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, s, 0, Math.PI * 2); ctx.fill();
  }
};

const CSS = `
@keyframes bgFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.06} 50%{transform:translateY(-120vh) rotate(20deg);opacity:.03} }
@keyframes fadeInUp { from{opacity:0;transform:translateY(30px) scale(.9)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes heartBeat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.15)} 30%{transform:scale(1)} 45%{transform:scale(1.1)} }
@keyframes sparkle { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
@keyframes floatUp { 0%{opacity:0;transform:translateY(100vh)} 10%{opacity:.8} 90%{opacity:.6} 100%{opacity:0;transform:translateY(-20vh) rotate(25deg)} }
@keyframes sunkPulse { 0%,100%{box-shadow:0 0 20px rgba(231,76,111,.3)} 50%{box-shadow:0 0 40px rgba(231,76,111,.6)} }
@keyframes typewriter { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes gentlePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
@keyframes noShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-12px)} 40%{transform:translateX(12px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
`;

const Btn = ({ onClick, children, style, glow }) => (
  <button onClick={onClick} style={{
    padding:"14px 40px", fontSize:"16px", border:"none", color:"#fff", borderRadius:"50px",
    cursor:"pointer", fontFamily:"Georgia,serif", fontStyle:"italic", letterSpacing:"1px",
    transition:"all .3s", background: glow ? "linear-gradient(135deg,#e74c6f,#c0392b)" : "transparent",
    boxShadow: glow ? "0 4px 20px rgba(231,76,111,.5)" : "none",
    ...style,
  }}
    onMouseOver={e => { e.target.style.transform = "scale(1.07)"; if(glow) e.target.style.boxShadow = "0 6px 30px rgba(231,76,111,.8)"; }}
    onMouseOut={e => { e.target.style.transform = "scale(1)"; if(glow) e.target.style.boxShadow = "0 4px 20px rgba(231,76,111,.5)"; }}
  >{children}</button>
);

export default function ValentineGolf() {
  const canvasRef = useRef(null);
  const [ci, setCi] = useState(0);
  const [ball, setBall] = useState({ ...COURSES[0].ball, vx:0, vy:0 });
  const [aiming, setAiming] = useState(false);
  const [aimS, setAimS] = useState(null);
  const [aimE, setAimE] = useState(null);
  const [strokes, setStrokes] = useState(0);
  const [total, setTotal] = useState(0);
  const [moving, setMoving] = useState(false);
  const [sunk, setSunk] = useState(false);
  const [won, setWon] = useState(false);
  const [showV, setShowV] = useState(false);
  const [phase, setPhase] = useState(0);
  const [sparks, setSparks] = useState([]);
  const [fHearts, setFHearts] = useState([]);
  const [intro, setIntro] = useState(true);
  const [noCnt, setNoCnt] = useState(0);
  const bRef = useRef(ball);
  const mRef = useRef(false);
  const aRef = useRef(null);
  const c = COURSES[ci];
  const totalPar = COURSES.reduce((a, x) => a + x.par, 0);

  const resetC = useCallback(i => {
    const x = COURSES[i]; const nb = { ...x.ball, vx:0, vy:0 };
    setBall(nb); bRef.current = nb; setStrokes(0); setSunk(false); setMoving(false); mRef.current = false;
  }, []);

  useEffect(() => { resetC(ci); }, [ci, resetC]);

  const wallCol = useCallback((bx,by,vx,vy) => {
    let nx=bx,ny=by,nvx=vx,nvy=vy;
    for (const w of c.walls) {
      const l=w.x, r=w.x+w.w, t=w.y, b=w.y+w.h;
      const cx=Math.max(l,Math.min(nx,r)), cy=Math.max(t,Math.min(ny,b));
      const dx=nx-cx, dy=ny-cy, d=Math.sqrt(dx*dx+dy*dy);
      if(d<BALL_RADIUS){
        if(Math.abs(dx)>Math.abs(dy)){ nvx=-nvx*.75; nx=dx>0?r+BALL_RADIUS:l-BALL_RADIUS; }
        else{ nvy=-nvy*.75; ny=dy>0?b+BALL_RADIUS:t-BALL_RADIUS; }
      }
    }
    return {x:nx,y:ny,vx:nvx,vy:nvy};
  }, [c]);

  const tick = useCallback(() => {
    if(!mRef.current) return;
    let {x,y,vx,vy} = bRef.current;
    vx*=FRICTION; vy*=FRICTION; x+=vx; y+=vy;
    const r=wallCol(x,y,vx,vy); x=r.x;y=r.y;vx=r.vx;vy=r.vy;
    const sp=Math.sqrt(vx*vx+vy*vy);
    const dx=x-c.hole.x, dy=y-c.hole.y, dh=Math.sqrt(dx*dx+dy*dy);
    if(dh<HOLE_RADIUS&&sp<12){
      const nb={x:c.hole.x,y:c.hole.y,vx:0,vy:0};
      bRef.current=nb; setBall(nb); mRef.current=false; setMoving(false); setSunk(true); return;
    }
    if(dh<HOLE_RADIUS+15){ const ps=.3; vx-=(dx/dh)*ps; vy-=(dy/dh)*ps; }
    if(sp<MIN_SPEED){ vx=0;vy=0; mRef.current=false; setMoving(false); }
    const nb={x,y,vx,vy}; bRef.current=nb; setBall(nb);
  }, [c, wallCol]);

  useEffect(() => {
    let run=true;
    const loop=()=>{ if(!run)return; tick(); aRef.current=requestAnimationFrame(loop); };
    aRef.current=requestAnimationFrame(loop);
    return ()=>{ run=false; cancelAnimationFrame(aRef.current); };
  }, [tick]);

  // Draw canvas
  useEffect(() => {
    const cv=canvasRef.current; if(!cv)return;
    const ctx=cv.getContext("2d"), W=530, H=530;
    ctx.clearRect(0,0,W,H);
    const grd=ctx.createRadialGradient(265,265,50,265,265,350);
    grd.addColorStop(0,"#2d8a4e"); grd.addColorStop(1,"#1a6b35");
    ctx.fillStyle=grd; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=.03;
    for(let i=0;i<600;i++){ctx.fillStyle=Math.random()>.5?"#fff":"#000";ctx.fillRect(Math.random()*W,Math.random()*H,1,1);}
    ctx.globalAlpha=1;
    // Aboriginal dot art around hole
    ctx.globalAlpha=.08;
    drawDots(ctx,c.hole.x,c.hole.y,50,16,3,"#FFD700");
    drawDots(ctx,c.hole.x,c.hole.y,65,22,2.5,"#E8732A");
    drawDots(ctx,c.hole.x,c.hole.y,80,28,2,"#C0392B");
    ctx.globalAlpha=1;
    // Walls
    for(const w of c.walls){
      const wg=ctx.createLinearGradient(w.x,w.y,w.x+w.w,w.y+w.h);
      wg.addColorStop(0,"#8B4513");wg.addColorStop(.5,"#A0522D");wg.addColorStop(1,"#8B4513");
      ctx.fillStyle=wg; ctx.shadowColor="rgba(0,0,0,.3)";ctx.shadowBlur=4;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
      ctx.beginPath();ctx.roundRect(w.x,w.y,w.w,w.h,3);ctx.fill();ctx.shadowColor="transparent";
    }
    // Hearts
    for(const h of c.hearts){ctx.globalAlpha=.15;drawHeart(ctx,h.x,h.y,18,"#ff6b8a");ctx.globalAlpha=1;}
    // Hole
    ctx.beginPath();ctx.arc(c.hole.x,c.hole.y,HOLE_RADIUS+4,0,Math.PI*2);ctx.fillStyle="#0d3d1f";ctx.fill();
    ctx.beginPath();ctx.arc(c.hole.x,c.hole.y,HOLE_RADIUS,0,Math.PI*2);ctx.fillStyle="#111";ctx.fill();
    // Flag
    if(!sunk){
      ctx.strokeStyle="#ddd";ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(c.hole.x,c.hole.y);ctx.lineTo(c.hole.x,c.hole.y-45);ctx.stroke();
      drawHeart(ctx,c.hole.x+12,c.hole.y-38,12,"#e74c6f");
    }
    // Ball (pink)
    if(!sunk){
      ctx.beginPath();ctx.arc(ball.x,ball.y,BALL_RADIUS,0,Math.PI*2);
      const bg=ctx.createRadialGradient(ball.x-3,ball.y-3,1,ball.x,ball.y,BALL_RADIUS);
      bg.addColorStop(0,"#ffe0e8");bg.addColorStop(1,"#f5a0b5");
      ctx.fillStyle=bg;ctx.shadowColor="rgba(0,0,0,.4)";ctx.shadowBlur=5;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
      ctx.fill();ctx.shadowColor="transparent";
      ctx.globalAlpha=.2;ctx.fillStyle="#fff";
      ctx.beginPath();ctx.arc(ball.x-2,ball.y-2,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(ball.x+3,ball.y+1,1.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
    // Aim
    if(aiming&&aimS&&aimE){
      const dx=aimS.x-aimE.x,dy=aimS.y-aimE.y;
      const pw=Math.min(Math.sqrt(dx*dx+dy*dy),MAX_POWER*10);
      const ang=Math.atan2(dy,dx), len=pw*.6;
      ctx.setLineDash([6,6]);
      ctx.strokeStyle=`rgba(255,255,255,${.4+(pw/(MAX_POWER*10))*.5})`;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(ball.x,ball.y);
      ctx.lineTo(ball.x+Math.cos(ang)*len,ball.y+Math.sin(ang)*len);ctx.stroke();ctx.setLineDash([]);
      const pct=pw/(MAX_POWER*10), bW=60, bH=8, bx=ball.x-bW/2, by=ball.y+22;
      ctx.fillStyle="rgba(0,0,0,.5)";ctx.beginPath();ctx.roundRect(bx,by,bW,bH,4);ctx.fill();
      ctx.fillStyle=pct<.4?"#4ade80":pct<.7?"#fbbf24":"#ef4444";
      ctx.beginPath();ctx.roundRect(bx,by,bW*pct,bH,4);ctx.fill();
    }
  }, [ball,c,aiming,aimS,aimE,sunk]);

  const gcp=(e)=>{
    const cv=canvasRef.current,rect=cv.getBoundingClientRect();
    const sx=530/rect.width,sy=530/rect.height;
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const cy=e.touches?e.touches[0].clientY:e.clientY;
    return{x:(cx-rect.left)*sx,y:(cy-rect.top)*sy};
  };
  const hDown=e=>{if(moving||sunk||won)return;e.preventDefault();const p=gcp(e);setAiming(true);setAimS(p);setAimE(p);};
  const hMove=e=>{if(!aiming)return;e.preventDefault();setAimE(gcp(e));};
  const hUp=e=>{
    if(!aiming||!aimS||!aimE){setAiming(false);return;}e.preventDefault();
    const dx=aimS.x-aimE.x,dy=aimS.y-aimE.y;
    const pw=Math.min(Math.sqrt(dx*dx+dy*dy)/10,MAX_POWER);
    if(pw<.5){setAiming(false);return;}
    const ang=Math.atan2(dy,dx);
    const nb={...bRef.current,vx:Math.cos(ang)*pw,vy:Math.sin(ang)*pw};
    bRef.current=nb;setBall(nb);mRef.current=true;setMoving(true);setStrokes(s=>s+1);setAiming(false);
  };

  useEffect(()=>{
    if(!sunk)return;
    const nt=total+strokes; setTotal(nt);
    if(ci>=COURSES.length-1){
      setTimeout(()=>{
        setWon(true);setShowV(true);setPhase(0);
        setSparks(Array.from({length:40},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,delay:Math.random()*2,size:Math.random()*8+4,dur:Math.random()*2+1.5})));
        setFHearts(Array.from({length:20},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*3,size:Math.random()*20+14,dur:Math.random()*3+3})));
      },600);
    }
  },[sunk]);

  const restart=()=>{setCi(0);setTotal(0);setWon(false);setShowV(false);setPhase(0);setSparks([]);setFHearts([]);setNoCnt(0);resetC(0);};
  const curNo=noMsgs[Math.min(noCnt,noMsgs.length-1)];

  const overlay = {position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:"24px",textAlign:"center",zIndex:100};

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#1a0a1e 0%,#2d0f3e 30%,#1a0a2e 70%,#0f0a1a 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",position:"relative",overflow:"hidden",padding:"20px"}}>
      <style>{CSS}</style>
      {/* BG hearts */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        {[...Array(8)].map((_,i)=><div key={i} style={{position:"absolute",left:`${10+i*12}%`,bottom:"-30px",fontSize:`${16+i*3}px`,opacity:.06,animation:`bgFloat ${6+i*1.5}s ease-in-out infinite`,animationDelay:`${i*.8}s`,color:"#e74c6f"}}>♥</div>)}
      </div>

      {/* INTRO */}
      {intro&&<div style={{...overlay,zIndex:200,background:"linear-gradient(145deg,#1a0a1e 0%,#2d0f3e 30%,#1a0a2e 70%,#0f0a1a 100%)",gap:"24px"}}>
        <div style={{fontSize:"64px",animation:"heartBeat 1.5s ease-in-out infinite"}}>⛳</div>
        <h1 style={{fontSize:"clamp(28px,7vw,44px)",color:"#ffeef2",fontStyle:"italic",fontWeight:"normal",letterSpacing:"2px",margin:0,lineHeight:1.3,textShadow:"0 0 20px rgba(231,76,111,.3)"}}>
          Steve & Channy's<br/><span style={{color:"#e74c6f",fontWeight:"bold",fontSize:"1.1em"}}>Valentine's Mini Golf</span>
        </h1>
        <p style={{color:"rgba(255,238,242,.5)",fontStyle:"italic",fontSize:"16px",maxWidth:"340px",lineHeight:1.6}}>
          4 holes of love, some friendly competition,<br/>and maybe a surprise at the end...
        </p>
        <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
          {["🏌️‍♂️","♥","🏌️‍♀️"].map((e,i)=><span key={i} style={{fontSize:"28px",opacity:.6,animation:`gentlePulse 2s ease-in-out ${i*.3}s infinite`}}>{e}</span>)}
        </div>
        <Btn glow onClick={()=>setIntro(false)} style={{padding:"16px 48px",fontSize:"18px",letterSpacing:"2px",marginTop:"12px"}}>Tee Off ♥</Btn>
      </div>}

      {/* VALENTINE OVERLAY */}
      {showV&&<div style={{...overlay,background:"rgba(15,5,20,.95)",backdropFilter:"blur(8px)",animation:"fadeInUp .8s ease-out",overflowY:"auto"}}>
        {sparks.map(s=><div key={s.id} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,background:"radial-gradient(circle,#ffd700 0%,transparent 70%)",borderRadius:"50%",animation:`sparkle ${s.dur}s ease-in-out infinite`,animationDelay:`${s.delay}s`}}/>)}
        {fHearts.map(h=><div key={h.id} style={{position:"absolute",left:`${h.x}%`,bottom:0,fontSize:h.size,color:"#e74c6f",opacity:0,animation:`floatUp ${h.dur}s ease-out infinite`,animationDelay:`${h.delay}s`,pointerEvents:"none"}}>♥</div>)}
        <div style={{maxWidth:"500px",width:"100%"}}>

          {/* Love letter */}
          {phase===0&&<div style={{animation:"fadeInUp 1s ease-out"}}>
            <div style={{fontSize:"56px",marginBottom:"20px",animation:"heartBeat 1.5s ease-in-out infinite"}}>♥</div>
            <div style={{color:"rgba(255,238,242,.9)",fontSize:"clamp(15px,3.5vw,18px)",fontStyle:"italic",lineHeight:1.9,maxWidth:"420px",margin:"0 auto"}}>
              {letterLines.map((l,i)=><div key={i} style={{animation:`typewriter .6s ease-out ${.3+i*.15}s both`,minHeight:l===""?"12px":"auto"}}>{l}</div>)}
            </div>
            <Btn glow onClick={()=>setPhase(1)} style={{marginTop:"36px",animation:"fadeInUp .6s ease-out 3.5s both"}}>Continue ♥</Btn>
          </div>}

          {/* The question */}
          {phase===1&&<div style={{animation:"fadeInUp 1s ease-out"}}>
            <div style={{fontSize:"72px",animation:"heartBeat 1.5s ease-in-out infinite",marginBottom:"20px",filter:"drop-shadow(0 0 20px rgba(231,76,111,.6))"}}>♥</div>
            <div style={{fontSize:"clamp(14px,3vw,18px)",color:"rgba(255,238,242,.7)",fontStyle:"italic",marginBottom:"20px",animation:"fadeInUp .8s ease-out .3s both"}}>So with that said...</div>
            <div style={{fontSize:"clamp(32px,8vw,60px)",color:"#e74c6f",fontWeight:"bold",fontStyle:"italic",letterSpacing:"2px",textShadow:"0 0 40px rgba(231,76,111,.8)",animation:"fadeInUp 1s ease-out .8s both",lineHeight:1.2}}>
              Will You Be<br/>My Valentine?
            </div>
            <div style={{fontSize:"14px",color:"rgba(255,238,242,.4)",marginTop:"12px",fontStyle:"italic",animation:"fadeInUp .6s ease-out 1.5s both"}}>
              {total+strokes} strokes across {COURSES.length} holes (Par {totalPar})
            </div>
            <div style={{display:"flex",gap:"20px",justifyContent:"center",marginTop:"36px",alignItems:"center",animation:"fadeInUp 1s ease-out 2s both"}}>
              <Btn glow onClick={()=>{window.open("https://www.youtube.com/watch?v=lp-EO5I60KA","_blank");setPhase(2);}} style={{padding:"16px 44px",fontSize:"20px",letterSpacing:"2px"}}>Yes! ♥</Btn>
              <button onClick={()=>{setNoCnt(n=>n+1);setPhase(3);}} style={{
                padding:`${Math.max(8,16-noCnt*3)}px ${Math.max(12,28-noCnt*5)}px`,
                fontSize:`${Math.max(8,14-noCnt*2)}px`,background:"transparent",
                border:"1px solid rgba(255,255,255,.15)",color:`rgba(255,238,242,${Math.max(.1,.3-noCnt*.06)})`,
                borderRadius:"50px",cursor:"pointer",fontFamily:"Georgia,serif",fontStyle:"italic",
                transition:"all .3s",opacity:Math.max(.2,1-noCnt*.2),
              }}
                onMouseOver={e=>{e.target.style.animation="noShake .5s ease-in-out";}}
                onMouseOut={e=>{e.target.style.animation="none";}}
              >No</button>
            </div>
          </div>}

          {/* Yes! */}
          {phase===2&&<div style={{animation:"fadeInUp .8s ease-out"}}>
            <div style={{fontSize:"80px",marginBottom:"16px",animation:"heartBeat 1s ease-in-out infinite"}}>🥰</div>
            <div style={{fontSize:"clamp(28px,6vw,48px)",color:"#ffeef2",fontWeight:"bold",fontStyle:"italic",letterSpacing:"2px",textShadow:"0 0 30px rgba(231,76,111,.5)"}}>I knew you would! ♥</div>
            <div style={{color:"rgba(255,238,242,.6)",fontSize:"16px",fontStyle:"italic",marginTop:"16px",lineHeight:1.6}}>Happy Valentine's Day, Channy<br/>Love, Steve</div>
            <Btn onClick={restart} style={{marginTop:"32px",border:"1px solid rgba(231,76,111,.4)",color:"rgba(255,238,242,.6)"}}>Play Again</Btn>
          </div>}

          {/* No response */}
          {phase===3&&<div style={{animation:"fadeInUp .5s ease-out"}}>
            <div style={{fontSize:"60px",marginBottom:"16px"}}>{curNo.emoji}</div>
            <div style={{fontSize:"clamp(22px,5vw,36px)",color:"#ffeef2",fontStyle:"italic",fontWeight:"bold"}}>{curNo.title}</div>
            <div style={{color:"rgba(255,238,242,.6)",fontSize:"16px",fontStyle:"italic",marginTop:"12px",lineHeight:1.6,whiteSpace:"pre-line"}}>{curNo.sub}</div>
            <Btn glow onClick={()=>setPhase(1)} style={{marginTop:"28px",fontSize:"18px",letterSpacing:"2px"}}>Let's Try That Again ♥</Btn>
          </div>}
        </div>
      </div>}

      {/* HUD */}
      {!intro&&<>
        <h1 style={{fontSize:"clamp(18px,4vw,26px)",color:"#ffeef2",margin:"0 0 10px",fontStyle:"italic",fontWeight:"normal",letterSpacing:"3px",textShadow:"0 0 20px rgba(231,76,111,.3)",zIndex:1}}>♥ Steve & Channy's Mini Golf ♥</h1>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"min(530px,95vw)",marginBottom:"6px",zIndex:1,color:"#ffeef2",fontSize:"14px",fontStyle:"italic",padding:"0 4px"}}>
          <span><span style={{opacity:.7}}>Hole {ci+1}/{COURSES.length}</span><span style={{opacity:.4,margin:"0 6px"}}>·</span><span style={{opacity:.5,fontSize:"12px"}}>{c.name}</span></span>
          <span><span style={{opacity:.5}}>Par {c.par}</span><span style={{margin:"0 8px",opacity:.3}}>|</span><span style={{color:"#e74c6f"}}>Strokes: {strokes}</span></span>
        </div>
        <div style={{color:"rgba(255,238,242,.45)",fontSize:"13px",fontStyle:"italic",marginBottom:"8px",textAlign:"center",zIndex:1}}>{c.msg}</div>

        {/* Canvas */}
        <div style={{position:"relative",borderRadius:"16px",overflow:"hidden",boxShadow:sunk?undefined:"0 8px 32px rgba(0,0,0,.5)",animation:sunk?"sunkPulse 1s ease-in-out infinite":undefined,zIndex:1,width:"min(530px,95vw)",aspectRatio:"1"}}>
          <canvas ref={canvasRef} width={530} height={530} style={{width:"100%",height:"100%",display:"block",cursor:moving||sunk?"default":"crosshair",touchAction:"none"}}
            onMouseDown={hDown} onMouseMove={hMove} onMouseUp={hUp} onMouseLeave={()=>setAiming(false)}
            onTouchStart={hDown} onTouchMove={hMove} onTouchEnd={hUp} />
          {sunk&&!won&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.55)",backdropFilter:"blur(3px)",animation:"fadeInUp .5s ease-out"}}>
            <div style={{fontSize:"48px",marginBottom:"8px"}}>♥</div>
            <div style={{color:"#ffeef2",fontSize:"28px",fontStyle:"italic",fontWeight:"bold"}}>
              {strokes===1?"Hole in One!!":strokes<=c.par-1?"Birdie!":strokes===c.par?"Par!":strokes===c.par+1?"Bogey":"Nice try!"}
            </div>
            <div style={{color:"rgba(255,238,242,.6)",fontSize:"16px",fontStyle:"italic",margin:"8px 0 20px"}}>{strokes} {strokes===1?"stroke":"strokes"}</div>
            <Btn glow onClick={()=>{if(ci<COURSES.length-1)setCi(ci+1);}}>{ci<COURSES.length-2?"Next Hole →":"Final Hole →"}</Btn>
          </div>}
        </div>
        <div style={{color:"rgba(255,238,242,.35)",fontSize:"12px",fontStyle:"italic",marginTop:"12px",zIndex:1}}>Click & drag to aim · Pull back for power · Release to swing</div>
        <div style={{color:"rgba(255,238,242,.25)",fontSize:"11px",marginTop:"6px",zIndex:1}}>Total: {total+strokes} / Par {totalPar}</div>
      </>}
    </div>
  );
}
