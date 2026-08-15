const KEY="tc_art_class_manager_v2";
const BACKUP_VERSION="3.2";
const DEFAULT={settings:{teacher:"Thầy Hướng",school:"THCS Thủy Châu",schoolYear:"2026–2027"},classes:[],currentClassId:"",students:[],attendance:[],scores:[],seating:[],comments:[],commentBank:["Hoàn thành tốt yêu cầu môn học.","Có ý thức học tập và thực hành tốt.","Thể hiện sự sáng tạo trong bài thực hành.","Có tiến bộ rõ rệt trong học tập.","Hoàn thành sản phẩm đúng yêu cầu.","Cần tích cực hơn trong giờ học.","Cần rèn luyện thêm kỹ năng thực hành.","Cần chú ý hơn đến bố cục và màu sắc."]};
let state=load(),currentPage="dashboard",dragId=null;
function load(){
  try{
    const x={...DEFAULT,...JSON.parse(localStorage.getItem(KEY)||"{}")};
    x.scores=Array.isArray(x.scores)?x.scores:[];
    x.comments=Array.isArray(x.comments)?x.comments:[];
    x.commentBank=Array.isArray(x.commentBank)&&x.commentBank.length?x.commentBank:DEFAULT.commentBank.slice();
    x.classes=(x.classes||[]).map(c=>({...c,scoreLocked:!!c.scoreLocked}));
    return x;
  }catch(e){return structuredClone(DEFAULT)}
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(state));
  state._lastSaved=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(state));
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function initials(n){return (n||"?").split(/\s+/).filter(Boolean).slice(-2).map(x=>x[0]).join("").toUpperCase()}
function toast(t){let x=document.querySelector("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function openModal(t,b){document.querySelector("#modalTitle").textContent=t;document.querySelector("#modalBody").innerHTML=b;document.querySelector("#modal").classList.remove("hidden")}
function closeModal(){document.querySelector("#modal").classList.add("hidden")}
function curClass(){return state.classes.find(c=>c.id===state.currentClassId)}
function scoresLocked(){return !!curClass()?.scoreLocked}
function ensureUnlocked(){if(scoresLocked()){toast("Sổ điểm đã khóa. Hãy mở khóa để chỉnh sửa.");return false}return true}
function classStudents(){return state.students.filter(s=>s.classId===state.currentClassId)}
const ROLE_OPTIONS=["","Lớp trưởng","Lớp phó","Tổ trưởng","Tổ phó","Cán sự môn","Cán sự khác"];
function roleSelect(s){
  return `<select class="select role-select" onchange="updateStudentRole('${s.id}',this.value)" aria-label="Chức vụ">${ROLE_OPTIONS.map(r=>`<option value="${esc(r)}" ${String(s.role||"")===r?"selected":""}>${esc(r||"—")}</option>`).join("")}</select>`;
}
function updateStudentRole(id,role){
  const s=state.students.find(x=>x.id===id); if(!s)return;
  s.role=role||"";
  save(); toast("Đã cập nhật chức vụ");
}
function go(p){currentPage=p;document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));render();document.querySelector(".sidebar").classList.remove("open")}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>go(b.dataset.page));
document.querySelector("#mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
document.querySelector("#backupBtn").onclick=exportBackup;


function scoreTypes(){return ["TX1","TX2","TX3","GK","CK"]}
function normalizeArtScore(v){
  const t=String(v??"").trim().replace(",",".");
  if(!t)return null;
  if(t.toUpperCase()==="CĐ"||t.toUpperCase()==="CD")return "CĐ";
  const n=Number(t);
  if(!Number.isFinite(n)||n<5||n>10)return undefined;
  return Math.round(n*2)/2;
}
function getScores(id){
  const o={};
  state.scores.filter(x=>x.classId===state.currentClassId&&x.studentId===id).forEach(x=>o[x.type]=x.score);
  return o;
}
function hasCD(id){const z=getScores(id);return scoreTypes().some(k=>z[k]==="CĐ")}
function finalResult(id){
  const z=getScores(id);
  if(z.FINAL==="Đạt"||z.FINAL==="Chưa đạt")return z.FINAL;
  return hasCD(id)?"Chưa đạt":"";
}
function resultFor(id){return finalResult(id)||"Chưa có đủ"}
function resultBadge(id){
  const r=finalResult(id);
  if(r==="Đạt")return '<span class="badge ok">Đạt</span>';
  if(r==="Chưa đạt")return '<span class="badge bad">Chưa đạt</span>';
  return '<span class="badge">Chưa có đủ</span>';
}
function getComment(id){
  const x=state.comments.find(c=>c.classId===state.currentClassId&&c.studentId===id&&c.semester===("HK"+(state.semester||1)));
  return x?.text||"";
}
function setComment(id,text){
  const semester="HK"+(state.semester||1);
  state.comments=state.comments.filter(c=>!(c.classId===state.currentClassId&&c.studentId===id&&c.semester===semester));
  if(String(text||"").trim())state.comments.push({id:crypto.randomUUID(),classId:state.currentClassId,studentId:id,semester,text:String(text).trim()});
}
function setFinal(id,value){
  state.scores=state.scores.filter(x=>!(x.classId===state.currentClassId&&x.studentId===id&&x.type==="FINAL"));
  if(value==="Đạt"||value==="Chưa đạt")state.scores.push({id:crypto.randomUUID(),classId:state.currentClassId,studentId:id,type:"FINAL",score:value,date:new Date().toISOString().slice(0,10)});
}
function saveOneScore(id,type,value){
  const v=normalizeArtScore(value);
  if(v===undefined)return false;
  state.scores=state.scores.filter(x=>!(x.classId===state.currentClassId&&x.studentId===id&&x.type===type));
  if(v!==null)state.scores.push({id:crypto.randomUUID(),classId:state.currentClassId,studentId:id,type,score:v,date:new Date().toISOString().slice(0,10)});
  return true;
}
function stats(){
  const ss=classStudents(), total=ss.length;
  const dat=ss.filter(s=>finalResult(s.id)==="Đạt").length;
  const cdat=ss.filter(s=>finalResult(s.id)==="Chưa đạt").length;
  const has9=ss.filter(s=>scoreTypes().some(k=>getScores(s.id)[k]===9)).length;
  const has10=ss.filter(s=>scoreTypes().some(k=>getScores(s.id)[k]===10)).length;
  const talent=ss.filter(s=>scoreTypes().filter(k=>{const v=getScores(s.id)[k];return typeof v==="number"&&v>=9;}).length>=3);
  return {total,dat,cdat,has9,has10,talent};
}
function renderOverview(){
  const d=stats(),pct=n=>d.total?((n/d.total)*100).toFixed(1):"0.0";
  return `<div class="section"><div class="section-head"><div><h2>📊 Tổng quan đánh giá Mĩ thuật</h2><div class="muted">Không tính điểm trung bình. Thống kê theo lớp đang chọn.</div></div></div>
  <div class="cards overview-cards">
    <div class="card"><span class="muted">Sĩ số</span><div class="metric">${d.total}</div></div>
    <div class="card"><span class="muted">Đạt</span><div class="metric">${d.dat}</div><span class="muted">${pct(d.dat)}%</span></div>
    <div class="card"><span class="muted">Chưa đạt</span><div class="metric">${d.cdat}</div><span class="muted">${pct(d.cdat)}%</span></div>
    <div class="card"><span class="muted">Có điểm 9</span><div class="metric">${d.has9}</div><span class="muted">${pct(d.has9)}%</span></div>
    <div class="card"><span class="muted">Có điểm 10</span><div class="metric">${d.has10}</div><span class="muted">${pct(d.has10)}%</span></div>
    <div class="card"><span class="muted">Học sinh có năng khiếu</span><div class="metric">${d.talent.length}</div><span class="muted">Có ít nhất 3 bài đạt 9–10 điểm</span></div>
  </div>
  <div class="talent-list"><b>🎨 Học sinh có năng khiếu:</b> ${d.talent.length?d.talent.map((s,i)=>`<span class="talent-chip">${i+1}. ${esc(s.name)}</span>`).join(""):"<span class='muted'>Chưa có</span>"}</div></div>`;
}
const pages={
dashboard:()=>{let ss=classStudents(),a=attendanceRate();return `<div class="page">
<div class="hero"><div><h1>🎨 Quản lý lớp Mĩ thuật</h1><p>${esc(state.settings.school)} • ${esc(curClass()?.name||"Chưa chọn lớp")} • ${esc(state.settings.schoolYear)}</p></div><button class="btn" onclick="go('classes')">🏫 Chọn lớp</button></div>
${renderOverview()}
<div class="grid2"><div class="section"><div class="section-head"><h2>⚠️ Cần chú ý</h2></div>${attention()}</div><div class="section"><div class="section-head"><h2>⚡ Thao tác nhanh</h2></div><div class="quick"><button onclick="importExcel()">📥 <b>Nhập Excel</b><br><span class="muted">Nạp danh sách học sinh hàng loạt</span></button><button onclick="go('attendance')">🗓️ <b>Điểm danh</b><br><span class="muted">Theo lớp đang chọn</span></button><button onclick="go('seating')">🪑 <b>Sơ đồ chỗ ngồi</b><br><span class="muted">Kéo thả trực quan</span></button></div></div></div></div>`},
classes:()=>`<div class="page"><div class="section"><div class="section-head"><h2>🏫 Quản lý các lớp dạy Mĩ thuật</h2><button class="btn primary" onclick="showAddClass()">＋ Thêm lớp</button></div><div class="notice">Anh có thể tạo tất cả các lớp mình dạy (6/1, 6/2…); <b>sổ điểm, điểm danh và sơ đồ chỗ ngồi tự động tách theo lớp</b>.</div>${state.classes.length?state.classes.map(c=>{let active=c.id===state.currentClassId;return `<div class="section" style="margin:10px 0;padding:14px"><div class="class-card"><div><b>${esc(c.name)}</b><div class="muted">${classStudentsFor(c.id).length} học sinh • ${esc(c.note||"")}</div></div><div><button class="btn ${active?"green":"secondary"}" onclick="selectClass('${c.id}')">${active?"✓ Đang chọn":"Chọn lớp"}</button> <button class="btn secondary" onclick="editClass('${c.id}')">Sửa</button> <button class="btn danger" onclick="deleteClass('${c.id}')">Xóa</button></div></div></div>`}).join(""):`<div class="empty">Chưa có lớp. Hãy tạo lớp hoặc dùng chức năng nhập Excel.</div>`}</div>
<div class="section"><div class="section-head"><h2>📥 Nhập danh sách học sinh từ Excel</h2></div><div class="importbox"><input id="excelFile" class="hidden-file" type="file" accept=".xlsx,.xls,.csv" onchange="handleExcel(this.files[0])"><button class="btn primary" onclick="document.querySelector('#excelFile').click()">Chọn file Excel</button><button class="btn secondary" onclick="downloadTemplate()">Tải mẫu Excel</button></div><p class="muted">Cột khuyến nghị: <b>STT, Họ và tên, Giới tính, Ngày sinh, SĐT phụ huynh, Tổ, Chức vụ</b>. Có thể thêm cột Lớp nếu một file chứa nhiều lớp.</p></div></div>`,
students:()=>{if(!curClass())return noClass();let ss=classStudents();return `<div class="page"><div class="section"><div class="section-head"><h2>👥 ${esc(curClass().name)} — ${ss.length} học sinh</h2><div><button class="btn secondary" onclick="importExcel()">📥 Nhập Excel</button> <button class="btn primary" onclick="showAddStudent()">＋ Thêm thủ công</button></div></div><div class="toolbar"><input id="studentSearch" class="input" placeholder="Tìm họ tên..." oninput="filterStudents()"><select id="genderFilter" class="select" onchange="filterStudents()"><option value="">Tất cả giới tính</option><option>Nam</option><option>Nữ</option></select></div><div class="table-wrap"><table><thead><tr><th>STT</th><th>Học sinh</th><th>Giới tính</th><th>Tổ</th><th>Chức vụ</th><th>TX</th><th>GK</th><th>CK</th><th>Xếp loại</th><th></th></tr></thead><tbody id="studentRows">${studentRows(ss)}</tbody></table></div></div></div>`},
attendance:()=>{if(!curClass())return noClass();let d=new Date().toISOString().slice(0,10),ss=classStudents();return `<div class="page"><div class="section"><div class="section-head"><h2>🗓️ Điểm danh — ${esc(curClass().name)}</h2><div><input id="attDate" type="date" class="input" value="${d}"> <button class="btn primary" onclick="saveAttendance()">Lưu điểm danh</button></div></div><div class="notice">Điểm danh đang <b>tách riêng theo lớp</b>. Chọn ngày, nhập trạng thái rồi lưu.</div><div class="table-wrap"><table><thead><tr><th>STT</th><th>Học sinh</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>${ss.map((s,i)=>{let x=state.attendance.find(a=>a.classId===state.currentClassId&&a.date===d&&a.studentId===s.id);return `<tr><td>${i+1}</td><td>${esc(s.name)}</td><td><select class="select attStatus" data-id="${s.id}"><option ${!x||x.status==="Có mặt"?"selected":""}>Có mặt</option><option ${x?.status==="Nghỉ có phép"?"selected":""}>Nghỉ có phép</option><option ${x?.status==="Nghỉ không phép"?"selected":""}>Nghỉ không phép</option><option ${x?.status==="Đi muộn"?"selected":""}>Đi muộn</option></select></td><td><input class="input attNote" data-id="${s.id}" value="${esc(x?.note||"")}"></td></tr>`}).join("")}</tbody></table></div></div></div>`},
scores:()=>{if(!curClass())return noClass();let ss=classStudents();return `<div class="page"><div class="section"><div class="section-head"><div><h2>🎨 Sổ điểm Mĩ thuật — ${esc(curClass().name)}</h2><div class="muted">TX1, TX2, TX3 • Giữa kỳ • Cuối kỳ</div></div><div><button class="btn secondary" onclick="manageComments()">📝 Mẫu nhận xét</button> <button class="btn ${scoresLocked()?"green":"primary"}" onclick="toggleScoreLock()">${scoresLocked()?"🔒 Đã khóa điểm":"🔓 Khóa điểm"}</button> <button class="btn primary" ${scoresLocked()?"disabled":""} onclick="showScore()">＋ Nhập điểm</button></div></div>
<div class="notice"><b>Quy ước:</b> nhập <b>CĐ</b> hoặc điểm <b>5 / 5,5 / 6 / 6,5 … 10</b>. Điểm dưới 5 đánh giá là CĐ. Nhấn Enter hoặc rời ô để lưu.</div>${scoresLocked()?`<div class="notice" style="border-left-color:#7e22ce"><b>🔒 Sổ điểm đang khóa.</b> Điểm và xếp loại không thể chỉnh sửa cho đến khi mở khóa.</div>`:""}
<div class="table-wrap"><table><thead><tr><th>Học sinh</th><th>TX1</th><th>TX2</th><th>TX3</th><th>Giữa kỳ</th><th>Cuối kỳ</th><th>Xếp loại cuối kỳ</th><th>Nhận xét</th><th></th></tr></thead><tbody>
${ss.length?ss.map(s=>{let z=getScores(s.id),c=getComment(s.id);return `<tr><td><b>${esc(s.name)}</b></td>
${scoreCell(s.id,"TX1",z.TX1)}${scoreCell(s.id,"TX2",z.TX2)}${scoreCell(s.id,"TX3",z.TX3)}${scoreCell(s.id,"GK",z.GK)}${scoreCell(s.id,"CK",z.CK)}
<td><select class="mini-select" ${scoresLocked()?"disabled":""} onchange="quickFinal('${s.id}',this.value)"><option value="">—</option><option value="Đạt" ${finalResult(s.id)==="Đạt"?"selected":""}>Đạt</option><option value="Chưa đạt" ${finalResult(s.id)==="Chưa đạt"?"selected":""}>Chưa đạt</option></select></td>
<td class="comment-cell" title="${esc(c)}">${esc(c||"—")}</td><td><button class="btn secondary" onclick="showScore('${s.id}')">Chi tiết</button></td></tr>`}).join(""):`<tr><td colspan="9" class="empty">Chưa có học sinh.</td></tr>`}
</tbody></table></div></div></div>`},
seating:()=>{if(!curClass())return noClass();let ss=classStudents(),cols=curClass().cols||5,rows=curClass().rows||8;return `<div class="page"><div class="section"><div class="section-head"><div><h2>🪑 Sơ đồ chỗ ngồi — ${esc(curClass().name)}</h2><div class="muted">Kéo thả học sinh giữa các bàn; bấm lưu để ghi nhớ sơ đồ.</div></div><button class="btn primary" onclick="saveSeating()">💾 Lưu sơ đồ</button></div><div class="seating-tools"><label class="muted">Cột <input id="seatCols" class="input" style="width:70px" type="number" min="2" max="8" value="${cols}"></label><label class="muted">Hàng <input id="seatRows" class="input" style="width:70px" type="number" min="2" max="10" value="${rows}"></label><button class="btn secondary" onclick="resetSeating()">↺ Xếp lại tự động</button></div><div class="teacher-desk">BÀN GIÁO VIÊN</div><div id="seatLayout" class="seat-layout" style="--cols:${cols}">${buildSeats(rows,cols,ss)}</div><div class="legend">💡 Trên máy tính: kéo học sinh sang vị trí khác. Ô trống có thể nhận học sinh. Trên điện thoại có thể dùng kéo-thả cảm ứng tùy trình duyệt.</div></div></div>`},
reports:()=>{if(!curClass())return noClass();let ss=classStudents(),z=ss.map(s=>resultFor(s.id));return `<div class="page"><div class="section"><div class="section-head"><h2>📑 Báo cáo — ${esc(curClass().name)}</h2><div><button class="btn primary" onclick="exportClassExcel()">⇩ Xuất sổ điểm Excel</button> <button class="btn secondary" onclick="printClassList()">🖨️ In danh sách lớp</button> <button class="btn secondary" onclick="printGradebook()">🖨️ In sổ điểm</button></div></div><div class="cards"><div class="card"><span class="muted">Sĩ số</span><div class="metric">${ss.length}</div></div><div class="card"><span class="muted">Đạt</span><div class="metric">${z.filter(x=>x==="Đạt").length}</div></div><div class="card"><span class="muted">Chưa đạt</span><div class="metric">${z.filter(x=>x==="Chưa đạt").length}</div></div><div class="card"><span class="muted">Chuyên cần</span><div class="metric">${attendanceRate()}%</div></div></div><div class="notice">Báo cáo được tính riêng cho lớp đang chọn. Excel có đủ TX1–TX3, giữa kỳ, cuối kỳ, xếp loại và nhận xét.</div></div></div>`},
settings:()=>renderSettingsPage(),
};

function renderSettingsPage(){
  const last=state._lastSaved?new Date(state._lastSaved).toLocaleString("vi-VN"):"Chưa có mốc lưu";
  const lockRows=state.classes.length?state.classes.map(c=>{
    const label=c.scoreLocked?"🔒 Mở khóa":"🔓 Khóa điểm";
    const cls=c.scoreLocked?"green":"secondary";
    const status=c.scoreLocked?"Đang khóa":"Đang mở";
    return `<div class="class-card" style="padding:10px 0;border-bottom:1px solid #edf1f4"><div><b>${esc(c.name)}</b><div class="muted">${status}</div></div><button class="btn ${cls}" onclick="toggleScoreLockFor('${c.id}')">${label}</button></div>`;
  }).join(""):"<div class=\"empty\">Chưa có lớp.</div>";
  return `<div class="page">
  <div class="section"><div class="section-head"><h2>⚙️ Cài đặt</h2><button class="btn primary" onclick="saveSettings()">Lưu</button></div><div class="formgrid"><div class="field"><label>Giáo viên</label><input id="setTeacher" class="input" value="${esc(state.settings.teacher)}"></div><div class="field"><label>Trường</label><input id="setSchool" class="input" value="${esc(state.settings.school)}"></div><div class="field"><label>Năm học</label><input id="setYear" class="input" value="${esc(state.settings.schoolYear)}"></div></div></div>
  <div class="section"><h2>💾 Sao lưu & khôi phục</h2><p class="muted">Dữ liệu tự lưu trong trình duyệt sau mỗi thao tác. Nên xuất bản sao trước khi đổi máy hoặc xóa dữ liệu trình duyệt.</p><div class="toolbar"><button class="btn primary" onclick="exportBackup()">⬇️ Xuất bản sao JSON</button><button class="btn secondary" onclick="document.querySelector('#restoreFile').click()">⬆️ Khôi phục từ JSON</button><input id="restoreFile" type="file" class="hidden-file" accept="application/json,.json" onchange="restoreBackup(this.files[0])"><button class="btn secondary" onclick="exportAllClassesExcel()">📊 Xuất toàn bộ lớp Excel</button></div><div class="notice">Tự động lưu: <b>Đang bật</b>. Lần lưu gần nhất: ${last}</div></div>
  <div class="section"><h2>🔒 Khóa sổ điểm</h2><p class="muted">Khóa điểm theo từng lớp sau khi hoàn tất học kỳ. Điểm và xếp loại không thể sửa khi đã khóa.</p>${lockRows}</div>
  <div class="section"><h2>⚠️ Vùng nguy hiểm</h2><button class="btn danger" onclick="wipeAll()">Xóa toàn bộ dữ liệu</button></div></div>`;
}

function noClass(){return `<div class="page"><div class="section"><div class="empty"><h2>Chưa chọn lớp</h2><p>Hãy vào <b>Lớp học</b> để tạo hoặc chọn một lớp.</p><button class="btn primary" onclick="go('classes')">Mở quản lý lớp</button></div></div></div>`}

function scoreLevelClass(value){
  if(value==="CĐ") return "score-cd";
  const n=Number(value);
  if(!Number.isFinite(n)) return "";
  if(n>=8.5) return "score-excellent";
  if(n>=6.5) return "score-good";
  if(n>=5) return "score-average";
  return "score-cd";
}
function scoreCell(id,type,v){
  const value=v===undefined||v===null?"":String(v);
  const cls=scoreLevelClass(value);
  return `<td class="score-cell ${cls}"><div class="score-edit"><input class="score-input" type="text" inputmode="decimal" value="${esc(value)}" placeholder="CĐ/5–10"
    onkeydown="if(event.key==='Enter'){event.preventDefault();quickScore('${id}','${type}',this.value)}"
    onblur="quickScore('${id}','${type}',this.value)" ${scoresLocked()?"disabled":""}><button type="button" class="cd-btn ${value==="CĐ"?"active":""}" onclick="quickScore('${id}','${type}','CĐ')" ${scoresLocked()?"disabled":""}>CĐ</button></div></td>`;
}
function quickScore(id,type,value){
  if(!ensureUnlocked())return;
  if(!saveOneScore(id,type,value)){toast("Chỉ nhập CĐ hoặc điểm từ 5 đến 10, bước 0,5.");render();return}
  save();render();toast("Đã cập nhật điểm");
}
function quickFinal(id,value){if(!ensureUnlocked())return;setFinal(id,value);save();render();toast("Đã cập nhật xếp loại")}
function applyPreset(){const p=document.querySelector("#scPreset"),t=document.querySelector("#scComment");if(p&&t&&p.value)t.value=p.value}
function manageComments(){
  const list=state.commentBank.map((x,i)=>`${i+1}. ${x}`).join("\n");
  const v=prompt("Nhập thêm một mẫu nhận xét (ngắn gọn, dưới 15 từ):\n\n"+list);
  if(v&&v.trim()){if(v.trim().split(/\s+/).length>15){alert("Nên giữ dưới 15 từ.");return}state.commentBank.push(v.trim());save();render()}
}
function render(){let titles={dashboard:"Tổng quan",classes:"Lớp học",students:"Học sinh",attendance:"Điểm danh",scores:"Sổ điểm Mĩ thuật",seating:"Sơ đồ chỗ ngồi",reports:"Báo cáo",settings:"Cài đặt"};document.querySelector("#pageTitle").textContent=titles[currentPage];document.querySelector("#content").innerHTML=pages[currentPage]();document.querySelector("#classPill").textContent=curClass()?.name||"Chưa chọn lớp";if(currentPage==="students")filterStudents()}
function classStudentsFor(id){return state.students.filter(s=>s.classId===id)}
function selectClass(id){state.currentClassId=id;save();go("dashboard");toast("Đã chọn "+(curClass()?.name||"lớp"))}
function showAddClass(){openModal("Tạo lớp",`<div class="formgrid"><div class="field"><label>Tên lớp *</label><input id="cName" class="input" placeholder="6/1"></div><div class="field"><label>Số cột bàn</label><input id="cCols" class="input" type="number" min="2" max="8" value="5"></div><div class="field"><label>Số hàng bàn</label><input id="cRows" class="input" type="number" min="2" max="10" value="8"></div><div class="field"><label>Ghi chú</label><input id="cNote" class="input"></div></div><div style="margin-top:15px;text-align:right"><button class="btn primary" onclick="addClass()">Tạo lớp</button></div>`)}
function addClass(){let name=document.querySelector("#cName").value.trim();if(!name)return toast("Nhập tên lớp");let c={id:crypto.randomUUID(),name,cols:Number(document.querySelector("#cCols").value||5),rows:Number(document.querySelector("#cRows").value||8),note:document.querySelector("#cNote").value};state.classes.push(c);state.currentClassId=c.id;save();closeModal();render();toast("Đã tạo lớp")}
function editClass(id){let c=state.classes.find(x=>x.id===id);openModal("Sửa lớp",`<div class="formgrid"><div class="field"><label>Tên lớp</label><input id="ecName" class="input" value="${esc(c.name)}"></div><div class="field"><label>Ghi chú</label><input id="ecNote" class="input" value="${esc(c.note||"")}"></div></div><div style="margin-top:15px;text-align:right"><button class="btn primary" onclick="saveClassEdit('${id}')">Lưu</button></div>`)}
function saveClassEdit(id){let c=state.classes.find(x=>x.id===id);c.name=document.querySelector("#ecName").value.trim();c.note=document.querySelector("#ecNote").value;save();closeModal();render()}
function deleteClass(id){if(!confirm("Xóa lớp này? Học sinh và dữ liệu của lớp sẽ được xóa khỏi ứng dụng."))return;state.students=state.students.filter(s=>s.classId!==id);state.attendance=state.attendance.filter(x=>x.classId!==id);state.scores=state.scores.filter(x=>x.classId!==id);state.seating=state.seating.filter(x=>x.classId!==id);state.classes=state.classes.filter(c=>c.id!==id);if(state.currentClassId===id)state.currentClassId=state.classes[0]?.id||"";save();render()}
function showAddStudent(){if(!curClass())return go("classes");openModal("Thêm học sinh",`<div class="formgrid"><div class="field full"><label>Họ và tên *</label><input id="fName" class="input"></div><div class="field"><label>Giới tính</label><select id="fGender" class="select"><option>Nam</option><option>Nữ</option></select></div><div class="field"><label>Tổ</label><input id="fGroup" class="input"></div><div class="field"><label>Chức vụ</label><select id="fRole" class="select">${ROLE_OPTIONS.map(r=>`<option value="${esc(r)}">${esc(r||"—")}</option>`).join("")}</select></div><div class="field"><label>Ngày sinh</label><input id="fDob" class="input" type="date"></div><div class="field"><label>SĐT phụ huynh</label><input id="fPhone" class="input"></div></div><div style="margin-top:15px;text-align:right"><button class="btn primary" onclick="addStudent()">Lưu</button></div>`)}
function addStudent(){let name=document.querySelector("#fName").value.trim();if(!name)return toast("Nhập họ tên");state.students.push({id:crypto.randomUUID(),classId:state.currentClassId,name,gender:document.querySelector("#fGender").value,group:document.querySelector("#fGroup").value,role:document.querySelector("#fRole").value,dob:document.querySelector("#fDob").value,phone:document.querySelector("#fPhone").value});save();closeModal();render();toast("Đã thêm")}
function studentRows(ss){return ss.map((s,i)=>{let z=getScores(s.id);return `<tr><td>${i+1}</td><td><b>${esc(s.name)}</b></td><td>${esc(s.gender)}</td><td>${esc(s.group)}</td><td>${roleSelect(s)}</td><td>${z.TX1??"—"} / ${z.TX2??"—"} / ${z.TX3??"—"}</td><td>${z.GK??"—"}</td><td>${z.CK??"—"}</td><td>${resultBadge(s.id)}</td><td><button class="btn secondary" onclick="showScore('${s.id}')">Đánh giá</button></td></tr>`}).join("")}
function filterStudents(){let q=(document.querySelector("#studentSearch")?.value||"").toLowerCase(),g=document.querySelector("#genderFilter")?.value||"";let a=classStudents().filter(s=>(s.name||"").toLowerCase().includes(q)&&(!g||s.gender===g));let r=document.querySelector("#studentRows");if(r)r.innerHTML=studentRows(a)}
function deleteStudent(id){if(!confirm("Xóa học sinh này?"))return;state.students=state.students.filter(s=>s.id!==id);state.attendance=state.attendance.filter(x=>x.studentId!==id);state.scores=state.scores.filter(x=>x.studentId!==id);state.seating=state.seating.filter(x=>x.studentId!==id);save();render()}



function showScore(studentId){
  if(!curClass())return;
  let s=state.students.find(x=>x.id===studentId)||classStudents()[0]; if(!s)return toast("Chưa có học sinh");
  let z=getScores(s.id);
  openModal("Đánh giá Mĩ thuật",`<div class="notice"><b>${esc(s.name)}</b> — ${esc(curClass().name)}<br><b>Quy ước:</b> CĐ hoặc 5–10, bước 0,5.</div>
  <div class="formgrid"><div class="field full"><label>Học sinh</label><select id="scStudent" class="select">${classStudents().map(x=>`<option value="${x.id}" ${x.id===s.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>
  ${[["TX1","Thường xuyên 1"],["TX2","Thường xuyên 2"],["TX3","Thường xuyên 3"],["GK","Giữa kỳ"],["CK","Cuối kỳ"]].map(([t,l])=>`<div class="field"><label>${l}</label><input id="sc${t}" class="input" type="text" inputmode="decimal" placeholder="CĐ hoặc 5–10" value="${esc(z[t]??"")}"></div>`).join("")}
  <div class="field"><label>Xếp loại cuối kỳ</label><select id="scFINAL" class="select"><option value="">—</option><option value="Đạt" ${finalResult(s.id)==="Đạt"?"selected":""}>Đạt</option><option value="Chưa đạt" ${finalResult(s.id)==="Chưa đạt"?"selected":""}>Chưa đạt</option></select></div>
  <div class="field full"><label>Nhận xét cuối kỳ</label><div class="row"><select id="scPreset" class="select"><option value="">Chọn mẫu...</option>${state.commentBank.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select><button class="btn secondary" type="button" onclick="applyPreset()">Dùng mẫu</button></div><textarea id="scComment" class="input" rows="3" placeholder="Nhận xét...">${esc(getComment(s.id))}</textarea></div>
  </div><div style="margin-top:15px;text-align:right"><button class="btn primary" onclick="saveScoreSet()">💾 Lưu đánh giá</button></div>`)
}
function saveScoreSet(){
  if(!ensureUnlocked())return;
  const id=document.querySelector("#scStudent").value;
  for(const type of scoreTypes()){
    if(!saveOneScore(id,type,document.querySelector("#sc"+type).value)){toast("Điểm không hợp lệ: "+type+" chỉ nhận CĐ hoặc 5–10, bước 0,5.");return}
  }
  setFinal(id,document.querySelector("#scFINAL").value);
  setComment(id,document.querySelector("#scComment").value);
  save();closeModal();render();toast("Đã lưu đánh giá, xếp loại và nhận xét");
}
function saveAttendance(){let d=document.querySelector("#attDate").value;document.querySelectorAll(".attStatus").forEach(sel=>{let id=sel.dataset.id,n=document.querySelector(`.attNote[data-id="${id}"]`).value;state.attendance=state.attendance.filter(x=>!(x.classId===state.currentClassId&&x.date===d&&x.studentId===id));state.attendance.push({classId:state.currentClassId,date:d,studentId:id,status:sel.value,note:n})});save();toast("Đã lưu điểm danh")}
function attendanceRate(){let a=state.attendance.filter(x=>x.classId===state.currentClassId);if(!a.length)return 0;return Math.round(a.filter(x=>x.status==="Có mặt").length/a.length*100)}
function overallAvg(){let a=state.scores.filter(x=>x.classId===state.currentClassId).map(x=>x.score);return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function distribution(){let ss=classStudents(),d={"Đạt":0,"Chưa đạt":0,"Chưa có đủ":0};ss.forEach(s=>d[resultFor(s.id)]++);let max=Math.max(...Object.values(d),1);return `<div class="chart">${Object.entries(d).map(([k,n])=>`<div class="chart-row"><span>${k}</span><div class="bar"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join("")}</div>`}
function attention(){let a=classStudents().filter(s=>finalResult(s.id)==="Chưa đạt");return a.length?a.slice(0,6).map(s=>`<div class="notice"><b>${esc(s.name)}</b><br><span class="muted">Kết quả hiện tại: Chưa đạt</span></div>`).join(""):`<div class="empty">Chưa có học sinh được đánh dấu Chưa đạt.</div>`}

function importExcel(){document.querySelector("#excelFile")?.click()||openImportModal()}
function openImportModal(){openModal("Nhập danh sách từ Excel",`<input id="modalExcel" type="file" class="input" accept=".xlsx,.xls,.csv" onchange="handleExcel(this.files[0])"><p class="muted">File có thể có một hoặc nhiều lớp.</p>`)}
function handleExcel(file){if(!file)return;if(!window.XLSX)return toast("Không tải được thư viện Excel. Hãy kết nối Internet.");let reader=new FileReader();reader.onload=e=>{try{let wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});let rows=[];wb.SheetNames.forEach(sn=>{let a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:""});a.forEach(r=>rows.push({...r,__sheet:sn}))});if(!rows.length)return toast("File không có dữ liệu");processImportedRows(rows);if(document.querySelector("#excelFile"))document.querySelector("#excelFile").value="";}catch(err){console.error(err);toast("Không đọc được file Excel")}};reader.readAsArrayBuffer(file)}
function val(r,keys){let k=Object.keys(r).find(x=>keys.some(y=>x.toLowerCase().trim()===y.toLowerCase())||keys.some(y=>x.toLowerCase().includes(y.toLowerCase())));return k?r[k]:""}
function processImportedRows(rows){let groups={};rows.forEach(r=>{let cname=String(val(r,["Lớp","Lop","Class"])||curClass()?.name||r.__sheet||"Lớp mới").trim();if(!groups[cname])groups[cname]=[];groups[cname].push(r)});let created=0,added=0;Object.entries(groups).forEach(([cname,rs])=>{let c=state.classes.find(x=>x.name.toLowerCase()===cname.toLowerCase());if(!c){c={id:crypto.randomUUID(),name:cname,cols:5,rows:8};state.classes.push(c);created++}rs.forEach(r=>{let name=String(val(r,["Họ và tên","Ho va ten","Họ tên","Name"])).trim();if(!name)return;let existing=state.students.find(s=>s.classId===c.id&&s.name.toLowerCase()===name.toLowerCase());let data={classId:c.id,name,gender:String(val(r,["Giới tính","Gioi tinh","Gender"])),dob:String(val(r,["Ngày sinh","Ngay sinh","DOB"])),phone:String(val(r,["SĐT phụ huynh","SDT","Điện thoại","Phone"])),group:String(val(r,["Tổ","To","Group"])),role:String(val(r,["Chức vụ","Chuc vu","Chức vụ lớp","Role","Position"]))};if(existing)Object.assign(existing,data);else{state.students.push({id:crypto.randomUUID(),...data});added++}})});if(!state.currentClassId)state.currentClassId=state.classes[0]?.id||"";else if(groups[curClass()?.name]===undefined&&Object.keys(groups).length===1)state.currentClassId=state.classes.find(c=>c.name===Object.keys(groups)[0])?.id||state.currentClassId;save();closeModal();render();toast(`Đã nhập ${added} học sinh; tạo ${created} lớp`)}
function downloadTemplate(){let rows=[["STT","Họ và tên","Giới tính","Ngày sinh","SĐT phụ huynh","Tổ","Chức vụ","Lớp"],[1,"Nguyễn Văn A","Nam","","","1","Lớp trưởng","6/1"],[2,"Trần Thị B","Nữ","","","1","Tổ trưởng","6/1"]];let ws=XLSX.utils.aoa_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"DanhSach");XLSX.writeFile(wb,"Mau_DanhSach_HocSinh_Thuy_Chau.xlsx")}
function exportClassExcel(){let ss=classStudents(),rows=[["STT","Họ và tên","Giới tính","Tổ","Chức vụ","TX1","TX2","TX3","Giữa kỳ","Cuối kỳ","Xếp loại cuối kỳ","Nhận xét cuối kỳ"]];ss.forEach((s,i)=>{let z=getScores(s.id);rows.push([i+1,s.name,s.gender,s.group,s.role||"",z.TX1??"",z.TX2??"",z.TX3??"",z.GK??"",z.CK??"",finalResult(s.id),getComment(s.id)])});let ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:6},{wch:28},{wch:10},{wch:8},{wch:16},{wch:8},{wch:8},{wch:8},{wch:10},{wch:10},{wch:18},{wch:42}];ws["!autofilter"]={ref:ws["!ref"]};let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,curClass().name);XLSX.writeFile(wb,`SoDiem_MiThuat_${curClass().name.replace("/","-")}.xlsx`)}
function buildSeats(rows,cols,ss){let map=state.seating.find(x=>x.classId===state.currentClassId)?.map||[];let used=new Set(map.filter(Boolean));let ordered=[...map.filter(Boolean),...ss.map(s=>s.id).filter(id=>!used.has(id))];let total=rows*cols;return Array.from({length:total},(_,i)=>{let id=ordered[i]||"",s=ss.find(x=>x.id===id);return `<div class="seat ${s?"":"empty-seat"}" draggable="${!!s}" data-pos="${i}" data-id="${id}" ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropSeat(event)">${s?`<span class="seat-num">Bàn ${i+1}</span><span class="avatar">${initials(s.name)}</span><div class="seat-name">${esc(s.name)}</div><div class="desk"></div>`:`Ô trống`}</div>`}).join("")}
function dragStart(e){dragId=e.currentTarget.dataset.id;e.currentTarget.classList.add("dragging")}
function dragOver(e){e.preventDefault()}
function dropSeat(e){e.preventDefault();let target=e.currentTarget;let a=Array.from(document.querySelectorAll(".seat")).map(x=>x.dataset.id||"");let from=a.indexOf(dragId),to=Number(target.dataset.pos);if(from<0)return;let temp=a[from];a[from]=a[to]||"";a[to]=temp;target.parentElement.querySelectorAll(".seat").forEach((x,i)=>{x.dataset.id=a[i];let s=classStudents().find(q=>q.id===a[i]);x.innerHTML=s?`<span class="seat-num">Bàn ${i+1}</span><span class="avatar">${initials(s.name)}</span><div class="seat-name">${esc(s.name)}</div><div class="desk"></div>`:`Ô trống`;x.classList.toggle("empty-seat",!s);x.draggable=!!s});dragId=null}
function saveSeating(){let cols=Number(document.querySelector("#seatCols").value),rows=Number(document.querySelector("#seatRows").value),map=Array.from(document.querySelectorAll(".seat")).map(x=>x.dataset.id||"");let x=state.seating.find(s=>s.classId===state.currentClassId);if(!x)state.seating.push({classId:state.currentClassId,map});else{x.map=map}let c=curClass();c.cols=cols;c.rows=rows;save();render();toast("Đã lưu sơ đồ")}
function resetSeating(){let c=curClass(),ss=classStudents();let map=ss.map(s=>s.id);let x=state.seating.find(s=>s.classId===state.currentClassId);if(!x)state.seating.push({classId:state.currentClassId,map});else x.map=map;save();render()}
function saveSettings(){state.settings.teacher=document.querySelector("#setTeacher").value;state.settings.school=document.querySelector("#setSchool").value;state.settings.schoolYear=document.querySelector("#setYear").value;save();render();toast("Đã lưu")}
function exportBackup(){let payload={app:"Thuy Chau Art Class Manager",version:BACKUP_VERSION,exportedAt:new Date().toISOString(),data:state};let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));a.download=`Thuy_Chau_Art_Class_Manager_Backup_v${BACKUP_VERSION}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Đã tạo bản sao dữ liệu")}
function restoreBackup(file){if(!file)return;let r=new FileReader();r.onload=e=>{try{let raw=JSON.parse(e.target.result);let data=raw?.data||raw;if(!data.classes||!data.students)throw new Error("invalid");if(!confirm("Khôi phục sẽ thay thế dữ liệu hiện tại. Tiếp tục?"))return;state={...structuredClone(DEFAULT),...data};state.classes=(state.classes||[]).map(c=>({...c,scoreLocked:!!c.scoreLocked}));save();render();toast("Đã khôi phục dữ liệu")}catch(err){alert("File sao lưu không hợp lệ hoặc không đúng định dạng.")}};r.readAsText(file)}
function exportAllClassesExcel(){if(!state.classes.length)return toast("Chưa có lớp");let wb=XLSX.utils.book_new();state.classes.forEach(c=>{let ss=classStudentsFor(c.id),rows=[["STT","Họ và tên","Giới tính","Tổ","TX1","TX2","TX3","Giữa kỳ","Cuối kỳ","Xếp loại cuối kỳ","Nhận xét cuối kỳ"]];ss.forEach((s,i)=>{let old=state.currentClassId;state.currentClassId=c.id;let z=getScores(s.id);rows.push([i+1,s.name,s.gender,s.group,z.TX1??"",z.TX2??"",z.TX3??"",z.GK??"",z.CK??"",finalResult(s.id),getComment(s.id)]);state.currentClassId=old});let ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:6},{wch:28},{wch:10},{wch:8},{wch:8},{wch:8},{wch:8},{wch:10},{wch:10},{wch:18},{wch:42}];ws["!autofilter"]={ref:ws["!ref"]};XLSX.utils.book_append_sheet(wb,ws,c.name.slice(0,31))});XLSX.writeFile(wb,"SoDiem_MiThuat_ToanBoLop.xlsx");toast("Đã xuất toàn bộ lớp")}
function toggleScoreLock(){toggleScoreLockFor(state.currentClassId)}
function toggleScoreLockFor(classId){let c=state.classes.find(x=>x.id===classId);if(!c)return;if(c.scoreLocked){if(!confirm(`Mở khóa sổ điểm lớp ${c.name}?`))return;c.scoreLocked=false}else{if(!confirm(`Khóa sổ điểm lớp ${c.name}? Sau khi khóa, điểm và xếp loại sẽ không thể sửa.`))return;c.scoreLocked=true}save();render();toast(c.scoreLocked?"Đã khóa sổ điểm":"Đã mở khóa sổ điểm")}
function printClassList(){if(!curClass())return;let ss=classStudents();let w=window.open("","_blank");if(!w)return;w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Danh sách ${esc(curClass().name)}</title><style>body{font-family:Arial;padding:25px}h2{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #333;padding:7px}th{background:#eee}</style></head><body><h2>DANH SÁCH HỌC SINH — ${esc(curClass().name)}</h2><p>Trường: ${esc(state.settings.school)} — GV: ${esc(state.settings.teacher)}</p><table><tr><th>STT</th><th>Họ và tên</th><th>Giới tính</th><th>Ngày sinh</th><th>Tổ</th><th>Ghi chú</th></tr>${ss.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(s.gender)}</td><td>${esc(s.dob)}</td><td>${esc(s.group)}</td><td></td></tr>`).join("")}</table><script>window.onload=()=>window.print()</script></body></html>`);w.document.close()}
function printGradebook(){if(!curClass())return;let ss=classStudents();let w=window.open("","_blank");if(!w)return;w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sổ điểm ${esc(curClass().name)}</title><style>body{font-family:Arial;padding:20px}h2{text-align:center;font-size:18px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #333;padding:5px;text-align:center}td:nth-child(2),td:last-child{text-align:left}th{background:#eee}</style></head><body><h2>SỔ ĐÁNH GIÁ MÔN MĨ THUẬT — ${esc(curClass().name)}</h2><p>Trường: ${esc(state.settings.school)} — GV: ${esc(state.settings.teacher)} — Năm học: ${esc(state.settings.schoolYear)}</p><table><tr><th>STT</th><th>Họ và tên</th><th>TX1</th><th>TX2</th><th>TX3</th><th>GK</th><th>CK</th><th>Xếp loại</th><th>Nhận xét</th></tr>${ss.map((s,i)=>{let z=getScores(s.id);return `<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(z.TX1??"")}</td><td>${esc(z.TX2??"")}</td><td>${esc(z.TX3??"")}</td><td>${esc(z.GK??"")}</td><td>${esc(z.CK??"")}</td><td>${esc(finalResult(s.id))}</td><td>${esc(getComment(s.id))}</td></tr>`}).join("")}</table><script>window.onload=()=>window.print()</script></body></html>`);w.document.close()}
function wipeAll(){if(!confirm("Xóa toàn bộ dữ liệu? Không thể hoàn tác."))return;localStorage.removeItem(KEY);state=structuredClone(DEFAULT);render();toast("Đã xóa dữ liệu")}
render();
window.closeModal=closeModal;window.go=go;window.selectClass=selectClass;window.showAddClass=showAddClass;window.addClass=addClass;window.editClass=editClass;window.saveClassEdit=saveClassEdit;window.deleteClass=deleteClass;window.showAddStudent=showAddStudent;window.addStudent=addStudent;window.updateStudentRole=updateStudentRole;window.deleteStudent=deleteStudent;window.filterStudents=filterStudents;window.showScore=showScore;window.saveScoreSet=saveScoreSet;window.saveAttendance=saveAttendance;window.importExcel=importExcel;window.handleExcel=handleExcel;window.downloadTemplate=downloadTemplate;window.exportClassExcel=exportClassExcel;window.dragStart=dragStart;window.dragOver=dragOver;window.dropSeat=dropSeat;window.saveSeating=saveSeating;window.resetSeating=resetSeating;window.saveSettings=saveSettings;window.exportBackup=exportBackup;window.restoreBackup=restoreBackup;window.exportAllClassesExcel=exportAllClassesExcel;window.toggleScoreLock=toggleScoreLock;window.toggleScoreLockFor=toggleScoreLockFor;window.printClassList=printClassList;window.printGradebook=printGradebook;window.wipeAll=wipeAll;window.quickScore=quickScore;window.quickFinal=quickFinal;window.manageComments=manageComments;window.applyPreset=applyPreset;