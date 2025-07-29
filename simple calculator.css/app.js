let panelId = 0;
function addCalculatorPanel(data = {}) {
  const panel = document.createElement('div');
  panel.className = 'calculator';
  panel.id = 'calc-'+panelId++;
  panel.innerHTML = `
    <input class="input" value="${data.input||''}" readonly>
    <div class="result">Result: ${data.result||'--'}</div>
    <div class="buttons-grid">
      ${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(v=>
        `<button onclick="handleBtn(event)">${v}</button>`).join('')}
    </div>
    <div class="buttons-grid">
       ${['sin','cos','tan','sqrt','log','PI','E','^','C','⌫','(',')','='].map(v=>
         `<button onclick="handleBtn(event)">${v}</button>`).join('')}
    </div>
    <div class="assist-panel">
      <button onclick="startVoice(this)">🎙️Voice</button>
      <input class="aiPrompt" placeholder="Ask AI...">
      <button onclick="askAI(this)">Ask AI</button>
      <button onclick="explainResult(this)">🧠Explain</button>
    </div>
    <div class="history-panel"><ul class="historyList">${data.history||''}</ul></div>
  `;
  document.getElementById('panel-container').append(panel);
  applyTheme();
  makeDraggable(panel);
}
function handleBtn(e){
  const panel = e.target.closest('.calculator');
  const input = panel.querySelector('.input');
  const res = panel.querySelector('.result');
  const hist = panel.querySelector('.historyList');
  const v = e.target.textContent;
  if(v==='C') input.value='';
  else if(v==='⌫') input.value=input.value.slice(0,-1);
  else if(v==='='){
    try {
      let expr = input.value.replace('^','**').replace('PI','Math.PI').replace('E','Math.E');
      const val = eval(expr);
      res.textContent = 'Result: '+val;
      hist.innerHTML += `<li>${input.value} = ${val}</li>`;
    } catch { res.textContent='Error'; }
  } else if(['sin','cos','tan','sqrt','log'].includes(v)) {
    input.value += `Math.${v}(`;
  } else input.value+=v;
}
function makeDraggable(el){
  let dragging=false, ox=0, oy=0;
  el.addEventListener('mousedown',e=>{ dragging=true; ox=e.clientX-el.offsetLeft; oy=e.clientY-el.offsetTop; });
  document.addEventListener('mousemove', e =>{ if(dragging){ el.style.left=e.clientX-ox+'px'; el.style.top=e.clientY-oy+'px'; }});
  document.addEventListener('mouseup', ()=>dragging=false);
}
function startVoice(btn){
  const panel = btn.closest('.calculator');
  const input = panel.querySelector('.input');
  const rec = new (window.SpeechRecognition||window.webkitSpeechRecognition)();
  rec.lang = 'en-US'; rec.start();
  rec.onresult = e=> input.value += e.results[0][0].transcript;
}
function askAI(btn){
  const prompt = btn.closest('.calculator').querySelector('.aiPrompt').value;
  alert('AI: Basic explanation...');
}
function explainResult(btn){
  const panel = btn.closest('.calculator');
  alert('This result is from evaluating: '+ panel.querySelector('.input').value);
}
function applyTheme(){
  document.body.className = document.getElementById('themeSelect').value;
}
function saveSession(){
  const name = prompt('Name this session:','MySession');
  if(!name) return;
  const panels = [...document.querySelectorAll('.calculator')].map(p=>({
    input:p.querySelector('.input').value,
    result:p.querySelector('.result').textContent.replace('Result: ',''),
    history:p.querySelector('.historyList').innerHTML
  }));
  localStorage.setItem('session_'+name, JSON.stringify(panels));
  updateSessionList();
}
function loadNamedSession(){
  const name = document.getElementById('loadSessionSelect').value;
  if(!name) return;
  const data = JSON.parse(localStorage.getItem('session_'+name)||'[]');
  document.getElementById('panel-container').innerHTML='';
  data.forEach(d=>addCalculatorPanel(d));
}
function updateSessionList(){
  const sel = document.getElementById('loadSessionSelect');
  sel.innerHTML = Object.keys(localStorage)
    .filter(k=>k.startsWith('session_'))
    .map(k=>`<option>${k.slice(8)}</option>`).join('');
}
function exportSession(){
  const name = prompt('Export session name?','export');
  if(!name) return;
  const data = { theme: document.getElementById('themeSelect').value,
    panels: [...document.querySelectorAll('.calculator')].map(p=>({
      input:p.querySelector('.input').value,
      result:p.querySelector('.result').textContent,
      history:p.querySelector('.historyList').innerHTML
    }))
  };
  const blob = new Blob([JSON.stringify(data)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download = name+'.json'; a.click();
}
function importSession(){
  document.getElementById('fileInput').click();
}
function handleImport(e){
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload = ()=>{
    const data=JSON.parse(reader.result);
    document.getElementById('themeSelect').value = data.theme;
    applyTheme();
    document.getElementById('panel-container').innerHTML='';
    data.panels.forEach(p=>addCalculatorPanel(p));
  };
  reader.readAsText(f);
}
updateSessionList();
