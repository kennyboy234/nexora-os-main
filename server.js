
// NEXORA OS v8 FINAL - WHATSAPP FIRST - Render replaces n8n
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
const PORT = process.env.PORT || 10000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b';
let supabase = null;
if(SUPABASE_URL && SUPABASE_KEY){ try{ supabase = createClient(SUPABASE_URL, SUPABASE_KEY); }catch(e){} }

const DRIVE_LINKS = {
  beauty: 'https://drive.google.com/file/d/1KZctfbgK2jTDkUG5LVr4txv4yAFs2z4w/view',
  food: 'https://drive.google.com/file/d/1JpVxg8uwaUrXmQhP9KAElevr-JnoMIbz/view',
  real_estate: 'https://drive.google.com/file/d/1PijRoIeZo3fideFwJfZ9D9g0dPC5OPfo/view',
  gadgets: 'https://drive.google.com/file/d/1Vy9bCjSSC6Lw6PGDrhFwrB3Ax9HCNuT_/view',
  general: 'https://drive.google.com/file/d/1io4NhOVwuao9AlbAQ5yK2Z2LFzaqquxX/view',
  jewelry: 'https://drive.google.com/file/d/17cdmQUoX-rb2cm_Qu2L-LiuohGcvdDfJ/view',
  fashion: 'https://drive.google.com/file/d/1io4NhOVwuao9AlbAQ5yK2Z2LFzaqquxX/view'
};
const PORTFOLIO = 'https://react-artifact-alpha-brown.vercel.app';
const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSd4_rws0kO916lVGUBbNjn8F0Q0E4p9L4BGq9voOmPphKp_cw/viewform';

const normalize = (raw) => { let d=String(raw||'').replace(/\D/g,''); if(!d) return ''; if(d.startsWith('234')){} else if(d.startsWith('0')) d='234'+d.slice(1); else if(d.length==10) d='234'+d; else return ''; return d.length==13 ? '+'+d : ''; };
const isRealNG = (wa) => { const d=(wa||'').replace(/\D/g,''); if(!d || d.includes('CHECK')) return false; if(['2348012345678','2348030000001'].includes(d)) return false; if(d.length!=13) return false; return ['70','80','81','90','91'].includes(d.slice(3,5)); };
const detectNiche = (bio,name) => { const t=(bio+' '+name).toLowerCase(); if(/food|chops|restaurant|kitchen|cater/.test(t)) return {niche:'Food Vendor',key:'food',link:DRIVE_LINKS.food}; if(/real estate|realtor|property|land|lekki|ajah/.test(t)) return {niche:'Real Estate',key:'real_estate',link:DRIVE_LINKS.real_estate}; if(/wig|hair|makeup|mua|bridal/.test(t)) return {niche:'Beauty & Wigs',key:'beauty',link:DRIVE_LINKS.beauty}; if(/fashion|abaya|rtw|ankara|boutique/.test(t)) return {niche:'Fashion Designer',key:'fashion',link:DRIVE_LINKS.fashion}; if(/phone|gadget|iphone|airpod/.test(t)) return {niche:'Phone & Gadgets',key:'gadgets',link:DRIVE_LINKS.gadgets}; if(/jewel|chain|bracelet|gold/.test(t)) return {niche:'Jewelry',key:'jewelry',link:DRIVE_LINKS.jewelry}; return {niche:'General Vendor',key:'general',link:DRIVE_LINKS.general}; };

async function genMsg(lead){
  if(!OPENROUTER_KEY) return {ig:`Hi ${lead.fullName}`, wa:`Hi ${lead.fullName} I built sample 9-tab Excel for ${lead.niche} Portfolio: ${PORTFOLIO} Sample: ${lead.excel} Audit: ${FORM}`};
  const sys = `You are Nexora founder Kenny. Write JSON {"ig_dm":"...","whatsapp_msg":"..."} WhatsApp: 3-4 paras NG friendly, must include Portfolio: ${PORTFOLIO} Excel: ${lead.excel} Form: ${FORM}. Mention ONE bio detail.`;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+OPENROUTER_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,messages:[{role:'system',content:sys},{role:'user',content:`Business: ${lead.fullName} (@${lead.username}) Bio: ${lead.bio} Niche: ${lead.niche}`}],temperature:0.7,max_tokens:800})});
  const d = await r.json(); let raw=d?.choices?.[0]?.message?.content||''; raw=raw.replace(/```json/g,'').replace(/```/g,'').trim(); try{ const p=JSON.parse(raw); return {ig:p.ig_dm||'', wa:p.whatsapp_msg||''}; }catch(e){ return {ig:raw.slice(0,300), wa:raw}; }
}

app.get('/',(req,res)=>res.json({status:'NEXORA OS v8 WHATSAPP FIRST - Render replaces n8n', endpoints:['/health','/run-whatsapp?count=20','/api/leads'], supabase:!!supabase, openrouter:!!OPENROUTER_KEY, portfolio:PORTFOLIO, form:FORM, time:new Date().toISOString()}));
app.get('/health',(req,res)=>res.json({ok:true, supabase:!!supabase, openrouter:!!OPENROUTER_KEY}));

app.post('/run-whatsapp-manual', async(req,res)=>{
  try{
    const leadsIn = req.body.leads||[];
    const out=[];
    for(const r of leadsIn.slice(0,40)){
      const wa = normalize(r.wa||r.WhatsApp||'');
      if(!isRealNG(wa)) continue;
      const mapped = detectNiche(r.bio||'', r.fullName||'');
      const lead={username:r.username, fullName:r.fullName, bio:r.bio||'', niche:mapped.niche, excel:mapped.link};
      const msgs = await genMsg(lead);
      const digits=wa.replace(/\D/g,'');
      const waLink=`https://wa.me/${digits}?text=`+encodeURIComponent(msgs.wa);
      out.push({Username:r.username, 'Full Name':r.fullName, Bio:r.bio, 'WhatsApp Number':wa, 'WhatsApp Send Link':waLink, 'IG DM':msgs.ig, 'WhatsApp Message':msgs.wa, 'Business Niche':mapped.niche, 'Excel Link':mapped.link, 'Portfolio Link':PORTFOLIO, 'Audit Form Link':FORM});
      if(supabase) await supabase.from('nexora_leads').insert({client_name:r.fullName, username:r.username, whatsapp_number:wa, whatsapp_send_link:waLink, ai_message:msgs.wa, ig_dm:msgs.ig, business_niche:mapped.key, status:'pending'});
    }
    res.json({success:true, count:out.length, leads:out, sample_link:out[0]?.['WhatsApp Send Link']});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/run-whatsapp', async(req,res)=>{
  try{
    if(!supabase) return res.json({success:false, message:'Add SUPABASE env then use POST /run-whatsapp-manual'});
    const {data} = await supabase.from('nexora_leads').select('*').eq('status','source').limit(parseInt(req.query.count||'20'));
    if(!data?.length) return res.json({success:false, message:'No source rows. Insert into nexora_leads with status=source OR use POST /run-whatsapp-manual'});
    const out=[];
    for(const r of data){
      const wa=normalize(r.whatsapp_number); if(!isRealNG(wa)) continue;
      const mapped=detectNiche(r.bio||'', r.client_name||'');
      const msgs=await genMsg({username:r.username, fullName:r.client_name, bio:r.bio||'', niche:mapped.niche, excel:mapped.link});
      const digits=wa.replace(/\D/g,''); const waLink=`https://wa.me/${digits}?text=`+encodeURIComponent(msgs.wa);
      out.push({wa, waLink, msg:msgs.wa});
      await supabase.from('nexora_leads').update({whatsapp_send_link:waLink, ai_message:msgs.wa, status:'pending'}).eq('id',r.id);
    }
    res.json({success:true, count:out.length, sample:out[0]});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/leads', async(req,res)=>{ if(!supabase) return res.json({leads:[]}); const {data}=await supabase.from('nexora_leads').select('*').order('created_at',{ascending:false}).limit(100); res.json({leads:data||[]}); });
app.listen(PORT,()=>console.log('NEXORA v8 WHATSAPP FIRST on '+PORT));

