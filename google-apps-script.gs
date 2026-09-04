/**
 * THỦY CHÂU ART CLASS MANAGER — CLOUD SYNC V4.0
 * Google Sheets + Apps Script backend.
 *
 * V4.0 principles:
 * - PUBLISH = thay thế toàn bộ dữ liệu Cloud bằng đúng bộ dữ liệu trên máy chuẩn.
 * - PUSH = cập nhật có kiểm soát phiên bản; nếu Cloud đã đổi kể từ lần pull, server TỪ CHỐI ghi đè.
 * - PULL trả version/publishId/checksum để client xác nhận chính xác.
 * - Luôn backup A2 trước PUBLISH.
 */
const DATA_SHEET="_APP_DATA";
function getSheet_(){const ss=SpreadsheetApp.getActive();let sh=ss.getSheetByName(DATA_SHEET);if(!sh){sh=ss.insertSheet(DATA_SHEET);sh.getRange("A1:F1").setValues([["JSON_DATA","UPDATED_AT","VERSION","PUBLISH_ID","CHECKSUM","MODE"]]);sh.hideSheet()}else if(sh.getLastColumn()<6)sh.getRange("A1:F1").setValues([["JSON_DATA","UPDATED_AT","VERSION","PUBLISH_ID","CHECKSUM","MODE"]]);return sh}
function keyOk_(key){const expected=PropertiesService.getScriptProperties().getProperty("SYNC_KEY")||"";return !!expected&&String(key||"")===expected}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
function jsonp_(obj,cb){if(!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(String(cb||"")))return json_(obj);return ContentService.createTextOutput(String(cb)+"("+JSON.stringify(obj)+");").setMimeType(ContentService.MimeType.JAVASCRIPT)}
function canonical_(x){const y=JSON.parse(JSON.stringify(x||{}));["_cloudStatus","_cloudUpdatedAt","_cloudVersion","_cloudPublishId","_cloudChecksum","_syncPushId","_syncPushStartedAt","_baseVersion"].forEach(k=>delete y[k]);if(y.settings)y.settings={teacher:y.settings.teacher||"",school:y.settings.school||"",schoolYear:y.settings.schoolYear||""};return JSON.stringify(y)}
function fingerprint_(x){let h=2166136261>>>0,s=canonical_(x);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return (h>>>0).toString(16).padStart(8,"0")}
function readCloud_(sh){const raw=String(sh.getRange("A2").getValue()||"");let data=null;if(raw){try{data=JSON.parse(raw)}catch(e){throw new Error("Dữ liệu trong _APP_DATA!A2 bị lỗi JSON.")}}return {data,updatedAt:String(sh.getRange("B2").getValue()||""),version:Number(sh.getRange("C2").getValue()||0)||0,publishId:String(sh.getRange("D2").getValue()||""),checksum:String(sh.getRange("E2").getValue()||"")}}
function backupCloud_(sh,reason){const raw=String(sh.getRange("A2").getValue()||"");if(!raw)return;const ss=sh.getParent();let b=ss.getSheetByName("_APP_BACKUPS");if(!b){b=ss.insertSheet("_APP_BACKUPS");b.getRange("A1:F1").setValues([["BACKED_UP_AT","REASON","VERSION","PUBLISH_ID","CHECKSUM","JSON_DATA"]]);b.hideSheet()}const c=readCloud_(sh);b.appendRow([new Date().toISOString(),reason,c.version,c.publishId,c.checksum,raw])}
function ensureSyncMeta_(x,at){const out=JSON.parse(JSON.stringify(x||{})),m=out._syncMeta;if(m&&m.collections&&(Object.keys(m.collections).length||m.settingsUpdatedAt))return out;const t=String(at||out._localUpdatedAt||out._lastSaved||new Date().toISOString());out._syncMeta={collections:{},settingsUpdatedAt:t};["classes","students","attendance","scores","seating","comments","commentBank"].forEach(k=>{const a=Array.isArray(out[k])?out[k]:[],z={};if(a.some(v=>v&&v.id!=null))a.forEach(v=>{if(v&&v.id!=null)z[String(v.id)]=t});else z.__whole=t;out._syncMeta.collections[k]=z});return out}
function mergeSync_(current,incoming){
  if(!current)return incoming;if(!incoming)return current;const out=JSON.parse(JSON.stringify(current)),cm=current._syncMeta||{},im=incoming._syncMeta||{},ks=["classes","students","attendance","scores","seating","comments","commentBank"];out._syncMeta={collections:{}};
  ks.forEach(k=>{const ca=Array.isArray(current[k])?current[k]:[],ia=Array.isArray(incoming[k])?incoming[k]:[],keyed=ca.some(x=>x&&x.id!=null)||ia.some(x=>x&&x.id!=null);if(!keyed){const ct=cm.collections?.[k]?.__whole||"",it=im.collections?.[k]?.__whole||"";out[k]=it>ct?ia:ca;out._syncMeta.collections[k]={__whole:it>ct?it:ct};return}const cBy=new Map(ca.filter(x=>x&&x.id!=null).map(x=>[String(x.id),x])),iBy=new Map(ia.filter(x=>x&&x.id!=null).map(x=>[String(x.id),x])),mc=cm.collections?.[k]||{},mi=im.collections?.[k]||{},ids=new Set([...cBy.keys(),...iBy.keys(),...Object.keys(mc),...Object.keys(mi)]),meta={},arr=[];ids.forEach(id=>{const a=mc[id],b=mi[id],at=typeof a==="string"?a:(a?.deletedAt||""),bt=typeof b==="string"?b:(b?.deletedAt||""),inc=bt>at||(!at&&!bt&&iBy.has(id)),chosen=inc?b:a,item=inc?iBy.get(id):cBy.get(id);if(chosen!==undefined)meta[id]=chosen;if(!(chosen&&typeof chosen==="object"&&chosen.deletedAt)&&item)arr.push(item)});out[k]=arr;out._syncMeta.collections[k]=meta});const ct=cm.settingsUpdatedAt||"",it=im.settingsUpdatedAt||"";if(it>ct)out.settings={...current.settings,teacher:incoming.settings?.teacher||"",school:incoming.settings?.school||"",schoolYear:incoming.settings?.schoolYear||""};out._syncMeta.settingsUpdatedAt=it>ct?it:ct;out._localUpdatedAt=it>ct?incoming._localUpdatedAt:current._localUpdatedAt;return out}
function doGet(e){try{const p=e?.parameter||{};if(p.action!=="pull")return json_({ok:true,service:"ThuyChauArtClassManager",version:"4.0"});if(!keyOk_(p.key))return jsonp_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."},p.callback);const sh=getSheet_(),c=readCloud_(sh);return jsonp_({ok:true,data:c.data,updatedAt:c.updatedAt,version:c.version,publishId:c.publishId,checksum:c.checksum,mode:String(sh.getRange("F2").getValue()||"")},p.callback)}catch(err){return jsonp_({ok:false,error:String(err)},e?.parameter?.callback)}}
function doPost(e){
  try{
    const p=e?.parameter||{};let body={};if(e?.postData?.contents){try{body=JSON.parse(e.postData.contents||"{}")}catch(_) {}}
    const action=body.action||p.action,key=body.key||p.key;if(!["push","publish"].includes(action))return json_({ok:false,error:"Action không hợp lệ trong V4.0."});if(!keyOk_(key))return json_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."});
    let incoming=body.data!==undefined?body.data:p.data;if(typeof incoming==="string")incoming=JSON.parse(incoming);if(!incoming||typeof incoming!=="object")return json_({ok:false,error:"Dữ liệu không hợp lệ."});
    const lock=LockService.getScriptLock();lock.waitLock(20000);try{const sh=getSheet_(),c=readCloud_(sh),now=new Date().toISOString();incoming=ensureSyncMeta_(incoming,incoming._localUpdatedAt||incoming._lastSaved||now);const publishId=String(incoming._syncPushId||Utilities.getUuid());
      if(action==="publish"){
        backupCloud_(sh,"V4.0 — trước khi XUẤT BẢN toàn bộ");const ver=c.version+1;const fp=fingerprint_(incoming);sh.getRange("A2:F2").setValues([[JSON.stringify(incoming),now,ver,publishId,fp,"publish"]]);return json_({ok:true,mode:"published",updatedAt:now,version:ver,publishId,checksum:fp,data:incoming});
      }
      const base=Number(incoming._baseVersion||0);if(c.data&&base!==c.version)return json_({ok:false,conflict:true,error:"Cloud đã thay đổi sau lần máy này tải dữ liệu. Không ghi đè để bảo toàn dữ liệu mới.",version:c.version,updatedAt:c.updatedAt,publishId:c.publishId,checksum:c.checksum,data:c.data});
      const merged=mergeSync_(c.data,incoming),ver=c.version+1,fp=fingerprint_(merged);sh.getRange("A2:F2").setValues([[JSON.stringify(merged),now,ver,publishId,fp,"push"]]);return json_({ok:true,mode:"pushed",updatedAt:now,version:ver,publishId,checksum:fp,data:merged});
    }finally{lock.releaseLock()}
  }catch(err){return json_({ok:false,error:String(err)})}
}
