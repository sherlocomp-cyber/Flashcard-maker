"use strict";
const $=id=>document.getElementById(id);
const PAL=[['Oranye','#e4572e','#fff0e8'],['Tosca','#2a9d8f','#e6f6f3'],['Biru','#3d5a80','#e8eef7'],['Kuning','#d9931f','#fff5e0'],['Ungu','#8e5ea2','#f3eaf7'],['Hijau','#4c9f38','#ecf7e6'],['Merah muda','#d64f7a','#fdebf1'],['Cyan','#1f8ea8','#e3f4f8'],['Emas','#b8860b','#fbf3d9'],['Marun','#8b1e3f','#f8e6ec'],['Navy','#1f3a68','#e4eaf6'],['Sage','#6b8f71','#eaf2eb'],['Koral','#f0645a','#fee9e6'],['Lavender','#7c6bc4','#ede9f9'],['Arang','#3b4148','#e9ecee'],['Mint','#2fbf94','#e2f8f0'],['Kustom','#7a5cff','#ece8ff']];
const S={cards:[],seq:0,zoom:.5};let TEST=false,GAME=false;
function deck(){if(TEST){const [c,r]=gridFor(+$('cpp').value,$('ori').value);return Array.from({length:c*r},(_,i)=>({k:i+1,ar:String(i+1),ind:String(i+1),img:null}))}const b=$('babf').value;return b?S.cards.filter(c=>c.bab===b):S.cards}
const AR=/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=s=>s.replace(/[ \u00a0]{2,}/g,' ').trim();

/* ---------- PARSER ---------- */
function detectSeparator(lines){
  const seps=['\t','|','=',':'];
  for(const s of seps){const n=lines.filter(l=>l.includes(s)).length;if(n>=Math.max(1,lines.length*.5))return s;}
  return null;
}
function splitLine(l,sep){
  if(sep==='|'){const p=l.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|');return [p[0],p.slice(1).join(' | ')];}
  if(sep==='\t'){const p=l.split('\t').map(x=>x.trim()).filter((x,i)=>x||i===0);return [p[0]||'',p[1]||'',p[2]||'',p.slice(3).join(' ')];}
  const i=l.indexOf(sep);return i<0?[l,'']:[l.slice(0,i),l.slice(i+1)];
}
function splitByPattern(l){ // no explicit separator: 2+ spaces, or Arabic→Latin boundary
  let m=l.split(/\s{2,}/);if(m.length>=2)return [m[0],m.slice(1).join(' ')];
  let i=[...l].findIndex((ch,k,a)=>!AR.test(ch)&&/[A-Za-z]/.test(ch)&&a.slice(0,k).some(c=>AR.test(c)));
  if(i>0)return [l.slice(0,i),l.slice(i)];
  i=[...l].findIndex((ch,k,a)=>AR.test(ch)&&a.slice(0,k).some(c=>/[A-Za-z]/.test(c)));
  return i>0?[l.slice(i),l.slice(0,i)]:null;
}
function parseInput(text,forcedSep){
  const lines=text.replace(/\r/g,'').split('\n').map(l=>l.replace(/\u200f|\u200e/g,m=>m)).filter(l=>l.trim());
  if(!lines.length)return {rows:[],sep:null};
  let sep=forcedSep||detectSeparator(lines),rows=[];
  for(const l of lines){
    let p=sep?splitLine(l,sep):splitByPattern(l);
    if(!p){rows.push({ar:clean(l),ind:''});continue}
    let a=clean(p[0]),b=clean(p[1]);
    if($('lang').value==='ai'&&a&&b&&!AR.test(a)&&AR.test(b))[a,b]=[b,a];
    rows.push({ar:a,ind:b,ex:clean(p[2]||''),bab:clean(p[3]||'')});
  }
  if(rows.length>1&&!AR.test(rows[0].ar)&&(/^(arab|arabic|kata|kosakata)/i.test(rows[0].ar)||/^(indonesia|arti|terjemah)/i.test(rows[0].ind)))rows.shift();
  const unsure=!sep&&!rows.every(r=>r.ind);
  return {rows,sep,unsure};
}
function validateData(c){return (!c.ar&&!c.ind)?'empty':(!c.ar||!c.ind)?'warn':'ok'}
function makeCards(){
  const t=$('inp').value;if(!t.trim()){msg('Tempel data kosakata terlebih dahulu.','err');return}
  const r=parseInput(t,$('sepbox').dataset.f);
  if(r.unsure&&!$('sepbox').dataset.f){$('sepbox').hidden=false;msg('Data belum dibuat. Pilih pemisah lalu tekan Terapkan.','warn');return}
  $('sepbox').hidden=true;delete $('sepbox').dataset.f;
  let rows=r.rows.map(x=>({k:++S.seq,ar:x.ar,ind:x.ind,img:null,ex:x.ex||'',bab:x.bab||''}));
  if($('ad').checked)rows=S.cards.concat(rows);
  if($('dd').checked){const seen=new Set();rows=rows.filter(x=>{if(seen.has(x.ar))return false;seen.add(x.ar);return true});}
  S.cards=rows;const bad=rows.filter(c=>validateData(c)!=='ok').length;
  const first=rows.findIndex(c=>validateData(c)!=='ok');
  msg(`${rows.length} kosakata ditemukan · ${rows.length} flashcard akan dibuat`+(bad?` · ${bad} data bermasalah (baris ${first+1}: belum lengkap)`:''),bad?'warn':'ok');
  renderDataTable();renderPreview();save();
}
function msg(t,c){$('msg').textContent=t;$('msg').className='msg '+(c||'')}

/* ---------- DATA TABLE ---------- */
function renderDataTable(){
  const LG=$('lang').value,H={ai:['Arab','Indonesia'],aa:['Arab (depan)','Arab (belakang)'],ii:['Indonesia (depan)','Indonesia (belakang)']}[LG];$('h1').textContent=H[0];$('h2').textContent=H[1];
  const ic={ok:'🟢',warn:'🟠',empty:'🔴'};
  $('tb').innerHTML=S.cards.map((c,i)=>`<tr data-i="${i}"><td style="white-space:nowrap"><span class="hd" title="Tahan lalu geser">⠿</span><button data-a="show" type="button" title="Lihat kartu">${i+1}</button></td><td><input type="text" class="${LG==='ii'?'':'ar'}" data-f="ar" placeholder="Arab" value="${esc(c.ar)}"></td><td><input type="text" class="${LG==='aa'?'ar':''}" data-f="ind" placeholder="Indonesia" value="${esc(c.ind)}"></td><td><input type="text" data-f="ex" value="${esc(c.ex||'')}" placeholder="Transliterasi"></td><td><input type="text" data-f="bab" placeholder="Bab" value="${esc(c.bab||'')}" style="min-width:60px"></td>
  <td>${c.img?`<img src="${c.img}" alt=""> <button data-a="noimg" type="button">✕</button>`:''}<label style="cursor:pointer">📷<input type="file" accept="image/*" data-a="img" hidden></label></td>
  <td class="st">${ic[validateData(c)]}</td><td style="white-space:nowrap"><button data-a="up" type="button">↑</button><button data-a="dn" type="button">↓</button><button data-a="dup" type="button">⧉</button><button data-a="del" type="button">✕</button></td></tr>`).join('');
  $('cnt').textContent=`(${S.cards.length} kartu)`;filterRows();refreshBab();
}
function filterRows(){const q=$('q').value.trim().toLowerCase();[...$('tb').rows].forEach(r=>{const c=S.cards[r.dataset.i];r.hidden=!!q&&!(c.ar.toLowerCase().includes(q)||c.ind.toLowerCase().includes(q))})}
function shrinkImg(file){return new Promise(res=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const m=900,s=Math.min(1,m/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=im.width*s;cv.height=im.height*s;cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.9))};im.src=fr.result};fr.readAsDataURL(file)})}
$('tb').addEventListener('input',e=>{const t=e.target,f=t.dataset.f;if(!f)return;const tr=t.closest('tr');S.cards[tr.dataset.i][f]=t.value;if(f==='bab')refreshBab();tr.querySelector('.st').textContent={ok:'🟢',warn:'🟠',empty:'🔴'}[validateData(S.cards[tr.dataset.i])];debRender()});
$('tb').addEventListener('change',async e=>{if(e.target.dataset.a==='img'&&e.target.files[0]){S.cards[e.target.closest('tr').dataset.i].img=await shrinkImg(e.target.files[0]);renderDataTable();renderPreview();save()}});
$('tb').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+b.closest('tr').dataset.i,a=b.dataset.a,C=S.cards;
  if(a==='show')return showCard(i);
  if(a==='del')C.splice(i,1);else if(a==='dup')C.splice(i+1,0,{...C[i],k:++S.seq});else if(a==='noimg')C[i].img=null;
  else if(a==='up'&&i>0)[C[i-1],C[i]]=[C[i],C[i-1]];else if(a==='dn'&&i<C.length-1)[C[i+1],C[i]]=[C[i],C[i+1]];else return;
  renderDataTable();renderPreview();save()});
$('add').onclick=()=>{S.cards.push({k:++S.seq,ar:'',ind:'',img:null});renderDataTable();renderPreview()};
$('clr').onclick=()=>{if(confirm('Hapus semua kartu?')){S.cards=[];renderDataTable();renderPreview();save()}};
$('q').oninput=filterRows;
$('sort').onchange=()=>{const v=$('sort').value,C=S.cards;
  if(v==='paste')C.sort((a,b)=>a.k-b.k);else if(v==='ar')C.sort((a,b)=>a.ar.localeCompare(b.ar,$('lang').value==='ii'?'id':'ar'));
  else if(v==='id')C.sort((a,b)=>a.ind.localeCompare(b.ind,'id'));else for(let i=C.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[C[i],C[j]]=[C[j],C[i]]}
  renderDataTable();renderPreview();save()};
$('sepok').onclick=()=>{$('sepbox').dataset.f=$('sepsel').value;makeCards()};

/* ---------- LAYOUT ---------- */
function gridFor(cpp,ori){const L={4:[2,2],6:[3,2],8:[4,2],9:[3,3]},[c,r]=L[cpp];return ori==='portrait'&&cpp!==4&&cpp!==9?[r,c]:[c,r]}
function cfg(){const o=cfgBase();o.ox=+$('ox').value||0;o.oy=+$('oy').value||0;o.sx=(+$('sx').value||100)/100;o.sy=(+$('sy').value||100)/100;o.cutm=$('cutm').value;if(TEST)Object.assign(o,{cutm:'both',tpl:'4',showT:true,title:'TES DUPLEX — ▲ ATAS KERTAS',cut:true,num:false,back:'txt'});return o}
function cfgBase(){return {ori:$('ori').value,cpp:+$('cpp').value,flip:$('flip').value,back:$('back').value,ipos:$('ipos').value,tpl:$('tpl').value,cm:$('cm').value,pal:+$('pal').value,num:$('num').checked,cut:$('cut').checked,showT:$('showT').checked,showEx:$('showEx').checked,exsz:+$('exsz').value,exp:$('exp').value,exauto:$('exauto').checked,exst:$('exst').value,exw:$('exw').value,exc:$('exc').value,title:$('title').value,wl:$('wl').value}}
function colorFor(i,k,g){if(g.cm==='single')return PAL[g.pal];if(g.cm==='alt')return PAL[i%(PAL.length-1)];return PAL[(Math.imul(k+3,2654435761)>>>0)%(PAL.length-1)]}
const dkOf=h=>'#'+[1,3,5].map(k=>Math.round(parseInt(h.substr(k,2),16)*.58+17*.42).toString(16).padStart(2,'0')).join('');
const ltOf=h=>'#'+[1,3,5].map(k=>Math.round(parseInt(h.substr(k,2),16)*.45+255*.55).toString(16).padStart(2,'0')).join('');
function renderCard(c,i,side,g){
  const LG=$('lang').value,fcl=LG==='ii'?'idn':'ar',bcl=LG==='aa'?'ar':'idn',exH=g.showEx&&c.ex?`<div class="ex" dir="auto" data-b="${g.exsz||6}" style="font-size:${g.exsz||6}mm;font-style:${g.exst||'normal'};font-weight:${g.exw||600}${g.exc?`;color:${g.exc==='dk'?'var(--dk)':g.exc};opacity:1`:''}">${esc(c.ex)}</div>`:'',exF=(g.exp||'front')!=='back'?exH:'',exB=(g.exp==='back'||g.exp==='both')?exH:'';
  const p=colorFor(i,c.k,g),no=g.num?`<i class="no">${String(i+1).padStart(2,'0')}</i>`:'';
  const st=`style="--c:${p[1]};--l:${p[2]};--dk:${dkOf(p[1])};--lt:${ltOf(p[1])}"`;
  const dots=g.tpl==="3"?["top:.9mm;left:.9mm","top:.9mm;right:.9mm","bottom:.9mm;left:.9mm","bottom:.9mm;right:.9mm"].map(x=>`<b class="cr" style="${x}"></b>`).join(""):"";
  const iw=g.back==='img'&&c.img,imF=iw&&g.ipos!=='back',imB=iw&&g.ipos!=='front',pic=`<div class="ib"><img src="${c.img}" alt=""></div>`;
  if(side==='f')return `<div class="card t${g.tpl}${g.wl?' tb'+g.wl:''}" ${st}><div class="in ${imF?'hasimg':''}">${imF?pic:''}<div class="fb"><span class="${fcl} fit">${esc(c.ar)}</span></div>${exF}</div>${dots}${no}</div>`;
  const im=imB;
  return `<div class="card t${g.tpl}${g.wl?' tb'+g.wl:''}" ${st}><div class="in ${im?'hasimg':''}">${im?`<div class="ib"><img src="${c.img}" alt=""></div>`:''}<div class="fb"><span class="${bcl} fit">${esc(c.ind)}</span></div>${exB}</div>${dots}${no}</div>`;
}
function renderFrontCard(c,i,g){return renderCard(c,i,'f',g)}
function renderBackCard(c,i,g){return renderCard(c,i,'b',g)}
function generateDuplexPages(g){
  const [cols,rows]=gridFor(g.cpp,g.ori),n=cols*rows,out=[];
  const mirrorCols=(g.ori==='portrait')===(g.flip==='long');
  const D=deck();for(let s=0;s<D.length;s+=n){
    const slots=[];for(let j=0;j<n;j++)slots.push(D[s+j]?{c:D[s+j],i:s+j}:null);
    let grid=[];for(let r=0;r<rows;r++)grid.push(slots.slice(r*cols,r*cols+cols));
    const back=mirrorCols?grid.map(r=>[...r].reverse()):[...grid].reverse();
    out.push({front:slots,back:back.flat()});
  }
  return out;
}
function pageHTML(slots,side,g,label){
  const [cols,rows]=gridFor(g.cpp,g.ori),W=g.ori==='portrait'?210:297,H=g.ori==='portrait'?297:210;
  const cells=slots.map(s=>s?renderCard(s.c,s.i,side,g):'<div class="card empty"></div>').join('');
  let cl='';if(g.cut&&(side==='f'||g.cutm==='both')){for(let k=0;k<=cols;k++)cl+=`<i class="cl v" style="left:calc(8mm + var(--ox,0mm) + ${k} * (var(--W) - 16mm) / ${cols})"></i>`;for(let k=0;k<=rows;k++)cl+=`<i class="cl h" style="top:calc(8mm + var(--oy,0mm) + ${k} * (var(--H) - 16mm) / ${rows})"></i>`}
  const ttl=g.showT&&g.title?`<div style="position:absolute;top:2.5mm;left:0;right:0;text-align:center;font:600 7pt Nunito;color:#666">${esc(g.title)}</div>`:'';
  let reg='';
  if(TEST){
    const cx=[4,W-4],cy=[4,H-4];
    cx.forEach(x=>cy.forEach(y=>{reg+=`<i style="position:absolute;z-index:20;left:${x-3}mm;top:${y-.1}mm;width:6mm;height:.2mm;background:#e11"></i><i style="position:absolute;z-index:20;left:${x-.1}mm;top:${y-3}mm;width:.2mm;height:6mm;background:#e11"></i>`}));
    let rl='';for(let m=0;m<=Math.floor((W-16)/2);m++){const L=m%5===0?3:1.5;rl+=`<i style="position:absolute;left:${8+m*2}mm;top:${H-8}mm;width:.15mm;height:${L}mm;background:#000"></i>`}
    let rv='';for(let m=0;m<=Math.floor((H-16)/2);m++){const L=m%5===0?3:1.5;rv+=`<i style="position:absolute;top:${8+m*2}mm;left:${W-8}mm;height:.15mm;width:${L}mm;background:#000"></i>`}
    reg+=`<div style="position:absolute;z-index:20;inset:0;pointer-events:none">${rl}${rv}</div>`;
  }
  const sc=side==='b'?`transform:scale(${g.sx||1},${g.sy||1});transform-origin:50% 50%;`:'';
  return `<div class="pgw"><div class="lbl">${label}</div><div class="page" style="--W:${W}mm;--H:${H}mm;--cols:${cols};--rows:${rows};position:relative${side==='b'?`;--ox:${g.ox}mm;--oy:${g.oy}mm`:''}"><div style="position:absolute;inset:0;${sc}"><div class="gw">${cells}</div>${cl}</div>${reg}${ttl}</div></div>`;
}
function parseRange(t){t=t.trim();if(!t)return()=>true;const R=t.split(',').map(x=>x.split('-').map(Number));return n=>R.some(([a,b])=>b==null?n===a:n>=a&&n<=(b||1e9))}
function generateA4Pages(){
  const g=cfg(),rg=parseRange($('prng').value),sd=$('pside').value,out=[];
  generateDuplexPages(g).forEach((p,k)=>{const a=k*2+1,b=k*2+2;
    if(sd!=='back'&&rg(a))out.push(pageHTML(p.front,'f',g,`HALAMAN ${a} — DEPAN`));
    if(sd!=='front'&&rg(b))out.push(pageHTML(p.back,'b',g,`HALAMAN ${b} — BELAKANG`))});
  return out.join('')||'<div class="lbl">Tidak ada halaman yang cocok dengan pilihan.</div>';
}

/* ---------- AUTO-FIT ---------- */
function calculateFontSize(span,box,max,min){
  let lo=min,hi=max,best=min;
  while(hi-lo>.5){const m=(lo+hi)/2;span.style.fontSize=m+'px';
    if(span.scrollWidth<=box.clientWidth+1&&span.offsetHeight<=box.clientHeight+1){best=m;lo=m}else hi=m}
  span.style.fontSize=best+'px';
}
function fitAll(){const o=document.documentElement.style.getPropertyValue('--z')||S.zoom;document.documentElement.style.setProperty('--z',1);try{fitRaw()}finally{document.documentElement.style.setProperty('--z',o)}}
function fitEx(root,auto){[...root.querySelectorAll('.ex')].forEach(e=>{let z=+e.dataset.b||6;e.style.fontSize=z+'mm';if(!auto)return;let n=0;while(n++<40&&z>2&&(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)){z*=.92;e.style.fontSize=z+'mm'}})}
function fitRaw(){fitEx(document.getElementById('pv'),$('exauto').checked);fitList([...document.querySelectorAll('#pv .fit')],$('fs').value==='uni')}
function fitList(all,uni){
  const els=all.filter(e=>e.textContent.trim()),k=$('fsz').value/100;
  const fits=els.map(sp=>{const box=sp.parentElement,ar=sp.classList.contains('ar');
    calculateFontSize(sp,box,ar?Math.min(320,box.clientHeight/1.7):Math.min(84,box.clientHeight/1.22),ar?24:12);return parseFloat(sp.style.fontSize)});
  if(uni)['ar','idn'].forEach(cl=>{const idx=els.map((e,i)=>e.classList.contains(cl)?i:-1).filter(i=>i>=0);
    const v=idx.map(i=>fits[i]).sort((a,b)=>a-b);if(!v.length)return;const u=v[Math.floor((v.length-1)*.3)];idx.forEach(i=>fits[i]=Math.min(fits[i],u))});
  els.forEach((e,i)=>e.style.fontSize=Math.max(9,fits[i]*k)+'px');
}
let tm;function debRender(){clearTimeout(tm);tm=setTimeout(renderPreview,350)}
function renderPreview(){
  const g=cfg();$('wso').hidden=!GAME;
  $('ps').textContent=`@page{size:A4 ${g.ori};margin:0}`;
  $('pv').style.setProperty('--af',$('af').value);
  if(GAME){$('pv').innerHTML=worksheetPages();$('pgc').textContent='(lembar latihan)';applyZoom();(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>0);return}
  if(!deck().length){$('pv').innerHTML='<div class="lbl">Belum ada kartu. Tempel data lalu tekan “Buat Flashcard”.</div>';$('pgc').textContent='';return}
  $('pv').innerHTML=generateA4Pages();
  const n=gridFor(g.cpp,g.ori).reduce((a,b)=>a*b);
  $('pgc').textContent=`(${Math.ceil(deck().length/n)*2} halaman)`;
  applyZoom();
  (document.fonts?document.fonts.ready:Promise.resolve()).then(fitAll);
  fitAll();
}
function applyZoom(){document.documentElement.style.setProperty('--z',S.zoom)}
$('zm').oninput=()=>{S.zoom=$('zm').value/100;applyZoom()};

/* ---------- EXPORT ---------- */
function printDocument(){if(!deck().length)return msg('Belum ada kartu.','err');
  if(NATIVE){msg('Cetak langsung belum tersedia di aplikasi Android. Membuat PDF: setelah lembar Bagikan terbuka, pilih Cetak atau simpan.','warn');return exportPDF()}
  fitAll();window.print()}
addEventListener('beforeprint',fitAll);
/* APK (Capacitor): berkas ditulis ke cache lalu lembar Bagikan dibuka (simpan ke Drive/File, kirim, atau cetak). Web: unduhan biasa. */
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const blobB64=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=()=>no(r.error);r.readAsDataURL(b)});
async function saveBlob(name,blob){
  if(NATIVE){
    const {Filesystem,Share}=Capacitor.Plugins,fn=name.replace(/[\\/:*?"<>|]+/g,'-');
    try{const f=await Filesystem.writeFile({path:fn,data:await blobB64(blob),directory:'CACHE'});await Share.share({title:fn,files:[f.uri]})}
    catch(e){const m=(e&&e.message)||String(e);if(!/cancel|dismiss/i.test(m))msg('Gagal menyimpan: '+m,'err')}
    return;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
}
async function capture(cb){
  if(!window.html2canvas)return msg('Pustaka ekspor (html2canvas) tidak termuat. Muat ulang halaman.','err');
  const old=S.zoom;S.zoom=1;applyZoom();if(document.fonts)await document.fonts.ready;await new Promise(r=>setTimeout(r,120));fitAll();
  try{const pgs=[...document.querySelectorAll('#pv .page')];for(let i=0;i<pgs.length;i++){msg(`Memproses halaman ${i+1}/${pgs.length}…`);await cb(await html2canvas(pgs[i],{scale:3,backgroundColor:'#fff',useCORS:true,scrollX:0,scrollY:-window.scrollY,onclone:d=>{const w=d.getElementById('pvw');w.style.overflow='visible';w.style.maxHeight='none';d.getElementById('pv').style.zoom=1}}),i)}msg('Selesai.','ok')}
  catch(e){msg('Ekspor gagal: '+e.message,'err')}finally{S.zoom=old;applyZoom()}
}
async function exportPDF(){
  if(!deck().length&&!GAME)return msg('Belum ada kartu.','err');
  if(!window.jspdf)return msg('Pustaka PDF (jsPDF) tidak termuat. Muat ulang halaman.','err');
  const g=cfg(),o=g.ori==='portrait'?'p':'l',mk=()=>new jspdf.jsPDF({orientation:o,unit:'mm',format:'a4'}),ch=(+$('chunk').value||1e9),total=document.querySelectorAll('#pv .page').length,nm=g.title||'flashcard';
  let pdf=mk(),part=1,cnt=0;
  await capture(async(cv,i)=>{if(cnt>0)pdf.addPage('a4',o);pdf.addImage(cv.toDataURL('image/jpeg',.93),'JPEG',0,0,o==='p'?210:297,o==='p'?297:210);cnt++;
    if(cnt>=ch||i===total-1){await saveBlob(nm+'-A4'+(total>ch?`-bagian${part}`:'')+'.pdf',pdf.output('blob'));part++;cnt=0;pdf=mk()}});
}
async function exportPNG(){
  if(!deck().length&&!GAME)return msg('Belum ada kartu.','err');
  await capture(async(cv,i)=>{const b=await new Promise(r=>cv.toBlob(r));await saveBlob(`halaman-${i+1}.png`,b)});
}
$('pr').onclick=printDocument;$('pdf').onclick=exportPDF;$('png').onclick=exportPNG;

/* ---------- GAMBAR MASSAL & TES DUPLEX ---------- */
async function bulkImages(files){
  const norm=t=>t.toLowerCase().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,' ').trim();let m=0,un=[];
  for(const f of files){const n=norm(f.name),c=S.cards.find(c=>c.ind&&norm(c.ind)===n)||S.cards.find(c=>c.ind&&norm(c.ind)&&(n.startsWith(norm(c.ind)+' ')||n.endsWith(' '+norm(c.ind))));
    if(c){c.img=await shrinkImg(f);m++}else un.push(f.name)}
  msg(`${m} gambar dipasang`+(un.length?` · tidak cocok: ${un.slice(0,5).join(', ')}${un.length>5?'…':''} (beri nama file sama dengan terjemahan, mis. buku.jpg)`:''),un.length?'warn':'ok');
  renderDataTable();renderPreview();save();
}
$('bimg').onclick=()=>$('bimgf').click();
$('bimgf').onchange=e=>{bulkImages([...e.target.files]);e.target.value=''};
$('tst').onclick=()=>{TEST=!TEST;if(TEST){GAME=false;$('gm').textContent='🎮 Lembar latihan'}$('tst').textContent=TEST?'↩ Kembali ke kartu':'🧪 Tes duplex';
  msg(TEST?'Mode tes: cetak 2 sisi, lalu terawang ke cahaya. Angka depan dan belakang harus bertumpuk. Jika tidak, ganti mode printer. Jika bergeser: baca selisih garis silang merah (pojok) dan penggaris (tiap garis panjang = 10 mm) lalu isi “Geser X/Y”; jika pojok kiri pas tapi kanan/bawah meleset, isi “Skala belakang” (mis. selisih 1 mm dari 194 mm ≈ 100.5%).':'',TEST?'warn':'');renderPreview()};

/* ---------- FITUR TAMBAHAN ---------- */
function refreshBab(){const sel=$('babf'),cur=sel.value,bs=[...new Set(S.cards.map(c=>c.bab).filter(Boolean))];
  sel.innerHTML='<option value="">Semua</option>'+bs.map(b=>`<option>${esc(b)}</option>`).join('');sel.value=bs.includes(cur)?cur:''}
function showCard(i){const g=cfg(),[cols,rows]=gridFor(g.cpp,g.ori),W=g.ori==='portrait'?210:297,H=g.ori==='portrait'?297:210,cw=(W-16)/cols,ch=(H-16)/rows,c=S.cards[i];
  const z=Math.min(1.3,(innerWidth-56)/((cw*3.78)*2+16));
  $('cbox').innerHTML=['f','b'].map(sd=>`<div class="pv1" style="width:${cw}mm;height:${ch}mm;zoom:${z}">${renderCard(c,i,sd,g)}</div>`).join('');
  $('cdlg').showModal();fitEx($('cbox'),$('exauto').checked);fitList([...$('cbox').querySelectorAll('.fit')],false)}
$('cx').onclick=()=>$('cdlg').close();
let dragI=null;
$('tb').addEventListener('pointerdown',e=>{if(e.target.classList.contains('hd'))e.target.closest('tr').draggable=true});
$('tb').addEventListener('dragstart',e=>{dragI=+e.target.closest('tr').dataset.i;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','x')});
$('tb').addEventListener('dragover',e=>e.preventDefault());
$('tb').addEventListener('drop',e=>{e.preventDefault();const tr=e.target.closest('tr');if(!tr||dragI==null)return;const [c]=S.cards.splice(dragI,1);S.cards.splice(+tr.dataset.i,0,c);dragI=null;renderDataTable();renderPreview();save()});
$('tb').addEventListener('dragend',e=>{if(e.target.draggable)e.target.draggable=false});
const EMO='buku:\u{1F4D6},pena:\u{1F58A}\u{FE0F},pensil:\u{270F}\u{FE0F},penggaris:\u{1F4CF},tas:\u{1F392},sekolah:\u{1F3EB},rumah:\u{1F3E0},mobil:\u{1F697},bus:\u{1F68C},sepeda:\u{1F6B2},kereta:\u{1F686},pesawat:\u{2708}\u{FE0F},kapal:\u{1F6A2},kursi:\u{1FA91},pintu:\u{1F6AA},jendela:\u{1FA9F},jam:\u{23F0},lampu:\u{1F4A1},kunci:\u{1F511},telepon:\u{1F4F1},komputer:\u{1F4BB},uang:\u{1F4B0},air:\u{1F4A7},api:\u{1F525},matahari:\u{2600}\u{FE0F},bulan:\u{1F319},bintang:\u{2B50},awan:\u{2601}\u{FE0F},hujan:\u{1F327}\u{FE0F},pohon:\u{1F333},bunga:\u{1F338},apel:\u{1F34E},pisang:\u{1F34C},roti:\u{1F35E},susu:\u{1F95B},nasi:\u{1F35A},telur:\u{1F95A},kue:\u{1F370},masjid:\u{1F54C},kabah:\u{1F54B},dokter:\u{1F9D1}\u{200D}\u{2695}\u{FE0F},rumah sakit:\u{1F3E5},gunung:\u{26F0}\u{FE0F},laut:\u{1F30A},mata:\u{1F441}\u{FE0F},telinga:\u{1F442},hidung:\u{1F443},mulut:\u{1F444},tangan:\u{270B},kaki:\u{1F9B6},hati:\u{2764}\u{FE0F},gigi:\u{1F9B7},topi:\u{1F9E2},sepatu:\u{1F45F},baju:\u{1F455},kacamata:\u{1F453},payung:\u{2602}\u{FE0F},sapu:\u{1F9F9},sendok:\u{1F944},garpu:\u{1F374},pisau:\u{1F52A},gelas:\u{1F95B},piring:\u{1F37D}\u{FE0F},kasur:\u{1F6CF}\u{FE0F},bola:\u{26BD},gitar:\u{1F3B8},dunia:\u{1F30D},peta:\u{1F5FA}\u{FE0F},surat:\u{2709}\u{FE0F},bendera:\u{1F6A9},hadiah:\u{1F381},singa:\u{1F981},harimau:\u{1F42F},gajah:\u{1F418},jerapah:\u{1F992},kuda:\u{1F434},sapi:\u{1F404},kerbau:\u{1F403},domba:\u{1F411},kambing:\u{1F410},anjing:\u{1F415},kucing:\u{1F408},kelinci:\u{1F407},tikus:\u{1F401},beruang:\u{1F43B},monyet:\u{1F412},serigala:\u{1F43A},rubah:\u{1F98A},ayam:\u{1F414},bebek:\u{1F986},ikan:\u{1F41F},burung:\u{1F426},ular:\u{1F40D},katak:\u{1F438},kupu-kupu:\u{1F98B},lebah:\u{1F41D},semut:\u{1F41C},buaya:\u{1F40A},kura-kura:\u{1F422},zebra:\u{1F993},babi:\u{1F416},unta:\u{1F42A}';
function emojiImg(e){const cv=document.createElement('canvas');cv.width=cv.height=360;const x=cv.getContext('2d');x.font='270px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(e,180,195);return cv.toDataURL('image/png')}
$('aimg').onclick=()=>{const map=Object.fromEntries(EMO.split(',').map(t=>t.split(':')));let m=0;
  S.cards.forEach(c=>{if(c.img)return;const k=c.ind.toLowerCase().trim(),e=map[k]||map[k.replace(/^(si|sang|seekor|sebuah|sebuah|se)\s+/,'')];if(e){c.img=emojiImg(e);m++}});
  msg(`${m} gambar emoji dipasang (kata umum saja). Atur letaknya di “Posisi gambar” (depan/belakang/keduanya).`,m?'ok':'warn');if(m)$('back').value='img';renderDataTable();renderPreview();save()};
const PRE={k13:{tpl:1,cpp:4,cm:'alt',fs:'uni',fsz:95,back:'img',exsz:8,exp:'front',exw:'800',exst:'normal'},k46:{tpl:5,cpp:6,cm:'alt',fs:'uni',fsz:88,back:'img',exsz:6.5,exp:'front',exw:'600',exst:'normal'},smp:{tpl:4,cpp:8,cm:'single',fs:'uni',fsz:85,back:'txt',exsz:5.5,exp:'front',exw:'600',exst:'italic'},prem:{tpl:8,cpp:9,cm:'single',fs:'uni',fsz:85,back:'txt',exsz:5,exp:'front',exw:'400',exst:'italic'}};
$('preset').onchange=()=>{const q=PRE[$('preset').value];if(!q)return;for(const k in q)$(k).value=q[k];$('exszv').textContent=$('exsz').value;renderPreview();save()};
/* ---------- TEMPLATE DATA ---------- */
const TPL=[['Arab','Indonesia','Transliterasi','Bab'],['\u0623\u064E\u0633\u064E\u062F\u064C','Singa','asadun','Hewan'],['\u0646\u064E\u0645\u0650\u0631\u064C','Harimau','namirun','Hewan'],['\u0641\u0650\u064A\u0644\u064C','Gajah','f\u012Blun','Hewan'],['\u0643\u0650\u062A\u064E\u0627\u0628\u064C','Buku','kit\u0101bun','Sekolah'],['\u0642\u064E\u0644\u064E\u0645\u064C','Pena','qalamun','Sekolah'],['\u0645\u064E\u062F\u0652\u0631\u064E\u0633\u064E\u0629\u064C','Sekolah','madrasatun','Sekolah']];
$('tplcsv').onclick=()=>saveBlob('template-kosakata-arab.csv',new Blob(['\uFEFF'+TPL.map(r=>r.map(x=>'"'+x.replace(/"/g,'""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
$('tplex').onclick=()=>{$('inp').value=TPL.slice(1).map(r=>r.join('\t')).join('\n');msg('Contoh dimasukkan. Tekan “Buat Flashcard” untuk mencoba.','ok')};

/* ---------- TRANSLITERASI OTOMATIS ---------- */
const TRM={'\u0628':'b','\u062A':'t','\u062B':'ts','\u062C':'j','\u062D':'h','\u062E':'kh','\u062F':'d','\u0630':'dz','\u0631':'r','\u0632':'z','\u0633':'s','\u0634':'sy','\u0635':'sh','\u0636':'dh','\u0637':'th','\u0638':'zh','\u0639':"'",'\u063A':'gh','\u0641':'f','\u0642':'q','\u0643':'k','\u0644':'l','\u0645':'m','\u0646':'n','\u0647':'h','\u0648':'w','\u064A':'y','\u0621':"'",'\u0626':"'",'\u0624':"'",'\u0623':"'",'\u0625':"'",'\u0629':'t','\u067E':'p','\u0686':'c','\u06A4':'v','\u06AF':'g','\u06A9':'k','\u06CC':'y'};
const TRV={'\u064E':'a','\u064F':'u','\u0650':'i','\u064B':'an','\u064C':'un','\u064D':'in','\u0670':'\u0101'};
const TRSUN=new Set('\u062A\u062B\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0644\u0646');
function trWord(w){
  const U=[];
  for(const ch of w.replace(/\u0640/g,'')){
    if(TRV[ch]){if(U.length)U[U.length-1].v=TRV[ch]}
    else if(ch==='\u0651'){if(U.length)U[U.length-1].sh=1}
    else if(ch==='\u0652'){if(U.length)U[U.length-1].sk=1}
    else if(/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch)){}
    else U.push({c:ch,v:'',sh:0,sk:0});
  }
  let out='',k=0,skipDbl=-1;
  if(U.length>2&&(U[0].c==='\u0627'||U[0].c==='\u0671')&&U[1].c==='\u0644'&&!U[1].v){
    if(TRSUN.has(U[2].c)){out='a'+TRM[U[2].c]+'-';skipDbl=2}else out='al-';
    k=2;
  }
  const fix=(re,to)=>{out=out.replace(re,to)};
  for(;k<U.length;k++){
    const u=U[k],c=u.c,p=k>0?U[k-1]:null,last=k===U.length-1;
    if(c==='\u0622'){out+=k===0?'\u0101':"'\u0101";continue}
    if(c==='\u0627'||c==='\u0671'){
      if(u.v){out+=(k===0?'':"'")+u.v;continue}
      if(p&&p.v==='a'&&/a$/.test(out)){fix(/a$/,'\u0101')}
      else if(k===0)out+='a';
      continue;
    }
    if(c==='\u0649'){if(p&&p.v==='a'&&/a$/.test(out))fix(/a$/,'\u0101');continue}
    if((c==='\u0648'||c==='\u064A'||c==='\u06CC')&&!u.v&&p){
      const y=c!=='\u0648';
      if(!y&&p.v==='u'&&/u$/.test(out)){fix(/u$/,'\u016B');continue}
      if(y&&p.v==='i'&&/i$/.test(out)){fix(/i$/,'\u012B');continue}
      if(p.v==='a'&&/a$/.test(out)&&(u.sk||last||true)){fix(/a$/,y?'ay':'aw');continue}
    }
    let cons=TRM[c];if(cons===undefined){out+=c;continue}
    if(c==='\u0629')cons=(u.v||!last)?'t':'h';
    if('\u0623\u0625\u0626\u0624\u0621'.includes(c)&&k===0)cons='';
    let t=cons;
    if(u.sh&&cons&&k!==skipDbl)t=cons+cons;
    out+=t+u.v;
  }
  return out;
}
function transliterate(str){return str.split(/(\s+)/).map(x=>/\S/.test(x)?trWord(x):x).join('').trim()}
$('atr').onclick=()=>{
  if(!S.cards.length)return msg('Belum ada kartu.','err');
  const arCol=$('lang').value!=='ii';
  const filled=S.cards.filter(c=>c.ex).length;
  let over=false;if(filled&&filled===S.cards.length)over=confirm('Semua transliterasi sudah terisi. Timpa dengan hasil otomatis?');
  let n=0,noH=0;
  S.cards.forEach(c=>{if(!arCol||!c.ar||(c.ex&&!over))return;
    if(!/[\u064B-\u0652]/.test(c.ar))noH++;
    const t=transliterate(c.ar);if(t){c.ex=t;n++}});
  msg(`${n} transliterasi diisi otomatis.`+(noH?` ${noH} kata tanpa harakat, hasilnya kurang akurat.`:' Periksa lagi hasilnya bila perlu, lalu edit manual.'),noH?'warn':'ok');
  renderDataTable();renderPreview();save()};

/* ---------- IMPOR CSV ---------- */
function parseCSV(t){
  t=t.replace(/^\uFEFF/,'');
  const first=t.split(/\r?\n/,1)[0]||'';
  const d=[['\t',(first.match(/\t/g)||[]).length],[';',(first.match(/;/g)||[]).length],[',',(first.match(/,/g)||[]).length]].sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"')q=true;
    else if(ch===d){row.push(cur);cur=''}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cur);cur='';rows.push(row);row=[]}
    else cur+=ch}
  if(cur!==''||row.length){row.push(cur);rows.push(row)}
  return rows.filter(r=>r.some(x=>x.trim()));
}
$('csvb').onclick=()=>$('csvf').click();
$('csvf').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  if(/\.xlsx?$/i.test(file.name))return msg('File Excel belum bisa dibaca langsung. Di Excel: File → Simpan Sebagai → CSV UTF-8, lalu impor file CSV-nya.','warn');
  const rows=parseCSV(await file.text());
  if(!rows.length)return msg('File kosong.','err');
  let map={ar:0,ind:1,ex:2,bab:3},start=0;
  const h=rows[0].map(x=>x.trim().toLowerCase());
  if(h.some(x=>/arab|\u0639\u0631\u0628|indo|translit|latin|bab|tambahan/.test(x))){
    start=1;const find=re=>h.findIndex(x=>re.test(x));
    map={ar:find(/arab|\u0639\u0631\u0628/),ind:find(/indo|arti|terjemah/),ex:find(/translit|latin|tambahan/),bab:find(/bab|unit/)};
    if(map.ar<0)map.ar=0;if(map.ind<0)map.ind=map.ar===0?1:0;
  }
  const get=(r,i)=>i>=0&&r[i]!==undefined?r[i].trim():'';
  let out=rows.slice(start).map(r=>({k:++S.seq,ar:get(r,map.ar),ind:get(r,map.ind),img:null,ex:get(r,map.ex),bab:get(r,map.bab)})).filter(c=>c.ar||c.ind);
  if($('ad').checked)out=S.cards.concat(out);
  if($('dd').checked){const seen=new Set();out=out.filter(x=>{if(seen.has(x.ar))return false;seen.add(x.ar);return true})}
  S.cards=out;msg(`${out.length} kartu dari CSV${start?' (baris judul dikenali)':''}. Kolom: Arab, Indonesia, Transliterasi, Bab.`,'ok');
  renderDataTable();renderPreview();save()};

let WS_SEED=1;
function mkRng(a){return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function worksheetPages(){
  const g=cfg(),LG=$('lang').value,MD=$('wsm').value,KEY=$('wsk').checked,W=g.ori==='portrait'?210:297,H=g.ori==='portrait'?297:210,D=deck(),M=10,HH=12,avail=H-2*M-HH,R=mkRng(WS_SEED);
  const L='abcdefghijklmnopqrstuvwxyz',out=[];
  if(!D.length)return '<div class="lbl">Belum ada kartu.</div>';
  const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=R()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
  const lc=LG==='ii'?'tx':'ar',rc=LG==='aa'?'ar':'tx',qf=c=>lc==='ar'?c.ar:c.ind,af=c=>rc==='ar'?c.ar:c.ind;
  const stl=(c,sz)=>c==='ar'?` style="font-size:${sz}pt"`:'';
  const red=t=>`<em class="ws-k">${t}</em>`;
  const hint={match:'Jodohkan tulisan di kiri dengan artinya di kanan. Tulis huruf jawaban di dalam tanda kurung.',fill:'Tulis arti kata berikut pada garis yang tersedia.',mcq:'Pilih jawaban yang paling tepat dengan melingkari huruf a, b, c, atau d.'}[MD];
  const rh0=MD==='mcq'?17:MD==='fill'?13:12,nmax=Math.min(26,Math.floor(avail/rh0)),pages=Math.ceil(D.length/nmax),N=Math.ceil(D.length/pages);
  const rh=MD==='match'?Math.min(16,avail/N):rh0,asz=Math.min(22,rh*1.55).toFixed(1);
  for(let s=0;s<D.length;s+=N){
    const ch=D.slice(s,s+N),rows=[];
    if(MD==='match'){
      const sh=shuf(ch.map((c,i)=>i));
      for(let i=0;i<ch.length;i++)rows.push(`<div class="ws-c l" style="height:${rh}mm"><b>${s+i+1}.</b><span class="${lc}"${stl(lc,asz)}>${esc(qf(ch[i]))}</span><i>(${KEY?red(L[sh.indexOf(i)]):'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'})</i></div><div class="ws-c r" style="height:${rh}mm"><b>${L[i]}.</b><span class="${rc}"${stl(rc,asz)}>${esc(af(ch[sh[i]]))}</span></div>`);
    }else if(MD==='fill'){
      ch.forEach((c,i)=>rows.push(`<div class="ws-c l" style="height:${rh}mm"><b>${s+i+1}.</b><span class="${lc}" style="flex:0 0 38%;${lc==='ar'?`font-size:${asz}pt`:''}">${esc(qf(c))}</span><u class="ws-ln">${KEY?red(esc(af(c))):''}</u></div>`));
    }else{
      ch.forEach((c,i)=>{
        const ans=af(c),pool=shuf(D.filter(x=>af(x)!==ans&&af(x))).map(af).filter((t,j,a)=>a.indexOf(t)===j).slice(0,3),opts=shuf([ans,...pool]);
        const o=opts.map((t,j)=>{const isK=KEY&&t===ans;return `<span class="${rc}${isK?' ws-k':''}"${stl(rc,15)}>${L[j]}. ${esc(t)}</span>`}).join('');
        rows.push(`<div class="ws-c l" style="height:${rh}mm"><b>${s+i+1}.</b><span class="${lc}" style="flex:0 0 30%;${lc==='ar'?'font-size:20pt':''}">${esc(qf(c))}</span><div class="ws-o">${o}</div></div>`)});
    }
    const right=KEY?'<span class="ws-k">KUNCI JAWABAN</span>':'<span>Nama: <u style="width:38mm"></u> &nbsp;Kelas: <u style="width:14mm"></u></span>';
    out.push(`<div class="pgw"><div class="lbl">LEMBAR LATIHAN ${s/N+1}${KEY?' — KUNCI':''}</div><div class="page ws" style="--W:${W}mm;--H:${H}mm"><div class="ws-h"><div><b>${esc(g.title||'Latihan Kosakata')}</b><small>${hint}</small></div>${right}</div><div class="ws-g"${MD==='match'?'':' style="grid-template-columns:1fr"'}>${rows.join('')}</div></div></div>`);
  }
  return out.join('');
}
$('gm').onclick=()=>{GAME=!GAME;if(GAME&&TEST){TEST=false;$('tst').textContent='🧪 Tes duplex'}$('gm').textContent=GAME?'↩ Kembali ke kartu':'🎮 Lembar latihan';msg(GAME?'Pilih jenis latihan di sebelah tombol. Centang “Kunci jawaban” untuk versi guru (urutan soal sama).':'','ok');renderPreview()};


/* ---------- MODE BELAJAR & AUDIO ---------- */
const ST={q:[],i:0,f:false,rev:false,ok:new Set()};
function speak(t){if(!t)return;if(!('speechSynthesis' in window))return msg('Browser ini tidak mendukung suara.','warn');
  try{speechSynthesis.cancel();const vs=speechSynthesis.getVoices(),v=vs.find(x=>/^ar/i.test(x.lang)),u=new SpeechSynthesisUtterance(t);u.lang='ar-SA';u.rate=.8;if(v)u.voice=v;else if(vs.length)msg('Suara Arab belum terpasang di perangkat ini (pasang di pengaturan bahasa/teks-ke-suara).','warn');speechSynthesis.speak(u)}catch(e){}}
function stRender(){
  const q=ST.q,c=q[ST.i],box=$('stc');
  if(!c){const n=q.length,h=q.filter(x=>ST.ok.has(x.k)).length;$('stp').textContent='Selesai';
    box.innerHTML=`<div style="font-size:22px;font-weight:800">Hafal ${h} dari ${n} kartu</div>${h<n?'<button id="st_re" class="pri" type="button">Ulangi yang belum</button>':'<div>🎉 Semua sudah hafal!</div>'}`;
    const b=$('st_re');if(b)b.onclick=e=>{e.stopPropagation();ST.q=q.filter(x=>!ST.ok.has(x.k));ST.i=0;ST.f=false;stRender()};return}
  const showAr=ST.rev===ST.f;$('stp').textContent=`${ST.i+1}/${q.length} · hafal ${q.filter(x=>ST.ok.has(x.k)).length}`;
  const gi=$('back').value==='img'&&c.img,ip=$('ipos').value,img=`<img src="${c.img}" alt="">`;
  box.innerHTML=showAr?`${gi&&ip!=='back'?img:''}<div class="ar" style="font-size:54px">${esc(c.ar)}</div>${c.ex?`<small>${esc(c.ex)}</small>`:''}`:`${gi&&ip!=='front'?img:''}<div class="idn">${esc(c.ind)}</div>`;
  if(showAr&&$('st_au').checked)speak(c.ar)}
function stGo(d){ST.i=Math.max(0,Math.min(ST.q.length,ST.i+d));ST.f=false;stRender()}
function stMark(ok){const c=ST.q[ST.i];if(!c)return;ok?ST.ok.add(c.k):ST.ok.delete(c.k);stGo(1)}
function stStart(shuffle){ST.q=[...deck()].filter(c=>c.ar||c.ind);if(shuffle)for(let i=ST.q.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[ST.q[i],ST.q[j]]=[ST.q[j],ST.q[i]]}ST.i=0;ST.f=false;ST.ok=new Set();stRender()}
$('stb0').onclick=()=>{if(!deck().length)return msg('Belum ada kartu.','err');stStart(false);$('sdlg').showModal()};
$('stx').onclick=()=>{window.speechSynthesis&&speechSynthesis.cancel();$('sdlg').close()};
$('stc').onclick=()=>{if(ST.q[ST.i]){ST.f=!ST.f;stRender()}};$('st_f').onclick=()=>$('stc').click();
$('st_p').onclick=()=>stGo(-1);$('st_n').onclick=()=>stGo(1);$('st_ok').onclick=()=>stMark(true);$('st_no').onclick=()=>stMark(false);
$('st_s').onclick=()=>speak((ST.q[ST.i]||{}).ar);$('st_sh').onclick=()=>stStart(true);$('st_rv').onclick=()=>{ST.rev=!ST.rev;ST.f=false;stRender()};
$('sdlg').addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT')return;if(e.key==='ArrowRight')stGo(1);else if(e.key==='ArrowLeft')stGo(-1);else if(e.key===' '){e.preventDefault();$('stc').click()}});
['wsm','wsk'].forEach(id=>$(id).addEventListener('input',renderPreview));
$('wsr').onclick=()=>{WS_SEED=(Math.random()*1e9)|0;renderPreview()};


/* ---------- TEMA: galeri, warna kustom, mode gelap ---------- */
const tint=h=>'#'+[1,3,5].map(k=>Math.round(parseInt(h.substr(k,2),16)*.12+255*.88).toString(16).padStart(2,'0')).join('');
function setCustom(h){const c=PAL[PAL.length-1];c[1]=h;c[2]=tint(h)}
$('cpc').oninput=e=>{setCustom(e.target.value);$('pal').value=PAL.length-1;$('cm').value='single';renderPreview();save()};
const CF=new Set('61,62,63,64,65,66,67,68,69,71,74,78,79,81,82,83,86,87,88,89,90,1,2,3,4,5,6,7,11,12,14,15,16,21,22,32,36,37,38,39,53,54,60'.split(','));
$('galb').onclick=()=>{
  const g={...cfg(),cm:'single',showEx:false,num:false,cut:false},cur=$('tpl').value;
  $('gal').innerHTML=[...$('tpl').options].map(o=>`<div class="gi${o.value===cur?' on':''}" data-v="${o.value}" tabindex="0" role="button"><div class="gc">${renderCard({k:+o.value,ar:'\u0645\u064E\u0631\u0652\u062D\u064E\u0628\u064B\u0627',ind:'Halo',img:null,ex:''},0,'f',{...g,tpl:o.value})}</div>${CF.has(o.value)?'🎨 ':''}${esc(o.textContent)}</div>`).join('');
  $('gdlg').showModal()};
const pick=e=>{const t=e.target.closest('.gi');if(!t)return;$('tpl').value=t.dataset.v;$('tpl').dispatchEvent(new Event('input'));$('gdlg').close()};
$('gal').onclick=pick;$('gal').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(e)}};
$('gx').onclick=()=>$('gdlg').close();

/* ---------- STORAGE ---------- */
function projectJSON(){const g=cfg();return {title:g.title,cards:S.cards.map(c=>({arabic:c.ar,indonesian:c.ind,image:c.img,extra:c.ex,bab:c.bab})),settings:{paper:'A4',orientation:g.ori,cardsPerPage:g.cpp,flip:g.flip,back:g.back,template:g.tpl,colorMode:g.cm,palette:g.pal,numbers:g.num,cutLines:g.cut,showTitle:g.showT,language:$('lang').value,offsetX:g.ox,offsetY:g.oy,scaleX:$('sx').value,scaleY:$('sy').value,cutMode:$('cutm').value,exSize:g.exsz||6,exPos:g.exp,exAuto:g.exauto,exStyle:g.exst,exWeight:g.exw,exColor:g.exc,arabicFont:$('af').value,customColor:$('cpc').value,imgPos:$('ipos').value,bgTint:g.wl}}}
function applyProject(p){
  const s=p.settings||{};$('title').value=p.title||'';S.cards=(p.cards||[]).map(c=>({k:++S.seq,ar:c.arabic||'',ind:c.indonesian||'',img:c.image||null,ex:c.extra||'',bab:c.bab||''}));
  $('ori').value=s.orientation||'portrait';$('cpp').value=s.cardsPerPage||6;$('flip').value=s.flip||'long';$('back').value=s.back||'img';$('tpl').value=s.template||1;$('cm').value=s.colorMode||'single';$('pal').value=s.palette||0;
  $('num').checked=s.numbers!==false;$('cut').checked=s.cutLines!==false;$('showT').checked=!!s.showTitle;$('lang').value=s.language||'ai';$('ox').value=s.offsetX||0;$('oy').value=s.offsetY||0;$('sx').value=s.scaleX||100;$('sy').value=s.scaleY||100;$('cutm').value=s.cutMode||'front';if(s.arabicFont)$('af').value=s.arabicFont;$('wl').value=s.bgTint||'';$('ipos').value=s.imgPos||'back';if(s.customColor){$('cpc').value=s.customColor;setCustom(s.customColor)}$('exsz').value=s.exSize||6;$('exszv').textContent=$('exsz').value;$('exp').value=s.exPos||'front';$('exauto').checked=s.exAuto!==false;$('exst').value=s.exStyle||'normal';$('exw').value=s.exWeight||'600';$('exc').value=s.exColor||'';
  renderDataTable();renderPreview();
}
function save(){try{localStorage.setItem('afm-a4',JSON.stringify(projectJSON()))}catch(e){}}
function loadLocal(){try{const j=localStorage.getItem('afm-a4');if(j)applyProject(JSON.parse(j))}catch(e){}}
function dialog(t,txt,mode){$('dt').textContent=t;$('dta').value=txt;$('dta').readOnly=mode==='save';$('dok').hidden=mode==='save';$('dfi').hidden=mode==='save';$('dcp').hidden=mode!=='save';$('dlg').dataset.m=mode;$('dlg').showModal()}
$('sv').onclick=async()=>{const j=JSON.stringify(projectJSON(),null,1);dialog('Simpan Proyek (JSON)',j,'save');try{await saveBlob((cfg().title||'proyek')+'.json',new Blob([j],{type:'application/json'}))}catch(e){}};
$('ld').onclick=()=>dialog('Buka Proyek — tempel JSON atau pilih file','','load');
$('dok').onclick=()=>{try{applyProject(JSON.parse($('dta').value));$('dlg').close();save()}catch(e){alert('JSON tidak valid.')}};
$('dcp').onclick=()=>{$('dta').select();try{navigator.clipboard.writeText($('dta').value)}catch(e){document.execCommand('copy')}};
$('dcl').onclick=()=>$('dlg').close();
$('dfi').onchange=async e=>{if(e.target.files[0])$('dta').value=await e.target.files[0].text()};

/* ---------- INIT ---------- */
$('pal').innerHTML=PAL.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
['ori','cpp','flip','back','tpl','cm','pal','wl','ipos','num','cut','showT','title','fs','fsz','ox','oy','sx','sy','cutm','af','lang','showEx','exsz','exp','exauto','exst','exw','exc','pside','prng','babf'].forEach(id=>$(id).addEventListener('input',()=>{$('exszv').textContent=$('exsz').value;renderPreview();save()}));
(()=>{let d=null;try{d=localStorage.getItem('afm-dk')}catch(e){}if(d===null)d=matchMedia('(prefers-color-scheme: dark)').matches?'1':'0';document.body.classList.toggle('dark',d==='1')})();
$('dk').onclick=()=>{const d=document.body.classList.toggle('dark');try{localStorage.setItem('afm-dk',d?'1':'0')}catch(e){}};
$('mk').onclick=makeCards;$('lang').addEventListener('input',renderDataTable);
S.zoom=innerWidth<700?.4:innerWidth>=1100?.6:.5;$('zm').value=S.zoom*100;
loadLocal();if(!S.cards.length)renderPreview();
/* UX: panduan format menutup sendiri begitu sudah ada data; Ctrl/Cmd+Enter = Buat Flashcard */
if(S.cards.length)$('gd').open=false;
$('inp').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();makeCards()}});

/* ---------- OFFLINE (hanya web; di APK semua berkas sudah lokal) ---------- */
if('serviceWorker' in navigator&&!NATIVE&&/^https?:$/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
