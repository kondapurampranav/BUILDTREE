// ──────────────────────────────────────────────────────────────
// CONSTANTS
const RATE = 1200; // ₹/sq.ft basic structure cost
const COLORS = ['#E8A838','#2DD4BF','#F87171','#818CF8','#34D399','#FB923C'];

// ──────────────────────────────────────────────────────────────
// HELPERS
const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
const n = (id, fallback=0) => parseFloat(document.getElementById(id)?.value) || fallback;
const nv = (v, fallback=0) => parseFloat(v) || fallback;
const el = id => document.getElementById(id);

// ──────────────────────────────────────────────────────────────
// NAVIGATION
function startApp(){
  el('page-home').classList.remove('active');
  el('app-shell').classList.remove('hidden');
}
function goHome(){
  el('app-shell').classList.add('hidden');
  el('page-home').classList.add('active');
}
function switchPage(pageId, btn){
  // hide all inner pages
  ['house','modules','dashboard'].forEach(id=>{
    el('page-'+id).classList.add('hidden');
    el('page-'+id).classList.remove('active');
  });
  el('page-'+pageId).classList.remove('hidden');
  el('page-'+pageId).classList.add('active');
  // nav tabs
  document.querySelectorAll('.nav-tab[data-page]').forEach(t=>t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  // trigger dashboard render when switching to it
  if(pageId==='dashboard') renderDashboard();
  window.scrollTo(0,0);
}
function switchMod(modId, btn){
  document.querySelectorAll('.module-panel').forEach(p=>{p.classList.remove('active')});
  document.querySelectorAll('.mod-tab').forEach(t=>t.classList.remove('active'));
  el('mod-'+modId).classList.add('active');
  btn.classList.add('active');
}

// ──────────────────────────────────────────────────────────────
// HOUSE CALC
function getArea(){ return n('h-length') * n('h-breadth') * n('h-floors')}
function perimeter(){ return 2*(n('h-length') + n('h-breadth'))}
function getRooms(){ return n('h-rooms')}
function getBaths(){ return n('h-baths') }
function getHeight(){ return n('h-height',10) }
function getFloors(){ return n('h-floors') }
function getWallArea(){
  const sqft=getArea(), h=getHeight(), peri = perimeter(), floors = getFloors();
  return Math.round((3*peri*h)*floors);
}

function calcHouse(){
  const sqft=getArea();
  if(sqft<=0){ el('house-result').classList.add('hidden'); return; }
  el('house-result').classList.remove('hidden');
  const rooms=getRooms(), baths=getBaths(), h=getHeight();
  const wallArea=getWallArea();
  el('r-area').textContent=sqft.toLocaleString('en-IN');
  el('r-spaces').textContent=(rooms+baths)*getFloors();
  el('r-wall').textContent=wallArea.toLocaleString('en-IN');
  const visible=sqft*RATE;
  el('r-visible').textContent=fmt(visible);
  el('r-detail').textContent=`Based on ₹${RATE.toLocaleString('en-IN')}/sq.ft × ${sqft.toLocaleString('en-IN')} sq.ft — This is what most contractors quote initially`;
  // also trigger module recalcs
  calcFlooring(); calcElectrical(); calcPainting(); calcPlumbing(); calcRoofing();
}

// ──────────────────────────────────────────────────────────────
// BREAKDOWN BUILDER
function makeBrow(label, value, type='normal'){
  const cls = type==='hidden'?'hidden-item':type==='visible'?'visible-item':type==='total'?'total-item':'';
  return `<div class="brow ${cls}"><span class="brow-label">${label}</span><span class="brow-val">${fmt(value)}</span></div>`;
}

// ──────────────────────────────────────────────────────────────
// FLOORING
function calcFlooring(){
  const sqft=getArea()||100;
  const tileCost=n('f-tile'), labour=n('f-labour'), polish=n('f-polish');
  const adhesive=n('f-adhesive'), transport=n('f-transport');
  const wastage=0.08, effectiveArea=sqft*(1+wastage);
  const cutting=sqft*4;
  const visibleTile=sqft*tileCost;
  const wastageCost=(effectiveArea-sqft)*tileCost;
  const totalLabour=sqft*labour;
  const totalPolish=sqft*polish;
  const totalAdhesive=sqft*adhesive;
  const total=effectiveArea*tileCost+totalLabour+totalPolish+totalAdhesive+cutting+transport;
  el('flooring-breakdown').innerHTML=
    makeBrow(`Tile Cost (${sqft.toLocaleString('en-IN')} sq.ft × ₹${tileCost})`,visibleTile,'visible')+
    makeBrow(`Labour (${sqft.toLocaleString('en-IN')} sq.ft × ₹${labour})`,totalLabour,'visible')+
    makeBrow('Tile Wastage (8% extra tiles)',wastageCost,'hidden')+
    makeBrow('Tile Cutting Charges (₹4/sq.ft)',cutting,'hidden')+
    makeBrow(`Polishing (${sqft.toLocaleString('en-IN')} sq.ft × ₹${polish})`,totalPolish,'hidden')+
    makeBrow(`Adhesive/Cement (${sqft.toLocaleString('en-IN')} sq.ft × ₹${adhesive})`,totalAdhesive,'hidden')+
    makeBrow('Transportation',transport,'hidden')+
    makeBrow('TOTAL FLOORING COST',total,'total');
}

// ──────────────────────────────────────────────────────────────
// ELECTRICAL
function calcElectrical(){
  const sqft = getArea()||100, rooms = getRooms(), baths = getBaths();
  const switchboards=rooms*3+4;
  const wallCutting=rooms*800;
  el('elec-sub').textContent=`Switchboard count auto-set to ${switchboards} (${rooms} rooms × 3 + extras). Wall-cutting charges auto-calculated.`;
  const wiring=n('e-wiring'), extraSwitch=n('e-switches'), labour=n('e-labour');
  const conduit=n('e-conduit'), fittings=n('e-fittings'), transport=n('e-transport');

  // Calculations ----
  const wiringCost = wiring;
  const switchCost = (switchboards+extraSwitch) * 350;
  const labourCost = sqft*labour;
  const conduitCost = (rooms+baths) * conduit * 120;
  const fittingsCost = (switchboards+fittings) * 200;
  const total = wiringCost + switchCost + labourCost + conduitCost + fittingsCost + wallCutting + transport;

  el('electrical-breakdown').innerHTML=
    makeBrow(`Total Wiring Cost`, wiringCost, 'visible')+
    makeBrow(`Switchboards (${switchboards} boards × ₹350)`,switchCost,'visible')+
    makeBrow(`Labour (${sqft.toLocaleString('en-IN')} sq.ft × ₹${labour})`,labourCost,'hidden')+
    makeBrow(`Conduit Pipes (${sqft.toLocaleString('en-IN')} sq.ft × ₹${conduit})`,conduitCost,'hidden')+
    makeBrow(`Fittings/Accessories (${switchboards} points × ₹200)`,fittingsCost,'hidden')+
    makeBrow(`Wall Cutting Charges (${rooms} rooms × ₹800)`,wallCutting,'hidden')+
    makeBrow('Transportation',transport,'hidden')+
    makeBrow('TOTAL ELECTRICAL COST',total,'total');
}

// ──────────────────────────────────────────────────────────────
// PAINTING
function calcPainting(){
  const sqft=getArea()||100, wallArea=getWallArea()||200;
  const totalArea=sqft+wallArea;
  el('paint-sub').textContent=`Total paint area: ${totalArea.toLocaleString('en-IN')} sq.ft (ceiling + walls). Sanding/prep auto-calculated.`;
  const paint=n('p-paint'), primer=n('p-primer'), putty=n('p-putty');
  const labour=n('p-labour'), scaffold=n('p-scaffold'), transport=n('p-transport');
  const paintCost=totalArea*paint;
  const primerCost=totalArea*primer;
  const puttyCost=totalArea*putty;
  const labourCost=totalArea*labour;
  const sandingCost=totalArea*5;
  const total=paintCost+primerCost+puttyCost+labourCost+sandingCost+scaffold+transport;
  el('painting-breakdown').innerHTML=
    makeBrow(`Paint Cost (${totalArea.toLocaleString('en-IN')} sq.ft × ₹${paint})`,paintCost,'visible')+
    makeBrow(`Primer (${totalArea.toLocaleString('en-IN')} sq.ft × ₹${primer})`,primerCost,'visible')+
    makeBrow(`Putty (${totalArea.toLocaleString('en-IN')} sq.ft × ₹${putty})`,puttyCost,'hidden')+
    makeBrow(`Labour (${totalArea.toLocaleString('en-IN')} sq.ft × ₹${labour})`,labourCost,'hidden')+
    makeBrow('Sanding/Surface Prep (₹5/sq.ft)',sandingCost,'hidden')+
    makeBrow('Scaffolding Charges',scaffold,'hidden')+
    makeBrow('Transportation',transport,'hidden')+
    makeBrow('TOTAL PAINTING COST',total,'total');
}

// ──────────────────────────────────────────────────────────────
// PLUMBING
function calcPlumbing(){
  const baths=getBaths();
  const wallBreaking=baths*3500;
  el('plumb-sub').textContent=`Wall-breaking charges auto-set for ${baths} bathroom(s) at ₹3,500 each.`;
  const pipes=n('pl-pipes'), fittings=n('pl-fittings'), water=n('pl-water');
  const labour=n('pl-labour'), drain=n('pl-drain'), transport=n('pl-transport');
  const total=pipes+fittings+water+labour+drain+wallBreaking+transport;
  el('plumbing-breakdown').innerHTML=
    makeBrow('Pipe Cost',pipes,'visible')+
    makeBrow('Fittings Cost',fittings,'visible')+
    makeBrow('Waterproofing / Sealing',water,'hidden')+
    makeBrow('Labour Charges',labour,'hidden')+
    makeBrow('Drainage Accessories',drain,'hidden')+
    makeBrow(`Wall Breaking/Installation (${baths} baths × ₹3,500)`,wallBreaking,'hidden')+
    makeBrow('Transportation',transport,'hidden')+
    makeBrow('TOTAL PLUMBING COST',total,'total');
}

// ──────────────────────────────────────────────────────────────
// ROOFING
function calcRoofing(){
  const sqft=getArea()||100;
  const drainageSlope=sqft*12;
  el('roof-sub').textContent=`Drainage slope finishing (₹12/sq.ft = ${fmt(drainageSlope)}) auto-calculated from roof area.`;
  const waterproof=n('r-waterproof'), insulation=n('r-insulation');
  const labour=n('r-labour'), transport=n('r-transport');
  const wCost=sqft*waterproof, iCost=sqft*insulation, lCost=sqft*labour;
  const total=wCost+iCost+lCost+drainageSlope+transport;
  el('roofing-breakdown').innerHTML=
    makeBrow(`Waterproofing (${sqft.toLocaleString('en-IN')} sq.ft × ₹${waterproof})`,wCost,'visible')+
    makeBrow(`Insulation (${sqft.toLocaleString('en-IN')} sq.ft × ₹${insulation})`,iCost,'hidden')+
    makeBrow(`Labour (${sqft.toLocaleString('en-IN')} sq.ft × ₹${labour})`,lCost,'hidden')+
    makeBrow('Drainage Slope Finishing (₹12/sq.ft)',drainageSlope,'hidden')+
    makeBrow('Transportation',transport,'hidden')+
    makeBrow('TOTAL ROOFING COST',total,'total');
}

// ──────────────────────────────────────────────────────────────
// ESTIMATE COSTS (for dashboard)
function estimateCosts(){
  const sqft=getArea();
  if(!sqft) return null;
  const rooms=getRooms(), baths=getBaths(), wallArea=getWallArea();
  const totalPaintArea=sqft+wallArea;
  const switchboards=rooms*3+4;

  const visibleBase=sqft*RATE;

  // Flooring
  const tc=n('f-tile'), fl=n('f-labour'), fp=n('f-polish'), fa=n('f-adhesive'), ft=n('f-transport');
  const flooringVis=sqft*(tc+fl);
  const flooringTotal=sqft*(tc*1.08+fl+fp+fa+4)+ft;
  const flooringHidden=flooringTotal-flooringVis;

  // Electrical
  const ew=n('e-wiring'), es=n('e-switches'), el_=n('e-labour'), ec=n('e-conduit'), ef=n('e-fittings'), et=n('e-transport');
  const elecVis=ew+switchboards*350;
  const elecTotal=ew+(sqft*el_)+((rooms+baths)*ec*120)+switchboards*(350+200)+es+ef+rooms*800+et;
  const elecHidden=elecTotal-elecVis;

  // Painting
  const pp=n('p-paint'), ppr=n('p-primer'), ppu=n('p-putty'), pl=n('p-labour'), ps=n('p-scaffold'), ptr=n('p-transport');
  const paintVis=totalPaintArea*(pp+ppr);
  const paintTotal=totalPaintArea*(pp+ppr+ppu+pl+5)+ps+ptr;
  const paintHidden=paintTotal-paintVis;

  // Plumbing
  const plpi=n('pl-pipes'), plfi=n('pl-fittings'), plw=n('pl-water'), plla=n('pl-labour'), pld=n('pl-drain'), plt=n('pl-transport');
  const plumbVis=plpi+plfi;
  const plumbTotal=plpi+plfi+plw+plla+pld+baths*3500+plt;
  const plumbHidden=plumbTotal-plumbVis;

  // Roofing
  const rw=n('r-waterproof'), ri=n('r-insulation'), rl=n('r-labour'), rt=n('r-transport');
  const roofVis=sqft*rw;
  const roofTotal=sqft*(rw+ri+rl+12)+rt;
  const roofHidden=roofTotal-roofVis;

  const totalHidden=flooringHidden+elecHidden+paintHidden+plumbHidden+roofHidden;
  const totalCost=visibleBase+flooringTotal+elecTotal+paintTotal+plumbTotal+roofTotal;
  const pct=((totalCost-visibleBase)/visibleBase*100).toFixed(1);

  return{visibleBase,flooringTotal,elecTotal,paintTotal,plumbTotal,roofTotal,
    flooringHidden,elecHidden,paintHidden,plumbHidden,roofHidden,
    totalHidden,totalCost,pct,sqft};
}

// ──────────────────────────────────────────────────────────────
// CHARTS
let pieChart=null, compareChart=null, barChart=null;

function destroyCharts(){
  if(pieChart){pieChart.destroy();pieChart=null}
  if(compareChart){compareChart.destroy();compareChart=null}
  if(barChart){barChart.destroy();barChart=null}
}

const chartDefaults={
  color:'#6B7080',
  plugins:{legend:{labels:{color:'#6B7080',font:{family:"'DM Sans'",size:12},boxWidth:10,padding:12}},
    tooltip:{backgroundColor:'#1C1E28',borderColor:'#2A2D3E',borderWidth:1,
      titleColor:'#6B7080',bodyColor:'#E8E9F0',callbacks:{label:ctx=>' '+fmt(ctx.raw)}}},
};

function renderDashboard(){
  const c=estimateCosts();
  if(!c){
    el('dash-empty').classList.remove('hidden');
    el('dash-content').classList.add('hidden');
    return;
  }
  el('dash-empty').classList.add('hidden');
  el('dash-content').classList.remove('hidden');

  // KPI
  el('d-quote').textContent=fmt(c.visibleBase);
  el('d-hidden').textContent=fmt(c.totalHidden);
  el('d-total').textContent=fmt(c.totalCost);
  el('d-pct').innerHTML=`<span class="pct-badge">+${c.pct}% more than quoted</span>`;

  // Summary breakdown
  const items=[
    {l:'Basic Structure (Contractor Quote)',v:c.visibleBase,t:'visible'},
    {l:'Flooring / Tiles',v:c.flooringTotal,t:'normal'},
    {l:'Electrical Works',v:c.elecTotal,t:'normal'},
    {l:'Painting',v:c.paintTotal,t:'normal'},
    {l:'Plumbing',v:c.plumbTotal,t:'normal'},
    {l:'Roofing',v:c.roofTotal,t:'normal'},
  ];
  el('d-summary').innerHTML=items.map(i=>makeBrow(i.l,i.v,i.t)).join('')+
    makeBrow('ACTUAL TOTAL CONSTRUCTION COST',c.totalCost,'total');

  // Progress bars
  const progressColors=['#2DD4BF','#E8A838','#818CF8','#FB923C','#34D399','#F87171'];
  const progressItems=[
    {l:'Basic Structure',v:c.visibleBase},
    {l:'Flooring',v:c.flooringTotal},
    {l:'Electrical',v:c.elecTotal},
    {l:'Painting',v:c.paintTotal},
    {l:'Plumbing',v:c.plumbTotal},
    {l:'Roofing',v:c.roofTotal},
  ];
  el('d-progress').innerHTML=progressItems.map((r,i)=>`
    <div class="progress-row">
      <div class="progress-header"><span>${r.l}</span><span>${fmt(r.v)}</span></div>
      <div class="progress-wrap"><div class="progress-fill" style="width:${(r.v/c.totalCost*100).toFixed(1)}%;background:${progressColors[i]}"></div></div>
    </div>
  `).join('');

  // Charts
  destroyCharts();
  const gridColor='rgba(42,45,62,0.8)';

  // PIE
  pieChart=new Chart(el('chart-pie'),{
    type:'doughnut',
    data:{
      labels:['Basic Structure','Flooring','Electrical','Painting','Plumbing','Roofing'],
      datasets:[{data:[c.visibleBase,c.flooringTotal,c.elecTotal,c.paintTotal,c.plumbTotal,c.roofTotal].map(Math.round),
        backgroundColor:COLORS,borderWidth:2,borderColor:'#1C1E28',hoverBorderColor:'#1C1E28'}]
    },
    options:{...chartDefaults,cutout:'55%',plugins:{...chartDefaults.plugins}}
  });

  // COMPARE BAR
  compareChart=new Chart(el('chart-compare'),{
    type:'bar',
    data:{
      labels:['Contractor Quote','Actual Total'],
      datasets:[{data:[Math.round(c.visibleBase),Math.round(c.totalCost)],
        backgroundColor:['#2DD4BF','#E8A838'],borderRadius:8,borderSkipped:false}]
    },
    options:{...chartDefaults,
      scales:{x:{ticks:{color:'#6B7080'},grid:{color:gridColor}},
              y:{ticks:{color:'#6B7080',callback:v=>'₹'+(v/100000).toFixed(0)+'L'},grid:{color:gridColor}}},
      plugins:{...chartDefaults.plugins,legend:{display:false}}}
  });

  // STACKED BAR
  const cats=['Flooring','Electrical','Painting','Plumbing','Roofing'];
  const visibles=[c.flooringTotal-c.flooringHidden,c.elecTotal-c.elecHidden,c.paintTotal-c.paintHidden,c.plumbTotal-c.plumbHidden,c.roofTotal-c.roofHidden].map(Math.round);
  const hiddens=[c.flooringHidden,c.elecHidden,c.paintHidden,c.plumbHidden,c.roofHidden].map(Math.round);
  barChart=new Chart(el('chart-bar'),{
    type:'bar',
    data:{labels:cats,
      datasets:[
        {label:'Visible',data:visibles,backgroundColor:'#2DD4BF',borderRadius:4,stack:'a'},
        {label:'Hidden',data:hiddens,backgroundColor:'#F87171',borderRadius:4,stack:'a'},
      ]
    },
    options:{...chartDefaults,
      scales:{x:{ticks:{color:'#6B7080'},grid:{color:gridColor},stacked:true},
              y:{ticks:{color:'#6B7080',callback:v=>'₹'+(v/1000).toFixed(0)+'K'},grid:{color:gridColor},stacked:true}},
      plugins:{...chartDefaults.plugins}}
  });

  // Insight
  el('d-insight').innerHTML=`Your contractor's initial quote of <strong style="color:#2DD4BF">${fmt(c.visibleBase)}</strong> covers only the basic structure. The actual construction cost including all hidden expenses is <strong style="color:#E8A838">${fmt(c.totalCost)}</strong> — that's <strong style="color:#F87171">${c.pct}% more</strong> than what was quoted. Always demand a fully itemized estimate before signing any contract.`;
}

// ──────────────────────────────────────────────────────────────
// INIT
window.addEventListener('DOMContentLoaded',()=>{
  calcFlooring(); calcElectrical(); calcPainting(); calcPlumbing(); calcRoofing();
});