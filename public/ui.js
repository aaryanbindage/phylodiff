// ===== UI =====
const $=id=>document.getElementById(id);
const st={A:null,B:null,slot:'A',mode:'split',norm:false,tint:true,spin:true,hl:null,diff:null,sum:null,fit:3,unit:1,showAll:false};
const T={};
function readTheme(){const cs=getComputedStyle(document.documentElement);['bg','panel','ink','mute','line','accent','add','del','mod','a','b','view','grid'].forEach(k=>T[k]=cs.getPropertyValue('--'+k).trim());}
Object.assign(PART,{legML:'Middle left leg',legMR:'Middle right leg',abdomen:'Abdomen',wingL:'Left wing',wingR:'Right wing',antL:'Left antenna',antR:'Right antenna',capsid:'Protein shell',bell:'Bell',shell:'Shell',shellL:'Left shell',shellR:'Right shell',cap:'Cap',stem:'Stem',stipe:'Stalk',trunk:'Trunk',crown:'Crown',crown2:'Second crown',flagellum:'Flagellum',nucleus:'Nucleus',finL:'Left fin',finR:'Right fin',capL:'Rod end (front)',capR:'Rod end (back)',center:'Flower centre',tube1:'Tube 1',tube2:'Tube 2',tuft1:'Tuft 1',tuft2:'Tuft 2',lobe1:'Lobe 1',lobe2:'Lobe 2'});
const partLabel=id=>PART[id]||(id.replace(/^leg(\d)([LR])[ab]?$/,(m,i,s)=>'Leg '+i+(s==='L'?' left':' right')).replace(/([a-z]+)(\d+)/,(m,w,d)=>w+' '+d).replace(/^./,c=>c.toUpperCase()));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const hashHue=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360;};
const mA=()=>getModel(st.A),mB=()=>getModel(st.B);

// ---------- 3D viewer ----------
const cv3=$('v3d'),wrap=$('viewer');
const renderer=new THREE.WebGLRenderer({canvas:cv3,antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setScissorTest(true);
const cam=new THREE.PerspectiveCamera(35,1,.01,100);
const orb={az:.55,el:.22,zoom:1,drag:false,lx:0,ly:0};
let scenes=[];
function mesh(p,color,o){o=o||{};const mt=MATS[p.m]||MATS.skin;let op=o.opacity==null?1:o.opacity;if(mt.op&&!o.wire)op=Math.min(op,mt.op);
  const mat=o.wire?new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:op}):
   new THREE.MeshStandardMaterial({color,flatShading:true,roughness:mt.r,metalness:mt.m,transparent:op<1,opacity:op,depthWrite:op>=1,emissive:o.glow?color:0x000000,emissiveIntensity:o.glow?.4:0});
  const m=new THREE.Mesh(GEO[p.t],mat);m.position.set(p.p[0],p.p[1],p.p[2]);m.scale.set(p.s[0],p.s[1],p.s[2]);m.rotation.set(p.r[0],p.r[1],p.r[2]);return m;}
function mkScene(cells,unit){const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x667766,.9));const d=new THREE.DirectionalLight(0xffffff,.9);d.position.set(4,8,5);s.add(d);
  const g=new THREE.GridHelper(cells*unit,cells,T.grid,T.grid);g.material.transparent=true;g.material.opacity=.7;s.add(g);return s;}
const tintC=(base,t,w)=>new THREE.Color(base).lerp(new THREE.Color(t),w);
function buildScenes(){
  scenes.forEach(s=>s.traverse(o=>{if(o.material)o.material.dispose();}));
  const A=mA(),B=mB(),pa=getParts(A,st.norm),pb=getParts(B,st.norm),d=st.diff,hl=st.hl;
  const mx=st.norm?2.6:Math.max(A.stats.max,B.stats.max);st.fit=mx;
  const unit=st.norm?.5:Math.pow(10,Math.floor(Math.log10(mx/3))),cells=Math.min(60,Math.max(4,Math.ceil(mx*1.6/unit/2)*2));st.unit=unit;
  const on=id=>!hl||hl.has(id),dim=(id,o)=>on(id)?Object.assign({glow:!!hl},o):Object.assign({},o,{opacity:.2});
  if(st.mode==='split'){
    const sa=mkScene(cells,unit),sb=mkScene(cells,unit);
    for(const id in pa){const e=d.map[id];let c=new THREE.Color(pa[id].c);if(st.tint){if(e.status==='removed')c=tintC(pa[id].c,T.del,.65);else if(e.status==='modified')c=tintC(pa[id].c,T.mod,.5);}sa.add(mesh(pa[id],c,dim(id,{})));}
    for(const id in pb){const e=d.map[id];let c=new THREE.Color(pb[id].c);if(st.tint){if(e.status==='added')c=tintC(pb[id].c,T.add,.65);else if(e.status==='modified')c=tintC(pb[id].c,T.mod,.5);}sb.add(mesh(pb[id],c,dim(id,{})));}
    scenes=[sa,sb];
  }else{
    const so=mkScene(cells,unit);
    for(const id in d.map){const e=d.map[id];
      if(e.status==='same')so.add(mesh(pb[id],T.mute,{opacity:hl?.15:.4}));
      else if(e.status==='added')so.add(mesh(pb[id],T.add,dim(id,{})));
      else if(e.status==='removed')so.add(mesh(pa[id],T.del,dim(id,{})));
      else{so.add(mesh(pa[id],T.del,{wire:1,opacity:on(id)?.75:.12}));so.add(mesh(pb[id],T.mod,dim(id,{opacity:on(id)?.85:.2})));}}
    scenes=[so];
  }
  $('gridnote').textContent='Grid squares: '+(st.norm?'0.5 u (every model scaled to the same size)':fmtLen(unit));
}
function drawVP(scene,x,w,h){renderer.setViewport(x,0,w,h);renderer.setScissor(x,0,w,h);
  const asp=w/h,fit=st.fit*2.1/Math.min(1,asp)*orb.zoom;cam.aspect=asp;cam.near=fit*.02;cam.far=fit*60;cam.updateProjectionMatrix();
  const ty=st.fit*.32;cam.position.set(fit*Math.cos(orb.el)*Math.sin(orb.az),ty+fit*Math.sin(orb.el),fit*Math.cos(orb.el)*Math.cos(orb.az));cam.lookAt(0,ty,0);
  renderer.setClearColor(T.view);renderer.render(scene,cam);}
let lastW=0,lastH=0;
function frame(){const w=wrap.clientWidth,h=wrap.clientHeight;
  if(w&&h&&!$('explore').hidden){if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);cv3.style.width=w+'px';cv3.style.height=h+'px';lastW=w;lastH=h;}
    if(st.spin&&!orb.drag)orb.az+=.0035;
    if(scenes.length===2){drawVP(scenes[0],0,w/2,h);drawVP(scenes[1],w/2,w/2,h);}else if(scenes.length===1)drawVP(scenes[0],0,w,h);}
  requestAnimationFrame(frame);}
cv3.addEventListener('pointerdown',e=>{orb.drag=true;orb.lx=e.clientX;orb.ly=e.clientY;cv3.setPointerCapture(e.pointerId);});
cv3.addEventListener('pointermove',e=>{if(!orb.drag)return;orb.az-=(e.clientX-orb.lx)*.008;orb.el=Math.max(-.1,Math.min(1.4,orb.el+(e.clientY-orb.ly)*.006));orb.lx=e.clientX;orb.ly=e.clientY;});
cv3.addEventListener('pointerup',()=>orb.drag=false);cv3.addEventListener('pointercancel',()=>orb.drag=false);
cv3.addEventListener('wheel',e=>{e.preventDefault();orb.zoom=Math.max(.25,Math.min(3,orb.zoom*Math.exp(e.deltaY*.001)));},{passive:false});

// ---------- summary ----------
const sw=c=>`<i class="sw" style="background:${c}"></i>`;
const pillMat=(m,cls)=>`<span class="pill ${cls}">${MATS[m]?MATS[m].n:m}</span>`;
function ratioWords(r,up,down,same){if(Math.abs(r-1)<.05)return same;const x=r>1?r:1/r,w=r>1?up:down;return x>=2?(x>=100?Math.round(x).toLocaleString():x.toFixed(1))+'× '+w:Math.round(Math.abs(r-1)*100)+'% '+w;}
function verdict(A,B,s){const a=A.name,b=B.name,bits=[];
  if(s.over.mass!=null)bits.push(ratioWords(s.over.mass,'heavier','lighter','about the same mass'));
  bits.push(ratioWords(s.over.h,'taller','lower in height','about the same height'));bits.push(ratioWords(s.over.len,'longer','shorter in length','about the same length'));
  let t=`${esc(b)} is ${bits.slice(0,-1).join(', ')} and ${bits[bits.length-1]} compared with ${esc(a)}.`;
  if(st.norm)t+=' Sizes are normalised here, so only shape differences are shown below.';
  const sa=MATS[s.dma],sb=MATS[s.dmb];
  t+=s.dma===s.dmb?` Both are mostly covered in ${sa.n.toLowerCase()}.`:` Surface changes from ${sa.n.toLowerCase()} to ${sb.n.toLowerCase()}.`;
  const na=colorName(s.ca),nb=colorName(s.cb);t+=na===nb?` Overall colour is similar (${na}).`:` Overall colour shifts from ${na} to ${nb}.`;
  if(s.added.length||s.removed.length)t+=` ${s.added.length?s.added.length+' part'+(s.added.length>1?'s':'')+' only in '+esc(b):''}${s.added.length&&s.removed.length?' and ':''}${s.removed.length?s.removed.length+' only in '+esc(a):''}.`;
  return t;}
function divBar(r){const x=Math.max(-1,Math.min(1,Math.log2(r)/2));return`<span class="dbar"><span class="dfill ${x<0?'l':'r'}" style="width:${Math.abs(x)*50}%"></span></span>`;}
function renderSummary(){
  const A=mA(),B=mB(),s=st.sum;if(!s)return;
  const ov=(k,a,b,r)=>`<div class="orow"><span class="ok">${k}</span><span class="ov">${a} → ${b}</span>${divBar(r)}<span class="or ${r>1.005?'up':r<.995?'dn':''}">${fmtRatio(r)}</span></div>`;
  let h=`<div class="sh"><h2><span class="ca">${esc(A.name)}</span> <span class="arrow">→</span> <span class="cb">${esc(B.name)}</span></h2><p class="verdict">${verdict(A,B,s)}</p>
   <div class="chips"><span>${s.counts.size} size</span><span>${s.counts.mat} surface</span><span>${s.counts.col} colour</span><span>${s.counts.added+s.counts.removed} parts added or removed</span><span>${s.same} unchanged</span></div></div>`;
  const lca2=lcaOf(st.A,st.B);
  h+=`<div class="meta">Last common ancestor in the tree: <b>${esc(lca2.name)}</b>${lca2.rank&&lca2.rank!=='root'?' ('+lca2.rank+')':''}.</div>`;
  h+=`<section class="sec"><h3>Size</h3><div class="oall">${ov('Height',fmtLen(s.sa.h),fmtLen(s.sb.h),s.over.h)}${ov('Length',fmtLen(s.sa.len),fmtLen(s.sb.len),s.over.len)}${s.over.mass!=null?ov('Mass'+(A.est||B.est?' (est.)':''),fmtMass(A.mass),fmtMass(B.mass),s.over.mass):''}</div>`;
  if(s.sizes.length){const lim=st.showAll?s.sizes.length:6;h+=`<div class="sub">Parts that changed size${s.sizes.length>6?' (largest first)':''}</div><div class="list">`+s.sizes.slice(0,lim).map(e=>`<div class="prow" data-ids="${e.id}" tabindex="0"><span class="pn">${esc(partLabel(e.id))}</span><span class="pd">${st.norm?'':fmtLen(e.la)+' → '+fmtLen(e.lb)}</span>${divBar(e.vr)}<span class="or ${e.vr>1?'up':'dn'}">${fmtRatio(e.vr)}</span></div>`).join('')+`</div>`+(s.sizes.length>6?`<button class="ib" id="more">${st.showAll?'Show fewer':'Show all '+s.sizes.length}</button>`:'')+`<div class="legend2"><span class="ca">◀ A larger</span><span class="cb">B larger ▶</span> (change in part volume)</div>`;}
  else h+=`<div class="none">No part differs in size by more than 8%.</div>`;
  h+=`</section>`;
  h+=`<section class="sec"><h3>Surface material</h3>`;
  if(s.mats.length){const g={};s.mats.forEach(e=>{const k=e.a+'>'+e.b;(g[k]=g[k]||{a:e.a,b:e.b,ids:[]}).ids.push(e.id);});
    h+=Object.values(g).map(x=>`<div class="mrow" data-ids="${x.ids.join(' ')}" tabindex="0">${pillMat(x.a,'pa')}<span class="arrow">→</span>${pillMat(x.b,'pb')}<span class="mp">${x.ids.map(i=>esc(partLabel(i))).join(', ')}</span></div>`).join('');}
  else h+=`<div class="none">Every shared part has the same surface material (${MATS[s.dma].n.toLowerCase()}).</div>`;
  h+=`</section><section class="sec"><h3>Colour</h3><div class="avg"><div>${sw(s.ca)}<span>${colorName(s.ca)}</span></div><span class="arrow">→</span><div>${sw(s.cb)}<span>${colorName(s.cb)}</span></div><span class="mp">Average over the whole body</span></div>`;
  if(s.cols.length){h+=`<div class="sub">Parts that changed colour</div><div class="list">`+s.cols.slice(0,st.showAll?99:6).map(e=>`<div class="crow" data-ids="${e.id}" tabindex="0"><span class="pn">${esc(partLabel(e.id))}</span><span class="cs">${sw(e.a)}<span class="arrow">→</span>${sw(e.b)}</span><span class="pd">${colorName(e.a)} → ${colorName(e.b)}</span></div>`).join('')+`</div>`;}
  else h+=`<div class="none">No shared part changes colour noticeably.</div>`;
  h+=`</section>`;
  if(s.added.length||s.removed.length){const ch=(ids,cls)=>ids.map(i=>`<span class="tag ${cls}" data-ids="${i}" tabindex="0">${esc(partLabel(i))}</span>`).join('');
    h+=`<section class="sec"><h3>Parts</h3>${s.added.length?`<div class="prt"><b class="add">Only in ${esc(B.name)}</b><div>${ch(s.added,'tadd')}</div></div>`:''}${s.removed.length?`<div class="prt"><b class="del">Only in ${esc(A.name)}</b><div>${ch(s.removed,'tdel')}</div></div>`:''}</section>`;}
  $('summary').innerHTML=h;
  const more=$('more');if(more)more.onclick=()=>{st.showAll=!st.showAll;renderSummary();};
  $('summary').querySelectorAll('[data-ids]').forEach(el=>{const ids=el.dataset.ids.split(' '),on=()=>{st.hl=new Set(ids);buildScenes();},off=()=>{st.hl=null;buildScenes();};
    el.addEventListener('mouseenter',on);el.addEventListener('mouseleave',off);el.addEventListener('focus',on);el.addEventListener('blur',off);});
}
function lcaOf(a,b){const pa=new Set();for(let n=a;n;n=n.parent)pa.add(n);for(let n=b;n;n=n.parent)if(pa.has(n))return n;return ROOT;}
function noteFor(m,slot){return m.hand?`<b>${slot}</b> ${esc(m.name)}: hand-built model, measured proportions.`:`<b>${slot}</b> ${esc(m.name)}: generated from the ${ARC[m.arche].toLowerCase()} body plan. Dimensions are illustrative.`;}
function update(){
  const A=mA(),B=mB();
  st.diff=compareParts(getParts(A,st.norm),getParts(B,st.norm),st.norm?2.6:Math.max(A.stats.max,B.stats.max));
  st.sum=summarize(A,B,getParts(A,st.norm),getParts(B,st.norm),st.diff,st.norm);
  $('chipA').querySelector('.cn').textContent=A.name;$('chipB').querySelector('.cn').textContent=B.name;
  $('labA').textContent='A · '+A.name;$('labB').textContent='B · '+B.name;$('labA').hidden=$('labB').hidden=st.mode!=='split';$('labO').hidden=st.mode==='split';$('div').hidden=st.mode!=='split';
  $('labO').innerHTML=`<span class="ca">${esc(A.name)}</span> vs <span class="cb">${esc(B.name)}</span>`;
  $('note').innerHTML=noteFor(A,'A')+' '+noteFor(B,'B');
  buildScenes();renderSummary();dirty=true;}

// ---------- tree ----------
const cv=$('tree'),ctx=cv.getContext('2d');let dirty=true,V={s:1,ox:20,oy:30},hover=null,hits=[],dpr=1,vis=[];
const CW=24,RH=20,MAJOR=new Set(['domain','superkingdom','kingdom','phylum','class','order','family','genus']);
const isOpen=n=>n.open&&kidsOf(n).length>0;
function layoutTree(){vis=[];let leaf=0;(function go(n){vis.push(n);const ks=n.open?kidsOf(n):[];if(ks.length){ks.forEach(go);n.vy=(ks[0].vy+ks[ks.length-1].vy)/2;}else n.vy=leaf++;})(ROOT);}
const X=n=>V.ox+n.depth*CW*V.s,Y=n=>V.oy+n.vy*RH*V.s;
// re-run the layout but keep a chosen node (default: the one nearest the middle) where it is on screen
function relayout(anchor){let ref=anchor,best=1e9;if(!ref){const mid=cv.clientHeight/2;for(const n of vis){const d=Math.abs(Y(n)-mid);if(d<best){best=d;ref=n;}}}
  const y0=ref?Y(ref):0;layoutTree();if(ref&&ref.vy!=null)V.oy+=y0-Y(ref);dirty=true;}
function focusOn(ns){layoutTree();const w=cv.clientWidth,h=cv.clientHeight;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;ns.forEach(n=>{x0=Math.min(x0,n.depth);x1=Math.max(x1,n.depth);y0=Math.min(y0,n.vy);y1=Math.max(y1,n.vy);});
  const s=Math.max(.5,Math.min(1.5,Math.min((h-70)/((y1-y0+3)*RH),(w-340)/((x1-x0+2)*CW))));V.s=s;V.ox=130-x0*CW*s;V.oy=h/2-((y0+y1)/2)*RH*s;dirty=true;}
function sizeTree(){dpr=Math.min(2,devicePixelRatio||1);const w=cv.parentElement.clientWidth,h=cv.parentElement.clientHeight;if(!w||!h)return;cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';drawTree();}
function drawTree(){dirty=false;const w=cv.clientWidth,h=cv.clientHeight;if(!w)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);hits=[];
  ctx.strokeStyle=T.mute;ctx.lineWidth=1.3;ctx.globalAlpha=.8;ctx.beginPath();
  for(const n of vis){if(!isOpen(n))continue;const ks=kidsOf(n),x=X(n),y0=Y(ks[0]),y1=Y(ks[ks.length-1]);if(y1<-10||y0>h+10)continue;
    ctx.moveTo(x,y0);ctx.lineTo(x,y1);for(const c of ks){const y=Y(c);if(y<-10||y>h+10)continue;ctx.moveTo(x,y);ctx.lineTo(X(c),y);}}
  ctx.stroke();ctx.globalAlpha=1;ctx.textBaseline='middle';
  const fs=Math.max(10,Math.min(15,12.5*V.s));
  for(const n of vis){const x=X(n),y=Y(n);if(y<-12||y>h+12||x>w+10)continue;
    if(n.more){const rem=n.parent.total-n.parent.kidsFetched;ctx.font=`${fs-1}px "IBM Plex Mono",monospace`;ctx.textAlign='left';ctx.fillStyle=T.accent;const tx=(n.parent.loading?'loading…':`+ ${rem.toLocaleString()} more, click to load`);ctx.fillText(tx,x+8,y);
      ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fillStyle=T.accent;ctx.fill();hits.push({m:1,n,x0:x-6,x1:x+12+ctx.measureText(tx).width,y0:y-9,y1:y+9});continue;}
    const kids=n.count>0,open=isOpen(n),sel=n===st.A||n===st.B,col=n.hand?SP[n.hand].col:hsl(hashHue(n.name),.5,.5);
    ctx.beginPath();if(kids&&!open){ctx.rect(x-4.5,y-4.5,9,9);ctx.fillStyle=col;ctx.fill();}else if(open){ctx.arc(x,y,3,0,7);ctx.fillStyle=T.mute;ctx.fill();}else{ctx.arc(x,y,4.5,0,7);ctx.fillStyle=col;ctx.fill();}
    hits.push({d:1,n,x,y});
    ctx.font=`${sel?'700 ':'400 '}${fs}px "Bricolage Grotesque",sans-serif`;
    if(!open){const nm=label(n),ext=n.hand&&SP[n.hand].ext?' †':'';ctx.textAlign='left';ctx.fillStyle=T.ink;const tx=x+10;ctx.fillText(nm+ext,tx,y);let tw=ctx.measureText(nm+ext).width;
      let bx=tx+tw+6;if(kids){ctx.fillStyle=T.mute;ctx.font=`${fs-1.5}px "IBM Plex Mono",monospace`;const c=n.loading?'…':'+'+n.count.toLocaleString();ctx.fillText(c,bx,y);bx+=ctx.measureText(c).width+6;}
      else if(V.s>.9&&n.name!==nm){ctx.fillStyle=T.mute;ctx.font=`italic ${fs-1}px "Bricolage Grotesque",sans-serif`;ctx.fillText(n.name,bx,y);bx+=ctx.measureText(n.name).width+6;}
      [['A',T.a,st.A],['B',T.b,st.B]].forEach(([k,c,v])=>{if(v===n){ctx.beginPath();ctx.arc(bx+7,y,8,0,7);ctx.fillStyle=c;ctx.fill();ctx.fillStyle='#fff';ctx.font='700 10px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillText(k,bx+7,y+.5);ctx.textAlign='left';bx+=18;}});
      hits.push({l:1,n,x0:tx-2,x1:bx,y0:y-9,y1:y+9});}
    else if((MAJOR.has(n.rank)||sel||V.s>1.2||hover===n)&&x-8-ctx.measureText(n.name).width-10>2){const nm=n.name,tw=ctx.measureText(nm).width+10,lx=x-8-tw;ctx.globalAlpha=.9;ctx.fillStyle=T.panel;ctx.fillRect(lx,y-8,tw,16);ctx.globalAlpha=1;ctx.fillStyle=sel?T.ink:T.mute;ctx.textAlign='left';ctx.fillText(nm,lx+5,y);
      hits.push({l:1,n,x0:lx,x1:lx+tw,y0:y-8,y1:y+8});}}
  if(hover){const n=hover,x=X(n),y=Y(n);ctx.font='600 12px "Bricolage Grotesque",sans-serif';const tx=`${n.name}${n.common&&!isSp(n)?' ('+n.common+')':''} · ${n.rank}${n.count?' · '+n.count.toLocaleString()+' taxa inside · click square to '+(isOpen(n)?'collapse':'expand'):''}`,tw=ctx.measureText(tx).width+14,hx=Math.max(4,Math.min(w-tw-6,x+10)),hy=Math.min(h-26,y+12);
    ctx.fillStyle=T.ink;ctx.fillRect(hx,hy,tw,22);ctx.fillStyle=T.panel;ctx.textAlign='left';ctx.fillText(tx,hx+7,hy+11);}
}
function hitAt(mx,my){for(const t of hits){if(t.m&&mx>=t.x0&&mx<=t.x1&&my>=t.y0&&my<=t.y1)return{t:'more',n:t.n};}for(const t of hits){if(t.d&&Math.hypot(t.x-mx,t.y-my)<8)return{t:'dot',n:t.n};}for(const t of hits){if(t.l&&mx>=t.x0&&mx<=t.x1&&my>=t.y0&&my<=t.y1)return{t:'lab',n:t.n};}return null;}
function status(t){$('status').textContent=t||'';}
async function toggle(n){if(!n.count){choose(n);return;}
  if(isOpen(n)){n.open=false;relayout(n);return;}
  n.open=true;if(!n.loaded){status('Loading '+n.name+'…');dirty=true;try{await loadKids(n);}catch(e){n.open=false;status('Could not load '+n.name);return;}status('');}
  relayout(n);}
async function loadMore(row){const p=row.parent;dirty=true;try{await loadKids(p);}catch(e){status('Could not load more');}relayout();}
function choose(n){if(n===ROOT||n.more)return;st[st.slot]=n;st.slot=st.slot==='A'?'B':'A';setSlot();update();}
function setSlot(){$('chipA').setAttribute('aria-pressed',st.slot==='A');$('chipB').setAttribute('aria-pressed',st.slot==='B');dirty=true;}
let pd=null;
cv.addEventListener('pointerdown',e=>{pd={x:e.clientX,y:e.clientY,ox:V.ox,oy:V.oy,m:false};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  if(pd){const dx=e.clientX-pd.x,dy=e.clientY-pd.y;if(Math.hypot(dx,dy)>4)pd.m=true;if(pd.m){V.ox=pd.ox+dx;V.oy=pd.oy+dy;dirty=true;}return;}
  const p=hitAt(mx,my),nh=p&&p.t==='dot'?p.n:null;if(nh!==hover){hover=nh;dirty=true;}cv.style.cursor=p?'pointer':'grab';});
cv.addEventListener('pointerup',e=>{if(pd&&!pd.m){const r=cv.getBoundingClientRect(),p=hitAt(e.clientX-r.left,e.clientY-r.top);if(p){if(p.t==='dot')toggle(p.n);else if(p.t==='more')loadMore(p.n);else choose(p.n);}}pd=null;});
cv.addEventListener('pointerleave',()=>{if(hover){hover=null;dirty=true;}});
function zoomAt(mx,my,dy){const f=Math.exp(-dy*.0015),ns=Math.max(.35,Math.min(4,V.s*f)),k=ns/V.s;V.ox=mx-(mx-V.ox)*k;V.oy=my-(my-V.oy)*k;V.s=ns;dirty=true;}
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY);},{passive:false});
$('fit').onclick=()=>focusOn([lcaOf(st.A,st.B),st.A,st.B]);
$('zin').onclick=()=>zoomAt(cv.clientWidth/2,cv.clientHeight/2,-250);$('zout').onclick=()=>zoomAt(cv.clientWidth/2,cv.clientHeight/2,250);
$('chipA').onclick=()=>{st.slot='A';setSlot();};$('chipB').onclick=()=>{st.slot='B';setSlot();};
// when zoomed in, open every small group that is on screen so all of its members show
st.auto=true;let aeBusy=0;
function autoStep(){if(!st.auto||V.s<1.1||aeBusy>=6||$('explore').hidden)return;const w=cv.clientWidth,h=cv.clientHeight;let c=0;
  for(const n of vis){if(n.more||n.open||!n.count||n.count>200||n.loading||n.failed)continue;const x=X(n),y=Y(n);if(x<0||x>w||y<0||y>h)continue;if(aeBusy>=6)break;c++;aeBusy++;n.open=true;
    loadKids(n).catch(()=>{n.failed=true;n.open=false;}).finally(()=>{aeBusy--;relayout();});}}
setInterval(autoStep,350);
$('auto').onchange=e=>{st.auto=e.target.checked;};

// ---------- search ----------
const q=$('q'),qres=$('qres');let qsel=[],qtimer=0,qseq=0;
const nameOf=r=>SPRANK.has(r.r)&&r.c?cap(r.c):r.s;
async function showRes(){const term=q.value.trim(),my=++qseq;if(term.length<2){qsel=[];qres.hidden=true;return;}
  try{const rs=await api('/api/search?limit=10&q='+encodeURIComponent(term));if(my!==qseq)return;qsel=rs;}catch(e){qsel=[];}
  qres.hidden=!qsel.length;qres.innerHTML=qsel.map((r,i)=>`<li role="option" data-i="${i}"><span class="rn">${esc(nameOf(r))}</span><span class="rs">${esc(r.s!==nameOf(r)?r.s:'')}</span><span class="rr">${r.r}</span></li>`).join('');}
async function go(r){qres.hidden=true;q.value='';status('Finding '+r.s+'…');try{const n=await revealId(r.id);status('');choose(n);layoutTree();focusOn([lcaOf(st.A,st.B),st.A,st.B]);}catch(e){status('Could not load that taxon');}}
q.addEventListener('input',()=>{clearTimeout(qtimer);qtimer=setTimeout(showRes,180);});
q.addEventListener('keydown',e=>{if(e.key==='Enter'&&qsel[0])go(qsel[0]);if(e.key==='Escape')qres.hidden=true;});
qres.addEventListener('pointerdown',e=>{const li=e.target.closest('li');if(li){e.preventDefault();go(qsel[+li.dataset.i]);}});
q.addEventListener('blur',()=>setTimeout(()=>qres.hidden=true,150));

// ---------- controls ----------
$('swap').onclick=()=>{const t=st.A;st.A=st.B;st.B=t;update();};
function seg2(name,key,vals){const el=$(name);el.querySelectorAll('button').forEach(b=>b.onclick=()=>{st[key]=vals[b.dataset.v];el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));update();});}
seg2('modeSeg','mode',{split:'split',overlay:'overlay'});seg2('scaleSeg','norm',{true:false,prop:true});
$('tint').onchange=e=>{st.tint=e.target.checked;buildScenes();};$('spin').onchange=e=>{st.spin=e.target.checked;};
new ResizeObserver(sizeTree).observe(cv.parentElement);
const rt=()=>{readTheme();buildScenes();dirty=true;};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',rt);new MutationObserver(rt).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
(function loop(){if(dirty&&!$('explore').hidden&&vis.length)drawTree();requestAnimationFrame(loop);})();

// ---------- pages ----------
let focused=false;
async function setPair(a,b){status('Loading…');try{const A=await findByName(a),B=await findByName(b);if(!A||!B){status('Not found in the tree');return;}st.A=A;st.B=B;st.slot='A';setSlot();update();layoutTree();status('');
  if(location.hash==='#how'){focused=false;location.hash='explore';}else focusOn([lcaOf(A,B),A,B]);}catch(e){status('Could not load that pair');}}
function route(){const how=location.hash==='#how';$('how').hidden=!how;$('explore').hidden=how;$('navHow').setAttribute('aria-current',how?'page':'false');$('navExp').setAttribute('aria-current',how?'false':'page');
  if(!how){sizeTree();if(!focused){focusOn([lcaOf(st.A,st.B),st.A,st.B]);focused=true;}dirty=true;}else window.scrollTo(0,0);}
window.addEventListener('hashchange',route);
const PAIRS=[['Loxodonta africana','Mammuthus primigenius','African elephant vs woolly mammoth'],['Canis lupus','Canis lupus familiaris','Wolf vs dog'],['Homo sapiens','Pan troglodytes','Human vs chimpanzee'],['Panthera leo','Felis catus','Lion vs house cat'],['Equus caballus','Equus quagga','Horse vs zebra'],['Tyrannosaurus rex','Struthio camelus','T. rex vs ostrich'],['Carcharodon carcharias','Balaenopteridae','Great white shark vs rorquals'],['Felidae','Canidae','Cats vs dogs (families)'],['Apidae','Formicidae','Bees vs ants'],['Poaceae','Pinaceae','Grasses vs pines'],['Agaricomycetes','Hominidae','Mushrooms vs great apes'],['Escherichia','Homo','Escherichia vs Homo (genera)']];
$('pairs').innerHTML=PAIRS.map(p=>`<button class="ib pair" data-a="${p[0]}" data-b="${p[1]}">${p[2]}</button>`).join('');
$('pairs').addEventListener('click',e=>{const b=e.target.closest('.pair');if(b)setPair(b.dataset.a,b.dataset.b);});

// ---------- start ----------
(async function start(){
  readTheme();sizeTree();
  try{const [stt]=await Promise.all([api('/api/stats'),loadKids(ROOT)]);ROOT.count=stt.total;
    $('stat').textContent=`${stt.total.toLocaleString()} taxa from the NCBI taxonomy`;$('stat2').textContent=stt.total.toLocaleString();
    st.A=await findByName('Loxodonta africana');st.B=await findByName('Mammuthus primigenius');
  }catch(e){$('summary').innerHTML='<div class="none">Could not reach the taxonomy server. Reload the page to try again.</div>';console.error(e);return;}
  layoutTree();setSlot();update();route();frame();
  if(document.fonts)document.fonts.ready.then(()=>{dirty=true;});
})();
