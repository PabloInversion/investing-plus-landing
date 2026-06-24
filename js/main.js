document.getElementById('year').textContent = new Date().getFullYear();
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lucide icons
if(window.lucide) lucide.createIcons();

// Reveal on scroll
const io = new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in'); io.unobserve(e.target);}});},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ===== Hero canvas: fondo animado premium (líneas + nodos tipo terminal financiera) =====
(function(){
  const canvas=document.getElementById('heroCanvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  let w,h,nodes=[];
  function resize(){
    w=canvas.width=canvas.offsetWidth*devicePixelRatio;
    h=canvas.height=canvas.offsetHeight*devicePixelRatio;
  }
  function init(){
    resize();
    const count=Math.round((w*h)/55000);
    nodes=Array.from({length:Math.max(18,Math.min(count,42))},()=>({
      x:Math.random()*w, y:Math.random()*h,
      vx:(Math.random()-.5)*0.25*devicePixelRatio, vy:(Math.random()-.5)*0.25*devicePixelRatio
    }));
  }
  function step(){
    ctx.clearRect(0,0,w,h);
    nodes.forEach(n=>{
      n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>w)n.vx*=-1;
      if(n.y<0||n.y>h)n.vy*=-1;
    });
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const max=170*devicePixelRatio;
        if(dist<max){
          ctx.strokeStyle=`rgba(43,217,118,${(1-dist/max)*0.18})`;
          ctx.lineWidth=1*devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    nodes.forEach(n=>{
      ctx.fillStyle='rgba(43,217,118,.55)';
      ctx.beginPath(); ctx.arc(n.x,n.y,1.6*devicePixelRatio,0,Math.PI*2); ctx.fill();
    });
    if(!reduce) requestAnimationFrame(step);
  }
  init();
  if(!reduce){ step(); } else { step(); }
  window.addEventListener('resize',()=>{init();},{passive:true});
})();

// ===== Tilt 3D en cards premium (estilo Linear/Vercel) =====
(function(){
  if(reduce || matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach(card=>{
    let raf=null;
    card.addEventListener('mousemove',(e)=>{
      const r=card.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      const rx=(py-0.5)*-7, ry=(px-0.5)*9;
      if(raf) cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        card.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
    });
    card.addEventListener('mouseleave',()=>{
      if(raf) cancelAnimationFrame(raf);
      card.style.transform='perspective(900px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
})();

// ===== GSAP entrance + scroll reveal refuerzo (si está disponible) =====
if(window.gsap){
  if(window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if(!reduce){
    gsap.from('[data-hero-text] > *',{opacity:0,y:24,duration:.8,stagger:.08,ease:'power3.out',delay:.1});
    gsap.from('.hero-portrait',{opacity:0,scale:.94,duration:.9,ease:'power3.out',delay:.2});
  }
}

// Hero counter
const counter=document.getElementById('counter');
if(reduce){counter.textContent='$0';}
else{
  let started=false;
  const run=()=>{
    if(started)return;started=true;
    const target=187420,dur=2200,t0=performance.now();
    const tick=(now)=>{
      const p=Math.min((now-t0)/dur,1);
      const e=1-Math.pow(1-p,3);
      counter.textContent='$'+Math.floor(e*target).toLocaleString('en-US');
      if(p<1)requestAnimationFrame(tick);
      else counter.textContent='$'+target.toLocaleString('en-US');
    };
    requestAnimationFrame(tick);
  };
  setTimeout(run,600);
}

// ===== Comparison chart (banco vs bolsa, animado al entrar en pantalla) =====
(function(){
  const W=720,H=360,PAD={l:18,r:64,t:24,b:34};
  const banco=0.04, bolsa=0.154, cap=10000, YEARS=10;
  const pB=document.getElementById('lnBanco'), pS=document.getElementById('lnBolsa');
  const lblB=document.getElementById('lblBanco'), lblS=document.getElementById('lblBolsa');
  const axisG=document.getElementById('axisG');
  const resB=document.getElementById('resBanco'), resS=document.getElementById('resBolsa');
  const gainB=document.getElementById('gainBanco'), gainS=document.getElementById('gainBolsa');
  const fmt=n=>'$'+Math.round(n).toLocaleString('en-US');
  function series(rate,years){const a=[];for(let t=0;t<=years;t++)a.push(cap*Math.pow(1+rate,t));return a;}

  const sB=series(banco,YEARS), sS=series(bolsa,YEARS), maxV=sS[YEARS];
  const x=t=> PAD.l + (t/YEARS)*(W-PAD.l-PAD.r);
  const y=v=> H-PAD.b - (v/maxV)*(H-PAD.t-PAD.b);
  const path=arr=>arr.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
  let g='';
  for(let r=0;r<=4;r++){const yy=PAD.t + r*((H-PAD.t-PAD.b)/4);g+='<line class="ax-line" x1="'+PAD.l+'" y1="'+yy+'" x2="'+(W-PAD.r)+'" y2="'+yy+'"/>';}
  [0,2,4,6,8,10].forEach(t=>{g+='<text class="ax-txt" x="'+x(t).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle">'+t+(t===0?'':'a')+'</text>';});
  axisG.innerHTML=g;
  pB.setAttribute('d',path(sB)); pS.setAttribute('d',path(sS));
  pB.setAttribute('pathLength','1'); pS.setAttribute('pathLength','1');
  lblB.setAttribute('x',(x(YEARS)+6)); lblB.setAttribute('y',(y(sB[YEARS])+4)); lblB.textContent=fmt(0);
  lblS.setAttribute('x',(x(YEARS)+6)); lblS.setAttribute('y',(y(sS[YEARS])+4)); lblS.textContent=fmt(0);

  function countUp(el,target,dur,delay){
    delay=delay||0;
    setTimeout(()=>{
      const t0=performance.now();
      const tick=(now)=>{
        const p=Math.min((now-t0)/dur,1);
        const e=1-Math.pow(1-p,3);
        const val=e*target;
        el.textContent=fmt(val);
        if(el===lblB||el===lblS) el.textContent=fmt(val);
        if(p<1) requestAnimationFrame(tick);
        else el.textContent=fmt(target);
      };
      requestAnimationFrame(tick);
    },delay);
  }
  function countUpGain(el,target,dur,delay){
    delay=delay||0;
    setTimeout(()=>{
      const t0=performance.now();
      const tick=(now)=>{
        const p=Math.min((now-t0)/dur,1);
        const e=1-Math.pow(1-p,3);
        el.textContent=fmt(e*target);
        if(p<1) requestAnimationFrame(tick); else el.textContent=fmt(target);
      };
      requestAnimationFrame(tick);
    },delay);
  }

  function runCounters(){
    if(reduce){
      resB.textContent=fmt(sB[YEARS]); resS.textContent=fmt(sS[YEARS]);
      lblB.textContent=fmt(sB[YEARS]); lblS.textContent=fmt(sS[YEARS]);
      gainB.textContent=fmt(sB[YEARS]-cap); gainS.textContent=fmt(sS[YEARS]-cap);
      return;
    }
    countUp(resB,sB[YEARS],4000,0);
    countUp(lblB,sB[YEARS],4000,0);
    countUp(resS,sS[YEARS],4000,700);
    countUp(lblS,sS[YEARS],4000,700);
    countUpGain(gainB,sB[YEARS]-cap,4000,0);
    countUpGain(gainS,sS[YEARS]-cap,4000,700);
  }

  if(reduce){pB.classList.add('in'); pS.classList.add('in'); runCounters();}
  else{
    const svg=document.getElementById('cmpChart');
    const cio=new IntersectionObserver((ents)=>{ents.forEach(en=>{if(en.isIntersecting){
      pB.classList.add('in');
      setTimeout(()=>pS.classList.add('in'),700);
      runCounters();
      cio.disconnect();
    }});},{threshold:.35});
    cio.observe(svg);
  }
})();

// ===== Dashboard sparkline mini-charts =====
(function(){
  const series = {
    valuacion:    [22,19,24,18,21,16,20,15,17,14],
    rentabilidad: [9,11,10,13,12,15,17,16,19,21],
    crecimiento:  [10,12,15,19,25,32,41,53,68,87],
    endeudamiento:[28,26,27,24,22,23,20,18,19,16]
  };
  document.querySelectorAll('.dash-spark').forEach(svg=>{
    const key = svg.dataset.series;
    const data = series[key] || series.valuacion;
    const W=300,H=54,max=Math.max(...data),min=Math.min(...data);
    const x=i=> (i/(data.length-1))*W;
    const y=v=> H - ((v-min)/(max-min||1))*H;
    const d = data.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
    const fillD = d + ` L${W},${H} L0,${H} Z`;
    svg.innerHTML = `<path class="fill" d="${fillD}"></path><path d="${d}"></path>`;
  });
})();

const sticky=document.getElementById('stickyCta');
window.addEventListener('scroll',()=>{sticky.classList.toggle('show', window.scrollY>700);},{passive:true});
