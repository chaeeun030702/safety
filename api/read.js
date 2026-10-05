// Vercel Serverless Function — POST /api/read : 현장사진 AI 판독 (Claude) → 지식베이스 항목 선택
// GET /api/read : 상태 확인 {ok, model, key}
// 키 우선순위: Vercel 환경변수 ANTHROPIC_API_KEY → 요청 본문의 사용자 키(body.key)
const KB = require('./_kb.js');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const LANGS = ['ko', 'en', 'zh', 'vi', 'uz'];

function kbList() {
  return KB.map(k => `${k.id} | ${k.type} | ${k.tags.join(',')} | ${k.title} | ${k.hint}`).join('\n');
}

const SYSTEM = `당신은 한국 건설현장의 안전관리자(산업안전기사)입니다. 현장사진을 보고 사진에 실제로 보이는 유해·위험요인만 골라 아래 지식베이스(체크리스트) 항목 ID로 답합니다.
규칙:
- 사진에 근거가 있는 항목만 고릅니다(추측 금지). 보통 3~8개.
- x, y는 그 위험이 보이는 위치를 사진 전체 기준 백분율(0~100, 왼쪽 위가 0,0)로 적습니다.
- f(빈도·가능성)와 s(강도·중대성)는 KRAS 3×3 기준 1~3 정수로 적습니다.
- why는 사진에서 본 근거를 한 문장으로, ko(한국어)·en·zh(简体)·vi·uz(O'zbek lotin) 다섯 언어로 적습니다.
- scene은 사진 전체 상황과 가장 큰 위험을 1~2문장으로, proc은 추정 공정·작업명을 짧게, 다섯 언어로 적습니다.
- extra에는 지식베이스에 없지만 사진에서 보이는 위험을 한국어 한 줄씩 최대 3개 적습니다.
- 반드시 JSON 하나만 출력합니다. 다른 글은 쓰지 않습니다.
형식: {"scene":{"ko":"","en":"","zh":"","vi":"","uz":""},"proc":{"ko":"","en":"","zh":"","vi":"","uz":""},"items":[{"id":"","x":0,"y":0,"f":1,"s":1,"why":{"ko":"","en":"","zh":"","vi":"","uz":""}}],"extra":[""]}

지식베이스 (id | 재해유형 | 공종태그 | 항목 | 판단 단서):
${kbList()}`;

function pickJSON(t) {
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('no_json');
  return JSON.parse(t.slice(a, b + 1));
}
const clamp = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d; };
function ml(o) {
  const r = {};
  LANGS.forEach(l => { r[l] = (o && typeof o === 'object' && typeof o[l] === 'string') ? o[l].slice(0, 400) : (l === 'ko' && typeof o === 'string' ? o.slice(0, 400) : ''); });
  return r;
}

function clean(j) {
  const ids = new Set(KB.map(k => k.id));
  const seen = new Set();
  const items = (Array.isArray(j.items) ? j.items : []).filter(it => it && ids.has(it.id) && !seen.has(it.id) && seen.add(it.id)).slice(0, 12)
    .map(it => ({ id: it.id, x: clamp(it.x, 0, 100, 50), y: clamp(it.y, 0, 100, 50), f: clamp(it.f, 1, 3, 2), s: clamp(it.s, 1, 3, 2), why: ml(it.why) }));
  return { scene: ml(j.scene), proc: ml(j.proc), items, extra: (Array.isArray(j.extra) ? j.extra : []).filter(x => typeof x === 'string').slice(0, 3).map(x => x.slice(0, 200)) };
}

module.exports = async (req, res) => {
  const envKey = process.env.ANTHROPIC_API_KEY || '';
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'safety read', model: MODEL, key: !!envKey, items: KB.length });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const key = envKey || (typeof body.key === 'string' ? body.key.trim() : '');
  if (!key) return res.status(401).json({ error: 'no_key' });
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(body.image || '');
  if (!m) return res.status(400).json({ error: 'bad_image' });
  if (m[2].length > 4200000) return res.status(413).json({ error: 'too_large' });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 58000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, max_tokens: 4000, system: SYSTEM,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
          { type: 'text', text: '이 건설현장 사진을 판독해 JSON으로 답하세요.' + (body.site ? ' 참고 현장정보: ' + String(body.site).slice(0, 200) : '') }
        ] }]
      })
    });
    clearTimeout(timer);
    if (!r.ok) {
      const t = await r.text();
      const code = r.status === 401 || r.status === 403 ? 'bad_key' : 'api_error';
      return res.status(r.status === 401 || r.status === 403 ? 401 : 502).json({ error: code, status: r.status, detail: t.slice(0, 300) });
    }
    const j = await r.json();
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    let out;
    try { out = clean(pickJSON(text)); } catch (e) { return res.status(502).json({ error: 'parse', detail: text.slice(0, 300) }); }
    return res.status(200).json({ ok: true, model: j.model || MODEL, ...out });
  } catch (e) {
    clearTimeout(timer);
    return res.status(504).json({ error: e.name === 'AbortError' ? 'timeout' : 'network' });
  }
};
