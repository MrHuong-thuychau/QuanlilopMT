/* Thủy Châu Art Class Manager v3.3.3 - Gọi tên thông minh
   1/2/3 học sinh, không trùng trong vòng, đánh dấu đã chấm/dò bài,
   thống kê đã gọi/chưa gọi và lịch sử theo lớp.
*/
(function(){
  'use strict';
  const KEY='tc_random_caller_v333';
  let db={}; try{db=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){db={}}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
  const cid=()=>typeof state!=='undefined'?state.currentClassId:'';
  const cname=()=>typeof curClass==='function'&&curClass()?curClass().name:'Chưa chọn lớp';
  const students=()=>typeof classStudents==='function'?classStudents():[];
  const data=()=>{db[cid()] ||= {called:[],done:[],history:[]}; return db[cid()]};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function pick(n){
    const ss=students(); if(!ss.length)return toast('Lớp chưa có học sinh.');
    const d=data(), used=new Set(d.called), pool=ss.filter(s=>!used.has(s.id));
    if(!pool.length){ if(!confirm('Đã gọi hết lớp. Bắt đầu vòng mới?'))return; d.called=[]; d.done=[]; d.history=[]; save(); return pick(n); }
    n=Math.max(1,Math.min(3,Number(n)||1)); n=Math.min(n,pool.length);
    pool.sort(()=>Math.random()-0.5);
    const chosen=pool.slice(0,n); const now=new Date().toISOString();
    chosen.forEach(s=>{d.called.push(s.id);d.history.push({id:s.id,name:s.name,time:now,done:false})});
    save(); render();
  }
  function toggleDone(id){
    const d=data(), h=d.history.find(x=>x.id===id && !x.done);
    if(h)h.done=true;
    if(!d.done.includes(id))d.done.push(id);
    save();render();
  }
  function reset(){if(confirm('Xóa lượt gọi của lớp này và bắt đầu vòng mới?')){db[cid()]={called:[],done:[],history:[]};save();render();}}
  function render(){
    const ss=students(), d=data(), called=new Set(d.called), remaining=ss.filter(s=>!called.has(s.id));
    const hist=d.history.slice().reverse();
    if(typeof pages==='undefined')return;
    pages.caller=()=>`<div class="page"><div class="section">
      <div class="section-head"><div><h2>🎲 Gọi tên / Chấm bài / Dò bài</h2><div class="muted">${esc(cname())} • ${ss.length} học sinh</div></div>
      <button class="btn secondary" onclick="tcCallerReset()">↺ Vòng mới</button></div>
      <div class="caller-toolbar"><span>Số học sinh gọi mỗi lượt:</span>
        <button class="btn secondary" onclick="tcCallerPick(1)">1</button>
        <button class="btn secondary" onclick="tcCallerPick(2)">2</button>
        <button class="btn secondary" onclick="tcCallerPick(3)">3</button>
        <b>Đã gọi: ${d.called.length}/${ss.length}</b><b>Còn lại: ${remaining.length}</b>
      </div>
      <div class="caller-panel"><div class="caller-card">
        <div class="caller-label">KẾT QUẢ LƯỢT GỌI</div>
        <div class="caller-names">${hist.length?hist.slice(0,3).map(x=>`<div class="caller-big">${esc(x.name)}</div>`).join(''):'?'}</div>
        <div class="caller-meta">Chọn 1, 2 hoặc 3 học sinh để gọi.</div>
      </div>
      <div class="caller-side"><h3>📋 Lịch sử</h3>
        ${hist.length?`<div class="caller-history">${hist.map((x,i)=>`<div class="caller-history-row"><span>${hist.length-i}</span><b>${esc(x.name)}</b><small>${x.done?'✅ Đã chấm':'⏳ Chưa chấm'}</small><button class="btn tiny" onclick="tcCallerDone('${esc(x.id)}')">${x.done?'Đã xong':'✓ Đã chấm'}</button></div>`).join('')}</div>`:'<div class="empty">Chưa có lượt gọi.</div>'}
      </div></div>
      <div class="notice">💡 Học sinh đã gọi sẽ không xuất hiện lại cho đến khi anh bấm <b>Vòng mới</b>. Có thể gọi 1–3 em mỗi lượt và đánh dấu đã chấm/dò bài.</div>
    </div></div>`;
    try{if(typeof window.render==='function')window.render()}catch(e){}
  }
  window.tcCallerPick=pick;window.tcCallerDone=toggleDone;window.tcCallerReset=reset;
  function mount(){
    const nav=document.querySelector('.sidebar'); if(!nav)return;
    if(!nav.querySelector('[data-page="caller"]')){
      const b=document.createElement('button');b.className='nav';b.dataset.page='caller';b.textContent='🎲 Gọi tên / Dò bài';nav.appendChild(b);b.onclick=()=>go('caller');
    }
    if(typeof pages!=='undefined')pages.caller=pages.caller||render;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  const st=document.createElement('style');st.textContent=`
    .caller-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 18px}
    .caller-toolbar .btn{min-width:44px}
    .caller-panel{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
    .caller-card{min-height:330px;border:1px solid #dbe7f2;border-radius:20px;padding:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(145deg,#f7fbff,#eef6ff)}
    .caller-big{font-size:clamp(32px,4vw,58px);font-weight:900;color:#1769aa;line-height:1.15;margin:5px}
    .caller-side{border:1px solid #e2e8f0;border-radius:20px;padding:20px;background:#fff}
    .caller-history{max-height:350px;overflow:auto}.caller-history-row{display:grid;grid-template-columns:30px 1fr auto auto;gap:7px;align-items:center;padding:9px 0;border-bottom:1px solid #edf2f7}
    .caller-history-row span{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e8f1fb;color:#1769aa;font-weight:800}
    .btn.tiny{padding:5px 8px;font-size:12px}
    @media(max-width:800px){.caller-panel{grid-template-columns:1fr}}
  `;document.head.appendChild(st);
})();
