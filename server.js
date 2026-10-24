
// NEXORA OS v9 FINAL - REAL ESTATE FIRST 50 COMPLAINTS - HUMAN COPY - RENDER IS BRAIN
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

const PORTFOLIO = 'https://react-artifact-alpha-brown.vercel.app';
const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSd4_rws0kO916lVGUBbNjn8F0Q0E4p9L4BGq9voOmPphKp_cw/viewform';
const DASHBOARD_BASE = 'https://nexora-os-dashboard-eta.vercel.app';
const DRIVE_LINKS = {
  real_estate: 'https://drive.google.com/file/d/1PijRoIeZo3fideFwJfZ9D9g0dPC5OPfo/view?usp=sharing',
  beauty: 'https://drive.google.com/file/d/1KZctfbgK2jTDkUG5LVr4txv4yAFs2z4w/view?usp=sharing',
  food: 'https://drive.google.com/file/d/1JpVxg8uwaUrXmQhP9KAElevr-JnoMIbz/view?usp=sharing',
  gadgets: 'https://drive.google.com/file/d/1Vy9bCjSSC6Lw6PGDrhFwrB3Ax9HCNuT_/view?usp=sharing',
  general: 'https://drive.google.com/file/d/1io4NhOVwuao9AlbAQ5yK2Z2LFzaqquxX/view?usp=sharing',
  jewelry: 'https://drive.google.com/file/d/17cdmQUoX-rb2cm_Qu2L-LiuohGcvdDfJ/view?usp=sharing',
  fashion: 'https://drive.google.com/file/d/1io4NhOVwuao9AlbAQ5yK2Z2LFzaqquxX/view?usp=sharing',
  dentist: 'https://drive.google.com/file/d/1io4NhOVwuao9AlbAQ5yK2Z2LFzaqquxX/view?usp=sharing'
};

function buildRealEstateMessage(lead, complaintCount){
  const name = (lead.fullName||lead.username||'there').split(' ')[0];
  const handle = lead.username;
  const count = complaintCount || (20 + Math.floor(Math.random()*30));
  return `Hey ${name} \uD83D\uDC4B quick one - I went through your page @${handle} and I noticed something.\n\nYou had about ${count} people this week asking things like "How much for 2 bed?" "Is this still available?" "Can we inspect today?" and they didn't get reply on time.\n\nIn real estate, that enquiry goes straight to the next realtor. That's money leaving your table every day.\n\nHeres what we fix for you:\n1\uFE0F\u20E3 CRM that catches every enquiry from IG & WhatsApp before it slips - property type, budget, location, inspection date\n2\uFE0F\u20E3 Call agent that picks calls when you're busy on site inspection\n3\uFE0F\u20E3 Auto-reply that answers DMs/WhatsApp instantly so they don't go to another agent\n\nI already audited your page - if you want to see whats really happening to your business behind the scenes, your live dashboard is here:\n\uD83D\uDC49 ${DASHBOARD_BASE}/?client=${handle}&complaints=${count}\n\nMy work portfolio so you know I'm not playing:\n\uD83D\uDC49 ${PORTFOLIO}\n\nIf this is a problem for you, I can do a full free audit for your business - just fill this 2 min form:\n${FORM}\n\nOr just reply this chat and we talk business direct.`;
}
function buildDentistMessage(lead, complaintCount){
  const name = (lead.fullName||lead.username||'there').split(' ')[0];
  const handle = lead.username;
  const count = complaintCount || (15 + Math.floor(Math.random()*20));
  return `Hey ${name} \uD83D\uDC4B I checked your page @${handle} - nice work.\n\nBut you had like ${count} people this week asking "How much for cleaning?" "Do you take walk-ins?" and they didn't get reply.\n\nPatient goes to next clinic if you don't reply in 5 mins.\n\nWhat we fix:\n1\uFE0F\u20E3 CRM - every patient enquiry tracked\n2\uFE0F\u20E3 Call agent - picks calls when you're with patient\n3\uFE0F\u20E3 Auto-reply - instant price list + booking link\n\nSee what's happening behind your clinic:\n\uD83D\uDC49 ${DASHBOARD_BASE}/?client=${handle}&complaints=${count}\n\nPortfolio: ${PORTFOLIO}\n\nIf you want free audit:\n${FORM}\n\nOr reply here lets talk business.`;
}
function buildFoodMessage(lead, complaintCount){
  const name = (lead.fullName||lead.username||'there').split(' ')[0];
  const handle = lead.username;
  const count = complaintCount || (10 + Math.floor(Math.random()*15));
  return `Hi ${name} \uD83D\uDC4B I checked @${handle} - your meals are catching eyes.\n\nBut you had like ${count} people asking price for lunch pack/food bowls and not getting reply on time.\n\nHere what we fix:\n1\uFE0F\u20E3 CRM - all orders go to one place\n2\uFE0F\u20E3 Call agent - takes orders when you're in kitchen\n3\uFE0F\u20E3 Auto-reply with price list + delivery update\n\nSee live:\n\uD83D\uDC49 ${DASHBOARD_BASE}/?client=${handle}&complaints=${count}\n\nPortfolio: ${PORTFOLIO}\n\nFree audit: ${FORM}\n\nOr reply here lets talk business.`;
}
function getTemplate(niche){
  if(niche==='real_estate') return buildRealEstateMessage;
  if(niche==='dentist') return buildDentistMessage;
  if(niche==='food') return buildFoodMessage;
  return buildRealEstateMessage;
}
const normalize = (raw) => { let d=String(raw||'').replace(/\D/g,''); if(!d) return ''; if(d.startsWith('234')){} else if(d.startsWith('0')) d='234'+d.slice(1); else if(d.length==10) d='234'+d; else return ''; return d.length==13 ? '+'+d : ''; };
const isRealNG = (wa) => { const d=(wa||'').replace(/\D/g,''); if(!d) return false; if(['2348012345678','2348030000001','2348000000000'].includes(d)) return false; if(d.length!=13) return false; return ['70','80','81','90','91'].includes(d.slice(3,5)); };
const detectNiche = (bio,name) => { const t=(String(bio||'')+' '+String(name||'')).toLowerCase(); if(/real estate|realtor|property|land|lekki|ajah|duplex|apartment|rent|sale/.test(t)) return {niche:'real_estate',key:'real_estate',link:DRIVE_LINKS.real_estate}; if(/dentist|dental|clinic|teeth|orthodont/.test(t)) return {niche:'dentist',key:'dentist',link:DRIVE_LINKS.dentist}; if(/food|chops|restaurant|kitchen|cater/.test(t)) return {niche:'food',key:'food',link:DRIVE_LINKS.food}; if(/wig|hair|makeup|mua|bridal/.test(t)) return {niche:'beauty',key:'beauty',link:DRIVE_LINKS.beauty}; return {niche:'general',key:'general',link:DRIVE_LINKS.general}; };
async function polishWithAI(humanDraft, lead){
  if(!OPENROUTER_KEY) return humanDraft;
  try{
    const sys = `You are a Nigerian businesswoman typing on WhatsApp. Rewrite the message to sound MORE human, not AI. Keep exact structure: greeting, problem (20-50 complaints), list CRM Call agent Auto-reply, dashboard link, portfolio link, free audit form, reply to talk business. DO NOT add free dashboard free build charity. Keep links as is. Return ONLY rewritten message.`;
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+OPENROUTER_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,messages:[{role:'system',content:sys},{role:'user',content:`Lead: ${lead.fullName} @${lead.username} Bio: ${lead.bio} Draft: ${humanDraft}`}],temperature:0.8,max_tokens:900})});
    const d = await r.json();
    const raw = d?.choices?.[0]?.message?.content||'';
    if(raw && raw.length>50) return raw.trim();
    return humanDraft;
  }catch(e){ return humanDraft; }
}
app.get('/',(req,res)=>res.json({status:'NEXORA OS v9 - REAL ESTATE FIRST - 20-50 complaints - HUMAN COPY - Render is brain', endpoints:['/health','/run-whatsapp-real-estate?count=20','/run-whatsapp-dentist?count=20','/run-whatsapp-manual','/api/leads'], portfolio:PORTFOLIO, form:FORM, dashboard:DASHBOARD_BASE, time:new Date().toISOString()}));
app.get('/health',(req,res)=>res.json({ok:true, supabase:!!supabase, openrouter:!!OPENROUTER_KEY, version:'v9-real-estate-first'}));
app.post('/run-whatsapp-manual', async(req,res)=>{
  try{
    const leadsIn = req.body.leads||[];
    const targetNiche = req.body.niche || 'real_estate';
    const out=[];
    for(const r of leadsIn.slice(0,50)){
      const wa = normalize(r.wa||r.WhatsApp||r.waNumber||'');
      if(!isRealNG(wa)) continue;
      const mapped = detectNiche(r.bio||'', r.fullName||r.username||'');
      const finalNiche = targetNiche==='real_estate' ? 'real_estate' : mapped.key;
      const templateFn = getTemplate(finalNiche);
      const complaintCount = 20 + Math.floor(Math.random()*30);
      const leadObj = {username:r.username, fullName:r.fullName||r.username, bio:r.bio||'', niche:finalNiche};
      let humanMsg = templateFn(leadObj, complaintCount);
      humanMsg = await polishWithAI(humanMsg, leadObj);
      const digits=wa.replace(/\D/g,'');
      const waLink=`https://wa.me/${digits}?text=`+encodeURIComponent(humanMsg);
      const row = {Username:r.username, 'Full Name':r.fullName, Bio:r.bio, 'WhatsApp Number':wa, 'WhatsApp Send Link':waLink, 'IG DM':humanMsg.slice(0,300), 'WhatsApp Message':humanMsg, 'Business Niche':finalNiche, 'Excel Link':DRIVE_LINKS[finalNiche]||DRIVE_LINKS.real_estate, 'Portfolio Link':PORTFOLIO, 'Audit Form Link':FORM, 'Dashboard Link':`${DASHBOARD_BASE}/?client=${r.username}&complaints=${complaintCount}`, complaints:complaintCount};
      out.push(row);
      if(supabase) await supabase.from('nexora_leads').insert({client_name:r.fullName, username:r.username, bio:r.bio, whatsapp_number:wa, whatsapp_send_link:waLink, ai_message:humanMsg, business_niche:finalNiche, status:'pending', complaints:complaintCount});
    }
    res.json({success:true, niche:targetNiche, count:out.length, leads:out, sample_link:out[0]?.['WhatsApp Send Link'], sample_msg:out[0]?.['WhatsApp Message']});
  }catch(e){ res.status(500).json({error:e.message}); }
});
app.get('/run-whatsapp-real-estate', async(req,res)=>{
  try{
    const count = Math.min(50, parseInt(req.query.count||'20'));
    if(!supabase) return res.json({success:false, message:'Add SUPABASE env or use POST /run-whatsapp-manual with niche=real_estate'});
    const {data} = await supabase.from('nexora_leads').select('*').eq('business_niche','real_estate').eq('status','source').limit(count);
    const leads = data && data.length ? data : [];
    if(!leads.length){ return res.json({success:false, message:`No real estate source rows found. You need to scrape 20-50 real estate leads into nexora_leads with business_niche=real_estate and status=source.`}); }
    const out=[];
    for(const r of leads){
      const wa=normalize(r.whatsapp_number); if(!isRealNG(wa)) continue;
      const complaintCount = 20 + Math.floor(Math.random()*30);
      let humanMsg = buildRealEstateMessage({username:r.username, fullName:r.client_name, bio:r.bio||''}, complaintCount);
      humanMsg = await polishWithAI(humanMsg, {username:r.username, fullName:r.client_name, bio:r.bio||''});
      const digits=wa.replace(/\D/g,''); const waLink=`https://wa.me/${digits}?text=`+encodeURIComponent(humanMsg);
      out.push({wa, waLink, msg:humanMsg, complaints:complaintCount, username:r.username});
      await supabase.from('nexora_leads').update({whatsapp_send_link:waLink, ai_message:humanMsg, status:'pending', complaints:complaintCount}).eq('id',r.id);
    }
    res.json({success:true, niche:'real_estate', count:out.length, complaints:'20-50 per lead', leads:out});
  }catch(e){ res.status(500).json({error:e.message}); }
});
app.get('/run-whatsapp-dentist', async(req,res)=>{
  try{
    const count = Math.min(50, parseInt(req.query.count||'20'));
    if(!supabase) return res.json({success:false, message:'Use POST /run-whatsapp-manual with niche=dentist'});
    const {data} = await supabase.from('nexora_leads').select('*').eq('business_niche','dentist').eq('status','source').limit(count);
    if(!data?.length) return res.json({success:false, message:'No dentist source rows. Scrape dentists first.'});
    const out=[];
    for(const r of data){
      const wa=normalize(r.whatsapp_number); if(!isRealNG(wa)) continue;
      const complaintCount = 15 + Math.floor(Math.random()*20);
      let humanMsg = buildDentistMessage({username:r.username, fullName:r.client_name, bio:r.bio||''}, complaintCount);
      humanMsg = await polishWithAI(humanMsg, {username:r.username, fullName:r.client_name, bio:r.bio||''});
      const digits=wa.replace(/\D/g,''); const waLink=`https://wa.me/${digits}?text=`+encodeURIComponent(humanMsg);
      out.push({wa, waLink, msg:humanMsg, complaints:complaintCount});
      await supabase.from('nexora_leads').update({whatsapp_send_link:waLink, ai_message:humanMsg, status:'pending', complaints:complaintCount}).eq('id',r.id);
    }
    res.json({success:true, niche:'dentist', count:out.length, leads:out});
  }catch(e){ res.status(500).json({error:e.message}); }
});
app.get('/api/leads', async(req,res)=>{ if(!supabase) return res.json({leads:[]}); const {data}=await supabase.from('nexora_leads').select('*').order('created_at',{ascending:false}).limit(100); res.json({leads:data||[]}); });
app.listen(PORT,()=>console.log('NEXORA v9 REAL ESTATE FIRST - 20-50 complaints - HUMAN COPY - on '+PORT));

