const reduceGate = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Fondo animado (mismo estilo que el hero de la landing) =====
(function(){
  const canvas=document.getElementById('gateCanvas');
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
    if(!reduceGate) requestAnimationFrame(step);
  }
  init();
  step();
  window.addEventListener('resize',()=>{init();},{passive:true});
})();

// ===== Selector de país =====
const paisSelect = document.getElementById('gPais');
if (paisSelect && typeof PAISES !== 'undefined') {
  PAISES.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = p.dial ? `${p.name} (${p.dial})` : p.name;
    if (p.code === 'CR') opt.selected = true;
    paisSelect.appendChild(opt);
  });
}

// ===== Envío del formulario =====
const gateForm = document.getElementById('gateForm');
const gateError = document.getElementById('gateError');
const gateSubmitBtn = document.getElementById('gateSubmitBtn');
const gateSubmitLabel = document.getElementById('gateSubmitLabel');
const gateLoader = document.getElementById('gateLoader');
const gateSuccess = document.getElementById('gateSuccess');

gateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  gateError.classList.remove('show');

  const nombre = document.getElementById('gNombre').value.trim();
  const email = document.getElementById('gEmail').value.trim();
  const telefono = document.getElementById('gTelefono').value.trim();
  const paisCode = paisSelect.value;
  const pais = PAISES.find((p) => p.code === paisCode);

  if (!nombre || !email || !telefono || !paisCode) {
    gateError.textContent = 'Por favor completá todos los campos.';
    gateError.classList.add('show');
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    gateError.textContent = 'Ingresá un correo electrónico válido.';
    gateError.classList.add('show');
    return;
  }

  gateSubmitBtn.disabled = true;
  gateSubmitLabel.style.display = 'none';
  gateLoader.classList.add('show');

  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        email,
        telefono: `${pais && pais.dial ? pais.dial + ' ' : ''}${telefono}`,
        pais: pais ? pais.name : '',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const msg =
        data.error === 'systeme_rejected' && /correo/i.test(data.detail || '')
          ? 'Ese correo no parece válido. Revisalo e intentá de nuevo.'
          : 'Algo salió mal. Intentá de nuevo en un momento.';
      throw new Error(msg);
    }

    gateForm.style.display = 'none';
    gateSuccess.classList.add('show');
    setTimeout(() => {
      window.location.href = 'landing.html';
    }, 1400);
  } catch (err) {
    gateSubmitBtn.disabled = false;
    gateSubmitLabel.style.display = 'inline';
    gateLoader.classList.remove('show');
    gateError.textContent = err.message || 'Algo salió mal. Intentá de nuevo en un momento.';
    gateError.classList.add('show');
  }
});
