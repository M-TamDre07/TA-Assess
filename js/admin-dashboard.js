/* TA ASSESS — role-protected admin dashboard */
(function(){
'use strict';
const API=(typeof CONFIG!=='undefined'&&CONFIG.ACCOUNT_API)||'';
const HEALTH=(typeof CONFIG!=='undefined'&&CONFIG.SYSTEM_HEALTH_API)||'/api/system/health';
const ADMIN_GATE='/api/admin/gate';
const TOKEN_KEY='ta_assess_session';
const $=id=>document.getElementById(id);
let currentTable={headers:[],rows:[],sheet:''};
let adminGateToken='';

function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}
async function gate(){
  const password=window.prompt('Masukkan password administrator:');
  if(password===null)throw new Error('Akses admin dibatalkan.');
  const r=await fetch(ADMIN_GATE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d||d.success!==true)throw new Error(d&&d.error?d.error:'Proteksi admin gagal.');
  adminGateToken=d.token;
}
async function req(p){
  if(!API||!token())throw new Error('Account API belum dikonfigurasi atau sesi admin belum tersedia.');
  if(!adminGateToken)throw new Error('Sesi password admin belum dibuka.');
  const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8','X-TA-Admin-Gate':adminGateToken},body:JSON.stringify({...p,token:token()})});
  const d=await r.json().catch(()=>null);
  if(!d||!d.success)throw new Error(d&&d.error?d.error:'Permintaan gagal.');
  return d;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function message(text,type){$('message').textContent=text;$('message').className=type||'muted';}
async function checkHealth(){const wrap=$('healthGrid');if(!wrap)return;wrap.innerHTML='<div class="health-item">Memeriksa koneksi...</div>';try{const r=await fetch(HEALTH,{cache:'no-store'});const d=await r.json();const item=(label,ok,detail)=>`<div class="health-item"><strong>${esc(label)}</strong><span class="${ok?'health-ok':'health-bad'}">${ok?'SEHAT':'PERLU DICEK'}</span><div class="muted">${esc(detail)}</div></div>`;wrap.innerHTML=item('Gateway',Boolean(d.gateway?.serverSecretConfigured),d.gateway?.serverSecretConfigured?'Server secret tersedia.':'Server secret belum tersedia.')+item('Backend Hasil',Boolean(d.mainBackend?.ok),`HTTP ${d.mainBackend?.httpStatus||0} • ${d.mainBackend?.latencyMs||0} ms`)+item('Question Bank',Boolean(d.questionBank?.ok),`HTTP ${d.questionBank?.httpStatus||0} • ${d.questionBank?.latencyMs||0} ms`);if(d.overall!=='healthy')message('Sistem terdeteksi dalam kondisi degraded. Periksa kartu kesehatan di atas.','error');else message('Semua probe backend utama merespons normal.','success');}catch(e){wrap.innerHTML='<div class="health-item health-bad">Health endpoint tidak dapat dihubungi.</div>';message('Pemeriksaan sistem gagal: '+e.message,'error');}}
async function boot(){try{await gate();const me=await req({action:'me'});if(me.user.role!=='ADMIN')throw new Error('Akses admin ditolak.');$('adminName').textContent=me.user.displayName;await checkHealth();await overview();await listSheet('User Reports');}catch(e){message(e.message,'error');}}
async function overview(){const d=await req({action:'adminOverview'});$('counts').innerHTML=Object.entries(d.counts).map(([k,v])=>`<div class="metric"><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join('');}
async function listSheet(sheet){const d=await req({action:'adminList',sheet,limit:200});currentTable={headers:d.headers||[],rows:d.rows||[],sheet};const wrap=$('tableWrap');if(!d.rows.length){wrap.innerHTML='<p class="muted">Tidak ada data.</p>';return;}wrap.innerHTML=`<div class="table-scroll"><table><thead><tr>${d.headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function csvCell(value){const s=String(value??'');return '"'+s.replace(/"/g,'""')+'"';}
function exportData(){if(!currentTable.headers.length){message('Tidak ada data untuk diekspor.','error');return;}const lines=[currentTable.headers,currentTable.rows].flat().map(row=>row.map(csvCell).join(',')).join('\r\n');const blob=new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`TA-Assess-${currentTable.sheet.replace(/[^a-z0-9]+/gi,'-')}.csv`;a.click();URL.revokeObjectURL(url);message('Data tampilan diekspor ke CSV.','success');}
async function deleteReport(){const id=$('reportId').value.trim();if(!id)return;if(!confirm(`Hapus laporan ${id}?`))return;message('Menghapus...');try{const d=await req({action:'adminDeleteReport',reportId:id});message(`Laporan dihapus. Record terhapus: ${d.removed}.`,'success');await overview();await listSheet('User Reports');}catch(e){message(e.message,'error');}}
async function deleteUser(){const id=$('userId').value.trim();if(!id)return;if(!confirm('Hapus akun dan data laporan terkait? Tindakan ini tidak dapat dibatalkan.'))return;try{const d=await req({action:'adminDeleteUser',userId:id});message(`Akun dihapus. Reports: ${d.removedReports}, sessions: ${d.removedSessions}.`,'success');await overview();await listSheet('Accounts');}catch(e){message(e.message,'error');}}
async function setStatus(status){const id=$('userId').value.trim();if(!id)return;try{await req({action:'adminSetUserStatus',userId:id,status});message('Status akun diperbarui.','success');await listSheet('Accounts');}catch(e){message(e.message,'error');}}
async function revokeSessions(){const id=$('userId').value.trim();if(!id)return;if(!confirm('Cabut semua sesi aktif pengguna ini?'))return;try{const d=await req({action:'adminRevokeSession',userId:id});message(`Sesi dicabut: ${d.count}.`,'success');await overview();}catch(e){message(e.message,'error');}}
document.addEventListener('DOMContentLoaded',()=>{boot();$('sheetSelect').addEventListener('change',e=>listSheet(e.target.value));$('reloadData').addEventListener('click',async()=>{await overview();await listSheet($('sheetSelect').value);});$('exportData').addEventListener('click',exportData);$('deleteReport').addEventListener('click',deleteReport);$('deleteUser').addEventListener('click',deleteUser);$('suspendUser').addEventListener('click',()=>setStatus('SUSPENDED'));$('activateUser').addEventListener('click',()=>setStatus('ACTIVE'));$('revokeSessions').addEventListener('click',revokeSessions);$('refreshHealth').addEventListener('click',checkHealth);});
})();
