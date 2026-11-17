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
