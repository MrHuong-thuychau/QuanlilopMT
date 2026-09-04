/**
 * THỦY CHÂU ART CLASS MANAGER — CLOUD SYNC v3.4.1
 * Google Sheets + Apps Script backend.
 *
 * Thiết lập:
 * 1. Tạo Google Sheet riêng cho dữ liệu app.
 * 2. Extensions > Apps Script > dán toàn bộ file này.
 * 3. Project Settings > Script properties: SYNC_KEY = mã bí mật.
 * 4. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
 * 5. Dùng URL /exec trong Cài đặt > Đồng bộ của app.
 *
 * Dữ liệu được lưu trong sheet _APP_DATA: JSON ở A2, thời gian ở B2.
 */
const DATA_SHEET = "_APP_DATA";
function getSheet_(){
  const ss=SpreadsheetApp.getActive();
  let sh=ss.getSheetByName(DATA_SHEET);
  if(!sh){sh=ss.insertSheet(DATA_SHEET);sh.getRange("A1:B1").setValues([["JSON_DATA","UPDATED_AT"]]);sh.hideSheet();}
  return sh;
}
function keyOk_(key){
  const expected=PropertiesService.getScriptProperties().getProperty("SYNC_KEY")||"";
  return !!expected && String(key||"")===expected;
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
function jsonp_(obj,cb){
  if(!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(String(cb||"")))return json_(obj);
  return ContentService.createTextOutput(String(cb)+"("+JSON.stringify(obj)+");").setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function doGet(e){
  try{
    const p=e?.parameter||{};
    if(p.action!=="pull")return json_({ok:true,service:"ThuyChauArtClassManager",version:"3.4"});
    if(!keyOk_(p.key))return jsonp_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."},p.callback);
    const sh=getSheet_(),raw=String(sh.getRange("A2").getValue()||"");
    let data=null;if(raw){try{data=JSON.parse(raw)}catch(err){return jsonp_({ok:false,error:"Dữ liệu trong Google Sheets bị lỗi JSON."},p.callback)}}
    const at=String(sh.getRange("B2").getValue()||"");
    return jsonp_({ok:true,data,updatedAt:at||""},p.callback);
  }catch(err){return jsonp_({ok:false,error:String(err)},e?.parameter?.callback)}
}

function mergeSync_(current,incoming){
  if(!current)return incoming;
  if(!incoming)return current;
  const out=JSON.parse(JSON.stringify(current));
  const cm=current._syncMeta||{}, im=incoming._syncMeta||{};
  const collections=["classes","students","attendance","scores","seating","comments","commentBank"];
  out._syncMeta={collections:{}};
  collections.forEach(k=>{
    const ca=Array.isArray(current[k])?current[k]:[], ia=Array.isArray(incoming[k])?incoming[k]:[];
    const keyed=ca.some(x=>x&&x.id!=null)||ia.some(x=>x&&x.id!=null);
    if(!keyed){
      const ct=cm.collections?.[k]?.__whole||"", it=im.collections?.[k]?.__whole||"";
      out[k]=it>ct?ia:ca;
      out._syncMeta.collections[k]={__whole:it>ct?it:ct};
      return;
    }
    const cBy=new Map(ca.filter(x=>x&&x.id!=null).map(x=>[String(x.id),x]));
    const iBy=new Map(ia.filter(x=>x&&x.id!=null).map(x=>[String(x.id),x]));
    const metaC=cm.collections?.[k]||{}, metaI=im.collections?.[k]||{};
    const ids=new Set([...cBy.keys(),...iBy.keys(),...Object.keys(metaC),...Object.keys(metaI)]);
    const outMeta={}; const arr=[];
    ids.forEach(id=>{
      const a=metaC[id], b=metaI[id];
      const at=typeof a==='string'?a:(a?.deletedAt||"");
      const bt=typeof b==='string'?b:(b?.deletedAt||"");
      const chooseIncoming=bt>at || (!at&&!bt&&iBy.has(id));
      const chosen=chooseIncoming?b:a;
      if(chosen!==undefined)outMeta[id]=chosen;
      const deleted=chosen&&typeof chosen==='object'&&chosen.deletedAt;
      const item=chooseIncoming?iBy.get(id):cBy.get(id);
      if(!deleted&&item)arr.push(item);
    });
    out[k]=arr; out._syncMeta.collections[k]=outMeta;
  });
  const ct=cm.settingsUpdatedAt||"", it=im.settingsUpdatedAt||"";
  if(it>ct){
    out.settings={...current.settings,teacher:incoming.settings?.teacher||"",school:incoming.settings?.school||"",schoolYear:incoming.settings?.schoolYear||""};
  }
  out._syncMeta.settingsUpdatedAt=it>ct?it:ct;
  out._localUpdatedAt=it>ct?incoming._localUpdatedAt:current._localUpdatedAt;
  return out;
}

function backupCloud_(sh,reason){
  const raw=String(sh.getRange("A2").getValue()||"");
  if(!raw)return;
  const ss=sh.getParent();let b=ss.getSheetByName("_APP_BACKUPS");
  if(!b){b=ss.insertSheet("_APP_BACKUPS");b.getRange("A1:C1").setValues([["BACKED_UP_AT","REASON","JSON_DATA"]]);b.hideSheet();}
  b.appendRow([new Date().toISOString(),reason,raw]);
}
function doPost(e){
  try{
    const p=e?.parameter||{}; let body={};
    if(e?.postData?.contents){try{body=JSON.parse(e.postData.contents||"{}")}catch(_) {}}
    const action=body.action||p.action,key=body.key||p.key;
    if(action!=="push"&&action!=="initialize")return json_({ok:false,error:"Action không hợp lệ."});
    if(!keyOk_(key))return json_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."});
    const rawData=body.data!==undefined?body.data:p.data;
    if(!rawData)return json_({ok:false,error:"Thiếu dữ liệu."});
    let incoming=rawData;if(typeof incoming==="string"){try{incoming=JSON.parse(incoming)}catch(err){return json_({ok:false,error:"Dữ liệu gửi lên không phải JSON hợp lệ."})}}
    if(!incoming||typeof incoming!=="object")return json_({ok:false,error:"Dữ liệu không hợp lệ."});
    const lock=LockService.getScriptLock();lock.waitLock(15000);
    try{
      const sh=getSheet_();
      if(action==="initialize"){
        backupCloud_(sh,"Trước khi thiết lập Cloud làm dữ liệu gốc");
        const now=new Date().toISOString();
        sh.getRange("A2:B2").setValues([[JSON.stringify(incoming),now]]);
        return json_({ok:true,mode:"initialized",updatedAt:now,data:incoming});
      }
      const raw=String(sh.getRange("A2").getValue()||"");
      let current=null;if(raw){try{current=JSON.parse(raw)}catch(_) {current=null}}
      const merged=mergeSync_(current,incoming);
      const now=new Date().toISOString();
      sh.getRange("A2:B2").setValues([[JSON.stringify(merged),now]]);
      return json_({ok:true,mode:"merged",updatedAt:now,data:merged});
    }finally{lock.releaseLock()}
  }catch(err){return json_({ok:false,error:String(err)})}
}
