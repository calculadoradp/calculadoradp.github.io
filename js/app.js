/* Calculadora DP · lógica
   Os dados digitados ficam salvos no navegador (localStorage, chave "calc-dp-v1"). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const K='calc-dp-v1';
function load(){try{const v=JSON.parse(localStorage.getItem(K)||'null');return v&&typeof v==='object'?v:null}catch(e){return null}}
function save(){try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}}
const now=new Date();
const SMIN_PADRAO=1621; /* salário mínimo nacional de 2026 */
const DEF=()=>({nome:'',sal:0,ins:0,qq:0,gr:0,insM:'0',qqM:'0',qqPct:0,smin:SMIN_PADRAO,ch:'220',chO:0,mes:now.getMonth(),ano:now.getFullYear(),fer:null,man:false,domM:0,utM:0,
  he:[{p:'50',po:0,min:0}],anP:'20',anPo:0,anMin:0,anRed:true,fDias:0,fDiv:30,fSem:0,fFerw:0,fAtr:0,tab:'saldo',sRows:Array.from({length:11},()=>({ex:0,at:0}))});
const salvo=load();
let st=Object.assign(DEF(),salvo||{});
/* versões anteriores guardavam só o valor: mantém como "Digitar o valor" */
if(salvo&&salvo.insM===undefined)st.insM=salvo.ins>0?'valor':'0';
if(salvo&&salvo.qqM===undefined)st.qqM=salvo.qq>0?'valor':'0';
if(!Array.isArray(st.he)||!st.he.length)st.he=[{p:'50',po:0,min:0}];
if(!Array.isArray(st.sRows)||!st.sRows.length)st.sRows=Array.from({length:11},()=>({ex:0,at:0}));

/* ---------- formatos ---------- */
const brl=v=>(v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const num2=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const num4=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4});
const r2=v=>Math.round((v+Number.EPSILON)*100)/100;
function parseMoney(s){s=String(s||'').replace(/[R$\s]/g,'');if(!s)return 0;if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=parseFloat(s);return isFinite(n)&&n>=0?n:0}
const hhmm=m=>{m=Math.max(0,Math.round(m));return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const hdec=m=>m/60;
function digitsToMin(d){d=d.replace(/\D/g,'').replace(/^0+/,'').slice(-6);if(!d)return 0;const p=d.padStart(3,'0');return parseInt(p.slice(0,-2),10)*60+parseInt(p.slice(-2),10)}
function maskDigits(d){d=d.replace(/\D/g,'').replace(/^0+/,'').slice(-6);if(!d)return '';const p=d.padStart(4,'0');return p.slice(0,-2)+':'+p.slice(-2)}

/* ---------- calendário: domingos, feriados nacionais, dias úteis ---------- */
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da)}
function nationalHolidays(y,m){
  const fixed=[[0,1,'Confraternização'],[3,21,'Tiradentes'],[4,1,'Dia do Trabalho'],[8,7,'Independência'],[9,12,'N. Sra. Aparecida'],[10,2,'Finados'],[10,15,'Proclamação da República'],[10,20,'Consciência Negra'],[11,25,'Natal']];
  const out=fixed.filter(f=>f[0]===m).map(f=>({d:new Date(y,m,f[1]),n:f[2]}));
  const e=easter(y);const sexta=new Date(e);sexta.setDate(e.getDate()-2);if(sexta.getMonth()===m)out.push({d:sexta,n:'Sexta-feira Santa'});
  return out.sort((a,b)=>a.d-b.d);
}
const WD=['dom','seg','ter','qua','qui','sex','sáb'];
function monthInfo(){
  const y=+st.ano||now.getFullYear(),m=+st.mes;
  const days=new Date(y,m+1,0).getDate();let sundays=0;
  for(let d=1;d<=days;d++)if(new Date(y,m,d).getDay()===0)sundays++;
  const nat=nationalHolidays(y,m).filter(h=>h.d.getDay()!==0);
  const fer=st.fer==null?nat.length:Math.max(0,+st.fer||0);
  let dom=sundays+fer,ut=days-sundays-fer;
  if(st.man){dom=Math.max(0,+st.domM||0);ut=Math.max(1,+st.utM||1)}
  return {y,m,days,sundays,nat,fer,dom,ut};
}

/* ---------- cálculo ---------- */
/* insalubridade: % do salário mínimo, ou valor digitado */
function insPct(){return st.insM==='valor'?null:(+st.insM||0)}
function insVal(){const p=insPct();return p==null?st.ins:r2((+st.smin||0)*p/100)}
/* quinquênio: % do salário, ou valor digitado */
function qqPctAtual(){return st.qqM==='valor'?null:st.qqM==='pct'?(+st.qqPct||0):(+st.qqM||0)}
function qqVal(){const p=qqPctAtual();return p==null?st.qq:r2((+st.sal||0)*p/100)}
function carga(){return st.ch==='outro'?(+st.chO||0):+st.ch}
function compute(){
  const insP=insPct(), insV=insVal(), qqP=qqPctAtual(), qqV=qqVal(), rem=st.sal+insV+qqV+st.gr, ch=carga(), vh=ch>0?rem/ch:0, mi=monthInfo(), fr=mi.ut>0?mi.dom/mi.ut:0;
  // hora extra
  const heRows=st.he.map(r=>{const p=(r.p==='outro'?(+r.po||0):+r.p)/100;const vhp=vh*(1+p);return {p,vhp,min:r.min,val:r2(vhp*hdec(r.min))}});
  const heTot=r2(heRows.reduce((s,r)=>s+r.val,0)), heDsr=r2(heTot*fr);
  // adicional noturno
  const anP=(st.anP==='outro'?(+st.anPo||0):+st.anP)/100;
  const anMinNot=st.anRed?st.anMin*60/52.5:st.anMin;
  const anVh=vh*anP, anVal=r2(anVh*hdec(anMinNot)), anDsr=r2(anVal*fr);
  // faltas
  const div=Math.max(1,+st.fDiv||30), vd=rem/div;
  const fVal=r2(vd*(+st.fDias||0)), dsrDias=(+st.fSem||0)+(+st.fFerw||0), fDsr=r2(vd*dsrDias), fAtr=r2(vh*hdec(st.fAtr));
  const prov=r2(heTot+heDsr+anVal+anDsr), desc=r2(fVal+fDsr+fAtr);
  return {insP,insV,qqP,qqV,rem,ch,vh,mi,fr,heRows,heTot,heDsr,anP,anMinNot,anVh,anVal,anDsr,div,vd,fVal,dsrDias,fDsr,fAtr,prov,desc,res:r2(prov-desc)};
}

/* ---------- campos ---------- */
const moneyIds=['sal','ins','qq','gr'];
function bindMoney(id){
  const el=$(id);el.value=st[id]?num2(st[id]):'';
  el.addEventListener('input',()=>{st[id]=parseMoney(el.value);update()});
  el.addEventListener('blur',()=>{el.value=st[id]?num2(st[id]):''});
}
moneyIds.forEach(bindMoney);
bindMoney('smin');
function syncAdic(){
  $('ins-m').value=st.insM;$('qq-m').value=st.qqM;
  $('smin-wrap').hidden=insPct()==null||insPct()===0;$('ins-wrap').hidden=st.insM!=='valor';
  $('qq-pct-wrap').hidden=st.qqM!=='pct';$('qq-wrap').hidden=st.qqM!=='valor';
}
$('ins-m').addEventListener('change',e=>{const antes=insVal();st.insM=e.target.value;if(st.insM==='valor')st.ins=antes;syncAdic();fillMoney();update()});
$('qq-m').addEventListener('change',e=>{const antes=qqVal();st.qqM=e.target.value;if(st.qqM==='valor')st.qq=antes;syncAdic();fillMoney();update()});
$('qq-pct').value=st.qqPct||'';$('qq-pct').addEventListener('input',e=>{st.qqPct=parseMoney(e.target.value);update()});
function fillMoney(){['ins','qq','smin'].forEach(id=>{if(document.activeElement!==$(id))$(id).value=st[id]?num2(st[id]):''})}
syncAdic();
$('nome').value=st.nome;$('nome').addEventListener('input',e=>{st.nome=e.target.value;save()});
function bindSelect(id,key,otherWrap,otherId,otherKey){
  const el=$(id);el.value=st[key];
  const sync=()=>{if(otherWrap)$(otherWrap).hidden=el.value!=='outro'};sync();
  el.addEventListener('change',()=>{st[key]=el.value;sync();update()});
  if(otherId){const o=$(otherId);o.value=st[otherKey]||'';o.addEventListener('input',()=>{st[otherKey]=parseMoney(o.value);update()})}
}
bindSelect('ch','ch','ch-o-wrap','ch-o','chO');
bindSelect('an-p','anP','an-po-wrap','an-po','anPo');
MESES.forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=m;$('mes').appendChild(o)});
$('mes').value=st.mes;$('ano').value=st.ano;
$('mes').addEventListener('change',e=>{st.mes=+e.target.value;st.fer=null;syncFer();update()});
$('ano').addEventListener('input',e=>{const y=parseInt(e.target.value,10);if(y>1990&&y<2100){st.ano=y;st.fer=null;syncFer();update()}});
function syncFer(){const mi=monthInfo();$('fer').value=mi.fer}
$('fer').addEventListener('input',e=>{st.fer=e.target.value===''?null:Math.max(0,parseInt(e.target.value,10)||0);update()});
$('dsr-man').checked=st.man;$('dsr-man-box').hidden=!st.man;
$('dsr-man').addEventListener('change',e=>{st.man=e.target.checked;if(st.man&&!st.utM){const mi=monthInfo();st.domM=mi.dom;st.utM=mi.ut;$('dom-m').value=st.domM;$('ut-m').value=st.utM}$('dsr-man-box').hidden=!st.man;update()});
$('dom-m').value=st.domM||'';$('ut-m').value=st.utM||'';
$('dom-m').addEventListener('input',e=>{st.domM=+e.target.value||0;update()});
$('ut-m').addEventListener('input',e=>{st.utM=+e.target.value||0;update()});
function bindHH(el,get,set){
  el.value=get()?hhmm(get()):'';
  el.addEventListener('input',()=>{el.value=maskDigits(el.value);set(digitsToMin(el.value));update();requestAnimationFrame(()=>el.setSelectionRange(el.value.length,el.value.length))});
  el.addEventListener('keydown',e=>{if(e.key==='Backspace'){e.preventDefault();const all=el.selectionStart===0&&el.selectionEnd===el.value.length&&el.value;let d=el.value.replace(/\D/g,'').replace(/^0+/,'');d=all?'':d.slice(0,-1);el.value=maskDigits(d);set(digitsToMin(d));update()}});
  el.addEventListener('blur',()=>{el.value=get()?hhmm(get()):''});
}
bindHH($('an-h'),()=>st.anMin,v=>st.anMin=v);
bindHH($('f-atr'),()=>st.fAtr,v=>st.fAtr=v);
$('an-red').checked=st.anRed;$('an-red').addEventListener('change',e=>{st.anRed=e.target.checked;update()});
[['f-dias','fDias'],['f-div','fDiv'],['f-sem','fSem'],['f-ferw','fFerw']].forEach(([id,k])=>{const el=$(id);el.value=st[k]||(k==='fDiv'?30:'');el.addEventListener('input',()=>{st[k]=Math.max(0,parseInt(el.value,10)||0);if(k==='fDias'&&st.fDias>0&&!st.fSem){st.fSem=1;$('f-sem').value=1}update()})});

/* hora extra: linhas por percentual */
function renderHE(){
  const box=$('he-rows');box.innerHTML='';
  st.he.forEach((r,i)=>{
    const d=document.createElement('div');d.className='he-row';
    d.innerHTML=`<label>Percentual<select data-f="p"><option value="50">50%</option><option value="70">70%</option><option value="75">75%</option><option value="100">100%</option><option value="outro">Outro…</option></select></label>
      <label>Horas<input data-f="h" class="hh" inputmode="numeric" autocomplete="off" placeholder="00:00" aria-label="Horas"></label>
      <button type="button" class="del" aria-label="Remover linha" title="Remover linha">✕</button>`;
    const sel=d.querySelector('select'),h=d.querySelector('input');
    sel.value=r.p;
    if(r.p==='outro'){const l=document.createElement('label');l.textContent='Percentual (%)';const o=document.createElement('input');o.inputMode='decimal';o.value=r.po||'';o.addEventListener('input',()=>{r.po=parseMoney(o.value);update()});l.appendChild(o);d.insertBefore(l,d.children[1]);d.style.gridTemplateColumns='minmax(0,1fr) 110px minmax(0,1fr) 32px'}
    sel.addEventListener('change',()=>{r.p=sel.value;renderHE();update()});
    bindHH(h,()=>r.min,v=>r.min=v);
    d.querySelector('.del').addEventListener('click',()=>{if(st.he.length>1)st.he.splice(i,1);else st.he[0]={p:'50',po:0,min:0};renderHE();update()});
    box.appendChild(d);
  });
}
$('he-add').addEventListener('click',()=>{const used=st.he.map(r=>r.p);const next=['50','100','70','75'].find(p=>!used.includes(p))||'50';st.he.push({p:next,po:0,min:0});renderHE();update();const hs=$('he-rows').querySelectorAll('input.hh');hs[hs.length-1]?.focus()});

/* saldo de horas (2 em 1 com a Calculadora de Horas) */
const sGrid=$('s-grid');
function saldoMin(){let e=0,a=0;st.sRows.forEach(r=>{e+=r.ex||0;a+=r.at||0});return {e,a,s:e-a}}
function renderSaldo(focus){
  sGrid.querySelectorAll('.sc').forEach(x=>x.remove());
  st.sRows.forEach((r,i)=>{
    ['ex','at'].forEach(k=>{const inp=document.createElement('input');inp.className='sc '+k;inp.id='s-'+k+'-'+i;inp.dataset.k=k;inp.dataset.i=i;inp.inputMode='numeric';inp.autocomplete='off';inp.placeholder='00:00';
      inp.setAttribute('aria-label',(k==='ex'?'Hora extra':'Atraso')+', linha '+(i+1));inp.value=r[k]?hhmm(r[k]):'';sGrid.appendChild(inp)});
    const d=document.createElement('button');d.type='button';d.className='sc sdel';d.dataset.del=i;d.textContent='✕';d.title='Apagar esta linha';d.setAttribute('aria-label','Apagar linha '+(i+1));sGrid.appendChild(d);
  });
  if(focus){const el=$(focus);if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}}
}
function saldoUpdate(){
  const {e,a,s}=saldoMin(),sig=s>0?'+':s<0?'−':'';
  $('tv-saldo').textContent=(e||a)?sig+hhmm(Math.abs(s)):'';
  let h='<h3>Totais</h3><ol>'+li('Total de hora extra',hhmm(e))+li('Total de atrasos',hhmm(a))+'</ol>';
  h+=`<div class="saldo-big ${s>0?'pos':s<0?'neg':''}"><b>${sig}${hhmm(Math.abs(s))}</b><span>${s>0?'Saldo positivo: a favor do colaborador':s<0?'Saldo negativo: horas a descontar':'Sem saldo'}</span></div>`;
  if(s>0)h+=`<button type="button" class="btn main go" id="s-go">Lançar ${hhmm(s)} na aba Hora extra</button>`;
  if(s<0)h+=`<button type="button" class="btn main go" id="s-go" style="background:var(--red-d)">Lançar ${hhmm(-s)} em Faltas e atrasos</button>`;
  $('memo-saldo').innerHTML=h;
}
sGrid.addEventListener('input',e=>{const t=e.target;if(!t.dataset.k)return;t.value=maskDigits(t.value);st.sRows[+t.dataset.i][t.dataset.k]=digitsToMin(t.value);saldoUpdate();save();requestAnimationFrame(()=>t.setSelectionRange(t.value.length,t.value.length))});
sGrid.addEventListener('focusout',e=>{const t=e.target;if(!t.dataset.k)return;const m=st.sRows[+t.dataset.i][t.dataset.k];t.value=m?hhmm(m):''});
sGrid.addEventListener('keydown',e=>{
  const t=e.target;if(!t.dataset.k)return;const i=+t.dataset.i,k=t.dataset.k;
  if(e.key==='Backspace'){e.preventDefault();const all=t.selectionStart===0&&t.selectionEnd===t.value.length&&t.value;let d=t.value.replace(/\D/g,'').replace(/^0+/,'');d=all?'':d.slice(0,-1);t.value=maskDigits(d);st.sRows[i][k]=digitsToMin(d);saldoUpdate();save();return}
  if(e.key==='Enter'||e.key==='ArrowDown'){e.preventDefault();if(i===st.sRows.length-1){if(e.key==='ArrowDown')return;st.sRows.push({ex:0,at:0});renderSaldo('s-'+k+'-'+(i+1));saldoUpdate();save();return}$('s-'+k+'-'+(i+1)).focus()}
  else if(e.key==='ArrowUp'&&i>0){e.preventDefault();$('s-'+k+'-'+(i-1)).focus()}
});
function parseLooseMin(x){x=String(x).trim();if(!x)return null;let m=x.match(/^(\d{1,4}):(\d{1,2})(?::\d{1,2})?$/);if(m)return +m[1]*60+ +m[2];m=x.match(/^(\d+)[,.](\d+)$/);if(m)return Math.round(parseFloat(m[1]+'.'+m[2])*60);if(/^\d+$/.test(x))return digitsToMin(x);return null}
sGrid.addEventListener('paste',e=>{
  const t=e.target;if(!t.dataset.k)return;const txt=(e.clipboardData||window.clipboardData).getData('text');
  const lines=txt.split(/\r?\n/).map(l=>l.split('\t')).filter(c=>c.some(x=>x.trim()));
  if(lines.length<=1&&(!lines[0]||lines[0].length<=1)){const m=parseLooseMin(txt);if(m==null)return;e.preventDefault();st.sRows[+t.dataset.i][t.dataset.k]=m;t.value=hhmm(m);saldoUpdate();save();return}
  e.preventDefault();let i=+t.dataset.i;const k0=t.dataset.k;
  lines.forEach(cols=>{while(st.sRows.length<=i)st.sRows.push({ex:0,at:0});const ks=k0==='ex'?['ex','at']:['at'];cols.slice(0,ks.length).forEach((c,j)=>{const m=parseLooseMin(c);if(m!=null)st.sRows[i][ks[j]]=m});i++});
  renderSaldo('s-'+k0+'-'+Math.min(i,st.sRows.length-1));saldoUpdate();save();
});
sGrid.addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(!d)return;const i=+d.dataset.del;if(st.sRows.length>1)st.sRows.splice(i,1);else st.sRows[0]={ex:0,at:0};renderSaldo();saldoUpdate();save()});
$('s-add').addEventListener('click',()=>{st.sRows.push({ex:0,at:0});renderSaldo('s-ex-'+(st.sRows.length-1));save()});
let sArm=null;
$('s-clear').addEventListener('click',e=>{const b=e.currentTarget;
  if(!sArm){b.textContent='Clique de novo para limpar';b.classList.add('armed');sArm=setTimeout(()=>{b.textContent='Limpar horários';b.classList.remove('armed');sArm=null},3000);return}
  clearTimeout(sArm);sArm=null;b.textContent='Limpar horários';b.classList.remove('armed');st.sRows=Array.from({length:11},()=>({ex:0,at:0}));renderSaldo('s-ex-0');saldoUpdate();save()});
$('memo-saldo').addEventListener('click',e=>{
  if(!e.target.closest('#s-go'))return;const {s}=saldoMin();
  if(s>0){st.he[0].min=s;renderHE();update();showTab('he');toast('Saldo lançado na primeira linha da hora extra. Confira o percentual.')}
  else if(s<0){st.fAtr=-s;$('f-atr').value=hhmm(-s);update();showTab('falta');toast('Saldo negativo lançado em Atrasos a descontar.')}
});

/* abas */
function showTab(t){st.tab=t;document.querySelectorAll('[data-t]').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t?'true':'false'));['saldo','he','an','falta'].forEach(x=>$('pane-'+x).hidden=x!==t);save()}
document.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.t)));

/* ---------- saída ---------- */
const li=(a,b,cls)=>`<li${cls?` class="${cls}"`:''}><span>${a}</span><span>${b}</span></li>`;
const pctTxt=p=>(p*100).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
function update(){
  const c=compute();save();
  const pctF=p=>p.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
  let adic='';
  if(c.insP)adic+=`<span class="chip">Insalubridade ${pctF(c.insP)} de ${brl(+st.smin||0)} = <b>${brl(c.insV)}</b></span>`;
  if(c.qqP)adic+=`<span class="chip">Quinquênio ${pctF(c.qqP)} do salário = <b>${brl(c.qqV)}</b></span>`;
  $('base-facts').innerHTML=adic+`<span class="chip">Remuneração <b>${brl(c.rem)}</b></span><span class="chip">÷ ${num4(c.ch)} h</span><span class="chip">Valor da hora <b>${brl(c.vh)}</b></span>`;
  const mi=c.mi;
  $('fer-note').textContent=mi.nat.length?'Feriados nacionais do mês: '+mi.nat.map(h=>String(h.d.getDate()).padStart(2,'0')+'/'+String(mi.m+1).padStart(2,'0')+' ('+WD[h.d.getDay()]+', '+h.n+')').join('; ')+'. Some os feriados estaduais e municipais.':'Nenhum feriado nacional neste mês fora de domingo. Some os estaduais e municipais, se houver.';
  if(document.activeElement!==$('fer'))$('fer').value=mi.fer;
  $('dsr-facts').innerHTML=`<span class="chip">${mi.days} dias</span><span class="chip">Domingos e feriados <b>${mi.dom}</b></span><span class="chip">Dias úteis <b>${mi.ut}</b></span><span class="chip">DSR = valor × ${mi.dom} ÷ ${mi.ut}</span>`;
  const noBase=c.vh<=0;
  // HE
  if(noBase)$('memo-he').innerHTML='<h3>Memória de cálculo</h3><p class="empty">Preencha o salário e a carga horária do colaborador.</p>';
  else{
    let h='<h3>Memória de cálculo</h3><ol>'+li('Valor da hora',brl(c.vh));
    c.heRows.forEach(r=>{h+=li('Hora + '+pctTxt(r.p),brl(r.vhp),'sub')+li('× '+hhmm(r.min)+' ('+num4(hdec(r.min))+' h)',brl(r.val),'sub')});
    h+=li('Hora extra',brl(c.heTot))+li('DSR (× '+mi.dom+' ÷ '+mi.ut+')',brl(c.heDsr))+'</ol>';
    h+=`<div class="total"><span>Total a pagar</span><b>${brl(r2(c.heTot+c.heDsr))}</b></div>`;
    $('memo-he').innerHTML=h;
  }
  // AN
  if(noBase)$('memo-an').innerHTML='<h3>Memória de cálculo</h3><p class="empty">Preencha o salário e a carga horária do colaborador.</p>';
  else{
    let h='<h3>Memória de cálculo</h3><ol>'+li('Valor da hora',brl(c.vh))+li('Adicional de '+pctTxt(c.anP)+' por hora',brl(c.anVh));
    h+=st.anRed?li(hhmm(st.anMin)+' de relógio × 60 ÷ 52,5',hhmm(c.anMinNot)+' noturnas'):li('Horas noturnas (sem conversão)',hhmm(st.anMin));
    h+=li('× '+num4(hdec(c.anMinNot))+' h',brl(c.anVal))+li('DSR (× '+mi.dom+' ÷ '+mi.ut+')',brl(c.anDsr))+'</ol>';
    h+=`<div class="total"><span>Total a pagar</span><b>${brl(r2(c.anVal+c.anDsr))}</b></div>`;
    $('memo-an').innerHTML=h;
  }
  // Faltas
  if(c.rem<=0)$('memo-falta').innerHTML='<h3>Memória de cálculo</h3><p class="empty">Preencha a remuneração do colaborador.</p>';
  else{
    let h='<h3>Memória de cálculo</h3><ol>'+li('Remuneração ÷ '+c.div+' dias',brl(c.vd)+' por dia');
    h+=li('Faltas: '+(+st.fDias||0)+' dia(s)',brl(c.fVal));
    h+=li('Perda do DSR: '+(+st.fSem||0)+' semana(s)'+((+st.fFerw||0)?' + '+st.fFerw+' feriado(s)':''),brl(c.fDsr));
    h+=li('Atrasos: '+hhmm(st.fAtr)+' × valor da hora',brl(c.fAtr))+'</ol>';
    h+=`<div class="total neg"><span>Total a descontar</span><b>${brl(c.desc)}</b></div>`;
    $('memo-falta').innerHTML=h;
  }
  $('tv-he').textContent=c.heTot?brl(r2(c.heTot+c.heDsr)):'';
  $('tv-an').textContent=c.anVal?brl(r2(c.anVal+c.anDsr)):'';
  $('tv-falta').textContent=c.desc?brl(c.desc):'';
  // resumo
  const ln=(a,b,t)=>`<div class="ln${t?' t':''}"><span>${a}</span><b>${brl(b)}</b></div>`;
  $('r-pv').innerHTML='<h3>Proventos</h3>'+ln('Hora extra',c.heTot)+ln('DSR sobre hora extra',c.heDsr)+ln('Adicional noturno',c.anVal)+ln('DSR sobre adicional noturno',c.anDsr)+ln('Total',c.prov,1);
  $('r-ds').innerHTML='<h3>Descontos</h3>'+ln('Faltas',c.fVal)+ln('Perda do DSR',c.fDsr)+ln('Atrasos',c.fAtr)+ln('Total',c.desc,1);
  const rs=$('r-rs');rs.classList.toggle('pos',c.res>0);rs.classList.toggle('neg',c.res<0);
  rs.innerHTML=`<span class="lbl">Resultado</span><span class="big">${c.res>0?'+':''}${brl(c.res)}</span><span class="what">${c.res>0?'a pagar ao colaborador':c.res<0?'a descontar do colaborador':'sem valores'}</span>`;
  R=c;
}
let R=null;

/* ---------- resumo em texto e PNG ---------- */
function summaryLines(){
  const c=R,mi=c.mi,L=[];
  L.push(['h','Calculadora DP · '+MESES[mi.m]+' de '+mi.y]);
  if(st.nome.trim())L.push(['t','Colaborador: '+st.nome.trim()]);
  {const pctF=p=>p.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%',partes=['Salário '+brl(st.sal)];
   if(c.insV)partes.push('Insalubridade '+brl(c.insV)+(c.insP?' ('+pctF(c.insP)+' do mínimo)':''));
   if(c.qqV)partes.push('Quinquênio '+brl(c.qqV)+(c.qqP?' ('+pctF(c.qqP)+')':''));
   if(st.gr)partes.push('Gratificações '+brl(st.gr));
   if(partes.length>2){L.push(['t',partes.slice(0,2).join(' + ')]);L.push(['t','+ '+partes.slice(2).join(' + ')])}else L.push(['t',partes.join(' + ')]);}
  L.push(['t','Remuneração '+brl(c.rem)+' ÷ '+num4(c.ch)+' h = valor da hora '+brl(c.vh)]);
  L.push(['t','DSR: '+mi.dom+' domingos e feriados ÷ '+mi.ut+' dias úteis']);
  if(c.heTot){L.push(['s','Hora extra']);c.heRows.forEach(r=>{if(r.min)L.push(['l',pctTxt(r.p)+': '+hhmm(r.min)+' × '+brl(r.vhp),brl(r.val)])});L.push(['l','DSR sobre hora extra',brl(c.heDsr)])}
  if(c.anVal){L.push(['s','Adicional noturno '+pctTxt(c.anP)]);L.push(['l',(st.anRed?hhmm(st.anMin)+' de relógio = '+hhmm(c.anMinNot)+' noturnas':hhmm(st.anMin)+' noturnas')+' × '+brl(c.anVh),brl(c.anVal)]);L.push(['l','DSR sobre adicional noturno',brl(c.anDsr)])}
  if(c.desc){L.push(['s','Faltas e atrasos']);if(c.fVal)L.push(['l',(+st.fDias)+' dia(s) de falta × '+brl(c.vd),brl(c.fVal)]);if(c.fDsr)L.push(['l','Perda do DSR: '+c.dsrDias+' dia(s)',brl(c.fDsr)]);if(c.fAtr)L.push(['l','Atrasos: '+hhmm(st.fAtr)+' × '+brl(c.vh),brl(c.fAtr)])}
  L.push(['s','Totais']);L.push(['l','Proventos',brl(c.prov)]);L.push(['l','Descontos',brl(c.desc)]);L.push(['T','Resultado',(c.res>0?'+':'')+brl(c.res)]);
  return L;
}
$('btn-copy').addEventListener('click',()=>{
  const txt=summaryLines().map(l=>l[0]==='s'?'\n'+l[1].toUpperCase():l[0]==='l'||l[0]==='T'?l[1]+': '+l[2]:l[1]).join('\n');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>toast('Resumo copiado'),()=>fallbackCopy(txt));else fallbackCopy(txt);
});
function fallbackCopy(t){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Resumo copiado')}catch(e){toast('Não foi possível copiar')}a.remove()}
function drawPNG(s=1){
  const L=summaryLines(),W=1100,pad=56,FF='"OpenSansL","Segoe UI",sans-serif';
  let H=pad+70;L.forEach(l=>{H+=l[0]==='s'?58:l[0]==='T'?84:l[0]==='h'?0:40});H+=pad;
  const cv=document.createElement('canvas');cv.width=W*s;cv.height=H*s;const x=cv.getContext('2d');x.scale(s,s);
  x.fillStyle='#eefbe2';x.fillRect(0,0,W,H);x.fillStyle='#ffffff';x.beginPath();x.roundRect?x.roundRect(20,20,W-40,H-40,28):x.rect(20,20,W-40,H-40);x.fill();
  let y=pad+30;x.textBaseline='middle';
  L.forEach(l=>{
    if(l[0]==='h'){x.font='30px "Lilita","Trebuchet MS",sans-serif';x.fillStyle='#ff5a5a';x.fillText(l[1].toUpperCase(),pad,y);y+=50;return}
    if(l[0]==='t'){x.font='19px '+FF;x.fillStyle='#5c6b5a';x.fillText(l[1],pad,y);y+=40;return}
    if(l[0]==='s'){y+=14;x.font='bold 21px '+FF;x.fillStyle='#2f7d1e';x.fillText(l[1].toUpperCase(),pad,y);y+=44;return}
    if(l[0]==='l'){x.font='19px '+FF;x.fillStyle='#141a12';x.fillText(l[1],pad,y);x.font='bold 19px '+FF;x.textAlign='right';x.fillText(l[2],W-pad,y);x.textAlign='left';x.strokeStyle='#e3eedb';x.beginPath();x.moveTo(pad,y+20);x.lineTo(W-pad,y+20);x.stroke();y+=40;return}
    if(l[0]==='T'){y+=10;const neg=R.res<0;x.fillStyle=R.res===0?'#b3b3b3':neg?'#ee4444':'#45b52a';x.beginPath();x.roundRect?x.roundRect(pad-10,y-28,W-2*pad+20,60,16):x.rect(pad-10,y-28,W-2*pad+20,60);x.fill();
      x.fillStyle='#ffffff';x.font='bold 24px '+FF;x.fillText(l[1],pad+10,y+2);x.textAlign='right';x.font='bold 30px '+FF;x.fillText(l[2],W-pad-10,y+2);x.textAlign='left';y+=74}
  });
  return cv;
}
function dataBytes(url){const bin=atob(url.split(',')[1]),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return u8}
/* PDF de uma página A4 com a imagem JPEG do resumo, montado à mão para não depender de biblioteca */
function makePDF(jpg,iw,ih){
  const PW=595.28,PH=841.89,M=24,s=Math.min((PW-2*M)/iw,(PH-2*M)/ih),cs=`q ${(iw*s).toFixed(2)} 0 0 ${(ih*s).toFixed(2)} ${M} ${(PH-M-ih*s).toFixed(2)} cm /I Do Q`;
  const objs=['<</Type/Catalog/Pages 2 0 R>>','<</Type/Pages/Kids[3 0 R]/Count 1>>',`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</XObject<</I 5 0 R>>>>/Contents 4 0 R>>`,`<</Length ${cs.length}>>\nstream\n${cs}\nendstream`,[`<</Type/XObject/Subtype/Image/Width ${iw}/Height ${ih}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpg.length}>>\nstream\n`,jpg,'\nendstream']];
  const te=new TextEncoder(),parts=[],xref=[];let n=0;const put=p=>{const b=typeof p==='string'?te.encode(p):p;parts.push(b);n+=b.length};
  put('%PDF-1.4\n');
  objs.forEach((o,i)=>{xref.push(n);put((i+1)+' 0 obj\n');[].concat(o).forEach(put);put('\nendobj\n')});
  const start=n;
  put('xref\n0 6\n0000000000 65535 f \n'+xref.map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${start}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
const dlM=$('dl-menu'),dlB=$('btn-down');
function menuDl(o){dlM.hidden=!o;dlB.setAttribute('aria-expanded',o?'true':'false');if(o)dlM.querySelector('button').focus()}
dlB.addEventListener('click',()=>menuDl(dlM.hidden));
document.addEventListener('click',e=>{if(!dlM.hidden&&!e.target.closest('.dl-wrap'))menuDl(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dlM.hidden){menuDl(false);dlB.focus()}});
dlM.addEventListener('click',async e=>{
  const b=e.target.closest('[data-fmt]');if(!b)return;const fmt=b.dataset.fmt;menuDl(false);dlB.focus();
  const cv=drawPNG(fmt==='pdf'?2:1);const name=('Calculadora DP - '+(st.nome.trim()?st.nome.trim()+' - ':'')+MESES[R.mi.m]+' '+R.mi.y+'.'+fmt).replace(/[\\/:*?"<>|]+/g,'-');
  const mime=fmt==='png'?'image/png':'image/jpeg',u8=dataBytes(cv.toDataURL(mime,.92));
  const blob=fmt==='pdf'?makePDF(u8,cv.width,cv.height):new Blob([u8],{type:mime});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Arquivo salvo em Downloads');
});
let armed=null;
$('btn-clear').addEventListener('click',e=>{
  const b=e.currentTarget;
  if(!armed){b.textContent='Clique de novo para limpar';b.classList.add('armed');armed=setTimeout(()=>{b.textContent='Limpar tudo';b.classList.remove('armed');armed=null},3000);return}
  clearTimeout(armed);armed=null;b.textContent='Limpar tudo';b.classList.remove('armed');
  const keep={mes:st.mes,ano:st.ano,ch:st.ch,chO:st.chO,tab:st.tab,smin:st.smin};st=Object.assign(DEF(),keep);fillFields();renderHE();update();renderSaldo();saldoUpdate();toast('Campos limpos');
});
let tt=null;function toast(m){const t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2600)}

/* tema claro/escuro: chave própria no localStorage, para o "Limpar tudo" não mexer nele */
const root=document.documentElement;
function syncTema(){$('btn-tema').textContent=root.dataset.theme==='dark'?'☀ Tema claro':'☾ Tema escuro'}
$('btn-tema').addEventListener('click',()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('calc-dp-tema',t)}catch(e){}syncTema()});
syncTema();

function fillFields(){
  moneyIds.forEach(id=>$(id).value=st[id]?num2(st[id]):'');
  $('smin').value=st.smin?num2(st.smin):'';$('qq-pct').value=st.qqPct||'';syncAdic();
  $('nome').value=st.nome;$('ch').value=st.ch;$('ch-o-wrap').hidden=st.ch!=='outro';$('ch-o').value=st.chO||'';
  $('an-p').value=st.anP;$('an-po-wrap').hidden=st.anP!=='outro';$('an-po').value=st.anPo||'';
  $('mes').value=st.mes;$('ano').value=st.ano;$('dsr-man').checked=st.man;$('dsr-man-box').hidden=!st.man;
  $('dom-m').value=st.domM||'';$('ut-m').value=st.utM||'';$('an-red').checked=st.anRed;
  $('an-h').value=st.anMin?hhmm(st.anMin):'';$('f-atr').value=st.fAtr?hhmm(st.fAtr):'';
  $('f-dias').value=st.fDias||'';$('f-div').value=st.fDiv||30;$('f-sem').value=st.fSem||'';$('f-ferw').value=st.fFerw||'';
  syncFer();
}
renderHE();renderSaldo();saldoUpdate();showTab(st.tab||'saldo');syncFer();update();
})();
