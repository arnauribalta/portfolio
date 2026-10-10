// Grafo neuronal animado (portada de «Segundo cerebro»): notas y enlaces al estilo de la
// vista de grafo de Obsidian sobre un tejido de neuronas que late, como en la app original
// (vis-network + fondo-neuronal.js), pero sin dependencias y con los colores de la web.
// Es decorativo: a 30 fps, parado fuera de pantalla o con la pestaña oculta, y quieto con
// prefers-reduced-motion. Pasar el ratón por un nodo enciende sus vecinos; se puede arrastrar.

const FPS = 30;
const MS_PER_FRAME = 1000 / FPS;
const PULSE_EVERY = 1100; // ms entre disparos nuevos
const PULSE_TIME = 850; // ms que tarda una chispa en recorrer un enlace
const MAX_PULSES = 5;
const MAX_HOPS = 3; // saltos encadenados de una misma descarga
const FABRIC_SPEED = 5; // px por segundo, como en el fondo de la app
const FABRIC_AREA = 26000; // un punto del tejido cada 26.000 px²

const REPULSION = 140;
const SPRING = 0.03;
const GRAVITY = 0.006;
const DAMPING = 0.82;
const WANDER = 0.018;

type Kind = "index" | "hub" | "note";
type GraphNode = { x: number; y: number; vx: number; vy: number; r: number; kind: Kind; phase: number; glow: number };
type Pulse = { from: number; to: number; start: number; hops: number };
type FabricPoint = { x: number; y: number; vx: number; vy: number; r: number; phase: number };

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Generador con semilla: el grafo sale siempre igual
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Un índice, siete áreas y sus notas, con enlaces cruzados entre áreas
function buildGraph() {
  const rand = seeded(7);
  const nodes: GraphNode[] = [];
  const edges: [number, number][] = [];
  const add = (kind: Kind) => {
    nodes.push({ x: (rand() - 0.5) * 300, y: (rand() - 0.5) * 150, vx: 0, vy: 0, r: 0, kind, phase: rand() * Math.PI * 2, glow: 0 });
    return nodes.length - 1;
  };

  const index = add("index");
  const areas: number[][] = [];
  for (let h = 0; h < 7; h += 1) {
    const hub = add("hub");
    edges.push([index, hub]);
    const notes: number[] = [];
    const count = 4 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i += 1) {
      const note = add("note");
      edges.push([hub, note]);
      notes.push(note);
      if (rand() < 0.3) {
        const sub = add("note");
        edges.push([note, sub]);
        notes.push(sub);
      }
    }
    areas.push(notes);
  }
  for (let i = 0; i < 12; i += 1) {
    const a = Math.floor(rand() * areas.length);
    const b = (a + 1 + Math.floor(rand() * (areas.length - 1))) % areas.length;
    edges.push([areas[a][Math.floor(rand() * areas[a].length)], areas[b][Math.floor(rand() * areas[b].length)]]);
  }

  const neighbors = nodes.map(() => new Set<number>());
  for (const [a, b] of edges) {
    neighbors[a].add(b);
    neighbors[b].add(a);
  }
  nodes.forEach((node, i) => {
    node.r = node.kind === "index" ? 7 : node.kind === "hub" ? 5.5 : 1.8 + Math.sqrt(neighbors[i].size) * 0.9;
  });
  return { nodes, edges, neighbors };
}

function rgb(value: string, fallback: string) {
  const hex = (value.trim() || fallback).replace("#", "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? "160,160,160" : `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function createGraph(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const css = getComputedStyle(document.documentElement);
  const colors = {
    hub: rgb(css.getPropertyValue("--text-title"), "#dbdbdb"),
    note: rgb(css.getPropertyValue("--text-muted"), "#9e9e9e"),
    fabric: rgb(css.getPropertyValue("--text-faint"), "#8c8c8c"),
    spark: rgb(css.getPropertyValue("--text-strong"), "#ffffff"),
  };

  const { nodes, edges, neighbors } = buildGraph();
  let width = 1;
  let height = 1;
  let aspect = 2.5;
  // Transformación mundo → lienzo (se suaviza para que el encuadre no dé saltos).
  // Puede estirar un poco en un eje para llenar la franja, nunca más de MAX_STRETCH.
  const MAX_STRETCH = 1.45;
  let scaleX = 1;
  let scaleY = 1;
  let offsetX = 0;
  let offsetY = 0;
  let fabric: FabricPoint[] = [];
  let fabricLink = 140;
  let pulses: Pulse[] = [];
  let lastPulse = 0;
  let lastFrame = 0;
  let rafId: number | null = null;
  let visible = false;
  let hovered = -1;
  let dragging = -1;

  function tick(t: number, wander: boolean) {
    const n = nodes.length;
    for (let i = 0; i < n; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j += 1) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 4);
        const d = Math.sqrt(d2);
        const f = REPULSION / d2;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
    }
    for (const [i, j] of edges) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const length = a.kind === "index" || b.kind === "index" ? 70 : a.kind === "hub" || b.kind === "hub" ? 30 : 24;
      const f = (d - length) * SPRING;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    }
    // Gravedad más floja en horizontal: el grafo se estira hasta llenar la franja
    nodes.forEach((p, i) => {
      if (i === dragging) {
        p.vx = p.vy = 0;
        return;
      }
      p.vx -= (p.x * GRAVITY) / aspect;
      p.vy -= p.y * GRAVITY;
      if (wander) {
        p.vx += Math.cos(t / 2300 + p.phase) * WANDER;
        p.vy += Math.sin(t / 2900 + p.phase) * WANDER;
      }
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;
    });
  }

  function fit(smooth: boolean) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of nodes) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const pad = Math.max(24, Math.min(width, height) * 0.12);
    const fitX = (width - pad * 2) / Math.max(1, maxX - minX);
    const fitY = (height - pad * 2) / Math.max(1, maxY - minY);
    const s = Math.min(fitX, fitY);
    const tx = Math.min(fitX, s * MAX_STRETCH);
    const ty = Math.min(fitY, s * MAX_STRETCH);
    const ox = width / 2 - ((minX + maxX) / 2) * tx;
    const oy = height / 2 - ((minY + maxY) / 2) * ty;
    const k = smooth ? 0.04 : 1;
    scaleX += (tx - scaleX) * k;
    scaleY += (ty - scaleY) * k;
    offsetX += (ox - offsetX) * k;
    offsetY += (oy - offsetY) * k;
  }

  const sx = (p: GraphNode) => offsetX + p.x * scaleX;
  const sy = (p: GraphNode) => offsetY + p.y * scaleY;

  function seedFabric() {
    const count = Math.round(Math.max(10, Math.min(40, (width * height) / FABRIC_AREA)));
    fabricLink = Math.max(70, Math.min(150, Math.hypot(width, height) / 7));
    const rand = seeded(11);
    fabric = Array.from({ length: count }, () => {
      const angle = rand() * Math.PI * 2;
      return {
        x: rand() * width,
        y: rand() * height,
        vx: Math.cos(angle) * FABRIC_SPEED,
        vy: Math.sin(angle) * FABRIC_SPEED,
        r: 0.8 + rand() * 1.2,
        phase: rand() * Math.PI * 2,
      };
    });
  }

  function hexagon(x: number, y: number, r: number) {
    ctx!.beginPath();
    for (let k = 0; k < 6; k += 1) {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      ctx!.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx!.closePath();
  }

  function draw(t: number) {
    const c = ctx!;
    c.clearRect(0, 0, width, height);
    const focus = hovered >= 0 ? hovered : dragging;
    const lit = focus >= 0 ? new Set([focus, ...neighbors[focus]]) : null;

    // Tejido de fondo: puntos que derivan y se unen cuando están cerca
    c.lineWidth = 1;
    c.strokeStyle = `rgba(${colors.fabric},.07)`;
    c.beginPath();
    for (let i = 0; i < fabric.length; i += 1) {
      for (let j = i + 1; j < fabric.length; j += 1) {
        const a = fabric[i];
        const b = fabric[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) > fabricLink) continue;
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
      }
    }
    c.stroke();
    for (const p of fabric) {
      c.fillStyle = `rgba(${colors.fabric},${(0.25 + 0.1 * Math.sin(t / 1400 + p.phase)).toFixed(3)})`;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    }

    // Enlaces del grafo
    c.strokeStyle = `rgba(${colors.note},${lit ? 0.07 : 0.28})`;
    c.beginPath();
    for (const [i, j] of edges) {
      if (lit && lit.has(i) && lit.has(j) && (i === focus || j === focus)) continue;
      c.moveTo(sx(nodes[i]), sy(nodes[i]));
      c.lineTo(sx(nodes[j]), sy(nodes[j]));
    }
    c.stroke();
    if (lit) {
      c.strokeStyle = `rgba(${colors.spark},.6)`;
      c.beginPath();
      for (const j of neighbors[focus]) {
        c.moveTo(sx(nodes[focus]), sy(nodes[focus]));
        c.lineTo(sx(nodes[j]), sy(nodes[j]));
      }
      c.stroke();
    }

    // Chispas que recorren los enlaces
    for (const pulse of pulses) {
      const a = nodes[pulse.from];
      const b = nodes[pulse.to];
      const progress = Math.min(1, (t - pulse.start) / PULSE_TIME);
      const x = sx(a) + (sx(b) - sx(a)) * progress;
      const y = sy(a) + (sy(b) - sy(a)) * progress;
      const glow = c.createRadialGradient(x, y, 0, x, y, 7);
      glow.addColorStop(0, `rgba(${colors.spark},${(0.9 * Math.sin(progress * Math.PI) + 0.1).toFixed(3)})`);
      glow.addColorStop(1, `rgba(${colors.spark},0)`);
      c.fillStyle = glow;
      c.beginPath();
      c.arc(x, y, 7, 0, Math.PI * 2);
      c.fill();
    }

    // Nodos: índice y áreas en hexágono (como en la app), notas en punto; respiran despacio
    const size = Math.max(0.75, Math.min(1.25, Math.min(scaleX, scaleY)));
    nodes.forEach((p, i) => {
      const dim = lit && !lit.has(i);
      const breath = 1 + 0.06 * Math.sin(t / 1400 + p.phase);
      const r = p.r * size * breath;
      const color = p.kind === "note" ? colors.note : colors.hub;
      const alpha = dim ? 0.15 : p.kind === "note" ? 0.85 : 1;
      if (p.glow > 0.01 && !dim) {
        c.fillStyle = `rgba(${colors.spark},${(0.35 * p.glow).toFixed(3)})`;
        c.beginPath();
        c.arc(sx(p), sy(p), r + 6 * p.glow, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = i === focus ? `rgba(${colors.spark},1)` : `rgba(${color},${alpha})`;
      if (p.kind === "note") {
        c.beginPath();
        c.arc(sx(p), sy(p), r, 0, Math.PI * 2);
      } else {
        hexagon(sx(p), sy(p), r * 1.15);
      }
      c.fill();
    });
  }

  function step(t: number) {
    rafId = window.requestAnimationFrame(step);
    const elapsed = t - lastFrame;
    if (elapsed < MS_PER_FRAME) return;
    const seconds = Math.min(elapsed, 100) / 1000;
    lastFrame = t;

    tick(t, true);
    fit(true);
    for (const p of fabric) {
      p.x += p.vx * seconds;
      p.y += p.vy * seconds;
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;
    }
    for (const p of nodes) p.glow *= 0.92;

    // Al llegar, la chispa enciende la nota y a veces sigue hacia un vecino
    const arrived = pulses.filter((pulse) => t - pulse.start >= PULSE_TIME);
    pulses = pulses.filter((pulse) => t - pulse.start < PULSE_TIME);
    for (const pulse of arrived) {
      nodes[pulse.to].glow = 1;
      const next = [...neighbors[pulse.to]].filter((n) => n !== pulse.from);
      if (pulse.hops < MAX_HOPS && next.length && Math.random() < 0.7 && pulses.length < MAX_PULSES) {
        pulses.push({ from: pulse.to, to: next[Math.floor(Math.random() * next.length)], start: t, hops: pulse.hops + 1 });
      }
    }
    if (t - lastPulse > PULSE_EVERY && pulses.length < MAX_PULSES) {
      const [a, b] = edges[Math.floor(Math.random() * edges.length)];
      pulses.push(Math.random() < 0.5 ? { from: a, to: b, start: t, hops: 0 } : { from: b, to: a, start: t, hops: 0 });
      lastPulse = t;
    }
    draw(t);
  }

  function stop() {
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  function sync() {
    stop();
    if (!visible || document.hidden) return;
    if (reduceMotion.matches) {
      pulses = [];
      draw(0);
      return;
    }
    lastFrame = 0;
    rafId = window.requestAnimationFrame(step);
  }

  function measure() {
    const box = canvas.getBoundingClientRect();
    const w = Math.min(4096, Math.max(1, Math.round(box.width)));
    const h = Math.min(4096, Math.max(1, Math.round(box.height)));
    if (w === width && h === height) return;
    width = w;
    height = h;
    aspect = Math.max(1, Math.min(3.2, width / height));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedFabric();
    fit(false);
  }

  // Interacción: encender vecinos al pasar por encima y arrastrar con ratón o lápiz
  function pointerToWorld(event: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    return { x: (event.clientX - box.left - offsetX) / scaleX, y: (event.clientY - box.top - offsetY) / scaleY };
  }

  function nearest(event: PointerEvent) {
    const { x, y } = pointerToWorld(event);
    let best = -1;
    let bestDistance = Infinity;
    nodes.forEach((p, i) => {
      const d = Math.hypot((p.x - x) * scaleX, (p.y - y) * scaleY);
      if (d < Math.max(10, p.r * 2) && d < bestDistance) {
        best = i;
        bestDistance = d;
      }
    });
    return best;
  }

  function redrawIfStill() {
    if (rafId === null && visible) draw(window.performance.now());
  }

  canvas.addEventListener("pointermove", (event) => {
    if (dragging >= 0) {
      const { x, y } = pointerToWorld(event);
      nodes[dragging].x = x;
      nodes[dragging].y = y;
    } else if (event.pointerType !== "touch") {
      hovered = nearest(event);
      canvas.style.cursor = hovered >= 0 ? "grab" : "";
    }
    redrawIfStill();
  });
  canvas.addEventListener("pointerdown", (event) => {
    const hit = nearest(event);
    if (event.pointerType === "touch") {
      hovered = hit; // en el móvil, tocar una nota enciende sus vecinos (sin bloquear el scroll)
    } else if (hit >= 0) {
      dragging = hit;
      hovered = -1;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    }
    redrawIfStill();
  });
  const release = () => {
    if (dragging < 0) return;
    hovered = dragging;
    dragging = -1;
    canvas.style.cursor = "grab";
    redrawIfStill();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", () => {
    if (dragging >= 0) return;
    hovered = -1;
    canvas.style.cursor = "";
    redrawIfStill();
  });

  // Se asienta antes del primer fotograma para no arrancar con una explosión de nodos
  for (let i = 0; i < 300; i += 1) tick(0, false);
  measure();

  new ResizeObserver(() => {
    measure();
    redrawIfStill();
  }).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  reduceMotion.addEventListener("change", sync);
}

document.querySelectorAll<HTMLCanvasElement>("canvas[data-neural-graph]").forEach(createGraph);

export {};
