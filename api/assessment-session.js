const crypto = require('crypto');

const UPSTREAM = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';

function json(res, status, data) { res.setHeader('Cache-Control', 'no-store'); return res.status(status).json(data); }
function safe(value, max=120) { return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max); }
function botRisk(req) {
  const ua=safe(req.headers['user-agent'],240).toLowerCase();
  const signals=[];
  if(!ua)signals.push('missing_user_agent');
  if(/headless|phantomjs|selenium|playwright|puppeteer|webdriver|curl|python-requests|wget/i.test(ua))signals.push('automation_user_agent');
  const accept=safe(req.headers.accept,240);
  if(!accept)signals.push('missing_accept');
  const lang=safe(req.headers['accept-language'],120);
  if(!lang)signals.push('missing_language');
  const risk=Math.min(100,signals.length*40);
  return {score:risk,level:risk>=80?'high':risk>=40?'medium':'low',signals};
}
async function audit(session, risk) {
  try {
    await fetch(UPSTREAM,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({
      action:'logEvent',eventName:risk.score>=40?'bot_risk_detected':'assessment_session_issued',assessmentId:session.assessmentId,source:'security-gateway',metadata:{
        securitySessionId:session.sessionId,mode:session.mode,botRisk:risk.level,botRiskScore:risk.score,signals:risk.signals.slice(0,6)
      }
    }),redirect:'follow'});
  } catch (_) {}
}

module.exports = async function handler(req,res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-TA-Client-Signals');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='GET')return json(res,405,{success:false,error:'Method tidak didukung.'});

  const secret=process.env.TA_ASSESS_SERVER_SECRET||'';
  if(secret.length<32)return json(res,503,{success:false,error:'Server security secret belum dikonfigurasi.'});

  const assessmentId=safe(req.query?.assessmentId);
  const mode=safe(req.query?.mode||'guest').toLowerCase();
  if(!/^[A-Za-z0-9._-]{1,120}$/.test(assessmentId))return json(res,400,{success:false,error:'assessmentId tidak valid.'});
  if(!['guest','account'].includes(mode))return json(res,400,{success:false,error:'Mode akses tidak valid.'});

  const issuedAt=Math.floor(Date.now()/1000), expiresAt=issuedAt+45*60, sessionId=crypto.randomUUID();
  const session={sessionId,assessmentId,mode,issuedAt,expiresAt};
  const payload=Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature=crypto.createHmac('sha256',secret).update(payload).digest('base64url');
  const risk=botRisk(req);
  await audit(session,risk);

  return json(res,200,{success:true,securityVersion:'1.1',token:`${payload}.${signature}`,expiresAt:new Date(expiresAt*1000).toISOString(),botRisk:risk.level,botRiskScore:risk.score});
};
