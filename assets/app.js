/* 건설현장 안전문서 자동생성 플랫폼 — 충북대학교 안전공학과 이채은 */

var LANG='ko', ED=false;
var ST={photo:null,sel:[],mk:{},f:{},s:{},active:null,preset:false,tags:[]};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function ko(k){return (I18N[k]&&I18N[k].ko)||k;}
function T(k){return '<span class="ko">'+esc(ko(k))+'</span><span class="tr b" data-i="'+k+'"></span>';}
function TI(k){return '<span class="ko">'+esc(ko(k))+'</span><span class="tr" data-i="'+k+'"></span>';}
function rkc(v){return v>=9?'#C0392B':(v>=6?'#ED7D31':(v>=3?'#E1A100':'#2E8B57'));}
function byId(id){for(var i=0;i<KB.length;i++)if(KB[i].id===id)return KB[i];}
function F(it){return ST.f[it.id]||it.f;} function S(it){return ST.s[it.id]||it.s;}
var NUM='❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴';
/* ---------- panel ---------- */
function renderPanel(){
 var ch='';for(var t in TAGS){ch+='<span class="chip'+(ST.tags.indexOf(t)>=0?' on':'')+'" onclick="togTag(\''+t+'\')">'+esc(TAGS[t])+'</span>';}
 document.getElementById('chips').innerHTML=ch;
 var groups={fall:[],crush:[],struck:[],other:[],mgmt:[]};KB.forEach(function(it){groups[it.type].push(it);});
 var h='';for(var g in groups){if(!groups[g].length)continue;h+='<div class="kbgrp"><h4>'+esc(TYPES[g])+'</h4>';
  groups[g].forEach(function(it){var c=ST.sel.indexOf(it.id)>=0;var rec=it.tags.some(function(t){return ST.tags.indexOf(t)>=0;});var v=F(it)*S(it);
   h+='<label class="kbi'+(c?' chk':'')+(rec&&!c?' rec':'')+'"><input type="checkbox" '+(c?'checked':'')+' onchange="togItem(\''+it.id+'\',this.checked)"> <span class="rk" style="background:'+rkc(v)+'">'+v+'</span> '+esc(ko(it.title))+(it.p1?' <small style="color:#888">[사진1]</small>':'')+
   (c?' <span class="pin'+(ST.active===it.id?' act':'')+'" onclick="event.preventDefault();pinMode(\''+it.id+'\')">📍 위치</span>':'')+'</label>';});
  h+='</div>';}
 document.getElementById('kb').innerHTML=h;}
function togTag(t){var i=ST.tags.indexOf(t);if(i>=0)ST.tags.splice(i,1);else ST.tags.push(t);
 KB.forEach(function(it){if(ST.tags.indexOf(t)>=0&&it.tags.indexOf(t)>=0&&ST.sel.indexOf(it.id)<0&&it.tags.length&&!it.p1)ST.sel.push(it.id);});renderPanel();renderOut();}
function togItem(id,on){var i=ST.sel.indexOf(id);if(on&&i<0)ST.sel.push(id);if(!on&&i>=0)ST.sel.splice(i,1);renderPanel();renderOut();}
function pinMode(id){ST.active=(ST.active===id?null:id);renderPanel();var w=document.querySelector('.photowrap');if(w)w.classList.toggle('pinning',!!ST.active);}
function onPhoto(inp){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){ST.photo=r.result;ST.preset=false;document.getElementById('upPrev').src=r.result;renderOut();};r.readAsDataURL(f);}
function loadPreset(){ST.photo=SITE;ST.preset=true;ST.sel=KB.filter(function(x){return x.p1;}).map(function(x){return x.id;});ST.mk={};
 KB.forEach(function(x){if(x.p1)ST.mk[x.id]=x.mk;});ST.tags=['formwork','edge','scaffold'];document.getElementById('upPrev').src=SITE;renderPanel();renderOut();}
function clearAll(){ST.sel=[];ST.mk={};ST.tags=[];ST.preset=false;renderPanel();renderOut();}
/* ---------- output ---------- */
function sel(cls,v,id){var L=cls==='f'?{3:'상(3)',2:'중(2)',1:'하(1)'}:{3:'대(3)',2:'중(2)',1:'소(1)'};var o='';[3,2,1].forEach(function(n){o+='<option value="'+n+'"'+(n==v?' selected':'')+'>'+L[n]+'</option>';});
 return '<select class="'+cls+'" onchange="chg(this,\''+id+'\',\''+cls+'\')">'+o+'</select>';}
function chg(s,id,cls){ST[cls][id]=+s.value;var tr=s.closest('tr');var ss=tr.querySelectorAll('select');var v=ss[0].value*ss[1].value;var r=tr.querySelector('[data-r]');r.textContent=v;r.style.background=rkc(v);
 var b=document.querySelector('[data-badge="'+id+'"]');if(b){b.textContent='위험성 '+v;b.style.background=rkc(v);b.closest('.hc').style.borderLeftColor=rkc(v);}renderPanel();kpis();}
function row(it,i){var k=it.k;var v=F(it)*S(it);var ms='';for(var j=0;j<4;j++){ms+='<div class="mi">'+'①②③④'[j]+' '+T(k+'_m'+j)+'</div>';}
 return '<tr><td class="c">'+(i+1)+'</td><td class="work"><b>'+NUM[i]+' </b>'+T(k+'_work')+'</td><td class="c">'+T('cls_'+it.cls)+'</td><td class="cause">'+T(k+'_cause')+'</td><td class="desc">'+T(k+'_desc')+'</td><td class="law">'+T(k+'_law')+'</td><td>'+T(k+'_state')+'</td>'+
  '<td class="c">'+sel('f',F(it),it.id)+'</td><td class="c">'+sel('s',S(it),it.id)+'</td><td class="c rk" data-r style="background:'+rkc(v)+'">'+v+'</td><td class="meas">'+ms+'</td><td class="c">'+T('c_'+it.when)+'</td><td class="c"><span class="ed">20__. __. __</span></td><td class="c">'+T(k+'_who')+'</td></tr>';}
function foot(){return '<div class="ft"><span>'+esc(FOOT)+'</span><span>4단계 현장사진 위험성평가 (지식베이스 자동생성) | KRAS 3×3 | <span class="pg"></span> / <span class="tot"></span> | 2026. 10.</span></div>';}
function head(t){return '<div class="ttl"><span class="badge" style="background:#1F4E79">4단계</span><div class="cbnu">충북대학교 안전공학과<br>Chungbuk National Univ.</div><h1>'+t+'</h1><div class="tsub">'+T('u_sub')+'</div></div>';}
function kpis(){var items=ST.sel.map(byId);var mx=0,n9=0,n6=0;items.forEach(function(it){var v=F(it)*S(it);mx=Math.max(mx,v);if(v>=9)n9++;else if(v>=6)n6++;});
 var e=document.getElementById('kpi4');if(e)e.innerHTML='<div><b>'+items.length+'</b>'+T('u_count')+'</div><div><b>'+n9+'</b>'+T('u_high')+'</div><div><b>'+n6+'</b>'+T('u_mid')+'</div>';
 var m=document.getElementById('vmax');if(m){m.textContent=mx;m.style.color=rkc(mx);}}
function verdictHTML(items){var mx=0;items.forEach(function(it){mx=Math.max(mx,F(it)*S(it));});var lv=mx>=9?4:mx>=6?3:mx>=3?2:1;
 var body=ST.preset?T('p1meta_verdict'):T('u_auto');
 return '<div class="verdict"><span class="vt">■ '+TI('u_verdict')+' : '+TI('u_maxrisk')+' <span id="vmax">'+mx+'</span> — '+TI('c_lv'+lv)+' · '+TI('c_mg'+lv)+'</span>'+body+'</div>';}
function overview(){var items=ST.sel.map(byId);var mks='';items.forEach(function(it,i){var p=ST.mk[it.id]||[12+(i%4)*25,12+Math.floor(i/4)*22];mks+='<span class="mk" style="left:'+p[0]+'%;top:'+p[1]+'%">'+(i+1)+'</span>';});
 var cards='';items.forEach(function(it,i){var v=F(it)*S(it);cards+='<div class="hc" style="border-left-color:'+rkc(v)+'"><div class="hh"><span class="hn">'+(i+1)+'</span><span class="ht">'+T(it.title)+'</span><span class="hb" data-badge="'+it.id+'" style="background:'+rkc(v)+'">위험성 '+v+'</span></div><div class="hd">'+T(it.k+'_cause')+'</div></div>';});
 var ty={};items.forEach(function(it){if(CASES[it.type])ty[it.type]=(ty[it.type]||0)+F(it)*S(it);});var tl=Object.keys(ty).sort(function(a,b){return ty[b]-ty[a];});var cs='';var n=0;
 tl.forEach(function(t){CASES[t].forEach(function(c,j){if(n<4&&(j<2||tl.length===1)){cs+='<tr><td style="width:13mm;text-align:center">'+c.d+'</td><td style="width:24mm">'+T('type_'+t)+'</td><td style="width:30mm">'+T(c.w)+'</td><td>'+T(c.s)+'</td></tr>';n++;}});});
 var img=ST.photo?'<img src="'+ST.photo+'" alt="현장사진">':'<div class="empty">사진을 올려 주세요</div>';
 var anno=ST.preset?'<span class="anno">'+TI('p1meta_anno')+'</span>':'';
 return '<div class="sheet">'+head(esc(ko('u_ttl')))+'<div class="body"><div class="p1grid"><div class="pcol"><div class="photowrap" onclick="placeMk(event)">'+img+mks+anno+'</div><div class="hint" style="font-size:6.5pt">'+T('u_photo')+(ST.preset?' — '+esc(ko('p1meta_site')):'')+'</div></div>'+
  '<div class="rcol">'+verdictHTML(items)+'<div class="kp4" id="kpi4"></div><div class="listhd">'+TI('u_list')+' '+items.length+'</div><div class="hgrid2">'+cards+'</div>'+(cs?'<div class="listhd">'+TI('u_cases')+'</div><table class="cs">'+cs+'</table>':'')+'</div></div></div>'+foot()+'</div>';}
function placeMk(ev){if(!ST.active)return;var w=ev.currentTarget.getBoundingClientRect();ST.mk[ST.active]=[Math.round(100*(ev.clientX-w.left)/w.width),Math.round(100*(ev.clientY-w.top)/w.height)];ST.active=null;renderPanel();renderOut();}
function metaHTML(){var site=ST.preset?TI('p1meta_site'):'<span class="ed">○○ 건설현장</span>';var proc=ST.preset?TI('p1meta_proc'):'<span class="ed">공정명을 입력하세요</span>';
 return '<table class="meta"><tr><th>'+T('c_m_site')+'</th><td>'+site+'</td><th>'+T('c_m_date')+'</th><td><span class="ed">2026. __. __</span></td><th>'+T('c_m_target')+'</th><td>'+T('c_v_site')+'</td></tr>'+
 '<tr><th>'+T('c_m_proc')+'</th><td>'+proc+'</td><th>'+T('c_m_team')+'</th><td>'+T('c_v_team')+'</td><th>'+T('c_m_basis')+'</th><td>'+T('c_v_basis')+'</td></tr>'+
 '<tr><th>'+T('c_m_by')+'</th><td>'+T('c_v_by')+'</td><th>'+T('c_m_adv')+'</th><td>'+T('c_v_adv')+'</td><th>'+T('c_lg_r')+'</th><td><span class="ko">KRAS 3×3 (빈도 × 강도)</span></td></tr></table>';}
function over(b){return b.scrollHeight>b.clientHeight;}
function renderOut(){var out=document.getElementById('out');var items=ST.sel.map(byId);
 if(!items.length){out.innerHTML='<div class="sheet"><div class="body"><div class="empty">왼쪽 체크리스트에서 사진에 보이는 위험요인을 선택하면 위험 설명과 위험성평가표가 자동으로 만들어집니다.</div></div></div>';return;}
 out.innerHTML=overview();out.insertAdjacentHTML('beforeend',ragSheet());var n=0;
 function newSheet(){var d=document.createElement('div');d.className='sheet';d.innerHTML=head(esc(ko('u_ttl2'))+(n?' (계속)':''))+'<div class="body"></div>'+foot();out.appendChild(d);n++;return d.querySelector('.body');}
 function newTable(b){var t=document.createElement('table');t.className='ra';t.innerHTML=THEAD+'<tbody></tbody>';b.appendChild(t);return t.querySelector('tbody');}
 var body=newSheet();body.insertAdjacentHTML('beforeend',metaHTML());var tb=newTable(body);
 fillTr(out);
 items.forEach(function(it,i){var tmp=document.createElement('tbody');tmp.innerHTML=row(it,i);var r=tmp.firstChild;fillTr(r);tb.appendChild(r);
  if(over(body)&&tb.children.length>1){tb.removeChild(r);body=newSheet();fillTr(body.parentNode);tb=newTable(body);tb.appendChild(r);}});
 [LAWNOTE+EST,SHARE].forEach(function(hh){var d=document.createElement('div');d.innerHTML=hh;fillTr(d);body.appendChild(d);if(over(body)){body.removeChild(d);body=newSheet();fillTr(body.parentNode);body.appendChild(d);}});
 fillTr(out);var all=out.querySelectorAll('.sheet');all.forEach(function(s,i){var p=s.querySelector('.pg'),t=s.querySelector('.tot');if(p)p.textContent=i+1;if(t)t.textContent=all.length;});
 kpis();fitOv();fitRag();if(ST.active){var w=document.querySelector('.photowrap');if(w)w.classList.add('pinning');}if(ED)setEd(true);onChange();}
function fitOv(){var b=document.querySelector('#out .sheet .body');if(!b)return;var o=b.querySelector('.p1grid');var lv=['f1','f2','f3','f4','f5'];lv.forEach(function(c){o.classList.remove(c);});
 for(var i=0;i<lv.length&&over(b);i++)o.classList.add(lv[i]);}
function fillTr(root){root.querySelectorAll('.tr').forEach(function(e){var d=I18N[e.getAttribute('data-i')];e.textContent=(LANG==='ko'||!d)?'':(d[LANG]||'');e.style.display=(LANG==='ko'||!d||!d[LANG])?'none':'';});}
function setLang(l){LANG=l;document.getElementById('lsel').value=l;renderOut();}
function setEd(on){ED=on;document.body.classList.toggle('edit',on);document.querySelectorAll('#out .ko,#out .tr,#out .ed,#out .meta td').forEach(function(c){c.contentEditable=on;});
 var b=document.getElementById('eb');b.classList.toggle('on',on);b.textContent=on?'✓ 편집 중 (끝내려면 다시 클릭)':'✏️ 편집 모드';}
/* ---------- poster ---------- */
function makePoster(){var items=ST.sel.map(byId);if(!items.length){alert('위험요인을 먼저 선택하세요.');return;}
 var sc={fall:0,crush:0,struck:0};items.forEach(function(it){if(sc[it.type]!==undefined)sc[it.type]=Math.max(sc[it.type],F(it)*S(it)*10+1);});
 var t=Object.keys(sc).sort(function(a,b){return sc[b]-sc[a];})[0];
 var bad=ST.photo?'<img src="'+ST.photo+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><span style="position:absolute;left:6px;top:6px;background:rgba(192,57,43,.9);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">현장사진 · Site photo</span>':'';
 var h=PTPL[t].replace('@@BAD@@',bad);var f=document.getElementById('posterBox');f.style.display='block';f.srcdoc=h;f.scrollIntoView({behavior:'smooth'});}


/* ================= RAG ================= */
var SRCC={S1:'#7B3F99',S2:'#1F4E79',S3:'#2E8B57'};
function ragQuery(){var q={};ST.sel.map(byId).forEach(function(it){var w=F(it)*S(it)/9;it.tags.forEach(function(t){q[t]=(q[t]||0)+w;});q['T_'+it.type]=(q['T_'+it.type]||0)+0.8*w;});return q;}
function ragSearch(){var q=ragQuery(),qn=0;for(var x in q)qn+=q[x]*q[x];qn=Math.sqrt(qn);if(!qn)return [];
 var sel={};ST.sel.forEach(function(i){sel[i]=1;});
 var r=CORP.map(function(c){var v={};c.tags.forEach(function(t){v[t]=1;});v['T_'+c.type]=0.8;var dot=0,cn=0;for(var x in v){cn+=v[x]*v[x];if(q[x])dot+=q[x]*v[x];}return {c:c,s:dot/(qn*Math.sqrt(cn))};})
  .filter(function(x){return x.s>0.05;}).sort(function(a,b){return b.s-a.s;});
 var lim={S1:4,S2:3,S3:3},cnt={S1:0,S2:0,S3:0},out=[];r.forEach(function(x){if(cnt[x.c.src]<lim[x.c.src]){cnt[x.c.src]++;out.push(x);}});
 return out.sort(function(a,b){return b.s-a.s;});}
function ragSheet(){var R=ragSearch();ST.rag=R;var q=ragQuery();
 var fl='<div class="rflow">';['u_rf1','u_rf2','u_rf3','u_rf4','u_rf5'].forEach(function(k,i){fl+=(i?'<span class="ar">▶</span>':'')+'<div class="st'+(i==2||i==3?' hl':'')+'">'+T(k)+'</div>';});fl+='</div>';
 var qs=Object.keys(q).sort(function(a,b){return q[b]-q[a];}).map(function(k){var ty=k.indexOf('T_')===0;var nm=ty?ko('type_'+k.slice(2))||TYPES[k.slice(2)]:ko('tg_'+k);if(ty&&!I18N['type_'+k.slice(2)])nm=TYPES[k.slice(2)];
   return '<span class="qt'+(ty?' ty':'')+'">'+esc(nm)+' '+q[k].toFixed(2)+'</span>';}).join('');
 var rows='';R.forEach(function(x,i){var c=x.c;var tx=c.keys.map(function(k,j){return (j?'':'<b>')+'<span class="ko">'+esc(ko(k))+'</span>'+(j?'':'</b>')+'<span class="tr b" data-i="'+k+'"></span>';}).join('');
   rows+='<tr><td class="c" style="width:9mm">'+(i+1)+'</td><td style="width:30mm"><span class="srcb" style="background:'+SRCC[c.src]+'">'+c.src+'</span> '+T('src_'+c.src)+'</td><td>'+tx+'</td><td style="width:30mm"><span class="sb" style="width:'+Math.round(x.s*16)+'mm"></span>'+x.s.toFixed(2)+'</td><td style="width:34mm">'+T('use_'+c.src)+'</td></tr>';});
 return '<div class="sheet">'+head(esc(ko('u_rag_ttl')))+'<div class="body"><div class="ragw">'+fl+'<div class="listhd">'+TI('u_rag_q')+'</div><div class="rq">'+qs+'</div>'+
  '<div class="listhd">'+TI('u_rag_res')+' — DB '+CORP.length+' chunks</div><table class="rg"><thead><tr><th>'+T('u_h_no')+'</th><th>'+T('u_h_src')+'</th><th>'+T('u_h_txt')+'</th><th>'+T('u_h_sim')+'</th><th>'+T('u_h_use')+'</th></tr></thead><tbody>'+rows+'</tbody></table>'+
  '<div class="rnote">'+T('u_rag_note')+'</div></div></div>'+foot()+'</div>';}
function fitRag(){var sh=document.querySelectorAll('#out .sheet')[1];if(!sh)return;var b=sh.querySelector('.body'),w=sh.querySelector('.ragw');if(!w)return;
 w.classList.remove('r1','r2');if(over(b))w.classList.add('r1');if(over(b))w.classList.add('r2');
 var tb=w.querySelector('table.rg tbody');while(over(b)&&tb.children.length>5)tb.removeChild(tb.lastChild);}
/* ================= 5단계 홈페이지 셸 ================= */
var ENG='auto',OUT='all',UL='ko',APIKEY='',SERVERKEY=null,BUSY=false,PTWOK=false,PKEY='',EDS={ra:false,ptw:false,pst:false};
ST.meta={site:'',proc:'',date:'',by:'',forn:''};ST.ai=null;ST.sample=0;ST.ar=1.333;
try{APIKEY=localStorage.getItem('safety_key')||'';}catch(e){}
function $(s){return document.querySelector(s);} function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
function U(k){var d=UI[k];return d?d[0]:k;}
function UT(k){var d=UI[k];if(!d||UL==='ko')return '';return d[{en:1,zh:2,vi:3,uz:4}[UL]]||'';}
function applyUI(){$$('[data-ui]').forEach(function(e){var k=e.getAttribute('data-ui'),t=e.classList.contains('bi')?UT(k):'';e.innerHTML=esc(U(k))+(t?'<small class="uitr">'+esc(t)+'</small>':'');});$$('[data-uip]').forEach(function(e){e.placeholder=U(e.getAttribute('data-uip'));});
 document.title=U('title')+' | '+U('sub');var h=$('#engHint');if(h){var hk=ENG==='ai'?'hintAi':ENG==='auto'?'hintAuto':'hintMan';h.innerHTML=esc(U(hk))+(UT(hk)?'<small class="uitr">'+esc(UT(hk))+'</small>':'');}renderKey();}
/* ---------- 출력 머리·꼬리 (홈페이지판) ---------- */
function head(t){return '<div class="ttl"><span class="badge" style="background:#1F4E79">자동생성</span><div class="cbnu">충북대학교 안전공학과<br>Chungbuk National Univ.</div><h1>'+t+'</h1><div class="tsub">'+T('u_sub')+'</div></div>';}
function foot(){var d=new Date();return '<div class="ft"><span>'+esc(FOOT)+'</span><span>건설현장 안전문서 자동생성 플랫폼 | '+(ST.ai?'AI 판독 + ':'')+'지식베이스·RAG | KRAS 3×3 | <span class="pg"></span> / <span class="tot"></span> | '+d.getFullYear()+'. '+(d.getMonth()+1)+'.</span></div>';}
function dyn(k,o){I18N[k]={ko:o.ko||'',en:o.en||'',zh:o.zh||'',vi:o.vi||'',uz:o.uz||''};return k;}
function metaHTML(){var m=ST.meta;
 var site=m.site?'<span class="ed">'+esc(m.site)+'</span>':(ST.preset?TI('p1meta_site'):'<span class="ed">○○ 건설현장</span>');
 var proc=m.proc?'<span class="ed">'+esc(m.proc)+'</span>':(ST.preset?TI('p1meta_proc'):(ST.ai&&ST.ai.proc.ko?TI('ai_proc'):'<span class="ed">공정명을 입력하세요</span>'));
 var dt=m.date?esc(m.date):'2026. __. __';var by=m.by?'<span class="ed">'+esc(m.by)+'</span>':T('c_v_by');
 return '<table class="meta"><tr><th>'+T('c_m_site')+'</th><td>'+site+'</td><th>'+T('c_m_date')+'</th><td><span class="ed">'+dt+'</span></td><th>'+T('c_m_target')+'</th><td>'+T('c_v_site')+'</td></tr>'+
 '<tr><th>'+T('c_m_proc')+'</th><td>'+proc+'</td><th>'+T('c_m_team')+'</th><td>'+T('c_v_team')+'</td><th>'+T('c_m_basis')+'</th><td>'+T('c_v_basis')+'</td></tr>'+
 '<tr><th>'+T('c_m_by')+'</th><td>'+by+'</td><th>'+T('c_m_adv')+'</th><td>'+T('c_v_adv')+'</td><th>'+T('c_lg_r')+'</th><td><span class="ko">KRAS 3×3 (빈도 × 강도)'+(ST.ai?' · AI 판독':'')+'</span></td></tr></table>';}
function verdictHTML(items){var mx=0;items.forEach(function(it){mx=Math.max(mx,F(it)*S(it));});var lv=mx>=9?4:mx>=6?3:mx>=3?2:1;
 var body=ST.ai&&ST.ai.scene.ko?T('ai_scene'):(ST.preset?T('p1meta_verdict'):T('u_auto'));
 return '<div class="verdict"><span class="vt">■ '+TI('u_verdict')+' : '+TI('u_maxrisk')+' <span id="vmax">'+mx+'</span> — '+TI('c_lv'+lv)+' · '+TI('c_mg'+lv)+'</span>'+body+'</div>';}
/* 마커 좌표: 'box'(사진틀 기준) 또는 'img'(원본 사진 기준 → object-fit:cover 변환) */
function hasAiBox(){return !!(ST.ai&&((ST.ai.extra&&ST.ai.extra.length)||(ST.ai.helmet&&ST.ai.helmet.workers>0)));}
function boxH(){return hasAiBox()?126:150;}
function mkPos(p){if(!p)return null;if(p[2]!=='img'||ST.preset)return [p[0],p[1]];var bw=118,bh=boxH(),ar=ST.ar||1.333,iw,ih;if(ar>bw/bh){iw=bw;ih=bw/ar;}else{ih=bh;iw=bh*ar;}
 return [Math.round(((bw-iw)/2+p[0]/100*iw)/bw*1000)/10,Math.round(((bh-ih)/2+p[1]/100*ih)/bh*1000)/10];}
function overview(){var items=ST.sel.map(byId);var mks='';items.forEach(function(it,i){var p=mkPos(ST.mk[it.id])||[12+(i%4)*25,12+Math.floor(i/4)*22];p=[Math.min(96,Math.max(4,p[0])),Math.min(96,Math.max(4,p[1]))];mks+='<span class="mk" style="left:'+p[0]+'%;top:'+p[1]+'%">'+(i+1)+'</span>';});
 var cards='';items.forEach(function(it,i){var v=F(it)*S(it);var w=ST.ai&&I18N['ai_why_'+it.id]?T('ai_why_'+it.id):T(it.k+'_cause');
  cards+='<div class="hc" style="border-left-color:'+rkc(v)+'"><div class="hh"><span class="hn">'+(i+1)+'</span><span class="ht">'+T(it.title)+'</span><span class="hb" data-badge="'+it.id+'" style="background:'+rkc(v)+'">위험성 '+v+'</span></div><div class="hd">'+w+'</div></div>';});
 var ty={};items.forEach(function(it){if(CASES[it.type])ty[it.type]=(ty[it.type]||0)+F(it)*S(it);});var tl=Object.keys(ty).sort(function(a,b){return ty[b]-ty[a];});var cs='';var n=0;
 tl.forEach(function(t){CASES[t].forEach(function(c,j){if(n<4&&(j<2||tl.length===1)){cs+='<tr><td style="width:13mm;text-align:center">'+c.d+'</td><td style="width:24mm">'+T('type_'+t)+'</td><td style="width:30mm">'+T(c.w)+'</td><td>'+T(c.s)+'</td></tr>';n++;}});});
 var img=ST.photo?'<img src="'+ST.photo+'" alt="현장사진">':'<div class="empty">사진</div>';
 var anno=ST.preset?'<span class="anno">'+TI('p1meta_anno')+'</span>':'';
 var ex=ST.ai&&ST.ai.extra.length?'<div class="aiex"><b>🤖 '+esc(U('rdExtra'))+'</b> '+ST.ai.extra.map(esc).join(' · ')+'</div>':'';
 var hm=ST.ai&&ST.ai.helmet&&ST.ai.helmet.workers>0?'<div class="aiex hm'+(ST.ai.helmet.no_helmet>0?' bad':'')+'"><b>🪖 '+TI('u_helmet')+'</b> '+helmetTxt('ko')+'<span class="tr b" data-i="ai_helmet_n"></span>'+(I18N.ai_helmet&&I18N.ai_helmet.ko?'<br>'+T('ai_helmet'):'')+'</div>':'';ex=hm+ex;
 return '<div class="sheet">'+head(esc(ko('u_ttl')))+'<div class="body"><div class="p1grid"><div class="pcol"><div class="photowrap'+(ST.preset?'':' ct')+(hasAiBox()?' short':'')+'" onclick="placeMk(event)">'+img+mks+anno+'</div><div class="hint" style="font-size:6.5pt">'+T('u_photo')+(ST.preset?' — '+esc(ko('p1meta_site')):'')+'</div>'+ex+'</div>'+
  '<div class="rcol">'+verdictHTML(items)+'<div class="kp4" id="kpi4"></div><div class="listhd">'+TI('u_list')+' '+items.length+'</div><div class="hgrid2">'+cards+'</div>'+(cs?'<div class="listhd">'+TI('u_cases')+'</div><table class="cs">'+cs+'</table>':'')+'</div></div></div>'+foot()+'</div>';}
function placeMk(ev){if(!ST.active)return;var w=ev.currentTarget.getBoundingClientRect();var bx=100*(ev.clientX-w.left)/w.width,by=100*(ev.clientY-w.top)/w.height;if(ST.preset){ST.mk[ST.active]=[Math.round(bx),Math.round(by),'box'];}else{var bw=118,bh=boxH(),ar=ST.ar||1.333,iw,ih;if(ar>bw/bh){iw=bw;ih=bw/ar;}else{ih=bh;iw=bh*ar;}ST.mk[ST.active]=[Math.round(((bx/100*bw)-(bw-iw)/2)/iw*100),Math.round(((by/100*bh)-(bh-ih)/2)/ih*100),'img'];}ST.active=null;renderPanel();renderOut();}
/* ---------- 왼쪽 패널: 체크리스트(지식베이스) ---------- */
function renderPanel(){
 var ch='';if(ENG==='auto'){for(var t in TAGS){ch+='<span class="chip'+(ST.tags.indexOf(t)>=0?' on':'')+'" onclick="togTag(\''+t+'\')">'+esc(TAGS[t])+'</span>';}}
 $('#chips').innerHTML=ch;$('#chips').style.display=ch?'':'none';
 var aiIds={};if(ST.ai)ST.ai.items.forEach(function(x){aiIds[x.id]=1;});
 var groups={fall:[],crush:[],struck:[],other:[],mgmt:[]};KB.forEach(function(it){groups[it.type].push(it);});
 var h='';for(var g in groups){if(!groups[g].length)continue;h+='<div class="kbgrp"><h4>'+esc(TYPES[g])+'</h4>';
  groups[g].forEach(function(it){var c=ST.sel.indexOf(it.id)>=0;var rec=ENG==='auto'&&it.tags.some(function(t){return ST.tags.indexOf(t)>=0;});var v=F(it)*S(it);
   h+='<label class="kbi'+(c?' chk':'')+(rec&&!c?' rec':'')+'"><input type="checkbox" '+(c?'checked':'')+' onchange="togItem(\''+it.id+'\',this.checked)"> <span class="rk" style="background:'+rkc(v)+'">'+v+'</span> <span class="kt">'+esc(ko(it.title))+'</span>'+(aiIds[it.id]?' <span class="aib">AI</span>':'')+(it.p1?' <small style="color:#888">[사진1]</small>':'')+
   (c?' <span class="pin'+(ST.active===it.id?' act':'')+'" onclick="event.preventDefault();pinMode(\''+it.id+'\')">📍</span>':'')+'</label>';});h+='</div>';}
 $('#kb').innerHTML=h;$('#kbCount').textContent=ST.sel.length+' / '+KB.length;}
function togTag(t){var i=ST.tags.indexOf(t);if(i>=0)ST.tags.splice(i,1);else ST.tags.push(t);
 KB.forEach(function(it){if(ST.tags.indexOf(t)>=0&&it.tags.indexOf(t)>=0&&ST.sel.indexOf(it.id)<0&&!it.p1)ST.sel.push(it.id);});renderPanel();renderOut();}
function selNone(){ST.sel=[];ST.mk={};ST.tags=[];renderPanel();renderOut();}
function setEng(e){ENG=e;$$('#engSeg button').forEach(function(b){b.classList.toggle('on',b.dataset.e===e);});applyUI();renderPanel();if(e==='ai'&&ST.photo&&!ST.sample&&!ST.ai)runRead();}
/* ---------- 사진 ---------- */
function setPhoto(src,cb){ST.photo=src;var im=new Image();im.onload=function(){ST.ar=im.naturalWidth/im.naturalHeight;cb&&cb();};im.src=src;$('#thumb').innerHTML='<img src="'+src+'" alt="">';$('#drop').classList.add('has');}
function onFile(f){if(!f||!/^image\//.test(f.type))return;var r=new FileReader();r.onload=function(){ST.preset=false;ST.sample=0;ST.ai=null;ST.sel=[];ST.mk={};ST.tags=[];ST.f={};ST.s={};ST.gpt=null;
 setPhoto(r.result,function(){if(ENG==='ai')runRead();else{renderPanel();renderOut();status(U(ENG==='auto'?'hintAuto':'hintMan'),'');}});};r.readAsDataURL(f);}
function loadSample(n){var s=SAMPLES[n];ST.sample=n;ST.preset=(n===1);ST.ai=null;ST.tags=s.tags.slice();ST.f={};ST.s={};ST.gpt=null;ST.sel=s.sel.slice();ST.mk={};
 for(var k in s.mk)ST.mk[k]=s.mk[k];setPhoto(new URL(s.img,location.href).href,function(){renderPanel();renderOut();});status('📷 '+U('sample'+n)+' — '+(n===1?'4단계 사진 1 판독 결과':'체크리스트 예시 판독'),'ok');}
function resetAll(){ST.photo=null;ST.preset=false;ST.sample=0;ST.ai=null;ST.sel=[];ST.mk={};ST.tags=[];ST.f={};ST.s={};ST.gpt=null;$('#thumb').innerHTML='';$('#drop').classList.remove('has');renderPanel();renderOut();status('','');}
function status(t,c){var e=$('#rdStat');e.innerHTML=t;e.className='rdstat '+(c||'');}
/* ---------- AI 판독 (/api/read) ---------- */
function shrink(src,max,cb){var im=new Image();im.onload=function(){var w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,max/Math.max(w,h));var c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);
 c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',0.85));};im.src=src;}
function runRead(){if(BUSY||!ST.photo)return;BUSY=true;status('<span class="spin"></span> '+esc(U('rdBusy')),'busy');
 shrink(ST.photo,1600,function(small){var ctrl=window.AbortController?new AbortController():null;var tm=setTimeout(function(){if(ctrl)ctrl.abort();},65000);
  var site=[ST.meta.site,ST.meta.proc].filter(Boolean).join(' / ');
  fetch('api/read',{method:'POST',headers:{'content-type':'application/json'},signal:ctrl?ctrl.signal:undefined,body:JSON.stringify({image:small,key:APIKEY||undefined,site:site})})
  .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};},function(){return {ok:false,j:{error:'network'}};});})
  .then(function(x){clearTimeout(tm);BUSY=false;if(x.ok&&x.j.ok&&x.j.items&&x.j.items.length)applyAI(x.j);else fallback(x.j.error);})
  .catch(function(){clearTimeout(tm);BUSY=false;fallback('network');});});}
function helmetTxt(l){var h=ST.ai.helmet,d=I18N.u_helmet_n||{};return String(d[l]||d.ko||'').replace('%w',h.workers).replace('%n',h.no_helmet);}
function applyAI(j){ST.ai=j;ST.sel=[];ST.mk={};ST.f={};ST.s={};ST.tags=[];dyn('ai_scene',j.scene);dyn('ai_proc',j.proc);
 if(j.helmet){dyn('ai_helmet',j.helmet.note||{});var hn={};['ko','en','zh','vi','uz'].forEach(function(l){hn[l]=helmetTxt(l);});I18N.ai_helmet_n=hn;}
 j.items.forEach(function(x){ST.sel.push(x.id);ST.mk[x.id]=[x.x,x.y,'img'];ST.f[x.id]=x.f;ST.s[x.id]=x.s;dyn('ai_why_'+x.id,x.why);});
 renderPanel();renderOut();status('🤖 '+esc(U('rdOk').replace('%n',j.items.length).replace('%m',j.model||''))+(j.helmet&&j.helmet.workers>0?'<br>🪖 '+esc(helmetTxt('ko')):''),'ok');}
function fallback(err){var why=err==='no_key'?U('rdNoKey'):err==='bad_key'?U('rdBadKey'):U('rdErr')+(err?' ('+err+')':'');
 ENG='auto';$$('#engSeg button').forEach(function(b){b.classList.toggle('on',b.dataset.e==='auto');});applyUI();
 /* 체크리스트 자동: 사진 없이도 쓸 수 있도록 가장 흔한 공종(거푸집·단부·비계)을 추천 */
 if(!ST.sel.length){ST.tags=['formwork','edge','scaffold'];}
 renderPanel();renderOut();status('⚠️ '+esc(why)+' — '+esc(U('rdFb')),'warn');}
/* ---------- API 키 ---------- */
function renderKey(){var e=$('#keyStat');if(!e)return;if(APIKEY){e.textContent=U('keyOn').replace('%S',APIKEY.slice(-4));e.className='keystat on';}
 else if(SERVERKEY===true){e.textContent=U('keySrvOn');e.className='keystat on';}else if(SERVERKEY===false){e.textContent=U('keyNone');e.className='keystat warn';}else{e.textContent=U('keySrv');e.className='keystat';}}
function keySave(){var v=($('#apiKey').value||'').trim();if(!v){renderKey();return;}if(!/^sk-ant-/.test(v)){$('#keyStat').textContent=U('keyBad');$('#keyStat').className='keystat warn';return;}
 APIKEY=v;$('#apiKey').value='';try{localStorage.setItem('safety_key',v);}catch(e){}renderKey();if(ENG==='ai'&&ST.photo&&!ST.sample)runRead();}
function keyClear(){APIKEY='';try{localStorage.removeItem('safety_key');}catch(e){}renderKey();}
function probe(){try{fetch('api/read').then(function(r){return r.json();}).then(function(j){SERVERKEY=!!(j&&j.key);renderKey();}).catch(function(){SERVERKEY=false;renderKey();});}catch(e){SERVERKEY=false;renderKey();}}
/* ---------- 현장정보 ---------- */
function metaIn(){['site','proc','date','by','forn'].forEach(function(k){ST.meta[k]=($('#m_'+k).value||'').trim();});renderOut();}
/* ---------- 출력 섹션 ---------- */
function setOut(o){OUT=o;$$('#outSeg button').forEach(function(b){b.classList.toggle('on',b.dataset.o===o);});
 $('#secRA').style.display=(o==='all'||o==='ra')?'':'none';$('#secPTW').style.display=(o==='all'||o==='ptw')?'':'none';$('#secPST').style.display=(o==='all'||o==='pst')?'':'none';onChange();}
function goGen(){if(!ST.sel.length&&ST.photo&&ENG==='ai'){runRead();return;}renderOut();var t=$('#docs');if(t)t.scrollIntoView({behavior:'smooth'});}
function onChange(){var has=ST.sel.length>0;$('#emptyMsg').style.display=has?'none':'';['#secRA','#ptwBox','#pstBox','.gpt'].forEach(function(s){$(s).style.visibility=has?'':'hidden';$(s).style.height=has?'':'0';});if(has){$('#ptwBox').style.height=$('#ptwBox').dataset.h||'3500px';$('#pstBox').style.height=$('#pstBox').dataset.h||'1650px';}
 if(PTWOK&&has)syncPTW();if(has&&(OUT==='all'||OUT==='pst'))ensurePoster();else if(PKEY){var f=$('#pstBox');try{f.contentWindow.setLang(LANG);}catch(e){}}
 fitMain();}
function fitFrame(f){try{var h=(f.contentDocument.documentElement.scrollHeight+16)+'px';f.style.height=h;f.dataset.h=h;}catch(e){}}
function embedCSS(d,css){try{var s=d.createElement('style');s.textContent=css;d.head.appendChild(s);}catch(e){}}
/* ---------- PTW ---------- */
function initPTW(){var f=$('#ptwBox');f.onload=function(){embedCSS(f.contentDocument,'.bar{display:none!important}body{padding-top:4px!important;background:transparent!important}');PTWOK=true;if(ST.sel.length)syncPTW();};f.src='ptw.html';}
function trAll(key){var d=I18N[key]||{};return [d.ko||key,d.zh||'',d.en||'',d.vi||'',d.uz||''];}
var LASTSIG='';
function syncPTW(){var f=$('#ptwBox');var w=f.contentWindow;if(!w||!w.fromRA)return;var d=buildD();var T2={};for(var k in d.T)if(k!=='d_langs')T2[k]=d.T[k][0];var sig=JSON.stringify([d.p,d.sp,T2]);
 if(sig===LASTSIG){w.T.d_langs=d.T.d_langs;var fl=w.document.getElementById('f_langs');if(fl)fl.innerHTML=w.labD('d_langs');w.setLang(LANG);}else{LASTSIG=sig;w.fromRA(d);}setTimeout(function(){fitFrame(f);fitMain();},200);}
function buildD(){var items=ST.sel.map(byId).slice().sort(function(a,b){return F(b)*S(b)-F(a)*S(a);});
 var has=function(t){return items.some(function(it){return it.tags.indexOf(t)>=0;});};var ty=function(t){return items.some(function(it){return it.type===t;});};
 var mx=0;items.forEach(function(it){mx=Math.max(mx,F(it)*S(it));});var fn=parseInt(ST.meta.forn,10);
 var p={fire:0,cs:0,el:0,ra:0,comb:0,fw:(has('formwork')||has('scaffold'))?1:0,hv:(has('equipment')||has('lifting'))?1:0,below:(has('edge')&&ty('fall'))?1:0,
  h:ty('fall')?(ST.preset?3:2.5):0,dig:has('excavation')?150:0,forn:isNaN(fn)?(ST.preset?3:2):fn,kor:2,risk:mx||1,hvname:has('lifting')?'이동식 크레인':(has('equipment')?'굴착기·펌프카':'')};
 var TT={},LG=['ko','zh','en','vi','uz'],one=function(s){return [s,'','','',''];};
 TT.d_site=ST.meta.site?one(ST.meta.site):(ST.preset?trAll('p1meta_site'):trAll('u_gsite'));
 if(ST.meta.proc)TT.d_job=one(ST.meta.proc);else if(ST.preset)TT.d_job=trAll('p1meta_proc');else if(ST.ai&&ST.ai.proc.ko)TT.d_job=trAll('ai_proc');
 else{var tg=[];items.forEach(function(it){it.tags.forEach(function(t){if(tg.indexOf(t)<0&&t!=='mgmt')tg.push(t);});});tg=tg.slice(0,4);
  TT.d_job=LG.map(function(l){return tg.map(function(t){return (I18N['tg_'+t]||{})[l]||'';}).join(' · ')+' '+(I18N.u_work[l]||'');});}
 TT.d_loc=ST.preset?trAll('u_p1loc'):trAll('u_gloc');TT.d_equip=ST.preset?trAll('u_p1equip'):trAll('u_gequip');
 TT.d_langs=LG.map(function(){return LANG==='ko'?'한국어':'한국어, '+LNAME[LANG];});
 TT.d_outline=LG.map(function(l){var top=items.slice(0,3).map(function(it){return ((I18N[it.title]||{})[l]||ko(it.title))+'('+F(it)*S(it)+')';}).join(', ');
  return OUTL[l].replace('{n}',items.length).replace('{mx}',mx).replace('{list}',top);});
 var hz=[];items.slice(0,8).forEach(function(it,i){TT['d_hz'+i]=trAll(it.title);hz.push(['d_hz'+i,F(it)*S(it)]);});p.hz=hz.length?hz:null;
 var sp=[];(ST.rag||[]).filter(function(x){return x.c.src==='S1';}).slice(0,3).forEach(function(x,i){var a=trAll(x.c.keys[0]),g=trAll('u_rag_tag');TT['d_sp'+i]=a.map(function(s,j){return s?'['+g[j]+'] '+s:'';});sp.push('d_sp'+i);});
 return {p:p,T:TT,sp:sp,lang:LANG};}
/* ---------- 안전포스터 ---------- */
function domType(){var items=ST.sel.map(byId);var sc={fall:0,crush:0,struck:0};items.forEach(function(it){if(sc[it.type]!==undefined)sc[it.type]+=F(it)*S(it);});
 return Object.keys(sc).sort(function(a,b){return sc[b]-sc[a];})[0];}
function posterKey(){return (ST.preset?'site1':domType())+'|'+(ST.photo?ST.photo.length:0)+'|'+(ST.gpt?ST.gpt.length:0);}
function ensurePoster(){var f=$('#pstBox');var k=posterKey();if(k===PKEY){try{f.contentWindow.setLang(LANG);}catch(e){}return;}
 PKEY=k;var t=ST.preset?'site1':domType();
 f.onload=function(){var d=f.contentDocument,w=f.contentWindow;embedCSS(d,'.bar{display:none!important}body{padding:4px 0!important;background:transparent!important}');
  if(!ST.preset&&ST.photo){var im=d.querySelector('.card.no .cimg img');if(im){im.src=ST.photo;var tg=d.querySelector('.card.no .cimg .aitag');if(tg)tg.textContent='실제 현장사진 · 업로드';}}
  if(ST.gpt){var g=d.querySelector('.card.ok .cimg img');if(g){g.src=ST.gpt;var tg2=d.querySelector('.card.ok .cimg .aitag');if(tg2)tg2.textContent='ChatGPT 생성 · 추가작업';}}
  w.setLang(LANG);setTimeout(function(){fitFrame(f);fitMain();},250);mkPrompt();};
 f.src='posters/'+t+'.html';
 var gf=$('#gptFull');if(ST.preset){gf.style.display='block';gf.querySelector('img').src='samples/site1_gpt.jpg';gf.querySelector('b').textContent='ChatGPT 실사판 (사진 1 · 4단계 생성 결과)';}else gf.style.display='none';}
function ptxt(d,k){var e=d.querySelector('[data-k="'+k+'"]');return e?e.textContent.trim():'';}
function mkPrompt(){var f=$('#pstBox'),w=f.contentWindow,d=f.contentDocument;if(!w||!w.setLang||!d)return;var L0=LANG;w.setLang('ko');
 var t=ST.preset?'site1':domType();var g=function(s){return ptxt(d,t+'_'+s);};
 var items=ST.sel.map(byId).slice().sort(function(a,b){return F(b)*S(b)-F(a)*S(a);}).slice(0,4).map(function(it){return ko(it.title);});
 var mode=$('#gmode').value,p;
 if(mode==='card'){p='Create ONE photorealistic image (landscape 4:3, no text, no logos) for the GOOD-PRACTICE card of a Korean construction safety poster.\nScene: '+g('good_t')+' — '+g('good_c')+'\nSetting: a real Korean construction site similar to the attached site photo; workers in white helmets and hi-vis vests doing the work SAFELY.\nHazards found on the site (show them CONTROLLED): '+items.join(' / ')+'\nStyle: natural daylight, documentary photo, sharp, print quality. No blood, no text, no watermark.';}
 else{p='Create a realistic, print-quality Korean construction SAFETY POSTER image, portrait A3 ratio (1:1.414). Real photographs (Korean construction site, workers in white helmets, hi-vis vests), clean flat layout, bold Korean typography. Render ALL Korean text exactly as written. Do NOT draw any logo; leave an EMPTY navy square at top-right for a university logo.\n'+
  '1) Navy header: yellow warning triangle + "안전제일", slogan "안전은 습관! 사고는 예방!".\n2) Headline: "'+g('t1')+'" (black) + "'+g('t2')+'" (green).\n3) Subtitle: "'+g('sub')+'".\n'+
  '4) Two photo cards: LEFT green "'+g('good_t')+'" — caption "'+g('good_c')+'"; RIGHT red "'+g('bad_t')+'" — caption "'+g('bad_c')+'".\n'+
  '5) Red panel "이렇게 하면 위험합니다!": "'+g('d0_t')+'", "'+g('d1_t')+'", "'+g('d2_t')+'". Green panel "반드시 지켜야 합니다!": "'+g('m0_t')+'", "'+g('m1_t')+'", "'+g('m2_t')+'".\n6) Yellow banner: "'+g('banner')+'".\n7) Navy footer: emergency contact box and "119".';}
 w.setLang(L0);$('#gprompt').value=p;}
function gptGo(){var t=$('#gprompt');if(!t.value)mkPrompt();var v=t.value;
 var done=function(){$('#gmsg').textContent='✓ 프롬프트를 복사했습니다. 새 창의 ChatGPT 입력창에 붙여 넣고(Ctrl+V) 현장사진도 함께 올리세요.';};
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(done,function(){t.select();document.execCommand('copy');done();});}else{t.select();document.execCommand('copy');done();}
 window.open('https://chatgpt.com/','_blank','noopener');}
function onGpt(inp){var f=inp.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var mode=$('#gmode').value;
  if(mode==='card'){ST.gpt=r.result;PKEY='';ensurePoster();}else{var gf=$('#gptFull');gf.style.display='block';gf.querySelector('img').src=r.result;gf.querySelector('b').textContent='ChatGPT 실사판 (사용자 업로드)';}};r.readAsDataURL(f);}
/* ---------- 편집 · 인쇄 · 언어 ---------- */
function setEd(on){ED=on;document.body.classList.toggle('edit',on);$$('#out .ko,#out .tr,#out .ed,#out .meta td').forEach(function(c){c.contentEditable=on;});}
function edAll(){var on=!EDS.ra;EDS.ra=on;setEd(on);['ptwBox','pstBox'].forEach(function(id){var f=$('#'+id);try{var w=f.contentWindow;if(w&&w.tgl&&((w.editing||false)!==on))w.tgl();}catch(e){}});
 var b=$('#eb');b.classList.toggle('on',on);b.textContent=on?U('editing'):'✏️ '+U('edit');}
function prMenu(){$('#prm').classList.toggle('open');}
function printRA(){$('#prm').classList.remove('open');document.body.classList.add('pr-ra');var z=$('#docs').style.zoom;$('#docs').style.zoom=1;window.print();setTimeout(function(){document.body.classList.remove('pr-ra');$('#docs').style.zoom=z;},500);}
function printFrame(id){$('#prm').classList.remove('open');var f=$('#'+id);try{f.contentWindow.focus();f.contentWindow.print();}catch(e){}}
function setLang(l){LANG=l;UL=l;$('#langSel').value=l;applyUI();renderOut();if(!ST.sel.length)onChange();}
function fitMain(){var m=$('#main'),d=$('#docs');if(!m||!d)return;var w=m.clientWidth-24;var z=Math.min(1,w/1160);d.style.zoom=z>0.3?z:0.3;}
/* ---------- 시작 ---------- */
window.addEventListener('resize',fitMain);
window.onload=function(){var dz=$('#drop'),fi=$('#file');
 dz.addEventListener('click',function(){fi.click();});fi.addEventListener('change',function(){onFile(fi.files[0]);fi.value='';});
 ['dragover','dragenter'].forEach(function(e){dz.addEventListener(e,function(ev){ev.preventDefault();dz.classList.add('over');});});
 ['dragleave','drop'].forEach(function(e){dz.addEventListener(e,function(ev){ev.preventDefault();dz.classList.remove('over');});});
 dz.addEventListener('drop',function(ev){var f=ev.dataTransfer.files[0];onFile(f);});
 var d=new Date();$('#m_date').value=d.getFullYear()+'. '+(d.getMonth()+1)+'. '+d.getDate()+'.';ST.meta.date=$('#m_date').value;
 document.addEventListener('click',function(e){if(!e.target.closest('.prwrap'))$('#prm').classList.remove('open');});
 LANG='zh';UL='zh';$('#langSel').value='zh';applyUI();setEng('ai');renderPanel();renderOut();initPTW();probe();setOut('all');
 var q=location.search.match(/sample=(\d)/);if(q)loadSample(+q[1]);};

var _ro=renderOut;renderOut=function(){_ro();if(!ST.sel.length)onChange();};
