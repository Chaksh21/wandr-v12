// wandr-features.js - per-view renderVals presenters. One method per surface
// (rvHome, rvExplore, rvPlan …). Each returns a slice of the vals bag that the
// template holes bind to. Composed by renderVals().
//
// Depends on wandr-data.js, wandr-logic.js, wandr-flow.js being loaded first.
// Installed onto the DCLogic component instance as regular methods so `this`
// resolves to the instance when DCLogic invokes `this.logic.renderVals()`.

window.WandrFeatures = {
  install: function(inst){

    // ---------- shared context ----------
    inst.rvCtx = function(){
      const st = this.state;
      const V = st.view;
      const t = this.currentTrip();
      const dest = this.currentDest();
      const cfg = DATASET.config;
      const initialOf = m => (m.name==='You' ? 'Y' : m.name[0]);

      const viewsMeta = [['home','Home','house'],['explore','Explore','binoculars'],['trips','Trips','suitcase-rolling'],['profile','Profile','user']];
      const navTabs = viewsMeta.map(([v,label,icon]) => ({
        label, iconPath: V===v ? ICONS[icon+'-fill'] : ICONS[icon], op: V===v ? '1' : '.6', color: V===v ? 'var(--ink)' : 'var(--sec)',
        onClick: () => this.setState({ view:v }),
        ariaCurrent: V===v ? 'page' : 'false'
      }));
      const anySheet = (V==='plan' && (st.plSheetOpen || st.plRulesOpen)) || (V==='group' && (st.grSheetOpen || st.grInviteOpen)) || (V==='live' && st.lvFoodOpen);
      const appScroll = anySheet ? 'hidden' : 'auto';
      const openTripOverview = (id) => { if (!id) { this.toast('No trip yet'); return; } if (this._t) clearTimeout(this._t); const tr = st.trips.find(x=>x.id===id); const isPast = tr && tr.status==='past'; this.setState({ toast:null, toastAction:null, activeTripId:id, view:'overview', ovFrom:V==='trips'?'trips':'home', plScreen:'S13', lvScreen: isPast?'recap':'today', plActiveDay:0, plEditUid:null, plPending:null, plReorderDraft:null, plSheetOpen:false, plDetailUid:null, plRulesOpen:false, plRouteOpen:false, lvOffline:false, lvFoodOpen:false, grTab:'decisions', grSheetOpen:false, grVetoConfirm:null, grResolveMode:null, grInviteOpen:false, wrapOpen:false, wrapIdx:0 }); };
      const openTripId = openTripOverview;
      return { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId };
    };

    inst.rvShared = function(c){
      const { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId } = c;
      return {
        viewSplash: V==='splash',
        splashSkip:()=>{ if (this._splashT){ clearTimeout(this._splashT); this._splashT=null; } this.splashAdvance(); },
        viewHome:  V==='home',
        viewSetup: V==='setup',
        viewPlan:  V==='plan',
        viewGroup: V==='group',
        viewLive:  V==='live',
        viewExplore: V==='explore',
        viewTrips:   V==='trips',
        viewProfile: V==='profile',
        viewPlaceSearch: V==='placeSearch',
        viewCuratedPreview: V==='curatedPreview',
        showNav: V!=='setup' && V!=='auth' && V!=='splash' && V!=='placeSearch' && V!=='curatedPreview' && !anySheet,
        navTabs,
        toast: st.toast,
        appScroll,
        toastMsg: st.toast || '', toastAction: !!st.toastAction, onToastAction:()=>{ const a=st.toastAction; this.setState({ toast:null, toastAction:null }); if(a) a(); },
        destEmoji: t.emoji,
        // shared functional icon paths - swapped in for literal emoji/unicode glyphs
        // app-wide (nav arrows, chevrons, checks, stars, warning, sparkle, lock).
        // Decorative/content emoji (city, persona, pace/style/budget, RSVP, reactions,
        // dataset weather-alert icons) are left untouched by design.
        icArrowLeft: ICONS['arrow-left'], icArrowRight: ICONS['arrow-right'],
        icCaretLeft: ICONS['caret-left'], icCaretRight: ICONS['caret-right'],
        icX: ICONS['x'], icCheck: ICONS['check'],
        icStar: ICONS['star'], icStarFill: ICONS['star-fill'], icBookmark: ICONS['bookmark-simple'], icPlus: ICONS['plus'],
        icWarning: ICONS['warning-circle'], icSparkle: ICONS['sparkle'], icLock: ICONS['lock'],
        icClock: ICONS['clock'], icArrowsDownUp: ICONS['arrows-down-up'], icCircle: ICONS['circle'], icCircleFill: ICONS['circle-fill'], icDotsVertical: ICONS['dots-three-vertical'],
        icUsers: ICONS['users'],
      };
    };

    inst.rvHome = function(c){
      const { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId } = c;
      const liveTrip = st.trips.find(x=>x.status==='active' && tripIsLive(x)) || st.trips.find(x=>tripIsLive(x)) || null;
      const upcomingList = st.trips.filter(x=>x.status==='upcoming').sort((a,b)=>(tripDaysUntil(a)||99)-(tripDaysUntil(b)||99));
      const heroT = liveTrip;
      const heroDest = heroT ? getDestination(heroT.destKey) : null;
      const heroDay0 = heroT ? (heroT.days[0]||{stops:[]}) : {stops:[]};
      const heroNext = (()=>{ if(!heroT) return null; const stops=(heroT.live.stops||heroDay0.stops); const ci=heroT.live.checkins||{}; return stops.find(x=>!ci[x.uid||x.id]) || stops[0]; })();
      const heroKicker = heroT ? (heroT.status==='active' ? ('DAY '+String(tripDayOf(heroT)).padStart(2,'0')+' OF '+String(tripLen(heroT)).padStart(2,'0')) : ('STARTS IN '+tripDaysUntil(heroT)+' DAY'+(tripDaysUntil(heroT)===1?'':'S'))) : '';
      const heroCtaLabel = heroT ? (heroT.status==='active' ? 'Continue today' : 'Continue planning') : '';
      const heroTravelHint = heroT ? '~15 min from your last stop' : '';
      const heroCta = heroT ? ()=>{ openTripId(heroT.id); if (heroT.status==='active') this.setState({ view:'live', lvScreen:'today' }); } : ()=>{};
      const upcomingCard = (!liveTrip && upcomingList[0]) ? (u=>{ const d=getDestination(u.destKey); return { name:u.name, emoji:u.emoji, code:u.code, photoQ:d.photo, photoUrl:photoUrl(d.photo), range:fmtRange(u), countdown:'IN '+tripDaysUntil(u)+' DAYS', onOpen:()=>openTripId(u.id) }; })(upcomingList[0]) : null;
      const cityKeys0 = ['shimla','goa','manali','jaipur','rishikesh','udaipur'];
      const enterSetupWith = (k)=>{ if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', grSheetOpen:false, grInviteOpen:false, lvFoodOpen:false, plSheetOpen:false, exFilterOpen:false }); this.toast('Quick sign-in - then straight to your trip'); return; } this.setState({ view:'setup', suScreen:'s2', newDestKey:k, suDestConfirmed:true, suDestText:'', suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids:[] }); };
      const openPsDetail = (destKey, placeId)=>this.setState({ view:'placeSearch', psScreen:'detail', psDestKey:destKey, psPlaceId:placeId||null, psFrom:'home', psViaSearch:false });
      const placesRail = cityKeys0.map(k=>{ const d=DATASET.destinations[k]; return { name:d.name, emoji:"", tagline:d.tagline, photoUrl:photoUrl(d.photo), photoQ:d.photo, onPick:()=>openPsDetail(k, null) }; });
      const groupsRail = [ ['shimla','s1'], ['goa','g2'], ['jaipur','j1'], ['rishikesh','r3'] ].map(([ck,pid])=>{ const d=DATASET.destinations[ck]; const p=d.places.find(x=>x.id===pid)||d.places[0]; return { name:p.name, city:d.name, photoUrl:photoUrl(p.photo), photoQ:p.photo, onPick:()=>openPsDetail(ck, p.id) }; });
      const hmMembers = MEMBERS.map((m,i)=>({ initial:initialOf(m), bg:m.bg, gap:i===0?'0':'-9px', ring: m.status==='pending' ? '2px dashed #B0451A' : '2px solid #fff' }));
      const openSearch = ()=>this.setState({ view:'placeSearch', psScreen:'search', psQuery:'', psDestKey:null, psPlaceId:null, psFrom:'home', psViaSearch:false });
      return {
        hmLiveMode: !!heroT, hmDiscovery: !heroT, hmEmpty: !heroT && st.trips.length===0,
        hmGreeting: (()=>{ const h=new Date().getHours(); const t = h<12?'Good morning':(h<17?'Good afternoon':'Good evening'); const n=(st.user.name||'').trim().split(/\s+/)[0]; return n ? (t+', '+n) : t; })(),
        heroName: heroT?heroT.name:'', heroEmoji: heroT?heroT.emoji:'', heroCode: heroT?heroT.code:'', heroKicker,
        heroPhotoQ: heroDest?heroDest.photo:'', heroPhotoUrl2: heroDest?photoUrl(heroDest.photo):'',
        heroNextLine: heroNext ? (heroNext.time+' · '+heroNext.name) : 'Plan your first stop',
        heroCtaLabel, heroCta, heroRange: heroT?fmtRange(heroT):'', heroTravelHint,
        hasUpcomingCard: !!upcomingCard,
        ucName: upcomingCard?upcomingCard.name:'', ucEmoji: upcomingCard? (upcomingList[0]||{}).emoji||'':'', ucRange: upcomingCard?upcomingCard.range:'', ucCountdown: upcomingCard?upcomingCard.countdown:'', ucPhotoUrl: upcomingCard?upcomingCard.photoUrl:'', ucPhotoQ: upcomingCard?upcomingCard.photoQ:'', ucOpen: upcomingCard?upcomingCard.onOpen:()=>{},
        placesRail, groupsRail, hmMembers,
        openSearch,
        addTrip:()=>{ if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', grSheetOpen:false, grInviteOpen:false, lvFoodOpen:false, plSheetOpen:false, exFilterOpen:false }); this.toast('Quick sign-in - then straight to your trip'); return; } this.setState({ view:'setup', suScreen:'s2', suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, newDestKey:'shimla', suDestConfirmed:false, suDestText:'', qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids:[] }); },
        goTripsTab:()=>this.setState({ view:'trips' }),
        seeSample:()=>{ const tt=st.trips.find(x=>x.status==='active')||st.trips[0]; if (tt) openTripId(tt.id); },
        travellerCount:ALL_COUNT, hasPending:MEMBERS.some(m=>m.status==='pending'), pendingLabel:'1 PENDING · ROHIT',
        hmOpenInbox:()=>{ this.setState(x=>({ view:'inbox', user:Object.assign({},x.user,{ inboxSeen:true }) })); }, hmBellIcon:ICONS['bell'],
        hmInboxDotDisplay: (!st.user.inboxSeen && st.trips.some(tr=>(tr.events||[]).length>0)) ? 'block' : 'none',
      };
    };

    inst.rvSetup = function(c){
      const { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId } = c;
      const funnelDest = getDestination(st.newDestKey);
      const suPrefs = { pace:st.suPace, budget:st.suBudget||'comfort', styleTags:st.suStyleTags };
      const suNameOr = st.suName.trim() || 'traveller';
      const suInitial = (st.suName.trim() ? st.suName.trim()[0] : 'Y').toUpperCase();
      const paceCfg = { slow:{label:'Slow',note:'breathe'}, balanced:{label:'Balanced',note:'full but easy'}, packed:{label:'Packed',note:'see it all'} };
      const suPaceLabel = (paceCfg[st.suPace]||{label:''}).label;
      const paceChips = Object.keys(paceCfg).map(k=>{ const c=paceCfg[k]; const on=st.suPace===k; return { label:c.label, note:c.note, bg:on?'var(--accent)':'#fff', fg:on?'#fff':'var(--ink)', sub:on?'rgba(255,255,255,.8)':'var(--sec)', bord:on?'var(--accent)':'var(--border)', onPick:()=>this.setState({ suPace:k }) }; });
      const travelTags = ['CHILL','ACTIVE','FOODIE','CULTURE','ADVENTURE','LUXURY','BUDGET'];
      const styleTags = travelTags.map(t2=>{ const on=st.suStyleTags.includes(t2); return { label:t2, bg:on?'var(--ink)':'#fff', fg:on?'#fff':'var(--sec)', bord:on?'var(--ink)':'var(--border)', onToggle:()=>this.setState(s=>({ suStyleTags: s.suStyleTags.includes(t2) ? s.suStyleTags.filter(x=>x!==t2) : [...s.suStyleTags, t2] })) }; });
      const previewLine = suPaceLabel+' pace · '+(st.suStyleTags.length ? st.suStyleTags.slice(0,3).join(' · ') : 'no styles yet');
      const social = MEMBERS.map((m,i)=>({ initial:initialOf(m), bg:m.bg, gap:i===0?'0':'-9px' }));
      const cityKeys = ['shimla','goa','manali','jaipur','rishikesh','udaipur'];
      const pickDest = (k)=>{ this.setState({ newDestKey:k, suDestConfirmed:true, suDestText:'' }); const ret=st.suEditReturn; setTimeout(()=>{ if (ret){ this.setState({ suEditReturn:null }); this.suNav(ret); } else { this.suNav('s4b'); } }, 220); };
      const q = (st.suDestText||'').trim().toLowerCase();
      let destResults = [], destNotice = null;
      if (st.suDestConfirmed){
        destResults = [];
      } else if (!q){
        destResults = ['shimla','goa','jaipur'].map(k=>{ const d=DATASET.destinations[k]; return { emoji:"", name:d.name, sub:d.tagline, kind:'POPULAR', photoUrl:photoUrl(d.photo), photoQ:d.photo, onPick:()=>pickDest(k) }; });
      } else {
        const covered = cityKeys.filter(k=>{ const d=DATASET.destinations[k]; return k.indexOf(q)===0 || d.name.toLowerCase().indexOf(q)===0; });
        if (covered.length){
          destResults = covered.map(k=>{ const d=DATASET.destinations[k]; return { emoji:"", name:d.name, sub:d.tagline, kind:'AVAILABLE', photoUrl:photoUrl(d.photo), photoQ:d.photo, onPick:()=>pickDest(k) }; });
        } else {
          const near = cityKeys.map(k=>({ k, d:editDist(q, k) })).filter(x=>x.d<=2).sort((a,b)=>a.d-b.d)[0];
          if (near){
            const d=DATASET.destinations[near.k];
            destResults = [{ emoji:"", name:d.name, sub:'Did you mean '+d.name+'?', kind:'AVAILABLE', photoUrl:photoUrl(d.photo), photoQ:d.photo, onPick:()=>pickDest(near.k) }];
          } else if (FAMOUS_INTL.some(x=>x.indexOf(q)===0 || q.indexOf(x)===0)){
            destNotice = { icon:'🌍', title:'International is on the way', body:"We'll be adding international destinations soon. For now, Wandr covers Indian getaways." };
          } else {
            const famous = FAMOUS_IN.find(x=>x.indexOf(q)===0 || q.indexOf(x)===0);
            const label = famous ? (famous.charAt(0).toUpperCase()+famous.slice(1)) : (st.suDestText.trim().charAt(0).toUpperCase()+st.suDestText.trim().slice(1));
            destNotice = { icon:'🚧', title:label+' is coming soon', body:"We don't cover "+label+" deeply yet - we only ship places we can plan well. Try one of the covered cities." };
          }
        }
      }
      const confirmedDest = DATASET.destinations[st.newDestKey] || null;
      const showDestResults = !st.suDestConfirmed && destResults.length>0;
      const showDestNotice = !st.suDestConfirmed && !!destNotice;
      const destSelectedLabel = funnelDest.name;
      const firstDow=3, daysInMonth=31;
      const inRange = d => st.suDateStart && st.suDateEnd && d>=st.suDateStart && d<=st.suDateEnd;
      const calCells=[];
      for (let i=0;i<firstDow;i++) calCells.push({ n:'', vis:'hidden', bg:'transparent', fg:'var(--ink)', wt:'500', radius:'10px', delay:'0ms', onPick:()=>{} });
      for (let d=1; d<=daysInMonth; d++){ const isStart=st.suDateStart===d, isEnd=st.suDateEnd===d, mid=inRange(d)&&!isStart&&!isEnd, sel=isStart||isEnd; calCells.push({ n:String(d), vis:'visible', bg: sel?'var(--accent)':(mid?'var(--accent-weak)':'transparent'), fg: sel?'#fff':(mid?'var(--tip-ink)':'var(--ink)'), wt: sel?'600':'500', radius:'10px', delay: (mid||isEnd)&&st.suDateStart?(Math.max(0,d-st.suDateStart)*14)+'ms':'0ms', onPick:()=>this.suPickDate(d) }); }
      const rangeLabel = st.suDateStart ? (st.suDateEnd ? ('JUL '+st.suDateStart+' – '+st.suDateEnd) : ('JUL '+st.suDateStart+' – …')) : 'SELECT A RANGE';
      const suDates = st.suDateStart ? ('Jul '+st.suDateStart+(st.suDateEnd?(' – '+st.suDateEnd):'')+', 2026') : 'Not detected - add dates';
      const dayCount = (st.suDateStart && st.suDateEnd) ? (st.suDateEnd - st.suDateStart + 1) : null;
      const dayCountLabel = dayCount ? (dayCount + (dayCount===1 ? ' day' : ' days')) : '';
      const dayCountDisplay = dayCount ? 'inline-block' : 'none';
      const parsedFields = [
        { label:'DESTINATION', value:funnelDest.name,           lowConfidence:false, onEdit:()=>this.setState({ suScreen:'s4', suDestConfirmed:false, suDestText:'', suConfirmed:false, suEditReturn:'s5a' }) },
        { label:'DATES',       value:suDates,                   lowConfidence:false, onEdit:()=>this.setState({ suScreen:'s4b', suEditReturn:'s5a' }) },
        { label:'HOTEL',       value:'A central stay in '+funnelDest.name, lowConfidence:true, onEdit:()=>this.toast('Search for your actual hotel - coming soon') },
      ].map(f=>Object.assign(f, { confDisplay: f.lowConfidence?'inline-flex':'none', rowBg: f.lowConfidence?'var(--accent-weak)':'transparent' }));
      const tasks = [
        { label:'Read your booking', tag:'COMPLETE', s:'done' },
        { label:'Sort inspiration into places', tag:'COMPLETE', s:'done' },
        { label:'Draft day-by-day itinerary', tag:'IN PROGRESS', s:'now' },
        { label:'Match group pace & budget', tag:'QUEUED', s:'wait' },
      ].map(t2=>({ label:t2.label, tag:t2.tag, dotIcon: t2.s==='done'?ICONS['check']:(t2.s==='now'?ICONS['circle-fill']:ICONS['circle']), dotBg: t2.s==='done'?'#1F8A5F':(t2.s==='now'?'var(--accent)':'#C7C1B8'), tagFg: t2.s==='done'?'#1F8A5F':(t2.s==='now'?'var(--accent)':'var(--sec)'), bg: t2.s==='now'?'var(--accent-weak)':'#fff' }));
      const lockId = st.suLockedTheme || 'classic';
      const lockedLabel = (cfg.themes.find(t2=>t2.id===lockId)||{}).label || 'Classic Highlights';
      const lockedDraft = draftGen(funnelDest, suPrefs, lockId, 2);
      const pinPos = [ {x:'60px',y:'40px'}, {x:'200px',y:'80px'}, {x:'120px',y:'150px'}, {x:'250px',y:'150px'} ];
      const suMapPins = lockedDraft[0].stops.map((s,i)=>({ n:String(i+1), x:(pinPos[i]||pinPos[0]).x, y:(pinPos[i]||pinPos[0]).y }));
      const contributors = MEMBERS.map((m,i)=>({ initial:initialOf(m), bg:m.bg, gap:i===0?'0':'-9px', ring: m.status==='pending' ? '2px dashed var(--tip-ink)' : '2px solid #fff' }));
      const contributorsSummary = ALL_COUNT+' travellers · '+APP_MEMBERS.length+' on the app · '+MEMBERS.filter(m=>m.status==='pending').length+' pending';
      const suBest = bestFit(funnelDest);
      const seasonalConflicts = funnelDest.places.filter(p=>p.closedMonths && p.closedMonths.includes(TRIP_MONTH));
      const showSeasonBanner = seasonalConflicts.length>0;
      const seasonBannerText = seasonalConflicts.length ? ('Heads-up · '+seasonalConflicts[0].name+' is closed in July - we\'ll plan around it') : '';
      const suOptions = optionsFor(funnelDest, suPrefs, ALL_COUNT).map(o=>{ const sel=st.suLockedTheme===o.id; const previewStops=o.allStops.slice(0,4); const matchesYourPace = o.themePace===suPrefs.pace; return { label:o.label, blurb:o.blurb, paceNote:o.paceNote, matchesYourPaceDisplay: matchesYourPace?'inline-flex':'none', stops:String(o.stops), perPerson:moneyRs(o.perPerson), group:moneyRs(o.group), rating:o.rating.toFixed(1), best:o.id===suBest, ring: sel?'2px solid var(--accent)':'1px solid var(--border)', cardBg: sel?'var(--accent-weak)':'#fff', checkDisplay: sel?'inline-block':'none', checkBg: sel?'var(--accent)':'transparent', checkBord: sel?'none':'2px solid var(--border)', preview:previewStops.map(s=>({ name:s.name, photo:photoUrl(s.photo), q:s.photo })), previewTileWidth: (Math.floor(100/previewStops.length)-2)+'%', onPick:()=>this.setState({ suLockedTheme:o.id }) }; });
      const suPicked = !!st.suLockedTheme;
      const prog = this.suProgFor(st.suScreen);
      return {
        dkCards: funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6),
        qzPct: Math.round((st.qzStep+1)/4*100)+'%',
        qzKicker: ['01 · YOU','02 · PACE','03 · STYLE','04 · SPEND'][st.qzStep]||'',
        qzQuestion: ['What do we call you?','How do you like your days?','What are you into?','How does the group spend?'][st.qzStep]||'',
        qzIsName: st.qzStep===0, qzIsChoice: st.qzStep===1||st.qzStep===3, qzIsMulti: st.qzStep===2,
        qzAck: st.qzStep===1 && st.suPace ? ('Got it - '+st.suPace+' it is.') : (st.qzStep===3 ? '' : ''),
        qzBack: ()=>{ if (this._qzT){ clearTimeout(this._qzT); this._qzT=null; } if (st.qzStep>0) this.setState({ qzStep:st.qzStep-1 }); else this.setState({ view:'home', suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, suDestConfirmed:false, suDestText:'' }); },
        qzSkip: ()=>{ if (this._qzT){ clearTimeout(this._qzT); this._qzT=null; } this.setState(x=>({ user:Object.assign({},x.user,{ prefs:{ pace:x.suPace, styleTags:x.suStyleTags } }) })); this.suNav('s3'); },
        qzNext: ()=>{ if (this._qzT){ clearTimeout(this._qzT); this._qzT=null; } if (st.qzStep<3) this.setState({ qzStep:st.qzStep+1 }); else { this.setState(x=>({ user:Object.assign({},x.user,{ prefs:{ pace:x.suPace, styleTags:x.suStyleTags } }) })); this.suNav('s3'); } },
        qzOptions: (st.qzStep===1
          ? [ ['slow','🐌','Slow & soft','long breakfasts, no rush'], ['balanced','🚶','Balanced','full but easy'], ['packed','⚡','Packed','see absolutely everything'] ].map(([k,emo,label,sub])=>({ emo, label, sub, ring: st.suPace===k?'2px solid var(--accent)':'1px solid var(--border)', bg: st.suPace===k?'var(--accent-weak)':'#fff', onPick:()=>{ this.setState({ suPace:k }); if (this._qzT) clearTimeout(this._qzT); this._qzT=setTimeout(()=>{ this._qzT=null; this.setState(x=>({ qzStep:Math.min(3,x.qzStep+1) })); }, 260); } }))
          : [ ['shoestring','','Save where I can','watch every rupee'], ['comfort','','Balanced','sensible with treats'], ['splurge','','Treat me','the trip IS the treat'] ].map(([k,emo,label,sub])=>({ emo, label, sub, ring: st.suBudget===k?'2px solid var(--accent)':'1px solid var(--border)', bg: st.suBudget===k?'var(--accent-weak)':'#fff', onPick:()=>{ this.setState({ suBudget:k }); if (this._qzT) clearTimeout(this._qzT); this._qzT=setTimeout(()=>{ this._qzT=null; this.setState(x=>({ user:Object.assign({},x.user,{ prefs:{ pace:x.suPace, styleTags:x.suStyleTags } }) })); this.suNav('s3'); }, 260); } }))),
        qzTags: [ ['CHILL','🌿'],['ACTIVE','🥾'],['FOODIE','🍜'],['CULTURE','🏛️'],['ADVENTURE','🪂'],['LUXURY','🥂'],['BUDGET','🎒'] ].map(([t2,emo])=>{ const on=st.suStyleTags.includes(t2); return { label:t2, emo, bg:on?'var(--ink)':'#fff', fg:on?'#fff':'var(--sec)', bord:on?'var(--ink)':'var(--border)', onToggle:()=>this.setState(x=>({ suStyleTags: x.suStyleTags.includes(t2) ? x.suStyleTags.filter(y=>y!==t2) : [...x.suStyleTags, t2] })) }; }),
        suNameVal: st.suName, setSuName:(e)=>this.setState({ suName:e.target.value }),
        dkHasCard: (()=>{ const cards=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6); return st.dkIdx < cards.length; })(),
        dkDone: (()=>{ const cards=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6); return st.dkIdx >= cards.length; })(),
        dkName:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?c2.name:''; })(),
        dkWhy:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?c2.why:''; })(),
        dkPhotoUrl:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?photoUrl(c2.photo):''; })(),
        dkPhotoQ:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?c2.photo:''; })(),
        dkPct:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?(matchPct(c2, st.user.prefs)+'% MATCH'):''; })(),
        dkPillBg:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?pillFor(c2.cat).bg:'#fff'; })(),
        dkPillFg:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?pillFor(c2.cat).fg:'#000'; })(),
        dkPillLabel:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?pillFor(c2.cat).label:''; })(),
        dkHours:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?c2.hours:''; })(),
        dkCostLabel:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2?moneyFree(c2.cost):''; })(),
        dkTags:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; const mine=(st.user.prefs&&st.user.prefs.styleTags)||[]; return c2?(c2.tags||[]).map(t2=>({ label:t2, on:mine.includes(t2), bg:mine.includes(t2)?'var(--accent)':'var(--well)', fg:mine.includes(t2)?'#fff':'var(--sec)' })):[]; })(),
        dkRecDisplay:(()=>{ const c2=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6)[st.dkIdx]; return c2 && matchPct(c2, st.user.prefs)>=90 ? 'inline-block' : 'none'; })(),
        dkSavedCount: String(st.suSeedPids.length),
        dkCanUndo: !!st.dkLastSave || st.dkIdx>0,
        dkSave:()=>{ const cards=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6); const c2=cards[st.dkIdx]; if(!c2) return; this.setState(x=>({ suSeedPids: x.suSeedPids.includes(c2.id)?x.suSeedPids:[...x.suSeedPids, c2.id], dkIdx:x.dkIdx+1, dkLastSave:c2.id, dkDrag:0 })); },
        dkSkip:()=>this.setState(x=>({ dkIdx:x.dkIdx+1, dkLastSave:null, dkDrag:0 })),
        dkUndo:()=>this.setState(x=>({ dkIdx:Math.max(0,x.dkIdx-1), suSeedPids: x.dkLastSave? x.suSeedPids.filter(y=>y!==x.dkLastSave) : x.suSeedPids, dkLastSave:null })),
        dkShowDone: st.suSeedPids.length>=1,
        dkDrag: st.dkDrag||0,
        dkDragRot: ((st.dkDrag||0)/20).toFixed(2),
        dkDragTrans: (st.dkDrag||0)===0 ? 'transform .28s cubic-bezier(.22,1,.36,1)' : 'none',
        dkPtrDown:(e)=>{ this._dkStart={ x:e.clientX, id:e.pointerId }; try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){}; },
        dkPtrMove:(e)=>{ if (!this._dkStart) return; const dx=e.clientX-this._dkStart.x; this.setState({ dkDrag:dx }); },
        dkPtrUp:(e)=>{ if (!this._dkStart) return; const dx=(st.dkDrag||0); this._dkStart=null; if (dx>=60){ this.setState({ dkDrag:400 }); setTimeout(()=>{ const cards=funnelDest.places.slice().sort((a,b)=>b.suitability-a.suitability).slice(0,6); const c2=cards[st.dkIdx]; if(!c2){ this.setState({ dkDrag:0 }); return; } this.setState(x=>({ suSeedPids: x.suSeedPids.includes(c2.id)?x.suSeedPids:[...x.suSeedPids, c2.id], dkIdx:x.dkIdx+1, dkLastSave:c2.id, dkDrag:0 })); }, 180); } else if (dx<=-60){ this.setState({ dkDrag:-400 }); setTimeout(()=>this.setState(x=>({ dkIdx:x.dkIdx+1, dkLastSave:null, dkDrag:0 })), 180); } else { this.setState({ dkDrag:0 }); } },
        scr_s1:st.suScreen==='s1', scr_s2:st.suScreen==='s2', scr_s3:st.suScreen==='s3', scr_s3b:st.suScreen==='s3b', scr_s4:st.suScreen==='s4',
        scr_s5:st.suScreen==='s5', scr_s5a:st.suScreen==='s5a', scr_s6:st.suScreen==='s6', scr_s7:st.suScreen==='s7',
        scr_sPeople:st.suScreen==='sPeople',
        groupName:st.suGroupName, setGroupName:(e)=>this.setState({ suGroupName:e.target.value }),
        friendChips: FRIENDS.map(f=>{ const on=st.suMembers.some(m=>m.id===f.id); return { id:f.id, name:f.name, bg:f.bg, ring: on?'2px solid var(--ink)':'1px solid var(--border)', onToggle:()=>{ if (on) this.setState(x=>({ suMembers:x.suMembers.filter(m=>m.id!==f.id) })); else this.setState(x=>({ suMembers:[...x.suMembers, { id:f.id, name:f.name, bg:f.bg, status:'joined', type:'app', role:'COLLABORATOR', sub:'' }] })); } }; }),
        peopleList: st.suMembers.map(m=>({ id:m.id, name:m.name, bg:m.bg, initial:(m.name[0]||'?').toUpperCase(), canRemove: m.id==='me' ? 'none' : 'flex', onRemove:()=>this.setState(x=>({ suMembers:x.suMembers.filter(y=>y.id!==m.id) })), onRename:(e)=>this.setState(x=>({ suMembers:x.suMembers.map(y=>y.id===m.id?Object.assign({},y,{name:e.target.value}):y) })) })),
        addPersonDisplay: st.suMembers.length<8 ? 'block':'none',
        addPerson:()=>{ const n=st.suMembers.length; const palette=['#5B7565','#B0451A','#3FA377','#7A6E5C','#FF5A1F','#1F8A5F']; this.setState(x=>({ suMembers:[...x.suMembers, { id:'p'+n+'_'+Math.random().toString(36).slice(2,6), name:'', bg:palette[n%palette.length], status:'joined', type:'app', role:'COLLABORATOR', sub:'' }] })); },
        copyInviteLink:()=>{ const link='wandr.app/join/'+t.code; try{ navigator.clipboard.writeText(link); } catch(e){} this.toast('Link copied · '+t.code); },
        peopleDone:()=>{ const named=st.suMembers.filter(m=>m.name.trim()); MEMBERS.length=0; MEMBERS.push(...named); APP_MEMBERS = MEMBERS.filter(m=>m.type!=='companion'); ALL_COUNT = MEMBERS.length; APP_COUNT = APP_MEMBERS.length; this.suNav(st.suEditReturn||'s8'); },
        peopleBack:()=>this.suNav(st.suEditReturn||'s8'),
        blendYourTag: (st.suStyleTags[0]||'chill').toLowerCase(),
        funnelDestName: funnelDest.name,
        ingChips: [ st.suPace.toUpperCase()+' PACE', (st.suBudget||'comfort').toUpperCase() ].concat(st.suStyleTags.slice(0,3)).map(x=>({ label:x, bg:'var(--well)', fg:'var(--sec)', starDisplay:'none' })).concat(st.suSeedPids.map(pid=>{ const p=funnelDest.places.find(x=>x.id===pid); return p?{ label:p.name, bg:'var(--accent-weak)', fg:'var(--tip-ink)', starDisplay:'inline-block' }:null; }).filter(Boolean)).map((x,i)=>Object.assign(x,{ delay:(i*90)+'ms' })),
        scr_s8:st.suScreen==='s8', scr_s12:st.suScreen==='s12',
        progLabel:prog.label, progPct:prog.pct,
        seeSample:()=>{ const tt=st.trips.find(x=>x.status==='active')||st.trips[0]; if (tt) openTripId(tt.id); },
        goS1:()=>this.suNav('s1'), exitSetupAsk:()=>this.setState({ suExitConfirm:true }), exitSetupCancel:()=>this.setState({ suExitConfirm:false }), showExitConfirm:!!st.suExitConfirm, exitSetup:()=>this.setState({ view:'home', suExitConfirm:false, suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, suDestConfirmed:false, suDestText:'' }), goS2:()=>this.suNav('s2'), goS3:()=>this.suNav('s3'), goS3b:()=>this.suNav('s3b'), goS4:()=>this.suNav('s4'), goBackFromS7:()=>this.suNav('s6'), goBackS8:()=>this.suNav('s12'),
        goS5:()=>{ if (st.suEditReturn){ const ret=st.suEditReturn; this.setState({ suEditReturn:null }); this.suNav(ret); } else { this.suNav('s5'); } }, goS6:()=>this.suNav('s6'), goS7:()=>this.suNav('s7'), goS8:()=>this.suNav('s8'), goS12:()=>this.suNav('s12'),
        suViewItinerary:()=>openTripId(this.state.activeTripId),
        name:st.suName, homeCity:st.suHomeCity, setName:(e)=>this.setState({ suName:e.target.value }), setHome:(e)=>this.setState({ suHomeCity:e.target.value }),
        paceChips, styleTags, previewInitial:suInitial, previewName:suNameOr, previewLine,
        social, joinCode:()=>this.setState({ view:'join', joScreen:'code', joCode:'', joFrom:'setup' }), justExplore:()=>{ this.setState({ view:'home', suScreen:'s1' }); this.toast('Browse ideas - no account needed'); },
        tripName:st.suTripName, setTrip:(e)=>this.setState({ suTripName:e.target.value }),
        groupOfCount:String(ALL_COUNT),
        destText:st.suDestText, setDestText:(e)=>this.setState({ suDestText:e.target.value, suDestConfirmed:false }), destSelectedLabel,
        destResults, showDestResults, showDestNotice, noticeIcon:destNotice?destNotice.icon:'', noticeTitle:destNotice?destNotice.title:'', noticeBody:destNotice?destNotice.body:'',
        destConfirmed:st.suDestConfirmed, confirmedName: confirmedDest?confirmedDest.name:'', confirmedEmoji: confirmedDest?confirmedDest.emoji:'', confirmedTagline: confirmedDest?confirmedDest.tagline:'',
        changeDest:()=>this.setState({ suDestConfirmed:false, suDestText:'' }),
        goS4b:()=>{ if (!st.suDestConfirmed){ this.toast('Pick a destination first'); return; } this.suNav('s4b'); },
        goS4b2:()=>this.suNav('s4b'),
        s4NextBg: st.suDestConfirmed?'var(--accent)':'var(--well)', s4NextFg: st.suDestConfirmed?'#241F1A':'var(--sec)', s4NextShadow: st.suDestConfirmed?'0 10px 26px rgba(255,90,31,.3)':'none',
        scr_s4b:st.suScreen==='s4b',
        dow:['S','M','T','W','T','F','S'], calCells, rangeLabel, dayCountLabel, dayCountDisplay,
        pickImport:()=>{ this.setState({ suPath:'import', suConfirmed:false, suScreen:'s5a' }); }, pickScratch:()=>{ this.setState({ suPath:'scratch', suScreen:'s6' }); },
        parsedFields, notConfirmed:!st.suConfirmed, isConfirmed:st.suConfirmed, confirmBooking:()=>{ this.setState({ suConfirmed:true }); this.suNav('s6'); },
        backFromS6:()=>{ if (st.suPath==='import') this.suNav('s5a'); else this.suNav('s5'); }, s6Cta: st.suStaged.length?'Synthesise plan':'Skip & draft',
        tasks,
        tripCode:t.code, destName: (V==='setup' ? funnelDest.name : dest.name), suMapPins, contributors, contributorsSummary, lockedLabel, invite:()=>this.setState({ suScreen:'sPeople', suEditReturn:'s8' }),
        suOptions, showSeasonBanner, seasonBannerText, lockCtaLabel: suPicked ? ('Lock '+lockedLabel+' → view trip') : 'Select a draft to lock', lockCtaBg: suPicked?'var(--accent)':'var(--well)', lockCtaFg: suPicked?'#fff':'var(--sec)',
        lockAndGo:()=>{ if (!suPicked){ this.toast('Tap a draft to select it first'); return; } this.suCreateTrip(); this.suNav('s8'); },
      };
    };

    inst.rvPlan = function(c){
      const { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId } = c;
      const plDay = t.days[st.plActiveDay] || { stops:[], code:'DAY 01', label:'Day 01' };
      const plStops = plDay.stops;
      const activeStops = plStops.map((s,i)=>{ const e=this.plEnrich(s,i+1); e.onClick=()=>this.plOpenDetail(s.uid); return e; });
      const plMapPins = plStops.map((s,i)=>({ seq:i+1, short:shortName(s.name), grow: i<plStops.length-1?'flex:1':'flex:0 0 auto', line: i<plStops.length-1 ? 'flex:1;height:0;border-top:2px dashed rgba(255,90,31,.5);margin:13px 6px 0' : 'display:none' }));
      const plPerPerson = plStops.reduce((x,s)=>x+(s.cost||0),0);
      const dayTabs = t.days.map((d,i)=>({ label:'Day '+(i+1), onClick:()=>this.setState({ plActiveDay:i }), style: i===st.plActiveDay ? 'flex:1;padding:11px;border-radius:12px;border:none;background:var(--ink);color:#fff;font-size:12px;cursor:pointer' : 'flex:1;padding:11px;border-radius:12px;border:1px solid var(--border);background:#fff;color:var(--sec);font-size:12px;cursor:pointer' }));
      const plLoc = st.plEditUid ? this.plLocate(st.plEditUid) : null;
      const detailLoc = st.plDetailUid ? this.plLocate(st.plDetailUid) : null;
      let dtl = { name:'', why:'', tip:'', hours:'', costLabel:'', reach:'', reachIcon:ICONS['taxi'], howTo:'', fit:'', time:'', photoUrl:'', photoQ:'', pillBg:'', pillFg:'', pillLabel:'', tags:[], seasonNote:'', seasonDisplay:'none' };
      if (detailLoc){
        const stx = detailLoc.stop; const src = dest.places.find(p=>p.id===stx.pid);
        const pill = pillFor(stx.cat);
        dtl = { name:stx.name, why:stx.why, tip:stx.tip, hours:stx.hours, costLabel:moneyFree(stx.cost), reach:stx.reach, reachIcon:reachIcon(stx.reach), howTo: (src&&src.howToReach)||stx.reach||'', fit: src? (src.suitability+'% FIT') : '', time:stx.time, photoUrl:photoUrl(stx.photo), photoQ:stx.photo, pillBg:pill.bg, pillFg:pill.fg, pillLabel:pill.label, tags: (src&&src.tags?src.tags:[String(stx.cat).toUpperCase()]).map(t=>({ label:t })), seasonNote: stx.seasonNote||'', seasonDisplay: (stx.closedMonths && stx.closedMonths.includes(TRIP_MONTH)) ? 'block' : 'none' };
      }
      const rxStore = (t.reactions||{})[st.plDetailUid] || {};
      const rxSeed = (()=>{ let h=0; const u=st.plDetailUid||''; for(let i=0;i<u.length;i++) h=(h*31+u.charCodeAt(i))%97; return { fire:1+(h%3), heart:h%3, hmm:h%2 }; })();
      const dReactions = !st.plDetailUid ? [] : [['fire','🔥'],['heart','❤️'],['hmm','🤔']].map(([k,emo])=>{ const mine=rxStore.mine===k; const n=(rxSeed[k]||0)+(rxStore[k]||0); return { emo, n:String(n), bg: mine?'var(--accent-weak)':'#fff', bord: mine?'var(--accent)':'var(--border)', onTap:()=>{ this.updTrip(tt=>{ const r=Object.assign({fire:0,heart:0,hmm:0}, (tt.reactions||{})[st.plDetailUid]); if (r.mine===k){ r[k]=Math.max(0,(r[k]||0)-1); r.mine=null; } else { if (r.mine) r[r.mine]=Math.max(0,(r[r.mine]||0)-1); r[k]=(r[k]||0)+1; r.mine=k; } tt.reactions=Object.assign({},(tt.reactions||{}),{ [st.plDetailUid]:r }); }); } }; });
      const plEditStop = plLoc ? plLoc.stop : { name:'', time:'' };
      const alts = this.plAltsForCurrent().map(p=>{ const pill=pillFor(p.cat); return { id:p.id, name:p.name, why:p.why, fit:p.suitability, costLabel:moneyFree(p.fixedCost ? p.cost : Math.round(p.cost*this.plMult())), seasonDisplay:(p.closedMonths && p.closedMonths.includes(TRIP_MONTH))?'inline-block':'none', reach:p.howToReach, reachIcon:reachIcon(p.howToReach), pillBg:pill.bg, pillFg:pill.fg, pillLabel:pill.label, photoUrl:photoUrl(p.photo), photoQ:p.photo, onClick:()=>this.plChooseSwap(p.id) }; });
      const rdStops = st.plReorderDraft ? st.plReorderDraft.stops : plStops;
      const reorderStops = rdStops.map(s=>({ name:s.name, time:s.time, hl: s.uid===st.plEditUid ? 'border-color:var(--accent)' : '', onUp:()=>this.plMoveStop(s.uid,-1), onDown:()=>this.plMoveStop(s.uid,1) }));
      const retimeOptions = cfg.draftTimes.map((t2,i)=>({ time:t2, tag: plEditStop.time===t2 ? 'CURRENT' : (i===0?'MORNING':i===1?'MIDDAY':i===2?'AFTERNOON':'EVENING'), hl: plEditStop.time===t2 ? 'border-color:var(--accent)' : '', onClick:()=>this.plChooseRetime(t2) }));
      const menuActions = [
        { icon:ICONS['arrows-left-right'], title:'Swap this stop', sub:'Ranked alternatives by % fit', onClick:()=>this.plSetMode('swap') },
        { icon:ICONS['arrows-down-up'], title:'Reorder the day', sub:'Stage, review, then confirm', onClick:()=>this.plOpenReorder() },
        { icon:ICONS['clock'], title:'Retime', sub:'Give it a different time slot', onClick:()=>this.plSetMode('retime') },
        { icon:ICONS['pencil-simple'], title:'Edit name / time / notes', sub:'Fine-tune the details', onClick:()=>this.plOpenEditForm() },
        { icon:ICONS['trash'], title:'Remove from day', sub:'Take this stop off the plan', onClick:()=>this.plAskRemove() },
      ].map((a,i)=>Object.assign({}, a, { delay:(i*30)+'ms' }));
      const pend = st.plPending || {};
      const isReorderPend = pend.type==='reorder';
      const pDay = (pend.dayIdx!=null) ? t.days[pend.dayIdx] : plDay;
      const affectedRaw = isReorderPend ? (pend.after||[]) : ((pend.idx!=null && pDay) ? pDay.stops.slice(pend.idx+1) : []);
      const affectedStops = affectedRaw.map(s=>({ name:s.name, time:s.time }));
      const isConflict = !!pend.conflict;
      const guardTitle = isConflict ? 'Timing conflict on later stops' : 'This will shift later stops';
      const guardBadge = isConflict ? 'TIMING CONFLICT DETECTED' : 'LATER STOPS WILL SHIFT';
      const guardBadgeIconPath = isConflict ? ICONS['clock'] : ICONS['arrows-down-up'];
      const guardDetail = isConflict ? pend.conflictDetail : 'Everything after this stop moves down the day - we’ll re-assign each of their times when you confirm.';
      const pBefore = isReorderPend ? {} : (pend.before || {});
      const pAfter = isReorderPend ? {} : (pend.after || pend.before || {});
      const beforeCard = isReorderPend
        ? { time:(pend.before[0]&&pend.before[0].time)||'', name:'Current order', meta: pend.before.map(s=>shortName(s.name)).join(' → ') }
        : { time:pBefore.time||'', name:pBefore.name||'-', meta: pBefore.name ? (moneyRs(pBefore.cost)+'/person · '+(pBefore.reach||'')) : 'This stop is being removed' };
      const afterCard = isReorderPend
        ? { time:(pend.after[0]&&pend.after[0].time)||'', name:'New order', meta: pend.after.map(s=>shortName(s.name)).join(' → ') }
        : (pend.type==='remove' ? { time:'-', name:'Removed', meta:'Later stops move up' } : { time:pAfter.time||'', name:pAfter.name||'', meta: moneyRs(pAfter.cost)+'/person · '+(pAfter.reach||'') });
      const notifyMembers = APP_MEMBERS.map(m=>({ name:m.name, role:m.role.toLowerCase(), initial:initialOf(m), avatar:m.bg, ring: m.id==='me' ? 'box-shadow:0 0 0 2px var(--accent)' : '', tag: m.status==='pending' ? 'PENDING · NOTIFIED ON JOIN' : 'WILL SEE INSTANTLY', tagColor: m.status==='pending' ? 'var(--sec)' : 'var(--accent)' }));
      const summaryMap = {
        swap:'Swapped in '+(pAfter.name||'')+' - '+(pDay?pDay.label:'the day')+' updated for the group.',
        retime:'Retimed '+(pAfter.name||'')+' to '+(pAfter.time||'')+'.',
        edit:'Edited '+(pAfter.name||'')+'’s details.',
        remove:'Removed '+(pBefore.name||'')+' from '+(pDay?pDay.label:'the day')+'.',
        reorder:'Reordered '+(pDay?pDay.label:'the day')+' - times re-assigned.'
      };
      const plFeed = [
        { name:'You', initial:'Y', avatar:'var(--accent)', text:'updated the plan in place.', when:'JUST NOW' },
        { name:'Aanya', initial:'A', avatar:'#1F8A5F', text:'is viewing the changes.', when:'LIVE' },
        { name:'Rohit', initial:'R', avatar:'#7A6E5C', text:'is still pending - will get the update on join.', when:'PENDING' }
      ];
      return {
        isS13:st.plScreen==='S13' || (st.plScreen==='S13d' && !detailLoc), isS13d:st.plScreen==='S13d' && !!detailLoc, isS14a:st.plSheetOpen, isS15:st.plScreen==='S15', isS16:st.plScreen==='S16', isDone:st.plScreen==='S16done',
        rulesOpen:st.plRulesOpen, openRules:()=>this.setState({ plRulesOpen:true }), closeRules:()=>this.setState({ plRulesOpen:false }),
        routeOpen:st.plRouteOpen, toggleRoute:()=>this.setState(x=>({ plRouteOpen:!x.plRouteOpen })), routeToggleLabel: st.plRouteOpen?'HIDE ROUTE':'SHOW ROUTE', routeToggleIconDisplay: st.plRouteOpen?'none':'inline-block',
        dBack:()=>this.plBackFromDetail(), dSwap:()=>this.plActFromDetail('swap'), dRetime:()=>this.plActFromDetail('retime'), dEdit:()=>this.plActFromDetail('edit'), dRemove:()=>this.plActFromDetail('remove'),
        dReserve:()=>this.toast('Reserve - demo only, no live booking behind this yet'),
        dName:dtl.name, dWhy:dtl.why, dTip:dtl.tip, dHours:dtl.hours, dCost:dtl.costLabel, dReach:dtl.reach, dReachIcon:dtl.reachIcon, dHowTo:dtl.howTo, dHowToDisplay: (dtl.howTo && dtl.howTo!==dtl.reach)?'block':'none', dFit:dtl.fit, dTime:dtl.time, dPhotoUrl:dtl.photoUrl, dPhotoQ:dtl.photoQ, dPillBg:dtl.pillBg, dPillFg:dtl.pillFg, dPillLabel:dtl.pillLabel, dTags:dtl.tags, dSeasonNote:dtl.seasonNote, dSeasonDisplay:dtl.seasonDisplay, dReactions,
        heroPhotoUrl:photoUrl(dest.photo), heroPhotoQ:dest.photo,
        dayCodeLabel: plDay.code+' · '+t.code, dayTabs, flexRules: dest.flexRules.map(x=>({ text:x })), plMapPins,
        hasStops:plStops.length>0, emptyDay:plStops.length===0, activeStops, perPersonLabel:moneyRs(plPerPerson),
        onStartTrip:()=>this.plStartTrip(), onFillDay:()=>this.plFillDay(),
        editStopName:plEditStop.name, editStopTime:plEditStop.time,
        isMenu:st.plEditMode==='menu', isSwap:st.plEditMode==='swap', isReorder:st.plEditMode==='reorder', isRetime:st.plEditMode==='retime', isEdit:st.plEditMode==='edit',
        menuActions, alts, hasAlts:alts.length>0, noAlts:alts.length===0, reorderStops, retimeOptions, onReorderDone:()=>this.plReorderDone(), closeSheet:()=>this.plCloseSheet(), plBackToOverview:()=>this.plBackToOverview(), backToMenu:()=>this.plBackToMenu(),
        formName: st.plForm?st.plForm.name:'', formTime: st.plForm?st.plForm.time:'', formNotes: st.plForm?st.plForm.notes:'',
        onFormName:(e)=>this.setState(s=>({ plForm:Object.assign({}, s.plForm, {name:e.target.value}) })), onFormTime:(e)=>this.setState(s=>({ plForm:Object.assign({}, s.plForm, {time:e.target.value}) })), onFormNotes:(e)=>this.setState(s=>({ plForm:Object.assign({}, s.plForm, {notes:e.target.value}) })), onEditSave:()=>this.plSaveEditForm(),
        guardTitle, guardBadge, guardBadgeIconPath,
        guardImpact: isReorderPend ? ('You staged a new order for '+(pDay?pDay.label:'this day')+'. Times re-assign to the new sequence, so every stop after the first moves.') : ('You changed “'+(pBefore.name||'a stop')+'” on '+(pDay?pDay.label:'this day')+'. Because it sits earlier in the day, the stops after it are affected.'),
        guardDetail: guardDetail || 'This change affects later stops.', affectedCount:affectedStops.length, affectedStops, onGuardContinue:()=>this.plGuardContinue(), onGuardCancel:()=>this.plGuardCancel(),
        plBeforeTime:beforeCard.time, plBeforeName:beforeCard.name, plBeforeMeta:beforeCard.meta, plAfterTime:afterCard.time, plAfterName:afterCard.name, plAfterMeta:afterCard.meta,
        notifyMembers, onConfirm:()=>this.plConfirmChange(), onS16Back:()=>this.plS16Back(),
        changeSummary: summaryMap[pend.type] || 'The plan was updated in place.', feed:plFeed, onBackToPlan:()=>this.plBackToPlan(),
      };
    };

    inst.rvGroup = function(c){
      const { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId } = c;
      const g = t.group;
      const poll = this.poll();
      const grGroup = !st.grSolo;
      const grStatus = this.grPollStatus();
      const grResolvedB = !!g.resolved;
      const grPlanDay = t.days[0] || { stops:[] };
      const grStops = grPlanDay.stops.map(s=>{ const p=pillFor(s.cat); return { time:s.time, name:s.name, why:s.why, cost:moneyFree(s.cost), pillBg:p.bg, pillFg:p.fg, pillLabel:p.label }; });
      const grPerPersonN = grPlanDay.stops.reduce((x,s)=>x+(s.cost||0),0);
      const memberVotes = Object.assign({}, poll.seedVotes); if (g.myVote) memberVotes['me']=g.myVote;
      const guestRsvps = Object.values((g && g.rsvps)||{}).map(r=>({ name:r.name, role:'COLLABORATOR · NEW', sub:(r.pace+' pace · '+(r.tags||[]).slice(0,2).join(', ')), initial:r.name[0], bg:'#5C6B4C', avExtra:'', nameExtra:'', tag: r.rsvp==='going'?'GOING 🎒':(r.rsvp==='maybe'?'MAYBE 🎭':'RSVP’D'), tagBg:'var(--accent-weak)', tagFg:'var(--tip-ink)', tagExtra:'', actionDisplay:'none', onAction:()=>{} }));
      const grMembers = MEMBERS.filter(m=>!this.grIsRemoved(m.id)).map(m=>{
        const companion=m.type==='companion';
        const pending=m.status==='pending', vetoed=this.grVetoUsedBy(m.id), editor=m.id==='m2', voted=!!memberVotes[m.id];
        const roleLabel = this.grRoleFor(m.id, m.role);
        let tag='JOINED', tagBg='var(--well)', tagFg='var(--sec)', tagExtra='';
        if (companion){ tag='ON TRIP · NO APP'; tagBg='var(--sand)'; tagFg='var(--sec)'; tagExtra='border:1px solid var(--border);'; }
        else if (pending){ tag='PENDING'; tagBg='transparent'; tagFg='var(--tip-ink)'; tagExtra='border:1px dashed var(--accent);'; }
        else if (vetoed){ tag='VETOED'; tagBg='var(--accent-weak)'; tagFg='var(--tip-ink)'; }
        else if (voted){ tag='VOTED'; tagBg='var(--accent)'; tagFg='#241F1A'; }
        else if (editor){ tag='EDITING'; tagBg='rgba(31,138,95,.14)'; tagFg='#1F8A5F'; }
        const showProceedLink = pending && !g.proceeded;
        const showManage = !companion && !pending;
        return { id:m.id, name:m.name, role:roleLabel, sub:m.sub, initial:m.name[0], bg:m.bg,
          avExtra:(editor?'box-shadow:0 0 0 2px var(--accent);':'')+(pending?'border:2px dashed var(--accent);opacity:.7;':'')+(companion?'opacity:.85;':''),
          nameExtra: vetoed?'text-decoration:line-through;opacity:.4;':'', tag, tagBg, tagFg, tagExtra,
          actionDisplay: showProceedLink?'block':'none',
          onAction: showProceedLink ? (()=>{ this.updTrip(tt=>{ tt.group.proceeded=true; }); this.toast('Proceeding without Rohit - he can catch up'); }) : (()=>{}),
          manageDisplay: showManage?'flex':'none', onManage: showManage?(()=>this.grOpenMemberAction(m.id)):(()=>{}) };
      }).concat(guestRsvps);
      const memberActionTarget = st.grMemberActionFor ? MEMBERS.find(m=>m.id===st.grMemberActionFor) : null;
      const memberActionIsMe = !!memberActionTarget && memberActionTarget.id==='me';
      const memberActionAlreadyPlanner = !!memberActionTarget && /PLANNER/.test(this.grRoleFor(memberActionTarget.id, memberActionTarget.role));
      const stackAvatars = MEMBERS.map(m=>({ initial:m.name[0], bg:m.bg }));
      const tallyMini = poll.options.map(o=>{ const voted=g.myVote===o.id, vetoed=this.grIsVetoed(o.id); const voters = MEMBERS.filter(m=>memberVotes[m.id]===o.id).map(m=>({ initial:initialOf(m), bg:m.bg })); return { label:o.label, count: this.grEff(o.id)+' vote'+(this.grEff(o.id)===1?'':'s')+(vetoed?' · VETOED':''), bg: voted?'var(--accent)':'var(--well)', fg: voted?'#241F1A':'var(--ink)', border: vetoed?'1px solid rgba(255,90,31,.4)':'1px solid transparent', strike: vetoed?'text-decoration:line-through;opacity:.4;':'', pct: Math.round(this.grEff(o.id)/Math.max(1,APP_COUNT)*100)+'%', voters }; });
      const grOptions = poll.options.map(o=>{ const voted=g.myVote===o.id, vetoed=this.grIsVetoed(o.id), myBurned=this.grVetoUsedBy('me'); return { label:o.label, tally: this.grEff(o.id)+' VOTE'+(this.grEff(o.id)===1?'':'S')+(vetoed?' · VETOED':''), cardExtra: voted?'background:var(--accent);border-color:var(--accent);':(vetoed?'opacity:.55;':''), labelExtra: voted?'color:#241F1A;':(vetoed?'opacity:.4;':'color:var(--ink);'), strikeClass: vetoed?'wandr-strike':'', subExtra: voted?'color:rgba(36,31,26,.75);':'color:var(--sec);', onVote:()=>this.grVote(o.id), voteLabel: voted?'Voted':'Vote', voteIconDisplay: voted?'inline-block':'none', voteBtnExtra: voted?'background:#fff;color:var(--accent);border-color:#fff;':'', onVeto:()=>this.grVeto(o.id), vetoLabel: vetoed?'Vetoed':'Veto', vetoDisabled: (grResolvedB||vetoed||myBurned)?'disabled':'', vetoBtnExtra: (vetoed||myBurned)?'opacity:.4;color:var(--tip-ink);border-color:rgba(255,90,31,.4);':'color:var(--tip-ink);' }; });
      const aanyaBurned = this.grVetoUsedBy('m2');
      const unvetoed = poll.options.filter(o=>!this.grIsVetoed(o.id));
      const showAanyaVeto = grGroup && !grResolvedB && !st.grVetoConfirm && !aanyaBurned && this.grVetoUsedBy('me') && unvetoed.length===1;
      const aanyaVetoTarget = unvetoed.length===1 ? unvetoed[0].label : '';
      const canResolve = !grResolvedB && !st.grVetoConfirm && !st.grResolveMode && (this.grIsTie() || this.grIsDeadlock());
      const resolveReason = this.grIsDeadlock() ? 'MUTUAL-VETO DEADLOCK - NEEDS A NEUTRAL PICK' : 'TIE - NEEDS A PLANNER TIEBREAK';
      const tiebreakChoices = poll.options.map(o=>({ label:'Pick '+o.label, onPick:()=>this.grFinish(o.label,'PLANNER TIEBREAK') }));
      const grActivity = [
        { initial:'A', bg:'#1F8A5F', text:'Aanya is editing Day 1', time:'2M AGO' },
        { initial:'Y', bg:'#FF5A1F', text:'You opened a vote', time:'11M AGO' },
        { initial:'R', bg:'#7A6E5C', text:'Rohit was invited', time:'34M AGO' },
      ];
      return {
        group:grGroup, soloBtnLabel: st.grSolo?'GROUP DEMO':'SOLO DEMO', onToggleSolo:()=>this.setState({ grSolo:!st.grSolo, grTab:'decisions', grSheetOpen:false }),
        grCode:t.code, syncTag:'SYNCED', headerSub: grGroup ? ((t.groupName?t.groupName+' · ':'')+ALL_COUNT+' travellers · '+MEMBERS.filter(m=>m.status==='joined').length+' joined · '+MEMBERS.filter(m=>m.status==='pending').length+' pending') : 'Solo trip',
        itinCls: st.grTab==='itinerary'?'on':'', decCls: st.grTab==='decisions'?'on':'', onTabItin:()=>this.setState({ grTab:'itinerary' }), onTabDec:()=>this.setState({ grTab:'decisions' }),
        showItin: !st.grSolo, showDec: !st.grSolo, solo:st.grSolo,
        heroPhoto:photoUrl(dest.photo), heroPhotoQ:dest.photo, grStopCount:String(grPlanDay.stops.length), stops:grStops, perPerson:moneyFree(grPerPersonN), groupTotal:moneyFree(grPerPersonN*ALL_COUNT), memberCount:ALL_COUNT,
        members:grMembers, stackAvatars, plusN:'',
        memberActionOpen: !!st.grMemberActionFor, memberActionName: memberActionTarget?memberActionTarget.name:'',
        memberActionIsMe, memberActionIsOther: !!memberActionTarget && !memberActionIsMe, memberActionAlreadyPlanner, makePlannerDisplay: memberActionAlreadyPlanner?'none':'block',
        onMakePlanner: ()=>this.grMakePlanner(st.grMemberActionFor),
        onRemoveMember: ()=>this.grRemoveMember(st.grMemberActionFor),
        onLeaveTrip: ()=>this.grLeaveTrip(),
        onCloseMemberAction: ()=>this.grCloseMemberAction(),
        showProceeded: grGroup && g.proceeded,
        pollQuestion:poll.question, deadline:poll.deadline, pollStatus:this.grStatusLabel(grStatus),
        statusBg: grStatus==='RESOLVED'?'var(--accent)':(grStatus==='VOTING_OPEN'?'rgba(31,138,95,.14)':'var(--accent-weak)'), statusFg: grStatus==='RESOLVED'?'#fff':(grStatus==='VOTING_OPEN'?'#1F8A5F':'var(--tip-ink)'),
        grBackToOverview:()=>this.setState({ view:'overview', grSheetOpen:false, grInviteOpen:false, grVetoConfirm:null, grResolveMode:null }),
        grOpenInvite:()=>this.setState({ grInviteOpen:true }), grCloseInvite:()=>this.setState({ grInviteOpen:false }),
        grQr: Array.from({length:36},(x,i)=>({ c: ((i*7+3)%5<2 || i===0 || i===5 || i===30) ? 'var(--ink)' : 'transparent' })),
        grCopyLink:()=>{ try { navigator.clipboard.writeText('https://wandr.app/join/'+t.code); } catch(e){} this.toast('Invite link copied · '+t.code); },
        tallyMini, onOpenSheet:()=>this.setState({ grSheetOpen:true }), activity:grActivity, onInvite:()=>this.toast('Invite link copied'),
        sheetOpen:st.grSheetOpen, onCloseSheet:()=>this.setState({ grSheetOpen:false, grResolveMode:null, grTab:'itinerary' }),
        isResolved:grResolvedB, resolvedLabel: g.resolved?g.resolved.label:'', resolvedBy: g.resolved?g.resolved.by:'',
        showOptions: !grResolvedB && !st.grVetoConfirm, grOptions,
        showVetoConfirm: !!st.grVetoConfirm, vetoConfirmLabel: st.grVetoConfirm ? (poll.options.find(o=>o.id===st.grVetoConfirm)||{label:''}).label : '', onConfirmVeto:()=>this.grConfirmVeto(), onCancelVeto:()=>this.grCancelVeto(),
        showAanyaVeto, aanyaVetoTarget, onAanyaVeto:()=>this.grAanyaVeto(),
        canResolve, resolveReason, onResolve:()=>this.setState({ grResolveMode: this.grIsDeadlock()?'neutral':'tiebreak' }),
        showTiebreak: st.grResolveMode==='tiebreak' && !grResolvedB, tiebreakChoices, showNeutral: st.grResolveMode==='neutral' && !grResolvedB, neutralLabel:poll.neutral, onAcceptNeutral:()=>this.grFinish(poll.neutral,'NEUTRAL 3RD OPTION'),
      };
    };

    inst.rvLive = function(c){
      const { st, V, t, dest, cfg, initialOf, navTabs, anySheet, appScroll, openTripId } = c;
      const live = t.live;
      const lvStops = this.liveStops();
      const lvNextId = this.lvNextStopId();
      const lvDoneCount = lvStops.filter(s=>!!live.checkins[s.id]).length;
      const lvNextStop = lvStops.find(s=>s.id===lvNextId) || null;
      const lvAllDone = lvDoneCount>0 && !lvNextStop;
      const lvEtaLine = lvAllDone ? 'ALL WRAPPED FOR TODAY' : 'NEXT · '+(lvNextStop?shortName(lvNextStop.name):'-')+' · ~15 MIN AWAY';
      const cpDone={bg:'#1F8A5F',mark:ICONS['check'],fg:'var(--ink)'}, cpCurrent={bg:'var(--accent)',mark:ICONS['circle-fill'],fg:'var(--ink)'}, cpPending={bg:'#C7C1B8',mark:ICONS['circle'],fg:'var(--sec)'};
      const lvCheckpoints = lvAllDone ? [
        Object.assign({ label:'Left stay' }, cpDone, { line:'var(--border)', lineDisplay:'block' }),
        Object.assign({ label:'En route' }, cpDone, { line:'var(--border)', lineDisplay:'block' }),
        Object.assign({ label:'All done' }, cpDone, { line:'transparent', lineDisplay:'none' }),
      ] : (lvDoneCount===0 ? [
        Object.assign({ label:'Left stay' }, cpDone, { line:'var(--border)', lineDisplay:'block' }),
        Object.assign({ label:'En route' }, cpCurrent, { line:'var(--border)', lineDisplay:'block' }),
        Object.assign({ label: lvNextStop?shortName(lvNextStop.name):'-' }, cpPending, { line:'transparent', lineDisplay:'none' }),
      ] : [
        Object.assign({ label:'Left stay' }, cpDone, { line:'var(--border)', lineDisplay:'block' }),
        Object.assign({ label:'En route' }, cpDone, { line:'var(--border)', lineDisplay:'block' }),
        Object.assign({ label: lvNextStop?shortName(lvNextStop.name):'-' }, cpCurrent, { line:'transparent', lineDisplay:'none' }),
      ]);
      const lvPinPos = [[18,58],[48,30],[78,66]];
      const lvMapPins = lvStops.map((s,i)=>{ const done=!!live.checkins[s.id]; const pos=lvPinPos[i%3]; return { style:'position:absolute;left:'+pos[0]+'%;top:'+pos[1]+'%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:999px;background:'+(done?'#1F8A5F':'var(--accent)')+';color:#fff;display:flex;align-items:center;justify-content:center;font-family:\'DM Sans\';font-weight:600;font-size:13px;border:2px solid #fff;box-shadow:0 3px 8px rgba(36,31,26,.25)', label: done?'':String(s.pin), checkDisplay: done?'inline-block':'none' }; });
      const lvOffline = st.lvOffline;
      const dayStops = lvStops.map(s=>{
        const done=!!live.checkins[s.id], isNext=s.id===lvNextId, p=pillFor(s.cat);
        const pend=!!(live.pending&&live.pending[s.id]);
        let checkinPrompt, promptColor, checkinLabel, checkinBg, onCheckin;
        if (done){ checkinPrompt='You made it'; promptColor='#1F8A5F'; checkinLabel='Checked in'; checkinBg='#1F8A5F'; onCheckin=()=>{}; }
        else if (lvOffline){
          checkinPrompt='Check-in syncs when back online'; promptColor='var(--sec)'; checkinLabel='Sync paused'; checkinBg='#B8B2A8'; onCheckin=()=>this.lvQueueCheckin(s.id);
          if (pend){ checkinPrompt='Saved offline'; checkinLabel='Sync pending'; checkinBg='#B8B2A8'; promptColor='var(--sec)'; }
        }
        else { checkinPrompt='Did you go?'; promptColor='var(--sec)'; checkinLabel='Check in'; checkinBg='var(--ink)'; onCheckin=()=>this.lvCheckin(s.id); }
        return { photo:s.photo, name:s.name, why:s.why, hours:s.hours, reach:s.reach, reachIconPath:reachIcon(s.reach), time:s.time, photoUrl:photoUrl(s.photo), costLabel:moneyFree(s.cost), pinBg: done?'#1F8A5F':'var(--accent)', pinLabel: done?'':String(s.pin), pinCheckDisplay: done?'inline-block':'none', pinClass: done?'wandr-pop':'', nextDisplay: isNext?'inline-block':'none', ring: isNext?'0 0 0 2px var(--accent),0 8px 24px rgba(36,31,26,.06)':'0 8px 24px rgba(36,31,26,.06)', pillBg:p.bg, pillFg:p.fg, pillLabel:p.label, checkinPrompt, promptColor, checkinLabel, checkinIconDisplay: done?'inline-block':'none', checkinBg, onCheckin };
      });
      const swapStop = alertSwapStop(dest, this.plMult());
      const alertToday = lvStops.some(s=>s.name.indexOf(dest.alert.swapOut)===0);
      const lvBefore = lvStops.find(s=>s.name.indexOf(dest.alert.swapOut)===0) || lvStops[0] || { name:dest.alert.swapOut, pin:1, cost:0, reach:'', time:'12:30 PM', photo:dest.photo };
      const lvAfterD = swapStop;
      const doneStops = lvStops.map((s,i)=>({ name:s.name, meta:s.time+' · '+moneyFree(s.cost), divider: i<lvStops.length-1?'1px solid var(--border)':'none' }));
      const donePhotos = lvStops.map(s=>({ photoUrl:photoUrl(s.photo), photo:s.photo, name:s.name }));
      const stars = [1,2,3,4,5].map(n=>({ color: n<=live.feedback?'var(--accent)':'#DCD8D2', onStar:()=>this.lvSetFeedback(n) }));
      const lvSpend = lvStops.reduce((sum,s)=>sum+(s.cost||0),0);
      const catLabelFor = c => (c==='food' ? 'Food & dining' : 'Sights & entries');
      const mult=(DATASET.config.budget[t.prefs.budget]||DATASET.config.budget.comfort).mult; const catBudgets = { 'Sights & entries': Math.round(900*mult), 'Food & dining': Math.round(500*mult) };
      const spentByCat = { 'Sights & entries':0, 'Food & dining':0 };
      lvStops.forEach(s=>{ spentByCat[catLabelFor(s.cat)] += (s.cost||0); });
      const budgetBars = Object.keys(catBudgets).map(label=>{ const budget=catBudgets[label], spent=spentByCat[label], over=spent>budget, maxVal=Math.max(budget,spent,1); const underPct=Math.round(Math.min(spent,budget)/maxVal*100), overPct=over?Math.round((spent-budget)/maxVal*100):0, tickPct=Math.round(budget/maxVal*100); return { label, color: over?'var(--accent)':'#1F8A5F', amountLabel: moneyRs(spent)+' / '+moneyRs(budget)+(over?' · OVER':' · UNDER'), underWidth:underPct+'%', overWidth:overPct+'%', overDisplay: over?'block':'none', tickPct:tickPct+'%' }; });
      const allStopPhotos = t.days.reduce((acc,d)=>acc.concat(d.stops.map(s=>s.photo)),[]);
      const momentQs = (allStopPhotos.length ? allStopPhotos.slice() : [dest.photo]);
      while (momentQs.length<6) momentQs.push(dest.photo);
      const moments = momentQs.slice(0,6).map((q,i)=>({ photoUrl:photoUrl(q), photo:q, transform: i===1?'rotate(-2.5deg)':'none', shadow: i===1?'0 8px 18px rgba(36,31,26,.14)':'none', z: i===1?'2':'1' }));
      const foodList = dest.food.map(f=>({ name:f.name, tag:String(f.tag).toUpperCase(), photoUrl:photoUrl(dest.name+' '+f.name+' food'), detail:f.tip+' · '+moneyRs(f.cost), onBook:()=>this.toast('Reserved at '+f.name+' (demo)') }));
      const lvActiveDayIdx = st.lvActiveDay||0;
      const d1 = t.days[lvActiveDayIdx+1] || { stops:[] };
      const tomorrowName = d1.stops.slice(0,2).map(s=>shortName(s.name)).join(' & ') || 'More to explore';
      const tomorrowPhotoQ = (d1.stops[0] && d1.stops[0].photo) || dest.photo;
      return {
        isToday:st.lvScreen==='today', isReplan:st.lvScreen==='replan', isComplete:st.lvScreen==='complete', isRecap:st.lvScreen==='recap', foodOpen:st.lvFoodOpen,
        lvDayLabel: 'LIVE · DAY '+String(lvActiveDayIdx+1).padStart(2,'0'),
        wrapDayHeading: "That's a wrap on Day "+(lvActiveDayIdx+1),
        wrapDayKicker: 'DAY '+String(lvActiveDayIdx+1).padStart(2,'0')+' · COMPLETE',
        tomorrowKicker: 'TOMORROW · DAY '+String(lvActiveDayIdx+2).padStart(2,'0'),
        todayTitle:'Today in '+dest.name+' '+t.emoji, todayMeta:t.code+' · '+lvDoneCount+'/'+lvStops.length+' DONE · '+ALL_COUNT+' TRAVELLERS',
        lvEtaLine, lvCheckpoints,
        offlineBtnBg: lvOffline?'var(--ink)':'var(--canvas)', offlineBtnFg: lvOffline?'#fff':'var(--sec)', offlineBtnLabel: lvOffline?'Offline':'Online', offlineIconPath: lvOffline?ICONS['wifi-slash']:ICONS['wifi-high'], showOffline:lvOffline,
        showAlert: !lvOffline && !live.swapped && !live.dismissed, showResolved: !lvOffline && live.swapped, showDismissed: !lvOffline && !live.swapped && live.dismissed,
        resolvedText: dest.alert.swapOut+' swapped for '+shortName(swapStop.name)+'.',
        alertIcon:dest.alert.icon, alertKicker:String(dest.alert.type||'ALERT').toUpperCase()+' ALERT · '+(alertToday?'LIVE':'HEADS-UP'), alertTitle:dest.alert.title, alertWhy:dest.alert.why, alertImpact:dest.alert.impact, alertAffects:'AFFECTS · '+String(dest.alert.swapOut).toUpperCase()+(alertToday&&lvBefore&&lvBefore.pin?' (STOP '+lvBefore.pin+')':' (LATER THIS TRIP)'),
        alertCtaLabel: alertToday ? 'See the suggested swap' : 'Got it, swap on the day',
        alertCtaArrowDisplay: alertToday ? 'inline-block' : 'none',
        alertCta: alertToday ? ()=>this.setState({ lvScreen:'replan' }) : ()=>{ this.lvDismiss(); this.toast("Noted - we'll suggest a swap that morning"); },
        lvStopCount:String(lvStops.length).padStart(2,'0'),
        lvProgressLabel: lvDoneCount+' of '+lvStops.length+' checked in',
        lvHasPending: !!(t.group && t.group.openVote),
        lvPendingLabel: (t.group && t.group.openVote) ? (t.group.openVote.title+' - open vote') : '',
        lvOpenDecisions: ()=>this.setState({ view:'group', grTab:'decisions' }),
        lvMapPins, dayStops,
        replanTitle:'Swap '+shortName(dest.alert.swapOut)+' for a safer pick',
        replanSub: dest.alert.impact+" Here's the same "+(lvBefore.time||'12:30 PM')+" slot, sorted.",
        replanMemberNote:'flagged '+shortName(dest.alert.swapOut)+' - this swap drops that stop.',
        lvBeforeName:lvBefore.name, lvBeforePhoto:lvBefore.photo, lvBeforePhotoUrl:photoUrl(lvBefore.photo), lvBeforeMeta:moneyFree(lvBefore.cost||0)+' · '+(lvBefore.reach||''),
        lvAfterName:lvAfterD.name, lvAfterPhoto:lvAfterD.photo, lvAfterPhotoUrl:photoUrl(lvAfterD.photo), lvAfterMeta:moneyFree(lvAfterD.cost)+' · '+lvAfterD.reach,
        acceptLabel:'Accept & re-sequence for all '+ALL_COUNT,
        completeSub: lvStops.length+' stops, all synced across your group.', doneStops, photosLabel:'📸 PHOTOS CAPTURED · '+lvStops.length, donePhotos, stars, feedbackThanksDisplay: live.feedback?'block':'none',
        tomorrowName, tomorrowPhotoQ, tomorrowPhotoUrl:photoUrl(tomorrowPhotoQ),
        lvBackToOverview:()=>this.setState({ view:'overview', lvFoodOpen:false, wrapOpen:false }),
        wrapOpen: st.wrapOpen,
        wrapPlay:()=>this.setState({ wrapOpen:true, wrapIdx:0 }),
        wrapClose:()=>this.setState({ wrapOpen:false }),
        wrapNext:()=>this.setState(x=> x.wrapIdx>=3 ? { wrapOpen:false } : { wrapIdx:x.wrapIdx+1 }),
        wrapPrev:()=>this.setState(x=>({ wrapIdx:Math.max(0,x.wrapIdx-1) })),
        wrapDashes:[0,1,2,3].map(i=>({ c: i<=st.wrapIdx?'var(--accent)':'rgba(255,255,255,.25)' })),
        wrapIsLast: st.wrapIdx===3,
        wrapKicker:['THE WRAP','THE DAMAGE','THE DRAMA','THE CREW'][st.wrapIdx],
        wrapBig:(()=>{ const spend=moneyRs(lvSpend); const veto=Object.keys(t.group.vetoes||{}).length; return [ lvStops.length+' stops.\nOne '+dest.name+'.', spend+'\nper person.', veto? (veto+' veto burned.\nZero regrets.') : 'Not one veto.\nTotal harmony.', t.name+', wrapped '+t.emoji ][st.wrapIdx]; })(),
        wrapSub:(()=>{ return [ 'Every stop checked in by the group - one living plan, start to finish.', 'Tickets, chai and one big group dinner. Split '+ALL_COUNT+' ways, no arguments.', 'Decisions by vote, one veto each. The group machine worked.', ALL_COUNT+' travellers · '+fmtRange(t) ][st.wrapIdx]; })(),
        wrapPhotos: lvStops.slice(0,3).map(x=>({ photoUrl:photoUrl(x.photo), photoQ:x.photo })),
        wrapShare:()=>{ try { navigator.clipboard.writeText('Our '+t.name+' wrap · '+lvStops.length+' stops · '+moneyRs(lvSpend)+'/person - planned on Wandr'); } catch(e){} this.toast('Wrap copied - paste anywhere'); },
        recapKicker:t.code+' · RECAP', recapTitle:dest.name+', wrapped '+t.emoji, recapSub: lvStops.length+' places · '+ALL_COUNT+' travellers · '+moneyRs(lvSpend)+' / person', placesCount:String(lvStops.length), spendLabel:moneyRs(lvSpend), budgetBars, moments, archiveLabel: live.archived?'Saved as reusable template':'Archive → reuse as template', archiveIconDisplay: live.archived?'inline-block':'none',
        foodList, foodTitle:'Eat around '+dest.name,
        toggleOffline:()=>this.lvToggleOffline(), openFood:()=>this.setState({ lvFoodOpen:true }), closeFood:()=>this.setState({ lvFoodOpen:false }),
        keepOriginal:()=>this.lvDismiss(), reopenAlert:()=>this.lvReopen(), accept:()=>this.lvAccept(),
        finishDay:()=>{ const tp=this.currentTrip(); const pend=(tp.live.pending)||{}; if (Object.keys(pend).length){ this.updTrip(tt=>{ tt.live.checkins=Object.assign({}, tt.live.checkins, pend); tt.live.pending={}; }); } const active=st.lvActiveDay||0; const last = active+1 >= (tp.days||[]).length; if (last){ this.setState({ lvScreen:'complete' }); } else { this.setState({ lvActiveDay: active+1, lvScreen:'today' }); this.toast('Day '+(active+2)+' unlocked'); } }, toRecap:()=>this.setState({ lvScreen:'recap' }), backToday:()=>this.setState({ lvScreen:'today' }), share:()=>this.toast('Recap link copied'), archive:()=>this.lvArchive(),
      };
    };

    inst.rvTrips = function(c){
      const { st, openTripId } = c;
      const cardOf2=(u,big)=>{ const d=getDestination(u.destKey); const stops=(u.days[0]||{stops:[]}).stops; const ci=u.live.checkins||{}; const done=Object.keys(ci).length; const total=u.days.reduce((x,dd)=>x+dd.stops.length,0)||1; return { name:u.name, emoji:u.emoji, code:u.code, range:fmtRange(u), photoUrl:photoUrl(d.photo), photoQ:d.photo, tagline:d.tagline, countdown: u.status==='active' ? ('DAY '+tripDayOf(u)+' OF '+tripLen(u)) : ('IN '+tripDaysUntil(u)+' DAYS'), progress: Math.round(done/total*100)+'%', progressLabel: done+'/'+total+' STOPS DONE', onOpen:()=>openTripId(u.id) }; };
      const activeUp = st.trips.filter(x=>x.status==='active'||x.status==='upcoming').sort((a,b)=>(tripDaysUntil(a)||0)-(tripDaysUntil(b)||0));
      const tpHero = activeUp.length ? cardOf2(activeUp[0], true) : null;
      const tpHeroSection = tpHero ? (activeUp[0].status==='active' ? 'Live' : 'Upcoming') : '';
      const tpRest = activeUp.slice(1).map(u=>cardOf2(u,false));
      const past = st.trips.filter(x=>x.status==='past').sort((a,b)=> dParse(b.dates.start)-dParse(a.dates.start));
      const years = [];
      past.forEach(u=>{ const y=u.dates.start.slice(0,4); let g=years.find(x=>x.year===y); if(!g){ g={year:y, rows:[]}; years.push(g); } g.rows.push({ name:u.name, emoji:u.emoji, range:fmtRange(u), code:u.code, onOpen:()=>openTripId(u.id) }); });
      return {
        tpHasHero: !!tpHero, tpHeroSection,
        tpHeroName: tpHero?tpHero.name:'', tpHeroEmoji: tpHero?tpHero.emoji:'', tpHeroRange: tpHero?tpHero.range:'', tpHeroCountdown: tpHero?tpHero.countdown:'', tpHeroPhotoUrl: tpHero?tpHero.photoUrl:'', tpHeroPhotoQ: tpHero?tpHero.photoQ:'', tpHeroProgress: tpHero?tpHero.progress:'0%', tpHeroProgressLabel: tpHero?tpHero.progressLabel:'', tpHeroOpen: tpHero?tpHero.onOpen:()=>{},
        tpRest, tpHasRest: tpRest.length>0, tpYears: years,
        tpEmpty: !tpHero && tpRest.length===0 && years.length===0,
        tpNewTrip:()=>{ if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', grSheetOpen:false, grInviteOpen:false, lvFoodOpen:false, plSheetOpen:false, exFilterOpen:false }); this.toast('Quick sign-in - then straight to your trip'); return; } this.setState({ view:'setup', suScreen:'s2', suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, newDestKey:'shimla', suDestConfirmed:false, suDestText:'', qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids:[] }); },
      };
    };

    inst.rvExplore = function(c){
      const { st } = c;
      const cityKeysX = ['shimla','goa','manali','jaipur','rishikesh','udaipur'];
      const enterSetupWithX = (k, theme)=>{ if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', grSheetOpen:false, grInviteOpen:false, lvFoodOpen:false, plSheetOpen:false, exFilterOpen:false }); this.toast('Quick sign-in - then straight to your trip'); return; } this.setState({ view:'setup', suScreen:'s2', newDestKey:k, suDestConfirmed:true, suDestText:'', suLockedTheme:theme||null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids:[] }); };
      const openPsDetailX = (destKey, placeId)=>this.setState({ view:'placeSearch', psScreen:'detail', psDestKey:destKey, psPlaceId:placeId||null, psFrom:'explore', psViaSearch:false });
      const exTrending = cityKeysX.map(k=>{ const d=DATASET.destinations[k]; const top=d.places.slice().sort((a,b)=>b.suitability-a.suitability)[0]; return { name:d.name, emoji:"", tagline:d.tagline, pct:matchPct(top, st.user.prefs)+'%', photoUrl:photoUrl(d.photo), photoQ:d.photo, onPick:()=>openPsDetailX(k, null) }; });
      const exCurated = [ ['shimla','classic'], ['goa','chill'], ['jaipur','classic'], ['rishikesh','adventure'] ].map(([k,th])=>{ const d=DATASET.destinations[k]; const theme=(DATASET.config.themes.find(x=>x.id===th)||DATASET.config.themes[0]); const opts=optionsFor(d, { pace:'balanced', budget:'comfort', styleTags:st.user.prefs.styleTags }, ALL_COUNT); const o=opts.find(x=>x.id===th)||opts[0]; return { title:theme.label, city:d.name, emoji:"", stops:o.stops+' stops', per:moneyRs(o.perPerson)+'/person', photoUrl:photoUrl(d.photo), photoQ:d.photo, onPick:()=>this.setState({ view:'curatedPreview', cpDestKey:k, cpThemeId:th }) }; });
      const exSoon = ['Varanasi','Leh','Munnar','Pondicherry','Coorg','Darjeeling'].map(n=>({ name:n, onNotify:()=>{ this.toast("Draft a "+n+" trip - be the first"); if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', suDestText:n }); return; } this.setState({ view:'setup', suScreen:'s2', newDestKey:'shimla', suDestConfirmed:false, suDestText:n, suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids:[] }); } }));
      const priceBand = (cost)=> cost<200?'₹':(cost<=800?'₹₹':'₹₹₹');
      const inShort = (k,pid)=> st.shortlist.some(x=>x.destKey===k && x.placeId===pid);
      const toggleShort = (k,pid,name)=>{ this.setState(x=>({ shortlist: x.shortlist.some(y=>y.destKey===k&&y.placeId===pid) ? x.shortlist.filter(y=>!(y.destKey===k&&y.placeId===pid)) : [...x.shortlist, { destKey:k, placeId:pid }] })); this.toast(inShort(k,pid) ? (name+' removed from shortlist') : (name+' shortlisted')); };
      let exAll = cityKeysX.flatMap(k=>{ const d=DATASET.destinations[k]; return d.places.map(p=>({ k, p, d })); });
      if (st.exSlot)  exAll = exAll.filter(x=> x.p.slot===st.exSlot || (st.exSlot==='morning'&&x.p.slot==='fullday'));
      if (st.exPrice) exAll = exAll.filter(x=> priceBand(x.p.cost)===st.exPrice);
      const exPlaces = exAll.slice(0, 10).map(({k,p,d})=>{ const pct=matchPct(p, st.user.prefs); const bg = pct>=90?'#1F8A5F':(pct>=75?'#3FA377':'#7A6E5C'); return { name:p.name, city:d.name, pct:pct+'% match', pctBg: bg, why:p.why, photoUrl:photoUrl(p.photo), photoQ:p.photo, cost:moneyFree(p.cost), saved:inShort(k,p.id), savedColor: inShort(k,p.id)?'var(--accent)':'var(--sec)', onSave:()=>toggleShort(k,p.id,p.name), onPick:()=>openPsDetailX(k, p.id) }; });
      const exFilterChipsSlot = ['morning','afternoon','evening'].map(sl=>({ label:sl.toUpperCase(), on:st.exSlot===sl, bg:st.exSlot===sl?'var(--ink)':'#fff', fg:st.exSlot===sl?'#fff':'var(--sec)', onPick:()=>this.setState(x=>({ exSlot: x.exSlot===sl?null:sl })) }));
      const exFilterChipsPrice = [['₹','Under 200'],['₹₹','200-800'],['₹₹₹','800+']].map(([pr,rng])=>({ label:pr+' '+rng, on:st.exPrice===pr, bg:st.exPrice===pr?'var(--ink)':'#fff', fg:st.exPrice===pr?'#fff':'var(--sec)', onPick:()=>this.setState(x=>({ exPrice: x.exPrice===pr?null:pr })) }));
      const shGroups = [];
      st.shortlist.forEach(it=>{ const d=DATASET.destinations[it.destKey]; if(!d) return; const p=d.places.find(x=>x.id===it.placeId); if(!p) return; let g=shGroups.find(x=>x.key===it.destKey); if(!g){ g={ key:it.destKey, city:d.name, emoji:"", rows:[] }; shGroups.push(g); } g.rows.push({ name:p.name, pct:matchPct(p, st.user.prefs), pctLabel:matchPct(p, st.user.prefs)+'%', pctW:matchPct(p, st.user.prefs)+'%', cost:moneyFree(p.cost), photoUrl:photoUrl(p.photo), photoQ:p.photo, onRemove:()=>toggleShort(it.destKey, it.placeId, p.name) }); });
      const shTop = shGroups.slice().sort((a,b)=>b.rows.length-a.rows.length)[0];
      return {
        exTrending, exCurated, exSoon, exPlaces,
        exSearch:()=>this.setState({ view:'placeSearch', psScreen:'search', psQuery:'', psDestKey:null, psPlaceId:null, psFrom:'explore', psViaSearch:false }),
        exFilterOpen: st.exFilterOpen, exOpenFilter:()=>this.setState({ exFilterOpen:true }), exCloseFilter:()=>this.setState({ exFilterOpen:false }),
        exFilterChipsSlot, exFilterChipsPrice, exResultCount:'Show '+exPlaces.length+' places',
        exFilterActive: !!(st.exSlot || st.exPrice), exClearFilters:()=>this.setState({ exSlot:null, exPrice:null }),
        shCount: st.shortlist.length, shHas: st.shortlist.length>0,
        openShortlist:()=>this.setState({ view:'shortlist' }),
        viewShortlist: st.view==='shortlist',
        shBack:()=>this.setState({ view:'explore' }),
        shGroups,
        shStartLabel: shTop ? ('Start a '+shTop.city+' trip from these') : '',
        shStart: shTop ? (()=>{ if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip' }); this.toast('Quick sign-in - then straight to your trip'); return; } const pids=shTop.rows.length?st.shortlist.filter(x=>x.destKey===shTop.key).map(x=>x.placeId):[]; this.setState({ view:'setup', suScreen:'s2', newDestKey:shTop.key, suDestConfirmed:true, suDestText:'', suSeedPids:pids, suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, qzStep: st.user.name ? 1 : 0, dkIdx:0 }); }) : (()=>{}),
      };
    };

    inst.rvProfile = function(c){
      const { st } = c;
      const u = st.user || { name:'', authed:false, prefs:{ pace:'balanced', styleTags:[] } };
      return {
        pfName: u.name || 'Traveller', pfInitial: (u.name||'T')[0].toUpperCase(),
        pfSub: u.authed ? 'Signed in' : 'GUEST · NOT SIGNED IN',
        pfChips: [u.prefs.pace.toUpperCase()+' PACE'].concat(u.prefs.styleTags).map(x=>({ label:x })),
        pfTrips:()=>this.setState({ view:'trips' }),
        pfEditToggle:()=>this.setState({ pfEdit: !st.pfEdit }),
        pfEdit: st.pfEdit,
        pfEditDisplay: st.pfEdit ? 'flex' : 'none',
        pfNameVal: st.user.name||'',
        pfSetName:(e)=>this.setState(x=>({ user:Object.assign({},x.user,{ name:e.target.value }) })),
        pfPaceOptions: ['slow','balanced','packed'].map(k=>({ label:k[0].toUpperCase()+k.slice(1), on:st.user.prefs.pace===k, bg:st.user.prefs.pace===k?'var(--ink)':'#fff', fg:st.user.prefs.pace===k?'#fff':'var(--sec)', onPick:()=>this.setState(x=>({ user:Object.assign({},x.user,{ prefs:Object.assign({},x.user.prefs,{pace:k}) }) })) })),
        pfSavePrefs:()=>{ this.setState({ pfEdit:false }); this.toast('Preferences updated'); this.saveState(); },
        pfOpenInbox:()=>this.setState({ view:'inbox' }),
        pfJoin:()=>this.setState({ view:'join', joScreen:'code', joCode:'', joFrom:'profile' }),
        pfVersion:'Wandr v9 · demo build',
      };
    };

    inst.rvOverview = function(c){
      const { st, t, dest, openTripId } = c;
      const isPast = t.status==='past', isActive = t.status==='active', isUp = t.status==='upcoming';
      const du = tripDaysUntil(t);
      const ci = t.live.checkins||{}; const doneN = Object.keys(ci).length;
      const totalN = t.days.reduce((x,d)=>x+d.stops.length,0)||1;
      const stops0 = (t.live.stops||((t.days[0]||{stops:[]}).stops)).slice(0,3).map(x=>({ time:x.time, name:x.name, cost:moneyFree(x.cost) }));
      const perP = t.days.reduce((x,d)=>x+d.stops.reduce((y,s2)=>y+(s2.cost||0),0),0);
      const checklist = [
        { label:'Draft locked', done:true },
        { label:'Group votes settled', done:!!t.group.resolved },
        { label:'Everyone joined', done:!MEMBERS.some(m=>m.status==='pending') },
      ].map(x=>({ label:x.label, dotIcon:x.done?ICONS['check']:ICONS['circle'], fg:x.done?'#1F8A5F':'var(--sec)' }));
      const moments = isPast ? (t.days[0]||{stops:[]}).stops.slice(0,3).map(x=>({ photoUrl:photoUrl(x.photo), photoQ:x.photo, name:x.name })) : [];
      return {
        viewOverview: st.view==='overview',
        ovBack: ()=>this.setState({ view: st.ovFrom==='trips'?'trips':'home' }),
        ovName: t.name, ovEmoji: t.emoji, ovCode: t.code, ovRange: fmtRange(t),
        ovPhotoUrl: photoUrl(dest.photo), ovPhotoQ: dest.photo,
        ovIsPast: isPast, ovIsActive: isActive, ovIsUpcoming: isUp,
        ovStateKicker: isActive ? ('DAY '+String(tripDayOf(t)).padStart(2,'0')+' OF '+String(tripLen(t)).padStart(2,'0')) : isUp ? ('STARTS IN '+du+' DAY'+(du===1?'':'S')) : 'TRIP COMPLETE',
        ovChecklist: checklist,
        ovStops: stops0, ovStopsMore: Math.max(0, ((t.days[0]||{stops:[]}).stops.length) - stops0.length),
        ovDayScope: 'Day 1',
        ovStopsMoreLabel: (Math.max(0, ((t.days[0]||{stops:[]}).stops.length) - stops0.length)>0) ? ('Open Day 1 · +'+Math.max(0, ((t.days[0]||{stops:[]}).stops.length) - stops0.length)+' more') : 'Open full itinerary',
        ovPerPerson: moneyRs(perP), ovDone: doneN+'/'+totalN,
        ovMoments: moments,
        ovAvatars: MEMBERS.map((m,i)=>({ initial:(m.name==='You'?'Y':m.name[0]), bg:m.bg, gap:i===0?'0':'-9px' })),
        ovOpenPlan: ()=>this.setState({ view:'plan', plScreen:'S13', plActiveDay:0 }),
        ovOpenGroup: ()=>this.setState({ view:'group', grTab:'decisions' }),
        ovOpenBudget: ()=>this.setState({ view:'budget' }),
        ovOpenLive: ()=>this.setState({ view:'live', lvScreen: isPast?'recap':'today' }),
        ovOpenPacking: ()=>{ if (!t.group.packing){ this.updTrip(tt=>{ tt.group.packing = PACKING_DEFAULT.map(x=>Object.assign({},x)); }); } this.setState({ view:'packing' }); },
        ovPackingLabel: (()=>{ const items=t.group.packing||PACKING_DEFAULT; const done=items.filter(i=>i.done).length; return done+'/'+items.length+' PACKED'; })(),
        ovLiveChipLabel: isPast ? 'Recap' : 'Live',
        ovPrimaryLabel: isActive ? 'Open today' : isUp ? 'Continue planning' : 'Play the recap',
        ovPrimary: ()=>{ if (isActive) this.setState({ view:'live', lvScreen:'today' }); else if (isUp) this.setState({ view:'plan', plScreen:'S13', plActiveDay:0 }); else this.setState({ view:'live', lvScreen:'recap' }); },
        ovShare: ()=>this.toast('Share code '+t.code+' with your group'),
        ovNote: isPast ? 'Photos, spends and the story of the trip live here now - planning tools are retired for past trips.' : '',
      };
    };

    inst.rvBudget = function(c){
      const { st, t } = c;
      const perP = t.days.reduce((x,d)=>x+d.stops.reduce((y,s2)=>y+(s2.cost||0),0),0);
      const settled = t.group.settled || {};
      const rows = MEMBERS.filter(m=>m.id!=='me').map(m=>{ const isS = !!settled[m.id]; return { name:m.name, initial:(m.name[0]), bg:m.bg, amt: moneyRs(perP), status: isS?'SETTLED':'OWES YOU', fg: isS?'#1F8A5F':'var(--tip-ink)', btnLabel: isS?'Settled':'Mark settled', btnIconDisplay: isS?'inline-block':'none', onToggle:()=>{ this.updTrip(tt=>{ tt.group.settled = Object.assign({}, tt.group.settled, { [m.id]: !isS }); }); } }; });
      const owed = MEMBERS.filter(m=>m.id!=='me' && !settled[m.id]).length * perP;
      const buPrivacyOn = !!t.group.budgetPrivate;
      return {
        viewBudget: st.view==='budget',
        buBack: ()=>this.setState({ view:'overview' }),
        buPer: moneyRs(perP), buGroup: moneyRs(perP*ALL_COUNT),
        buNet: owed>0 ? ("You're owed "+moneyRs(owed)+" net") : 'All settled 🎉',
        buRows: rows,
        buNote: 'You covered the bookings - everyone settles their share with you.',
        buPrivacyOn, buLedgerDisplay: buPrivacyOn?'none':'block', buHiddenDisplay: buPrivacyOn?'block':'none',
        buPrivacyToggleLabel: buPrivacyOn?'Settle-up hidden from group':'Settle-up visible to group',
        buPrivacyTrackBg: buPrivacyOn?'var(--accent)':'var(--border)', buPrivacyKnobPos: buPrivacyOn?'20px':'2px',
        buTogglePrivacy: ()=>this.updTrip(tt=>{ tt.group.budgetPrivate = !tt.group.budgetPrivate; }),
      };
    };

    inst.rvPacking = function(c){
      const { st, t } = c;
      const items = t.group.packing || PACKING_DEFAULT;
      const doneN = items.filter(i=>i.done).length;
      const pkItems = items.map((it,i)=>{ const mem = MEMBERS.find(m=>m.name===it.owner); const ownerBg = mem?mem.bg:'#7A6E5C'; const ownerInitial = it.owner==='You'?'Y':(it.owner[0]||'?'); return { label:it.label, checkBorder: it.done?'#1F8A5F':'var(--border)', checkBg: it.done?'#1F8A5F':'#fff', checkIconDisplay: it.done?'inline-block':'none', strike: it.done?'text-decoration:line-through;opacity:.45;':'', ownerBg, ownerInitial, onToggle:()=>{ this.updTrip(tt=>{ const arr=(tt.group.packing||PACKING_DEFAULT).map(x=>Object.assign({},x)); arr[i].done=!arr[i].done; tt.group.packing=arr; }); } }; });
      return {
        viewPacking: st.view==='packing',
        pkBack: ()=>this.setState({ view:'overview' }),
        pkProgress: doneN+'/'+items.length+' PACKED',
        pkItems,
        pkInput: st.pkInput||'',
        pkSetInput: (e)=>this.setState({ pkInput: e.target.value }),
        pkAdd: ()=>{ const label=(st.pkInput||'').trim(); if (!label){ this.toast('Type something to add'); return; } this.updTrip(tt=>{ const arr=(tt.group.packing||PACKING_DEFAULT).map(x=>Object.assign({},x)); arr.push({ label, owner:'You', done:false }); tt.group.packing=arr; }); this.setState({ pkInput:'' }); },
      };
    };

    inst.rvInbox = function(c){
      const { st } = c;
      const groupOf = (w)=>{ if (w==='2M AGO'||w==='11M AGO'||w==='1H AGO') return 'TODAY'; if (w==='1D AGO') return 'YESTERDAY'; return 'EARLIER'; };
      const allRows = [];
      (st.trips||[]).forEach(tr=>{
        (tr.events||[]).forEach(ev=>{
          allRows.push({ group:groupOf(ev.when), tripId:tr.id, tripName:tr.name, kind:ev.kind, iconPath:ICONS[ev.icon]||ICONS['bell'], text:ev.text, when:ev.when });
        });
      });
      const order = { TODAY:0, YESTERDAY:1, EARLIER:2 };
      allRows.sort((a,b)=>order[a.group]-order[b.group]);
      const onTapFor = (row)=>()=>{
        const tr2 = st.trips.find(x=>x.id===row.tripId);
        const isPast = tr2 && tr2.status==='past';
        const patch = { activeTripId: row.tripId, lvScreen: isPast?'recap':'today', plScreen:'S13', plDetailUid:null, plSheetOpen:false, wrapOpen:false, lvFoodOpen:false, grSheetOpen:false, grInviteOpen:false, ovFrom:'home' };
        if (row.kind==='vote' && !isPast){ patch.view='group'; patch.grTab='decisions'; }
        else if (row.kind==='weather' && !isPast){ patch.view='live'; }
        else { patch.view='overview'; }
        this.setState(patch);
        this.setState(x=>({ user:Object.assign({},x.user,{ inboxSeen:true }) }));
      };
      const inRows = allRows.map(row=>({ groupLabel:row.group, iconPath:row.iconPath, text:row.text, tripName:row.tripName, when:row.when, onTap:onTapFor(row) }));
      let lastGroup = null;
      const inRowsWithHeaders = [];
      inRows.forEach(row=>{ if (row.groupLabel!==lastGroup){ inRowsWithHeaders.push({ isHeader:true, isRow:false, headerText:row.groupLabel }); lastGroup=row.groupLabel; } inRowsWithHeaders.push(Object.assign({ isHeader:false, isRow:true }, row)); });
      return {
        viewInbox: st.view==='inbox',
        inBack: ()=>this.setState({ view:'home' }),
        inRows: inRowsWithHeaders,
        inEmpty: inRowsWithHeaders.length===0,
      };
    };

    inst.rvJoin = function(c){
      const { st } = c;
      const trip = st.trips.find(x=>x.code==='TRP-902');
      const dest2 = trip ? getDestination(trip.destKey) : null;
      const joPaces = ['slow','balanced','packed'].map(k=>({ label:k.toUpperCase(), on:st.joPace===k, bg:st.joPace===k?'var(--ink)':'#fff', fg:st.joPace===k?'#fff':'var(--sec)', onPick:()=>this.setState({ joPace:k }) }));
      const joTagList = ['CHILL','ACTIVE','FOODIE','CULTURE','ADVENTURE'].map(t2=>({ label:t2, on:st.joTags.includes(t2), bg:st.joTags.includes(t2)?'var(--ink)':'#fff', fg:st.joTags.includes(t2)?'#fff':'var(--sec)', onToggle:()=>this.setState(x=>({ joTags: x.joTags.includes(t2) ? x.joTags.filter(y=>y!==t2) : [...x.joTags, t2] })) }));
      const conflict = trip ? (st.joPace==='slow' && trip.prefs.pace!=='slow' ? 'Your slow pace vs the group’s '+trip.prefs.pace+' plan - Day 1 packs '+((trip.days[0]||{stops:[]}).stops.length)+' stops.' : (st.joTags.includes('ADVENTURE') ? 'You’re set for adventure - Day 2 leans culture. Suggest a swap once you’re in.' : '')) : '';
      const rsvps = [ ['going','Going','🎒'], ['maybe','Maybe','🎭'], ['cant','Can’t go','🙈'] ].map(([k,label,emo])=>({ label, emo, on:st.joRsvp===k, ring: st.joRsvp===k?'2px solid var(--accent)':'1px solid var(--border)', bg: st.joRsvp===k?'var(--accent-weak)':'#fff', onPick:()=>this.setState({ joRsvp:k }) }));
      return {
        viewJoin: st.view==='join',
        joIsCode: st.joScreen==='code', joIsInvite: st.joScreen==='invite', joIsRsvp: st.joScreen==='rsvp', joIsPrefs: st.joScreen==='prefs',
        joCodeVal: st.joCode, joSetCode:(e)=>this.setState({ joCode: e.target.value.toUpperCase() }),
        joSubmitCode: ()=>{ if ((st.joCode||'').trim()==='TRP-902'){ this.setState(x=>{ const has = x.trips.find(t=>t.code==='TRP-902'); const trips = has ? x.trips : [...x.trips, ...seedTrips().filter(t=>t.code==='TRP-902')]; return { trips, joScreen:'invite' }; }); } else { this.toast('Trip not found - try TRP-902'); } },
        joBack: ()=>this.setState({ view: st.joFrom==='welcome' ? 'auth' : (st.joFrom==='setup' ? 'setup' : 'profile'), auScreen:'welcome', joScreen:'code', joCode:'' }),
        joTripName: trip?trip.name:'', joTripEmoji: trip?trip.emoji:'', joTripRange: trip?fmtRange(trip):'', joPhotoUrl: dest2?photoUrl(dest2.photo):'', joPhotoQ: dest2?dest2.photo:'',
        joMembers: MEMBERS.map((m,i)=>({ initial:(m.name==='You'?'Y':m.name[0]), bg:m.bg, gap:i===0?'0':'-9px' })),
        joInviteNext: ()=>this.setState({ joScreen:'rsvp' }),
        joRsvps: rsvps, joRsvpNext: ()=>{ if (!st.joRsvp){ this.toast('Pick one - no pressure'); return; } this.setState({ joScreen:'prefs' }); },
        joPaces, joTagList,
        joConflict: conflict, joHasConflict: !!conflict,
        joFinish: ()=>{ this.updTrip2('TRP-902', tt=>{ tt.group.rsvps = Object.assign({}, tt.group.rsvps, { guest:{ name:'Kabir (you)', rsvp:st.joRsvp, pace:st.joPace, tags:st.joTags } }); }); const tr=st.trips.find(x=>x.code==='TRP-902'); this.setState({ activeTripId: tr?tr.id:st.activeTripId, view:'overview', ovFrom:'home', joScreen:'code', joCode:'' }); this.toast('You’re in - welcome to '+ (trip?trip.name:'the trip')); },
      };
    };

    inst.rvCuratedPreview = function(c){
      const { st } = c;
      const d = st.cpDestKey ? DATASET.destinations[st.cpDestKey] : null;
      const themeId = st.cpThemeId || 'classic';
      const theme = d ? (DATASET.config.themes.find(x=>x.id===themeId)||DATASET.config.themes[0]) : null;
      const prefs = { pace:'balanced', budget:'comfort', styleTags:st.user.prefs.styleTags||[] };
      const opts = d ? optionsFor(d, prefs, MEMBERS.length) : [];
      const o = opts.find(x=>x.id===themeId) || opts[0];
      const draft = d && theme ? draftGen(d, prefs, theme.id, 2, []) : [];
      const day1Stops = (draft[0]||{stops:[]}).stops.map((s,i)=>({
        seq: String(i+1).padStart(2,'0'),
        time: s.time, name: s.name,
        cat: pillFor(s.cat).label,
        pillBg: pillFor(s.cat).bg, pillFg: pillFor(s.cat).fg,
        cost: s.cost===0 ? 'Free' : ('₹'+s.cost),
      }));
      const cpBuild = ()=>{
        if (!d || !theme) return;
        if (!st.user.authed){
          this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', newDestKey:st.cpDestKey, suLockedTheme:theme.id, suDestConfirmed:true });
          this.toast('Quick sign-in - then straight to your plan');
          return;
        }
        this.setState({ view:'setup', suScreen:'s2', newDestKey:st.cpDestKey, suDestConfirmed:true, suDestText:'', suLockedTheme:theme.id, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids:[] });
      };
      return {
        viewCuratedPreview: st.view==='curatedPreview',
        cpTitle: theme?theme.label:'', cpBlurb: theme?theme.blurb:'',
        cpCity: d?d.name:'', cpEmoji: '',
        cpPhotoUrl: d?photoUrl(d.photo):'', cpPhotoQ: d?d.photo:'',
        cpStops: o?String(o.stops)+' stops':'', cpPer: o?moneyRs(o.perPerson)+'/person':'',
        cpGroup: o?moneyRs(o.group)+' group':'',
        cpRating: o?o.rating.toFixed(1):'', cpFeedback: o?(o.feedbackCount+' NOTES'):'',
        cpDay1: day1Stops,
        cpDay1Label: draft[0] ? ('DAY 1 · '+day1Stops.length+' STOPS') : '',
        cpBack: ()=>this.setState({ view:'explore' }),
        cpBuildLabel: st.user.authed ? 'Build a plan around this' : 'Sign up to build your plan',
        cpBuild,
      };
    };

    inst.rvPlaceSearch = function(c){
      const { st } = c;
      const q = (st.psQuery||'').trim().toLowerCase();
      const prefs = st.user.prefs || { pace:'balanced', budget:'comfort', styleTags:[] };
      const paceOfPlace = (p)=>{ if (p.slot==='fullday' || (p.tags||[]).includes('ADVENTURE')) return 'packed'; if (p.cat==='food' || p.slot==='evening' || (p.tags||[]).includes('CHILL')) return 'slow'; return 'balanced'; };
      const paceOfDest = (d)=>{ const arr=(d.places||[]).map(paceOfPlace); const cnt={slow:0,balanced:0,packed:0}; arr.forEach(x=>cnt[x]++); if (cnt.balanced >= Math.max(cnt.slow, cnt.packed)) return 'balanced'; return cnt.slow>cnt.packed ? 'slow' : 'packed'; };
      const budgetCostBand = (p)=>{ const c=p.cost||0; if (c<=200) return 'shoestring'; if (c<=800) return 'comfort'; return 'splurge'; };
      const psMatchPct = (place)=>{
        const base = matchPct(place, prefs);
        const paceBonus = (paceOfPlace(place)===(prefs.pace||'balanced')) ? 6 : 0;
        const budBand = budgetCostBand(place);
        const budBonus = (budBand===(prefs.budget||'comfort')) ? 4 : (Math.abs(['shoestring','comfort','splurge'].indexOf(budBand) - ['shoestring','comfort','splurge'].indexOf(prefs.budget||'comfort'))>1 ? -3 : 0);
        return Math.max(52, Math.min(99, base + paceBonus + budBonus));
      };
      const psMatchPctForDest = (d)=>{ const arr=(d.places||[]).map(psMatchPct); if (!arr.length) return 60; return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length); };
      const allKeys = Object.keys(DATASET.destinations);
      const cityMatches = allKeys.map(k=>DATASET.destinations[k]).filter(d=>!q || d.name.toLowerCase().includes(q) || (d.tagline||'').toLowerCase().includes(q));
      const placeMatches = [];
      allKeys.forEach(k=>{ const d=DATASET.destinations[k]; (d.places||[]).forEach(p=>{ if (!q || p.name.toLowerCase().includes(q) || (p.tags||[]).some(t=>t.toLowerCase().includes(q)) || (p.why||'').toLowerCase().includes(q)) placeMatches.push({ destKey:k, dest:d, place:p }); }); });
      placeMatches.sort((a,b)=>psMatchPct(b.place)-psMatchPct(a.place));
      const placeResults = placeMatches.slice(0,30).map(m=>({
        name:m.place.name, city:m.dest.name, cityEmoji:m.dest.emoji, pctLabel:psMatchPct(m.place)+'% match',
        photoUrl:photoUrl(m.place.photo), photoQ:m.place.photo,
        paceLabel: paceOfPlace(m.place).toUpperCase(),
        onOpen: ()=>this.setState({ psScreen:'detail', psDestKey:m.destKey, psPlaceId:m.place.id, psViaSearch:true }),
      }));
      const cityResults = cityMatches.slice(0,10).map(d=>({
        name:d.name, emoji:"", tagline:d.tagline, photoUrl:photoUrl(d.photo), photoQ:d.photo,
        pctLabel: psMatchPctForDest(d)+'% match', paceLabel: paceOfDest(d).toUpperCase(),
        onOpen: ()=>this.setState({ psScreen:'detail', psDestKey:Object.keys(DATASET.destinations).find(k=>DATASET.destinations[k].name===d.name), psPlaceId:null, psViaSearch:true }),
      }));
      const detailDest = st.psDestKey ? DATASET.destinations[st.psDestKey] : null;
      const detailPlace = detailDest && st.psPlaceId ? (detailDest.places||[]).find(p=>p.id===st.psPlaceId) : null;
      const detailIsCity = !!detailDest && !detailPlace;
      const detailPct = detailPlace ? psMatchPct(detailPlace) : (detailDest?psMatchPctForDest(detailDest):0);
      const detailPace = detailPlace ? paceOfPlace(detailPlace) : (detailDest?paceOfDest(detailDest):'balanced');
      const paceCopy = { slow:'Slow paced - long meals, unhurried mornings, room to wander.', balanced:'Balanced - a full day without being packed.', packed:'Packed - lots to see, back-to-back, high energy.' };
      const activeTrip = st.trips.find(x=>x.status==='active') || st.trips.find(x=>x.status==='upcoming') || null;
      const bookmarkKey = { destKey: st.psDestKey, placeId: detailPlace ? detailPlace.id : null };
      const alreadyBookmarked = detailDest ? (st.shortlist||[]).some(s=>s.destKey===bookmarkKey.destKey && (s.placeId||null)===bookmarkKey.placeId) : false;
      const hashN = (str, mod)=>{ let h=0; for (let i=0;i<str.length;i++) h=(h*31 + str.charCodeAt(i))|0; return Math.abs(h)%mod; };
      const travellersMonth = detailDest ? (1200 + hashN(st.psDestKey||'x', 6800)) : 0;
      const travellersPlace = detailPlace ? (180 + hashN(detailPlace.id+(st.psDestKey||''), 1400)) : 0;
      return {
        viewPlaceSearch: st.view==='placeSearch',
        psIsSearch: st.psScreen==='search', psIsDetail: st.psScreen==='detail',
        psTitle: st.psScreen==='detail' ? (detailPlace?detailPlace.name:(detailDest?detailDest.name:'')) : 'Search',
        psQueryVal: st.psQuery, psSetQuery:(e)=>this.setState({ psQuery:e.target.value }),
        psBack: ()=>{ const home = st.psFrom==='explore' ? 'explore' : 'home'; if (st.psScreen==='detail'){ if (st.psViaSearch) this.setState({ psScreen:'search', psDestKey:null, psPlaceId:null, psViaSearch:false }); else this.setState({ view:home, psDestKey:null, psPlaceId:null }); } else this.setState({ view:home }); },
        psCityResults: cityResults, psPlaceResults: placeResults,
        psHasCity: cityResults.length>0, psHasPlace: placeResults.length>0,
        psShowEmpty: (q.length>0 && cityResults.length===0 && placeResults.length===0),
        psEmptyQuery: st.psQuery,

        psdName: detailPlace ? detailPlace.name : (detailDest?detailDest.name:''),
        psdCity: detailDest ? detailDest.name : '',
        psdEmoji: '',
        psdIsCity: detailIsCity,
        psdPhotoUrl: detailPlace ? photoUrl(detailPlace.photo) : (detailDest?photoUrl(detailDest.photo):''),
        psdPhotoQ: detailPlace ? detailPlace.photo : (detailDest?detailDest.photo:''),
        psdWhy: detailPlace ? (detailPlace.why||'') : (detailDest?(detailDest.tagline||''):''),
        psdTip: detailPlace ? (detailPlace.tip||'') : '',
        psdHours: detailPlace ? (detailPlace.hours||'') : '',
        psdCost: detailPlace ? (detailPlace.cost===0?'Free':('₹'+detailPlace.cost+(detailPlace.fixedCost?'':' pp'))) : '',
        psdHoursDisplay: detailPlace && detailPlace.hours ? 'block' : 'none',
        psdCostDisplay: detailPlace ? 'block' : 'none',
        psdTipDisplay: detailPlace && detailPlace.tip ? 'block' : 'none',
        psdMatchLabel: detailPct + '% MATCH',
        psdPaceLabel: detailPace.toUpperCase() + ' PACE',
        psdPaceCopy: paceCopy[detailPace] || '',
        psdTags: (detailPlace?detailPlace.tags:(detailDest?(detailDest.vibes||['CHILL','FOODIE','CULTURE']):[])).map(t=>({ label:t })),
        psdTagsDisplay: 'flex',
        psdMatchDisplay: st.user.authed ? 'inline-flex' : 'none',
        psdTravellersLabel: detailPlace ? (travellersPlace.toLocaleString()+' travellers visited last month') : (travellersMonth.toLocaleString()+' wandrs planning this month'),
        psdBookmarkIcon: ICONS['bookmark-simple'],
        psdBookmarkColor: alreadyBookmarked ? '#fff' : 'var(--ink)',
        psdBookmarkAria: alreadyBookmarked ? 'Remove bookmark' : 'Bookmark',
        psdBookmarkBg: alreadyBookmarked ? 'var(--accent)' : '#fff',
        psdBookmarkBorder: alreadyBookmarked ? '1px solid var(--accent)' : '1px solid var(--border)',
        psdBookmark: ()=>{ if (!detailDest) return; this.setState(x=>{ const has=(x.shortlist||[]).some(s=>s.destKey===bookmarkKey.destKey && (s.placeId||null)===bookmarkKey.placeId); return { shortlist: has ? x.shortlist.filter(s=>!(s.destKey===bookmarkKey.destKey && (s.placeId||null)===bookmarkKey.placeId)) : [...(x.shortlist||[]), bookmarkKey] }; }); this.toast(alreadyBookmarked?'Bookmark removed':'Bookmarked'); },
        psdStartTripLabel: 'Start a trip with this',
        psdStartTrip: ()=>{ if (!detailDest) return; if (!st.user.authed){ this.setState({ view:'auth', auScreen:'auth', auAfter:'newtrip', newDestKey:st.psDestKey, suDestConfirmed:true, suLockedTheme:null }); this.toast('Quick sign-in - then straight to your plan'); return; } this.setState({ view:'setup', suScreen:'s2', newDestKey:st.psDestKey, suDestConfirmed:true, suDestText:'', suLockedTheme:null, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, qzStep: st.user.name ? 1 : 0, dkIdx:0, suSeedPids: detailPlace?[detailPlace.id]:[] }); },
      };
    };

    inst.rvAuth = function(c){
      const { st } = c;
      const DEMO_PHONE = '9876543210', DEMO_OTP = '421906';
      // Signup has no wrong-credential concept - anyone can sign up. Login checks against
      // the one seeded demo account; anything else is treated as "no account yet" and
      // falls into the signup bucket instead of a dead-end error.
      const loginSuccess = ()=>{
        this.setState(x=>{ const trips = x.trips.length ? x.trips : seedTrips(); const intent = x.auAfter==='newtrip'; return { user:Object.assign({},x.user,{ name:x.user.name||'Kabir', authed:true, seenWelcome:true }), trips, activeTripId: x.activeTripId || trips[0].id, view: intent?'setup':'home', suScreen: intent?'s2':x.suScreen, qzStep: intent?1:x.qzStep, auScreen:'welcome', auMode:null, auAfter:null, auBusy:false, auPhone:'', auOtp:'' }; });
        this.toast('Welcome back'); this.saveState();
      };
      // Signup finishes INSIDE the app (Home) - the hub where explore, start-a-trip
      // and join are all available to any signed-in user. Only route into the trip
      // funnel (s1) when they signed up *because* they hit a gated "start a trip"
      // action (auAfter==='newtrip'); otherwise land on Home like a login does.
      const finishAuth = (name)=>{
        this.setState(x=>{ const intent = x.auAfter==='newtrip'; const dk = intent && x.newDestKey ? x.newDestKey : 'shimla'; const th = intent ? (x.suLockedTheme||null) : null; const dc = intent ? !!x.suDestConfirmed : false; const finalName = name||x.user.name||'Kabir'; return { user:Object.assign({},x.user,{ name:finalName, authed:true, seenWelcome:true }), view: intent ? 'setup' : 'home', suScreen: intent ? 's2' : x.suScreen, auScreen:'welcome', auMode:null, auAfter:null, auBusy:false, suLockedTheme:th, suConfirmed:false, suStaged:[], suPath:null, suTripName:'', suGroupName:'', suMembers: MEMBERS.map(m=>Object.assign({}, m)), suDateStart:null, suDateEnd:null, newDestKey:dk, suDestConfirmed:dc, suDestText:'', qzStep: finalName ? 1 : 0, dkIdx:0, suSeedPids:[] }; });
        this.toast('You’re in - welcome to Wandr'); this.saveState();
      };
      const provider = (label)=>{
        this.setState({ auBusy:true });
        setTimeout(()=>{
          if (st.auMode==='login'){ this.setState({ auBusy:false }); loginSuccess(); }
          else this.setState({ auBusy:false, auScreen:'profile' });
        }, 800);
      };
      return {
        viewAuth: st.view==='auth',
        auIsWelcome: st.auScreen==='welcome', auIsAuth: st.auScreen==='auth', auIsOtp: st.auScreen==='otp', auIsPersona: st.auScreen==='persona', auIsProfile: st.auScreen==='profile',
        auBusy: st.auBusy, auBusyDisplay: st.auBusy?'flex':'none',
        auSignup:()=>this.setState({ auScreen:'auth', auMode:'signup' }),
        auLogin:()=>this.setState({ auScreen:'auth', auMode:'login' }),
        auSkip:()=>{ this.setState(x=>({ user:Object.assign({},x.user,{ seenWelcome:true }), view:'home' })); this.saveState(); },
        auApple:()=>provider('apple'), auGoogle:()=>provider('google'),
        auPhoneVal: st.auPhone, auSetPhone:(e)=>this.setState({ auPhone: e.target.value.replace(/[^0-9]/g,'').slice(0,10) }),
        auPhoneGo:()=>{ if ((st.auPhone||'').length<10){ this.toast('10 digits - we’re strict like that'); return; } this.setState({ auBusy:true }); setTimeout(()=>this.setState({ auBusy:false, auScreen:'otp', auOtp:'' }), 700); },
        auOtpBoxes: Array.from({length:6},(x,i)=>({ d: (st.auOtp||'')[i]||'', bg: (st.auOtp||'').length===i?'var(--accent-weak)':'#fff', bord: (st.auOtp||'').length===i?'var(--accent)':'var(--border)' })),
        auOtpVal: st.auOtp, auSetOtp:(e)=>this.setState({ auOtp: e.target.value.replace(/[^0-9]/g,'').slice(0,6) }),
        auOtpGo:()=>{
          if ((st.auOtp||'').length<6){ this.toast('6 digits needed'); return; }
          if (st.auMode==='login'){
            if (st.auPhone===DEMO_PHONE && st.auOtp===DEMO_OTP){ loginSuccess(); return; }
            this.toast('No account with that number - let’s get you signed up');
            this.setState({ auMode:'signup', auScreen:'profile' });
            return;
          }
          this.setState({ auScreen:'profile' });
        },
        auResend:()=>this.toast('OTP resent · 4-2-1-9-0-6'),
        auShowLoginLink: st.auMode==='signup' ? 'block' : 'none',
        auResendDisplay: (st.auOtp||'').length>=6 ? 'none' : 'block',
        auBackWelcome:()=>this.setState({ auScreen:'welcome' }),
        auBackAuth:()=>this.setState({ auScreen:'auth' }), auBackPersona:()=>this.setState({ auScreen:'persona' }),
        auBackProfile:()=>this.setState({ auScreen:'auth' }),
        auPersonas: [ ['planner','🗺️','The planner','Likes to plan every detail'], ['floater','🍃','The floater','Goes along with the group'], ['spark','⚡','The spark','Suggests spontaneous ideas'] ].map(([k,emo,label,sub])=>({ emo, label, sub, onPick:()=>this.setState({ auScreen:'profile' }) })),
        auNameVal: st.user.name||'', auSetName:(e)=>this.setState(x=>({ user:Object.assign({},x.user,{ name:e.target.value }) })),
        auFinish:()=>finishAuth(st.user.name),
        pfLogout:()=>{ this.setState(x=>({ user:{ name:'', authed:false, seenWelcome:false, prefs:x.user.prefs }, view:'auth', auScreen:'welcome' })); this.saveState(); this.toast('Signed out'); },
        pfIsAuthed: !!st.user.authed,
      };
    };

    inst.renderVals = function(){
      const c = this.rvCtx();
      return Object.assign({}, this.rvShared(c), this.rvHome(c), this.rvTrips(c), this.rvExplore(c), this.rvProfile(c), this.rvOverview(c), this.rvBudget(c), this.rvJoin(c), this.rvAuth(c), this.rvSetup(c), this.rvPlan(c), this.rvGroup(c), this.rvLive(c), this.rvPacking(c), this.rvInbox(c), this.rvPlaceSearch(c), this.rvCuratedPreview(c));
    };
  }
};
