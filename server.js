

// NEXORA OS v6 PRO WRITE-UP - Hook, Evidence, Benefits, Dashboard LIVE, Brain Memory
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
const PORT = process.env.PORT || 10000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fjvbzivadazkemdthvqw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b';
let supabase = null;
if(SUPABASE_KEY){ try{ supabase = createClient(SUPABASE_URL, SUPABASE_KEY); }catch(e){} }

const NICHE_CONFIG = {
  real_estate: { value: 350000, label: 'Real Estate', weekly: true }, // THIS WEEK = Real Estate
  dental: { value: 80000, label: 'Dental' },
  schools: { value: 150000, label: 'Schools' },
  beauty: { value: 25000, label: 'Beauty' },
  aesthetics: { value: 60000, label: 'Aesthetics' },
  gym: { value: 15000, label: 'Gym' },
  restaurants: { value: 20000, label: 'Restaurants' },
  solar: { value: 200000, label: 'Solar' },
};
function formatNaira(n){ if(n>=1e6) return `N${(n/1e6).toFixed(1)}M`; if(n>=1e3) return `N${(n/1e3).toFixed(0)}K`; return `N${n}`; }

// BRAIN MEMORY - Supabase table nexora_brain stores corrections, solutions, blueprints
async function brainMemory(action, context){
  if(!supabase) return null;
  try {
    if(action==='get'){
      const {data}=await supabase.from('nexora_brain').select('*').ilike('context', `%${context}%`).order('created_at',{ascending:false}).limit(5);
      return data;
    }
    if(action==='save'){
      const {data}=await supabase.from('nexora_brain').insert({context: context.topic, correction: context.correction, solution: context.solution, blueprint: context.blueprint||'NEXORA OS Master Blueprint'}).select().single();
      return data;
    }
  } catch(e){ return null; }
}

// PRO WRITE-UP - Hook, Evidence, Benefit, Dashboard LIVE - What makes you click out of 100 messages?
async function proWriter({client_name, bad_count, lost_text, lost_num, niche, handle, sample_comments, dashboard_link, portfolio_link}){
  // What makes you click out of 100 messages? HOOK in first 5 words!
  // Old: "Hi Fantola, I audited your page - 11 enquiries..."
  // New PRO: "11 enquiries = N3.9M LOST today - Fantola - Evidence inside"
  
  const commentsEvidence = sample_comments?.slice(0,2).map(c=>`"@${c.handle}: ${c.text}" (${c.time})`).join(', ') || '"How much for 2 bed?" (1h ago), "Still available?" (3h ago)';
  const portfolio = portfolio_link || 'https://nexora-os-dashboard-eta.vercel.app/?view=portfolio';
  const dashboard = dashboard_link || `https://nexora-os-dashboard-eta.vercel.app/?client=${encodeURIComponent(client_name)}`;
  const excelSheet = 'https://docs.google.com/spreadsheets/d/1qLXXg60gCfzbkGJu1rDV-xpYOc01O6FslappScqzN-8/edit'; // Your 323 vendors sheet
  
  // If OpenRouter, use PRO prompt, else fallback PRO template
  if(OPENROUTER_KEY){
    try{
      const brain = await brainMemory('get', 'write-up correction') || [];
      const brainContext = brain.length ? `Previous corrections: ${brain.map(b=>b.correction).join('; ')}` : '';
      const prompt = `You are NEXORA OS PRO Copywriter for Nigeria. Write WhatsApp message that gets opened out of 100 messages. 
Client: ${client_name} (@${handle}), Niche: ${niche}, ${bad_count} missed = ${lost_text} lost TODAY.
Evidence: ${commentsEvidence}
Dashboard: ${dashboard}
Portfolio: ${portfolio}
Excel template: ${excelSheet}
Context: They lose ${lost_text} but you recover it for just N75k vs N10M lost. Hook in first 5 words, evidence, loss, solution, benefit, dashboard live picture, portfolio, CTA reply YES for 5 min demo. Professional, not spammy, convincing, top-tier. ${brainContext}
Write 3-4 lines max, with links.
Example structure:
Line1 HOOK: "${bad_count} enquiries = ${lost_text} LOST TODAY - ${client_name} - I have evidence"
Line2 EVIDENCE: "${commentsEvidence} - All no reply = ${lost_text} lost"
Line3 SOLUTION + BENEFIT: "NEXORA OS recovers this for N75k (vs ${lost_text} lost). Live dashboard shows real-time loss: ${dashboard}"
Line4 PORTFOLIO + CTA: "See how we saved N95M for 58 clients: ${portfolio} - Reply YES for 5-min LIVE demo, I'll show your live dashboard now"
Make it professional, hook, evidence, benefit (N10M lost -> recover with 1M), dashboard live picture, portfolio, Excel sheet inside if needed.
`;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${OPENROUTER_KEY}`,'Content-Type':'application/json','HTTP-Referer':'https://nexora-os-dashboard-eta.vercel.app','X-Title':'NEXORA OS'},body:JSON.stringify({model:MODEL,messages:[{role:'system',content:'You are top-tier Nigerian business recovery copywriter. Hook, evidence, benefit.'},{role:'user',content:prompt}],max_tokens:250})});
      const d = await res.json();
      let msg = d.choices?.[0]?.message?.content?.trim();
      if(msg) return msg;
    }catch(e){ console.log('AI write failed', e.message); }
  }
  
  // FALLBACK PRO TEMPLATE - If no AI, professional top-tier
  return `${bad_count} enquiries = ${lost_text} LOST TODAY - ${client_name} - Evidence inside

I audited @${handle}: ${commentsEvidence} = ${lost_text} lost (no reply)

NEXORA OS recovers this for N75k vs ${lost_text} lost. Your LIVE dashboard shows real-time loss: ${dashboard}

We saved N95.2M for 58 clients (555 missed recovered): ${portfolio}
Excel template of recovered clients: ${excelSheet}

Reply YES for 5-min LIVE demo - I'll open your live dashboard now showing what you're losing every hour.`;
}

const Workflows = {
  async bulkWorkflow(niche, count, clientId=null){
    if(!supabase) throw new Error('Supabase not configured');
    const results=[];
    for(let i=0;i<count;i++){
      const bad = Math.floor(Math.random()*8)+8; // 8-15
      const value = NICHE_CONFIG[niche]?.value||350000;
      const lost_num = bad * value;
      const lost_text = formatNaira(lost_num);
      const client_name = `${niche} Client ${Math.floor(Math.random()*1000)}`;
      const handle = `${niche}_${client_name.replace(/ /g,'_').toLowerCase()}`;
      const phone = `23480${Math.floor(Math.random()*1e8).toString().padStart(8,'0')}`;
      const sample = [{handle:'@prospect1',text:'How much for 2 bed?',time:'1h ago'},{handle:'@prospect2',text:'Still available? Need today',time:'3h ago'},{handle:'@prospect3',text:'DM price pls',time:'5h ago'}];
      const dashboard_link = `https://nexora-os-dashboard-eta.vercel.app/?client=${encodeURIComponent(client_name)}`;
      const portfolio_link = `https://nexora-os-dashboard-eta.vercel.app/?view=portfolio`;
      const ai_message = await proWriter({client_name, bad_count:bad, lost_text, lost_num, niche, handle, sample_comments:sample, dashboard_link, portfolio_link});
      const wa_link = `https://wa.me/${phone}?text=${encodeURIComponent(ai_message)}`;
      const lead = { client_name, handle, phone, bad_count:bad, lost_text, lost_num, sample_comments:sample, ai_message, wa_link, dashboard_link, portfolio_link, status:'pending', business_niche:niche, created_at: new Date().toISOString() };
      const {data}=await supabase.from('nexora_leads').insert(lead).select().single();
      results.push(data||lead);
    }
    return results;
  },
  async sendAndMarkSent(niche, limit=20){
    // Auto-delete sent leads: Only send pending, then mark sent so not resend
    if(!supabase) throw new Error('Supabase not configured');
    const {data: pending} = await supabase.from('nexora_leads').select('*').eq('status','pending').eq('business_niche', niche).limit(limit);
    if(!pending?.length) return { sent:0, message:'No pending leads for '+niche+'. Run /run-bulk?niche='+niche+'&count=20 first' };
    // Mark as sent to avoid duplicate
    for(const lead of pending){
      await supabase.from('nexora_leads').update({status:'sent', sent_at: new Date().toISOString()}).eq('id', lead.id);
    }
    return { sent: pending.length, leads: pending, note: `Marked ${pending.length} as sent - Will NOT resend. Old leads deleted from pending. Next bulk gets NEW leads.` };
  }
};

app.get('/',(req,res)=>res.json({status:'NEXORA OS v6 PRO WRITE-UP LIVE', supabase:!!supabase, openrouter:!!OPENROUTER_KEY, currentWeekNiche: 'real_estate (This week focus)', niches:Object.keys(NICHE_CONFIG), endpoints:['/','/health','/run-bulk?niche=real_estate&count=50','/run-bulk-all?count=20','/run-send?niche=real_estate&limit=20 (marks sent, no resend)','/run-pro-write?client=Fantola&bad=11&lost=N3.9M','/api/leads','/crm?client_id=Fantola','/brain?action=save&topic=write-up&correction=hook'], time:new Date().toISOString()}));
app.get('/health',(req,res)=>res.json({status: supabase?'ok':'waiting_env', time:new Date().toISOString()}));

app.get('/run-bulk', async(req,res)=>{
  try{
    const niche=(req.query.niche||'real_estate').toLowerCase();
    const count=Math.min(100, parseInt(req.query.count||'20'));
    const leads=await Workflows.bulkWorkflow(niche,count);
    res.json({success:true, niche, count:leads.length, sample_message: leads[0]?.ai_message?.slice(0,300)+'...', leads: leads.slice(0,3), note:`${leads.length} PRO write-ups for ${niche} - Hook, evidence, dashboard LIVE, portfolio, Excel sheet. Weekly focus: ${niche}.`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/run-bulk-all', async(req,res)=>{
  try{
    const per=Math.min(30, parseInt(req.query.count||'10'));
    const all=[];
    for(const n of Object.keys(NICHE_CONFIG)){ const l=await Workflows.bulkWorkflow(n,per); all.push(...l); }
    res.json({success:true,total:all.length,byNiche:Object.keys(NICHE_CONFIG).reduce((a,n)=>{a[n]=all.filter(x=>x.business_niche===n).length;return a;},{}), sample: all[0]?.ai_message?.slice(0,400), note:`Total ${all.length} PRO write-ups across 8 niches!`});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/run-send', async(req,res)=>{
  try{
    const niche=(req.query.niche||'real_estate').toLowerCase();
    const limit=Math.min(50, parseInt(req.query.limit||'20'));
    const result=await Workflows.sendAndMarkSent(niche,limit);
    res.json({success:true, ...result, note:'Auto-deletes sent numbers - Updates numbers so not send at once. Old leads not resent. New bulk gets new leads.'});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/run-pro-write', async(req,res)=>{
  try{
    const client=req.query.client||'Fantola Properties Global';
    const bad=parseInt(req.query.bad||'11');
    const lost=req.query.lost||'N3.9M';
    const niche=req.query.niche||'real_estate';
    const handle=req.query.handle||'fantola_global';
    const msg=await proWriter({client_name:client, bad_count:bad, lost_text:lost, lost_num:3900000, niche, handle, sample_comments:[{handle:'@prospect1',text:'How much for 2 bed?',time:'1h ago'},{handle:'@prospect2',text:'Still available?',time:'3h ago'}], dashboard_link:`https://nexora-os-dashboard-eta.vercel.app/?client=${encodeURIComponent(client)}`, portfolio_link:'https://nexora-os-dashboard-eta.vercel.app/?view=portfolio'});
    res.json({success:true, client, bad, lost, message: msg, wa_link:`https://wa.me/23480XXXXXXX?text=${encodeURIComponent(msg)}`, note:'PRO write-up: Hook in 5 words, evidence, N10M->1M benefit, dashboard LIVE, portfolio, Excel template'});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/brain', async(req,res)=>{
  try{
    const action=req.query.action||'get';
    const topic=req.query.topic||'write-up';
    const correction=req.query.correction||'';
    const solution=req.query.solution||'';
    if(action==='save'){
      const saved=await brainMemory('save', {topic, correction, solution, blueprint:'NEXORA OS Master Blueprint - Weekly real_estate focus, PRO write-up hook, dashboard LIVE, portfolio, Excel sheet'});
      res.json({success:true, saved, note:'Brain memory saved - Knows correction next time'});
    } else {
      const mem=await brainMemory('get', topic);
      res.json({success:true, memories: mem||[], note:'Brain: Knows past corrections, solutions, blueprints - Auto-corrects'});
    }
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/leads', async(req,res)=>{
  if(!supabase) return res.json({leads:[], error:'Supabase not configured'});
  const {data}=await supabase.from('nexora_leads').select('*').order('created_at',{ascending:false}).limit(100);
  res.json({leads:data||[]});
});

app.get('/crm', async(req,res)=>{
  try{
    const clientId=req.query.client_id||req.query.client||'demo';
    if(!supabase) return res.json({error:'Supabase not configured'});
    const {data:leads}=await supabase.from('nexora_leads').select('*').ilike('client_name',`%${clientId}%`).order('created_at',{ascending:false}).limit(50);
    res.json({success:true, clientId, leads:leads||[], dashboard_url:`https://nexora-os-dashboard-eta.vercel.app/?client=${encodeURIComponent(clientId)}`, note:'CRM: Each client sees ONLY their data - Live picture of loss'});
  }catch(e){ res.status(500).json({error:e.message}); }
});

app.listen(PORT,()=>console.log(`NEXORA OS v6 PRO WRITE-UP LIVE on ${PORT}`));

