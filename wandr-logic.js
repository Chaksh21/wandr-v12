// wandr-logic.js - pure helpers and constants (no state, no DOM).
// Depends on wandr-data.js (loaded first) which sets window.WANDR_DATASET.
// All top-level `var`/`function` declarations become window globals so the
// DCLogic script inside Wandr-App.dc.html can reference them by bare name.

var DATASET = window.WANDR_DATASET;

var VERSION = 'wandr:v1';
// CURRENT_SCHEMA history:
//   1 - initial shape: {trips[], activeTripId, user, shortlist}
// To bump: increment CURRENT_SCHEMA, then add a migration branch in
// hydrateFromStorage() (wandr-flow.js) keyed off the OLD schema number,
// e.g. `if (schemaNum === 1) { d = migrateV1toV2(d); }` before validation.
// Keep each migration function pure (old shape in, new shape out, no throw).
var CURRENT_SCHEMA = 1;

// ---------- group (shared sample across trips) ----------
var MEMBERS = [
  { id:'me', name:'You',   role:'PLANNER · ADMIN', status:'joined',  type:'app',       bg:'#FF5A1F', sub:'Balanced pace · Chill, Foodie' },
  { id:'m2', name:'Aanya', role:'COLLABORATOR',    status:'joined',  type:'app',       bg:'#1F8A5F', sub:'Packed pace · Adventure, Active' },
  { id:'m3', name:'Rohit', role:'COLLABORATOR',    status:'pending', type:'app',       bg:'#7A6E5C', sub:'Slow pace · Chill, Culture' },
  { id:'m4', name:'Dadi',  role:'COMPANION',       status:'joined',  type:'companion', bg:'#B0451A', sub:'Added by You - on the trip, not on the app' },
];
var APP_MEMBERS = MEMBERS.filter(function(m){ return m.type!=='companion'; });
var ALL_COUNT = MEMBERS.length;       // headcount & costs (companions travel too)
var APP_COUNT = APP_MEMBERS.length;   // votes, vetoes, sync claims
var PACKING_DEFAULT = [
  { label:'Bluetooth speaker', owner:'Aanya', done:false },
  { label:'First-aid kit', owner:'You', done:true },
  { label:'Power bank + cables', owner:'Rohit', done:false },
  { label:'Snacks for the drive', owner:'Dadi', done:true },
  { label:'Cards / UNO', owner:'You', done:false },
];
var FAMOUS_IN = ['varanasi','leh','ladakh','munnar','pondicherry','coorg','darjeeling','agra','amritsar','mysore','hampi','ooty','alleppey','kasol','mcleodganj'];
var FAMOUS_INTL = ['kyoto','lisbon','bali','paris','bangkok','dubai','singapore','london'];
function editDist(a,b){ if(Math.abs(a.length-b.length)>2) return 9; const m=[]; for(let i=0;i<=a.length;i++){ m[i]=[i]; for(let j=1;j<=b.length;j++){ m[i][j] = i===0 ? j : Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } } return m[a.length][b.length]; }
var STYLE_CAT = { CHILL:['nature','food'], ACTIVE:['nature'], FOODIE:['food'], CULTURE:['sights'], ADVENTURE:['nature'], LUXURY:['food'], BUDGET:['sights'] };

// ---------- date helpers ----------
var TRIP_MONTH = 7; // fictional month
var FICTIONAL_TODAY = '2026-07-12'; // the app's frozen "today"
function dParse(iso){ const [y,m,d]=iso.split('-').map(Number); return Date.UTC(y,m-1,d); }
function tripDaysUntil(t){ if (!t.dates) return null; return Math.round((dParse(t.dates.start)-dParse(FICTIONAL_TODAY))/86400000); }
function tripDayOf(t){ if (!t.dates) return 1; return Math.max(1, Math.round((dParse(FICTIONAL_TODAY)-dParse(t.dates.start))/86400000)+1); }
function tripLen(t){ if (!t.dates) return (t.days||[]).length||2; return Math.round((dParse(t.dates.end)-dParse(t.dates.start))/86400000)+1; }
function tripIsLive(t){ const du=tripDaysUntil(t); return t.status==='active' || (t.status==='upcoming' && du!=null && du>=0 && du<=2); }
function fmtRange(t){ if (!t.dates) return ''; const M=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const a=t.dates.start.split('-').map(Number), b=t.dates.end.split('-').map(Number); return (a[1]===b[1]? M[a[1]]+' '+a[2]+'–'+b[2] : M[a[1]]+' '+a[2]+' – '+M[b[1]]+' '+b[2])+', '+a[0]; }

// ---------- taste / matching ----------
var MEMBER_TASTE = { You:['CHILL','FOODIE'], Aanya:['ADVENTURE','ACTIVE'], Rohit:['CHILL','CULTURE'] };
function styleBias(styleTags, cat){ let b=0; (styleTags||[]).forEach(function(t){ if ((STYLE_CAT[t]||[]).includes(cat)) b+=8; }); return b; }
function blendOwner(cat, userTags){
  const tastes = Object.assign({}, MEMBER_TASTE, { You: (userTags&&userTags.length)?userTags:MEMBER_TASTE.You });
  let best='You', bestScore=-1;
  Object.keys(tastes).forEach(function(name){ const sc=styleBias(tastes[name], cat); if (sc>bestScore){ bestScore=sc; best=name; } });
  return best;
}
function matchPct(place, prefs){ const bias=styleBias((prefs&&prefs.styleTags)||[], place.cat); return Math.max(55, Math.min(99, Math.round(place.suitability*0.92 + bias + 4))); }
function seedEvents(dest, tripName){
  return [
    { kind:'edit',    icon:'pencil-simple', text:'Aanya retimed a stop on Day 1',            when:'2M AGO'  },
    { kind:'vote',    icon:'users',         text:'You opened a vote · Evening plan',         when:'11M AGO' },
    { kind:'weather', icon:'map-pin',       text:(dest.alert&&dest.alert.title)||'Weather heads-up', when:'1H AGO' },
    { kind:'join',    icon:'users',         text:'Rohit was invited to '+tripName,           when:'1D AGO'  },
  ];
}
function slugify(q){ return String(q).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'wandr'; }

// ---------- photo map (curated Wikimedia Commons + picsum fallback) ----------
var PHOTO_MAP = {
  'shimla-mall-road-ridge':'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Ridge%20Shimla%203.jpg',
  'shimla-ridge-himalayas-mall-road':'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Ridge%20Shimla%204.jpg',
  'jakhoo-temple-shimla-hanuman':'https://commons.wikimedia.org/wiki/Special:FilePath/Jakhoo%20mandir%20statue%20of%20hanuman.jpg',
  'christ-church-shimla-neo-gothic':'https://commons.wikimedia.org/wiki/Special:FilePath/Christ%20Church%2C%20Shimla.jpg',
  'kufri-shimla-snow-point':'https://commons.wikimedia.org/wiki/Special:FilePath/Road%20to%20Kufri%2C%20Shimla.jpg',
  'shimla-scandal-point-sunset':'https://commons.wikimedia.org/wiki/Special:FilePath/Ridge%20-%20Scandal%20Point%20-%20Shimla%202014-05-07%201215.JPG',
  'kalka-shimla-toy-train-heritage':'https://commons.wikimedia.org/wiki/Special:FilePath/Shimla%20Kalka%20Toy%20train.jpg',
  'annandale-shimla-meadow-pines':'https://commons.wikimedia.org/wiki/Special:FilePath/Annandale%20Shimla%202016.jpg',
  'indian-institute-advanced-study-shimla-viceregal-lodge':'https://commons.wikimedia.org/wiki/Special:FilePath/Indian%20Institute%20of%20Advanced%20Study%2CShimla.jpg',
  'goa-beach-palm-sunset-shack':'https://commons.wikimedia.org/wiki/Special:FilePath/Vagator%20Beach%2C%20Goa%2C%20India%2C%20Palms.jpg',
  'manali-himalayas-snow-valley-river':'https://commons.wikimedia.org/wiki/Special:FilePath/Solang%20Valley%2C%20Manali.jpg',
  'shimla-wake-bake-caf-food':'https://commons.wikimedia.org/wiki/Special:FilePath/A%20small%20cup%20of%20coffee.JPG',
  'shimla-himachali-rasoi-food':'https://commons.wikimedia.org/wiki/Special:FilePath/North%20Indian%20Vegetarian%20Thali-MB51.jpg',
  // ---- Goa ----
  'fort-aguada-goa-lighthouse':'https://commons.wikimedia.org/wiki/Special:FilePath/Lighthouse%20Fort%20Aguada%2C%20Goa.JPG',
  'fontainhas-panjim-portuguese-lanes':'https://commons.wikimedia.org/wiki/Special:FilePath/Panjim%20Inn%20Fontainhas%20Goa.jpg',
  'baga-beach-goa-watersports':'https://commons.wikimedia.org/wiki/Special:FilePath/Baga%20beach.jpg',
  'anjuna-flea-market-goa':'https://commons.wikimedia.org/wiki/Special:FilePath/Anjuna%2C%20Goa%2C%20India%2C%20Anjuna%20Flea%20Market.jpg',
  'goa-beach-shack-seafood-sunset':'https://commons.wikimedia.org/wiki/Special:FilePath/Anjuna%20Beach%2C%20Goa%2C%20India%2C%20Legendary%20Curlies%20beach%20shack%20in%20Anjuna%2C%20late%20afternoon.jpg',
  'dudhsagar-falls-goa-jeep':'https://commons.wikimedia.org/wiki/Special:FilePath/Dudhsagar%20Falls.jpg',
  'goa-cafe-bodega-food':'https://commons.wikimedia.org/wiki/Special:FilePath/A%20small%20cup%20of%20coffee.JPG',
  'goa-vinayak-family-restaurant-food':'https://commons.wikimedia.org/wiki/Special:FilePath/Goan%20Fish%20Thali.jpg',
  'goa-curlies-food':'https://commons.wikimedia.org/wiki/Special:FilePath/Goan%20Fish%20Curry%20Rice.jpg',
  // ---- Manali ----
  'atal-tunnel-sissu-snow-manali':'https://commons.wikimedia.org/wiki/Special:FilePath/Top%20View%20of%20Sissu%20%2C%20Lahaul.jpg',
  'hadimba-temple-manali-cedar-forest':'https://commons.wikimedia.org/wiki/Special:FilePath/Hidimba%20Devi%20Temple.jpg',
  'old-manali-riverside-cafe':'https://commons.wikimedia.org/wiki/Special:FilePath/Old%20Manali%202.jpg',
  'solang-valley-manali-paragliding-snow':'https://commons.wikimedia.org/wiki/Special:FilePath/Paragliders%20at%20Solang%20Valley%2C%20Manali.jpg',
  'manali-mall-road-market':'https://commons.wikimedia.org/wiki/Special:FilePath/Mall%20Road%2C%20Manali.jpg',
  'jogini-falls-manali-trek-vashisht':'https://commons.wikimedia.org/wiki/Special:FilePath/Jogini%20Falls.jpg',
  'manali-drifters-inn-food':'https://commons.wikimedia.org/wiki/Special:FilePath/A%20small%20cup%20of%20coffee.JPG',
  // ---- Jaipur ----
  'jaipur-pink-city-hawa-mahal-fort':'https://commons.wikimedia.org/wiki/Special:FilePath/Hawa%20Mahal%202011.jpg',
  'amber-fort-jaipur-sheesh-mahal':'https://commons.wikimedia.org/wiki/Special:FilePath/Amber%20Fort%2C%20Jaipur%2C%2020191219%201045%209589.jpg',
  'hawa-mahal-jaipur-pink-facade':'https://commons.wikimedia.org/wiki/Special:FilePath/East%20facade%20Hawa%20Mahal%20Jaipur%20from%20ground%20level%20%28July%202022%29%20-%20img%2001.jpg',
  'jaipur-city-palace-courtyard':'https://commons.wikimedia.org/wiki/Special:FilePath/Pitam%20Niwas%20Chowk%2C%20City%20Palace%2C%20Jaipur%2C%2020191218%200958%209054%20DxO.jpg',
  'jantar-mantar-jaipur-sundial-observatory':'https://commons.wikimedia.org/wiki/Special:FilePath/Jaipur%20Jantar%20Mantar%20panorama%202011.jpg',
  'nahargarh-fort-jaipur-sunset-city-view':'https://commons.wikimedia.org/wiki/Special:FilePath/Sunset%20at%20Nahargarh%20Fort.jpg',
  'johari-bazaar-jaipur-jewellery-market':'https://commons.wikimedia.org/wiki/Special:FilePath/Johari%20Bazaar%2C%20Jaipur.jpg',
  'rajasthani-thali-jaipur-dal-baati':'https://commons.wikimedia.org/wiki/Special:FilePath/Rajasthani%20Dal-baati-churma.jpg',
  'jal-mahal-jaipur-lake-water-palace':'https://commons.wikimedia.org/wiki/Special:FilePath/Jaipur%2003-2016%2039%20Jal%20Mahal%20-%20Water%20Palace.jpg',
  'jaipur-rawat-mishthan-bhandar-food':'https://commons.wikimedia.org/wiki/Special:FilePath/North%20Indian%20Vegetarian%20Thali-MB51.jpg',
  'jaipur-laxmi-mishthan-bhandar-lmb-food':'https://commons.wikimedia.org/wiki/Special:FilePath/Rajasthani%20Dal-baati-churma.jpg',
  // ---- Rishikesh ----
  'rishikesh-ganges-lakshman-jhula-bridge-himalayas':'https://commons.wikimedia.org/wiki/Special:FilePath/Rishikesh%2C%20Lakshman%20Jhula.jpg',
  'lakshman-jhula-rishikesh-suspension-bridge':'https://commons.wikimedia.org/wiki/Special:FilePath/Lakshman%20jhula%2C%20Rishikesh.jpg',
  'triveni-ghat-rishikesh-ganga-aarti-lamps':'https://commons.wikimedia.org/wiki/Special:FilePath/Ganga%20Arti%20At%20Triveni%20Ghat%20In%20Rishikesh.jpg',
  'rishikesh-ganga-white-water-rafting-rapids':'https://commons.wikimedia.org/wiki/Special:FilePath/Rafting%20in%20the%20Ganga%2C%20Rishikesh.jpg',
  'beatles-ashram-rishikesh-graffiti-domes':'https://commons.wikimedia.org/wiki/Special:FilePath/Beatles%20Ashram%2001.jpg',
  'parmarth-niketan-rishikesh-ganga-aarti-ashram':'https://commons.wikimedia.org/wiki/Special:FilePath/Parmarth%20Niketan%2C%20Rishikesh%202.jpg',
  'neelkanth-mahadev-temple-rishikesh-hills':'https://commons.wikimedia.org/wiki/Special:FilePath/NeelKanth%20Mahadev%20Temple.JPG',
  'kunjapuri-temple-rishikesh-sunrise-himalayas':'https://commons.wikimedia.org/wiki/Special:FilePath/Kunjapuri%20Temple%2C%20Rishikesh%2C%20Uttarakhand%2C%20India%20%2815110748073%29.jpg',
  'rishikesh-chotiwala-food':'https://commons.wikimedia.org/wiki/Special:FilePath/North%20Indian%20Vegetarian%20Thali-MB51.jpg',
  'rishikesh-ira-s-kitchen-tea-room-food':'https://commons.wikimedia.org/wiki/Special:FilePath/A%20small%20cup%20of%20coffee.JPG',
  // ---- Udaipur ----
  'udaipur-lake-pichola-city-palace-water-sunset':'https://commons.wikimedia.org/wiki/Special:FilePath/City%20Palace%20Udaipur%20Rajasthan%20India.JPG',
  'udaipur-city-palace-lake-pichola-facade':'https://commons.wikimedia.org/wiki/Special:FilePath/20191207%20Lake%20Pichola%2C%20City%20Palace%2C%20Udaipur%2C%201516%207254.jpg',
  'lake-pichola-udaipur-boat-sunset-jag-mandir':'https://commons.wikimedia.org/wiki/Special:FilePath/Udaipur%2C%20India%2C%20Boat%20ride%20on%20Lake%20Pichola.jpg',
  'jag-mandir-island-palace-lake-pichola-udaipur':'https://commons.wikimedia.org/wiki/Special:FilePath/Udaipur%2C%20India%2C%20Jag%20Mandir%20Palace.jpg',
  'bagore-ki-haveli-udaipur-dharohar-dance':'https://commons.wikimedia.org/wiki/Special:FilePath/Udaipur%20Ghoomar%20Folk%20Dance.jpg',
  'saheliyon-ki-bari-udaipur-fountain-garden':'https://commons.wikimedia.org/wiki/Special:FilePath/Saheliyon-ki-Bari%20%28Udaipur%29.jpg',
  'monsoon-palace-sajjangarh-udaipur-hilltop-sunset':'https://commons.wikimedia.org/wiki/Special:FilePath/Sajjangarh%20Monsoon%20Palace%20at%20dusk%2C%20Udaipur%2C%20Rajasthan%2C%20India.jpg',
  'ambrai-restaurant-udaipur-lake-pichola-night-view':'https://commons.wikimedia.org/wiki/Special:FilePath/Ambrai%20Ghat%20Night%20Life.jpg',
  'jagdish-temple-udaipur-indo-aryan-carving':'https://commons.wikimedia.org/wiki/Special:FilePath/Jagdish%20Temple%20Udaipur.jpg',
  'udaipur-ambrai-food':'https://commons.wikimedia.org/wiki/Special:FilePath/North%20Indian%20Vegetarian%20Thali-MB51.jpg',
  'udaipur-jheel-s-ginger-coffee-bar-food':'https://commons.wikimedia.org/wiki/Special:FilePath/A%20small%20cup%20of%20coffee.JPG',
  'udaipur-natraj-dining-hall-food':'https://commons.wikimedia.org/wiki/Special:FilePath/North%20Indian%20Vegetarian%20Thali-MB51.jpg'
};
function photoUrl(q){ var key = slugify(q); return PHOTO_MAP[key] || ('https://picsum.photos/seed/' + key + '/600/400'); }
function moneyFree(n){ return n===0 ? 'Free' : '₹'+Number(n).toLocaleString('en-IN'); }
function moneyRs(n){ return n===0 ? '₹0' : '₹'+Number(n).toLocaleString('en-IN'); }
function pillFor(cat){
  if (cat==='food')   return { bg:'var(--accent-weak)', fg:'var(--tip-ink)', label:'FOOD' };
  if (cat==='nature') return { bg:'rgba(31,138,95,.14)', fg:'#1F8A5F', label:'NATURE' };
  return { bg:'rgba(31,138,95,.14)', fg:'#1F8A5F', label:'SIGHTS' };
}
function shortName(n){ return String(n).split(/[&(]/)[0].trim().split(' ').slice(0,2).join(' '); }
function parseTimeStr(t){ const m=String(t).match(/(\d+):(\d+)\s*(AM|PM)/i); if(!m) return 0; let h=(+m[1])%12; if(/PM/i.test(m[3])) h+=12; return h*60+(+m[2]); }
function minutesToClock(mins){ mins=((mins%1440)+1440)%1440; let h=Math.floor(mins/60), m=mins%60; const ampm=h>=12?'PM':'AM'; h=h%12; if(h===0) h=12; return h+':'+String(m).padStart(2,'0')+' '+ampm; }

// ---------- Phosphor icon paths (inlined) ----------
var ICONS = { 'house':'M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z', 'house-fill':'M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z', 'user':'M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z', 'user-fill':'M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z', 'suitcase-rolling':'M104,88v96a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Zm24-8a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V88A8,8,0,0,0,128,80Zm32,0a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V88A8,8,0,0,0,160,80Zm48-16V208a16,16,0,0,1-16,16H176v16a8,8,0,0,1-16,0V224H96v16a8,8,0,0,1-16,0V224H64a16,16,0,0,1-16-16V64A16,16,0,0,1,64,48H88V24A24,24,0,0,1,112,0h32a24,24,0,0,1,24,24V48h24A16,16,0,0,1,208,64ZM104,48h48V24a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8Zm88,160V64H64V208H192Z', 'suitcase-rolling-fill':'M192,48H168V24A24,24,0,0,0,144,0H112A24,24,0,0,0,88,24V48H64A16,16,0,0,0,48,64V208a16,16,0,0,0,16,16H80v16a8,8,0,0,0,16,0V224h64v16a8,8,0,0,0,16,0V224h16a16,16,0,0,0,16-16V64A16,16,0,0,0,192,48ZM96,192a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Zm40,0a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0ZM152,48H104V24a8,8,0,0,1,8-8h32a8,8,0,0,1,8,8Zm24,144a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Z', 'binoculars':'M237.2,151.87v0a47.1,47.1,0,0,0-2.35-5.45L193.26,51.8a7.82,7.82,0,0,0-1.66-2.44,32,32,0,0,0-45.26,0A8,8,0,0,0,144,55V80H112V55a8,8,0,0,0-2.34-5.66,32,32,0,0,0-45.26,0,7.82,7.82,0,0,0-1.66,2.44L21.15,146.4a47.1,47.1,0,0,0-2.35,5.45v0A48,48,0,1,0,112,168V96h32v72a48,48,0,1,0,93.2-16.13ZM76.71,59.75a16,16,0,0,1,19.29-1v73.51a47.9,47.9,0,0,0-46.79-9.92ZM64,200a32,32,0,1,1,32-32A32,32,0,0,1,64,200ZM160,58.74a16,16,0,0,1,19.29,1l27.5,62.58A47.9,47.9,0,0,0,160,132.25ZM192,200a32,32,0,1,1,32-32A32,32,0,0,1,192,200Z', 'binoculars-fill':'M237.22,151.9l0-.1a1.42,1.42,0,0,0-.07-.22,48.46,48.46,0,0,0-2.31-5.3L193.27,51.8a8,8,0,0,0-1.67-2.44,32,32,0,0,0-45.26,0A8,8,0,0,0,144,55V80H112V55a8,8,0,0,0-2.34-5.66,32,32,0,0,0-45.26,0,8,8,0,0,0-1.67,2.44L21.2,146.28a48.46,48.46,0,0,0-2.31,5.3,1.72,1.72,0,0,0-.07.21s0,.08,0,.11a48,48,0,0,0,90.32,32.51,47.49,47.49,0,0,0,2.9-16.59V96h32v71.83a47.49,47.49,0,0,0,2.9,16.59,48,48,0,0,0,90.32-32.51Zm-143.15,27a32,32,0,0,1-60.2-21.71l1.81-4.13A32,32,0,0,1,96,167.88V168h0A32,32,0,0,1,94.07,178.94ZM203,198.07A32,32,0,0,1,160,168h0v-.11a32,32,0,0,1,60.32-14.78l1.81,4.13A32,32,0,0,1,203,198.07Z', 'bell':'M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z', 'bookmark-simple':'M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z', 'sliders-horizontal':'M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z', 'share-network':'M176,160a39.89,39.89,0,0,0-28.62,12.09l-46.1-29.63a39.8,39.8,0,0,0,0-28.92l46.1-29.63a40,40,0,1,0-8.66-13.45l-46.1,29.63a40,40,0,1,0,0,55.82l46.1,29.63A40,40,0,1,0,176,160Zm0-128a24,24,0,1,1-24,24A24,24,0,0,1,176,32ZM64,152a24,24,0,1,1,24-24A24,24,0,0,1,64,152Zm112,72a24,24,0,1,1,24-24A24,24,0,0,1,176,224Z', 'qr-code':'M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm0,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48ZM200,40H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-64,72V144a8,8,0,0,1,16,0v32a8,8,0,0,1-16,0Zm80-16a8,8,0,0,1-8,8H184v40a8,8,0,0,1-8,8H144a8,8,0,0,1,0-16h24V144a8,8,0,0,1,16,0v8h24A8,8,0,0,1,216,160Zm0,32v16a8,8,0,0,1-16,0V192a8,8,0,0,1,16,0Z', 'check-circle':'M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z', 'compass':'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM172.42,72.84l-64,32a8.05,8.05,0,0,0-3.58,3.58l-32,64A8,8,0,0,0,80,184a8.1,8.1,0,0,0,3.58-.84l64-32a8.05,8.05,0,0,0,3.58-3.58l32-64a8,8,0,0,0-10.74-10.74ZM138,138,97.89,158.11,118,118l40.15-20.07Z', 'compass-fill':'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm51.58,57.79-32,64a4.08,4.08,0,0,1-1.79,1.79l-64,32a4,4,0,0,1-5.37-5.37l32-64a4.08,4.08,0,0,1,1.79-1.79l64-32A4,4,0,0,1,179.58,81.79Z', 'map-trifold':'M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z', 'map-trifold-fill':'M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM96,176a8,8,0,0,0-1.94.24L40,189.75V62.25L95.07,48.48l.93.46Zm120,17.75-55.07,13.77-.93-.46V80a8,8,0,0,0,1.94-.23L216,66.25Z', 'users':'M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z', 'users-fill':'M164.47,195.63a8,8,0,0,1-6.7,12.37H10.23a8,8,0,0,1-6.7-12.37,95.83,95.83,0,0,1,47.22-37.71,60,60,0,1,1,66.5,0A95.83,95.83,0,0,1,164.47,195.63Zm87.91-.15a95.87,95.87,0,0,0-47.13-37.56A60,60,0,0,0,144.7,54.59a4,4,0,0,0-1.33,6A75.83,75.83,0,0,1,147,150.53a4,4,0,0,0,1.07,5.53,112.32,112.32,0,0,1,29.85,30.83,23.92,23.92,0,0,1,3.65,16.47,4,4,0,0,0,3.95,4.64h60.3a8,8,0,0,0,7.73-5.93A8.22,8.22,0,0,0,252.38,195.48Z', 'map-pin':'M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z', 'map-pin-fill':'M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z', 'arrows-left-right':'M213.66,181.66l-32,32a8,8,0,0,1-11.32-11.32L188.69,184H48a8,8,0,0,1,0-16H188.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,213.66,181.66Zm-139.32-64a8,8,0,0,0,11.32-11.32L67.31,88H208a8,8,0,0,0,0-16H67.31L85.66,53.66A8,8,0,0,0,74.34,42.34l-32,32a8,8,0,0,0,0,11.32Z', 'arrows-down-up':'M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z', 'clock':'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z', 'pencil-simple':'M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z', 'trash':'M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z', 'wifi-high':'M140,204a12,12,0,1,1-12-12A12,12,0,0,1,140,204ZM237.08,87A172,172,0,0,0,18.92,87,8,8,0,0,0,29.08,99.37a156,156,0,0,1,197.84,0A8,8,0,0,0,237.08,87ZM205,122.77a124,124,0,0,0-153.94,0A8,8,0,0,0,61,135.31a108,108,0,0,1,134.06,0,8,8,0,0,0,11.24-1.3A8,8,0,0,0,205,122.77Zm-32.26,35.76a76.05,76.05,0,0,0-89.42,0,8,8,0,0,0,9.42,12.94,60,60,0,0,1,70.58,0,8,8,0,1,0,9.42-12.94Z', 'wifi-slash':'M213.92,210.62a8,8,0,1,1-11.84,10.76l-52-57.15a60,60,0,0,0-57.41,7.24,8,8,0,1,1-9.42-12.93A75.43,75.43,0,0,1,128,144c1.28,0,2.55,0,3.82.1L104.9,114.49A108,108,0,0,0,61,135.31,8,8,0,0,1,49.73,134,8,8,0,0,1,51,122.77a124.27,124.27,0,0,1,41.71-21.66L69.37,75.4a155.43,155.43,0,0,0-40.29,24A8,8,0,0,1,18.92,87,171.87,171.87,0,0,1,58,62.86L42.08,45.38A8,8,0,1,1,53.92,34.62ZM128,192a12,12,0,1,0,12,12A12,12,0,0,0,128,192ZM237.08,87A172.3,172.3,0,0,0,106,49.4a8,8,0,1,0,2,15.87A158.33,158.33,0,0,1,128,64a156.25,156.25,0,0,1,98.92,35.37A8,8,0,0,0,237.08,87ZM195,135.31a8,8,0,0,0,11.24-1.3,8,8,0,0,0-1.3-11.24,124.25,124.25,0,0,0-51.73-24.2A8,8,0,1,0,150,114.24,108.12,108.12,0,0,1,195,135.31Z', 'taxi':'M240,104H228.64L201.25,56.06A16,16,0,0,0,187.36,48H165.42l-12-29.94A15.93,15.93,0,0,0,138.58,8H117.42a15.93,15.93,0,0,0-14.86,10.06L90.58,48H68.64a16,16,0,0,0-13.89,8.06L27.36,104H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V184h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V120h8a8,8,0,0,0,0-16ZM117.42,24h21.16l9.6,24H107.82ZM68.64,64H187.36l22.85,40H45.79ZM64,200H40V184H64Zm128,0V184h24v16Zm24-32H40V120H216ZM56,144a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H64A8,8,0,0,1,56,144Zm112,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H176A8,8,0,0,1,168,144Z', 'person-simple-walk':'M152,80a32,32,0,1,0-32-32A32,32,0,0,0,152,80Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,152,32Zm64,112a8,8,0,0,1-8,8c-35.31,0-52.95-17.81-67.12-32.12-2.74-2.77-5.36-5.4-8-7.84l-13.43,30.88,37.2,26.57A8,8,0,0,1,160,176v56a8,8,0,0,1-16,0V180.12l-31.07-22.2L79.34,235.19A8,8,0,0,1,72,240a7.84,7.84,0,0,1-3.19-.67,8,8,0,0,1-4.15-10.52l54.08-124.37c-9.31-1.65-20.92,1.2-34.7,8.58a163.88,163.88,0,0,0-30.57,21.77,8,8,0,0,1-10.95-11.66c2.5-2.35,61.69-57.23,98.72-25.08,3.83,3.32,7.48,7,11,10.57C166.19,122.7,179.36,136,208,136A8,8,0,0,1,216,144Z', 'film-strip':'M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,88h80v80H40Zm96-16V56h32V72Zm-16,0H88V56h32Zm0,112v16H88V184Zm16,0h32v16H136Zm0-16V88h80v80Zm80-96H184V56h32ZM72,56V72H40V56ZM40,184H72v16H40Zm176,16H184V184h32v16Z', 'link':'M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z', 'camera':'M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z',
  'arrow-left':'M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z',
  'arrow-right':'M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z',
  'caret-left':'M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z',
  'caret-right':'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z',
  'x':'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
  'check':'M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z',
  'star':'M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z',
  'star-fill':'M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z',
  'warning-circle':'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z',
  'sparkle':'M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z',
  'lock':'M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-68-56a12,12,0,1,1-12-12A12,12,0,0,1,140,152Z',
  'circle':'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z',
  'circle-fill':'M232,128A104,104,0,1,1,128,24,104.13,104.13,0,0,1,232,128Z',
  'dots-three-vertical':'M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM128,72a12,12,0,1,0-12-12A12,12,0,0,0,128,72Zm0,112a12,12,0,1,0,12,12A12,12,0,0,0,128,184Z'
 };
function reachIcon(reach){ return /walk|foot|on the ridge|on mall road|pedestrian/i.test(reach||'') ? ICONS['person-simple-walk'] : ICONS['taxi']; }
function titleCase(s){ return String(s||'').trim().replace(/\s+/g,' ').split(' ').map(function(w){ return w?w[0].toUpperCase()+w.slice(1):w; }).join(' ') || 'Trip'; }

// ---------- destination accessor ----------
function getDestination(input){
  const key = String(input||'').trim().toLowerCase();
  const real = DATASET.destinations[key];
  if (real) return real;
  const name = titleCase(input);
  const g = DATASET.generic;
  const R = function(s){ return String(s).replace(/\{CITY\}/g, name); };
  return {
    key: key || 'generic', name: name, region:'', emoji:'🧭',
    tagline: R(g.tagline), bestMonths: g.bestMonths, photo: R(g.photo),
    travelTags: ['CHILL','CULTURE'],
    flexRules: g.flexRules.map(R),
    places: g.places.map(function(p){ return Object.assign({}, p, { name:R(p.name), photo:R(p.photo), why:R(p.why), tip:R(p.tip) }); }),
    food: g.food.map(function(f){ return Object.assign({}, f, { name:R(f.name) }); }),
    alert: Object.assign({}, g.alert, { title:R(g.alert.title), why:R(g.alert.why), impact:R(g.alert.impact), swapOut:R(g.alert.swapOut), swapIn:R(g.alert.swapIn) }),
    inspiration: [],
    drafts: [ {id:'classic',rating:4.4,feedbackCount:6}, {id:'chill',rating:4.3,feedbackCount:5}, {id:'adventure',rating:4.2,feedbackCount:4} ],
    meta: { name: name, emoji:'🧭' }
  };
}
function alertSwapStop(dest, mult){
  mult = mult || 1;
  const a = dest.alert;
  const m = dest.places.find(function(p){ return p.name===a.swapIn; });
  if (m) return { id:m.id, name:m.name, cat:m.cat, photo:m.photo, why:m.why, hours:m.hours, cost: m.fixedCost ? m.cost : Math.round(m.cost*mult), fixedCost:m.fixedCost||false, closedMonths:m.closedMonths||null, seasonNote:m.seasonNote||'', reach:m.howToReach };
  return { id:'swapin', name:a.swapIn, cat:'sights', photo:dest.name+' '+a.swapIn, why:'Indoor-friendly alternative for the alert window.', hours:'10am–5pm', cost:Math.round(250*mult), fixedCost:false, closedMonths:null, seasonNote:'', reach:'Cab, ~20 min' };
}

// ---------- derivations (draft generation etc.) ----------
var SLOT_TIME = { morning:'9:30 AM', fullday:'9:30 AM', afternoon:'12:30 PM', evening:'7:30 PM' };
function draftGen(dest, prefs, themeId, days, seedPids){
  seedPids = seedPids || [];
  days = days || 2;
  const cfg = DATASET.config;
  const theme = cfg.themes.find(function(t){ return t.id===themeId; }) || cfg.themes[0];
  const mult = (cfg.budget[prefs.budget] || cfg.budget.comfort).mult;
  const spd = (cfg.pace[prefs.pace] || cfg.pace.balanced).stopsPerDay;
  const slotOrder = { morning:0, fullday:1, afternoon:2, evening:3 };
  const ranked = dest.places
    .map(function(p){ return Object.assign({}, p, { score: p.suitability + (theme.prefer.includes(p.cat)?20:0) + styleBias(prefs.styleTags, p.cat) + (seedPids.includes(p.id)?25:0) }); })
    .sort(function(a,b){ return b.score-a.score || String(a.id).localeCompare(String(b.id)); });
  const picked = ranked.slice(0, spd*days);
  const out = [];
  for (let d=0; d<days; d++){
    let stops = picked.slice(d*spd,(d+1)*spd).sort(function(a,b){ return slotOrder[a.slot]-slotOrder[b.slot]; });
    stops = stops.map(function(p,i){
      return {
        uid:p.id+'-d'+d, pid:p.id, name:p.name, cat:p.cat, photo:p.photo, why:p.why,
        hours:p.hours, cost:(p.fixedCost ? p.cost : Math.round(p.cost*mult)), tip:p.tip, reach:p.howToReach,
        time: SLOT_TIME[p.slot] || cfg.draftTimes[i] || cfg.draftTimes[cfg.draftTimes.length-1], notes:'', fixedCost:p.fixedCost||false,
        closedMonths:p.closedMonths||null, seasonNote:p.seasonNote||''
      };
    });
    let lastT = -1;
    stops = stops.map(function(st0){ let t = st0.time; if (parseTimeStr(t) <= lastT){ const later = cfg.draftTimes.find(function(x){ return parseTimeStr(x)>lastT; }) || cfg.draftTimes[cfg.draftTimes.length-1]; t = later; } lastT = parseTimeStr(t); return Object.assign({}, st0, { time:t }); });
    out.push({ label:'Day 0'+(d+1), code:'DAY 0'+(d+1), stops:stops, dayCost: stops.reduce(function(x,s){ return x+s.cost; },0) });
  }
  return out;
}
function buildPlan(dest, prefs){ return draftGen(dest, prefs, 'classic', 2); }
function optionsFor(dest, prefs, memberCount){
  return DATASET.config.themes.map(function(th){
    const themePrefs = Object.assign({}, prefs, { pace: th.pace || prefs.pace });
    const days = draftGen(dest, themePrefs, th.id, 2);
    const meta = (dest.drafts||[]).find(function(d){ return d.id===th.id; }) || { rating:4.3, feedbackCount:6 };
    const stops = days.reduce(function(x,d){ return x+d.stops.length; },0);
    const perPerson = days.reduce(function(x,d){ return x+d.dayCost; },0);
    const allStops = days.reduce(function(x,d){ return x.concat(d.stops); },[]);
    const paceNote = (DATASET.config.pace[th.pace]||{}).note || '';
    return { id:th.id, label:th.label, blurb:th.blurb, paceNote:paceNote, themePace:th.pace, stops:stops, perPerson:perPerson, group:perPerson*memberCount, rating:meta.rating, feedbackCount:meta.feedbackCount, allStops:allStops };
  });
}
function bestFit(dest){
  const drafts = dest.drafts || [];
  let best = drafts.find(function(d){ return d.id==='classic'; }) || drafts[0] || { id:'classic', rating:0 };
  drafts.forEach(function(d){ if (d.rating>best.rating) best=d; });
  return best.id;
}
function alertFor(dest){ return dest.alert; }
function pollFor(dest){
  const evening = dest.places.filter(function(p){ return p.slot==='evening'; });
  const base = (evening.length>=2 ? evening.slice(0,2) : dest.places.slice(0,2));
  const options = base.map(function(p,i){ return { id:p.id, label:(p.cat==='food'?'🍽️ ':(p.cat==='sights'?'🏰 ':'🌄 '))+shortName(p.name), base: i===0?1:0 }; });
  const neutralP = dest.places.find(function(p){ return p.cat==='food' && !base.includes(p); }) || dest.places.find(function(p){ return !base.includes(p); }) || dest.places[0];
  return { question:'Evening plan - where to?', deadline:'6:00 PM', options:options, seedVotes:{ m2: options[0] ? options[0].id : '' }, neutral:'🌆 '+(neutralP?shortName(neutralP.name):'Neutral pick')+' (neutral)' };
}
function liveStopsFromDay(day){ return ((day&&day.stops)||[]).map(function(s,i){ return { id:s.pid, pin:i+1, time:s.time, name:s.name, cat:s.cat, photo:s.photo, why:s.why, hours:s.hours, cost:s.cost, reach:s.reach }; }); }

// ---------- trip model ----------
function genCode(){ return 'TRP-'+Math.floor(100+Math.random()*899); }
function makeTrip(destKey, status, prefs, name, code, dates, groupName){
  const dest = getDestination(destKey);
  const p = prefs || { pace:'balanced', budget:'comfort', styleTags:['CHILL','FOODIE'] };
  const defDates = status==='active' ? { start:'2026-07-11', end:'2026-07-13' }
                 : status==='past'   ? { start:'2026-06-02', end:'2026-06-04' }
                 :                     { start:'2026-07-18', end:'2026-07-21' };
  return {
    id: 't_'+slugify(destKey)+'_'+Math.random().toString(36).slice(2,7),
    destKey:destKey, name: name || dest.name, code: code || genCode(), emoji: dest.emoji, status:status,
    dates: dates || defDates,
    prefs: p, days: buildPlan(dest, p), groupName: groupName || null,
    live: { checkins:{}, stops:null, swapped:false, dismissed:false, feedback:0, archived:false },
    group: { myVote:null, vetoes:{}, resolved:null, proceeded:false },
    events: seedEvents(dest, name || dest.name)
  };
}
function seedTrips(){
  return [
    makeTrip('shimla','active',  { pace:'balanced', budget:'comfort', styleTags:['CHILL','FOODIE'] },      'Shimla', 'TRP-902', { start:'2026-07-11', end:'2026-07-13' }),
    makeTrip('goa','upcoming',   { pace:'balanced', budget:'comfort', styleTags:['CHILL','FOODIE'] },       'Goa',    'TRP-914', { start:'2026-07-18', end:'2026-07-21' }),
    makeTrip('manali','past',    { pace:'balanced',   budget:'comfort', styleTags:['ADVENTURE','ACTIVE'] },   'Manali', 'TRP-880', { start:'2026-06-02', end:'2026-06-04' }),
    makeTrip('jaipur','past',    { pace:'balanced', budget:'comfort', styleTags:['CULTURE','FOODIE'] },      'Jaipur', 'TRP-861', { start:'2026-03-14', end:'2026-03-16' }),
    makeTrip('udaipur','past',   { pace:'slow',     budget:'comfort', styleTags:['CHILL','LUXURY'] },        'Udaipur','TRP-822', { start:'2025-12-20', end:'2025-12-22' }),
    makeTrip('rishikesh','past', { pace:'balanced', budget:'shoestring', styleTags:['ADVENTURE','ACTIVE'] }, 'Rishikesh','TRP-791', { start:'2025-09-05', end:'2025-09-07' }),
  ];
}

// ---------- persisted-trip validation (self-healing storage) ----------
// Validates a single trip object loaded from localStorage. Returns a
// repaired trip (via makeTrip + Object.assign, same pattern the old inline
// rehydration used) or null if the entry is unsalvageable and should be dropped.
function reviveTrip(st){
  if (!st || typeof st!=='object') return null;
  if (typeof st.id!=='string' || !st.id) return null;
  const destKey = (typeof st.destKey==='string' && st.destKey) ? st.destKey : 'shimla';
  let base;
  try { base = makeTrip(destKey, st.status||'active', st.prefs||{ pace:'balanced', budget:'comfort', styleTags:[] }, st.name, st.code); }
  catch(e){ return null; }
  return Object.assign({}, base, st, {
    destKey,
    prefs: Object.assign({}, base.prefs, st.prefs||{}),
    group: Object.assign({}, base.group, st.group||{}),
    live:  Object.assign({}, base.live,  st.live||{}),
    days:  Array.isArray(st.days) && st.days.length ? st.days : base.days
  });
}
