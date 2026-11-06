// Minh họa vẽ bằng SVG, tự sinh trong code: phong cách tranh mực nho, một màu nhấn cam lửa.
// Không dùng ảnh ngoài nên không có vấn đề bản quyền và game rất nhẹ.
import { seasonOf, heatTier } from './game.js';

const C = {
  paper: '#ddd5c4', paper2: '#cfc5b1', ink: '#2a2b2d', ink2: '#45474a', mid: '#6d6f71', ash: '#9a9b9a',
  light: '#b9b6ad', moss: '#5f7a4c', moss2: '#7d9463', ember: '#d9773a', ember2: '#f0a35c',
  water: '#4f6672', water2: '#6f8794', rust: '#8a5a3e', white: '#ece6d8', sky: '#c9bfae', crystal: '#b7c7cf',
};

// PRNG riêng cho tranh (không đụng tới RNG của game)
function prng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function skyColors(night, season) {
  if (night) return ['#161b21', '#2b3540'];
  if (season === 'rain') return ['#8c9296', '#b8b9b4'];
  if (season === 'ash') return ['#9d978c', '#c4bcae'];
  return ['#c4b59c', '#e6d8bd'];
}

function skyline(r, y0, color, count = 14, tall = 120) {
  let out = '';
  let x = -20;
  for (let i = 0; i < count; i++) {
    const w = 30 + r() * 50;
    const h = 40 + r() * tall;
    const broken = r() < 0.5;
    const top = y0 - h;
    if (broken) {
      const b1 = top + r() * 20, b2 = top + r() * 30;
      out += `<path d="M${x} ${y0}V${b1}L${x + w * 0.4} ${top}L${x + w * 0.6} ${b2}L${x + w} ${top + r() * 25}V${y0}Z" fill="${color}"/>`;
    } else out += `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${color}"/>`;
    // dây leo / cây trên mái
    if (r() < 0.6) out += `<ellipse cx="${x + w * r()}" cy="${top + 6}" rx="${8 + r() * 14}" ry="${6 + r() * 8}" fill="${C.moss}" opacity=".55"/>`;
    // cửa sổ vỡ
    for (let k = 0; k < 3; k++) if (r() < 0.5) out += `<rect x="${x + 5 + r() * (w - 12)}" y="${top + 15 + r() * (h - 25)}" width="4" height="6" fill="${C.ink}" opacity=".35"/>`;
    x += w + r() * 18;
  }
  return out;
}

function ashLayer(count, seed, w = 800, h = 400) {
  const r = prng(seed);
  let out = '<g class="ash-layer">';
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = -r() * h, s = 0.8 + r() * 1.8, d = 6 + r() * 10, delay = -r() * d;
    out += `<circle class="ashp" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="${C.ash}" opacity="${(0.4 + r() * 0.5).toFixed(2)}" style="animation-duration:${d.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"/>`;
  }
  return out + '</g>';
}
function rainLayer(count, seed, w = 800, h = 400) {
  const r = prng(seed);
  let out = '<g class="rain-layer">';
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = -r() * h, d = 0.6 + r() * 0.5;
    out += `<line class="rainp" x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 6).toFixed(0)}" y2="${(y + 18).toFixed(0)}" stroke="${C.water2}" stroke-width="1" opacity=".55" style="animation-duration:${d.toFixed(2)}s;animation-delay:${(-r() * d).toFixed(2)}s"/>`;
  }
  return out + '</g>';
}

// ---------- Sprite công trình: gốc (0,0) ở giữa chân công trình ----------
const win = (x, y, w, h, lit) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? C.ember2 : C.ink}" opacity="${lit ? 0.95 : 0.6}"/>`;

const SPRITES = {
  empty: () => `<path d="M-30 0H30" stroke="${C.ink}" stroke-dasharray="4 4" opacity=".4"/><text x="0" y="-8" text-anchor="middle" font-size="14" fill="${C.ink}" opacity=".35">+</text>`,
  site: (o) => `<g stroke="${C.ink2}" stroke-width="2" fill="none"><path d="M-28 0V-50M28 0V-50M-28 -25H28M-28 -50H28M-28 0L28 -50M28 0L-28 -50"/></g><rect x="-20" y="-12" width="22" height="12" fill="${C.rust}"/><rect x="5" y="-8" width="16" height="8" fill="${C.light}"/>${o.pct != null ? `<text x="0" y="-56" text-anchor="middle" font-size="11" fill="${C.ink}">${o.pct}%</text>` : ''}`,
  tent: (o) => `<path d="M-32 0L0 -44L32 0Z" fill="#7a8466"/><path d="M0 -44L32 0H12Z" fill="#5f694f"/><path d="M-6 0L0 -18L6 0Z" fill="${o.lit ? C.ember2 : C.ink}" opacity=".85"/><path d="M0 -44V-50" stroke="${C.ink}" stroke-width="2"/>`,
  container: (o) => `<rect x="-34" y="-30" width="68" height="30" fill="${C.rust}"/><rect x="-28" y="-58" width="60" height="28" fill="#6f7d74"/>${[...Array(8)].map((_, i) => `<path d="M${-32 + i * 8.5} -30V0" stroke="${C.ink}" opacity=".25"/>`).join('')}${win(-20, -22, 10, 9, o.lit)}${win(10, -22, 10, 9, o.lit)}${win(-12, -50, 10, 9, o.lit)}${win(12, -50, 10, 9, o.lit)}<path d="M-30 -58H34" stroke="${C.ink}" stroke-width="2"/>`,
  filter: () => `<rect x="-26" y="-36" width="40" height="36" fill="${C.light}"/><ellipse cx="-6" cy="-36" rx="20" ry="6" fill="${C.water2}"/><ellipse cx="-6" cy="-36" rx="20" ry="6" fill="none" stroke="${C.ink}" stroke-width="1.5"/><path d="M-26 -36V0M14 -36V0" stroke="${C.ink}" stroke-width="1.5"/><path d="M14 -10H30V0" stroke="${C.ink2}" stroke-width="4" fill="none"/><path d="M-26 -20H14" stroke="${C.ink}" opacity=".3"/>`,
  fishing: (o) => `<path d="M-26 0V-24M26 0V-24M0 0V-24" stroke="${C.ink}" stroke-width="3"/><rect x="-32" y="-28" width="64" height="5" fill="${C.ink2}"/><path d="M-24 -28V-48H20V-28" fill="#8a7a5c"/><path d="M-30 -48L-2 -64L26 -48Z" fill="#5c5a4c"/>${win(-6, -42, 10, 8, o.lit)}<path d="M26 -28L44 -6" stroke="${C.ink}" stroke-width="1.5"/><path d="M36 -16l12 10l-8 4z" fill="none" stroke="${C.ink}" opacity=".6"/>`,
  woodcut: () => `${[0, 1, 2, 3].map((i) => `<rect x="${-30 + i * 2}" y="${-6 - i * 6}" width="56" height="5" rx="2" fill="${i % 2 ? C.moss2 : '#9a9b62'}"/>`).join('')}<rect x="20" y="-14" width="14" height="14" fill="${C.rust}"/><path d="M27 -14L33 -30" stroke="${C.ink}" stroke-width="2"/><path d="M30 -30l8 -2l-2 8z" fill="${C.mid}"/><path d="M-36 0Q-30 -40 -26 -60M-40 0Q-38 -36 -42 -54" stroke="${C.moss}" stroke-width="3" fill="none"/>`,
  scrapyard: () => `<path d="M-36 0L-24 -22L-10 -16L0 -34L14 -20L28 -26L38 0Z" fill="${C.mid}"/><circle cx="-6" cy="-14" r="7" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-dasharray="3 2"/><rect x="12" y="-14" width="14" height="8" fill="${C.rust}" transform="rotate(-15 19 -10)"/><path d="M-20 -8L-4 -26" stroke="${C.ink2}" stroke-width="3"/>`,
  herbs: () => `<rect x="-32" y="-10" width="64" height="10" fill="#6b5a44"/>${[...Array(7)].map((_, i) => `<path d="M${-26 + i * 9} -10q-4 -10 0 -16q4 6 0 16" fill="${i % 2 ? C.moss : C.moss2}"/>`).join('')}`,
  firepit: (o) => `<ellipse cx="0" cy="-3" rx="24" ry="6" fill="${C.mid}"/>${[-16, -6, 4, 14].map((x) => `<ellipse cx="${x}" cy="-4" rx="5" ry="4" fill="${C.ink2}"/>`).join('')}<path class="flame" d="M-10 -6Q-12 -22 0 -36Q2 -24 10 -20Q12 -10 8 -6Z" fill="${C.ember}"/><path class="flame" d="M-4 -6Q-4 -16 2 -24Q4 -14 6 -6Z" fill="${C.ember2}"/>${o.night ? `<circle cx="0" cy="-16" r="50" fill="url(#glow)"/>` : ''}<path d="M0 -40q6 -10 -2 -20q-6 -8 2 -18" stroke="${C.ash}" fill="none" opacity=".5"/>`,
  medtent: (o) => `<path d="M-34 0L-20 -40H20L34 0Z" fill="${C.white}"/><path d="M-20 -40L0 -52L20 -40Z" fill="${C.light}"/><rect x="-5" y="-30" width="10" height="20" fill="${C.moss}"/><rect x="-10" y="-25" width="20" height="10" fill="${C.moss}"/>${o.lit ? `<rect x="-30" y="-6" width="60" height="6" fill="${C.ember2}" opacity=".4"/>` : ''}`,
  guard: () => `<path d="M-18 0L-12 -50M18 0L12 -50M-15 -25H15M-16 -10L14 -40M16 -10L-14 -40" stroke="#6b5a44" stroke-width="3"/><rect x="-20" y="-58" width="40" height="8" fill="#6b5a44"/><path d="M-24 -58L0 -74L24 -58Z" fill="${C.ink2}"/><path d="M14 -74V-92" stroke="${C.ink}" stroke-width="1.5"/><path d="M14 -92H28L24 -88L28 -84H14" fill="${C.ember}"/>`,
  treeline: () => `${[[-22, 26], [2, 34], [24, 24]].map(([x, h]) => `<rect x="${x - 2}" y="-12" width="4" height="12" fill="#5a4a38"/><ellipse cx="${x}" cy="${-12 - h / 2}" rx="${h / 2.4}" ry="${h / 2}" fill="${C.moss}"/><ellipse cx="${x - 3}" cy="${-14 - h / 2}" rx="${h / 4}" ry="${h / 3.2}" fill="${C.moss2}" opacity=".7"/>`).join('')}`,
  decoder: (o) => `<rect x="-26" y="-34" width="52" height="34" fill="${C.light}"/><path d="M-30 -34L0 -46L30 -34Z" fill="${C.ink2}"/><rect x="-16" y="-26" width="18" height="12" fill="${o.lit || o.working ? '#9fc4b8' : C.ink}"/><path d="M14 -46V-62" stroke="${C.ink}" stroke-width="2"/><path d="M6 -70Q14 -58 24 -64" stroke="${C.ink}" stroke-width="2" fill="none"/><rect x="6" y="-20" width="12" height="20" fill="${C.ink2}"/>`,
  workshop: (o) => `<rect x="-34" y="-36" width="60" height="36" fill="#8f6a52"/><path d="M-38 -36L-4 -50L30 -36Z" fill="${C.ink2}"/><rect x="18" y="-64" width="10" height="26" fill="${C.ink2}"/>${o.on ? `<path class="smoke" d="M23 -66q8 -10 0 -18q-8 -10 2 -20" stroke="${C.ash}" stroke-width="5" fill="none" opacity=".6"/>` : ''}<rect x="-26" y="-22" width="20" height="22" fill="${o.lit ? C.ember : C.ink}" opacity=".85"/>${win(2, -26, 12, 9, o.lit)}`,
  hydro: (o) => `<path d="M-36 0V-30L0 -50L36 -30V0Z" fill="${o.lit ? '#d8c58a' : '#a9b8ad'}" opacity=".85"/><path d="M-36 -30L0 -50L36 -30M0 -50V0M-18 -40V0M18 -40V0" stroke="${C.ink}" stroke-width="1.2" fill="none"/>${[-28, -10, 8, 26].map((x) => `<path d="M${x} -2q-3 -8 0 -12q3 4 0 12" fill="${C.moss}"/>`).join('')}`,
  clinic: (o) => `<rect x="-34" y="-46" width="68" height="46" fill="${C.white}"/><rect x="-34" y="-50" width="68" height="6" fill="${C.ink2}"/><rect x="-5" y="-40" width="10" height="22" fill="${C.moss}"/><rect x="-11" y="-34" width="22" height="10" fill="${C.moss}"/>${win(-28, -40, 12, 10, o.lit)}${win(16, -40, 12, 10, o.lit)}<rect x="-6" y="-14" width="12" height="14" fill="${C.ink2}"/>`,
  solar: () => `${[-18, 18].map((x) => `<path d="M${x} 0V-16" stroke="${C.ink}" stroke-width="2"/><path d="M${x - 18} -14L${x + 14} -30L${x + 18} -22L${x - 14} -6Z" fill="#3e5566" stroke="${C.ink}"/><path d="M${x - 10} -10L${x + 16} -26M${x - 2} -18L${x + 8} -12" stroke="#8aa3b4" opacity=".6"/>`).join('')}`,
  turbine_broken: () => `<rect x="-40" y="-44" width="80" height="44" fill="${C.mid}"/><circle cx="0" cy="-44" r="30" fill="${C.ink2}"/><circle cx="0" cy="-44" r="26" fill="${C.rust}" opacity=".7"/><g stroke="${C.ink}" stroke-width="5"><path d="M0 -44L18 -62"/><path d="M0 -44L-8 -66"/><path d="M0 -44L-22 -36"/></g><circle cx="0" cy="-44" r="6" fill="${C.ink}"/><path d="M-36 -10l14 -6M20 -20l12 8" stroke="${C.ink}" opacity=".5"/>`,
  turbine: (o) => `<rect x="-40" y="-44" width="80" height="44" fill="${C.light}"/><circle cx="0" cy="-44" r="30" fill="${C.ink2}"/><g><g stroke="${C.white}" stroke-width="5">${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M0 -44L${(Math.cos(a * Math.PI / 180) * 24).toFixed(1)} ${(-44 + Math.sin(a * Math.PI / 180) * 24).toFixed(1)}"/>`).join('')}</g>${o.running ? '<animateTransform attributeName="transform" type="rotate" from="0 0 -44" to="360 0 -44" dur="2.5s" repeatCount="indefinite"/>' : ''}</g><circle cx="0" cy="-44" r="6" fill="${o.running ? C.ember : C.ink}"/>${win(-32, -20, 12, 10, o.lit)}${win(20, -20, 12, 10, o.lit)}`,
};

export function sprite(key, x, y, o = {}) {
  const fn = SPRITES[key] || SPRITES.site;
  let body = fn(o);
  let extra = '';
  if (o.hp != null && o.hp < 50) extra += `<path d="M-14 -30l6 8l-4 6l8 10" stroke="${C.ink}" stroke-width="1.5" fill="none"/>`;
  if (o.hp != null && o.hp < 25) extra += `<path d="M-30 0Q-10 -60 30 0Z" fill="${C.ink}" opacity=".25"/>`;
  const filter = o.off ? ' filter="url(#off)"' : '';
  const s = o.scale || 1;
  return `<g transform="translate(${x} ${y}) scale(${s})"${filter}>${body}${extra}</g>`;
}

// ---------- Cảnh thành phố ----------
const PLOT_X = {
  pump: [60, 150, 240, 340, 440, 530, 620, 720],
  harbor: [80, 210, 340, 470, 600, 720],
};

let UID = 0;
export function cityScene(s, { district = 'pump', night = false, compute } = {}) {
  const u = 'c' + (UID++);
  const season = seasonOf(s.day);
  const [top, bottom] = skyColors(night, season);
  const r = prng(1234 + (district === 'harbor' ? 77 : 0));
  const known = s.flags.heat_known;
  const heat = s.stats.heat;
  const pw = compute ? compute.power : { gen: 0, ratio: 0 };
  const dist = s.districts[district];
  let svg = `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" class="scene" role="img" aria-label="Toàn cảnh ${district === 'pump' ? 'Trạm Bơm' : 'Bến Cảng'}" data-u="${u}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${C.ember2}" stop-opacity=".45"/><stop offset="1" stop-color="${C.ember2}" stop-opacity="0"/></radialGradient>
    <radialGradient id="heat"><stop offset="0" stop-color="${C.ember}" stop-opacity=".35"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>
    <filter id="off"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer></filter>
  </defs>
  <rect width="800" height="400" fill="url(#sky)"/>`;
  svg += night ? `<circle cx="660" cy="70" r="22" fill="#d9d4c4" opacity=".85"/>` : `<circle cx="640" cy="${season === 'rain' ? 60 : 80}" r="34" fill="${season === 'rain' ? '#d8d4c8' : '#efe1c0'}" opacity="${season === 'rain' ? 0.4 : 0.9}"/>`;
  svg += `<g opacity="${night ? 0.9 : 0.45}">${skyline(r, 230, night ? '#0f1318' : C.ash, 16, 140)}</g>`;
  svg += `<g opacity="${night ? 0.95 : 0.7}">${skyline(r, 250, night ? '#14191f' : C.mid, 12, 90)}</g>`;
  // mặt đất và sông
  svg += `<rect x="0" y="250" width="800" height="80" fill="${night ? '#22272b' : season === 'rain' ? '#8f8c7e' : C.paper2}"/>`;
  svg += `<path d="M0 252Q200 244 400 254T800 250" stroke="${C.ink}" stroke-width="2" fill="none" opacity=".4"/>`;
  svg += `<rect x="0" y="330" width="800" height="70" fill="${night ? '#1b252c' : C.water}"/>`;
  for (let i = 0; i < 14; i++) svg += `<path d="M${(r() * 800).toFixed(0)} ${345 + r() * 45}h${20 + r() * 40}" stroke="${night ? '#3c4c57' : C.water2}" stroke-width="2" opacity=".7"/>`;
  if (s.flags.levee && district === 'harbor') svg += `<rect x="0" y="322" width="800" height="10" fill="#8a7a5c"/>`;

  // phông nền theo khu
  if (district === 'pump') {
    svg += `<g opacity="${night ? 0.95 : 1}"><rect x="250" y="150" width="300" height="100" fill="${night ? '#2e353b' : '#a9a69b'}"/><rect x="250" y="142" width="300" height="10" fill="${C.ink2}"/>`;
    svg += `<text x="400" y="175" text-anchor="middle" font-size="13" font-family="serif" fill="${C.ink}" opacity=".6">TRẠM BƠM SỐ 7</text>`;
    for (let i = 0; i < 6; i++) svg += win(270 + i * 46, 192, 20, 26, night && pw.gen > 0 && i % 2 === 0);
    svg += `<rect x="580" y="110" width="14" height="140" fill="${C.ink2}"/><rect x="560" y="80" width="54" height="40" rx="4" fill="${night ? '#2e353b' : C.mid}"/><path d="M587 80V60" stroke="${C.ink}" stroke-width="2"/>`;
    svg += `<path d="M560 230Q600 200 640 236" stroke="${C.moss}" stroke-width="6" fill="none" opacity=".6"/></g>`;
  } else {
    svg += `${[60, 200, 360, 520, 680].map((x) => `<rect x="${x}" y="318" width="6" height="30" fill="${C.ink2}"/>`).join('')}<rect x="0" y="316" width="800" height="5" fill="#6b5a44"/>`;
    svg += `<path d="M140 360q30 14 80 0z" fill="${C.ink2}"/><path d="M430 372q40 12 90 0z" fill="${C.ink2}"/>`;
  }

  // các ô công trình
  if (!dist.unlocked) {
    svg += `<g opacity=".8"><path d="M80 300l40 -30l30 30l50 -40l40 40l60 -20l40 20l70 -30l50 30l60 -26l50 26l60 -18l50 18Z" fill="${C.mid}"/><text x="400" y="230" text-anchor="middle" font-size="18" fill="${C.ink}" font-family="serif">${dist.clearing ? 'Đang dọn dẹp...' : 'Đổ nát. Chưa mở khu này.'}</text></g>`;
  } else {
    dist.plots.forEach((p, i) => {
      const x = PLOT_X[district][i];
      const y = 312;
      if (!p) { svg += sprite('empty', x, y); return; }
      const on = p.on !== false;
      const running = p.b === 'turbine' && on && compute && compute.power.genParts.some((g) => g.name === 'Tu-bin nước' && g.val > 0);
      const lit = night && on && pw.gen > 0;
      const key = p.build ? 'site' : p.b;
      const pct = p.build ? Math.min(99, Math.floor((p.build.progress / p.build.need) * 100)) : null;
      if (known && on && !p.build && ['turbine', 'workshop', 'hydro', 'clinic'].includes(p.b) && (p.b !== 'turbine' || running)) {
        svg += `<ellipse cx="${x}" cy="${y - 40}" rx="70" ry="60" fill="url(#heat)"/>`;
      }
      svg += sprite(key, x, y, { lit, on, night, running, hp: p.build ? null : p.hp, off: !on, pct, scale: district === 'harbor' ? 1.1 : 1 });
      if (p.build && p.b === 'turbine_broken') svg += sprite('turbine_broken', x, y, { scale: 0.6 });
    });
  }

  // màn đêm phủ nhẹ + lớp thời tiết
  if (night) svg += `<rect width="800" height="400" fill="#0b1015" opacity=".25"/>`;
  const tier = heatTier(heat);
  const ashCount = Math.round(8 + heat * 1.6 + (season === 'ash' ? 40 : 0));
  svg += ashLayer(ashCount, 99 + s.day);
  if (season === 'rain') svg += rainLayer(90, 7 + s.day);
  if (tier >= 2) svg += `<rect width="800" height="400" fill="${C.ash}" opacity="${tier === 3 ? 0.25 : 0.12}"/>`;
  svg += '</svg>';
  return svg.replace(/id="(sky|glow|heat|off)"/g, `id="$1-${u}"`).replace(/url\(#(sky|glow|heat|off)\)/g, `url(#$1-${u})`);
}

// ---------- Tranh sự kiện ----------
function base(top, bottom, ground = C.paper2, gy = 220) {
  return `<defs><linearGradient id="esky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient><radialGradient id="eglow"><stop offset="0" stop-color="${C.ember2}" stop-opacity=".6"/><stop offset="1" stop-color="${C.ember2}" stop-opacity="0"/></radialGradient></defs><rect width="800" height="300" fill="url(#esky)"/><rect y="${gy}" width="800" height="${300 - gy}" fill="${ground}"/>`;
}
const person = (x, y, s = 1, color = C.ink, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-52" r="9" fill="${color}"/><path d="M-11 -40Q0 -46 11 -40L14 -8H-14Z" fill="${color}"/><path d="M-8 -8L-9 0M8 -8L9 0" stroke="${color}" stroke-width="5"/>${extra}</g>`;
const water = (y = 230, night = false) => `<rect y="${y}" width="800" height="${300 - y}" fill="${night ? '#1b252c' : C.water}"/>${[...Array(10)].map((_, i) => `<path d="M${(i * 83) % 800} ${y + 15 + (i * 17) % 50}h${30 + (i * 7) % 30}" stroke="${night ? '#3c4c57' : C.water2}" stroke-width="2"/>`).join('')}`;

const EVENT_ART = {
  pump: () => base('#c4b59c', '#e6d8bd') + `<g opacity=".45">${skyline(prng(3), 220, C.ash, 16, 120)}</g><rect x="230" y="110" width="340" height="110" fill="#a9a69b"/><rect x="230" y="100" width="340" height="12" fill="${C.ink2}"/><rect x="370" y="160" width="60" height="60" fill="${C.ink2}"/>${person(330, 270, 0.8)}${person(370, 272, 0.85)}${person(410, 270, 0.8)}${person(450, 274, 0.9)}${person(490, 271, 0.75)}`,
  turbine: () => base('#262a2e', '#3b4148', '#2a2e33', 250) + `<g transform="translate(400 250) scale(2.6)">${SPRITES.turbine_broken()}</g>` + `<circle cx="250" cy="120" r="90" fill="url(#eglow)"/>${person(250, 280, 0.9, '#121416')}`,
  tower: () => base('#c9bba3', '#e8dcc4') + `<path d="M400 20L420 220H380Z" fill="${C.ink2}"/><path d="M386 120h28M383 160h34M390 80h20" stroke="${C.ink}" stroke-width="3"/><circle cx="400" cy="40" r="10" fill="${C.ink2}"/>${skyline(prng(9), 220, C.mid, 10, 60)}${ashLayer(60, 5, 800, 300)}`,
  child: () => base('#9d978c', '#c4bcae', C.paper2, 230) + `${person(400, 280, 0.75, C.ink, '<path d="M-11 -40L-40 -60M11 -40L40 -60" stroke="#2a2b2d" stroke-width="5"/>')}<circle cx="400" cy="200" r="120" fill="${C.crystal}" opacity=".15"/>${ashLayer(120, 11, 800, 300)}`,
  people: () => base('#c4b59c', '#e6d8bd') + `${[220, 280, 340, 470, 530, 590].map((x, i) => person(x, 270 + (i % 2) * 6, 0.9 + (i % 3) * 0.05)).join('')}<path d="M380 250h40" stroke="${C.ember}" stroke-width="4"/>`,
  storm: () => base('#7d7b75', '#a9a59b', '#8b877d', 230) + `<g opacity=".6">${skyline(prng(4), 230, C.mid, 16, 120)}</g>${ashLayer(260, 21, 800, 300)}<rect width="800" height="300" fill="${C.ash}" opacity=".25"/>`,
  ruins: () => base('#c4b59c', '#e3d6bc') + `${skyline(prng(12), 230, C.mid, 12, 150)}<path d="M100 300L180 230L260 260L340 220L420 250L520 210L620 260L720 230L800 300Z" fill="${C.ink2}"/>${person(560, 240, 0.8)}`,
  night: () => base('#121820', '#26303b', '#1d2329', 230) + water(240, true) + `<circle cx="640" cy="70" r="24" fill="#d9d4c4" opacity=".85"/>${person(380, 250, 0.95, '#0c0f12')}<circle cx="396" cy="208" r="5" fill="${C.crystal}"/>`,
  boat: () => base('#c4b59c', '#e6d8bd') + water(200) + `<path d="M260 210h260l-30 30h-200z" fill="${C.ink2}"/><path d="M380 210V130" stroke="${C.ink}" stroke-width="3"/><ellipse cx="380" cy="140" rx="12" ry="16" fill="${C.ember}"/><circle cx="380" cy="140" r="50" fill="url(#eglow)"/><path d="M560 230h140l-20 18h-100z" fill="${C.ink2}"/><ellipse cx="630" cy="200" rx="8" ry="11" fill="${C.ember}"/>${person(320, 210, 0.7)}`,
  rain: () => base('#7f878c', '#a9adab', '#8f8c7e', 230) + `${skyline(prng(14), 230, C.mid, 14, 110)}${rainLayer(220, 3, 800, 300)}`,
  flood: () => base('#7f878c', '#a9adab', C.water, 180) + water(180) + `${skyline(prng(15), 200, C.mid, 14, 110)}<rect x="0" y="175" width="800" height="12" fill="#8a7a5c"/>${rainLayer(150, 4, 800, 300)}${person(200, 180, 0.7)}`,
  gate: () => base('#bfae92', '#e1d1b2') + `<rect x="300" y="80" width="12" height="160" fill="${C.ink2}"/><rect x="488" y="80" width="12" height="160" fill="${C.ink2}"/>${[...Array(9)].map((_, i) => `<path d="M${318 + i * 19} 90V235" stroke="${C.ink}" stroke-width="3"/>`).join('')}<path d="M312 90H488" stroke="${C.ink}" stroke-width="4"/>${person(560, 270, 0.95, C.ink, `<circle cx="10" cy="-30" r="5" fill="${C.crystal}"/>`)}`,
  medtent: () => base('#c4b59c', '#e6d8bd') + `<g transform="translate(400 240) scale(2.6)">${SPRITES.medtent({})}</g>`,
  filter: () => base('#c4b59c', '#e6d8bd') + `<g transform="translate(400 240) scale(2.6)">${SPRITES.filter()}</g>`,
  firepit: () => base('#141a20', '#2b3540', '#1f252b', 230) + `<g transform="translate(400 250) scale(2.4)">${SPRITES.firepit({ night: true })}</g>${person(300, 260, 0.85, '#0c0f12')}${person(500, 262, 0.85, '#0c0f12')}${person(250, 266, 0.8, '#0c0f12')}${person(550, 268, 0.8, '#0c0f12')}`,
  fire: () => base('#7a4a2f', '#c47a46', '#4a3a2c', 230) + `${[...Array(14)].map((_, i) => `<path d="M${i * 60} 230Q${i * 60 + 10} ${130 - (i % 4) * 20} ${i * 60 + 30} ${100 - (i % 3) * 20}" stroke="${C.ink}" stroke-width="5" fill="none"/>`).join('')}<path d="M0 240Q200 140 400 200T800 180V300H0Z" fill="${C.ember}" opacity=".6"/>`,
  forest: () => base('#b9b49a', '#dcd5bb', '#6f7d5c', 230) + `${[...Array(18)].map((_, i) => `<path d="M${i * 46 + 10} 300Q${i * 46} 150 ${i * 46 + 20} ${40 + (i % 5) * 15}" stroke="${i % 2 ? C.moss : C.moss2}" stroke-width="6" fill="none"/>`).join('')}${person(400, 280, 0.9)}`,
  radio: () => base('#262a2e', '#3b4148', '#2a2e33', 230) + `<rect x="320" y="150" width="160" height="80" rx="8" fill="${C.ink2}"/><circle cx="360" cy="190" r="22" fill="${C.ink}"/><rect x="400" y="170" width="60" height="16" fill="${C.ember2}" opacity=".8"/><path d="M460 150L500 90" stroke="${C.ink}" stroke-width="3"/><path d="M510 110q20 -20 0 -40M530 120q34 -34 0 -68" stroke="${C.ember2}" fill="none" opacity=".6"/>`,
  river: () => base('#c4b59c', '#e6d8bd') + water(170) + `${[...Array(30)].map((_, i) => `<path d="M${(i * 53) % 800} ${190 + (i * 29) % 100}l14 -4l-14 -4z" fill="${C.light}" opacity=".8"/>`).join('')}`,
  school: () => base('#c4b59c', '#e6d8bd') + `<rect x="200" y="90" width="400" height="130" fill="#b2a58a"/><path d="M190 90H610L560 60H240Z" fill="${C.ink2}"/>${[...Array(6)].map((_, i) => win(225 + i * 62, 120, 30, 34, false)).join('')}<path d="M200 220Q260 150 320 220M480 220Q540 120 600 220" fill="${C.moss}" opacity=".7"/><path d="M660 220V120" stroke="#5a4a38" stroke-width="6"/><ellipse cx="660" cy="110" rx="50" ry="36" fill="${C.ember}" opacity=".8"/>`,
  hospital: () => base('#a8a397', '#cfc7b6') + `<rect x="220" y="40" width="360" height="180" fill="#bdb7a8"/>${[...Array(7)].map((_, r) => [...Array(8)].map((_, c) => win(236 + c * 42, 52 + r * 24, 20, 14, false)).join('')).join('')}<rect x="370" y="180" width="60" height="40" fill="${C.ink}"/><path d="M372 220q30 -60 56 0" fill="${C.ash}" opacity=".9"/>`,
  market: () => base('#c4b59c', '#e6d8bd') + water(190) + `${[120, 280, 440, 600].map((x, i) => `<path d="M${x} ${200 + i * 6}h120l-18 22h-84z" fill="${C.ink2}"/><path d="M${x + 30} ${200 + i * 6}l30 -30l30 30" fill="#8a7a5c"/>`).join('')}`,
  ship: () => base('#bfb5a0', '#e1d6bf') + water(210) + `<g transform="rotate(-8 400 200)"><path d="M140 210h520l-40 50H180z" fill="${C.ink2}"/>${[...Array(8)].map((_, i) => `<rect x="${200 + i * 52}" y="${170 - (i % 3) * 22}" width="48" height="${40 + (i % 3) * 22}" fill="${[C.rust, '#6f7d74', '#8a7a5c'][i % 3]}"/>`).join('')}<rect x="590" y="120" width="40" height="90" fill="${C.light}"/></g>`,
};

export function eventArt(key) {
  const fn = EVENT_ART[key] || EVENT_ART.ruins;
  const u = 'e' + (UID++);
  const svg = `<svg viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg" class="event-art" role="img" aria-label="Minh họa">${fn()}</svg>`;
  return svg.replace(/url\(#glow\)/g, 'url(#eglow)').replace(/id="(esky|eglow)"/g, `id="$1-${u}"`).replace(/url\(#(esky|eglow)\)/g, `url(#$1-${u})`);
}

// ---------- Chân dung cư dân ----------
const SKIN = ['#e3c4a2', '#d4ae88', '#c29a72', '#a87e5a', '#8d6647'];
const HAIR = ['#1d1a18', '#2e2620', '#3d2f24', '#4a3a2a'];
const CLOTH = ['#5f7a4c', '#6d6f71', '#8a5a3e', '#4f6672', '#7a8466', '#8a7a5c'];

export function portrait(c, size = 64) {
  const r = prng(c.portrait || 1);
  const skin = SKIN[Math.floor(r() * SKIN.length)];
  const hairC = c.age > 55 ? '#bdb9b0' : HAIR[Math.floor(r() * HAIR.length)];
  const cloth = CLOTH[Math.floor(r() * CLOTH.length)];
  const bg = ['#cfc5b1', '#c4bca8', '#d6ccb6', '#bfb6a2'][Math.floor(r() * 4)];
  const child = c.age < 14;
  const hs = Math.floor(r() * 4);
  const headR = child ? 13 : 15;
  const hy = child ? 34 : 30;
  let hair = '';
  if (c.gender === 'f') {
    hair = [
      `<path d="M${32 - headR - 2} ${hy}Q32 ${hy - headR - 10} ${32 + headR + 2} ${hy}V${hy + 20}H${32 + headR - 4}V${hy}H${32 - headR + 4}V${hy + 20}H${32 - headR - 2}Z" fill="${hairC}"/>`,
      `<path d="M${32 - headR} ${hy - 2}Q32 ${hy - headR - 8} ${32 + headR} ${hy - 2}Q32 ${hy - 8} ${32 - headR} ${hy - 2}Z" fill="${hairC}"/><circle cx="${32 + headR}" cy="${hy - 10}" r="6" fill="${hairC}"/>`,
      `<path d="M${32 - headR - 1} ${hy + 6}Q${32 - headR} ${hy - headR - 6} 32 ${hy - headR - 3}Q${32 + headR} ${hy - headR - 6} ${32 + headR + 1} ${hy + 6}L${32 + headR - 3} ${hy - 2}Q32 ${hy - 10} ${32 - headR + 3} ${hy - 2}Z" fill="${hairC}"/>`,
      `<path d="M${32 - headR} ${hy - 1}Q32 ${hy - headR - 9} ${32 + headR} ${hy - 1}Q32 ${hy - 7} ${32 - headR} ${hy - 1}Z" fill="${hairC}"/><path d="M${32 - headR + 2} ${hy}V${hy + 26}" stroke="${hairC}" stroke-width="6"/>`,
    ][hs];
  } else {
    hair = [
      `<path d="M${32 - headR} ${hy - 2}Q32 ${hy - headR - 8} ${32 + headR} ${hy - 2}Q32 ${hy - 9} ${32 - headR} ${hy - 2}Z" fill="${hairC}"/>`,
      `<path d="M${32 - headR + 1} ${hy - 4}Q32 ${hy - headR - 4} ${32 + headR - 1} ${hy - 4}" stroke="${hairC}" stroke-width="5" fill="none"/>`,
      `<rect x="${32 - headR - 2}" y="${hy - headR - 2}" width="${headR * 2 + 4}" height="8" rx="3" fill="${cloth}"/><rect x="${32 - headR - 6}" y="${hy - headR + 4}" width="${headR * 2 + 12}" height="3" fill="${cloth}"/>`,
      `<path d="M${32 - headR} ${hy - 3}Q32 ${hy - headR - 10} ${32 + headR} ${hy - 3}L${32 + headR - 4} ${hy - 6}L${32 + 4} ${hy - 4}L${32 - 4} ${hy - 7}Z" fill="${hairC}"/>`,
    ][hs];
  }
  let crystal = '';
  if (c.ash >= 40) {
    const n = c.ash >= 80 ? 5 : c.ash >= 60 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const x = 32 + (r() - 0.5) * 22, y = hy + (r() - 0.2) * 16;
      crystal += `<path d="M${x} ${y - 3}l2.5 3l-2.5 3l-2.5 -3z" fill="${C.crystal}" stroke="#eef5f8" stroke-width=".5"/>`;
    }
  }
  const beard = c.gender === 'm' && c.age > 35 && r() < 0.4 ? `<path d="M${32 - 8} ${hy + 6}Q32 ${hy + 18} ${32 + 8} ${hy + 6}" fill="${hairC}" opacity=".8"/>` : '';
  const special = c.special === 'ty' ? `<circle cx="32" cy="${hy}" r="${headR + 6}" fill="none" stroke="${C.crystal}" stroke-width="1.5" opacity=".7"/>` : '';
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="portrait${c.alive ? '' : ' dead'}" role="img" aria-label="${c.name}">
<rect width="64" height="64" rx="10" fill="${bg}"/>${special}
<path d="M${child ? 14 : 10} 64Q${child ? 14 : 10} ${hy + 20} 32 ${hy + 18}Q${child ? 50 : 54} ${hy + 20} ${child ? 50 : 54} 64Z" fill="${cloth}"/>
<rect x="28" y="${hy + 10}" width="8" height="8" fill="${skin}"/>
<circle cx="32" cy="${hy}" r="${headR}" fill="${skin}"/>${hair}${beard}
<circle cx="${32 - 5}" cy="${hy + 1}" r="1.6" fill="${C.ink}"/><circle cx="${32 + 5}" cy="${hy + 1}" r="1.6" fill="${C.ink}"/>
<path d="M${32 - 4} ${hy + 8}Q32 ${hy + (c.mood > 55 ? 11 : c.mood < 35 ? 6 : 9)} ${32 + 4} ${hy + 8}" stroke="${C.ink}" stroke-width="1.3" fill="none"/>${crystal}</svg>`;
}
