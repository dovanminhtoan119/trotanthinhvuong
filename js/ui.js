// Giao diện: vẽ màn hình, xử lý thao tác, hộp thoại sự kiện, tóm tắt đêm, lưu/tải.
import * as G from './game.js';
import {
  RES, SKILLS, BUILDINGS, TURBINE_REPAIR, RESEARCH, LAWS, DISTRICTS, LOCATIONS, ORIGINS, STORYTELLERS, TRAITS, CODEX,
} from './data.js';
import { cityScene, eventArt, portrait } from './art.js';

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmt = (n) => (Math.abs(n) >= 10 ? Math.floor(n) : Math.floor(n * 10) / 10);
const sign = (n) => (n > 0.05 ? '+' : '') + (Math.abs(n) < 0.05 ? '0' : fmt(n));

let S = null;            // trạng thái game đang chơi
let screen = 'title';    // title | new | game
let tab = 'city';
let district = 'pump';
let busy = false;
let openCitizen = null;
let newGameForm = { name: 'Người Giữ Lửa', origin: 'engineer', storyteller: 'ferry' };
let sessionStart = Date.now();

const SETTINGS_KEY = 'ttv_settings';
let settings = { typewriter: true, speed: 18, font: 1, motion: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch { /* bỏ qua */ }
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); applySettings(); }
function applySettings() {
  document.documentElement.style.setProperty('--font-scale', settings.font);
  document.body.classList.toggle('no-motion', !settings.motion);
}

const app = () => $('#app');
const modalRoot = () => $('#modal');

// ================= Khung chung =================
function render() {
  applySettings();
  if (screen === 'title') return renderTitle();
  if (screen === 'new') return renderNew();
  if (screen === 'game') return renderGame();
}

function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}
function act(err, okMsg) {
  if (err) toast(err, 'bad'); else if (okMsg) toast(okMsg, 'good');
  renderGame();
}

// ================= Màn hình chính =================
function renderTitle() {
  const demo = G.newGame({ seed: 20561 });
  demo.stats.heat = 30;
  const auto = G.slotMeta('auto');
  app().innerHTML = `
  <div class="title-screen">
    <div class="title-art">${cityScene(demo, { night: true, compute: G.compute(demo) })}</div>
    <div class="title-box">
      <h1>Tro Tàn Thịnh Vượng</h1>
      <p class="subtitle">Dựng lại thành phố trên tro tàn. Mỗi ngọn đèn bạn thắp đều gọi Tro tìm về.</p>
      <div class="title-buttons">
        ${auto ? `<button class="btn primary" data-a="continue">Tiếp tục <small>Ngày ${auto.day} · ${esc(auto.name)} · ${auto.pop} người</small></button>` : ''}
        <button class="btn ${auto ? '' : 'primary'}" data-a="to-new">Ván mới</button>
        <button class="btn" data-a="title-load">Tải game</button>
        <label class="btn file-btn">Nhập file save<input type="file" accept=".tro,.txt" data-a="import-file" hidden></label>
      </div>
      <p class="fine">Bản chơi thử Hồi I · Game lưu trên trình duyệt của bạn, không cần tài khoản.</p>
    </div>
  </div>`;
}

function renderNew() {
  const f = newGameForm;
  app().innerHTML = `
  <div class="new-screen">
    <h2>Ván mới</h2>
    <label class="field"><span>Tên Người Giữ Lửa</span><input id="pname" maxlength="24" value="${esc(f.name)}"></label>
    <h3>Xuất thân</h3>
    <div class="cards">${Object.entries(ORIGINS).map(([id, o]) => `
      <button class="card choice ${f.origin === id ? 'sel' : ''}" data-a="pick-origin" data-id="${id}"><b>${o.name}</b><span>${o.desc}</span></button>`).join('')}</div>
    <h3>Người Kể Chuyện (độ khó)</h3>
    <div class="cards">${Object.entries(STORYTELLERS).map(([id, o]) => `
      <button class="card choice ${f.storyteller === id ? 'sel' : ''}" data-a="pick-teller" data-id="${id}"><b>${o.name}</b><span>${o.desc}</span></button>`).join('')}</div>
    <div class="row-end">
      <button class="btn" data-a="to-title">Quay lại</button>
      <button class="btn primary" data-a="start">Bắt đầu</button>
    </div>
  </div>`;
}

// ================= Màn hình chơi =================
function forecast(c) {
  const net = {};
  for (const k of Object.keys(RES)) net[k] = (c.prod[k] || 0) - (c.cons[k] || 0);
  net.food -= c.need.food;
  net.water -= c.need.water;
  net.memory -= Math.min(c.memoryUse, S.res.memory);
  return net;
}

function advisorTips(c, net) {
  const tips = [];
  const idle = G.alive(S).filter((x) => G.canWork(S, x) && !x.job).length;
  if (net.water < 0) tips.push(['tu', `Nước sạch đang hụt ${fmt(-net.water)} mỗi ngày. Thêm người vào Bể lọc cát hoặc xây thêm bể.`]);
  if (net.food < 0) tips.push(['tu', `Thực phẩm hụt ${fmt(-net.food)} mỗi ngày. Chòi cá và thám hiểm là cách nhanh nhất.`]);
  if (c.pop > c.housing) tips.push(['tu', `${c.pop - c.housing} người không có chỗ ngủ. Xây thêm Lều bạt.`]);
  if (idle >= 2) tips.push(['khang', `${idle} người đang rảnh tay. Bấm "Tự phân công" hoặc gửi họ đi thám hiểm.`]);
  if (S.flags.heat_known && S.stats.heat > 45) tips.push(['linh', 'Nhiệt quá cao. Bão Tro và Hình Nhân Tro sẽ tìm đến. Trồng Vườn cây chắn hoặc tắt bớt máy.']);
  if (G.countBuilt(S, 'decoder') && !S.research.current) tips.push(['linh', 'Bàn giải mã đang chờ. Hãy chọn đề tài trong tab Nghiên cứu.']);
  if (G.lawAvailable(S) && S.day >= 8) tips.push(['tu', 'Có thể ban hành một luật mới (tab Luật lệ).']);
  if (S.flags.tu_turbine && !G.countBuilt(S, 'decoder')) tips.push(['tu', 'Muốn sửa tu-bin phải có bản vẽ. Xây Bàn giải mã để đọc ổ cứng cũ.']);
  return tips.slice(0, 2);
}

function bar(v, cls = '') { return `<span class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span>`; }

function renderGame() {
  const c = G.compute(S);
  const net = forecast(c);
  const season = G.seasonOf(S.day);
  const known = S.flags.heat_known;
  const heatCls = ['cool', 'warm', 'hot', 'blaze'][G.heatTier(S.stats.heat)];
  const tips = advisorTips(c, net);
  const idle = G.alive(S).filter((x) => G.canWork(S, x) && !x.job).length;
  const harborOpen = S.districts.harbor.unlocked || S.districts.harbor.clearing;

  app().innerHTML = `
  <div class="game">
    <header class="top">
      <div class="when"><b>Ngày ${S.day}</b> · ${G.SEASON_NAME[season]} · Hồi I${S.sandbox ? ' (tự do)' : ''}${S.ironman ? ' · <span class="iron">Ironman</span>' : ''}</div>
      <div class="res">${Object.entries(RES).map(([k, r]) => `<span class="chip ${net[k] < -0.05 ? 'neg' : ''}" title="${r.name}: ${fmt(S.res[k])} (dự kiến ${sign(net[k])}/ngày)"><em>${r.icon}</em>${fmt(S.res[k])}<small>${sign(net[k])}</small></span>`).join('')}</div>
      <div class="stats">
        <span class="stat" title="Hy Vọng: tinh thần chung. Thấp → người bỏ đi.">Hy Vọng ${Math.round(S.stats.hope)} ${bar(S.stats.hope, 'hope')}</span>
        <span class="stat" title="Trật Tự: mức kiểm soát. Thấp → trộm cắp, ẩu đả.">Trật Tự ${Math.round(S.stats.order)} ${bar(S.stats.order, 'order')}</span>
        <span class="stat heat ${known ? heatCls : 'unknown'}" title="${known ? `Nhiệt ${S.stats.heat} (${G.HEAT_TIER_NAME[G.heatTier(S.stats.heat)]}), mục tiêu ${c.heat.target}` : 'Chưa ai hiểu Tro bị thứ gì thu hút...'}">Nhiệt ${known ? `${S.stats.heat}<small>→${c.heat.target}</small>` : '??'} ${known ? bar(S.stats.heat, heatCls) : ''}</span>
      </div>
    </header>
    <div class="layout">
      <section class="scene-wrap">
        <div class="scene-box">${cityScene(S, { district, compute: c })}</div>
        <div class="district-switch">
          <button class="tabbtn ${district === 'pump' ? 'on' : ''}" data-a="district" data-id="pump">Trạm Bơm</button>
          <button class="tabbtn ${district === 'harbor' ? 'on' : ''}" data-a="district" data-id="harbor">Bến Cảng${harborOpen ? '' : ' 🔒'}</button>
        </div>
        ${tips.map(([who, t]) => { const a = G.citizen(S, who); return `<div class="tip">${a && a.alive ? portrait(a, 36) : ''}<p><b>${a && a.alive ? esc(a.name) : 'Cố vấn'}:</b> ${t}</p></div>`; }).join('')}
      </section>
      <section class="panel">
        <nav class="tabs">${[['city', 'Thành phố'], ['people', 'Cư dân'], ['explore', 'Thám hiểm'], ['research', 'Nghiên cứu'], ['laws', 'Luật lệ'], ['chron', 'Nhật ký'], ['codex', 'Codex'], ['system', 'Hệ thống']]
          .map(([id, n]) => `<button class="tabbtn ${tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${n}${id === 'laws' && G.lawAvailable(S) && S.day >= 8 ? ' •' : ''}</button>`).join('')}</nav>
        <div class="tab-body">${renderTab(c)}</div>
      </section>
    </div>
    <footer class="bottom">
      <span class="idle">${idle ? `${idle} người rảnh` : 'Mọi người đều có việc'} · ${c.pop} dân · ${c.housing} chỗ ở</span>
      <button class="btn primary big" data-a="end-day" ${busy ? 'disabled' : ''}>Kết thúc ngày ▸</button>
    </footer>
  </div>`;
}

function renderTab(c) {
  switch (tab) {
    case 'city': return tabCity(c);
    case 'people': return tabPeople();
    case 'explore': return tabExplore();
    case 'research': return tabResearch(c);
    case 'laws': return tabLaws();
    case 'chron': return tabChron();
    case 'codex': return tabCodex();
    case 'system': return tabSystem();
    default: return '';
  }
}

// ---------- Tab Thành phố ----------
function workerChip(x) {
  return `<span class="wchip ${G.canWork(S, x) ? '' : 'weak'}">${portrait(x, 22)}${esc(x.name)}<button data-a="unassign" data-id="${x.id}" title="Bỏ phân công">×</button></span>`;
}
function availableWorkers() {
  return G.alive(S).filter((x) => G.canWork(S, x) && x.job !== 'exp')
    .sort((a, b) => (a.job ? 1 : 0) - (b.job ? 1 : 0) || a.name.localeCompare(b.name));
}
function jobLabel(job) {
  if (!job) return 'rảnh';
  if (job === 'exp') return 'đang thám hiểm';
  const [d, i] = job.split(':');
  const p = S.districts[d]?.plots[+i];
  if (!p) return 'rảnh';
  return p.build ? `xây ${BUILDINGS[p.build.target].name}` : BUILDINGS[p.b].name;
}

function tabCity(c) {
  const dist = S.districts[district];
  const def = DISTRICTS[district];
  let html = `<div class="city-head"><div><h3>${def.name}</h3><p class="muted">${def.desc}</p></div><button class="btn small" data-a="auto-assign">Tự phân công</button></div>`;
  html += `<div class="facts">
    <span>⚡ Điện ${c.power.gen}/${c.power.use}${c.power.use && c.power.ratio < 1 ? ` <b class="neg">(thiếu ${Math.round((1 - c.power.ratio) * 100)}%)</b>` : ''}</span>
    <span>🏠 Chỗ ở ${c.housing}/${c.pop}</span>
    <span>🛡 Phòng thủ ${c.defense}</span>
    ${S.flags.heat_known ? `<details><summary>🔥 Nhiệt mục tiêu ${c.heat.target}</summary><ul class="heat-list">${c.heat.parts.map((p) => `<li><span>${esc(p.name)}</span><b>${p.val > 0 ? '+' : ''}${p.val}</b></li>`).join('')}<li><span>Hệ số mùa</span><b>×${c.heat.mult}</b></li></ul></details>` : ''}
  </div>`;
  if (!dist.unlocked) {
    if (dist.clearing) return html + `<div class="locked">Đang dọn dẹp ${def.name}. Xong vào cuối ngày ${dist.clearing.doneDay}.</div>`;
    return html + `<div class="locked"><p>Khu này còn ngổn ngang đổ nát. Dọn dẹp mất ${def.unlockDays} ngày.</p><button class="btn" data-a="unlock" data-id="${district}" ${G.canAfford(S, def.unlockCost) ? '' : 'disabled'}>Dọn dẹp (${G.costText(def.unlockCost)})</button></div>`;
  }
  html += '<div class="plots">';
  dist.plots.forEach((p, i) => {
    if (!p) {
      html += `<div class="plot empty"><span class="muted">Ô đất trống</span><button class="btn small" data-a="build-menu" data-i="${i}">+ Xây dựng</button></div>`;
      return;
    }
    const ws = G.workersAt(S, district, i);
    const slots = G.slotsOf(p);
    const b = BUILDINGS[p.build ? p.build.target : p.b];
    const opts = availableWorkers().filter((x) => x.job !== G.jobKey(district, i));
    let body = '';
    if (p.build) {
      const pct = Math.floor((p.build.progress / p.build.need) * 100);
      body += `<div class="prog">${bar(pct, 'build')} <small>${pct}% · cần người xây</small></div>`;
    } else {
      body += `<p class="muted small">${b.desc}</p>`;
      if (p.hp < 100) body += `<div class="prog">Độ bền ${bar(p.hp, p.hp < 40 ? 'bad' : 'ok')} <small>${Math.round(p.hp)}%</small></div>`;
    }
    if (slots) {
      body += `<div class="workers">${ws.map(workerChip).join('')}${ws.length < slots ? `<select data-a="assign" data-i="${i}"><option value="">+ Thêm người (${ws.length}/${slots})</option>${opts.map((x) => `<option value="${x.id}">${esc(x.name)} · ${SKILLS[b.skill] || 'Xây dựng'} ${p.build ? x.skills.build : x.skills[b.skill] ?? 0} · ${jobLabel(x.job)}</option>`).join('')}</select>` : ''}</div>`;
    }
    const btns = [];
    if (p.b === 'turbine_broken' && !p.build) {
      const ok = G.researchDone(S, TURBINE_REPAIR.req);
      btns.push(`<button class="btn small" data-a="repair-turbine" data-i="${i}" ${ok && G.canAfford(S, TURBINE_REPAIR.cost) ? '' : 'disabled'}>Sửa tu-bin (${G.costText(TURBINE_REPAIR.cost)})</button>${ok ? '' : `<small class="muted">${S.flags.tu_turbine ? 'Cần nghiên cứu Bản vẽ tu-bin' : 'Chưa ai biết cách sửa'}</small>`}`);
    }
    if (!p.build && !b.special) {
      if (p.hp < 100) btns.push(`<button class="btn small" data-a="repair" data-i="${i}" ${G.canAfford(S, G.repairCost(p)) ? '' : 'disabled'}>Sửa (${G.costText(G.repairCost(p))})</button>`);
    }
    if (!p.build && (b.slots || b.power || b.heat) && p.b !== 'turbine_broken') btns.push(`<button class="btn small" data-a="toggle" data-i="${i}">${p.on ? 'Tắt' : 'Bật'}</button>`);
    if (p.b === 'turbine' && p.hp < 100) btns.push(`<button class="btn small" data-a="repair" data-i="${i}" ${G.canAfford(S, G.repairCost(p)) ? '' : 'disabled'}>Sửa (${G.costText(G.repairCost(p))})</button>`);
    if (!b.special) btns.push(`<button class="btn small ghost" data-a="demolish" data-i="${i}">${p.build ? 'Hủy' : 'Dỡ'}</button>`);
    const tags = [];
    if (b.power > 0) tags.push(`+${b.power}⚡`); if (b.power < 0) tags.push(`${b.power}⚡`);
    if (S.flags.heat_known && b.heat) tags.push(`+${b.heat}🔥`);
    if (b.cooling) tags.push(`-${b.cooling}🔥`);
    if (b.housing) tags.push(`${b.housing}🏠`);
    html += `<div class="plot ${p.on === false ? 'off' : ''}"><div class="plot-h"><b>${p.build ? 'Đang xây: ' : ''}${b.name}</b><span class="tags">${tags.join(' ')}</span></div>${body}<div class="plot-btns">${btns.join('')}</div></div>`;
  });
  return html + '</div>';
}

function buildMenu(i) {
  const opts = G.buildOptions(S, district);
  const rows = opts.map(({ id, b, why }) => {
    const tags = [];
    if (b.slots) tags.push(`${b.slots} người`);
    if (b.housing) tags.push(`${b.housing} chỗ ở`);
    if (b.power > 0) tags.push(`+${b.power} điện`); if (b.power < 0) tags.push(`${b.power} điện`);
    if (S.flags.heat_known && b.heat) tags.push(`+${b.heat} Nhiệt`);
    if (b.cooling) tags.push(`-${b.cooling} Nhiệt`);
    return `<button class="build-opt" data-a="build" data-id="${id}" data-i="${i}" ${why ? 'disabled' : ''}>
      <b>${b.name}</b><span class="cost">${G.costText(b.cost)} · ${b.work} công</span>
      <span class="muted">${b.desc}</span><span class="tags">${tags.join(' · ')}</span>${why ? `<span class="why">${why}</span>` : ''}</button>`;
  }).join('');
  showPanel(`<h3>Xây dựng ở ${DISTRICTS[district].name}</h3><div class="build-list">${rows}</div>`);
}

// ---------- Tab Cư dân ----------
function tabPeople() {
  const people = G.alive(S);
  const gone = S.citizens.filter((x) => !x.alive);
  const list = people.map((x) => {
    const open = openCitizen === x.id;
    const top = Object.entries(x.skills).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${SKILLS[k]} ${v}`).join(' · ');
    const sp = x.spouse && G.citizen(S, x.spouse);
    return `<div class="person ${open ? 'open' : ''}">
      <button class="person-h" data-a="toggle-person" data-id="${x.id}">${portrait(x, 48)}
        <span class="pinfo"><b>${esc(x.name)}</b> <small>${x.age} tuổi · ${jobLabel(x.job)}</small><small class="muted">${top}</small></span>
        <span class="pbars"><span title="Sức khỏe">❤ ${bar(x.health, x.health < 40 ? 'bad' : 'ok')}</span><span title="Tinh thần">☺ ${bar(x.mood, 'hope')}</span><span title="Tro nhiễm">◆ ${bar(x.ash, x.ash >= 60 ? 'bad' : 'ash')}</span></span>
      </button>
      ${open ? `<div class="person-d">
        <p>${x.traits.map((t) => `<span class="trait" title="${TRAITS[t].desc}">${TRAITS[t].name}</span>`).join(' ')}</p>
        <div class="skills">${Object.entries(x.skills).map(([k, v]) => `<span>${SKILLS[k]} <b>${v}</b></span>`).join('')}</div>
        <p class="small">Sức khỏe ${Math.round(x.health)} · Tinh thần ${Math.round(x.mood)} · Tro nhiễm ${Math.round(x.ash)}${x.ash >= 80 ? ' <b class="neg">(đang kết tinh)</b>' : ''}</p>
        ${sp ? `<p class="small">Bạn đời: ${esc(sp.name)}${sp.alive ? '' : ' (đã mất)'}</p>` : ''}
        <p class="wish">Ước nguyện: “${esc(x.wish)}”</p>
        ${G.isChild(x) ? '<p class="small muted">Còn nhỏ, chưa thể làm việc.</p>' : ''}
      </div>` : ''}
    </div>`;
  }).join('');
  return `<h3>${people.length} cư dân</h3><div class="people">${list}</div>${gone.length ? `<details class="gone"><summary>Đã mất hoặc rời đi (${gone.length})</summary>${gone.map((x) => `<p class="small">${esc(x.name)}: ${x.died ? `${esc(x.cause)}, ngày ${x.died}` : `rời đi ngày ${x.left}`}</p>`).join('')}</details>` : ''}`;
}

// ---------- Tab Thám hiểm ----------
function tabExplore() {
  const active = S.expeditions.map((e) => `<div class="exp-active">🧭 <b>${LOCATIONS[e.loc].name}</b>: ${e.team.map((id) => esc(G.citizen(S, id)?.name)).join(', ')} · về vào tối ngày ${e.returnDay}</div>`).join('');
  const locs = Object.entries(LOCATIONS).filter(([id]) => S.map[id]?.known).map(([id, l]) => {
    const m = S.map[id];
    const busyHere = S.expeditions.some((e) => e.loc === id);
    return `<div class="loc">
      <div class="loc-art">${eventArt(l.art)}</div>
      <div class="loc-body"><b>${l.name}</b> <small>${l.dist} ngày · Nguy hiểm ${'◆'.repeat(l.danger)}${'◇'.repeat(3 - l.danger)}</small>
      <p class="muted small">${l.desc}</p>
      <p class="small">Có thể có: ${Object.keys(l.loot).map((k) => RES[k].name).join(', ')}${m.visits ? ` · đã đến ${m.visits} lần${m.visits >= 3 ? ' (gần cạn)' : ''}` : ''}</p>
      <button class="btn small" data-a="exp-menu" data-id="${id}" ${busyHere ? 'disabled' : ''}>${busyHere ? 'Đội đang ở đó' : 'Gửi đội'}</button></div>
    </div>`;
  }).join('');
  const unknown = Object.keys(LOCATIONS).filter((id) => !S.map[id]?.known).length;
  return `<h3>Bản đồ vùng</h3>${active}<div class="locs">${locs}</div>${unknown ? `<p class="muted small">Còn ${unknown} địa điểm chưa khám phá. Manh mối sẽ đến từ cư dân và khách lạ.</p>` : ''}`;
}

function expMenu(locId) {
  const l = LOCATIONS[locId];
  const cand = G.alive(S).filter((x) => G.canWork(S, x) && x.job !== 'exp').sort((a, b) => b.skills.scout - a.skills.scout);
  showPanel(`<h3>Gửi đội đến ${l.name}</h3>
    <p class="muted small">${l.dist} ngày đi về. Mỗi người mang theo ${l.dist} Thực phẩm. Kỹ năng hữu ích: Thám hiểm, Chiến đấu, Giao tiếp, Chế tạo.</p>
    <form id="exp-form" class="exp-form">${cand.map((x) => `<label class="exp-pick"><input type="checkbox" value="${x.id}"> ${portrait(x, 28)} <b>${esc(x.name)}</b> <small>Thám ${x.skills.scout} · Chiến ${x.skills.fight} · Giao ${x.skills.talk} · Chế ${x.skills.craft} · ${jobLabel(x.job)}</small></label>`).join('')}</form>
    <div class="row-end"><span id="exp-cost" class="muted">Chọn 1–4 người</span><button class="btn primary" data-a="send-exp" data-id="${locId}">Xuất phát</button></div>`);
  const form = $('#exp-form');
  form.addEventListener('change', () => {
    const n = form.querySelectorAll('input:checked').length;
    $('#exp-cost').textContent = n ? `${n} người · ${G.costText(G.expeditionCost(locId, n))}` : 'Chọn 1–4 người';
  });
}

// ---------- Tab Nghiên cứu ----------
function tabResearch(c) {
  const cur = S.research.current;
  const opts = G.researchOptions(S);
  const decoder = G.countBuilt(S, 'decoder');
  return `<h3>Nghiên cứu</h3>
  <p class="muted small">${decoder ? `Bàn giải mã: ${c.research} điểm/ngày, dùng ${c.memoryUse} Ký Ức/ngày.` : 'Cần xây Bàn giải mã và đưa người vào làm.'} Đang có ${fmt(S.res.memory)} Ký Ức.</p>
  ${cur ? `<div class="cur-research"><b>${RESEARCH[cur].name}</b> ${bar((S.research.progress / RESEARCH[cur].cost) * 100, 'build')} <small>${fmt(S.research.progress)}/${RESEARCH[cur].cost}</small></div>` : ''}
  <div class="research-list">${opts.map(({ id, r, done, locked }) => `
    <button class="research ${done ? 'done' : ''} ${cur === id ? 'sel' : ''}" data-a="research" data-id="${id}" ${done || locked ? 'disabled' : ''}>
      <b>${r.name}</b> <small>${r.cost} điểm</small><span class="muted small">${r.desc}</span>${done ? '<span class="good small">Đã xong</span>' : locked ? `<span class="why">Cần: ${RESEARCH[r.after].name}</span>` : ''}
    </button>`).join('')}</div>`;
}

// ---------- Tab Luật lệ ----------
function tabLaws() {
  if (S.day < 8) return '<h3>Luật lệ</h3><p class="muted">Trạm còn quá ít người để cần luật. (Mở từ ngày 8)</p>';
  const avail = G.lawAvailable(S);
  const wait = 10 - (S.day - S.lastLawDay);
  return `<h3>Sổ Luật</h3><p class="muted small">${avail ? 'Có thể ban hành một luật mới hôm nay.' : `Luật tiếp theo sau ${wait} ngày nữa.`} Luật đã ban hành không thể hủy.</p>
  <div class="laws">${G.lawOptions(S).map(({ id, l, signed }) => `
    <div class="law ${signed ? 'signed' : ''}"><b>${l.name}</b><span class="small">${l.desc}</span>${signed ? '<span class="good small">Đang có hiệu lực</span>' : `<button class="btn small" data-a="law" data-id="${id}" ${avail ? '' : 'disabled'}>Ban hành</button>`}</div>`).join('')}</div>`;
}

// ---------- Nhật ký, Codex ----------
function tabChron() {
  const items = [...S.chronicle].reverse();
  let lastDay = null;
  return `<h3>Nhật Ký Thành Phố</h3><div class="chron">${items.map((e) => { const h = e.day !== lastDay ? `<h4>Ngày ${e.day}</h4>` : ''; lastDay = e.day; return h + `<p>${esc(e.text)}</p>`; }).join('')}</div>`;
}
function tabCodex() {
  return `<h3>Codex</h3><p class="muted small">${S.codex.length}/${Object.keys(CODEX).length} mục đã mở.</p>${S.codex.map((id) => `<details class="codex"><summary>${CODEX[id].title}</summary><p>${CODEX[id].text}</p></details>`).join('')}`;
}

// ---------- Hệ thống ----------
function tabSystem() {
  const slots = ['1', '2', '3'].map((sl) => {
    const m = G.slotMeta(sl);
    return `<div class="slot"><b>Ô ${sl}</b> <small>${m ? `Ngày ${m.day} · ${esc(m.name)} · ${new Date(m.stamp).toLocaleString('vi-VN')}` : 'Trống'}</small>
      <span><button class="btn small" data-a="save-slot" data-id="${sl}" ${S.ironman ? 'disabled' : ''}>Lưu</button>
      <button class="btn small" data-a="load-slot" data-id="${sl}" ${m && !S.ironman ? '' : 'disabled'}>Tải</button>
      <button class="btn small ghost" data-a="del-slot" data-id="${sl}" ${m ? '' : 'disabled'}>Xóa</button></span></div>`;
  }).join('');
  return `<h3>Lưu game</h3>
  <p class="muted small">Game tự lưu vào ô tự động mỗi sáng. ${S.ironman ? 'Chế độ Ironman: chỉ có ô tự động.' : ''} Save nằm trong trình duyệt này; nếu xóa dữ liệu trình duyệt thì save cũng mất, nên hãy xuất file để sao lưu.</p>
  <div class="slots">${slots}</div>
  <div class="row"><button class="btn" data-a="export">Tải file save (.tro)</button><button class="btn" data-a="copy-save">Sao chép mã save</button>
  <label class="btn file-btn">Nhập file save<input type="file" accept=".tro,.txt" data-a="import-file" hidden></label><button class="btn" data-a="paste-save">Dán mã save</button></div>
  <h3>Cài đặt</h3>
  <label class="set"><input type="checkbox" data-a="set-typewriter" ${settings.typewriter ? 'checked' : ''}> Hiệu ứng chữ chạy</label>
  <label class="set"><input type="checkbox" data-a="set-motion" ${settings.motion ? 'checked' : ''}> Hiệu ứng Tro rơi, mưa</label>
  <label class="set">Cỡ chữ <input type="range" min="0.85" max="1.3" step="0.05" value="${settings.font}" data-a="set-font"></label>
  <div class="row"><button class="btn ghost" data-a="to-title">Về màn hình chính</button></div>
  <p class="fine">Tro Tàn Thịnh Vượng · bản chơi thử 0.1 · seed ${S.seed}</p>`;
}

// ================= Hộp thoại =================
function closeModal() { modalRoot().innerHTML = ''; modalRoot().className = ''; }
function showPanel(html) {
  modalRoot().className = 'show';
  modalRoot().innerHTML = `<div class="modal-bg" data-a="close-modal"></div><div class="modal panel-modal"><button class="x" data-a="close-modal" aria-label="Đóng">×</button>${html}</div>`;
}

function typewrite(el, text) {
  return new Promise((resolve) => {
    if (!settings.typewriter) { el.textContent = text; resolve(); return; }
    let i = 0;
    const done = () => { clearInterval(timer); el.textContent = text; el.onclick = null; resolve(); };
    el.onclick = done;
    el.dataset.skip = '1';
    const timer = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) done(); }, settings.speed);
    el._finish = done;
  });
}

function eventModal(inst) {
  return new Promise((resolve) => {
    const v = G.presentEvent(S, inst);
    modalRoot().className = 'show';
    modalRoot().innerHTML = `<div class="modal-bg"></div><div class="modal event-modal">
      <div class="ev-art">${eventArt(v.art)}</div>
      <div class="ev-body"><h2>${esc(v.title)}</h2><div class="ev-text"></div>
      <div class="choices" hidden>${v.choices.map((ch, n) => `<button class="choice-btn" data-idx="${ch.idx}" ${ch.disabled ? 'disabled' : ''}><span class="num">${n + 1}</span><span><b>${esc(ch.label)}</b>${ch.hint ? `<small>${esc(ch.hint)}</small>` : ''}${ch.disabled ? `<small class="why">${esc(ch.disabled)}</small>` : ''}</span></button>`).join('')}</div></div></div>`;
    const textEl = $('.ev-text', modalRoot());
    const choicesEl = $('.choices', modalRoot());
    const finishText = () => { if (textEl._finish) textEl._finish(); };
    typewrite(textEl, v.text).then(() => { choicesEl.hidden = false; });
    $('.modal', modalRoot()).addEventListener('click', (e) => { if (choicesEl.hidden && !e.target.closest('.choice-btn')) finishText(); });
    const choose = (idx) => {
      cleanupKeys();
      const r = G.resolveChoice(S, inst, idx);
      choicesEl.remove();
      const res = document.createElement('div');
      res.className = 'ev-result';
      $('.ev-body', modalRoot()).appendChild(res);
      const cont = () => { cleanup2(); resolve(r.follow); };
      const btn = document.createElement('button');
      btn.className = 'btn primary'; btn.textContent = 'Tiếp tục'; btn.hidden = true;
      btn.onclick = cont;
      $('.ev-body', modalRoot()).appendChild(btn);
      const onKey2 = (e) => { if ((e.key === 'Enter' || e.key === ' ') && !btn.hidden) { e.preventDefault(); cont(); } };
      const cleanup2 = () => document.removeEventListener('keydown', onKey2);
      document.addEventListener('keydown', onKey2);
      if (r.text) typewrite(res, r.text).then(() => { btn.hidden = false; btn.focus(); });
      else { btn.hidden = false; btn.focus(); }
    };
    choicesEl.addEventListener('click', (e) => { const b = e.target.closest('.choice-btn'); if (b && !b.disabled) choose(+b.dataset.idx); });
    const onKey = (e) => {
      if (choicesEl.hidden) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishText(); } return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= v.choices.length && !v.choices[n - 1].disabled) choose(v.choices[n - 1].idx);
    };
    const cleanupKeys = () => document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);
  });
}

function summaryModal(sum, before) {
  return new Promise((resolve) => {
    const deltas = Object.keys(RES).map((k) => {
      const d = sum.res[k] - before.res[k];
      return Math.abs(d) >= 0.1 ? `<span class="chip ${d < 0 ? 'neg' : 'pos'}"><em>${RES[k].icon}</em>${d > 0 ? '+' : ''}${fmt(d)}</span>` : '';
    }).join('');
    const sd = (k, n) => { const d = Math.round((sum.stats[k] - before.stats[k]) * 10) / 10; return d ? `<span class="${d < 0 ? 'neg' : 'pos'}">${n} ${d > 0 ? '+' : ''}${d}</span>` : ''; };
    const popD = sum.pop - before.pop;
    const c = G.compute(S);
    modalRoot().className = 'show';
    modalRoot().innerHTML = `<div class="modal-bg"></div><div class="modal event-modal night">
      <div class="ev-art">${cityScene(S, { district: 'pump', night: true, compute: c }).replace('viewBox="0 0 800 400"', 'viewBox="0 60 800 300"')}</div>
      <div class="ev-body"><h2>Đêm thứ ${sum.day}</h2>
      <div class="sum-lines">${sum.lines.length ? sum.lines.map((l) => `<p>${esc(l)}</p>`).join('') : '<p class="muted">Một đêm yên bình. Chỉ có tiếng sông chảy.</p>'}</div>
      <div class="sum-deltas">${deltas}</div>
      <p class="sum-stats">${[sd('hope', 'Hy Vọng'), sd('order', 'Trật Tự'), S.flags.heat_known ? sd('heat', 'Nhiệt') : '', popD ? `<span class="${popD < 0 ? 'neg' : 'pos'}">Dân số ${popD > 0 ? '+' : ''}${popD}</span>` : ''].filter(Boolean).join(' · ')}</p>
      <button class="btn primary" id="next-day">Sang ngày ${sum.day + 1} ▸</button></div></div>`;
    const btn = $('#next-day');
    btn.focus();
    const go = () => { document.removeEventListener('keydown', onKey); resolve(); };
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    document.addEventListener('keydown', onKey);
    btn.onclick = go;
  });
}

function endScreen() {
  const o = S.over;
  const pop = G.alive(S).length;
  const dead = S.citizens.filter((x) => x.died).length;
  const left = S.citizens.filter((x) => x.left).length;
  const built = Object.values(S.districts).flatMap((d) => d.plots).filter((p) => p && !p.build && p.b !== 'turbine_broken').length;
  const isAct = o.type === 'act_end';
  modalRoot().className = 'show';
  modalRoot().innerHTML = `<div class="modal-bg"></div><div class="modal event-modal end">
    <div class="ev-art">${eventArt(isAct ? 'boat' : 'storm')}</div>
    <div class="ev-body"><h2>${isAct ? 'Hết Hồi I: Đốm Lửa' : 'Kết thúc: Sụp Đổ'}</h2>
    <p>${isAct ? 'Trạm Bơm Số 7 đã sống sót qua tháng đầu tiên. Hồi II: Dòng Sông sẽ có trong bản cập nhật tới.' : esc(o.why) + ' Nhật Ký Thành Phố trở thành di chúc của những người đã cố gắng.'}</p>
    <div class="end-stats"><span>Ngày <b>${S.day - 1}</b></span><span>Còn sống <b>${pop}</b></span><span>Đã mất <b>${dead}</b></span><span>Bỏ đi <b>${left}</b></span><span>Công trình <b>${built}</b></span><span>Hy Vọng <b>${Math.round(S.stats.hope)}</b></span>${S.flags.heat_known ? `<span>Nhiệt <b>${S.stats.heat}</b></span>` : ''}<span>Codex <b>${S.codex.length}/${Object.keys(CODEX).length}</b></span></div>
    <div class="row-end">${isAct ? '<button class="btn" data-a="sandbox">Chơi tiếp tự do</button>' : ''}<button class="btn primary" data-a="to-title-end">Về màn hình chính</button></div></div></div>`;
}

// ================= Kết thúc ngày =================
async function endDay() {
  if (busy || S.over) return;
  busy = true;
  renderGame();
  try {
    const before = { res: { ...S.res }, stats: { ...S.stats }, pop: G.alive(S).length };
    const queue = G.runDay(S);
    while (queue.length) {
      const inst = queue.shift();
      const follow = await eventModal(inst);
      queue.push(...follow);
    }
    const sum = G.runNight(S);
    await summaryModal(sum, before);
    closeModal();
    S.playtime += Math.round((Date.now() - sessionStart) / 1000); sessionStart = Date.now();
    G.saveGame(S, 'auto');
  } catch (err) {
    console.error(err);
    toast('Lỗi: ' + err.message, 'bad');
  }
  busy = false;
  renderGame();
  if (S.over) endScreen();
}

// ================= Tự phân công =================
function autoAssign(silent = false) {
  const order = (p) => {
    if (p.build) return 2;
    const b = p.b;
    const c = G.compute(S); const net = forecast(c);
    if (b === 'filter' && net.water < 3) return 0;
    if ((b === 'fishing' || b === 'hydro') && net.food < 3) return 0;
    if (b === 'turbine') return 1;
    if (b === 'decoder' && !S.research.current) return 9;
    return { filter: 3, fishing: 3, hydro: 3, medtent: 4, clinic: 4, decoder: 4, guard: 5, woodcut: 6, scrapyard: 6, workshop: 6, herbs: 7 }[b] ?? 8;
  };
  let n = 0;
  for (let pass = 0; pass < 3; pass++) {
    const plots = [];
    for (const d in S.districts) if (S.districts[d].unlocked) S.districts[d].plots.forEach((p, i) => { if (p && G.slotsOf(p) > G.workersAt(S, d, i).length && p.on !== false) plots.push({ d, i, p }); });
    plots.sort((a, b) => order(a.p) - order(b.p));
    const free = G.alive(S).filter((x) => G.canWork(S, x) && !x.job);
    if (!free.length || !plots.length) break;
    for (const x of plots) {
      const b = BUILDINGS[x.p.build ? 'site' : x.p.b];
      const skill = x.p.build ? 'build' : b?.skill || 'build';
      free.sort((a, b2) => (b2.skills[skill] || 0) - (a.skills[skill] || 0));
      if (free.length && !G.assign(S, free[0].id, x.d, x.i)) { free.shift(); n++; }
    }
  }
  if (!silent) toast(n ? `Đã phân công ${n} người.` : 'Không còn ai rảnh hoặc không còn chỗ trống.', n ? 'good' : '');
  renderGame();
}

// ================= Lưu / tải =================
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function startWith(state) {
  S = state; screen = 'game'; tab = 'city'; district = 'pump'; openCitizen = null; sessionStart = Date.now();
  closeModal(); render();
  if (S.over) endScreen();
}
function importText(text) {
  try {
    const st = G.importSave(text);
    if (S && screen === 'game' && !confirm('Thay ván đang chơi bằng save này?')) return;
    startWith(st);
    G.saveGame(S, 'auto');
    toast('Đã nhập save.', 'good');
  } catch (err) { toast(err.message, 'bad'); }
}

function titleLoad() {
  const rows = ['auto', '1', '2', '3'].map((sl) => {
    const m = G.slotMeta(sl);
    return `<button class="build-opt" data-a="title-load-slot" data-id="${sl}" ${m ? '' : 'disabled'}><b>${sl === 'auto' ? 'Tự động' : 'Ô ' + sl}</b><span class="muted">${m ? `Ngày ${m.day} · ${esc(m.name)} · ${m.pop} người · ${new Date(m.stamp).toLocaleString('vi-VN')}` : 'Trống'}</span></button>`;
  }).join('');
  showPanel(`<h3>Tải game</h3><div class="build-list">${rows}</div>`);
}

// ================= Bắt sự kiện =================
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
  const a = el.dataset.a, id = el.dataset.id, i = el.dataset.i != null ? +el.dataset.i : null;
  switch (a) {
    case 'continue': { const st = G.loadGame('auto'); if (st) startWith(st); else toast('Không đọc được save.', 'bad'); break; }
    case 'to-new': screen = 'new'; render(); break;
    case 'to-title': if (screen === 'game' && S && !S.over) G.saveGame(S, 'auto'); screen = 'title'; closeModal(); render(); break;
    case 'to-title-end': screen = 'title'; closeModal(); render(); break;
    case 'title-load': titleLoad(); break;
    case 'title-load-slot': { const st = G.loadGame(id); if (st) startWith(st); break; }
    case 'pick-origin': newGameForm.name = $('#pname').value || newGameForm.name; newGameForm.origin = id; renderNew(); break;
    case 'pick-teller': newGameForm.name = $('#pname').value || newGameForm.name; newGameForm.storyteller = id; renderNew(); break;
    case 'start': {
      newGameForm.name = ($('#pname').value || 'Người Giữ Lửa').trim().slice(0, 24);
      const auto = G.slotMeta('auto');
      if (auto && !confirm('Ván mới sẽ ghi đè ô lưu tự động. Tiếp tục?')) break;
      startWith(G.newGame(newGameForm));
      autoAssign(true);
      G.saveGame(S, 'auto');
      break;
    }
    case 'tab': tab = id; renderGame(); break;
    case 'district': district = id; renderGame(); break;
    case 'end-day': endDay(); break;
    case 'auto-assign': autoAssign(); break;
    case 'build-menu': buildMenu(i); break;
    case 'build': { const err = G.startBuild(S, district, i, id); closeModal(); act(err, `Bắt đầu xây ${BUILDINGS[id].name}. Hãy đưa người vào xây.`); break; }
    case 'repair-turbine': act(G.startTurbineRepair(S, district, i), 'Bắt đầu sửa tu-bin.'); break;
    case 'repair': act(G.repair(S, district, i), 'Đã sửa xong.'); break;
    case 'toggle': G.toggle(S, district, i); renderGame(); break;
    case 'demolish': if (confirm('Dỡ công trình này? Hoàn lại một nửa vật liệu.')) act(G.demolish(S, district, i)); break;
    case 'unassign': G.unassign(S, id); renderGame(); break;
    case 'unlock': act(G.unlockDistrict(S, id), 'Bắt đầu dọn dẹp.'); break;
    case 'toggle-person': openCitizen = openCitizen === id ? null : id; renderGame(); break;
    case 'exp-menu': expMenu(id); break;
    case 'send-exp': {
      const ids = [...document.querySelectorAll('#exp-form input:checked')].map((x) => x.value);
      for (const cid of ids) { const c = G.citizen(S, cid); if (c && c.job && c.job !== 'exp') c.job = null; }
      const err = G.sendExpedition(S, id, ids);
      if (!err) closeModal();
      act(err, 'Đội đã lên đường.');
      break;
    }
    case 'research': act(G.setResearch(S, id), `Đề tài: ${RESEARCH[id].name}.`); break;
    case 'law': if (confirm(`Ban hành "${LAWS[id].name}"? Không thể hủy.`)) act(G.signLaw(S, id), 'Luật đã có hiệu lực.'); break;
    case 'save-slot': G.saveGame(S, id); toast(`Đã lưu vào ô ${id}.`, 'good'); renderGame(); break;
    case 'load-slot': if (confirm('Tải save này? Tiến trình chưa lưu sẽ mất.')) { const st = G.loadGame(id); if (st) startWith(st); } break;
    case 'del-slot': if (confirm('Xóa ô lưu này?')) { G.deleteSlot(id); renderGame(); } break;
    case 'export': download(`tro-tan-ngay-${S.day}.tro`, G.exportSave(S)); break;
    case 'copy-save': navigator.clipboard?.writeText(G.exportSave(S)).then(() => toast('Đã sao chép mã save.', 'good'), () => toast('Không sao chép được.', 'bad')); break;
    case 'paste-save': { const t = prompt('Dán mã save (bắt đầu bằng TTV1.):'); if (t) importText(t); break; }
    case 'close-modal': closeModal(); break;
    case 'sandbox': S.sandbox = true; S.over = null; G.saveGame(S, 'auto'); closeModal(); renderGame(); break;
    default: break;
  }
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const a = el.dataset.a;
  if (a === 'assign' && el.value) {
    const c = G.citizen(S, el.value);
    if (c && c.job) c.job = null;
    act(G.assign(S, el.value, district, +el.dataset.i));
  } else if (a === 'import-file' && el.files[0]) {
    el.files[0].text().then(importText);
    el.value = '';
  } else if (a === 'set-typewriter') { settings.typewriter = el.checked; saveSettings(); }
  else if (a === 'set-motion') { settings.motion = el.checked; saveSettings(); }
  else if (a === 'set-font') { settings.font = +el.value; saveSettings(); }
});

document.addEventListener('keydown', (e) => {
  if (screen !== 'game' || modalRoot().innerHTML) { if (e.key === 'Escape' && $('.panel-modal')) closeModal(); return; }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Enter' && e.ctrlKey) endDay();
});

window.addEventListener('beforeunload', () => {
  // không lưu giữa ngày: save tự động chỉ ghi lúc bình minh để chống "save-scum"
});

if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});

render();
