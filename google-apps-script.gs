/**
 * THỦY CHÂU ART CLASS MANAGER — CLOUD SYNC v3.3
 *
 * 1) Tạo một Google Sheet riêng cho dữ liệu app.
 * 2) Extensions > Apps Script, dán toàn bộ mã này.
 * 3) Project Settings > Script properties: tạo SYNC_KEY = một mã bí mật tự đặt.
 * 4) Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone.
 * 5) Sao chép URL /exec vào Cài đặt > Đồng bộ của app.
 *
 * Dữ liệu được lưu trong sheet _APP_DATA dưới dạng JSON ở ô A2; thời gian ở B2.
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
function doGet(e){
  try{
    const p=e?.parameter||{};
    if(p.action!=="pull") return json_({ok:true,service:"ThuyChauArtClassManager",version:"3.3"});
    if(!keyOk_(p.key)) return json_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."});
    const sh=getSheet_(), raw=String(sh.getRange("A2").getValue()||""), at=String(sh.getRange("B2").getValue()||"");
    return json_({ok:true,data:raw?JSON.parse(raw):null,updatedAt:at||""});
  }catch(err){return json_({ok:false,error:String(err)})}
}
function doPost(e){
  try{
    const body=JSON.parse(e?.postData?.contents||"{}");
    if(body.action!=="push")return json_({ok:false,error:"Action không hợp lệ."});
    if(!keyOk_(body.key))return json_({ok:false,error:"Mã đồng bộ không đúng hoặc chưa cấu hình SYNC_KEY."});
    if(!body.data||typeof body.data!=="object")return json_({ok:false,error:"Thiếu dữ liệu."});
    const lock=LockService.getScriptLock();lock.waitLock(10000);
    try{
      const sh=getSheet_();
      const currentAt=String(sh.getRange("B2").getValue()||"");
      const incomingAt=String(body.clientUpdatedAt||new Date().toISOString());
      if(currentAt && incomingAt<currentAt)return json_({ok:false,error:"CLOUD_NEWER",updatedAt:currentAt});
      sh.getRange("A2:B2").setValues([[JSON.stringify(body.data),incomingAt]]);
      return json_({ok:true,updatedAt:incomingAt});
    }finally{lock.releaseLock()}
  }catch(err){return json_({ok:false,error:String(err)})}
}
