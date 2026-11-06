// Bot tự chơi: kiểm tra engine chạy hết Hồi I không lỗi. Chạy: node test/sim.mjs [số ván]
import * as G from '../js/game.js';
import { BUILDINGS } from '../js/data.js';

function autoAssign(s) {
  for (const c of G.alive(s)) if (c.job !== 'exp') c.job = null;
  const plots = [];
  for (const d in s.districts) if (s.districts[d].unlocked) s.districts[d].plots.forEach((p, i) => { if (p) plots.push({ d, i, p }); });
  const pri = (x) => (x.p.build ? 2.5 : { filter: 1, fishing: 2, hydro: 2, turbine: 1, decoder: 3, woodcut: 4, scrapyard: 5, medtent: 3, guard: 6, workshop: 5, herbs: 6, clinic: 3 }[x.p.b] ?? 9);
  plots.sort((a, b) => pri(a) - pri(b));
  const free = G.alive(s).filter((c) => G.canWork(s, c) && c.job !== 'exp');
  for (const x of plots) {
    const n = G.slotsOf(x.p);
    for (let k = 0; k < n && free.length; k++) G.assign(s, free.shift().id, x.d, x.i);
  }
}

function autoBuild(s) {
  const want = ['tent', 'decoder', 'woodcut', 'fishing', 'scrapyard', 'firepit', 'medtent', 'guard', 'treeline', 'herbs', 'workshop', 'hydro', 'solar', 'container', 'clinic'];
  for (const d of ['pump', 'harbor']) {
    const dist = s.districts[d];
    if (!dist.unlocked) continue;
    dist.plots.forEach((p, i) => {
      const sites = Object.values(s.districts).flatMap((x) => x.plots).filter((q) => q && q.build).length;
      if (p || sites >= 2) return;
      const opts = G.buildOptions(s, d);
      const has = (id) => G.countBuilt(s, id);
      const wantNow = ['filter', 'decoder', 'fishing', 'tent', 'firepit', 'scrapyard', 'woodcut', 'medtent', 'guard', 'workshop', 'hydro', 'solar', 'treeline', 'container', 'clinic', 'filter', 'fishing'];
      const id = wantNow.find((w) => { const o = opts.find((x) => x.id === w); if (!o || o.why) return false; if (w === 'tent') return G.compute(s).housing < G.compute(s).pop + 2; if (['filter', 'fishing'].includes(w)) return has(w) < 2; return has(w) < 1; });
      const opt = id && { id };
      if (opt) G.startBuild(s, d, i, opt.id);
    });
  }
  const tp = s.districts.pump.plots.findIndex((p) => p && p.b === 'turbine_broken' && !p.build);
  if (tp >= 0) G.startTurbineRepair(s, 'pump', tp);
  if (!s.districts.harbor.unlocked) G.unlockDistrict(s, 'harbor');
  if (!s.research.current) { const r = G.researchOptions(s).find((o) => !o.done && !o.locked); if (r) G.setResearch(s, r.id); }
  if (G.lawAvailable(s)) { const l = G.lawOptions(s).find((o) => !o.signed && ['storytelling', 'patrol'].includes(o.id)); if (l) G.signLaw(s, l.id); }
}

function autoExplore(s) {
  if (s.expeditions.length) return;
  const known = Object.keys(s.map).filter((k) => s.map[k].known && s.map[k].visits < 3);
  if (!known.length) return;
  const loc = known[G.ri(s, 0, known.length - 1)];
  const free = G.alive(s).filter((c) => G.canWork(s, c) && c.job !== 'exp').sort((a, b) => b.skills.scout - a.skills.scout);
  if (free.length > 6) G.sendExpedition(s, loc, free.slice(0, 2).map((c) => c.id));
}

function play(seed, verbose) {
  const s = G.newGame({ name: 'Bot', origin: ['engineer', 'doctor', 'soldier', 'merchant'][seed % 4], seed });
  let events = 0;
  for (let guard = 0; guard < 40 && !s.over; guard++) {
    autoBuild(s); autoAssign(s); autoExplore(s);
    // kiểm tra save/load giữa chừng
    const copy = G.importSave(G.exportSave(s));
    if (JSON.stringify(copy) !== JSON.stringify(s)) throw new Error('export/import lệch');
    const q = G.runDay(s);
    while (q.length) {
      const inst = q.shift();
      const view = G.presentEvent(s, inst);
      const ok = view.choices.filter((c) => !c.disabled);
      const ch = ok.length ? ok[G.ri(s, 0, ok.length - 1)] : view.choices[view.choices.length - 1];
      const r = G.resolveChoice(s, inst, ch.idx);
      if (verbose) console.log(`  [${s.day}] ${view.title} → ${ch.label}`);
      q.push(...r.follow);
      events++;
    }
    const sum = G.runNight(s);
    if (verbose) console.log(`Ngày ${sum.day}: dân ${sum.pop} HV ${sum.stats.hope} TT ${sum.stats.order} Nhiệt ${sum.stats.heat} | ${Object.entries(sum.res).map(([k, v]) => k + ':' + Math.round(v)).join(' ')} | ${sum.lines.join(' / ')}`);
  }
  const c = G.compute(s);
  return { seed, day: s.day, over: s.over?.type, pop: G.alive(s).length, hope: s.stats.hope, order: s.stats.order, heat: s.stats.heat, events, built: Object.values(s.districts).flatMap((d) => d.plots).filter(Boolean).map((p) => p.b).join(','), research: s.research.done.join(','), power: c.power.gen };
}

const n = +process.argv[2] || 1;
if (n === 1) console.log(play(7, true));
else for (let i = 1; i <= n; i++) console.log(JSON.stringify(play(i * 101, false)));
