// wandr-flow.js - Component action pipelines (state transitions, navigation,
// persistence, edit pipeline, votes, live-day). Installs onto the DCLogic
// component instance as bound arrow methods, so template handlers keep `this`
// when stored raw in the renderVals bag.
//
// Depends on wandr-data.js and wandr-logic.js being loaded first.

window.WandrFlow = {
  install: function(inst){

    // ---------- active-trip accessors ----------
    // Falls back to a stable synthetic trip (not undefined) when trips is empty, so
    // every rv* method - which all run unconditionally each render regardless of
    // which view is showing - has a well-formed trip/dest to read from.
    inst.currentTrip = () => inst.state.trips.find(t=>t.id===inst.state.activeTripId) || inst.state.trips[0] || (inst.__emptyTrip || (inst.__emptyTrip = makeTrip('shimla','upcoming',{ pace:'balanced', budget:'comfort', styleTags:['CHILL','FOODIE'] })));
    inst.currentDest = () => getDestination(inst.currentTrip().destKey);
    inst.updTrip2 = (code, mut) => inst.setState(s => { const t = s.trips.find(x=>x.code===code); if (t) mut(t, s); return s; });
    inst.updTrip = (mut) => inst.setState(s => { const t = s.trips.find(x=>x.id===s.activeTripId) || s.trips[0]; if (t) mut(t, s); return s; });

    // ---------- toast ----------
    inst.toast = (msg, action) => { inst.setState({ toast: msg, toastAction: action||null }); if (inst._t) clearTimeout(inst._t); inst._t = setTimeout(()=>inst.setState({ toast:null, toastAction:null }), 2400); };
    inst.showToast = (msg) => inst.toast(msg);

    // ---------- persistence ----------
    inst.saveState = () => { try { if (typeof localStorage==='undefined') return; localStorage.setItem(VERSION, JSON.stringify({ schema:CURRENT_SCHEMA, trips:inst.state.trips, activeTripId:inst.state.activeTripId, user:inst.state.user, shortlist:inst.state.shortlist })); } catch(e){} };
    inst.resetData = () => { try { if (typeof localStorage!=='undefined') localStorage.removeItem(VERSION); } catch(e){} const trips=seedTrips(); inst.setState({ trips, activeTripId:trips[0].id, view:'home', hmPopulated:true }); inst.toast('Data reset to seeds'); };

    // Reads and validates the persisted save, self-healing against any stale
    // or malformed shape rather than requiring a manual localStorage clear.
    // Corrupt JSON / unrecognizable payloads are discarded (and the bad key
    // removed so it never gets re-parsed); recognizable-but-stale data
    // degrades in place (bad trips dropped, missing fields defaulted) instead
    // of nuking everything. Trips only ever restore for an authed identity -
    // this never seeds demo data itself, only the real login path does that.
    inst.hydrateFromStorage = () => {
      const CLEAN = { trips:[], activeTripId:null, user:{ name:'', authed:false, prefs:{ pace:'balanced', styleTags:['CHILL','FOODIE'] } }, shortlist:[] };
      if (typeof localStorage==='undefined') return CLEAN;
      let raw;
      try { raw = localStorage.getItem(VERSION); } catch(e){ return CLEAN; }
      if (!raw) return CLEAN;

      let d;
      try { d = JSON.parse(raw); } catch(e){ try{ localStorage.removeItem(VERSION); }catch(e2){} return CLEAN; }
      if (!d || typeof d!=='object' || (!('user' in d) && !('trips' in d))){
        try { localStorage.removeItem(VERSION); } catch(e){}
        return CLEAN;
      }

      const user = Object.assign({}, CLEAN.user, d.user||{}, { prefs: Object.assign({}, CLEAN.user.prefs, (d.user&&d.user.prefs)||{}) });
      const shortlist = Array.isArray(d.shortlist) ? d.shortlist : [];

      if (!user.authed) return { trips:[], activeTripId:null, user, shortlist };

      const trips = Array.isArray(d.trips) ? d.trips.map(reviveTrip).filter(Boolean) : [];
      if (!trips.length) return { trips:[], activeTripId:null, user, shortlist };

      const activeTripId = (d.activeTripId && trips.some(t=>t.id===d.activeTripId)) ? d.activeTripId : trips[0].id;
      return { trips, activeTripId, user, shortlist };
    };

    // ---------- splash ----------
    // Every unauthenticated open lands on the welcome screen (login/signup/skip)
    // so the journey always bifurcates there - `seenWelcome` no longer short-
    // circuits it. Only a real signed-in identity skips straight to Home.
    inst.splashAdvance = () => {
      if (inst.state.view!=='splash') return;
      const u = inst.state.user;
      if (!u || !u.authed) inst.setState({ view:'auth', auScreen:'welcome' });
      else inst.setState({ view:'home' });
    };

    // ---------- photo fallback + shared photo delegator ----------
    inst.photoUrl = (q) => photoUrl(q);
    inst.handleImgError = (e) => {
      const img = e.target;
      if (!img || img.tagName!=='IMG' || !img.classList.contains('wandr-photo')) return;
      if (img.dataset.errFlag) return; img.dataset.errFlag = '1';
      img.style.display = 'none';
    };
    inst.ensureFallbacks = () => {
      const root = inst.el || document;
      root.querySelectorAll('img.wandr-photo').forEach(img => {
        const p = img.parentElement; if (!p) return;
        img.style.position = 'relative';
        const q = (img.getAttribute('data-photo') || img.getAttribute('alt') || 'photo');
        const existing = p.querySelector('.wandr-ph');
        if (existing){
          if (existing.textContent !== String(q).toUpperCase()){
            existing.textContent = String(q).toUpperCase();
            let h2=0; for (let i=0;i<q.length;i++) h2=(h2*31 + q.charCodeAt(i))%360;
            const hue2 = 18 + (h2%42);
            existing.style.background = "linear-gradient(135deg,hsl("+hue2+" 46% 82%),hsl("+(hue2+16)+" 42% 72%))";
            delete img.dataset.errFlag;
          }
          return;
        }
        let h=0; for (let i=0;i<q.length;i++) h=(h*31 + q.charCodeAt(i))%360;
        const hue = 18 + (h%42);
        const tag = document.createElement('div');
        tag.className = 'wandr-ph';
        tag.textContent = String(q).toUpperCase();
        tag.style.cssText = "position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:12px;font-family:'DM Sans',sans-serif;text-transform:uppercase;font-size:10px;letter-spacing:1.5px;color:#241F1A;text-shadow:0 1px 0 rgba(255,255,255,.35);font-weight:600;background:linear-gradient(135deg,hsl("+hue+" 46% 82%),hsl("+(hue+16)+" 42% 72%))";
        if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
        p.insertBefore(tag, img);
      });
    };
    inst.syncPhotos = () => {
      const root = inst.el || document;
      root.querySelectorAll('img.wandr-photo').forEach(img => {
        const src = img.getAttribute('data-src');
        if (src && !src.includes('{{') && img.getAttribute('src') !== src){
          img.style.display='block';
          img.style.opacity='0'; img.addEventListener('load', ()=>{ img.style.opacity='1'; }, { once:true });
          img.setAttribute('src', src);
        }
      });
    };

    // ============================================================
    //  SETUP flow
    // ============================================================
    inst.suNav = (s) => inst.setState({ suScreen:s });
    inst.suProgFor = (screen) => {
      const imp = inst.state.suPath==='import';
      const denom = imp ? 8 : 7;
      const stepMap = imp ? { s2:1, s3:2, s4:3, s4b:4, s5:5, s5a:6, s6:7, s7:8 } : { s2:1, s3:2, s4:3, s4b:4, s5:5, s6:6, s7:7 };
      const n = stepMap[screen] || denom;
      const pad = x => (x<10?'0':'')+x;
      return { label: pad(n)+'/'+pad(denom), pct: Math.round(n/denom*100)+'%' };
    };
    inst.suPickDate = (d) => {
      const s=inst.state;
      if (s.suDateStart==null || s.suDateEnd!=null){ inst.setState({ suDateStart:d, suDateEnd:null }); }
      else if (d < s.suDateStart){ inst.setState({ suDateStart:d, suDateEnd:null }); }
      else { inst.setState({ suDateEnd:d }); }
    };
    inst.suCreateTrip = () => {
      const destKey = (inst.state.newDestKey && String(inst.state.newDestKey).trim()) ? inst.state.newDestKey : 'shimla';
      const dest = getDestination(destKey);
      const prefs = { pace:inst.state.suPace, budget:inst.state.suBudget||'comfort', styleTags:inst.state.suStyleTags.slice() };
      const name = inst.state.suTripName.trim() || dest.name;
      const hasActive = inst.state.trips.some(x=>x.status==='active');
      const ds = inst.state.suDateStart, de = inst.state.suDateEnd;
      const pad2 = n=>String(n).padStart(2,'0');
      const dates = ds ? { start:'2026-07-'+pad2(ds), end:'2026-07-'+pad2(de||Math.min(31,ds+2)) } : { start:'2026-07-25', end:'2026-07-27' };
      const trip = makeTrip(destKey, hasActive ? 'upcoming' : 'active', prefs, name, undefined, dates);
      while (inst.state.trips.some(x=>x.code===trip.code)) trip.code = genCode();
      if (inst.state.suLockedTheme) trip.days = draftGen(dest, prefs, inst.state.suLockedTheme, 2, inst.state.suSeedPids);
      inst.setState(s => { s.trips = [...s.trips, trip]; s.activeTripId = trip.id; return s; });
      return trip;
    };

    // ============================================================
    //  PLAN flow (edit-in-place, guard→confirm)
    // ============================================================
    inst.plMult = () => { const b=inst.currentTrip().prefs.budget; return (DATASET.config.budget[b]||DATASET.config.budget.comfort).mult; };
    inst.plLocate = (uid) => {
      const days = inst.currentTrip().days;
      for (let d=0; d<days.length; d++){ const idx=days[d].stops.findIndex(s=>s.uid===uid); if (idx>=0) return { dayIdx:d, idx, day:days[d], stop:days[d].stops[idx] }; }
      return null;
    };
    inst.plUsedPids = () => { const set=new Set(); inst.currentTrip().days.forEach(d=>d.stops.forEach(s=>set.add(s.pid))); return set; };
    inst.plAltsForCurrent = () => { const used=inst.plUsedPids(); return inst.currentDest().places.filter(p=>!used.has(p.id)).sort((a,b)=>b.suitability-a.suitability); };
    inst.plEnrich = (stop, seq) => { const p=pillFor(stop.cat); return Object.assign({}, stop, { seq, costLabel:moneyFree(stop.cost), pillBg:p.bg, pillFg:p.fg, pillLabel:p.label, reachIcon:reachIcon(stop.reach), photoUrl:photoUrl(stop.photo), photoQ:stop.photo, short:shortName(stop.name), seasonNote: stop.seasonNote||'', seasonDisplay: (stop.closedMonths && stop.closedMonths.includes(TRIP_MONTH)) ? 'inline-block' : 'none', blendInitial: (n=>n==='You'?'Y':n[0])(blendOwner(stop.cat, inst.state.user.prefs.styleTags)), blendBg: ({You:'#FF5A1F',Aanya:'#2E4034',Rohit:'#7A6E5C'})[blendOwner(stop.cat, inst.state.user.prefs.styleTags)]||'var(--accent)' }); };
    inst.plOpenEdit = (uid) => inst.setState({ plSheetOpen:true, plEditUid:uid, plEditMode:'menu' });
    inst.plOpenDetail = (uid) => inst.setState({ plScreen:'S13d', plDetailUid:uid });
    inst.plBackFromDetail = () => inst.setState({ plScreen:'S13', plDetailUid:null });
    inst.plActFromDetail = (kind) => {
      const uid = inst.state.plDetailUid;
      if (!uid) return;
      if (kind==='swap')   inst.setState({ plSheetOpen:true, plEditUid:uid, plEditMode:'swap' });
      else if (kind==='retime') inst.setState({ plSheetOpen:true, plEditUid:uid, plEditMode:'retime' });
      else if (kind==='edit'){ const loc=inst.plLocate(uid); if(!loc) return; inst.setState({ plSheetOpen:true, plEditUid:uid, plEditMode:'edit', plForm:{ name:loc.stop.name, time:loc.stop.time, notes:loc.stop.notes||'' } }); }
      else if (kind==='remove'){ const loc=inst.plLocate(uid); if(!loc) return; const before=Object.assign({},loc.stop); inst.setState({ plEditUid:uid }); inst.plRoute({ type:'remove', dayIdx:loc.dayIdx, idx:loc.idx, before, after:null, conflict:false, shift:false }); }
    };
    inst.plCloseSheet = () => inst.setState({ plScreen:'S13', plSheetOpen:false, plDetailUid:null, plEditUid:null, plEditMode:'menu', plReorderDraft:null });
    inst.plSetMode = (m) => inst.setState({ plEditMode:m });
    inst.plBackToMenu = () => inst.setState({ plEditMode:'menu' });
    inst.plTimeConflict = (stops, idx, newTime) => {
      const nt=parseTimeStr(newTime); const prev=stops[idx-1], next=stops[idx+1];
      if (prev && nt<=parseTimeStr(prev.time)) return { conflict:true, detail:'New time '+newTime+' lands at or before "'+prev.name+'" ('+prev.time+') scheduled just before it.' };
      if (next && nt>=parseTimeStr(next.time)) return { conflict:true, detail:'New time '+newTime+' overlaps "'+next.name+'" scheduled at '+next.time+'.' };
      return { conflict:false, detail:'' };
    };
    inst.plRoute = (pending) => { const guard = pending.conflict || pending.shift; inst.setState({ plPending:pending, plSheetOpen:false, plDetailUid:null, plScreen: guard ? 'S15' : 'S16' }); };
    inst.plChooseSwap = (pid) => {
      const alt=inst.currentDest().places.find(p=>p.id===pid); const loc=inst.plLocate(inst.state.plEditUid); const before=Object.assign({},loc.stop);
      const after=Object.assign({}, loc.stop, { pid:alt.id, name:alt.name, cat:alt.cat, photo:alt.photo, why:alt.why, hours:alt.hours, cost:(alt.fixedCost ? alt.cost : Math.round(alt.cost*inst.plMult())), tip:alt.tip, reach:alt.howToReach, fixedCost:alt.fixedCost||false, closedMonths:alt.closedMonths||null, seasonNote:alt.seasonNote||'' });
      inst.plRoute({ type:'swap', dayIdx:loc.dayIdx, idx:loc.idx, before, after, conflict:false, shift:false });
    };
    inst.plChooseRetime = (t) => {
      const loc=inst.plLocate(inst.state.plEditUid); const before=Object.assign({},loc.stop); const after=Object.assign({},loc.stop,{ time:t });
      const tc=inst.plTimeConflict(loc.day.stops, loc.idx, t);
      inst.plRoute({ type:'retime', dayIdx:loc.dayIdx, idx:loc.idx, before, after, conflict:tc.conflict, conflictDetail:tc.detail, shift:false });
    };
    inst.plOpenEditForm = () => { const loc=inst.plLocate(inst.state.plEditUid); inst.setState({ plEditMode:'edit', plForm:{ name:loc.stop.name, time:loc.stop.time, notes:loc.stop.notes||'' } }); };
    inst.plSaveEditForm = () => {
      const loc=inst.plLocate(inst.state.plEditUid); const f=inst.state.plForm; const before=Object.assign({},loc.stop); const after=Object.assign({},loc.stop,{ name:f.name, time:f.time, notes:f.notes });
      const tc = (f.time!==loc.stop.time) ? inst.plTimeConflict(loc.day.stops, loc.idx, f.time) : { conflict:false, detail:'' };
      inst.plRoute({ type:'edit', dayIdx:loc.dayIdx, idx:loc.idx, before, after, conflict:tc.conflict, conflictDetail:tc.detail, shift:false });
    };
    inst.plAskRemove = () => { const loc=inst.plLocate(inst.state.plEditUid); const before=Object.assign({},loc.stop); inst.plRoute({ type:'remove', dayIdx:loc.dayIdx, idx:loc.idx, before, after:null, conflict:false, shift:false }); };
    inst.plOpenReorder = () => { const loc=inst.plLocate(inst.state.plEditUid); const draft=loc.day.stops.map(s=>Object.assign({},s)); inst.setState({ plEditMode:'reorder', plReorderDraft:{ dayIdx:loc.dayIdx, stops:draft } }); };
    inst.plMoveStop = (uid, dir) => {
      inst.setState(s => {
        if (!s.plReorderDraft) return s; const arr=s.plReorderDraft.stops; const idx=arr.findIndex(x=>x.uid===uid); const j=idx+dir;
        if (idx<0 || j<0 || j>=arr.length) return s; const tmp=arr[idx]; arr[idx]=arr[j]; arr[j]=tmp;
        arr.forEach((st,i)=>{ st.time=(DATASET.config.draftTimes[i] || DATASET.config.draftTimes[DATASET.config.draftTimes.length-1]); }); return s;
      });
    };
    inst.plReorderDone = () => {
      const rd=inst.state.plReorderDraft; const orig=inst.currentTrip().days[rd.dayIdx].stops;
      const changed = rd.stops.some((s,i)=> !orig[i] || s.uid!==orig[i].uid);
      if (!changed){ inst.setState({ plEditMode:'menu', plReorderDraft:null }); return; }
      inst.plRoute({ type:'reorder', dayIdx:rd.dayIdx, idx:0, before:orig.map(s=>Object.assign({},s)), after:rd.stops.map(s=>Object.assign({},s)), conflict:false, shift:true });
    };
    inst.plGuardContinue = () => inst.setState({ plScreen:'S16' });
    inst.plGuardCancel = () => inst.setState({ plScreen:'S13', plSheetOpen:false, plDetailUid:null, plEditUid:null, plEditMode:'menu', plPending:null, plReorderDraft:null });
    inst.plS16Back = () => inst.setState({ plScreen:'S13', plSheetOpen:false, plDetailUid:null, plEditUid:null, plEditMode:'menu', plReorderDraft:null });
    inst.plConfirmChange = () => {
      let didRemove=false;
      inst.updTrip((t,s) => {
        const p=s.plPending; const day=t.days[p.dayIdx];
        if (p.type==='remove'){ inst._lastRemoved = { tripId:t.id, dayIdx:p.dayIdx, idx:p.idx, stop:Object.assign({},day.stops[p.idx]) }; day.stops.splice(p.idx,1); didRemove=true; }
        else if (p.type==='reorder'){ day.stops.length=0; p.after.forEach(st=>day.stops.push(st)); }
        else {
          Object.assign(day.stops[p.idx], p.after);
          // Guard screen promises later stops get "pushed later" - actually re-sequence
          // them (same forward-only slot assignment draftGen uses) so no two stops in
          // the day ever end up sharing an identical time after a retime/edit confirm.
          let lastT = parseTimeStr(day.stops[p.idx].time);
          for (let i=p.idx+1; i<day.stops.length; i++){
            const st2 = day.stops[i];
            if (parseTimeStr(st2.time) <= lastT){
              const draftTimes = DATASET.config.draftTimes;
              const nextSlot = draftTimes.find(x=>parseTimeStr(x)>lastT);
              // No canonical slot left after lastT (it's already the day's last slot) -
              // push forward by a fixed 90-min gap instead of reusing an occupied time.
              st2.time = nextSlot || minutesToClock(lastT + 90);
            }
            lastT = parseTimeStr(st2.time);
          }
        }
        s.plReorderDraft=null; s.plScreen='S16done';
      });
      if (didRemove){
        inst.toast('Stop removed', ()=>{ const lr=inst._lastRemoved; if(!lr) return; inst.setState(st2=>{ const tt=st2.trips.find(x=>x.id===lr.tripId); if (tt && tt.days[lr.dayIdx]) tt.days[lr.dayIdx].stops.splice(lr.idx,0,lr.stop); return st2; }); inst._lastRemoved=null; inst.toast('Restored'); });
      }
    };
    inst.plBackToPlan = () => inst.setState({ plScreen:'S13', plSheetOpen:false, plDetailUid:null, plEditUid:null, plEditMode:'menu', plPending:null, plForm:null, plReorderDraft:null });
    inst.plStartTrip = () => { const t=inst.currentTrip(); if (t.status!=='active'){ inst.toast('Trip hasn’t started - see the plan on the overview'); return; } inst.setState({ view:'live', lvScreen:'today' }); };
    inst.plBackToOverview = () => inst.setState({ view:'overview', plSheetOpen:false, plDetailUid:null, plRulesOpen:false });
    inst.plFillDay = () => {
      const dest0=getDestination(inst.currentTrip().destKey); const used0=new Set(); inst.currentTrip().days.forEach(d=>d.stops.forEach(x=>used0.add(x.pid))); if (!dest0.places.some(p=>!used0.has(p.id))){ inst.toast('Every strong stop is already in your plan'); return; }
      inst.updTrip((t) => {
        const used=new Set(); t.days.forEach(d=>d.stops.forEach(x=>used.add(x.pid)));
        const dest=getDestination(t.destKey);
        const cand=dest.places.filter(p=>!used.has(p.id)).sort((a,b)=>b.suitability-a.suitability)[0] || dest.places.slice().sort((a,b)=>b.suitability-a.suitability)[0];
        const d=t.days[inst.state.plActiveDay]; const mult=(DATASET.config.budget[t.prefs.budget]||DATASET.config.budget.comfort).mult;
        d.stops.push({ uid:cand.id+'-fill'+Date.now(), pid:cand.id, name:cand.name, cat:cand.cat, photo:cand.photo, why:cand.why, hours:cand.hours, cost:(cand.fixedCost ? cand.cost : Math.round(cand.cost*mult)), tip:cand.tip, reach:cand.howToReach, time:DATASET.config.draftTimes[d.stops.length]||'7:30 PM', notes:'', fixedCost:cand.fixedCost||false, closedMonths:cand.closedMonths||null, seasonNote:cand.seasonNote||'' });
      });
    };

    // ============================================================
    //  GROUP flow (votes / veto-burns / resolve)
    // ============================================================
    inst.poll = () => pollFor(inst.currentDest());
    inst.grG = () => inst.currentTrip().group;
    inst.grEff = (id) => { const o=inst.poll().options.find(o=>o.id===id); const g=inst.grG(); return (o?o.base:0) + (g.myVote===id ? 1 : 0); };
    inst.grTotalVotes = () => inst.poll().options.reduce((a,o)=>a+inst.grEff(o.id),0);
    inst.grIsVetoed = (id) => !!inst.grG().vetoes[id];
    inst.grVetoUsedBy = (mid) => Object.values(inst.grG().vetoes).includes(mid);
    inst.grIsDeadlock = () => inst.poll().options.every(o=>inst.grIsVetoed(o.id));
    inst.grIsTie = () => { const [a,b]=inst.poll().options; return !inst.grIsDeadlock() && inst.grTotalVotes()>0 && inst.grEff(a.id)===inst.grEff(b.id); };
    inst.grPollStatus = () => { if (inst.grG().resolved) return 'RESOLVED'; if (inst.grIsDeadlock()) return 'DEADLOCK'; if (inst.grIsTie()) return 'TIE'; return 'VOTING_OPEN'; };
    inst.grStatusLabel = (code) => ({ RESOLVED:'RESOLVED', DEADLOCK:'VETO DEADLOCK', TIE:'TIE', VOTING_OPEN:'VOTING OPEN' })[code];
    inst.grVote = (id) => { if (inst.grG().resolved) return; inst.updTrip(t=>{ t.group.myVote = t.group.myVote===id ? null : id; }); };
    inst.grVeto = (id) => { const g=inst.grG(); if (g.resolved || inst.grIsVetoed(id) || inst.grVetoUsedBy('me')) return; inst.setState({ grVetoConfirm:id }); };
    inst.grConfirmVeto = () => { const id=inst.state.grVetoConfirm; if (!id || inst.grVetoUsedBy('me')){ inst.setState({ grVetoConfirm:null }); return; } inst.updTrip(t=>{ t.group.vetoes=Object.assign({}, t.group.vetoes, {[id]:'me'}); }); inst.setState({ grVetoConfirm:null }); inst.toast('Veto spent - burned for the whole trip'); };
    inst.grCancelVeto = () => inst.setState({ grVetoConfirm:null });
    inst.grFinish = (label, by) => { inst.updTrip(t=>{ t.group.resolved={ label, by }; }); inst.setState({ grResolveMode:null }); inst.toast('Decision locked · synced to group'); };
    inst.grAanyaVeto = () => { const un=inst.poll().options.filter(o=>!inst.grIsVetoed(o.id)); if (un.length===1){ inst.updTrip(t=>{ t.group.vetoes=Object.assign({}, t.group.vetoes, {[un[0].id]:'m2'}); }); inst.toast('Aanya vetoed '+un[0].label+' - deadlock'); } };

    // ---------- AM-3: manage member (leave / remove / change role) ----------
    inst.grIsRemoved = (id) => (inst.currentTrip().group.removed||[]).includes(id);
    inst.grRoleFor = (id, fallback) => (inst.currentTrip().group.roles||{})[id] || fallback;
    inst.grOpenMemberAction = (id) => inst.setState({ grMemberActionFor:id });
    inst.grCloseMemberAction = () => inst.setState({ grMemberActionFor:null });
    inst.grMakePlanner = (id) => {
      const name = MEMBERS.find(m=>m.id===id);
      inst.updTrip(t=>{ t.group.roles = Object.assign({}, t.group.roles, { [id]:'PLANNER · ADMIN' }); });
      inst.setState({ grMemberActionFor:null });
      inst.toast((name?name.name:'Member')+' is now a planner');
    };
    inst.grRemoveMember = (id) => {
      const name = MEMBERS.find(m=>m.id===id);
      inst.updTrip(t=>{
        t.group.removed = (t.group.removed||[]).concat([id]);
        const vetoes = Object.assign({}, t.group.vetoes);
        Object.keys(vetoes).forEach(optId=>{ if (vetoes[optId]===id) delete vetoes[optId]; });
        t.group.vetoes = vetoes;
      });
      inst.setState({ grMemberActionFor:null });
      inst.toast((name?name.name:'Member')+' removed - their vetoes & contributions freed');
    };
    inst.grLeaveTrip = () => {
      const t = inst.currentTrip();
      inst.setState(s=>({ trips: s.trips.filter(x=>x.id!==t.id), activeTripId: (s.trips.find(x=>x.id!==t.id)||{}).id||null, grMemberActionFor:null, view:'trips' }));
      inst.toast("You've left "+t.name);
    };

    // ============================================================
    //  LIVE flow
    // ============================================================
    inst.liveStops = () => { const t=inst.currentTrip(); return t.live.stops || liveStopsFromDay(t.days[0]); };
    inst.lvNextStopId = () => { const stops=inst.liveStops(); const ci=inst.currentTrip().live.checkins; const s=stops.find(s=>!ci[s.id]); return s ? s.id : null; };
    inst.lvAccept = () => {
      const dest=inst.currentDest(); const a=dest.alert; const sw=alertSwapStop(dest, inst.plMult());
      if (!inst.liveStops().some(s=>s.name.indexOf(a.swapOut)===0)){ inst.lvDismiss(); inst.toast("That stop isn't in today's plan - we'll flag it on the day"); return; }
      inst.updTrip(t => {
        const base = t.live.stops || liveStopsFromDay(t.days[0]);
        t.live.stops = base.map(st => st.name.indexOf(a.swapOut)===0
          ? { id:st.id, pin:st.pin, time:st.time, name:sw.name, cat:sw.cat, photo:sw.photo, why:sw.why, hours:sw.hours, cost:sw.cost, reach:sw.reach } : st);
        t.live.swapped = true;
      });
      inst.setState({ lvScreen:'today' });
      inst.toast('Re-planned live - synced to all ' + APP_COUNT);
    };
    inst.lvCheckin = (id) => { inst.updTrip(t=>{ t.live.checkins=Object.assign({}, t.live.checkins, {[id]:true}); }); inst.toast('Checked in - synced to all '+APP_COUNT); };
    inst.lvSetFeedback = (n) => inst.updTrip(t=>{ t.live.feedback=n; });
    inst.lvDismiss = () => { inst.updTrip(t=>{ t.live.dismissed=true; }); inst.setState({ lvScreen:'today' }); inst.toast('Kept the original plan'); };
    inst.lvReopen = () => inst.updTrip(t=>{ t.live.dismissed=false; });
    inst.lvArchive = () => { inst.updTrip(t=>{ t.live.archived=true; }); inst.toast('Archived - saved as a reusable template'); };
    inst.lvQueueCheckin = (id) => { inst.updTrip(t=>{ t.live.pending=Object.assign({}, t.live.pending, {[id]:true}); }); inst.toast("Saved - will sync when you're back online"); };
    inst.lvToggleOffline = () => {
      if (inst.state.lvOffline){
        const t=inst.currentTrip(); const pend=t.live.pending||{}; const n=Object.keys(pend).length;
        if (n){ inst.updTrip(tt=>{ tt.live.checkins=Object.assign({}, tt.live.checkins, pend); tt.live.pending={}; }); inst.toast('Back online - '+n+' check-in'+(n>1?'s':'')+' synced'); }
      }
      inst.setState(s=>({ lvOffline:!s.lvOffline, lvFoodOpen:false }));
    };
  }
};

// ---------- exit animations (ghost clones on unmount) ----------
// The dc-html framework removes <sc-if> subtrees synchronously, so sheets, toasts
// and backdrops have no way to animate out from CSS alone. A MutationObserver
// watches for those removals and plays a short WAAPI exit on a pointer-inert
// clone. One choke point covers every sheet's close path (backdrop tap, cancel
// buttons, action side-effects) with no per-sheet wiring.
(function(){
  if (typeof window === 'undefined' || window.__wandrExitAnim) return;
  window.__wandrExitAnim = true;
  if (typeof MutationObserver === 'undefined' || !Element.prototype.animate) return;

  var EASE_SHEET = 'cubic-bezier(0.32, 0.72, 0, 1)';
  function reduced(){ return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function styleOf(el){ return (el.getAttribute && el.getAttribute('style')) || ''; }
  function isSheet(el){ return el.getAttribute && el.getAttribute('role') === 'dialog' && /bottom:\s*0/.test(styleOf(el)); }
  function isToast(el){ return el.getAttribute && el.getAttribute('role') === 'status'; }
  function isBackdrop(el){ return el.getAttribute && el.getAttribute('aria-label') === 'Close' && /inset:\s*0/.test(styleOf(el)); }

  function animatePart(el, frames, ms, ease){
    var a = el.animate(frames, { duration: ms, easing: ease, fill: 'forwards' });
    return a.finished ? a.finished.catch(function(){}) : new Promise(function(res){ a.onfinish = a.oncancel = res; });
  }

  function ghost(removedEl, parent){
    if (!parent || !parent.isConnected) return;
    // Wait a frame: if the framework re-rendered an equivalent node in place
    // (sheet still open, subtree just churned), exiting a ghost would double it.
    requestAnimationFrame(function(){
      var sameKind = isToast(removedEl) ? '[role="status"]' : '[role="dialog"]';
      if (parent.querySelector && parent.querySelector(sameKind + ':not([data-wandr-ghost])')) return;
      var g = removedEl.cloneNode(true);
      g.setAttribute('data-wandr-ghost', '1');
      g.setAttribute('aria-hidden', 'true');
      g.style.pointerEvents = 'none';
      parent.appendChild(g);
      var waits = [];
      var parts = [g].concat([].slice.call(g.querySelectorAll('[role="dialog"],[role="status"],[aria-label="Close"]')));
      parts.forEach(function(p){
        p.style.animation = 'none';
        if (isSheet(p)) waits.push(animatePart(p, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], 220, EASE_SHEET));
        else if (isToast(p)) waits.push(animatePart(p, [{ opacity: 1, transform: 'translate(-50%,0)' }, { opacity: 0, transform: 'translate(-50%,14px)' }], 180, 'ease-out'));
        else if (isBackdrop(p)) waits.push(animatePart(p, [{ opacity: 1 }, { opacity: 0 }], 220, 'ease-out'));
      });
      if (!waits.length){ g.remove(); return; }
      var done = false;
      function cleanup(){ if (!done){ done = true; g.remove(); } }
      Promise.all(waits).then(cleanup);
      setTimeout(cleanup, 400); // safety net
    });
  }

  function containsExitTarget(el){
    if (isSheet(el) || isToast(el) || isBackdrop(el)) return true;
    return !!(el.querySelector && el.querySelector('[role="dialog"],[role="status"]'));
  }

  function start(){
    new MutationObserver(function(muts){
      if (reduced()) return;
      muts.forEach(function(m){
        [].forEach.call(m.removedNodes, function(n){
          if (n.nodeType !== 1 || n.getAttribute('data-wandr-ghost')) return;
          if (containsExitTarget(n)) ghost(n, m.target);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
