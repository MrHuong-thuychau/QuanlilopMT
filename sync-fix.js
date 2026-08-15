/* Thủy Châu Art Class Manager — Cloud Sync Fix v3.3.1
   Dùng JSONP cho pull và form POST ẩn cho push để tránh lỗi CORS trên GitHub Pages.
*/
(function(){
  const SYNC_TIMEOUT=20000;
  function cfg(){
    const s=window.state || null;
    const settings=s?.settings || {};
    return {url:String(settings.cloudUrl||"").trim(), key:String(settings.cloudKey||"").trim()};
  }
  function setStatus(msg){
    try{
      if(window.state){
        state._cloudStatus=msg;
        localStorage.setItem(window.KEY || "tc_art_class_manager_v2", JSON.stringify(state));
      }
    }catch(e){}
  }
  function syncConfigOK(silent){
    const {url,key}=cfg();
    if(!url||!key){
      if(!silent && window.toast) toast("Hãy nhập URL và mã đồng bộ trong Cài đặt");
      return false;
    }
    return true;
  }

  // GET không dùng fetch: JSONP tránh CORS của Google Apps Script ContentService.
  window.pullCloud=function(silent=false){
    if(!syncConfigOK(silent) || window.syncBusy) return Promise.resolve(false);
    window.syncBusy=true;
    return new Promise(resolve=>{
      const cb="tcCloud_"+Date.now()+"_"+Math.random().toString(36).slice(2);
      const script=document.createElement("script");
      const timer=setTimeout(()=>{
        cleanup();
        setStatus("Lỗi đồng bộ: hết thời gian chờ cloud");
        if(!silent){ if(window.render) render(); alert("Không thể tải dữ liệu từ cloud.\n\nKiểm tra URL Web App và mã đồng bộ."); }
        window.syncBusy=false; resolve(false);
      },SYNC_TIMEOUT);
      function cleanup(){
        clearTimeout(timer);
        try{delete window[cb]}catch(e){window[cb]=undefined}
        script.remove();
      }
      window[cb]=function(j){
        cleanup();
        try{
          if(!j || j.ok===false) throw new Error(j?.error||"Cloud trả về lỗi");
          if(!j.data){
            setStatus("Cloud chưa có dữ liệu");
            if(!silent){if(window.render)render();if(window.toast)toast("Cloud chưa có dữ liệu");}
            window.syncBusy=false; resolve(true); return;
          }
          if(!silent && !confirm("Tải dữ liệu từ cloud sẽ thay thế dữ liệu hiện tại trên máy này. Tiếp tục?")){
            window.syncBusy=false; resolve(false); return;
          }
          const keep={
            cloudUrl:state.settings.cloudUrl,
            cloudKey:state.settings.cloudKey,
            autoSync:state.settings.autoSync
          };
          state={...structuredClone(DEFAULT),...j.data};
          state.settings={...state.settings,...keep};
          state._cloudUpdatedAt=j.updatedAt||new Date().toISOString();
          state._localUpdatedAt=j.updatedAt||state._localUpdatedAt;
          state._cloudStatus="Đã tải dữ liệu từ cloud";
          localStorage.setItem(window.KEY || "tc_art_class_manager_v2",JSON.stringify(state));
          if(window.render)render();
          if(!silent&&window.toast)toast("☁️ Đã tải dữ liệu từ cloud");
          window.syncBusy=false; resolve(true);
        }catch(e){
          setStatus("Lỗi đồng bộ: "+e.message);
          if(!silent){if(window.render)render();alert("Không thể tải dữ liệu từ cloud.\n\n"+e.message);}
          window.syncBusy=false; resolve(false);
        }
      };
      const {url,key}=cfg();
      const sep=url.includes("?")?"&":"?";
      script.src=url+sep+"action=pull&key="+encodeURIComponent(key)+"&callback="+encodeURIComponent(cb)+"&_="+Date.now();
      script.onerror=()=>{
        cleanup();
        setStatus("Lỗi đồng bộ: không gọi được Web App");
        if(!silent){if(window.render)render();alert("Không thể kết nối Google Apps Script.\n\nHãy kiểm tra URL /exec và quyền 'Bất kỳ ai'.");}
        window.syncBusy=false; resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  // POST dạng form + iframe: không phát sinh preflight/CORS.
  window.pushCloud=function(silent=false){
    if(!syncConfigOK(silent) || window.syncBusy) return Promise.resolve(false);
    window.syncBusy=true;
    return new Promise(resolve=>{
      const {url,key}=cfg();
      const iframe=document.createElement("iframe");
      const form=document.createElement("form");
      const payload={
        action:"push",
        key:key,
        clientUpdatedAt:state._localUpdatedAt||new Date().toISOString(),
        data:state
      };
      const frameName="tc_cloud_frame_"+Date.now();
      iframe.name=frameName;
      iframe.style.display="none";
      form.method="POST";
      form.action=url;
      form.target=frameName;
      form.style.display="none";
      const input=document.createElement("input");
      input.type="hidden";
      input.name="payload";
      input.value=JSON.stringify(payload);
      form.appendChild(input);
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      const started=Date.now();
      const finish=()=>{
        if(!form.parentNode)return;
        form.remove();iframe.remove();
        state._cloudUpdatedAt=state._localUpdatedAt||new Date().toISOString();
        state._cloudStatus="Đã gửi dữ liệu lên cloud";
        try{localStorage.setItem(window.KEY || "tc_art_class_manager_v2",JSON.stringify(state));}catch(e){}
        if(!silent){if(window.render)render();if(window.toast)toast("☁️ Đã đồng bộ lên cloud");}
        window.syncBusy=false;resolve(true);
      };
      setTimeout(finish,1200);
      setTimeout(()=>{if(form.parentNode){form.remove();iframe.remove();state._cloudStatus="Đã gửi dữ liệu lên cloud";window.syncBusy=false;resolve(true);}},SYNC_TIMEOUT);
      // tránh cảnh báo trình duyệt khi iframe bị giữ quá lâu
      void started;
      form.submit();
    });
  };

  window.syncCloud=function(){
    if(!syncConfigOK(false)||window.syncBusy)return;
    window.syncBusy=true;
    // Đọc cloud trước bằng JSONP; sau đó quyết định tải hoặc đẩy.
    const {url,key}=cfg();
    const cb="tcSync_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const script=document.createElement("script");
    let done=false;
    const timer=setTimeout(()=>{
      cleanup();window.syncBusy=false;
      state._cloudStatus="Lỗi đồng bộ: hết thời gian chờ cloud";
      if(window.render)render();
      alert("Đồng bộ thất bại: không nhận được phản hồi từ cloud.");
    },SYNC_TIMEOUT);
    function cleanup(){clearTimeout(timer);try{delete window[cb]}catch(e){}script.remove();}
    window[cb]=async function(j){
      if(done)return;done=true;cleanup();
      try{
        if(!j||j.ok===false)throw new Error(j?.error||"Cloud trả về lỗi");
        const serverAt=j.updatedAt||"";
        const localAt=state._localUpdatedAt||"";
        if(j.data && serverAt && (!localAt || serverAt>localAt)){
          if(!confirm("Cloud có dữ liệu mới hơn máy này. Tải dữ liệu cloud xuống và thay thế dữ liệu hiện tại?")){
            window.syncBusy=false;return;
          }
          const keep={cloudUrl:state.settings.cloudUrl,cloudKey:state.settings.cloudKey,autoSync:state.settings.autoSync};
          state={...structuredClone(DEFAULT),...j.data};
          state.settings={...state.settings,...keep};
          state._cloudUpdatedAt=serverAt;state._localUpdatedAt=serverAt;
          state._cloudStatus="Đã nhận dữ liệu mới từ cloud";
          localStorage.setItem(window.KEY || "tc_art_class_manager_v2",JSON.stringify(state));
          if(window.render)render();if(window.toast)toast("🔄 Đã lấy dữ liệu mới nhất từ cloud");
          window.syncBusy=false;return;
        }
        // Cloud không mới hơn: gửi dữ liệu máy hiện tại.
        window.syncBusy=false;
        await window.pushCloud(false);
      }catch(e){
        window.syncBusy=false;
        state._cloudStatus="Lỗi đồng bộ: "+e.message;
        if(window.render)render();alert("Đồng bộ thất bại.\n\n"+e.message);
      }
    };
    const sep=url.includes("?")?"&":"?";
    script.src=url+sep+"action=pull&key="+encodeURIComponent(key)+"&callback="+encodeURIComponent(cb)+"&_="+Date.now();
    script.onerror=()=>{if(done)return;done=true;cleanup();window.syncBusy=false;alert("Không thể kết nối Google Apps Script.");};
    document.head.appendChild(script);
  };

  // Ghi đè hàm auto-sync dùng trong app.js.
  window.scheduleAutoSync=function(){
    if(!state.settings?.autoSync||!state.settings?.cloudUrl||!state.settings?.cloudKey||window.syncBusy)return;
    clearTimeout(window.syncTimer);
    window.syncTimer=setTimeout(()=>window.pushCloud(true),1800);
  };
})();
