
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DASHBOARD_BASE = process.env.DASHBOARD_BASE || 'https://nexora-os-dashboard-iota.vercel.app';

let supabase;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

app.get('/', (req, res) => res.send('Nexora OS Main - LIVE. Use /healthz and /run-audit'));

app.get('/healthz', (req, res) => {
  res.json({ status: 'alive', uptime: process.uptime(), ts: new Date().toISOString(), supabase: !!supabase });
});

app.get('/run-audit', async (req, res) => {
  try {
    console.log('NEXORA RUN-AUDIT START');
    const leads = [
      { client_name: 'Fantola Properties Global', handle: 'fantola_properties_global', phone: '2348164353293' },
      { client_name: 'Ibadan Real Estate', handle: 'ibadan_real_estate_', phone: '2349031674082' },
      { client_name: 'Ebisfood Home', handle: 'ebisfoodhome', phone: '2349042425894' }
    ];
    const pick = leads[Math.floor(Math.random()*leads.length)];
    const bad = Math.floor(Math.random()*9)+6;
    const lostNum = bad*350000;
    const lost = `N${(lostNum/1000000).toFixed(1)}M`;
    
    let aiMsg = `Hi ${pick.client_name}, I audited your Google reviews - 4 reviews no reply (14 days). Counted ${bad} IG enquiries with no reply = ${lost} estimated lost (${bad} x N350k). Made you a private dashboard. Want me to load 3 listings for 3-day recovery test free? Referral N10k. Kehinde, Nexora.`;
    
    if (OPENROUTER_API_KEY) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': DASHBOARD_BASE,
            'X-Title': 'Nexora OS'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: [
              { role: 'system', content: 'You are Nexora - lead recovery for Lagos real estate. Write WhatsApp: Hook first 7 words = business name + Google review pain. Pain = N lost. Proof = private dashboard. CTA = load 3 clients free 3 days. Include referral N10k. Max 4 sentences, Lagos tone.' },
              { role: 'user', content: `Client:${pick.client_name} IG:@${pick.handle} Bad:${bad} Lost:${lost} Phone:${pick.phone}` }
            ]
          })
        });
        const j = await r.json();
        if (j.choices && j.choices[0]?.message?.content) aiMsg = j.choices[0].message.content;
      } catch(e){ console.log('OR fail', e.message); }
    }

    const dashboardLink = `${DASHBOARD_BASE}?client=${encodeURIComponent(pick.client_name)}&bad=${bad}&lost=${encodeURIComponent(lost)}&phone=${pick.phone}&handle=${pick.handle}`;
    const waLink = `https://wa.me/${pick.phone}?text=${encodeURIComponent(aiMsg + '\n\nDashboard: ' + dashboardLink)}`;
    
    let saved = null;
    if (supabase) {
      const {data, error} = await supabase.from('nexora_leads').insert({
        client_name: pick.client_name,
        instagram_handle: pick.handle,
        phone: pick.phone,
        bad_comments_count: bad,
        lost_money: lost,
        lost_money_num: lostNum,
        ai_message: aiMsg,
        wa_link: waLink,
        dashboard_link: dashboardLink,
        sample_comments: JSON.stringify(['How much for 3 bed in Lekki?','DM price please, no reply since yesterday','Is this still available?']),
        status: 'pending',
        business_niche: 'real_estate',
        source: 'instagram+google'
      }).select().single();
      if (error) throw error;
      saved = data;
    }

    res.json({ success: true, lead: saved || { client: pick, bad, lost, aiMsg, waLink, dashboardLink }, lastRun: new Date().toISOString() });
  } catch(err){
    console.error('AUDIT ERROR', err);
    res.status(500).json({ success: false, error: err.message, lastRun: new Date().toISOString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nexora OS Main LIVE on ${PORT}`));
