// Stage engine: draws the video at any time t (seconds). The render loop calls
// window.renderAt(t) once per frame, in order. Everything visual is a function of t;
// events (clicks, state changes in the Artifact) run once, when t first passes them.

import { build } from './timeline.js';

const W = 1920;
const H = 1080;
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, p) => a + (b - a) * p;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function waitFor(fn, ms = 20000) {
  const t0 = performance.now();
  while (!fn()) {
    if (performance.now() - t0 > ms) throw new Error(`timed out waiting for ${fn}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

// ---------- Frames (the two copies of the Artifact) ----------

const frames = {};

async function loadFrame(id) {
  const el = document.getElementById(id);
  await waitFor(() => el.contentWindow && el.contentWindow.__ll && el.contentWindow.__ll.state.sampleChecked);
  const win = el.contentWindow;
  const doc = el.contentDocument;
  await doc.fonts.ready;
  const layer = doc.createElement('div');
  layer.id = 'vid-layer';
  doc.body.appendChild(layer);
  frames[id] = { id, el, win, doc, layer, ll: win.__ll, cam: { cx: W / 2, cy: H / 2, z: 1 } };
}

// ---------- Finding things on the page ----------

function normChar(c) {
  if (/\s/.test(c)) return ' ';
  if (c === '‘' || c === '’') return "'";
  if (c === '“' || c === '”') return '"';
  return c;
}

// First visible occurrence of `text` under `root`, as a Range. Quotes and spaces are normalised.
function findRange(doc, root, text) {
  const target = [...text.replace(/\s+/g, ' ')].map(normChar).join('');
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let s = '';
  const map = [];
  let lastSpace = true;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const v = n.nodeValue;
    for (let i = 0; i < v.length; i++) {
      const c = normChar(v[i]);
      if (c === ' ' && lastSpace) continue;
      s += c;
      map.push([n, i]);
      lastSpace = c === ' ';
    }
  }
  for (let from = 0; ;) {
    const at = s.indexOf(target, from);
    if (at < 0) return null;
    const [sn, so] = map[at];
    const [en, eo] = map[at + target.length - 1];
    const r = doc.createRange();
    r.setStart(sn, so);
    r.setEnd(en, eo + 1);
    if (r.getClientRects().length) return r;
    from = at + 1;
  }
}

function resolve(frame, x) {
  const f = frames[frame];
  if (typeof x === 'function') return x();
  if (typeof x === 'string') return f.doc.querySelector(x);
  return x;
}

const api = {
  frames,
  q(frame, sel, i = 0) {
    return frames[frame].doc.querySelectorAll(sel)[i] || null;
  },
  // A heading (or any element) by its visible text.
  byText(frame, sel, text, scope) {
    const root = resolve(frame, scope) || frames[frame].doc;
    return [...root.querySelectorAll(sel)].find((e) => e.textContent.trim().startsWith(text) && e.getClientRects().length) || null;
  },
  phrase(frame, text, scope) {
    const root = resolve(frame, scope) || frames[frame].doc.body;
    return root ? findRange(frames[frame].doc, root, text) : null;
  },
  rect(target, frame = 'page') {
    if (!target) return null;
    if (typeof target === 'string') return api.rect(frames[frame].doc.querySelector(target), frame);
    if (typeof target === 'function') return api.rect(target(), frame);
    if ('w' in target) return target;
    const list = [...target.getClientRects()].filter((r) => r.width && r.height);
    if (!list.length) return null;
    const x = Math.min(...list.map((r) => r.left));
    const y = Math.min(...list.map((r) => r.top));
    return { x, y, w: Math.max(...list.map((r) => r.right)) - x, h: Math.max(...list.map((r) => r.bottom)) - y };
  },
  union(...targets) {
    const rs = targets.map((t) => api.rect(t)).filter(Boolean);
    if (!rs.length) return null;
    const x = Math.min(...rs.map((r) => r.x));
    const y = Math.min(...rs.map((r) => r.y));
    return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
  },
};

// One rectangle per line of text.
function lineRects(target) {
  const out = [];
  for (const r of target.getClientRects()) {
    if (!r.width || !r.height) continue;
    const line = out.find((o) => Math.abs(o.y - r.top) < 4);
    if (line) {
      const right = Math.max(line.x + line.w, r.right);
      line.x = Math.min(line.x, r.left);
      line.w = right - line.x;
      line.h = Math.max(line.h, r.height);
    } else out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return out;
}

// ---------- Camera ----------

function pads(p) {
  if (Array.isArray(p)) return p;
  return [p, p, p, p];
}

function camValue(spec, frame) {
  if (spec.c) return { cx: spec.c[0], cy: spec.c[1], z: spec.z };
  const r = api.rect(spec.target, frame);
  if (!r) return spec._last || { cx: W / 2, cy: H / 2, z: 1 };
  const [pt, pr, pb, pl] = pads(spec.pad ?? 80);
  const aw = W - pl - pr;
  const ah = H - pt - pb;
  let z = spec.fit === 'width' ? aw / r.w : Math.min(aw / r.w, ah / r.h);
  z = Math.min(z, spec.zmax ?? 2.2);
  const cx = r.x + r.w / 2 - (pl + aw / 2 - W / 2) / z;
  let cy = r.y + r.h / 2 - (pt + ah / 2 - H / 2) / z;
  if (r.h * z > ah) cy = r.y + (H / 2 - pt) / z; // taller than the frame: show its top
  spec._last = { cx, cy, z };
  return spec._last;
}

function camAt(keys, t, frame) {
  let i = -1;
  for (let k = 0; k < keys.length; k++) if (keys[k].t <= t) i = k;
  if (i < 0) return keys.length ? camValue(keys[0], frame) : { cx: W / 2, cy: H / 2, z: 1 };
  const cur = camValue(keys[i], frame);
  const p = clamp01((t - keys[i].t) / (keys[i].dur ?? 1.2));
  if (i === 0 || p >= 1) return cur;
  const prev = camAt(keys.slice(0, i), keys[i].t, frame);
  const e = ease(p);
  return { cx: lerp(prev.cx, cur.cx, e), cy: lerp(prev.cy, cur.cy, e), z: Math.exp(lerp(Math.log(prev.z), Math.log(cur.z), e)) };
}

function toStage(frame, x, y) {
  const c = frames[frame].cam;
  return [(x - c.cx) * c.z + W / 2, (y - c.cy) * c.z + H / 2];
}

// ---------- Timeline state ----------

let tl;
let nextEvent = 0;
const overlayEls = [];

function setupOverlays() {
  const ov = document.getElementById('ov');
  for (const o of tl.overlays) {
    const el = document.createElement('div');
    el.className = `o ${o.cls || ''}`;
    el.textContent = o.text;
    Object.assign(el.style, { left: `${o.x}px`, top: `${o.y}px`, display: 'none' }, o.style || {});
    if (o.w) el.style.width = `${o.w}px`;
    ov.appendChild(el);
    overlayEls.push(el);
  }
}

function drawOverlays(t) {
  tl.overlays.forEach((o, i) => {
    const el = overlayEls[i];
    const until = o.until ?? Infinity;
    if (t < o.t || t > until + 0.45) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    const p = clamp01((t - o.t) / (o.dur ?? 0.8));
    const out = t > until ? 1 - (t - until) / 0.45 : 1;
    const shift = `translate(-50%, ${(1 - ease(p)) * 14}px)`;
    el.style.transform = shift;
    if (o.write) {
      const edge = p * 130;
      el.style.webkitMaskImage = el.style.maskImage = `linear-gradient(90deg, #000 ${edge - 30}%, transparent ${edge}%)`;
      el.style.opacity = String(out);
    } else {
      el.style.opacity = String(ease(p) * out);
    }
    if (o.on) el.classList.toggle('on', t >= o.on[0] && t < o.on[1]);
  });
}

function drawHighlights(t) {
  for (const h of tl.highlights) {
    const f = frames[h.frame];
    const st = h._st || (h._st = { divs: [], target: null });
    const until = h.until ?? Infinity;
    const on = t >= h.t && t < until + 0.35;
    if (!on) {
      st.divs.forEach((d) => { d.style.display = 'none'; });
      continue;
    }
    if (!st.target || !st.target.startContainer?.isConnected && !st.target.isConnected) {
      let target = h.target();
      if (target && h.bold && target instanceof f.win.Range) {
        const strong = f.doc.createElement('strong');
        strong.className = 'vid-bold';
        target.surroundContents(strong);
        target = strong;
      }
      st.target = target;
    }
    if (!st.target) continue;
    const lines = lineRects(st.target);
    const total = lines.reduce((s, l) => s + l.w, 0);
    let shown = ease(clamp01((t - h.t) / (h.dur ?? 1))) * total;
    const opacity = t > until ? 1 - (t - until) / 0.35 : 1;
    lines.forEach((l, i) => {
      let d = st.divs[i];
      if (!d) {
        d = f.doc.createElement('div');
        d.className = 'vid-hl';
        f.layer.appendChild(d);
        st.divs[i] = d;
      }
      const w = Math.max(0, Math.min(l.w, shown));
      shown -= l.w;
      Object.assign(d.style, {
        display: w > 0 ? 'block' : 'none', left: `${l.x - 4}px`, top: `${l.y + 2}px`,
        width: `${w + 8}px`, height: `${l.h - 2}px`, opacity: String(opacity),
      });
    });
    st.divs.slice(lines.length).forEach((d) => { d.style.display = 'none'; });
  }
}

function drawSpotlights(t) {
  for (const s of tl.spotlights) {
    const f = frames[s.frame];
    if (!s._el) {
      s._el = f.doc.createElement('div');
      s._el.className = 'vid-spot';
      f.layer.appendChild(s._el);
    }
    const inP = clamp01((t - s.t) / 0.45);
    const outP = clamp01((t - s.until) / 0.45);
    const r = t >= s.t && outP < 1 ? api.rect(s.target, s.frame) : null;
    if (!r) {
      s._el.style.display = 'none';
      continue;
    }
    const pad = s.pad ?? 18;
    Object.assign(s._el.style, {
      display: 'block', left: `${r.x - pad}px`, top: `${r.y - pad}px`, width: `${r.w + 2 * pad}px`,
      height: `${r.h + 2 * pad}px`, opacity: String(ease(inP) * (1 - ease(outP))),
    });
  }
}

function drawCursor(t) {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('ring');
  const seg = tl.cursor.find((s) => t >= s.from - 0.3 && t <= s.to + 0.3);
  ring.style.opacity = '0';
  if (!seg) {
    cursor.style.opacity = '0';
    return;
  }
  const point = (m) => {
    const r = api.rect(m.target, m.frame);
    if (!r) return seg.start;
    return toStage(m.frame, r.x + r.w * (m.at?.[0] ?? 0.5), r.y + r.h * (m.at?.[1] ?? 0.5));
  };
  let pos = seg.start;
  let scale = 1;
  for (const m of seg.moves) {
    if (t < m.t) break;
    const target = point(m);
    const dur = m.dur ?? 0.7;
    const p = clamp01((t - m.t) / dur);
    pos = [lerp(pos[0], target[0], ease(p)), lerp(pos[1], target[1], ease(p))];
    const since = t - m.t - dur;
    if (m.click !== false && since >= 0 && since < 0.45) {
      const q = since / 0.45;
      scale = 1 - 0.18 * Math.sin(Math.PI * Math.min(1, q * 2));
      Object.assign(ring.style, {
        left: `${target[0]}px`, top: `${target[1]}px`, opacity: String(0.8 * (1 - q)),
        transform: `scale(${0.4 + q})`,
      });
    }
  }
  const fadeIn = clamp01((t - seg.from) / 0.3);
  const fadeOut = clamp01((seg.to - t) / 0.3);
  cursor.style.opacity = String(Math.min(fadeIn, fadeOut));
  cursor.style.transform = `translate(${pos[0] - 6.7}px, ${pos[1] - 3.3}px) scale(${scale})`;
  cursor.style.transformOrigin = '6.7px 3.3px';
}

function seekAnims(t) {
  const anims = frames.intro.win.__anims;
  for (const track of tl.anims) {
    const keys = track.keys;
    if (t < keys[0][0]) continue;
    let ms = keys[keys.length - 1][1];
    for (let k = 1; k < keys.length; k++) {
      if (t < keys[k][0]) {
        const [t0, m0] = keys[k - 1];
        const [t1, m1] = keys[k];
        ms = lerp(m0, m1, (t - t0) / (t1 - t0));
        break;
      }
    }
    for (const a of anims) {
      if (a.__group === track.group && a.playState === 'paused') a.currentTime = ms;
    }
  }
}

function frameOpacity(t) {
  let v = 1;
  for (const k of tl.introOpacity) {
    if (t < k.t) break;
    const p = k.dur ? clamp01((t - k.t) / k.dur) : 1;
    v = lerp(v, k.v, p);
  }
  frames.intro.el.style.opacity = String(v);
  frames.intro.el.style.visibility = v <= 0.001 ? 'hidden' : 'visible';
  frames.page.el.style.visibility = v >= 0.999 ? 'hidden' : 'visible';
}

function fitPageFrame() {
  const f = frames.page;
  const h = Math.max(4000, f.doc.documentElement.scrollHeight + 200);
  if (Math.abs(parseFloat(f.el.style.height || 0) - h) > 1) f.el.style.height = `${h}px`;
}

async function renderAt(t) {
  while (nextEvent < tl.events.length && tl.events[nextEvent].t <= t) {
    await tl.events[nextEvent].run(api);
    nextEvent++;
    await tick();
    await tick();
    fitPageFrame();
  }
  seekAnims(t);
  frameOpacity(t);
  for (const track of tl.tracks) track(t, api);
  for (const id of ['intro', 'page']) {
    const f = frames[id];
    f.cam = camAt(tl.camera[id], t, id);
    f.el.style.transform = `translate(${W / 2 - f.cam.cx * f.cam.z}px, ${H / 2 - f.cam.cy * f.cam.z}px) scale(${f.cam.z})`;
  }
  drawHighlights(t);
  drawSpotlights(t);
  drawOverlays(t);
  drawCursor(t);
  document.getElementById('fade').style.opacity = String(clamp01((t - tl.fadeOut.t) / tl.fadeOut.dur));
}

async function boot() {
  await Promise.all([loadFrame('intro'), loadFrame('page')]);
  await waitFor(() => frames.intro.win.__anims.length > 0); // the intro's opening has been created
  await Promise.all(['400 80px "Instrument Serif"', 'italic 400 80px "Instrument Serif"', '400 40px "Open Sans"', '600 30px "Open Sans"']
    .map((f) => document.fonts.load(f)));
  tl = await build(api);
  tl.events.sort((a, b) => a.t - b.t);
  setupOverlays();
  fitPageFrame();
  window.renderAt = renderAt;
  window.__duration = tl.duration;
  window.__holds = tl.holds;
  window.__ready = true;
}

boot().catch((e) => {
  window.__error = String(e && e.stack || e);
});
