/**
 * THỦY CHÂU ART CLASS MANAGER — CLOUD SYNC v3.4
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
    const sh=getSheet_(),raw=String(sh.getRange("A2").getValue()||""),at=String(sh.getRange("B2").getValue()||"");
    let data=null;if(raw){try{data=JSON.parse(raw)}catch(err){return jsonp_({ok:false,error:"Dữ liệu trong Google Sheets bị lỗi JSON."},p.callback)}}
    return jsonp_({ok:true,data,updatedAt:at||""},p.callback);
  }catch(err){return jsonp_({ok:false,error:String(err)},e?.parameter?.callback)}
}
function doPost(e){
  try{
    const p=e?.parameter||{};
    let body={};
    if(e?.postData?.contents){try{body=JSON.parse(e.postData.contents||"{}")}catch(_){}}
    const action=body.action||p.action,key=body.key||p.key;
    if(action!=="push")return json_({ok:false,error:"Action không hợp lệ."});
    if(!keyOk_(key))return json_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."});
    const rawData=body.data!==undefined?body.data:p.data;
    if(!rawData)return json_({ok:false,error:"Thiếu dữ liệu."});
    let data=rawData;if(typeof data==="string"){try{data=JSON.parse(data)}catch(err){return json_({ok:false,error:"Dữ liệu gửi lên không phải JSON hợp lệ."})}}
    if(!data||typeof data!=="object")return json_({ok:false,error:"Dữ liệu không hợp lệ."});
    const lock=LockService.getScriptLock();lock.waitLock(15000);
    try{
      const sh=getSheet_(),currentAt=String(sh.getRange("B2").getValue()||"");
      const incomingAt=String(body.clientUpdatedAt||p.clientUpdatedAt||new Date().toISOString());
      if(currentAt&&incomingAt<currentAt)return json_({ok:false,error:"CLOUD_NEWER",updatedAt:currentAt});
      sh.getRange("A2:B2").setValues([[JSON.stringify(data),incomingAt]]);
      return json_({ok:true,updatedAt:incomingAt});
    }finally{lock.releaseLock()}
  }catch(err){return json_({ok:false,error:String(err)})}
}
