const PI=Math.PI;
const S=(t,p,s,c,r,m)=>({t,p,s,c,r:r||[0,0,0],m});
const seg=(b,a,len)=>[b[0]+Math.sin(a)*len/2,b[1]+Math.cos(a)*len/2,0];
const PART={body:'Body',head:'Head',neck:'Neck',snout:'Snout / beak',earL:'Left ear',earR:'Right ear',eyeL:'Left eye',eyeR:'Right eye',
 legFL:'Front left limb / wing / arm / fin',legFR:'Front right limb / wing / arm / fin',legBL:'Hind left leg',legBR:'Hind right leg',tail:'Tail',
 trunk:'Trunk',tuskL:'Left tusk',tuskR:'Right tusk',mane:'Mane',hump:'Shoulder hump',hornL:'Left ossicone',hornR:'Right ossicone',tuft:'Tail tuft',
 dome:'Head dome',fur:'Fur skirt',stripe1:'Stripe 1',stripe2:'Stripe 2',stripe3:'Stripe 3',dorsal:'Dorsal fin',belly:'Belly'};

function quad(o){
  const {bl,bh,bw,leg,lt}=o,by=leg+bh/2,c=o.c,lc=o.lc||c,P={};
  P.body=S('s',[0,by,0],[bl,bh,bw],c);
  [['legFL',1,1],['legFR',1,-1],['legBL',-1,1],['legBR',-1,-1]].forEach(([k,fx,fz])=>P[k]=S('c',[fx*bl*.3,leg/2,fz*bw*.32],[lt,leg,lt],lc));
  const a=o.na==null?.9:o.na,nl=o.nl,nt=o.nt||bh*.4,ax=bl*.42,ay=by+bh*.2;
  P.neck=S('c',seg([ax,ay],a,nl),[nt,nl,nt],c,[0,0,-a]);
  const hs=o.hs,hx=ax+Math.sin(a)*nl+hs*.25,hy=ay+Math.cos(a)*nl;
  P.head=S('s',[hx,hy,0],[hs*1.2,hs,hs*.9],o.hc||c);
  if(o.sl>0){const st=hs*.5*(o.sw||1);P.snout=S('c',[hx+hs*.45+o.sl/2,hy-hs*.12,0],[st,o.sl,st],o.hc||c,[0,0,-PI/2]);}
  if(o.ear>0){const e=hs*o.ear;[['earL',1],['earR',-1]].forEach(([k,z])=>P[k]=S('k',[hx-hs*.1,hy+hs*.5+e*.2,z*hs*.3],[e*.5,e*.9,e*.5],c));}
  [['eyeL',1],['eyeR',-1]].forEach(([k,z])=>P[k]=S('s',[hx+hs*.4,hy+hs*.12,z*hs*.3],[hs*.12,hs*.12,hs*.12],'#111111'));
  let tend=null;
  if(o.tl>0){const ta=o.ta==null?.6:o.ta,tt=o.tt||.08,d=[-Math.cos(ta),-Math.sin(ta)],s0=[-bl*.48,by+bh*.2];
    P.tail=S(o.tc?'k':'c',[s0[0]+d[0]*o.tl/2,s0[1]+d[1]*o.tl/2,0],[tt,o.tl,tt],o.tcol||c,[0,0,PI/2+ta]);
    tend=[s0[0]+d[0]*o.tl,s0[1]+d[1]*o.tl];}
  if(o.x)o.x(P,{bl,bh,bw,leg,by,hx,hy,hs,ax,ay,c,nl,a,tend});
  return P;
}
function biped(o){
  const {leg,th,tw,td,al,at,hs,c}=o,by=leg+th/2,P={};
  P.body=S('s',[0,by,0],[td,th,tw],c);
  P.legBL=S('c',[0,leg/2,tw*.27],[o.lt,leg,o.lt],c);P.legBR=S('c',[0,leg/2,-tw*.27],[o.lt,leg,o.lt],c);
  P.legFL=S('c',[0,leg+th-al/2-.03,tw/2+at*.5],[at,al,at],c);P.legFR=S('c',[0,leg+th-al/2-.03,-tw/2-at*.5],[at,al,at],c);
  P.neck=S('c',[0,leg+th+.04,0],[hs*.45,.12,hs*.45],c);
  const hx=hs*.1,hy=leg+th+.1+hs*.55;
  P.head=S('s',[hx,hy,0],[hs,hs*1.15,hs*.9],c);
  const st=hs*.35;P.snout=S('c',[hx+hs*.45+o.sl/2,hy-hs*.15,0],[st,o.sl,st],c,[0,0,-PI/2]);
  P.earL=S('s',[hx-hs*.05,hy,hs*.5],[hs*.15,hs*.3,hs*.1],c);P.earR=S('s',[hx-hs*.05,hy,-hs*.5],[hs*.15,hs*.3,hs*.1],c);
  [['eyeL',1],['eyeR',-1]].forEach(([k,z])=>P[k]=S('s',[hx+hs*.42,hy+hs*.1,z*hs*.25],[hs*.1,hs*.1,hs*.1],'#111111'));
  return P;
}
function bird(o){
  const {bl,bh,bw,leg,lt,hs,c}=o,by=leg+bh/2,P={};
  P.body=S('s',[0,by,0],[bl,bh,bw],c);
  P.legBL=S('c',[0,leg/2,bw*.25],[lt,leg,lt],o.lc||c);P.legBR=S('c',[0,leg/2,-bw*.25],[lt,leg,lt],o.lc||c);
  const a=o.na,nl=o.nl,nt=o.nt,ax=bl*.35,ay=by+bh*.25,nc=o.nc||c;
  P.neck=S('c',seg([ax,ay],a,nl),[nt,nl,nt],nc,[0,0,-a]);
  const hx=ax+Math.sin(a)*nl+hs*.2,hy=ay+Math.cos(a)*nl;
  P.head=S('s',[hx,hy,0],[hs*1.2,hs,hs*.9],o.hc||nc);
  P.snout=S('k',[hx+hs*.5+o.sl/2,hy-hs*.1,0],[hs*.35,o.sl,hs*.35],o.bc,[0,0,-PI/2]);
  [['eyeL',1],['eyeR',-1]].forEach(([k,z])=>P[k]=S('s',[hx+hs*.3,hy+hs*.12,z*hs*.3],[hs*.14,hs*.14,hs*.14],'#111111'));
  const w=o.w;P.legFL=S('s',[0,by+(o.wy||0),bw/2+w[2]*.45],w,o.wc||c);P.legFR=S('s',[0,by+(o.wy||0),-bw/2-w[2]*.45],w,o.wc||c);
  P.tail=S('k',[-bl*.5-o.tl/2,by,0],[o.tw,o.tl,o.tw*.4],o.tc||c,[0,0,PI/2]);
  return P;
}
const IV='#efe8d6';
const SP={
 shark:{name:'Great white shark',sci:'Carcharodon carcharias',mass:1100,col:'#7b8a96',mk(){const c='#7b8a96',P={};
  P.body=S('s',[0,.7,0],[4.2,1,1],c);P.belly=S('s',[.2,.5,0],[3.6,.7,.9],'#e8edf0');
  P.snout=S('k',[2.5,.7,0],[.9,.6,.9],c,[0,0,-PI/2]);P.dorsal=S('k',[.3,1.4,0],[.55,.9,.1],c,[0,0,.3]);
  P.legFL=S('b',[.8,.35,.7],[.6,.06,.9],c,[.4,0,.3]);P.legFR=S('b',[.8,.35,-.7],[.6,.06,.9],c,[-.4,0,.3]);
  P.legBL=S('b',[-.8,.3,.3],[.3,.05,.3],c);P.legBR=S('b',[-.8,.3,-.3],[.3,.05,.3],c);
  P.tail=S('k',[-2.5,.8,0],[1.5,1,.12],c,[0,0,PI/2]);
  P.eyeL=S('s',[1.6,.8,.4],[.1,.1,.1],'#111111');P.eyeR=S('s',[1.6,.8,-.4],[.1,.1,.1],'#111111');return P;}},
 croc:{name:'Nile crocodile',sci:'Crocodylus niloticus',mass:410,col:'#5b6b3a',mk:()=>quad({bl:3.0,bh:.45,bw:.8,leg:.22,lt:.17,nl:.3,nt:.4,na:1.45,hs:.35,sl:1.1,sw:1.3,ear:0,tl:1.8,ta:.05,tt:.45,tc:1,c:'#5b6b3a',lc:'#4e5c31'})},
 trex:{name:'Tyrannosaurus rex',sci:'Tyrannosaurus rex',mass:8000,ext:66,col:'#6b6a3f',mk(){const c='#6b6a3f',hc='#7a7745',P={};
  P.body=S('s',[0,3.1,0],[2.6,1.4,1.1],c,[0,0,.15]);
  P.legBL=S('c',[.15,1.2,.55],[.55,2.4,.55],c);P.legBR=S('c',[.15,1.2,-.55],[.55,2.4,.55],c);
  P.legFL=S('c',[1.15,2.5,.45],[.14,.7,.14],c,[0,0,-.5]);P.legFR=S('c',[1.15,2.5,-.45],[.14,.7,.14],c,[0,0,-.5]);
  P.neck=S('c',[1.3,3.7,0],[.7,.9,.7],c,[0,0,-.8]);P.head=S('s',[2.0,4.1,0],[1,.8,.8],hc);
  P.snout=S('c',[2.8,4.0,0],[.6,1,.55],hc,[0,0,-PI/2]);
  P.eyeL=S('s',[2.2,4.3,.3],[.12,.12,.12],'#111111');P.eyeR=S('s',[2.2,4.3,-.3],[.12,.12,.12],'#111111');
  P.tail=S('k',[-2.99,2.82,0],[.9,3.6,.9],c,[0,0,PI/2+.1]);return P;}},
 ostrich:{name:'Common ostrich',sci:'Struthio camelus',mass:110,col:'#2b2b2b',mk:()=>bird({bl:.8,bh:.7,bw:.55,leg:1.1,lt:.09,lc:'#d8a98a',nl:1.0,na:.15,nt:.12,nc:'#d8a98a',hs:.13,sl:.08,bc:'#e0b97a',w:[.5,.5,.1],wy:.1,tl:.35,tw:.4,c:'#2b2b2b'})},
 eagle:{name:'Bald eagle',sci:'Haliaeetus leucocephalus',mass:5,col:'#5b3a22',mk:()=>bird({bl:.45,bh:.26,bw:.24,leg:.18,lt:.03,lc:'#e8c33a',nl:.08,na:.6,nt:.1,hs:.12,sl:.06,bc:'#e8c33a',hc:'#f2f2f2',w:[.45,.04,1.0],wy:.05,tl:.3,tw:.25,c:'#5b3a22'})},
 elephant:{name:'African elephant',sci:'Loxodonta africana',mass:5500,col:'#8b8680',mk:()=>quad({bl:3.4,bh:2.0,bw:1.4,leg:1.6,lt:.55,nl:.3,nt:1.0,na:.7,hs:1.1,sl:0,ear:0,tl:1.0,ta:1.4,tt:.1,c:'#8b8680',
  x(P,k){P.trunk=S('c',[k.hx+k.hs*.55,k.hy-k.hs*.3-.9,0],[.35,1.8,.35],k.c,[0,0,-.12]);
   P.earL=S('s',[k.hx-k.hs*.2,k.hy+.1,k.hs*.55],[k.hs*.8,k.hs*.95,.08],k.c);P.earR=S('s',[k.hx-k.hs*.2,k.hy+.1,-k.hs*.55],[k.hs*.8,k.hs*.95,.08],k.c);
   P.tuskL=S('k',[k.hx+k.hs*.45+.4,k.hy-k.hs*.4-.1,k.hs*.32],[.12,1.3,.12],IV,[0,0,-1.9]);P.tuskR=S('k',[k.hx+k.hs*.45+.4,k.hy-k.hs*.4-.1,-k.hs*.32],[.12,1.3,.12],IV,[0,0,-1.9]);}})},
 mammoth:{name:'Woolly mammoth',sci:'Mammuthus primigenius',mass:6000,ext:.004,col:'#6b4a32',mk:()=>quad({bl:3.0,bh:1.9,bw:1.4,leg:1.15,lt:.55,nl:.3,nt:1.0,na:.6,hs:1.1,sl:0,ear:0,tl:.6,ta:1.4,tt:.1,c:'#6b4a32',lc:'#5a3d29',
  x(P,k){P.trunk=S('c',[k.hx+k.hs*.55,k.hy-k.hs*.3-.7,0],[.38,1.4,.38],k.c,[0,0,-.12]);
   P.earL=S('s',[k.hx-k.hs*.2,k.hy+.05,k.hs*.5],[k.hs*.35,k.hs*.4,.06],k.c);P.earR=S('s',[k.hx-k.hs*.2,k.hy+.05,-k.hs*.5],[k.hs*.35,k.hs*.4,.06],k.c);
   P.tuskL=S('k',[k.hx+k.hs*.45+1.3,k.hy-k.hs*.5,k.hs*.4],[.16,2.8,.16],IV,[0,0,-1.5]);P.tuskR=S('k',[k.hx+k.hs*.45+1.3,k.hy-k.hs*.5,-k.hs*.4],[.16,2.8,.16],IV,[0,0,-1.5]);
   P.dome=S('s',[k.hx-k.hs*.3,k.hy+k.hs*.45,0],[k.hs*.9,k.hs*.7,k.hs*.8],k.c);P.fur=S('s',[0,k.by-k.bh*.25,0],[k.bl*1.02,k.bh*.9,k.bw*1.15],'#4d3524');}})},
 human:{name:'Human',sci:'Homo sapiens',mass:70,col:'#e0b08a',mk:()=>biped({leg:.9,th:.6,tw:.4,td:.22,lt:.14,al:.7,at:.08,hs:.22,sl:.03,c:'#e0b08a'})},
 chimp:{name:'Chimpanzee',sci:'Pan troglodytes',mass:45,col:'#3b2a22',mk:()=>biped({leg:.45,th:.5,tw:.4,td:.3,lt:.12,al:.8,at:.09,hs:.22,sl:.1,c:'#3b2a22'})},
 wolf:{name:'Gray wolf',sci:'Canis lupus',mass:40,col:'#8a8a8a',mk:()=>quad({bl:.9,bh:.35,bw:.3,leg:.5,lt:.09,nl:.2,na:.9,nt:.14,hs:.22,sl:.12,ear:.8,tl:.4,ta:.5,tt:.08,c:'#8a8a8a'})},
 dog:{name:'Domestic dog',sci:'Canis familiaris',mass:30,col:'#d9a441',mk:()=>quad({bl:.75,bh:.33,bw:.28,leg:.38,lt:.09,nl:.15,na:.8,nt:.14,hs:.2,sl:.1,ear:.9,tl:.4,ta:.1,tt:.07,c:'#d9a441'})},
 bear:{name:'Brown bear',sci:'Ursus arctos',mass:270,col:'#6b4a2f',mk:()=>quad({bl:1.5,bh:.75,bw:.6,leg:.55,lt:.2,nl:.15,na:.9,nt:.35,hs:.38,sl:.2,ear:.35,tl:.1,ta:.4,tt:.12,c:'#6b4a2f',
  x(P,k){P.hump=S('s',[k.ax-k.bl*.12,k.by+k.bh*.45,0],[k.bl*.3,k.bh*.5,k.bw*.8],k.c);}})},
 lion:{name:'Lion',sci:'Panthera leo',mass:190,col:'#c9985a',mk:()=>quad({bl:1.7,bh:.65,bw:.5,leg:.75,lt:.17,nl:.3,na:.9,nt:.3,hs:.38,sl:.18,ear:.5,tl:.9,ta:.6,tt:.08,c:'#c9985a',
  x(P,k){P.mane=S('s',[k.hx-k.hs*.25,k.hy-k.hs*.05,0],[k.hs*1.7,k.hs*1.7,k.hs*1.8],'#6b3f1d');P.tuft=S('s',[k.tend[0],k.tend[1],0],[.14,.2,.14],'#4a2c12');}})},
 cat:{name:'Domestic cat',sci:'Felis catus',mass:4.5,col:'#c87f3b',mk:()=>quad({bl:.45,bh:.2,bw:.17,leg:.22,lt:.05,nl:.08,na:.9,nt:.1,hs:.12,sl:.04,ear:1,tl:.3,ta:-.3,tt:.04,c:'#c87f3b'})},
 horse:{name:'Horse',sci:'Equus caballus',mass:500,col:'#7a4a2a',mk:()=>quad({bl:1.5,bh:.55,bw:.4,leg:1.0,lt:.09,nl:.7,na:.6,nt:.2,hs:.3,sl:.3,sw:1.1,ear:.5,tl:.7,ta:1.0,tt:.08,c:'#7a4a2a',tcol:'#2a1a10',
  x(P,k){const n=P.neck;P.mane=S('b',[n.p[0]-.08,n.p[1]+.06,0],[.05,k.nl,.1],'#2a1a10',[0,0,-k.a]);}})},
 zebra:{name:'Plains zebra',sci:'Equus quagga',mass:350,col:'#e8e8e8',mk:()=>quad({bl:1.4,bh:.6,bw:.45,leg:.9,lt:.1,nl:.5,na:.6,nt:.2,hs:.3,sl:.25,sw:1.1,ear:.6,tl:.5,ta:1.0,tt:.07,c:'#e8e8e8',tcol:'#222222',
  x(P,k){[-.3,0,.3].forEach((x,i)=>P['stripe'+(i+1)]=S('b',[x*k.bl*.9,k.by,0],[.06,k.bh*.9,k.bw*.95],'#222222'));}})},
 giraffe:{name:'Giraffe',sci:'Giraffa camelopardalis',mass:1200,col:'#d9a441',mk:()=>quad({bl:1.8,bh:.9,bw:.5,leg:2.0,lt:.15,nl:2.2,na:.35,nt:.22,hs:.4,sl:.25,ear:.5,tl:.8,ta:1.3,tt:.06,c:'#d9a441',tcol:'#4a2c12',
  x(P,k){P.hornL=S('c',[k.hx-k.hs*.1,k.hy+k.hs*.75,k.hs*.2],[.06,.3,.06],'#6b4a2a');P.hornR=S('c',[k.hx-k.hs*.1,k.hy+k.hs*.75,-k.hs*.2],[.06,.3,.06],'#6b4a2a');}})},
 okapi:{name:'Okapi',sci:'Okapia johnstoni',mass:250,col:'#5a3a2a',mk:()=>quad({bl:1.5,bh:.6,bw:.38,leg:1.0,lt:.1,nl:.6,na:.5,nt:.18,hs:.3,sl:.25,ear:1,tl:.4,ta:1.2,tt:.05,c:'#5a3a2a',lc:'#e8e8e8',
  x(P,k){P.hornL=S('c',[k.hx-k.hs*.1,k.hy+k.hs*.7,k.hs*.2],[.04,.12,.04],'#6b4a2a');P.hornR=S('c',[k.hx-k.hs*.1,k.hy+k.hs*.7,-k.hs*.2],[.04,.12,.04],'#6b4a2a');}})}
};
Object.keys(SP).forEach(id=>{SP[id].id=id;SP[id].parts=SP[id].mk();});

