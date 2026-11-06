// Kiểm tra chuỗi tu-bin → Nhiệt → sự kiện Tro đổi hướng → bão Tro
import * as G from '../js/game.js';
const s = G.newGame({ seed: 42 });
s.flags.tu_turbine = true;
s.research.done.push('turbine_repair', 'workshop', 'hydroponics', 'clinic');
Object.assign(s.res, { parts: 60, scrap: 200, wood: 200, food: 300, water: 300 });
console.log('repair', G.startTurbineRepair(s, 'pump', 3));
console.log('build', G.startBuild(s, 'pump', 5, 'workshop'), G.startBuild(s, 'pump', 6, 'hydro'), G.startBuild(s, 'pump', 7, 'clinic'));
const titles = [];
for (let d = 0; d < 28; d++) {
  for (const c of G.alive(s)) if (c.job !== 'exp') c.job = null;
  const free = G.alive(s).filter((c) => G.canWork(s, c));
  for (const [dd, i] of [['pump', 3], ['pump', 5], ['pump', 6], ['pump', 7], ['pump', 0], ['pump', 4]]) {
    const p = s.districts[dd].plots[i]; if (!p) continue;
    for (let k = 0; k < G.slotsOf(p) && free.length; k++) G.assign(s, free.shift().id, dd, i);
  }
  const q = G.runDay(s);
  while (q.length) { const inst = q.shift(); const v = G.presentEvent(s, inst); titles.push(s.day + ':' + v.title); const ch = v.choices.find((c) => !c.disabled && !/Tắt tu-bin/.test(c.label)) || v.choices[0]; const r = G.resolveChoice(s, inst, ch.idx); q.push(...r.follow); }
  const c = G.compute(s);
  const sum = G.runNight(s);
  console.log(`d${sum.day} gen ${c.power.gen}/${c.power.use} target ${c.heat.target} heat ${s.stats.heat} known ${!!s.flags.heat_known} | ${sum.lines.join(' / ')}`);
  if (s.over) { console.log('over', s.over); break; }
}
console.log(titles.join('\n'));
