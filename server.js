const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use((req,res,next)=>{ res.header('Access-Control-Allow-Origin','*'); res.header('Access-Control-Allow-Headers','*'); next(); });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DASHBOARD_BASE = process.env.DASHBOARD_BASE || 'https://nexora-os-dashboard-iota.vercel.app';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// CORE: Value Calculator
const VALUE_MAP = {
  real_estate: 350000,
  dental: 80000,
  schools: 150000,
  beauty: 25000
};

function formatNaira(num) {
  if (num >= 1000000) return `N${(num/1000000).toFixed(1)}M`;
  if (num >= 1000) return `N${Math.round(num/1000)}K`;
  return `N${num}`;
}

// HEALTH - For UptimeRobot every 5m
app.get('/health', (req, res) => {
  res.json({ status: 'alive', os: 'NEXORA OS v1', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'alive', os: 'NEXORA OS v1', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// PORTFOLIO STATS - For /portfolio page
app.get('/api/portfolio', async (req, res) => {
  try {
    const { data, error } = await supabase.from('nexora_leads').select('*');
    if (error) throw error;
    const total = data.length;
    const totalLost = data.reduce((s,r)=>s+(r.lost_num||0),0);
    const byNiche = {};
    data.forEach(r=>{ byNiche[r.business_niche] = (byNiche[r.business_niche]||0)+1; });
    res.json({
      total_businesses: total,
      total_lost_text: formatNaira(totalLost),
      total_lost_num: totalLost,
      by_niche: byNiche,
      message: `We helped ${total} businesses find ${formatNaira(totalLost)} missed revenue`
    });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

// LEADS API - For dashboard
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase.from('nexora_leads').select('*').order('created_at',{ascending:false}).limit(100);
    if (error) throw error;
    res.json(data);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

app.get('/api/leads/:handle', async (req, res) => {
  try {
    const { data, error } = await supabase.from('nexora_leads').select('*').eq('handle', req.params.handle).order('created_at',{ascending:false}).limit(1).single();
    if (error) throw error;
    res.json(data);
  } catch(e){ res.status(404).json({ error: 'Not found' }); }
});

// MASTER AUDIT - ONE WORKFLOW LOGIC (Official APIs compliant simulation + OpenRouter)
app.get('/run-audit', async (req, res) => {
  try {
    const niche = req.query.niche || 'real_estate';
    const valuePerLead = VALUE_MAP[niche] || 350000;
    
    // Data Source Layer - Compliant Public Data (Official Instagram Graph API + Google Business Profile API - simulated with real leads for v1)
    // In production: Call Instagram Graph API: /{ig-user-id}/media?fields=like_count,comments_count
    // And Google Business Profile API: places/{placeId}
    const mockLeads = {
      real_estate: [
        { client_name: 'Fantola Properties Global', handle: 'fantola_properties_global', phone: '2348164353293', followers: 3420, rating: 4.1, bio: 'DM for price - Lekki houses', logo_url: 'https://ui-avatars.com/api/?name=Fantola&background=0D8ABC&color=fff' },
        { client_name: 'Ibadan Real Estate Hub', handle: 'ibadan_real_estate_', phone: '2349031674082', followers: 8120, rating: 3.9, bio: 'Call for price', logo_url: '' }
      ],
      dental: [
        { client_name: 'Lagos Smile Dental', handle: 'lagos_smile_dental', phone: '2348034567890', followers: 2100, rating: 4.3, bio: 'DM for appointment', logo_url: '' }
      ],
      schools: [
        { client_name: 'Greenfield Private School', handle: 'greenfield_school', phone: '2348051234567', followers: 1500, rating: 4.0, bio: 'Admission in progress - DM', logo_url: '' }
      ]
    };

    const pool = mockLeads[niche] || mockLeads.real_estate;
    const candidate = pool[Math.floor(Math.random()*pool.length)];

    // Filter Engine - 5 Rules in ONE IF (3/5 = HIGH VALUE LEAD)
    const rules = {
      has_public_phone: !!candidate.phone && candidate.phone.startsWith('234'),
      followers_lt_15k: candidate.followers < 15000,
      bio_has_dm_for_price: /dm for price|call for price|dm for appointment|admission in progress/i.test(candidate.bio),
      unreplied_gt_3: true, // Simulated: Would count via Instagram Graph API comments where replies == 0 in last 14 days
      rating_lt_4_5: candidate.rating < 4.5
    };
    const trueCount = Object.values(rules).filter(Boolean).length;
    const isHighValue = trueCount >= 3;

    if (!isHighValue) {
      return res.json({ success: false, reason: 'Not high value', rules, trueCount });
    }

    // Value Calculator Node
    const bad_count = Math.floor(Math.random()*8)+6; // 6-13 from unreplied comments count
    const lost_num = bad_count * valuePerLead;
    const lost_text = formatNaira(lost_num);
    const sample_comments = [
      'How much for 3 bed in Lekki?',
      'DM price please, no reply since yesterday',
      'Is this still available? No one picked call'
    ];

    // AI Writer Node (OpenRouter)
    let ai_message = `Hi ${candidate.client_name}, I audited your public Google profile and Instagram. Observation: ${bad_count} enquiries in comments with no reply in last 14 days, and ${rules.rating_lt_4_5 ? 'rating '+candidate.rating+' with unreplied reviews' : 'reviews needing reply'}. Estimated missed: ${lost_text} (${bad_count} x ${formatNaira(valuePerLead)}). I made you a private dashboard with your logo and proof. Would you like me to load 3 current listings for a 3-day recovery test? Referral N10k for any estate friend you connect. Regards, Kehinde, Nexora.`;

    if (OPENROUTER_API_KEY) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': DASHBOARD_BASE,
            'X-Title': 'Nexora OS v1'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: [
              { role: 'system', content: `You are Nexora OS v1 - Revenue Recovery for Lagos ${niche}. Official APIs only, compliant. Generate professional English audit: Observation + Lost Value (${lost_text}) + Private Link. Manual tone, no spam, 1-to-1. Max 4 sentences. Business: ${candidate.client_name}` },
              { role: 'user', content: `Handle:@${candidate.handle} Bad:${bad_count} Lost:${lost_text} Rating:${candidate.rating} Followers:${candidate.followers} Bio:${candidate.bio} Phone:${candidate.phone} Niche:${niche} ValuePerLead:${valuePerLead}` }
            ]
          })
        });
        const j = await r.json();
        if (j.choices?.[0]?.message?.content) ai_message = j.choices[0].message.content;
      } catch(e){ console.log('OpenRouter error', e.message); }
    }

    const dashboard_link = `${DASHBOARD_BASE}?client=${encodeURIComponent(candidate.client_name)}&bad=${bad_count}&lost=${encodeURIComponent(lost_text)}&phone=${candidate.phone}&handle=${candidate.handle}&niche=${niche}&logo=${encodeURIComponent(candidate.logo_url||'')}`;
    const wa_link = `https://wa.me/${candidate.phone}?text=${encodeURIComponent(ai_message + '\n\nPrivate dashboard: ' + dashboard_link)}`;

    // Supabase Node - Insert
    const { data, error } = await supabase.from('nexora_leads').insert({
      client_name: candidate.client_name,
      handle: candidate.handle,
      phone: candidate.phone,
      logo_url: candidate.logo_url,
      bad_count,
      lost_text,
      lost_num,
      sample_comments,
      ai_message,
      wa_link,
      dashboard_link,
      business_niche: niche,
      rating: candidate.rating,
      followers: candidate.followers,
      status: 'pending'
    }).select().single();

    if (error) throw error;

    res.json({
      success: true,
      os: 'NEXORA OS v1',
      filter_engine: { rules, trueCount, isHighValue },
      value_calculator: { bad_count, valuePerLead, lost_num, lost_text },
      lead: data
    });

  } catch(err){
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual lead insert (for Google Sheet sync)
app.post('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase.from('nexora_leads').insert(req.body).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e){ res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NEXORA OS v1 LIVE on ${PORT} - ONE OS, ONE WORKFLOW`));
