// Vercel Serverless Function — POST /api/read : 현장사진 AI 판독 (Claude) → 지식베이스 항목 선택
// GET /api/read : 상태 확인 {ok, model, key}
// 키 우선순위: Vercel 환경변수 ANTHROPIC_API_KEY → 요청 본문의 사용자 키(body.key)
const KB = require('./_kb.js');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const LANGS = ['ko', 'en', 'zh', 'vi', 'uz'];
// 안전모 미착용 판독 항목: ppe_fall(떨어짐), ppe_struck(물체에 맞음)
// 온톨로지 기반 판독: ① 개체 인식(클래스 6) → ② 관계 추출(트리플) → ③ 규칙 추론(R1~R4) → 지식베이스 항목
const ONTO = {
  cls: { worker: '작업자', ppe: '보호구', struct: '가설구조물', equip: '장비·인양물', loc: '작업장소', act: '작업활동' },
  rel: { locatedAt: '위치함', wears: '착용', lacks: '미착용', installed: '설치됨', missing: '미설치', over: '상부 통과', inRadius: '작업반경 안', performs: '수행함' }
};
const HIGH = /단부|개구부|비계|발판|고소|지붕|사다리|슬래브|거푸집|철골|데크|난간|높이|옥상|edge|scaffold|roof/i;
const BELOW = /하부|아래|밑|인양|below|under/i;
const HELMET = /안전모|헬멧|helmet|hard ?hat/i;
const RULE_WHY = {
  R1: { ko: '온톨로지 규칙 R1: 근로자가 높은 단부에 있고 안전난간이 설치되지 않음', en: 'Ontology rule R1: a worker is at a high edge with no guardrail', zh: '本体规则R1：工人位于高处边缘且未设置安全栏杆', vi: 'Quy tắc R1: công nhân ở mép cao, không có lan can', uz: "R1 qoidasi: ishchi baland chetda, to'siq o'rnatilmagan" },
  R2: { ko: '온톨로지 규칙 R2: 높은 곳의 근로자가 안전모를 쓰지 않음', en: 'Ontology rule R2: a worker at height is not wearing a helmet', zh: '本体规则R2：高处作业工人未戴安全帽', vi: 'Quy tắc R2: công nhân trên cao không đội mũ bảo hộ', uz: "R2 qoidasi: balandlikdagi ishchi dubulg'a kiymagan" },
  R3: { ko: '온톨로지 규칙 R3: 위쪽 작업·인양물 아래의 근로자가 안전모를 쓰지 않음', en: 'Ontology rule R3: a worker below overhead work or a load has no helmet', zh: '本体规则R3：上方作业或吊物下方的工人未戴安全帽', vi: 'Quy tắc R3: công nhân dưới vật cẩu không đội mũ', uz: "R3 qoidasi: yuk ostidagi ishchi dubulg'a kiymagan" },
  R4: { ko: '온톨로지 규칙 R4: 인양물이 근로자 위를 지나거나 근로자가 장비 작업반경 안에 있음', en: 'Ontology rule R4: a load passes over a worker or a worker is inside the machine radius', zh: '本体规则R4：吊物从工人上方经过或工人位于设备作业半径内', vi: 'Quy tắc R4: vật cẩu đi qua đầu công nhân hoặc công nhân trong bán kính máy', uz: "R4 qoidasi: yuk ishchi ustidan o'tadi yoki ishchi mashina radiusida" }
};

function kbList() {
  return KB.map(k => `${k.id} | ${k.type} | ${k.tags.join(',')} | ${k.title} | ${k.hint}`).join('\n');
}

const GLOSS400 = `떨어짐: 高处坠落 | Ngã từ trên cao | Balandlikdan yiqilish
깔림: 压倒 | Bị đè | Ezilgan
넘어짐: 跌倒 | Trượt ngã | Sirpanish yoki qoqilish
끼임: 挤压 | Bị kẹt người | Orada qisilib qolish
부딪힘: 碰撞 | Va chạm | Urilib ketish/Urilish
안전대: 安全带 | Dây đai an toàn | Xavfsizlik kamari
안전모: 安全帽 | Nón bảo hộ | Xavfsizlik shlemi
안전난간: 安全栏杆 | Lan can an toàn | Xavfsizlik panjarasi
작업발판: 作业踏板 | Sàn thao tác | Ish platformasi
비계: 脚手架 | Giàn giáo | Havoza
개구부: 开口 | Lỗ hở | Ochilish
덮개: 盖板 | Tấm chắn / Nắp che | Qopqoq
거푸집: 模板 | Cốp pha | Forma (qolip)
동바리: 支撑结构 | Cây chống tăng | (tayanch)
관리감독자: 管理监督员 | Giám sát viên | Nazoratchi
유도자: 引导员 | Người hướng dẫn | Spotter
고소작업대: 高空作业平台 | Sàn nâng người | Havoda ishlash platformasi
크레인: 起重机 | Cần cẩu | Kran
보호구: 护具 | Phương tiện bảo hộ | Himoya vositalari
위험성평가: 风险评估 | Đánh giá rủi ro | Xavfni baholash
중대재해: 重大伤亡事故 | Tai nạn lao động nghiêm trọng | Og‘ir baxtsiz hodisa
밀폐공간: 密闭空间 | Không gian kín | Cheklangan makon
굴착: 挖掘 | (đào) | Qazish
콘크리트 펌프카: 混凝土泵车 | Xe bơm bê tông | Beton nasosli avtomobil
근로자: 工人 | Người lao động | Ishchi`;

const SYSTEM = `당신은 한국 건설현장의 안전관리자(산업안전기사)입니다. 현장사진을 보고 사진에 실제로 보이는 유해·위험요인만 골라 아래 지식베이스(체크리스트) 항목 ID로 답합니다.
규칙:
- 사진에 근거가 있는 항목만 고릅니다(추측 금지). 보통 3~8개.
- x, y는 그 위험이 보이는 위치를 사진 전체 기준 백분율(0~100, 왼쪽 위가 0,0)로 적습니다.
- f(빈도·가능성)와 s(강도·중대성)는 KRAS 3×3 기준 1~3 정수로 적습니다.
- why는 사진에서 본 근거를 한 문장으로, ko(한국어)·en·zh(简体)·vi·uz(O'zbek lotin) 다섯 언어로 적습니다.
- scene은 사진 전체 상황과 가장 큰 위험을 1~2문장으로, proc은 추정 공정·작업명을 짧게, 다섯 언어로 적습니다.
- 안전모 착용 여부를 반드시 따로 판독합니다. 사진에 보이는 근로자를 한 명씩 보고 안전모를 썼는지 확인합니다(야구모자·두건·머리 수건만 쓴 경우는 미착용, 턱끈이 풀린 것이 보이면 why에 적음). 판단이 어려운 사람은 미착용으로 세지 않습니다.
- 안전모 미착용자가 있으면: 높은 곳·단부·비계·작업발판 위에서 일하는 사람이면 ppe_fall, 위쪽 작업이나 인양물·해체물 아래에 있는 사람이면 ppe_struck를 고릅니다(둘 다 해당하면 둘 다). 이 항목의 x, y는 그 근로자의 머리 위치입니다.
- helmet에는 workers(사진에 보이는 근로자 수), no_helmet(안전모 미착용자 수), note(누가 어디에서 쓰지 않았는지 한 문장, 다섯 언어)를 적습니다. 근로자가 보이지 않으면 workers는 0입니다.
- 판독은 온톨로지 순서로 합니다. ① 개체 인식: 사진에 보이는 개체를 클래스 worker(작업자)·ppe(보호구)·struct(가설구조물: 비계·작업발판·안전난간·개구부 덮개·거푸집·동바리·흙막이)·equip(장비·인양물: 크레인·굴착기·펌프카·인양물)·loc(작업장소: 단부·개구부·고소·굴착면·하부 통로)·act(작업활동: 공종) 중 하나로 정하고 id(W1, P1, S1, Q1, L1, A1…)와 한국어 이름 n, 위치 x·y(백분율)를 적습니다. loc에는 추정 높이 h(m, 모르면 0)를 적습니다.
- ② 관계 추출: 개체 사이 관계를 [주어 id, 관계, 목적어 id] 트리플로 적습니다. 관계는 locatedAt(위치함)·wears(착용)·lacks(미착용)·installed(설치됨)·missing(미설치)·over(인양물이 사람 위를 지남: [Q, over, W])·inRadius(작업반경 안: [W, inRadius, Q])·performs(수행함)만 씁니다. 보이지 않는 것을 추측하지 않습니다.
- ③ 규칙 추론: 트리플을 근거로 지식베이스 항목을 고르고, 각 항목의 ev에 근거가 된 개체 id를 적습니다. R1 높은 단부에 있는 작업자 ∧ 안전난간 missing → 떨어짐 항목, R2 안전모 lacks ∧ 높은 곳 → ppe_fall, R3 안전모 lacks ∧ 인양물 아래(over) → ppe_struck, R4 over 또는 inRadius → 물체에 맞음·깔림 항목.
- zh·vi·uz 문장의 안전 용어는 고용노동부·안전보건공단 '외국인 노동자를 위한 안전보건용어 400선'의 공식 용어를 씁니다(한국어: 中文 | Tiếng Việt | O'zbekcha, 괄호는 기존 용어 유지):
${GLOSS400}
- extra에는 지식베이스에 없지만 사진에서 보이는 위험을 한국어 한 줄씩 최대 3개 적습니다.
- 반드시 JSON 하나만 출력합니다. 다른 글은 쓰지 않습니다.
형식: {"onto":{"ents":[{"id":"W1","c":"worker","n":"","x":0,"y":0}],"rels":[["W1","locatedAt","L1"]]},"scene":{"ko":"","en":"","zh":"","vi":"","uz":""},"proc":{"ko":"","en":"","zh":"","vi":"","uz":""},"items":[{"id":"","x":0,"y":0,"f":1,"s":1,"ev":["W1"],"why":{"ko":"","en":"","zh":"","vi":"","uz":""}}],"helmet":{"workers":0,"no_helmet":0,"note":{"ko":"","en":"","zh":"","vi":"","uz":""}},"extra":[""]}

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

function cleanOnto(o) {
  o = o && typeof o === 'object' ? o : {};
  const ents = [], ids = new Set();
  (Array.isArray(o.ents) ? o.ents : []).slice(0, 40).forEach(e => {
    if (!e || typeof e.id !== 'string' || !ONTO.cls[e.c] || ids.has(e.id)) return;
    ids.add(e.id);
    ents.push({ id: e.id.slice(0, 8), c: e.c, n: String(e.n || ONTO.cls[e.c]).slice(0, 40), x: clamp(e.x, 0, 100, 50), y: clamp(e.y, 0, 100, 50), h: Math.max(0, Math.min(200, Number(e.h) || 0)) });
  });
  const rels = (Array.isArray(o.rels) ? o.rels : []).filter(r => Array.isArray(r) && r.length === 3 && ids.has(r[0]) && ids.has(r[2]) && ONTO.rel[r[1]]).slice(0, 60).map(r => [r[0], r[1], r[2]]);
  return { ents, rels };
}

// ③ 규칙 추론(서버): 모델이 빠뜨린 항목을 온톨로지 트리플로 보완
function applyRules(out) {
  const E = {}; out.onto.ents.forEach(e => { E[e.id] = e; });
  const has = (s, r, o) => out.onto.rels.some(x => (s == null || x[0] === s) && x[1] === r && (o == null || x[2] === o));
  const locsOf = w => out.onto.rels.filter(x => x[0] === w && x[1] === 'locatedAt').map(x => E[x[2]]).filter(Boolean);
  const high = w => locsOf(w).some(l => (l.h || 0) >= 2 || HIGH.test(l.n));
  const below = w => has(null, 'over', w) || locsOf(w).some(l => BELOW.test(l.n));
  const noHelmet = w => out.onto.rels.some(x => x[0] === w && x[1] === 'lacks' && E[x[2]] && HELMET.test(E[x[2]].n));
  const fired = [];
  const add = (id, w, rule, f, s) => {
    if (out.items.some(it => it.id === id)) return;
    const e = E[w] || {}; out.items.push({ id, x: e.x || 50, y: e.y || 50, f, s, ev: [w], why: RULE_WHY[rule], rule });
    fired.push(rule + ':' + id);
  };
  const workers = out.onto.ents.filter(e => e.c === 'worker');
  workers.forEach(w => {
    const railMissing = locsOf(w.id).some(l => out.onto.rels.some(x => x[0] === l.id && x[1] === 'missing' && E[x[2]] && /난간|guard/i.test(E[x[2]].n)));
    if (high(w.id) && railMissing) add(out.items.some(it => it.id === 'p2') ? 'p2' : 'fall1', w.id, 'R1', 2, 3);
    if (noHelmet(w.id) && high(w.id)) add('ppe_fall', w.id, 'R2', 2, 3);
    if (noHelmet(w.id) && below(w.id)) add('ppe_struck', w.id, 'R3', 2, 3);
    if (has(null, 'over', w.id)) add('struck0', w.id, 'R4', 2, 3);
    if (has(w.id, 'inRadius', null)) add('crush0', w.id, 'R4', 2, 3);
  });
  if (workers.length) {
    const nh = workers.filter(w => noHelmet(w.id)).length;
    out.helmet.workers = Math.max(out.helmet.workers, workers.length);
    out.helmet.no_helmet = Math.min(out.helmet.workers, Math.max(out.helmet.no_helmet, nh));
  }
  out.rules = fired;
  out.items = out.items.slice(0, 14);
  return out;
}

function clean(j) {
  const ids = new Set(KB.map(k => k.id));
  const seen = new Set();
  const items = (Array.isArray(j.items) ? j.items : []).filter(it => it && ids.has(it.id) && !seen.has(it.id) && seen.add(it.id)).slice(0, 12)
    .map(it => ({ id: it.id, x: clamp(it.x, 0, 100, 50), y: clamp(it.y, 0, 100, 50), f: clamp(it.f, 1, 3, 2), s: clamp(it.s, 1, 3, 2), ev: (Array.isArray(it.ev) ? it.ev : []).filter(v => typeof v === 'string').slice(0, 6), why: ml(it.why) }));
  const h = j.helmet || {}; const workers = clamp(h.workers, 0, 50, 0);
  const helmet = { workers, no_helmet: Math.min(workers, clamp(h.no_helmet, 0, 50, 0)), note: ml(h.note) };
  return { onto: cleanOnto(j.onto), scene: ml(j.scene), proc: ml(j.proc), items, helmet, extra: (Array.isArray(j.extra) ? j.extra : []).filter(x => typeof x === 'string').slice(0, 3).map(x => x.slice(0, 200)) };
}

module.exports = async (req, res) => {
  const envKey = process.env.ANTHROPIC_API_KEY || '';
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'safety read', model: MODEL, key: !!envKey, items: KB.length, ontology: { classes: Object.keys(ONTO.cls).length, relations: Object.keys(ONTO.rel).length, rules: 4 } });
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
        model: MODEL, max_tokens: 6000, system: SYSTEM,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
          { type: 'text', text: '이 건설현장 사진을 판독해 JSON으로 답하세요. 근로자별 안전모 착용 여부도 꼭 확인하세요.' + (body.site ? ' 참고 현장정보: ' + String(body.site).slice(0, 200) : '') }
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
    try { out = applyRules(clean(pickJSON(text))); } catch (e) { return res.status(502).json({ error: 'parse', detail: text.slice(0, 300) }); }
    return res.status(200).json({ ok: true, model: j.model || MODEL, ...out });
  } catch (e) {
    clearTimeout(timer);
    return res.status(504).json({ error: e.name === 'AbortError' ? 'timeout' : 'network' });
  }
};

// 단위 시험용: 모델 응답(JSON) → 정리 + 온톨로지 규칙 추론
module.exports._test = j => applyRules(clean(j));
