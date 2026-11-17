// ===== materials =====
const MATS={fur:{n:'Fur',r:1,m:0},skin:{n:'Skin',r:.65,m:0},scale:{n:'Scales',r:.38,m:.15},feather:{n:'Feathers',r:.9,m:0},chitin:{n:'Chitin',r:.25,m:.3},shell:{n:'Shell',r:.3,m:.15},ivory:{n:'Ivory',r:.35,m:0},horn:{n:'Horn',r:.55,m:0},glass:{n:'Eye',r:.08,m:.3},leaf:{n:'Leaf tissue',r:.8,m:0},wood:{n:'Wood',r:1,m:0},gel:{n:'Gel',r:.15,m:0,op:.65},membrane:{n:'Membrane',r:.25,m:0,op:.8},capsid:{n:'Protein shell',r:.3,m:.2},flesh:{n:'Fungal flesh',r:.9,m:0}};
const HM={shark:['skin'],croc:['scale'],trex:['scale'],ostrich:['feather',{legBL:'scale',legBR:'scale',snout:'horn',neck:'skin',head:'skin'}],eagle:['feather',{legBL:'scale',legBR:'scale',snout:'horn'}],elephant:['skin'],mammoth:['fur',{trunk:'skin',earL:'skin',earR:'skin'}],human:['skin'],chimp:['fur',{head:'skin',snout:'skin',earL:'skin',earR:'skin'}],wolf:['fur'],dog:['fur'],bear:['fur'],lion:['fur'],cat:['fur'],horse:['fur',{snout:'skin'}],zebra:['fur'],giraffe:['fur'],okapi:['fur']};
function finish(P,base,over){over=over||{};for(const id in P){const p=P[id];if(p.m)continue;p.m=over[id]||(/^eye/.test(id)?'glass':/^tusk/.test(id)?'ivory':/^horn/.test(id)?'horn':base);}return P;}
Object.keys(SP).forEach(k=>finish(SP[k].parts,HM[k][0],HM[k][1]));

// ===== geometry / stats =====
const GEO={s:new THREE.SphereGeometry(.5,18,12),c:new THREE.CylinderGeometry(.5,.5,1,16),k:new THREE.ConeGeometry(.5,1,16),b:new THREE.BoxGeometry(1,1,1),i:new THREE.IcosahedronGeometry(.5,0)};
const SHAPE={s:'ellipsoid',c:'cylinder',k:'cone',b:'box',i:'icosahedron'};
const vol=p=>p.s[0]*p.s[1]*p.s[2]*({s:Math.PI/6,c:Math.PI/4,k:Math.PI/12,b:1,i:Math.PI/6}[p.t]);
function boxOf(parts){const g=new THREE.Group();for(const id in parts){const p=parts[id],m=new THREE.Mesh(GEO[p.t]);m.position.set(p.p[0],p.p[1],p.p[2]);m.scale.set(p.s[0],p.s[1],p.s[2]);m.rotation.set(p.r[0],p.r[1],p.r[2]);g.add(m);}
  const b=new THREE.Box3().setFromObject(g),z=b.getSize(new THREE.Vector3());return{h:b.max.y-Math.min(0,b.min.y),len:z.x,wid:z.z,max:Math.max(b.max.y,z.x,z.z)};}

// ===== generator helpers =====
const rngF=seed=>{let a=(seed>>>0)||1;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
const lerp=(a,b,t)=>a+(b-a)*t,logr=(r,a,b)=>Math.exp(lerp(Math.log(a),Math.log(b),r()));
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function hsl(h,s,l){h=(((h%360)+360)%360)/360;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return'#'+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');}
const earth=r=>hsl(lerp(10,45,r()),lerp(.15,.55,r()),lerp(.2,.62,r()));
const green=r=>hsl(lerp(80,145,r()),lerp(.35,.65,r()),lerp(.2,.42,r()));
const vivid=r=>hsl(r()*360,lerp(.5,.85,r()),lerp(.35,.55,r()));
const _Y=new THREE.Vector3(0,1,0);
function aim(a,b,th,c,m,t){const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=d.length()||1e-12,q=new THREE.Quaternion().setFromUnitVectors(_Y,d.clone().normalize()),e=new THREE.Euler().setFromQuaternion(q);
  return S(t||'c',[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[th,L,th],c,[e.x,e.y,e.z],m);}
const eyes=(P,x,y,z,sz)=>{P.eyeL=S('s',[x,y,z],[sz,sz,sz],'#111111');P.eyeR=S('s',[x,y,-z],[sz,sz,sz],'#111111');};

// ===== body-plan generators: each returns {P, base, dens, over} (sizes in metres) =====
const GEN={};
GEN.mammal=(r,has)=>{
  const small=has('Rodentia','Eulipotyphla','Lagomorpha','Didelphimorphia','Dasyuromorphia','Diprotodontia'),big=has('Artiodactyla','Perissodactyla','Carnivora','Sirenia','Proboscidea'),ung=has('Artiodactyla','Perissodactyla'),cat=has('Carnivora');
  const L=small?logr(r,.08,.6):big?logr(r,.8,3.2):logr(r,.15,1.8),bh=L*lerp(.25,.45,r()),c=earth(r);
  const P=quad({bl:L,bh,bw:bh*lerp(.65,.95,r()),leg:L*(ung?lerp(.4,.65,r()):cat?lerp(.25,.45,r()):lerp(.12,.3,r())),lt:bh*lerp(.18,.3,r()),nl:L*(ung?lerp(.18,.45,r()):lerp(.05,.18,r())),na:ung?.6:.9,nt:bh*.35,hs:L*lerp(.17,.28,r()),sl:L*lerp(.04,.16,r()),ear:lerp(.3,.9,r()),tl:L*lerp(.1,.8,r()),ta:lerp(.2,1.1,r()),tt:L*.035,c});
  if(has('Bovidae','Cervidae','Antilocapridae')){const h=P.head,hs=h.s[1];P.hornL=S('k',[h.p[0]-hs*.1,h.p[1]+hs*.7,hs*.25],[hs*.18,hs*.9,hs*.18],'#d8cfb8',[0,0,.2]);P.hornR=S('k',[h.p[0]-hs*.1,h.p[1]+hs*.7,-hs*.25],[hs*.18,hs*.9,hs*.18],'#d8cfb8',[0,0,.2]);}
  return{P,base:has('Sirenia')?'skin':'fur',dens:950};};
GEN.bat=(r,has)=>{const L=logr(r,.04,.2),y=L*.4,c=earth(r),P={};
  P.body=S('s',[0,y,0],[L*.6,L*.35,L*.3],c);P.head=S('s',[L*.4,y+L*.03,0],[L*.25,L*.22,L*.22],c);
  P.earL=S('k',[L*.38,y+L*.2,L*.07],[L*.1,L*.2,L*.06],c);P.earR=S('k',[L*.38,y+L*.2,-L*.07],[L*.1,L*.2,L*.06],c);eyes(P,L*.5,y+L*.05,L*.07,L*.04);
  P.legFL=S('s',[0,y,L*.9],[L*.7,L*.02,L*1.5],c,[0,0,0],'skin');P.legFR=S('s',[0,y,-L*.9],[L*.7,L*.02,L*1.5],c,[0,0,0],'skin');
  P.legBL=S('c',[-L*.25,y-L*.2,L*.08],[L*.03,L*.2,L*.03],c);P.legBR=S('c',[-L*.25,y-L*.2,-L*.08],[L*.03,L*.2,L*.03],c);
  return{P,base:'fur',dens:900};};
GEN.whale=(r)=>{const L=logr(r,3,25),B=L*.22,c=pick(r,['#5d6b78','#3c4854','#7f8b94','#2b333b']),P={};
  P.body=S('s',[0,B*.55,0],[L,B,B*.9],c);P.belly=S('s',[0,B*.4,0],[L*.95,B*.7,B*.85],'#dfe6ea');
  P.head=S('s',[L*.4,B*.5,0],[L*.25,B*.7,B*.8],c);
  P.legFL=S('b',[L*.2,B*.2,B*.55],[L*.12,B*.03,L*.15],c,[.5,0,.3]);P.legFR=S('b',[L*.2,B*.2,-B*.55],[L*.12,B*.03,L*.15],c,[-.5,0,.3]);
  P.tail=S('s',[-L*.52,B*.55,0],[L*.1,B*.12,L*.28],c);P.dorsal=S('k',[-L*.15,B*1.05,0],[B*.12,B*.3,B*.04],c,[0,0,.4]);eyes(P,L*.42,B*.55,B*.35,B*.06);
  return{P,base:'skin',dens:1000};};
GEN.ape=(r)=>{const h=logr(r,.7,1.8);return{P:biped({leg:h*.3,th:h*.33,tw:h*.22,td:h*.15,lt:h*.07,al:h*.4,at:h*.05,hs:h*.12,sl:h*.015,c:earth(r)}),base:'fur',over:{head:'skin',snout:'skin'},dens:950};};
GEN.bird=(r,has)=>{const pass=has('Passeriformes'),wade=has('Pelecaniformes','Ciconiiformes','Gruiformes','Charadriiformes','Phoenicopteriformes'),water=has('Anseriformes','Sphenisciformes');
  const bl=pass?logr(r,.08,.25):logr(r,.2,1),bh=bl*.55,pl=r()<.5?vivid(r):earth(r),bk=hsl(lerp(20,50,r()),.8,.55);
  const P=bird({bl,bh,bw:bh*.8,leg:bl*(wade?lerp(.7,1.3,r()):lerp(.12,.35,r())),lt:bl*.05,lc:bk,nl:bl*(wade?lerp(.6,1.2,r()):water?lerp(.3,.6,r()):lerp(.08,.2,r())),na:.4,nt:bl*.07,hs:bl*.2,sl:bl*(wade?.3:lerp(.08,.2,r())),bc:bk,w:[bl*.7,bh*.55,bh*.1],wy:0,tl:bl*lerp(.25,.6,r()),tw:bl*.3,c:pl});
  return{P,base:'feather',over:{legBL:'scale',legBR:'scale',snout:'horn'},dens:600};};
GEN.turtle=(r)=>{const S0=logr(r,.1,1.2),c=hsl(lerp(60,150,r()),.3,lerp(.2,.4,r())),sk=hsl(lerp(40,90,r()),.2,.4),P={};
  P.body=S('s',[0,S0*.2,0],[S0,S0*.4,S0*.75],c,[0,0,0],'shell');P.head=S('s',[S0*.58,S0*.2,0],[S0*.18,S0*.14,S0*.14],sk);P.neck=S('c',[S0*.48,S0*.2,0],[S0*.1,S0*.12,S0*.1],sk,[0,0,PI/2]);
  [['legFL',1,1],['legFR',1,-1],['legBL',-1,1],['legBR',-1,-1]].forEach(([k,fx,fz])=>P[k]=S('c',[fx*S0*.28,S0*.06,fz*S0*.36],[S0*.12,S0*.12,S0*.12],sk));
  P.tail=S('k',[-S0*.55,S0*.1,0],[S0*.06,S0*.14,S0*.06],sk,[0,0,PI/2]);eyes(P,S0*.64,S0*.24,S0*.05,S0*.03);
  return{P,base:'scale',dens:900};};
GEN.snake=(r)=>{const L=logr(r,.3,5),th=L*.03,c=pick(r,[earth(r),vivid(r),green(r)]),P={};
  P.body=S('c',[0,th/2,0],[th,L,th],c,[0,0,PI/2]);P.head=S('s',[L/2+th*.5,th*.5,0],[th*2.4,th*1.3,th*1.6],c);
  P.tail=S('k',[-L/2-L*.06,th*.5,0],[th,L*.12,th],c,[0,0,PI/2]);eyes(P,L/2+th*.9,th*.8,th*.5,th*.25);
  return{P,base:'scale',dens:900};};
GEN.lizard=(r,has)=>{const L=logr(r,.08,1.5),c=has('Caudata')?hsl(lerp(0,60,r()),.5,.3):pick(r,[earth(r),green(r),vivid(r)]);
  const P=quad({bl:L*.4,bh:L*.1,bw:L*.14,leg:L*.05,lt:L*.035,nl:L*.05,nt:L*.08,na:1.3,hs:L*.09,sl:L*.04,sw:.9,ear:0,tl:L*.6,ta:.1,tt:L*.05,tc:1,c});
  return{P,base:has('Caudata')?'skin':'scale',dens:950};};
GEN.frog=(r)=>{const S0=logr(r,.02,.2),c=pick(r,[green(r),earth(r),vivid(r)]),P={};
  P.body=S('s',[0,S0*.3,0],[S0,S0*.55,S0*.6],c);P.head=S('s',[S0*.45,S0*.38,0],[S0*.45,S0*.3,S0*.55],c);eyes(P,S0*.55,S0*.55,S0*.18,S0*.14);
  P.legBL=aim([-S0*.25,S0*.25,S0*.3],[-S0*.55,S0*.02,S0*.5],S0*.12,c);P.legBR=aim([-S0*.25,S0*.25,-S0*.3],[-S0*.55,S0*.02,-S0*.5],S0*.12,c);
  P.legFL=aim([S0*.25,S0*.3,S0*.22],[S0*.38,0,S0*.3],S0*.07,c);P.legFR=aim([S0*.25,S0*.3,-S0*.22],[S0*.38,0,-S0*.3],S0*.07,c);
  return{P,base:'skin',dens:1000};};
GEN.fish=(r,has)=>{const ray=has('Batoidea');const L=logr(r,.05,3),c=pick(r,['#8fa3b0',vivid(r),'#c9d2d8','#556b7a',hsl(lerp(15,40,r()),.7,.5)]),P={};
  if(ray){P.body=S('s',[0,L*.05,0],[L*.7,L*.08,L*.9],c);P.tail=S('c',[-L*.6,L*.03,0],[L*.025,L*.6,L*.025],c,[0,0,PI/2]);eyes(P,L*.2,L*.1,L*.1,L*.04);P.legFL=S('s',[L*.05,L*.04,L*.4],[L*.4,L*.04,L*.3],c);P.legFR=S('s',[L*.05,L*.04,-L*.4],[L*.4,L*.04,L*.3],c);}
  else{const H=L*.2;P.body=S('s',[0,H,0],[L,L*.28,L*.16],c);P.tail=S('k',[-L*.55,H,0],[L*.3,L*.2,L*.03],c,[0,0,PI/2]);P.dorsal=S('k',[0,H+L*.15,0],[L*.2,L*.18,L*.02],c,[0,0,.2]);
    P.legFL=S('b',[L*.2,H-L*.08,L*.1],[L*.12,L*.02,L*.1],c,[.4,0,.3]);P.legFR=S('b',[L*.2,H-L*.08,-L*.1],[L*.12,L*.02,L*.1],c,[-.4,0,.3]);eyes(P,L*.42,H+L*.03,L*.05,L*.04);}
  return{P,base:has('Chondrichthyes')?'skin':'scale',dens:1000};};
GEN.insect=(r,has)=>{const L=logr(r,.002,.08),y=L*.35,c=r()<.5?vivid(r):earth(r),c2=r()<.5?c:earth(r),P={};
  P.body=S('s',[0,y,0],[L*.3,L*.22,L*.2],c);P.abdomen=S('s',[-L*.32,y,0],[L*.45,L*.2,L*.18],c2);P.head=S('s',[L*.24,y,0],[L*.14,L*.13,L*.13],c);eyes(P,L*.28,y+L*.04,L*.06,L*.07);
  if(!has('Apterygota','Archaeognatha','Zygentoma')){const wc=has('Coleoptera')?c2:'#dfe8ee',wm=has('Coleoptera')?'chitin':'membrane';P.wingL=S('s',[-L*.05,y+L*.12,L*.2],[L*.5,L*.01,L*.22],wc,[.5,0,0],wm);P.wingR=S('s',[-L*.05,y+L*.12,-L*.2],[L*.5,L*.01,L*.22],wc,[-.5,0,0],wm);}
  [['F',1],['M',0],['B',-1]].forEach(([n,k])=>{const x=k*L*.12;P['leg'+n+'L']=aim([x,y-L*.05,L*.08],[x+k*L*.08,0,L*.3],L*.02,'#222222');P['leg'+n+'R']=aim([x,y-L*.05,-L*.08],[x+k*L*.08,0,-L*.3],L*.02,'#222222');});
  P.antL=aim([L*.3,y+L*.05,L*.03],[L*.5,y+L*.2,L*.12],L*.012,'#222222');P.antR=aim([L*.3,y+L*.05,-L*.03],[L*.5,y+L*.2,-L*.12],L*.012,'#222222');
  return{P,base:'chitin',dens:1000};};
GEN.spider=(r)=>{const L=logr(r,.003,.12),y=L*.3,c=pick(r,[earth(r),'#222222',vivid(r)]),P={};
  P.body=S('s',[0,y,0],[L*.3,L*.2,L*.22],c);P.abdomen=S('s',[-L*.3,y+L*.03,0],[L*.4,L*.3,L*.3],c);eyes(P,L*.14,y+L*.06,L*.05,L*.04);
  for(let i=0;i<4;i++)[1,-1].forEach(z=>{const n='leg'+(i+1)+(z>0?'L':'R'),bx=L*(.12-.07*i),ox=L*(.35-.2*i),k=[bx+ox*.6,y+L*.25,z*L*.4],f=[bx+ox,0,z*L*.7];P[n+'a']=aim([bx,y,z*L*.1],k,L*.025,'#222222');P[n+'b']=aim(k,f,L*.02,'#222222');});
  return{P,base:'chitin',dens:1000};};
GEN.crab=(r)=>{const W=logr(r,.02,.5),c=pick(r,[hsl(lerp(0,25,r()),.7,.45),earth(r),vivid(r)]),P={};
  P.body=S('s',[0,W*.18,0],[W*.6,W*.22,W],c);eyes(P,W*.28,W*.3,W*.12,W*.05);
  [-1,0,1].forEach((k,i)=>{[1,-1].forEach(z=>P['leg'+(i+1)+(z>0?'L':'R')]=aim([k*W*.12-W*.05,W*.2,z*W*.4],[k*W*.2-W*.05,0,z*W*.75],W*.04,c));});
  P.legFL=S('s',[W*.38,W*.2,W*.55],[W*.25,W*.12,W*.2],c);P.legFR=S('s',[W*.38,W*.2,-W*.55],[W*.25,W*.12,W*.2],c);
  return{P,base:'shell',dens:1000};};
GEN.centipede=(r)=>{const L=logr(r,.01,.3),c=pick(r,[earth(r),vivid(r)]),P={};
  for(let i=0;i<8;i++)P['seg'+(i+1)]=S('s',[L*.4-i*L/8,L*.03,0],[L/7,L*.05,L*.06],c);
  P.head=S('s',[L*.48,L*.03,0],[L*.07,L*.05,L*.06],c);P.antL=aim([L*.5,L*.04,L*.015],[L*.62,L*.08,L*.04],L*.008,'#222222');P.antR=aim([L*.5,L*.04,-L*.015],[L*.62,L*.08,-L*.04],L*.008,'#222222');
  return{P,base:'chitin',dens:1000};};
GEN.snail=(r)=>{const S0=logr(r,.01,.25),P={};
  P.shell=S('s',[-S0*.1,S0*.3,0],[S0*.6,S0*.6,S0*.5],hsl(lerp(20,50,r()),.5,lerp(.3,.6,r())),[0,0,0],'shell');P.body=S('s',[S0*.2,S0*.06,0],[S0*1.1,S0*.12,S0*.2],'#a39a8a');P.head=S('s',[S0*.7,S0*.14,0],[S0*.12,S0*.12,S0*.12],'#a39a8a');
  P.antL=aim([S0*.72,S0*.18,S0*.03],[S0*.8,S0*.3,S0*.06],S0*.02,'#a39a8a');P.antR=aim([S0*.72,S0*.18,-S0*.03],[S0*.8,S0*.3,-S0*.06],S0*.02,'#a39a8a');
  return{P,base:'skin',dens:1000};};
GEN.clam=(r)=>{const S0=logr(r,.01,.5),c=hsl(lerp(20,60,r()),.3,lerp(.4,.7,r())),P={};
  P.shellL=S('s',[0,S0*.12,S0*.1],[S0,S0*.2,S0*.7],c,[.35,0,0]);P.shellR=S('s',[0,S0*.12,-S0*.1],[S0,S0*.2,S0*.7],c,[-.35,0,0]);
  return{P,base:'shell',dens:1100};};
GEN.squid=(r)=>{const L=logr(r,.03,2),c=pick(r,[hsl(lerp(0,20,r()),.55,.5),'#b9a6a0','#6b5e77']),P={};
  P.body=S('s',[-L*.15,L*.35,0],[L*.5,L*.16,L*.16],c);P.head=S('s',[L*.15,L*.35,0],[L*.12,L*.12,L*.14],c);eyes(P,L*.18,L*.38,L*.06,L*.04);
  for(let i=0;i<8;i++){const a=i/8*2*PI;P['arm'+(i+1)]=aim([L*.2,L*.35,0],[L*.6,L*.35+Math.cos(a)*L*.12-L*.1,Math.sin(a)*L*.15],L*.03,c);}
  P.finL=S('s',[-L*.3,L*.37,L*.1],[L*.2,L*.01,L*.12],c);P.finR=S('s',[-L*.3,L*.37,-L*.1],[L*.2,L*.01,L*.12],c);
  return{P,base:'skin',dens:1000};};
GEN.star=(r)=>{const R=logr(r,.03,.5),c=pick(r,[hsl(lerp(0,30,r()),.75,.5),vivid(r),earth(r)]),P={};
  P.body=S('s',[0,R*.06,0],[R*.3,R*.12,R*.3],c);for(let i=0;i<5;i++){const a=i/5*2*PI;P['arm'+(i+1)]=aim([0,R*.05,0],[Math.cos(a)*R*.5,R*.03,Math.sin(a)*R*.5],R*.14,c,null,'k');}
  return{P,base:'skin',dens:1100};};
GEN.jelly=(r)=>{const D=logr(r,.02,1),c=pick(r,['#b9d4ee','#e8c1e6','#f4ecc8','#a8e0d6']),P={};
  P.bell=S('s',[0,D*.8,0],[D,D*.6,D],c,[0,0,0],'gel');for(let i=0;i<8;i++){const a=i/8*2*PI;P['tent'+(i+1)]=aim([Math.cos(a)*D*.4,D*.7,Math.sin(a)*D*.4],[Math.cos(a)*D*.3,0,Math.sin(a)*D*.3],D*.02,c,'gel');}
  return{P,base:'gel',dens:1000};};
GEN.sponge=(r)=>{const H=logr(r,.03,1),c=pick(r,[hsl(lerp(30,60,r()),.7,.55),vivid(r),earth(r)]),P={};
  P.body=S('c',[0,H/2,0],[H*.35,H,H*.35],c);P.tube1=S('c',[H*.25,H*.3,0],[H*.2,H*.6,H*.2],c);P.tube2=S('c',[-H*.2,H*.25,H*.1],[H*.18,H*.5,H*.18],c);
  return{P,base:'flesh',dens:1000};};
GEN.worm=(r)=>{const L=logr(r,.005,.6),th=L*.04,c=pick(r,[hsl(lerp(0,25,r()),.4,.5),earth(r),vivid(r)]),P={};
  P.body=S('c',[0,th/2,0],[th,L,th],c,[0,0,PI/2]);P.head=S('s',[L/2,th/2,0],[th*1.1,th*1.1,th*1.1],c);P.tail=S('k',[-L/2-th,th/2,0],[th,th*2,th],c,[0,0,PI/2]);
  return{P,base:'skin',dens:1000};};
GEN.tree=(r)=>{const H=logr(r,4,35),g=green(r),P={};
  P.trunk=S('c',[0,H*.2,0],[H*.04,H*.4,H*.04],'#6b4a2f',[0,0,0],'wood');P.crown=S('s',[0,H*.62,0],[H*.55,H*.55,H*.55],g,[0,0,0],'leaf');P.crown2=S('s',[H*.1,H*.5,H*.1],[H*.4,H*.35,H*.4],g,[0,0,0],'leaf');
  return{P,base:'leaf',dens:350};};
GEN.shrub=(r)=>{const H=logr(r,.4,3),g=green(r),P={};
  P.trunk=S('c',[0,H*.2,0],[H*.05,H*.4,H*.05],'#6b4a2f',[0,0,0],'wood');P.crown=S('s',[0,H*.55,0],[H*.8,H*.7,H*.8],g);P.crown2=S('s',[H*.25,H*.4,0],[H*.5,H*.45,H*.5],g);
  return{P,base:'leaf',dens:300};};
GEN.flower=(r)=>{const H=logr(r,.05,1.2),g=green(r),pc=vivid(r),P={};
  P.stem=S('c',[0,H/2,0],[H*.02,H,H*.02],g);P.leaf1=S('s',[H*.1,H*.3,0],[H*.2,H*.02,H*.08],g,[0,0,.5]);P.leaf2=S('s',[-H*.1,H*.4,0],[H*.2,H*.02,H*.08],g,[0,0,-.5]);
  P.center=S('s',[0,H,0],[H*.08,H*.04,H*.08],'#e8c33a');for(let i=0;i<6;i++){const a=i/6*2*PI;P['petal'+(i+1)]=S('s',[Math.cos(a)*H*.07,H,Math.sin(a)*H*.07],[H*.1,H*.02,H*.05],pc,[0,-a,0]);}
  return{P,base:'leaf',dens:250};};
GEN.grass=(r)=>{const H=logr(r,.1,2.5),g=green(r),P={};
  for(let i=0;i<5;i++){const a=i/5*2*PI;P['blade'+(i+1)]=aim([Math.cos(a)*H*.03,0,Math.sin(a)*H*.03],[Math.cos(a)*H*.15,H,Math.sin(a)*H*.15],H*.03,g,null,'k');}
  return{P,base:'leaf',dens:200};};
GEN.palm=(r)=>{const H=logr(r,3,25),g=green(r),P={};
  P.trunk=S('c',[0,H*.45,0],[H*.05,H*.9,H*.05],'#8a6a45',[0,0,0],'wood');for(let i=0;i<6;i++){const a=i/6*2*PI;P['frond'+(i+1)]=aim([0,H*.92,0],[Math.cos(a)*H*.3,H*.82,Math.sin(a)*H*.3],H*.05,g,null,'k');}
  return{P,base:'leaf',dens:350};};
GEN.conifer=(r)=>{const H=logr(r,3,50),g=hsl(lerp(110,160,r()),.4,lerp(.15,.28,r())),P={};
  P.trunk=S('c',[0,H*.15,0],[H*.04,H*.3,H*.04],'#5a3d29',[0,0,0],'wood');for(let i=0;i<3;i++)P['cone'+(i+1)]=S('k',[0,H*(.35+.18*i),0],[H*(.45-.1*i),H*.4,H*(.45-.1*i)],g,[0,0,0],'leaf');
  return{P,base:'leaf',dens:350};};
GEN.fern=(r)=>{const H=logr(r,.2,2),g=green(r),P={};
  for(let i=0;i<7;i++){const a=i/7*2*PI;P['frond'+(i+1)]=aim([0,0,0],[Math.cos(a)*H*.6,H*.7,Math.sin(a)*H*.6],H*.07,g,null,'k');}
  return{P,base:'leaf',dens:200};};
GEN.moss=(r)=>{const W=logr(r,.01,.15),g=green(r),P={};
  P.body=S('s',[0,W*.15,0],[W,W*.3,W],g);P.tuft1=S('s',[W*.25,W*.12,W*.2],[W*.4,W*.25,W*.4],g);P.tuft2=S('s',[-W*.25,W*.12,-W*.2],[W*.4,W*.25,W*.4],g);
  return{P,base:'leaf',dens:200};};
GEN.alga=(r,has)=>{const H=logr(r,.02,1),c=has('Rhodophyta')?hsl(lerp(340,360,r()),.5,.4):has('Phaeophyceae')?hsl(lerp(30,50,r()),.5,.3):green(r),P={};
  P.stipe=S('c',[0,H*.4,0],[H*.03,H*.8,H*.03],c);for(let i=0;i<3;i++)P['blade'+(i+1)]=S('s',[Math.cos(i*2.1)*H*.1,H*(.4+i*.15),Math.sin(i*2.1)*H*.1],[H*.25,H*.5,H*.02],c,[0,i*2.1,.1]);
  return{P,base:'leaf',dens:250};};
GEN.mushroom=(r)=>{const H=logr(r,.02,.3),cc=pick(r,[hsl(lerp(0,30,r()),.7,.45),earth(r),'#e8e0d0',vivid(r)]),P={};
  P.stem=S('c',[0,H*.4,0],[H*.15,H*.8,H*.15],'#efe6d2');P.cap=S('s',[0,H*.85,0],[H*.7,H*.35,H*.7],cc);
  return{P,base:'flesh',dens:300};};
GEN.mold=(r)=>{const W=logr(r,.005,.2),c=pick(r,[earth(r),vivid(r),'#cfd8c4']),P={};
  P.body=S('s',[0,W*.2,0],[W,W*.4,W],c);P.lobe1=S('s',[W*.3,W*.15,W*.2],[W*.4,W*.3,W*.4],c);P.lobe2=S('s',[-W*.3,W*.15,-W*.2],[W*.4,W*.3,W*.4],c);
  return{P,base:'flesh',dens:300};};
GEN.protist=(r)=>{const D=logr(r,2e-5,3e-4),c=pick(r,[hsl(lerp(80,170,r()),.5,.55),vivid(r)]),P={};
  P.body=S('s',[0,D*.5,0],[D,D*.8,D*.8],c,[0,0,0],'membrane');P.nucleus=S('s',[0,D*.5,0],[D*.3,D*.3,D*.3],hsl(lerp(240,300,r()),.4,.35),[0,0,0],'membrane');
  P.flagellum=aim([-D*.5,D*.5,0],[-D*1.1,D*.7,0],D*.04,c,'membrane');
  return{P,base:'membrane',dens:1000};};
GEN.bacterium=(r,has)=>{const Lb=logr(r,1e-6,5e-6),w=Lb*.18,c=has('Archaea')?hsl(lerp(180,260,r()),.45,.5):hsl(lerp(0,360,r()),.45,.55),P={};
  if(r()<.4)P.body=S('s',[0,Lb/2,0],[Lb*.6,Lb*.6,Lb*.6],c,[0,0,0],'membrane');
  else{P.body=S('c',[0,w,0],[w*2,Lb,w*2],c,[0,0,PI/2],'membrane');P.capL=S('s',[Lb/2,w,0],[w*2,w*2,w*2],c,[0,0,0],'membrane');P.capR=S('s',[-Lb/2,w,0],[w*2,w*2,w*2],c,[0,0,0],'membrane');}
  P.flagellum=aim([-Lb*.5,w,0],[-Lb*1.2,w*1.6,0],Lb*.02,c,'membrane');
  return{P,base:'membrane',dens:1000};};
GEN.virus=(r)=>{const D=logr(r,2e-8,3e-7),c=pick(r,[hsl(lerp(0,360,r()),.6,.5),'#d96a5b','#7b5bd9']),P={},f=1.618,V=[[1,f,0],[-1,f,0],[1,-f,0],[-1,-f,0],[0,1,f],[0,-1,f],[0,1,-f],[0,-1,-f],[f,0,1],[-f,0,1],[f,0,-1],[-f,0,-1]];
  P.capsid=S('i',[0,D*.7,0],[D,D,D],c);V.forEach((v,i)=>{const l=Math.hypot(...v),u=v.map(x=>x/l);P['spike'+(i+1)]=aim([u[0]*D*.4,D*.7+u[1]*D*.4,u[2]*D*.4],[u[0]*D*.62,D*.7+u[1]*D*.62,u[2]*D*.62],D*.07,c,null,'k');});
  return{P,base:'capsid',dens:1300};};
GEN.blob=(r)=>{const D=logr(r,.001,.05),c=vivid(r);return{P:{body:S('s',[0,D*.4,0],[D,D*.8,D*.8],c)},base:'gel',dens:1000};};

const ARC={mammal:'Mammal',bat:'Bat',whale:'Whale or dolphin',ape:'Ape',bird:'Bird',turtle:'Turtle',snake:'Snake',lizard:'Lizard or salamander',frog:'Frog',fish:'Fish',insect:'Insect',spider:'Spider or arachnid',crab:'Crustacean',centipede:'Myriapod',snail:'Snail or slug',clam:'Bivalve',squid:'Cephalopod',star:'Echinoderm',jelly:'Jellyfish or cnidarian',sponge:'Sponge',worm:'Worm',tree:'Tree',shrub:'Shrub',flower:'Flowering plant',grass:'Grass',palm:'Palm',conifer:'Conifer',fern:'Fern',moss:'Moss',alga:'Alga',mushroom:'Mushroom',mold:'Mold or yeast',protist:'Single-celled eukaryote',bacterium:'Bacterium',virus:'Virus',blob:'Simple organism',detailed:'Hand-built model'};
function archeOf(n,has,r){
  if(has('Viruses'))return'virus';if(has('Bacteria')||has('Archaea'))return'bacterium';
  if(has('Metazoa')){
    if(has('Mammalia')){if(has('Chiroptera'))return'bat';if(has('Cetacea','Delphinidae','Balaenopteridae','Physeteridae','Phocoenidae'))return'whale';if(has('Hominoidea'))return'ape';return'mammal';}
    if(has('Aves'))return'bird';if(has('Testudines'))return'turtle';if(has('Serpentes','Amphisbaenia'))return'snake';if(has('Crocodylia','Lepidosauria','Squamata','Caudata','Sphenodon'))return'lizard';if(has('Anura'))return'frog';if(has('Amphibia'))return has('Gymnophiona')?'snake':'lizard';
    if(has('Actinopterygii','Chondrichthyes','Cyclostomata','Dipnomorpha','Coelacanthimorpha','Hyperoartia','Petromyzontiformes','Myxini','Sarcopterygii'))return'fish';
    if(has('Chordata'))return'blob';
    if(has('Arthropoda')){if(has('Hexapoda','Insecta'))return'insect';if(has('Arachnida','Chelicerata'))return'spider';if(has('Myriapoda'))return'centipede';return'crab';}
    if(has('Mollusca')){if(has('Bivalvia'))return'clam';if(has('Cephalopoda'))return'squid';return'snail';}
    if(has('Echinodermata'))return'star';if(has('Cnidaria','Ctenophora'))return'jelly';if(has('Porifera'))return'sponge';return'worm';}
  if(has('Viridiplantae')){
    if(has('Embryophyta')||has('Streptophyta')){if(has('Pinopsida','Acrogymnospermae','Coniferophyta'))return'conifer';if(has('Polypodiopsida','Pteridophyta','Monilophyta'))return'fern';if(has('Bryophyta','Marchantiophyta','Anthocerotophyta','Bryopsida'))return'moss';
      if(has('Poaceae','Cyperaceae'))return'grass';if(has('Arecaceae'))return'palm';const x=r();return x<.45?'tree':x<.7?'shrub':'flower';}
    return'alga';}
  if(has('Fungi'))return has('Basidiomycota','Agaricomycetes')?'mushroom':'mold';
  if(has('Rhodophyta','Phaeophyceae'))return'alga';
  if(has('Eukaryota'))return'protist';
  return'blob';}
function generate(n){const names=new Set(pathOf(n).map(x=>x.name)),has=(...a)=>a.some(x=>names.has(x)),r=rngF(n.id*2654435761+7),k=archeOf(n,has,r),g=(GEN[k]||GEN.blob)(r,has);
  finish(g.P,g.base,g.over);return{P:g.P,arche:k,dens:g.dens};}

// ===== model cache =====
const CACHE=new Map();
function getModel(n){let m=CACHE.get(n.id);if(m)return m;
  if(n.hand){const s=SP[n.hand];m={name:s.name,sci:s.sci,parts:s.parts,mass:s.mass,arche:'detailed',hand:true,ext:s.ext,node:n};}
  else{const g=generate(n);let v=0;for(const id in g.P)v+=vol(g.P[id]);m={name:label(n),sci:n.name,parts:g.P,arche:g.arche,mass:v*g.dens,est:true,hand:false,node:n};}
  m.stats=boxOf(m.parts);CACHE.set(n.id,m);return m;}
function getParts(m,norm){if(!norm)return m.parts;const k=2.6/m.stats.max,o={};
  for(const i in m.parts){const p=m.parts[i];o[i]={t:p.t,c:p.c,r:p.r,m:p.m,p:p.p.map(v=>v*k),s:p.s.map(v=>v*k)};}return o;}

// ===== formatting =====
function fmtLen(m){const a=Math.abs(m);if(a>=1)return(a>=100?m.toFixed(0):a>=10?m.toFixed(1):m.toFixed(2))+' m';if(a>=.01)return(m*100).toFixed(a>=.1?0:1)+' cm';if(a>=1e-3)return(m*1e3).toFixed(1)+' mm';if(a>=1e-6)return(m*1e6).toFixed(a>=1e-5?0:1)+' µm';return(m*1e9).toFixed(0)+' nm';}
function fmtMass(k){if(k==null)return'—';if(k>=1000)return(k/1000).toFixed(k>=1e4?0:1)+' t';if(k>=1)return(k>=100?k.toFixed(0):k.toFixed(1))+' kg';if(k>=1e-3)return(k*1e3).toFixed(k>=.1?0:1)+' g';if(k>=1e-6)return(k*1e6).toFixed(1)+' mg';if(k>=1e-9)return(k*1e9).toFixed(1)+' µg';if(k>=1e-12)return(k*1e12).toFixed(1)+' ng';return(k*1e15).toFixed(1)+' pg';}
const big=x=>x>=1e6?x.toExponential(1).replace('e+','e'):x>=100?Math.round(x).toLocaleString():x.toFixed(1);
function fmtRatio(r){if(Math.abs(r-1)<.005)return'same';if(r>=3)return'×'+big(r);if(r<=1/3)return'÷'+big(1/r);return(r>=1?'+':'−')+Math.abs(Math.round((r-1)*100))+'%';}
function colorName(hex){const c=new THREE.Color(hex),o={};c.getHSL(o);const h=o.h*360,s=o.s,l=o.l;
  if(l<.14)return'black';if(l>.88)return'white';if(s<.12)return l<.4?'dark grey':l>.65?'light grey':'grey';
  const tone=l<.3?'dark ':l>.72?'light ':'';
  if(h<15||h>=345)return tone+(l<.4&&s<.6?'maroon':'red');if(h<45)return l<.5?'brown':tone+'orange';if(h<70)return tone+(l<.5?'olive':'yellow');if(h<165)return tone+'green';if(h<200)return tone+'teal';if(h<255)return tone+'blue';if(h<290)return tone+'purple';return tone+'pink';}
function cdist(a,b){const x=new THREE.Color(a),y=new THREE.Color(b);return Math.abs(x.r-y.r)+Math.abs(x.g-y.g)+Math.abs(x.b-y.b);}

// ===== diff =====
function compareParts(pa,pb,ref){const map={},list=[];
  new Set([...Object.keys(pa),...Object.keys(pb)]).forEach(id=>{const a=pa[id],b=pb[id],e={id,a,b};
    if(!a)e.status='added';else if(!b)e.status='removed';
    else{e.size=a.s.some((v,i)=>Math.abs(Math.log(b.s[i]/v))>.077);e.vr=vol(b)/vol(a);e.mat=a.m!==b.m;e.col=cdist(a.c,b.c)>.12;e.shape=a.t!==b.t;
      e.move=Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1],a.p[2]-b.p[2])>.08*ref;
      e.status=(e.size||e.mat||e.col||e.shape||e.move)?'modified':'same';}
    map[id]=e;list.push(e);});
  return{map,list};}
function avgColor(parts){let r=0,g=0,b=0,w=0;for(const id in parts){const p=parts[id],v=Math.pow(vol(p),2/3),c=new THREE.Color(p.c);r+=c.r*v;g+=c.g*v;b+=c.b*v;w+=v;}return'#'+new THREE.Color(r/w,g/w,b/w).getHexString();}
function domMat(parts){const t={};for(const id in parts){const p=parts[id];if(p.m==='glass')continue;t[p.m]=(t[p.m]||0)+Math.pow(vol(p),2/3);}return Object.keys(t).sort((x,y)=>t[y]-t[x])[0];}
function summarize(ma,mb,pa,pb,d,norm){
  const sa=ma.stats,sb=mb.stats,sizes=d.list.filter(e=>e.status==='modified'&&e.size).map(e=>({id:e.id,vr:e.vr,la:Math.max(...e.a.s),lb:Math.max(...e.b.s),lr:Math.max(...e.b.s)/Math.max(...e.a.s)})).sort((x,y)=>Math.abs(Math.log(y.vr))-Math.abs(Math.log(x.vr)));
  const mats=d.list.filter(e=>e.status==='modified'&&e.mat).map(e=>({id:e.id,a:e.a.m,b:e.b.m}));
  const cols=d.list.filter(e=>e.status==='modified'&&e.col).map(e=>({id:e.id,a:e.a.c,b:e.b.c,dist:cdist(e.a.c,e.b.c)})).sort((x,y)=>y.dist-x.dist);
  const added=d.list.filter(e=>e.status==='added').map(e=>e.id),removed=d.list.filter(e=>e.status==='removed').map(e=>e.id),same=d.list.filter(e=>e.status==='same').length;
  const ca=avgColor(pa),cb=avgColor(pb),dma=domMat(pa),dmb=domMat(pb);
  const over={h:sb.h/sa.h,len:sb.len/sa.len,mass:ma.mass&&mb.mass?mb.mass/ma.mass:null};
  return{sizes,mats,cols,added,removed,same,ca,cb,dma,dmb,over,sa,sb,
    counts:{size:sizes.length,mat:mats.length,col:cols.length,added:added.length,removed:removed.length}};}
