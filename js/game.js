// Engine của game: trạng thái, luật tính toán, xử lý ngày/đêm, sự kiện, lưu game.
// Không đụng tới DOM, nên chạy được cả trong Node để kiểm thử.
import {
  BUILDINGS, TURBINE_REPAIR, RESEARCH, LAWS, DISTRICTS, LOCATIONS, ORIGINS,
  STORYTELLERS, TRAITS, NAMES, WISHES, SKILLS, RES,
} from './data.js';
import { STORY, EVENTS, SCENES } from './events.js';

export const SAVE_VERSION = 1;
export const ACT1_LAST_DAY = 30;

// ---------- Ngẫu nhiên có seed (mulberry32), trạng thái nằm trong save ----------
export function rand(s) {
  let t = (s.rngState = (s.rngState + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const ri = (s, a, b) => a + Math.floor(rand(s) * (b - a + 1));
export const chance = (s, p) => rand(s) < p;
export const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;

export function seasonOf(day) {
  const d = (day - 1) % 60;
  if (d < 20) return 'dry';
  if (d < 40) return 'rain';
  return 'ash';
}
export const SEASON_NAME = { dry: 'Mùa Khô', rain: 'Mùa Mưa', ash: 'Mùa Tro' };

// ---------- Cư dân ----------
const SKILL_KEYS = Object.keys(SKILLS);

export function makeCitizen(s, o = {}) {
  const gender = o.gender || (chance(s, 0.5) ? 'm' : 'f');
  const skills = {};
  for (const k of SKILL_KEYS) skills[k] = ri(s, 1, 4);
  for (let i = 0; i < 2; i++) skills[pick(s, SKILL_KEYS)] += ri(s, 2, 4);
  for (const k of SKILL_KEYS) skills[k] = clamp(skills[k], 0, 10);
  const traitKeys = Object.keys(TRAITS);
  const traits = [];
  const nT = chance(s, 0.6) ? 2 : 1;
  while (traits.length < nT) {
    const t = pick(s, traitKeys);
    const clash = (t === 'lazy' && traits.includes('hardworker')) || (t === 'hardworker' && traits.includes('lazy')) ||
      (t === 'optimist' && traits.includes('gloomy')) || (t === 'gloomy' && traits.includes('optimist'));
    if (!traits.includes(t) && !clash) traits.push(t);
  }
  const c = {
    id: 'c' + (s.nextId++),
    name: o.name || pick(s, NAMES[gender]),
    gender,
    age: o.age ?? ri(s, 17, 62),
    skills: Object.assign(skills, o.skills || {}),
    traits: o.traits || traits,
    health: o.health ?? ri(s, 75, 100),
    mood: o.mood ?? 55,
    ash: o.ash ?? ri(s, 0, 12),
    wish: o.wish || pick(s, WISHES),
    portrait: ri(s, 1, 999999),
    job: null,
    alive: true,
    special: o.special || null,
    joined: s.day,
  };
  // tránh trùng tên với người đang sống
  if (!o.name) {
    let tries = 0;
    while (s.citizens.some((x) => x.alive && x.name === c.name) && tries++ < 20) c.name = pick(s, NAMES[gender]);
  }
  s.citizens.push(c);
  return c;
}

export const alive = (s) => s.citizens.filter((c) => c.alive);
export const isChild = (c) => c.age < 14;
export function canWork(s, c) {
  if (!c.alive || isChild(c) || c.health < 30) return false;
  if (hasLaw(s, 'quarantine') && c.ash >= 60) return false;
  return true;
}
export const citizen = (s, id) => s.citizens.find((c) => c.id === id || c.special === id);
export const hasLaw = (s, id) => s.laws.includes(id);

// ---------- Ván mới ----------
export function newGame({ name = 'Người Giữ Lửa', origin = 'engineer', storyteller = 'ferry', seed } = {}) {
  const s = {
    version: SAVE_VERSION,
    seed: seed ?? Math.floor(Math.random() * 1e9),
    rngState: 0,
    day: 1,
    act: 1,
    player: { name, origin },
    storyteller,
    ironman: !!STORYTELLERS[storyteller]?.ironman,
    res: { water: 25, food: 45, scrap: 40, wood: 30, parts: 4, medicine: 5, memory: 2 },
    stats: { heat: 4, hope: 55, order: 50 },
    districts: {
      pump: { unlocked: true, plots: [
        { b: 'filter', hp: 100, on: true },
        { b: 'tent', hp: 90, on: true },
        { b: 'tent', hp: 85, on: true },
        { b: 'turbine_broken', hp: 60, on: true },
        { b: 'fishing', hp: 80, on: true },
        null, null, null,
      ] },
      harbor: { unlocked: false, clearing: null, plots: [null, null, null, null, null, null] },
    },
    citizens: [],
    expeditions: [],
    map: {},
    research: { done: [], current: null, progress: 0 },
    laws: [],
    lastLawDay: -99,
    flags: {},
    rep: { lantern: 0, steel: 0, ashborn: 0, nursery: 0, wolves: -20 },
    cooldowns: {},
    used: {},
    chronicle: [],
    codex: ['dem_tro', 'tram_bom'],
    nextId: 1,
    sandbox: false,
    over: null,
    stamp: Date.now(),
    playtime: 0,
  };
  s.rngState = s.seed >>> 0;
  const bonus = ORIGINS[origin]?.bonus || {};
  for (const k in bonus) s.res[k] += bonus[k];

  makeCitizen(s, { name: 'Má Tư', special: 'tu', gender: 'f', age: 62, traits: ['tough', 'nostalgic'],
    skills: { build: 7, craft: 7, farm: 3, med: 2, fight: 1, scout: 1, talk: 4, study: 4 }, wish: 'Muốn nghe tu-bin quay lại một lần nữa.' });
  makeCitizen(s, { name: 'Khang', special: 'khang', gender: 'm', age: 24, traits: ['brave', 'optimist'],
    skills: { build: 3, craft: 2, farm: 1, med: 1, fight: 5, scout: 8, talk: 5, study: 1 }, wish: 'Muốn tìm lại em gái tên Hoa.' });
  makeCitizen(s, { name: 'Bác sĩ Linh', special: 'linh', gender: 'f', age: 47, traits: ['gloomy'],
    skills: { build: 1, craft: 3, farm: 3, med: 8, fight: 1, scout: 2, talk: 4, study: 7 }, wish: 'Muốn được tha thứ, dù không nói vì sao.' });
  makeCitizen(s, { name: 'Tý', special: 'ty', gender: 'm', age: 9, traits: ['mystic'],
    skills: { build: 0, craft: 1, farm: 1, med: 0, fight: 0, scout: 2, talk: 2, study: 2 }, ash: 30, wish: 'Muốn ra ngoài khi Tro rơi.' });
  for (let i = 0; i < 8; i++) makeCitizen(s);
  // một cặp vợ chồng có sẵn
  const pair = s.citizens.filter((c) => !c.special).slice(0, 2);
  if (pair.length === 2) { pair[0].spouse = pair[1].id; pair[1].spouse = pair[0].id; }

  for (const id in LOCATIONS) s.map[id] = { known: !!LOCATIONS[id].known, visits: 0 };
  chron(s, `${name} dẫn 12 người đến Trạm Bơm Số 7.`);
  return s;
}

export function chron(s, text) {
  s.chronicle.push({ day: s.day, text });
  if (s.chronicle.length > 400) s.chronicle.splice(0, s.chronicle.length - 400);
}

// ---------- Công trình ----------
export function plotAt(s, d, i) { return s.districts[d].plots[i]; }
export const jobKey = (d, i) => `${d}:${i}`;
export function workersAt(s, d, i) {
  const k = jobKey(d, i);
  return s.citizens.filter((c) => c.alive && c.job === k);
}
export function slotsOf(plot) {
  if (!plot) return 0;
  if (plot.build) return 3;
  return BUILDINGS[plot.b]?.slots || 0;
}
export function researchDone(s, id) { return !id || s.research.done.includes(id); }

export function countBuilt(s, bid) {
  let n = 0;
  for (const d in s.districts) for (const p of s.districts[d].plots) {
    if (p && (p.b === bid || p.build?.target === bid)) n++;
  }
  return n;
}

export function canAfford(s, cost) { return Object.entries(cost || {}).every(([k, v]) => (s.res[k] || 0) >= v); }
export function pay(s, cost) { for (const [k, v] of Object.entries(cost || {})) s.res[k] -= v; }

export function buildOptions(s, d) {
  return Object.entries(BUILDINGS)
    .filter(([, b]) => !b.special)
    .map(([id, b]) => {
      let why = null;
      if (b.req && !researchDone(s, b.req)) why = `Cần nghiên cứu: ${RESEARCH[b.req].name}`;
      else if (b.max && countBuilt(s, id) >= b.max) why = 'Chỉ xây được 1';
      else if (!canAfford(s, b.cost)) why = 'Thiếu tài nguyên';
      return { id, b, why, hidden: b.req && !researchDone(s, b.req) && !isResearchVisible(s, b.req) };
    })
    .filter((o) => !o.hidden);
}

export function startBuild(s, d, i, bid) {
  const b = BUILDINGS[bid];
  const plot = plotAt(s, d, i);
  if (plot) return 'Ô đất đã có công trình.';
  if (b.req && !researchDone(s, b.req)) return 'Chưa nghiên cứu.';
  if (b.max && countBuilt(s, bid) >= b.max) return 'Đã đạt giới hạn.';
  if (!canAfford(s, b.cost)) return 'Thiếu tài nguyên.';
  pay(s, b.cost);
  s.districts[d].plots[i] = { b: 'site', hp: 100, on: true, build: { target: bid, progress: 0, need: b.work } };
  return null;
}

export function startTurbineRepair(s, d, i) {
  const plot = plotAt(s, d, i);
  if (!plot || plot.b !== 'turbine_broken' || plot.build) return 'Không sửa được.';
  if (!researchDone(s, TURBINE_REPAIR.req)) return 'Cần nghiên cứu Bản vẽ tu-bin.';
  if (!canAfford(s, TURBINE_REPAIR.cost)) return 'Thiếu tài nguyên.';
  pay(s, TURBINE_REPAIR.cost);
  plot.build = { target: 'turbine', progress: 0, need: TURBINE_REPAIR.work };
  return null;
}

export function demolish(s, d, i) {
  const plot = plotAt(s, d, i);
  if (!plot || BUILDINGS[plot.b]?.special) return 'Không dỡ được.';
  const def = BUILDINGS[plot.build ? plot.build.target : plot.b];
  for (const [k, v] of Object.entries(def.cost || {})) s.res[k] += Math.floor(v / 2);
  for (const c of workersAt(s, d, i)) c.job = null;
  s.districts[d].plots[i] = null;
  return null;
}

export function repairCost(plot) {
  const miss = 100 - plot.hp;
  return { scrap: Math.ceil(miss / 8), wood: Math.ceil(miss / 15) };
}
export function repair(s, d, i) {
  const plot = plotAt(s, d, i);
  if (!plot || plot.hp >= 100) return 'Không cần sửa.';
  const cost = repairCost(plot);
  if (!canAfford(s, cost)) return 'Thiếu tài nguyên.';
  pay(s, cost);
  plot.hp = 100;
  return null;
}
export function toggle(s, d, i) {
  const plot = plotAt(s, d, i);
  if (plot && !plot.build) plot.on = !plot.on;
}

export function assign(s, cid, d, i) {
  const c = citizen(s, cid);
  const plot = plotAt(s, d, i);
  if (!c || !plot || c.job === 'exp') return 'Không phân công được.';
  if (!canWork(s, c)) return `${c.name} không thể làm việc.`;
  if (workersAt(s, d, i).length >= slotsOf(plot)) return 'Đã đủ người.';
  c.job = jobKey(d, i);
  return null;
}
export function unassign(s, cid) {
  const c = citizen(s, cid);
  if (c && c.job !== 'exp') c.job = null;
}

export function unlockDistrict(s, d) {
  const dist = s.districts[d];
  const def = DISTRICTS[d];
  if (dist.unlocked || dist.clearing) return 'Đã mở hoặc đang dọn.';
  if (!canAfford(s, def.unlockCost)) return 'Thiếu tài nguyên.';
  pay(s, def.unlockCost);
  dist.clearing = { doneDay: s.day + def.unlockDays - 1 };
  return null;
}

// ---------- Tính toán tức thời ----------
function eff(s, c, skill) {
  let e = 0.6 + (c.skills[skill] || 0) * 0.08;
  if (c.traits.includes('lazy')) e *= 0.8;
  if (c.traits.includes('hardworker')) e *= 1.15;
  if (c.health < 50) e *= 0.6;
  if (hasLaw(s, 'long_shift')) e *= 1.25;
  return e;
}

export function activePlots(s) {
  const out = [];
  for (const d in s.districts) {
    const dist = s.districts[d];
    if (!dist.unlocked) continue;
    dist.plots.forEach((p, i) => { if (p && !p.build && p.hp > 0) out.push({ d, i, p, def: BUILDINGS[p.b] }); });
  }
  return out;
}

export function compute(s) {
  const season = seasonOf(s.day);
  const rain = season === 'rain';
  const plots = activePlots(s);
  const workingAt = (d, i) => workersAt(s, d, i).filter((c) => canWork(s, c));

  // Điện
  let gen = 0, use = 0;
  const genParts = [];
  for (const x of plots) {
    if (!x.p.on || !x.def.power) continue;
    if (x.def.power > 0) {
      let g = x.def.power;
      if (x.p.b === 'turbine') {
        if (workingAt(x.d, x.i).length === 0) { genParts.push({ name: 'Tu-bin (không người vận hành)', val: 0 }); continue; }
        g *= rain ? 1.4 : 1;
        if (x.p.hp < 50) g *= 0.7;
      }
      if (x.p.b === 'solar' && rain) g *= 0.6;
      g = r1(g);
      gen += g; genParts.push({ name: x.def.name, val: g });
    } else use += -x.def.power;
  }
  const ratio = use === 0 ? 1 : Math.min(1, gen / use);

  // Sản lượng dự kiến
  const prod = {}; const cons = {};
  const add = (o, k, v) => { o[k] = (o[k] || 0) + v; };
  let research = 0, memoryUse = 0;
  for (const x of plots) {
    if (!x.p.on) continue;
    const def = x.def;
    const ws = workingAt(x.d, x.i);
    let factor = 1;
    if (def.power < 0) factor *= ratio * (hasLaw(s, 'curfew') ? 0.7 : 1);
    if (def.produce) {
      let w = ws.reduce((a, c) => a + eff(s, c, def.skill), 0);
      if (def.consume) {
        const need = ws.length * def.consume.scrap;
        if (need > 0) add(cons, 'scrap', need * factor);
      }
      for (const [k, v] of Object.entries(def.produce)) {
        let amount = v * w * factor;
        if (x.d === 'harbor' && def.harborBonus) amount *= def.harborBonus;
        if (x.p.b === 'filter' && rain) amount *= 1.25;
        if (x.p.b === 'fishing' && season === 'dry') amount *= 0.85;
        if (x.p.hp < 50) amount *= 0.75;
        add(prod, k, amount);
      }
    }
    if (def.research) {
      for (const c of ws) { memoryUse += 1; research += (1 + c.skills.study * 0.15) * factor; }
    }
    if (def.upkeep) for (const [k, v] of Object.entries(def.upkeep)) add(cons, k, v);
  }
  if (hasLaw(s, 'storytelling') && countBuilt(s, 'firepit')) add(cons, 'wood', 1);

  // Nhiệt
  const heatParts = [];
  let heatSum = 0;
  const vent = researchDone(s, 'ventilation') ? 0.75 : 1;
  for (const x of plots) {
    if (!x.p.on || !x.def.heat) continue;
    let h = x.def.heat * vent;
    if (x.p.b === 'turbine' && workingAt(x.d, x.i).length === 0) continue;
    if (x.def.power < 0) h *= Math.max(0.3, ratio);
    h = r1(h);
    heatSum += h; heatParts.push({ name: x.def.name, val: h });
  }
  const pop = alive(s).length;
  const popHeat = r1(pop / 6);
  heatSum += popHeat; heatParts.push({ name: `Thân nhiệt ${pop} người`, val: popHeat });
  let cool = 0;
  for (const x of plots) if (x.def.cooling) { cool += x.def.cooling; heatParts.push({ name: x.def.name, val: -x.def.cooling }); }
  if (hasLaw(s, 'curfew')) { cool += 12; heatParts.push({ name: 'Giờ Tắt Đèn', val: -12 }); }
  const mult = season === 'ash' ? 1.5 : rain ? 0.85 : 1;
  const heatTarget = clamp(Math.round((heatSum - cool) * mult), 0, 100);

  // Dân số, nhà ở, phòng thủ
  let housing = 0;
  for (const x of plots) housing += x.def.housing || 0;
  let defense = 2;
  for (const x of plots) {
    if (x.def.defense && x.p.on) defense += workingAt(x.d, x.i).reduce((a, c) => a + x.def.defense * eff(s, c, 'fight'), 0);
  }
  if (hasLaw(s, 'patrol')) defense += 4;
  if (s.player.origin === 'soldier') defense += 4;
  if (s.flags.wolves_joined) defense += 3;

  let foodNeed = 0;
  for (const c of alive(s)) foodNeed += (c.traits.includes('glutton') ? 1.5 : 1) * (isChild(c) ? 0.6 : 1);
  if (hasLaw(s, 'ration')) foodNeed *= 0.75;

  return {
    season, power: { gen: r1(gen), use, ratio, genParts },
    heat: { target: heatTarget, parts: heatParts, mult },
    prod, cons, research: r1(research), memoryUse,
    pop, housing, defense: r1(defense),
    need: { food: r1(foodNeed), water: pop },
  };
}

export function heatTier(h) { return h <= 20 ? 0 : h <= 45 ? 1 : h <= 70 ? 2 : 3; }
export const HEAT_TIER_NAME = ['Lạnh', 'Ấm', 'Nóng', 'Rực'];

// ---------- Nghiên cứu, luật, thám hiểm ----------
export function isResearchVisible(s, id) {
  const r = RESEARCH[id];
  if (!r) return false;
  if (r.needFlag && !s.flags[r.needFlag]) return false;
  if (id === 'turbine_repair' && !s.flags.tu_turbine) return false;
  return true;
}
export function researchOptions(s) {
  return Object.entries(RESEARCH).filter(([id]) => isResearchVisible(s, id)).map(([id, r]) => ({
    id, r, done: s.research.done.includes(id), locked: r.after && !s.research.done.includes(r.after),
  }));
}
export function setResearch(s, id) {
  const r = RESEARCH[id];
  if (!r || s.research.done.includes(id) || (r.after && !s.research.done.includes(r.after))) return 'Không chọn được.';
  if (s.research.current !== id) { s.research.current = id; s.research.progress = 0; }
  return null;
}

export function lawAvailable(s) { return s.day >= 8 && s.day - s.lastLawDay >= 10; }
export function lawOptions(s) {
  return Object.entries(LAWS).filter(([, l]) => !l.needFlag || s.flags[l.needFlag]).map(([id, l]) => ({ id, l, signed: s.laws.includes(id) }));
}
export function signLaw(s, id) {
  if (!lawAvailable(s)) return 'Chưa thể ban hành luật mới.';
  if (s.laws.includes(id)) return 'Luật đã có hiệu lực.';
  s.laws.push(id);
  s.lastLawDay = s.day;
  if (id === 'patrol') s.stats.order = clamp(s.stats.order + 5, 0, 100);
  if (id === 'ration') s.stats.hope = clamp(s.stats.hope - 3, 0, 100);
  chron(s, `Ban hành luật: ${LAWS[id].name}.`);
  return null;
}

export function expeditionCost(locId, n) { return { food: LOCATIONS[locId].dist * n }; }
export function sendExpedition(s, locId, ids) {
  const loc = LOCATIONS[locId];
  if (!loc || !s.map[locId]?.known) return 'Chưa biết địa điểm này.';
  if (s.expeditions.some((e) => e.loc === locId)) return 'Đã có đội đang ở đó.';
  if (!ids.length || ids.length > 4) return 'Đội cần 1–4 người.';
  const team = ids.map((id) => citizen(s, id));
  if (team.some((c) => !c || !canWork(s, c) || c.job === 'exp')) return 'Có người không thể đi.';
  const cost = expeditionCost(locId, ids.length);
  if (!canAfford(s, cost)) return 'Không đủ thực phẩm mang theo.';
  pay(s, cost);
  for (const c of team) c.job = 'exp';
  s.expeditions.push({ loc: locId, team: ids, returnDay: s.day + loc.dist - 1, left: s.day });
  return null;
}

// ---------- API cho sự kiện ----------
export function api(s, ctx = {}) {
  const g = {
    s, ctx,
    get day() { return s.day; },
    get season() { return seasonOf(s.day); },
    rand: () => rand(s), ri: (a, b) => ri(s, a, b), chance: (p) => chance(s, p), pick: (a) => pick(s, a),
    res(k, n) {
      const before = s.res[k];
      s.res[k] = Math.max(0, r1(s.res[k] + n));
      return s.res[k] - before;
    },
    has: (cost) => canAfford(s, cost),
    pay: (cost) => pay(s, cost),
    hope: (n) => { s.stats.hope = clamp(s.stats.hope + n, 0, 100); },
    order: (n) => { s.stats.order = clamp(s.stats.order + n, 0, 100); },
    rep: (f, n) => { s.rep[f] = clamp((s.rep[f] || 0) + n, -100, 100); },
    flag: (k, v = true) => { s.flags[k] = v; },
    f: (k) => s.flags[k],
    alive: () => alive(s),
    adults: () => alive(s).filter((c) => !isChild(c)),
    workers: () => alive(s).filter((c) => canWork(s, c) && c.job !== 'exp'),
    cit: (id) => citizen(s, id),
    one: (filter = () => true) => {
      const list = alive(s).filter((c) => !isChild(c) && c.job !== 'exp').filter(filter);
      return list.length ? pick(s, list) : null;
    },
    addCitizen: (o) => makeCitizen(s, o),
    hurt: (c, n) => { c.health = clamp(c.health - n, 0, 100); },
    heal: (c, n) => { c.health = clamp(c.health + n, 0, 100); },
    ash: (c, n) => { c.ash = clamp(c.ash + (c.traits.includes('tough') && n > 0 ? n * 0.7 : n), 0, 100); },
    mood: (c, n) => { c.mood = clamp(c.mood + n, 0, 100); },
    moodAll: (n) => { for (const c of alive(s)) c.mood = clamp(c.mood + n, 0, 100); },
    kill: (c, cause) => kill(s, c, cause),
    leave: (c, why) => leave(s, c, why),
    chron: (t) => chron(s, t),
    reveal: (id) => { if (s.map[id] && !s.map[id].known) { s.map[id].known = true; return true; } return false; },
    codex: (id) => { if (!s.codex.includes(id)) s.codex.push(id); },
    best: (skill, list) => {
      const team = list || alive(s).filter((c) => !isChild(c) && c.job !== 'exp');
      let b = null;
      for (const c of team) if (!b || (c.skills[skill] || 0) > (b.skills[skill] || 0)) b = c;
      return b;
    },
    team: () => (ctx.team || []).map((id) => citizen(s, id)).filter((c) => c && c.alive),
    compute: () => compute(s),
    queue: (id, c2 = {}) => { s._queue = s._queue || []; s._queue.push({ id, kind: 'random', ctx: c2 }); },
  };
  g.check = (skill, base, who) => {
    const c = who || g.best(skill, ctx.team ? g.team() : undefined);
    let lvl = c ? c.skills[skill] || 0 : 0;
    if (c?.traits.includes('brave') && (skill === 'fight' || skill === 'scout')) lvl += 2;
    const p = clamp(base + lvl * 8, 5, 95);
    return { ok: chance(s, p / 100), p, who: c };
  };
  return g;
}

export function kill(s, c, cause = 'qua đời') {
  if (!c || !c.alive) return;
  c.alive = false; c.job = null; c.died = s.day; c.cause = cause;
  chron(s, `${c.name} ${cause}.`);
  for (const o of alive(s)) o.mood = clamp(o.mood - (o.spouse === c.id ? 30 : 8), 0, 100);
  if (hasLaw(s, 'river_funeral') && s.res.wood >= 3) {
    s.res.wood -= 3; s.stats.hope = clamp(s.stats.hope + 2, 0, 100);
  } else s.stats.hope = clamp(s.stats.hope - 4, 0, 100);
}
export function leave(s, c, why = 'rời đi trong đêm') {
  if (!c || !c.alive) return;
  c.alive = false; c.job = null; c.left = s.day;
  chron(s, `${c.name} ${why}.`);
  s.stats.hope = clamp(s.stats.hope - 2, 0, 100);
}

// ---------- Sự kiện ----------
const ALL_EVENTS = Object.fromEntries([...STORY, ...EVENTS].map((e) => [e.id, e]));

function evDef(inst) {
  if (inst.kind === 'scene') return SCENES[inst.ctx.loc].find((x) => x.id === inst.id);
  return ALL_EVENTS[inst.id];
}

export function presentEvent(s, inst) {
  const def = evDef(inst);
  const g = api(s, inst.ctx);
  const val = (v) => (typeof v === 'function' ? v(g, inst.ctx) : v);
  const choices = (def.choices || [{ label: 'Tiếp tục' }])
    .map((ch, idx) => ({ ch, idx }))
    .filter(({ ch }) => !ch.show || ch.show(g, inst.ctx))
    .map(({ ch, idx }) => {
      let disabled = null;
      if (ch.cost && !canAfford(s, ch.cost)) disabled = 'Thiếu tài nguyên';
      if (!disabled && ch.can) { const r = ch.can(g, inst.ctx); if (r !== true) disabled = r || 'Không thể'; }
      let hint = ch.hint ? val(ch.hint) : '';
      if (ch.check) {
        const who = ch.check.who ? citizen(s, ch.check.who) : g.best(ch.check.skill, inst.ctx.team ? g.team() : undefined);
        let lvl = who ? who.skills[ch.check.skill] : 0;
        if (who?.traits.includes('brave') && (ch.check.skill === 'fight' || ch.check.skill === 'scout')) lvl += 2;
        const p = clamp(ch.check.base + lvl * 8, 5, 95);
        hint = `[${SKILLS[ch.check.skill]} ${lvl}${who ? ' · ' + who.name : ''}] ${p}%` + (hint ? ' · ' + hint : '');
      }
      if (ch.cost) hint = costText(ch.cost) + (hint ? ' · ' + hint : '');
      return { idx, label: val(ch.label), hint, disabled };
    });
  return { title: val(def.title), art: val(def.art) || 'ruins', text: val(def.text), choices, kind: inst.kind };
}

export function costText(cost) {
  return Object.entries(cost).map(([k, v]) => `-${v} ${RES[k]?.name || k}`).join(', ');
}

export function resolveChoice(s, inst, idx) {
  const def = evDef(inst);
  const g = api(s, inst.ctx);
  const ch = (def.choices || [{ label: 'Tiếp tục' }])[idx];
  let out = '';
  if (ch.cost) pay(s, ch.cost);
  if (ch.check) {
    const who = ch.check.who ? citizen(s, ch.check.who) : undefined;
    const r = g.check(ch.check.skill, ch.check.base, who);
    inst.ctx.lastCheck = r;
    out = (r.ok ? ch.ok : ch.fail)?.(g, inst.ctx) || '';
  } else if (ch.run) out = ch.run(g, inst.ctx) || '';
  if (inst.kind === 'scene') out = [out, finishExpedition(s, inst.ctx)].filter(Boolean).join('\n\n');
  const follow = s._queue || [];
  delete s._queue;
  return { text: out, follow };
}

function finishExpedition(s, ctx) {
  const ex = s.expeditions.find((e) => e.loc === ctx.loc);
  if (!ex) return '';
  s.expeditions = s.expeditions.filter((e) => e !== ex);
  const loc = LOCATIONS[ctx.loc];
  const m = s.map[ctx.loc];
  const deplete = Math.max(0.3, 1 - m.visits * 0.2);
  m.visits++;
  const mult = (ctx.mult ?? 1) * deplete;
  const got = [];
  if (mult > 0) {
    for (const [k, [a, b]] of Object.entries(loc.loot)) {
      const n = Math.round(ri(s, a, b) * mult);
      if (n > 0) { s.res[k] += n; got.push(`+${n} ${RES[k].name}`); }
    }
  }
  const back = [];
  for (const id of ex.team) {
    const c = citizen(s, id);
    if (c && c.alive) { c.job = null; back.push(c.name); }
  }
  const lines = [];
  if (got.length) lines.push(`Mang về: ${got.join(', ')}.`); else lines.push('Đội về tay không.');
  if (back.length) lines.push(`${back.join(', ')} đã về trạm.`);
  if (m.visits >= 3) lines.push(`${loc.name} đã bị vét gần hết.`);
  chron(s, `Đội thám hiểm về từ ${loc.name}. ${got.join(', ') || 'Không thu được gì'}.`);
  return lines.join(' ');
}

function eligible(s, def, g, story = false) {
  if ((story || def.once) && s.used[def.id]) return false;
  if (s.cooldowns[def.id] && s.cooldowns[def.id] > s.day) return false;
  if (def.minDay && s.day < def.minDay) return false;
  if (def.day !== undefined && s.day !== def.day) return false;
  if (def.when && !def.when(g)) return false;
  return true;
}

function prepareInst(s, def, kind) {
  const ctx = {};
  const g = api(s, ctx);
  if (def.prepare && def.prepare(g, ctx) === false) return null;
  s.used[def.id] = (s.used[def.id] || 0) + 1;
  if (def.cooldown) s.cooldowns[def.id] = s.day + def.cooldown;
  return { id: def.id, kind, ctx };
}

// ---------- Một ngày ----------
// Pha ban ngày: sản xuất, xây, nghiên cứu, thám hiểm. Trả về danh sách sự kiện hoàng hôn.
export function runDay(s) {
  const c = compute(s);
  const report = [];
  s._report = report;
  s._calc = c;

  // tiêu hao và sản lượng
  for (const [k, v] of Object.entries(c.cons)) {
    if (k === 'scrap') continue; // xưởng tự giới hạn bên dưới
    s.res[k] = Math.max(0, r1(s.res[k] - v));
  }
  let scrapScale = 1;
  if (c.cons.scrap) { scrapScale = Math.min(1, s.res.scrap / c.cons.scrap); s.res.scrap = r1(s.res.scrap - c.cons.scrap * scrapScale); }
  for (const [k, v] of Object.entries(c.prod)) {
    const amount = k === 'parts' ? v * scrapScale : v;
    s.res[k] = r1(s.res[k] + amount);
  }

  // xây dựng
  for (const d in s.districts) {
    s.districts[d].plots.forEach((p, i) => {
      if (!p || !p.build) return;
      const ws = workersAt(s, d, i).filter((x) => canWork(s, x));
      if (!ws.length) return;
      let pts = ws.reduce((a, x) => a + eff(s, x, 'build'), 0);
      if (s.player.origin === 'engineer') pts *= 1.15;
      p.build.progress = r1(p.build.progress + pts);
      if (p.build.progress >= p.build.need) {
        const target = p.build.target;
        p.b = target; p.build = null; p.hp = 100; p.on = true;
        const slots = BUILDINGS[target].slots || 0;
        ws.slice(slots).forEach((x) => { x.job = null; });
        report.push(`Hoàn thành: ${BUILDINGS[target].name}.`);
        chron(s, `Xây xong ${BUILDINGS[target].name} ở ${DISTRICTS[d].name}.`);
        if (target === 'turbine') { s.flags.turbine_fixed = s.day; }
      }
    });
  }

  // nghiên cứu
  if (c.research > 0) {
    const use = Math.min(c.memoryUse, s.res.memory);
    const pts = c.memoryUse ? c.research * (use / c.memoryUse) : 0;
    s.res.memory = r1(s.res.memory - use);
    const cur = s.research.current;
    if (cur && pts > 0) {
      s.research.progress = r1(s.research.progress + pts);
      if (s.research.progress >= RESEARCH[cur].cost) {
        s.research.done.push(cur);
        report.push(`Nghiên cứu xong: ${RESEARCH[cur].name}.`);
        chron(s, `Giải mã xong: ${RESEARCH[cur].name}.`);
        s.research.current = null; s.research.progress = 0;
      }
    } else if (!cur && use > 0) {
      // chưa chọn đề tài: hoàn lại Ký Ức
      s.res.memory += use;
    }
  }

  // tu-bin chạy lần đầu
  if (c.power.gen > 0 && !s.flags.turbine_running && countBuilt(s, 'turbine')) s.flags.turbine_running = s.day;

  // mở khu
  for (const d in s.districts) {
    const dist = s.districts[d];
    if (dist.clearing && dist.clearing.doneDay <= s.day) {
      dist.unlocked = true; dist.clearing = null;
      report.push(`Đã dọn xong ${DISTRICTS[d].name}.`);
      chron(s, `Dọn xong ${DISTRICTS[d].name}. Thành phố rộng thêm.`);
    }
  }

  // sự kiện hoàng hôn
  const queue = [];
  const g = api(s);
  for (const def of STORY) {
    if (eligible(s, def, g, true)) { const inst = prepareInst(s, def, 'story'); if (inst) queue.push(inst); }
  }
  for (const ex of s.expeditions) {
    if (ex.returnDay <= s.day) {
      const pool = SCENES[ex.loc];
      const last = s.map[ex.loc].lastScene;
      const options = pool.filter((x) => x.id !== last && (!x.when || x.when(api(s, { team: ex.team, loc: ex.loc }))));
      const sc = pick(s, options.length ? options : pool);
      s.map[ex.loc].lastScene = sc.id;
      queue.push({ id: sc.id, kind: 'scene', ctx: { loc: ex.loc, team: ex.team.slice(), mult: 1 } });
    }
  }
  if (s.day >= 2 && !s.over) {
    const threat = STORYTELLERS[s.storyteller]?.threat || 1;
    const roll = rand(s);
    let n = roll < 0.12 * threat ? 2 : roll < 0.62 ? 1 : 0;
    if (queue.some((q) => q.kind === 'story')) n = Math.max(0, n - 1);
    for (let k = 0; k < n; k++) {
      const pool = EVENTS.filter((e) => eligible(s, e, g));
      const total = pool.reduce((a, e) => a + (typeof e.weight === 'function' ? e.weight(g) : e.weight ?? 5), 0);
      if (!total) break;
      let x = rand(s) * total;
      for (const e of pool) {
        x -= typeof e.weight === 'function' ? e.weight(g) : e.weight ?? 5;
        if (x <= 0) { const inst = prepareInst(s, e, 'random'); if (inst) queue.push(inst); break; }
      }
    }
  }
  return queue;
}

// Pha đêm: ăn uống, sức khỏe, tinh thần, mối đe dọa. Trả về các dòng tóm tắt.
export function runNight(s) {
  const report = s._report || [];
  const c = compute(s);
  const people = alive(s);
  const threat = STORYTELLERS[s.storyteller]?.threat || 1;

  // ăn uống
  const foodRatio = c.need.food ? Math.min(1, s.res.food / c.need.food) : 1;
  const waterRatio = c.need.water ? Math.min(1, s.res.water / c.need.water) : 1;
  const foodOk = foodRatio >= 0.999, waterOk = waterRatio >= 0.999;
  const fMiss = 1 - foodRatio, wMiss = 1 - waterRatio;
  s.res.food = r1(Math.max(0, s.res.food - c.need.food));
  s.res.water = r1(Math.max(0, s.res.water - c.need.water));
  if (!foodOk) { report.push(`Chỉ đủ ${Math.round(foodRatio * 100)}% khẩu phần ăn. Mọi người đi ngủ với cái bụng đói.`); s.stats.hope = clamp(s.stats.hope - 3 * fMiss, 0, 100); }
  if (!waterOk) { report.push(`Chỉ đủ ${Math.round(waterRatio * 100)}% nước sạch. Có người phải uống nước sông.`); s.stats.hope = clamp(s.stats.hope - 3 * wMiss, 0, 100); }

  // nhà ở
  const homeless = Math.max(0, people.length - c.housing);
  const sorted = [...people].sort((a, b) => b.joined - a.joined || (a.id < b.id ? 1 : -1));
  const homelessSet = new Set(sorted.slice(0, homeless).map((x) => x.id));
  if (homeless > 0) report.push(`${homeless} người ngủ ngoài trời.`);

  const firepit = activePlots(s).some((x) => x.p.b === 'firepit' && x.p.on) && s.res.wood > 0;
  const storytellers = people.filter((x) => x.traits.includes('storyteller')).length;
  const powered = c.power.gen > 0;

  // chăm sóc y tế
  let capacity = 0;
  let clinicCap = 0;
  for (const x of activePlots(s)) {
    if (!x.def.heal || !x.p.on) continue;
    const ws = workersAt(s, x.d, x.i).filter((w) => canWork(s, w));
    for (const w of ws) {
      const n = x.def.heal;
      capacity += n;
      if (x.def.ashCure && c.power.ratio > 0) clinicCap += n;
      w._medSkill = w.skills.med;
    }
  }
  const patients = people.filter((p) => p.health < 75 || (clinicCap && p.ash >= 40)).sort((a, b) => a.health - b.health);
  const docMult = s.player.origin === 'doctor' ? 1.3 : 1;
  let usedMed = 0;
  for (const p of patients.slice(0, capacity)) {
    let amt = 10 * docMult;
    if (s.res.medicine >= 1) { s.res.medicine -= 1; usedMed++; } else amt *= 0.5;
    p.health = clamp(p.health + amt, 0, 100);
    if (clinicCap > 0) { p.ash = clamp(p.ash - 4, 0, 100); clinicCap--; }
  }
  if (usedMed) report.push(`Dùng ${usedMed} Thuốc chữa bệnh.`);

  // từng người
  const quarantine = hasLaw(s, 'quarantine');
  const infected = people.filter((p) => p.ash >= 60);
  for (const p of people) {
    if (foodOk && waterOk) p.health = clamp(p.health + (p.traits.includes('tough') ? 3 : 1.5), 0, 100);
    p.health -= 8 * fMiss + 9 * wMiss;
    if (homelessSet.has(p.id)) p.health -= 1;
    if (hasLaw(s, 'long_shift') && p.job && p.job !== 'exp') p.health -= 1;
    if (p.ash >= 80) p.health -= 4;
    if (p.job && p.job !== 'exp') {
      const [d, i] = p.job.split(':');
      const pl = s.districts[d]?.plots[+i];
      if (pl && BUILDINGS[pl.b]?.ashRisk) p.ash = clamp(p.ash + BUILDINGS[pl.b].ashRisk * (p.traits.includes('tough') ? 0.5 : 1), 0, 100);
    }
    if (!quarantine && infected.length && !infected.includes(p) && chance(s, 0.12)) p.ash = clamp(p.ash + 2, 0, 100);
    if (p.special === 'ty') p.ash = clamp(p.ash + 0.5, 0, 60);
    p.health = clamp(p.health, 0, 100);

    let target = 50 + (s.stats.hope - 50) / 4;
    if (p.traits.includes('optimist')) target += 6;
    if (p.traits.includes('gloomy')) target -= 6;
    if (firepit) target += Math.min(10, 6 + storytellers * 2);
    if (homelessSet.has(p.id)) target -= p.traits.includes('light_sleeper') ? 17 : 12;
    target -= 14 * fMiss + 12 * wMiss;
    if (hasLaw(s, 'long_shift')) target -= 4;
    if (hasLaw(s, 'ration')) target -= 5;
    if (hasLaw(s, 'patrol')) target -= 2;
    if (p.traits.includes('nostalgic')) target += powered ? 5 : 0;
    if (p.traits.includes('nostalgic') && hasLaw(s, 'curfew')) target -= 5;
    if (p.health < 40) target -= 10;
    p.mood = clamp(p.mood + (target - p.mood) * 0.35, 0, 100);
  }

  // Hy Vọng, Trật Tự
  const avgMood = people.reduce((a, p) => a + p.mood, 0) / Math.max(1, people.length);
  let dh = (avgMood - 50) / 18;
  if (hasLaw(s, 'storytelling') && firepit) dh += 1;
  if (quarantine) dh -= 0.5;
  s.stats.hope = clamp(r1(s.stats.hope + dh), 0, 100);
  const idle = people.filter((p) => canWork(s, p) && !p.job).length;
  let dor = (50 - s.stats.order) * 0.03;
  const guards = activePlots(s).filter((x) => x.def.defense).reduce((a, x) => a + workersAt(s, x.d, x.i).length, 0);
  dor += guards * 0.3;
  if (hasLaw(s, 'patrol')) dor += 0.5;
  if (idle > 3) dor -= 0.4;
  dor -= 1.5 * Math.max(fMiss, wMiss);
  s.stats.order = clamp(r1(s.stats.order + dor), 0, 100);

  // Nhiệt dịch dần về mục tiêu
  s.stats.heat = clamp(Math.round(s.stats.heat + (c.heat.target - s.stats.heat) * 0.5), 0, 100);
  const tier = heatTier(s.stats.heat);
  const plots = activePlots(s);
  const damage = (x, n) => { x.p.hp = clamp(x.p.hp - n, 0, 100); };

  if (s.day >= 3) {
    if (tier >= 1) {
      let hit = 0;
      for (const x of plots) if (chance(s, 0.3)) { damage(x, ri(s, 1, 4)); hit++; }
      if (hit >= 3 && s.flags.heat_known) report.push('Tro rơi lất phất. Vài mái nhà bám một lớp bụi xám.');
    }
    if (tier >= 2 && chance(s, (tier === 3 ? 0.5 : 0.22) * threat)) {
      const n = ri(s, 2, 3);
      for (let k = 0; k < n && plots.length; k++) damage(pick(s, plots), ri(s, 10, 25));
      for (let k = 0; k < 2 && people.length; k++) { const v = pick(s, people); v.ash = clamp(v.ash + ri(s, 8, 18), 0, 100); }
      report.push('BÃO TRO. Gió xám quất qua trạm suốt đêm. Công trình hư hại, có người bị nhiễm Tro.');
      chron(s, 'Một trận Bão Tro quét qua thành phố.');
    }
    if (tier >= 2 && chance(s, 0.12 * threat)) {
      const str = 6 + s.stats.heat / 8 + ri(s, 0, 3);
      const def = c.defense * (0.8 + rand(s) * 0.4);
      if (def >= str) {
        report.push('Một Hình Nhân Tro lừng lững bò về phía tu-bin. Lính gác dùng lửa và nước đẩy lùi nó.');
        s.stats.order = clamp(s.stats.order + 2, 0, 100);
      } else {
        const hot = plots.filter((x) => x.def.heat >= 5);
        if (hot.length) damage(pick(s, hot), 30);
        const v = people.length ? pick(s, people.filter((p) => !isChild(p))) : null;
        if (v) { v.health = clamp(v.health - 30, 0, 100); v.ash = clamp(v.ash + 15, 0, 100); }
        report.push(`Một Hình Nhân Tro tràn vào trạm, cào nát một công trình nóng${v ? ` và làm ${v.name} bị thương` : ''}.`);
        chron(s, 'Hình Nhân Tro tấn công.');
      }
    }
    if (tier === 3) { for (const x of plots) if (chance(s, 0.5)) damage(x, 6); report.push('Tổ Tro mọc trong các khe tường, ăn mòn mọi thứ.'); }
  }

  // Bầy Sói
  if (s.day >= 8 && !s.flags.wolves_joined && !(s.flags.wolves_truce > s.day) && chance(s, 0.05 * threat)) {
    const str = 5 + s.day / 3 + ri(s, 0, 4);
    const def = c.defense * (0.8 + rand(s) * 0.4);
    s.codex.includes('bay_soi') || s.codex.push('bay_soi');
    if (def >= str) {
      report.push('Xuồng máy của Bầy Sói Kênh áp sát trong đêm, nhưng tiếng súng và đuốc trên trạm gác khiến chúng quay đầu.');
      s.stats.order = clamp(s.stats.order + 3, 0, 100); s.stats.hope = clamp(s.stats.hope + 2, 0, 100);
      chron(s, 'Đẩy lùi Bầy Sói Kênh.');
    } else {
      const lf = Math.round(s.res.food * 0.25), ls = Math.round(s.res.scrap * 0.25);
      s.res.food -= lf; s.res.scrap -= ls;
      const v = people.filter((p) => !isChild(p));
      for (let k = 0; k < 2 && v.length; k++) { const x = pick(s, v); x.health = clamp(x.health - 25, 0, 100); }
      s.stats.order = clamp(s.stats.order - 5, 0, 100);
      report.push(`Bầy Sói Kênh đột kích. Chúng cướp ${lf} Thực phẩm, ${ls} Phế liệu và đánh bị thương vài người.`);
      chron(s, 'Bầy Sói Kênh cướp trạm.');
    }
  }

  // lũ ở Bến Cảng
  if (seasonOf(s.day) === 'rain' && s.districts.harbor.unlocked && !s.flags.levee) {
    let hit = 0;
    for (const x of plots) if (x.d === 'harbor' && chance(s, 0.25)) { damage(x, ri(s, 5, 12)); hit++; }
    if (hit) report.push('Nước sông dâng, Bến Cảng ngập lênh láng.');
  }

  // công trình sụp
  for (const x of plots) {
    if (x.p.hp <= 0) {
      for (const w of workersAt(s, x.d, x.i)) w.job = null;
      s.districts[x.d].plots[x.i] = x.p.b === 'turbine' ? { b: 'turbine_broken', hp: 30, on: true } : null;
      report.push(`${x.def.name} đã sụp đổ.`);
      chron(s, `${x.def.name} sụp đổ.`);
    }
  }

  // chết, rời đi
  for (const p of alive(s)) {
    if (p.ash >= 100) kill(s, p, 'kết tinh thành đá trong giấc ngủ');
    else if (p.health <= 0) kill(s, p, !foodOk ? 'chết vì đói' : 'qua đời vì bệnh tật');
  }
  if (s.stats.hope < 25 && chance(s, 0.15)) {
    const cand = alive(s).filter((p) => !p.special && !isChild(p)).sort((a, b) => a.mood - b.mood);
    if (cand.length) { leave(s, cand[0], 'lặng lẽ bỏ đi vì mất hết hy vọng'); report.push(`${cand[0].name} đã bỏ đi.`); }
  }
  for (const p of alive(s)) if (p.job && p.job !== 'exp' && !canWork(s, p) && p.health < 30) p.job = null;

  // kết thúc?
  const pop = alive(s).length;
  if (pop === 0) s.over = { type: 'collapse', why: 'Không còn ai ở Trạm Bơm Số 7.' };
  else if (s.stats.hope < 10 && s.stats.order < 10) s.over = { type: 'collapse', why: 'Người dân nổi loạn và bỏ trạm mà đi.' };

  const summary = { day: s.day, lines: report.slice(), stats: { ...s.stats }, res: { ...s.res }, pop };
  s.day += 1;
  if (s.flags.act1_done && !s.sandbox && !s.over) s.over = { type: 'act_end' };
  delete s._report; delete s._calc;
  return summary;
}

// ---------- Lưu game ----------
const KEY = 'ttv_save_';
const store = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export function serialize(s) { return JSON.stringify(s); }
export function migrate(obj) {
  if (!obj || typeof obj !== 'object' || !obj.version) throw new Error('File save không hợp lệ.');
  if (obj.version > SAVE_VERSION) throw new Error('Save đến từ phiên bản game mới hơn.');
  // nơi đặt các bước migrate_v1_to_v2... khi game cập nhật
  obj.version = SAVE_VERSION;
  return obj;
}
export function saveGame(s, slot = 'auto') {
  const st = store(); if (!st) return false;
  s.stamp = Date.now();
  const data = serialize(s);
  st.setItem(KEY + slot, data);
  st.setItem(KEY + slot + '_meta', JSON.stringify({ day: s.day, name: s.player.name, pop: alive(s).length, stamp: s.stamp, ironman: s.ironman }));
  if (slot === 'auto' && !s.ironman) {
    // xoay vòng 2 bản dự phòng
    const prev = st.getItem(KEY + 'auto_b1');
    if (prev) st.setItem(KEY + 'auto_b2', prev);
    st.setItem(KEY + 'auto_b1', data);
  }
  return true;
}
export function loadGame(slot = 'auto') {
  const st = store(); if (!st) return null;
  const raw = st.getItem(KEY + slot);
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch {
    const b = st.getItem(KEY + 'auto_b1');
    return b ? migrate(JSON.parse(b)) : null;
  }
}
export function slotMeta(slot) {
  const st = store(); if (!st) return null;
  try { return JSON.parse(st.getItem(KEY + slot + '_meta')); } catch { return null; }
}
export function deleteSlot(slot) {
  const st = store(); if (!st) return;
  st.removeItem(KEY + slot); st.removeItem(KEY + slot + '_meta');
}

function checksum(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
export function exportSave(s) {
  const json = serialize(s);
  return `TTV${SAVE_VERSION}.${checksum(json)}.${b64encode(json)}`;
}
export function importSave(text) {
  const m = /^TTV(\d+)\.([a-z0-9]+)\.(.+)$/s.exec(text.trim());
  if (!m) throw new Error('Không nhận ra định dạng file save.');
  const json = b64decode(m[3]);
  if (checksum(json) !== m[2]) throw new Error('File save bị hỏng (sai checksum).');
  return migrate(JSON.parse(json));
}
