/* Thủy Châu Art Class Manager v3.3.3
   Cloud Sync 2.0 - Google Sheets / Apps Script
   Thiết kế để chạy từ GitHub Pages mà không phụ thuộc CORS:
   - PUSH: form POST tới Apps Script, không đọc response.
   - PULL: JSONP qua <script>, đọc dữ liệu trả về.
   - Dữ liệu app được snapshot từ localStorage nên không cần biết key nội bộ của app.
*/
(function(){
  'use strict';
  const CFG='tc_cloud_sync_v333';
  const DEFAULT_URL='https://script.google.com/macros/s/AKfycbwOumg33r3vDJTQDDJ1AhyKPvpdfkfUwz0QRomeKQidURXNEstOQBCSh-16aVLWIRj4/exec';

  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function cfg(){try{return Object.assign({url:DEFAULT_URL,key:'',auto:false},JSON.parse(localStorage.getItem(CFG)||'{}'))}catch(e){return {url:DEFAULT_URL,key:'',auto:false}}}
  function saveCfg(c){localStorage.setItem(CFG,JSON.stringify(c))}
  function toast2(m){ if(typeof window.toast==='function') return window.toast(m); let e=document.getElementById('toast'); if(e){e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2500)} else alert(m); }
  function snapshot(){
    const data={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k && k!==CFG){
        try{data[k]=JSON.parse(localStorage.getItem(k))}catch(e){data[k]=localStorage.getItem(k)}
      }
    }
    return data;
  }
  function restore(data){
    if(!data || typeof data!=='object') throw new Error('Dữ liệu cloud không hợp lệ');
    Object.entries(data).forEach(([k,v])=>{
      if(k===CFG) return;
      localStorage.setItem(k, typeof v==='string'?v:JSON.stringify(v));
    });
  }
  function cleanUrl(u){return String(u||'').trim().replace(/\/+$/,'')}
  function validUrl(u){return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(cleanUrl(u))}
  function now(){return new Date().toISOString()}

  function ensureForm(){
    let f=document.getElementById('tcCloudPostForm');
    if(f)return f;
    f=document.createElement('form'); f.id='tcCloudPostForm'; f.method='POST'; f.target='tcCloudPostFrame';
    f.style.display='none';
    const iframe=document.createElement('iframe'); iframe.name='tcCloudPostFrame'; iframe.id='tcCloudPostFrame'; iframe.style.display='none';
    document.body.appendChild(iframe); document.body.appendChild(f); return f;
  }

  function push(){
    const c=cfg(), url=cleanUrl(c.url);
    if(!validUrl(url)) return toast2('URL Web App chưa đúng. Phải kết thúc bằng /exec');
    if(!c.key) return toast2('Anh chưa nhập mã đồng bộ (SYNC_KEY).');
    const payload=JSON.stringify(snapshot());
    const f=ensureForm(); f.action=url; f.innerHTML='';
    [['action','push'],['key',c.key],['updatedAt',now()],['payload',payload]].forEach(([n,v])=>{
      const i=document.createElement('input'); i.type='hidden'; i.name=n; i.value=v; f.appendChild(i);
    });
    try{f.submit(); localStorage.setItem('tc_cloud_last_push',now()); toast2('☁️ Đã gửi dữ liệu lên Google Sheets. Chờ 1–2 giây để hoàn tất.');}
    catch(e){toast2('❌ Không gửi được dữ liệu: '+e.message)}
  }

  window.tcCloudJsonpResult=function(resp){
    if(!resp || !resp.ok) return toast2('❌ Cloud báo lỗi: '+(resp&&resp.error||'Không xác định'));
    try{
      restore(resp.data);
      localStorage.setItem('tc_cloud_last_pull',resp.updatedAt||now());
      toast2('⬇️ Đã tải dữ liệu từ Google Sheets. Đang làm mới ứng dụng…');
      setTimeout(()=>location.reload(),350);
    }catch(e){toast2('❌ Dữ liệu cloud lỗi: '+e.message)}
  };

  function pull(){
    const c=cfg(), url=cleanUrl(c.url);
    if(!validUrl(url)) return toast2('URL Web App chưa đúng. Phải kết thúc bằng /exec');
    if(!c.key) return toast2('Anh chưa nhập mã đồng bộ (SYNC_KEY).');
    const old=document.getElementById('tcCloudJsonp'); if(old) old.remove();
    const s=document.createElement('script'); s.id='tcCloudJsonp';
    const cb='tcCloudJsonpResult';
    s.src=url+'?action=pull&key='+encodeURIComponent(c.key)+'&callback='+cb+'&_='+Date.now();
    s.onerror=()=>toast2('❌ Không tải được dữ liệu. Kiểm tra quyền Web App: Bất kỳ ai.');
    document.head.appendChild(s);
  }

  function saveSettings(){
    const url=document.getElementById('tcCloudUrl')?.value.trim()||DEFAULT_URL;
    const key=document.getElementById('tcCloudKey')?.value.trim()||'';
    const auto=!!document.getElementById('tcCloudAuto')?.checked;
    if(!validUrl(url)) return toast2('URL không hợp lệ. Dùng URL /exec của Ứng dụng web.');
    saveCfg({url,key,auto}); toast2('✅ Đã lưu cấu hình đồng bộ.');
  }

  function render(){
    const c=cfg();
    return `<div class="section tc-cloud-box">
      <div class="section-head"><div><h2>☁️ Đồng bộ dữ liệu Google Sheets</h2><div class="muted">Dùng chung dữ liệu giữa máy ở nhà và máy ở trường.</div></div></div>
      <div class="form-grid">
        <label>URL Web App Google Apps Script<input id="tcCloudUrl" value="${esc(c.url)}" placeholder="https://script.google.com/macros/s/.../exec"></label>
        <label>Mã đồng bộ (SYNC_KEY)<input id="tcCloudKey" type="password" value="${esc(c.key)}" placeholder="Mã anh đã tạo trong Thuộc tính tập lệnh"></label>
      </div>
      <label class="checkline"><input id="tcCloudAuto" type="checkbox" ${c.auto?'checked':''}> Tự động đẩy cloud sau khi anh lưu dữ liệu (nếu trình duyệt cho phép)</label>
      <div class="btn-row" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn secondary" onclick="tcCloudSaveSettings()">💾 Lưu cấu hình</button>
        <button class="btn primary" onclick="tcCloudPush()">⬆️ Cập nhật lên Google Sheets</button>
        <button class="btn secondary" onclick="tcCloudPull()">⬇️ Tải dữ liệu từ Google Sheets</button>
      </div>
      <div class="notice" style="margin-top:14px">🔐 <b>An toàn:</b> ứng dụng không cần mở quyền chỉnh sửa Google Sheets cho người khác. Web App chạy dưới tài khoản của anh; mã SYNC_KEY được dùng để xác thực.</div>
      <div class="muted" style="margin-top:8px">Lần đẩy gần nhất: ${esc(localStorage.getItem('tc_cloud_last_push')||'Chưa có')}<br>Lần tải gần nhất: ${esc(localStorage.getItem('tc_cloud_last_pull')||'Chưa có')}</div>
    </div>`;
  }

  window.tcCloudPush=push; window.tcCloudPull=pull; window.tcCloudSaveSettings=saveSettings;
  window.tcCloudSnapshot=snapshot;

  function mount(){
    if(document.getElementById('tcCloudMount')) return;
    const nav=document.querySelector('.sidebar');
    if(!nav)return;
    const b=document.createElement('button'); b.className='nav'; b.dataset.page='cloudsync'; b.textContent='☁️ Đồng bộ Google Sheets';
    nav.appendChild(b); b.onclick=()=>{ if(typeof go==='function') go('cloudsync'); else renderCloudPage(); };
    window.renderCloudPage=()=>{const c=document.getElementById('content'); if(c)c.innerHTML='<div class="page">'+render()+'</div>';};
    // Try to integrate with app's pages object if available.
    if(typeof window.pages!=='undefined' && window.pages) window.pages.cloudsync=()=>render();
    b.id='tcCloudMount';
  }
  function boot(){mount(); setTimeout(mount,500)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();

  // Tự động push sau các thao tác lưu của app nếu người dùng bật cờ.
  let lastHash='';
  setInterval(()=>{
    const c=cfg(); if(!c.auto || !c.key)return;
    const raw=JSON.stringify(snapshot()); const h=raw.length+':'+raw.slice(0,80)+':'+raw.slice(-80);
    if(lastHash && h!==lastHash){ lastHash=h; push(); } else if(!lastHash) lastHash=h;
  },8000);

  const st=document.createElement('style'); st.textContent=`
    .tc-cloud-box{border:1px solid #dbe7f2}
    .tc-cloud-box .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .tc-cloud-box label{display:flex;flex-direction:column;gap:6px;font-weight:700}
    .tc-cloud-box input{padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}
    .tc-cloud-box .checkline{display:flex;flex-direction:row;align-items:center;font-weight:500;margin-top:14px}
    @media(max-width:800px){.tc-cloud-box .form-grid{grid-template-columns:1fr}}
  `; document.head.appendChild(st);
})();
