// ─────────────────────────────────────────────────────────────────────
//  /api/rowsvg — 안전포스터 ‘위험·반드시’ 행 그림을 Claude가 자동으로 그린다 (Vercel Serverless, Node 20)
//
//  입력  POST { items:[{ t: 행 제목(한국어), c: 설명, en?: 영문 제목, ok: true|false }], key? }
//        key = 화면 ⑧에서 사용자가 저장한 Anthropic API 키(선택). 없으면 서버 환경변수 ANTHROPIC_API_KEY.
//  출력  { ok, model, svgs:[ '<svg …>…</svg>', … ] }  |  { ok:false, reason }
//
//  사진(실사) 대신 벡터 삽화(SVG)를 만든다. 그림 안에 글자는 넣지 않고, 위험 행은 연분홍, 준수 행은 연초록 배경을 쓴다.
//  돌려받은 SVG에서 script·이벤트 속성·외부 링크를 지운 뒤 브라우저로 보낸다.
// ─────────────────────────────────────────────────────────────────────
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID || '';

function headers(key) {
  var h = { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
  if (WORKSPACE) h['anthropic-workspace-id'] = WORKSPACE;
  return h;
}

function clean(svg) {
  svg = String(svg || '').trim();
  var m = /<svg[\s\S]*<\/svg>/i.exec(svg);
  if (!m) return null;
  svg = m[0]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<(image|use|a)\b[^>]*>(<\/\1>)?/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/(xlink:)?href\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/<text[\s\S]*?<\/text>/gi, '');
  if (!/viewBox/.test(svg)) svg = svg.replace(/<svg/i, '<svg viewBox="0 0 160 120"');
  svg = svg.replace(/<svg([^>]*)>/i, function (all, attrs) {
    attrs = attrs.replace(/\s(width|height|preserveAspectRatio)\s*=\s*("[^"]*"|'[^']*')/gi, '');
    return '<svg' + attrs + ' preserveAspectRatio="xMidYMid slice">';
  });
  return svg.length > 20000 ? null : svg;
}

const SYSTEM = [
  '너는 건설현장 다국어 안전포스터의 삽화가다. 주어진 행마다 SVG 삽화 한 장을 그린다.',
  '규칙:',
  '- 각 SVG는 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"> 로 시작한다.',
  '- 첫 요소로 전체 배경 사각형을 깐다: ok=false(위험)이면 #fdecea, ok=true(준수)이면 #e8f5ea.',
  '- 평면(flat) 일러스트 스타일. 둥근 모서리, 굵은 외곽선(#333, 1.5~2.5), 선명한 색. 그라디언트·필터·이미지·텍스트·숫자 금지.',
  '- 장면은 행 제목이 말하는 상황 하나만 크게 보여 준다. 근로자는 흰 안전모를 쓴 단순한 사람 형태(머리·몸통·팔다리)로 그리고, 얼굴 표정은 그리지 않는다.',
  '- 건설 요소(거푸집, 비계, 안전난간, 개구부, 크레인 훅과 인양물, 고소작업대, 승강로, 분전반, 케이블, 안전대·구명줄 등)를 알아볼 수 있게 그린다.',
  '- 위험 행은 위험 지점에 노란 번개나 빨간 느낌표 대신 상황 자체(떨어지는 방향의 점선 화살표, 아래가 빈 공간 등)로 위험을 드러낸다. 준수 행은 올바른 설비·보호구가 갖춰진 모습을 보여 준다.',
  '- 오른쪽 위 모서리(x 125~160, y 0~35)는 비워 둔다(배지 자리).',
  '- 한 장당 3500자 이내.',
  '출력은 JSON 하나만: {"svgs":["<svg …>…</svg>", …]} — 입력 순서와 같은 개수.',
].join('\n');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, model: MODEL, key: !!process.env.ANTHROPIC_API_KEY });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method' });
  var body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  var clientKey = typeof body.key === 'string' ? body.key.trim() : '';
  if (clientKey && !/^sk-ant-[A-Za-z0-9_\-]{20,}$/.test(clientKey)) return res.status(200).json({ ok: false, reason: 'bad_key' });
  var key = clientKey || process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ ok: false, reason: 'no_key' });
  var items = Array.isArray(body.items) ? body.items.slice(0, 6) : [];
  if (!items.length) return res.status(400).json({ ok: false, reason: 'items' });
  var list = items.map(function (x, i) {
    return (i + 1) + '. ok=' + (x.ok ? 'true(반드시 지켜야 할 올바른 작업)' : 'false(이렇게 하면 위험한 상황)') +
      ' | 제목: ' + String(x.t || '').slice(0, 120) + (x.en ? ' (' + String(x.en).slice(0, 160) + ')' : '') +
      ' | 설명: ' + String(x.c || '').slice(0, 200);
  }).join('\n');
  var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 58000);
  try {
    var r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctrl.signal, headers: headers(key),
      body: JSON.stringify({ model: MODEL, max_tokens: 24000, output_config: { effort: 'low' }, system: SYSTEM,
        messages: [{ role: 'user', content: '다음 ' + items.length + '개 행의 삽화를 그려라.\n' + list + '\nJSON만 출력하라.' }] }),
    });
    clearTimeout(timer);
    var data = await r.json();
    if (!r.ok) return res.status(200).json({ ok: false, reason: r.status === 401 ? 'bad_key' : 'api_' + r.status, detail: data && data.error && data.error.message });
    var txt = (data.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
    var j = null, m = /\{[\s\S]*\}/.exec(txt);
    try { j = m && JSON.parse(m[0]); } catch (e) { j = null; }
    var svgs = (j && Array.isArray(j.svgs) ? j.svgs : []).map(clean);
    if (!svgs.some(Boolean)) return res.status(200).json({ ok: false, reason: data.stop_reason === 'max_tokens' ? 'max_tokens' : 'parse' });
    return res.status(200).json({ ok: true, model: MODEL, svgs: svgs });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: e.name === 'AbortError' ? 'timeout' : 'error' });
  }
};
