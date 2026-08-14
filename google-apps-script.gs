/**
 * GOOGLE APPS SCRIPT - KHUNG ĐỒNG BỘ CHO THỦY CHÂU ART CLASS MANAGER
 * Phiên bản webapp v2 lưu cục bộ; file này là nền tảng để triển khai Google Sheets.
 *
 * Tạo Google Sheet > Extensions > Apps Script > dán mã > Deploy Web App.
 */
function doGet(){
  return ContentService.createTextOutput(JSON.stringify({ok:true,service:"ThuyChauArtClassManager"}))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e){
  try{
    const body=JSON.parse(e.postData.contents||"{}");
    const ss=SpreadsheetApp.getActive();
    if(body.action==="appendRows"){
      const sh=ss.getSheetByName(body.sheet)||ss.insertSheet(body.sheet);
      (body.rows||[]).forEach(r=>sh.appendRow(r));
    }
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
