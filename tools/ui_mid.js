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

