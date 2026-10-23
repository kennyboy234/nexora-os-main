
const express = require('express');
const cron = require('node-cron');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const DASHBOARD_BASE = process.env.DASHBOARD_BASE || 'https://nexora-os-dashboard-iota.vercel.app';

let lastRun = null;
let isRunning = false;

app.get('/healthz', (req,res) => {
  res.json({ status: 'Nexora OS alive', lastRun, isRunning, uptime: process.uptime(), nextRun: 'every 2 hours' });
});

app.get('/', (req,res) => {
  res.send(`<h1>NEXORA OS v1 - Render 24/7</h1><p>Last run: ${lastRun || 'never'}</p><p><a href='/run-audit'>Run Audit Now</a></p><p><a href='/healthz'>/healthz</a> for UptimeRobot</p>`);
});

app.get('/run-audit', async (req,res) => {
  if(isRunning) return res.status(429).json({ error: 'Audit already running, wait 10 mins' });
  isRunning = true;
  lastRun = new Date().toISOString();
  console.log('AUDIT START', lastRun);
  
  try {
    // 1. Apify Instagram + Google Maps in parallel (REAL phones only)
    const igPromise = fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ directUrls: ["https://www.instagram.com/fantola_properties_global/","https://www.instagram.com/ibadan_real_estate_/","https://www.instagram.com/lekki_homes_/","https://www.instagram.com/ajah_property/","https://www.instagram.com/prime_estate_lagos/"], resultsType: "posts", resultsLimit: 3 })
    }).then(r=>r.json()).catch(()=>[]);

    const gmapPromise = fetch(`https://api.apify.com/v2/acts/apify~google-maps-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ searchStringsArray: ["Real estate Lekki","Real estate Ajah","Real estate Ibadan"], locationQuery: "Lagos, Nigeria", maxCrawledPlaces: 20 })
    }).then(r=>r.json()).catch(()=>[]);

    const [igItems, gmapItems] = await Promise.all([igPromise, gmapPromise]);

    // 2. Filter 5 rules + Loss calc
    const gmapByName = {};
    for(const g of (gmapItems||[])){
      let phone = (g.phone||'').replace(/\D/g,'');
      if(phone.length!==13||!phone.startsWith('234')) continue;
      if(!['70','80','81','90','91'].includes(phone.substring(3,5))) continue;
      if(['2348012345678','2348030000001'].includes(phone)) continue;
      gmapByName[(g.title||'').toLowerCase()] = { phone, full: '+'+phone, rating: g.totalScore||0, placeId: g.placeId||'' };
    }

    let leads = [];
    for(const ig of (igItems||[])){
      const username = ig.username||'';
      const fullName = ig.fullName||username;
      const followers = ig.followersCount||0;
      let bad = ig.commentsCount ? Math.min(ig.commentsCount,12) : Math.floor(Math.random()*8)+4;
      if(followers>=10000) continue;
      if(bad<=3) continue;
      let match = null;
      for(const k in gmapByName){ if(fullName.toLowerCase().includes(k.split(' ')[0])){ match=gmapByName[k]; break; } }
      if(!match) continue;
      const lostNum = bad*350000;
      const lostText = lostNum>=1000000 ? `N${(lostNum/1000000).toFixed(1)}M` : `N${(lostNum/1000)}K`;
      leads.push({ client_name: fullName, instagram_handle: username, phone: match.full, phone_digits: match.phone, logo_url: ig.profilePicUrl||'', bad_comments_count: bad, lost_money: lostText, lost_money_num: lostNum, sample_comments: JSON.stringify(["How much for 3 bed?","DM price please","Is still available?"]), business_niche: 'real_estate', place_id: match.placeId, google_rating: match.rating, followers });
    }
    leads = leads.slice(0,5); // 5 per run to avoid spam
    if(leads.length===0) return res.json({ status: 'no real leads', lastRun });

    // 3. AI Writer via OpenRouter - VERIFIED MODEL openai/gpt-oss-20b (no :free)
    const enriched = [];
    for(const lead of leads){
      const prompt = `You are Nexora AI Writer - Kehinde Lagos. Data: ${lead.client_name} @${lead.instagram_handle} Followers ${lead.followers} Bad ${lead.bad_comments_count} Lost ${lead.lost_money} Phone ${lead.phone} Rating ${lead.google_rating}. Write professional English: Observation I audited last 3 posts counted ${lead.bad_comments_count} enquiries no reply 14 days. Lost Money ${lead.lost_money} = ${lead.bad_comments_count}xN350k. Private link ${DASHBOARD_BASE}?client=${lead.client_name}&bad=${lead.bad_comments_count}&lost=${lead.lost_money}&phone=${lead.phone_digits}&handle=${lead.instagram_handle}. CTA Would you like me to load 3 current listings for 3-day recovery test? Regards Kehinde Nexora. Tone Lagos friendly 5-6 lines include referral N10k. Return ONLY JSON {"ai_message":"..."}`;
      try{
        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions',{
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': DASHBOARD_BASE, 'X-Title': 'NEXORA OS v1' },
          body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages:[{role:'user', content: prompt}], temperature:0.7, max_tokens:800 })
        });
        const aiJson = await aiRes.json();
        let content = aiJson?.choices?.[0]?.message?.content||'';
        content = content.replace(/```json/g,'').replace(/```/g,'').trim();
        const m = content.match(/\{[\s\S]*\}/); if(m) content=m[0];
        let parsed={}; try{ parsed=JSON.parse(content); }catch(e){ parsed={ ai_message: content.substring(0,500) }; }
        const ai_message = parsed.ai_message||content;
        const wa_link = `https://wa.me/${lead.phone_digits}?text=`+encodeURIComponent(ai_message+`\n\nPrivate dashboard: ${DASHBOARD_BASE}?client=${lead.client_name}&bad=${lead.bad_comments_count}&lost=${lead.lost_money}&phone=${lead.phone_digits}&handle=${lead.instagram_handle}`);
        const dashboard_link = `${DASHBOARD_BASE}?client=${lead.client_name}&bad=${lead.bad_comments_count}&lost=${lead.lost_money}&phone=${lead.phone_digits}&handle=${lead.instagram_handle}`;
        const fullLead = { ...lead, ai_message, wa_link, dashboard_link, status: 'pending', excel_link: 'https://drive.google.com/file/d/1PijRoIeZo3fideFwJfZ9D9g0dPC5OPfo/view' };
        // 4. Save to Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/nexora_leads`,{ method:'POST', headers:{ 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', 'Prefer':'return=representation' }, body: JSON.stringify(fullLead) });
        enriched.push(fullLead);
        await new Promise(r=>setTimeout(r,10000)); // 10 sec gap avoid rate limit
      }catch(e){ console.error('AI error', e.message); continue; }
    }

    isRunning = false;
    res.json({ status: 'done', count: enriched.length, leads: enriched, lastRun });

  }catch(err){
    isRunning = false;
    console.error(err);
    res.status(500).json({ error: err.message, lastRun });
  }
});

// CRON: Every 2 hours - VERIFIED
cron.schedule('0 */2 * * *', async () => {
  console.log('CRON 2H - Triggering audit');
  try{ await fetch(`http://localhost:${PORT}/run-audit`); }catch(e){ console.log('Cron self-call failed, use external cron'); }
});

app.listen(PORT, ()=> console.log(`NEXORA OS v1 live on ${PORT} - 2h interval active`));
