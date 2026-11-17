// ===== taxonomy, loaded lazily from /api (NCBI taxonomy, the tree LifeMap draws) =====
const ROOT={id:1,name:'Life',common:'',rank:'root',parent:null,kids:[],depth:0,count:0,loaded:false,open:true,kidsFetched:0,total:0};
const BYID=new Map([[1,ROOT]]);
const HAND={'Carcharodon carcharias':'shark','Crocodylus niloticus':'croc','Tyrannosaurus rex':'trex','Struthio camelus':'ostrich','Haliaeetus leucocephalus':'eagle','Loxodonta africana':'elephant','Mammuthus primigenius':'mammoth','Homo sapiens':'human','Pan troglodytes':'chimp','Canis lupus':'wolf','Canis lupus familiaris':'dog','Ursus arctos':'bear','Panthera leo':'lion','Felis catus':'cat','Equus caballus':'horse','Equus quagga':'zebra','Giraffa camelopardalis':'giraffe','Okapia johnstoni':'okapi'};
const SPRANK=new Set(['species','subspecies','varietas','forma','forma specialis','strain','isolate','serotype','serogroup','pathogroup','biotype','morph','genotype','subvariety']);
const isSp=n=>SPRANK.has(n.rank);
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
function label(n){if(n.hand)return SP[n.hand].name;return isSp(n)&&n.common?cap(n.common):n.name;}
function pathOf(n){const a=[];for(;n&&n!==ROOT;n=n.parent)a.push(n);return a.reverse();}
async function api(u){const r=await fetch(u);if(!r.ok)throw new Error(u+' '+r.status);return r.json();}
function mk(r,parent){let n=BYID.get(r.id);
  if(!n){n={id:r.id,name:r.s,common:r.c||'',rank:r.r,count:r.n,parent,kids:[],depth:parent.depth+1,loaded:false,open:false,kidsFetched:0,total:0};
    if(HAND[n.name]&&isSp(n)){n.hand=HAND[n.name];SP[n.hand].node=n;}BYID.set(n.id,n);}
  if(!parent.kids.includes(n))parent.kids.push(n);return n;}
// pseudo row shown at the end of a long list of children
function moreRow(n){if(!n.mr)n.mr={more:true,parent:n,depth:n.depth+1,kids:[],count:0,name:'',rank:'',id:'more'+n.id};return n.mr;}
const hasMore=n=>n.loaded&&n.kidsFetched<n.total;
const kidsOf=n=>hasMore(n)?n.kids.concat([moreRow(n)]):n.kids;
async function loadKids(n){if(n.loading||(n.loaded&&!hasMore(n)))return;n.loading=true;
  try{const d=await api(`/api/children?id=${n.id}&offset=${n.kidsFetched}&limit=200`);d.kids.forEach(r=>mk(r,n));n.kidsFetched+=d.kids.length;n.total=d.total;n.loaded=true;}
  finally{n.loading=false;}}
// make sure a taxon and its ancestors exist in memory and are open, so it is visible
async function revealId(id){const p=await api('/api/path?id='+id);let par=ROOT,last=ROOT;
  for(const r of p){if(r.id===1)continue;last=mk(r,par);par.open=true;par=last;}
  const chain=[];for(let n=last.parent;n;n=n.parent)chain.push(n);await Promise.all(chain.map(c=>c.loaded?0:loadKids(c)));return last;}
async function findByName(name){const r=await api('/api/search?exact=1&q='+encodeURIComponent(name));return r[0]?await revealId(r[0].id):null;}
