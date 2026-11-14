// 3D dice for the TV, drawn with three.js. Loaded on demand (only the TV ever
// fetches it), so the DM view and phones don't carry the library.
//
// No physics engine: each die gets a scripted tumble that ends with the face
// showing the rolled number turned toward the camera, upright. Every face is
// numbered, so mid-tumble the dice look like real dice.

import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DodecahedronGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Scene,
  SRGBColorSpace,
  TetrahedronGeometry,
  BoxGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

export interface Die3D {
  sides: number;
  value: number;
}

export interface Dice3DOptions {
  /** When each die starts and lands, in ms from mount (must match the card's timing). */
  tumbleMs: number;
  staggerMs: number;
  /** Jump straight to the landed dice (reduced motion). */
  still: boolean;
  cols: number;
  /** Where on screen the dice should land (the card's dice area). */
  place: () => DOMRect;
}

const LOOK: Record<number, { body: string; ink: string }> = {
  4: { body: "#2f6b4c", ink: "#f3e7c9" },
  6: { body: "#cdbb92", ink: "#2b2118" },
  8: { body: "#2f4f7a", ink: "#f3e7c9" },
  10: { body: "#5b3a7c", ink: "#f3e7c9" },
  12: { body: "#28686a", ink: "#f3e7c9" },
  20: { body: "#8a2a1f", ink: "#f3e7c9" },
  100: { body: "#a07a2a", ink: "#1c140d" },
};

/** Spacing between dice, in world units (a die is about 1 across). */
const PITCH = 1.45;

/** True if this browser can draw WebGL at all. */
export function canDraw3D(): boolean {
  try {
    const c = document.createElement("canvas");
    const g = c.getContext("webgl2") || c.getContext("webgl");
    g?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!g;
  } catch {
    return false;
  }
}

/**
 * Draw the dice in a new canvas inside host and run the roll. Returns a cleanup function.
 * (A fresh canvas each time: a canvas whose context was released can't be drawn on again.)
 */
export function mountDice3D(host: HTMLElement, dice: Die3D[], opt: Dice3DOptions): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "dice-roll-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.add(new AmbientLight(0xfff1dc, 1.1));
  const key = new DirectionalLight(0xffe6c0, 2.4);
  key.position.set(-3, 5, 8);
  scene.add(key);
  const rim = new DirectionalLight(0x9fb4ff, 0.6);
  rim.position.set(4, -2, 3);
  scene.add(rim);
  const candle = new PointLight(0xffb060, 10, 30, 1.6);
  candle.position.set(0, 2, 6);
  scene.add(candle);

  // Lay the dice out in rows, centred, like the flat version.
  const n = dice.length;
  const cols = Math.max(1, Math.min(opt.cols, n));
  const rows = Math.ceil(n / cols);
  const slots = dice.map((_, i) => {
    const r = Math.floor(i / cols);
    const inRow = r === rows - 1 ? n - r * cols : cols;
    const c = i - r * cols;
    return new Vector3((c - (inRow - 1) / 2) * PITCH, ((rows - 1) / 2 - r) * PITCH, 0);
  });

  // The canvas covers the whole screen, so dice can fly in from below it; the
  // camera is framed so they land inside the card's dice area (opt.place()).
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const worldW = cols * PITCH;
  const worldH = rows * PITCH;
  const DIST = 14;
  let halfFull = worldH;
  const fit = () => {
    const c = canvas.getBoundingClientRect();
    const p = opt.place();
    const w = Math.max(1, c.width);
    const h = Math.max(1, c.height);
    renderer.setSize(w, h, false);
    const pw = Math.max(1, p.width);
    const ph = Math.max(1, p.height);
    const halfP = Math.max(worldH / 2, worldW / 2 / (pw / ph)) * 1.04;
    halfFull = (halfP * h) / ph;
    camera.fov = (2 * Math.atan(halfFull / DIST) * 180) / Math.PI;
    camera.aspect = w / h;
    camera.position.set(0, 0.6, DIST);
    camera.lookAt(0, 0, 0);
    const dx = p.left + pw / 2 - (c.left + w / 2);
    const dy = p.top + ph / 2 - (c.top + h / 2);
    camera.setViewOffset(w, h, -dx, -dy, w, h);
    camera.updateProjectionMatrix();
  };
  fit();

  const disposables: { dispose(): void }[] = [];
  const built = dice.map((d, i) => buildDie(d, i, disposables));
  for (const b of built) scene.add(b.group);

  // Where each die ends up: its number toward the camera, the right way up.
  const finals = built.map((b, i) => {
    const toCam = camera.position.clone().sub(slots[i]).normalize();
    const q1 = new Quaternion().setFromUnitVectors(b.result.normal, toCam);
    const up = b.result.up.clone().applyQuaternion(q1);
    const screenUp = new Vector3(0, 1, 0).sub(toCam.clone().multiplyScalar(toCam.y)).normalize();
    const angle = Math.atan2(new Vector3().crossVectors(up, screenUp).dot(toCam), up.dot(screenUp));
    const upright = new Quaternion().setFromAxisAngle(toCam, angle).multiply(q1);
    // Tip each die back a little and turn it a touch, so it reads as a solid, not a sticker.
    const tip = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.32);
    const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), (i % 2 ? -1 : 1) * 0.22);
    return tip.multiply(turn).multiply(upright);
  });

  // Each die's tumble: where it comes from and how it spins (fixed per index, so it's steady on replays).
  const rnd = seeded(dice.reduce((s, d, i) => s + d.value * (i + 7) + d.sides, 1));
  const tumbles = dice.map((_, i) => ({
    from: new Vector3(slots[i].x * 1.6 + (rnd() - 0.5) * 5, -halfFull * 1.7 - rnd() * 2, 3 + rnd() * 3),
    axis: new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
    spin: (3 + rnd() * 2.5) * Math.PI * 2,
    hops: 2 + Math.floor(rnd() * 2),
    dur: opt.tumbleMs + Math.min(i, 12) * opt.staggerMs,
  }));

  const start = performance.now();
  const q = new Quaternion();
  let raf = 0;
  const frame = () => {
    const now = performance.now() - start;
    built.forEach((b, i) => {
      const tb = tumbles[i];
      const t = opt.still ? 1 : Math.min(1, now / tb.dur);
      const e = 1 - Math.pow(1 - t, 3);
      // Fly in, hop a couple of times, settle.
      const p = tb.from.clone().lerp(slots[i], e);
      const hop = Math.abs(Math.sin(t * Math.PI * tb.hops)) * Math.pow(1 - t, 2) * 1.1;
      p.y += hop;
      p.z = tb.from.z * Math.pow(1 - t, 2);
      b.group.position.copy(p);
      q.setFromAxisAngle(tb.axis, tb.spin * (1 - e));
      b.group.quaternion.copy(finals[i]).premultiply(q);
      // A little bump when it lands, and a glow on a natural 20 (a sulk on a natural 1).
      const since = now - tb.dur;
      const bump = opt.still || since < 0 ? 0 : since < 320 ? Math.sin((since / 320) * Math.PI) * 0.12 : 0;
      b.group.scale.setScalar(1 + bump);
      if (since >= 0 && b.flair) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 260);
        b.body.emissive.copy(b.flair).multiplyScalar(b.flairNat === 20 ? 0.25 + 0.35 * pulse : 0.25);
      }
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
  ro?.observe(canvas);

  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    for (const d of disposables) d.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}

// ------------------------------------------------------------------ building a die

interface Face {
  center: Vector3;
  normal: Vector3;
  /** Which way is "up" for the number on this face. */
  up: Vector3;
  /** How big a number fits. */
  inner: number;
}

function buildDie(d: Die3D, index: number, disposables: { dispose(): void }[]) {
  const look = LOOK[d.sides] ?? LOOK[20];
  const { geometry, faces } = shape(d.sides);
  const body = new MeshStandardMaterial({ color: new Color(look.body), roughness: 0.42, metalness: 0.08, flatShading: true });
  const group = new Group();
  group.add(new Mesh(geometry, body));
  const edges = new EdgesGeometry(geometry, 12);
  const edgeMat = new LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
  group.add(new LineSegments(edges, edgeMat));
  disposables.push(geometry, body, edges, edgeMat);

  // Number every face; the first face carries the result.
  const labels = faceNumbers(d, faces.length, index);
  faces.forEach((f, i) => {
    const tex = numberTexture(labels[i], look.ink);
    const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const size = f.inner * (d.sides === 4 ? 1.25 : 1.55);
    const plane = new PlaneGeometry(size, size);
    const m = new Mesh(plane, mat);
    const right = new Vector3().crossVectors(f.up, f.normal).normalize();
    m.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(right, f.up, f.normal));
    m.position.copy(f.center).addScaledVector(f.normal, 0.004);
    group.add(m);
    disposables.push(tex, mat, plane);
  });

  const nat = d.sides === 20 && (d.value === 20 || d.value === 1) ? d.value : null;
  return {
    group,
    body,
    result: faces[0],
    flair: nat === 20 ? new Color("#ecc66a") : nat === 1 ? new Color("#5a0d06") : null,
    flairNat: nat,
  };
}

/** The result on the first face, the die's other numbers on the rest. */
function faceNumbers(d: Die3D, count: number, index: number): string[] {
  const mark = (v: number) => (d.sides >= 8 && (v === 6 || v === 9) ? `${v}.` : String(v));
  if (d.sides === 100) {
    // Percentile style: tens on the other faces, the real result on top.
    const tens = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "00"];
    return [String(d.value), ...tens.filter((t) => t !== String(d.value))].slice(0, count);
  }
  const others: number[] = [];
  for (let v = 1; v <= d.sides; v++) if (v !== d.value) others.push(v);
  // Shuffle a little per die so neighbours don't all read 1, 2, 3.
  const r = seeded(index * 31 + d.value);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return [mark(d.value), ...others.map(mark)].slice(0, count);
}

const shapes = new Map<number, () => { geometry: BufferGeometry; faces: Face[] }>([
  [4, () => fromThree(new TetrahedronGeometry(0.78), "vertex")],
  [6, () => fromThree(new BoxGeometry(0.92, 0.92, 0.92), "edge")],
  [8, () => fromThree(new OctahedronGeometry(0.66), "vertex")],
  [10, () => trapezohedron(0.62)],
  [12, () => fromThree(new DodecahedronGeometry(0.64), "vertex")],
  [20, () => fromThree(new IcosahedronGeometry(0.66), "vertex")],
  [100, () => trapezohedron(0.62)],
]);

function shape(sides: number) {
  return (shapes.get(sides) ?? shapes.get(20)!)();
}

/** Split a three.js solid into its flat faces (triangles that share a plane). */
function fromThree(g: BufferGeometry, upBy: "vertex" | "edge") {
  const geo = g.index ? g.toNonIndexed() : g;
  if (geo !== g) g.dispose();
  geo.computeVertexNormals();
  const pos = geo.getAttribute("position");
  const groups: { normal: Vector3; pts: Vector3[] }[] = [];
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    const nrm = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).normalize();
    // Solids are centred on the origin, so outward means away from it.
    if (nrm.dot(new Vector3().add(a).add(b).add(c)) < 0) nrm.negate();
    let grp = groups.find((x) => x.normal.dot(nrm) > 0.995);
    if (!grp) groups.push((grp = { normal: nrm, pts: [] }));
    for (const p of [a, b, c]) if (!grp.pts.some((q) => q.distanceToSquared(p) < 1e-8)) grp.pts.push(p.clone());
  }
  const faces = groups.map(({ normal, pts }) => face(normal, pts, upBy));
  return { geometry: geo, faces };
}

/** The ten-sided kite die (d10, and the d100 in percentile colours). */
function trapezohedron(r: number) {
  const h = r * 1.0;
  const a = r * 0.105;
  const top = new Vector3(0, 0, h);
  const bottom = new Vector3(0, 0, -h);
  const ring = Array.from({ length: 10 }, (_, k) => new Vector3(Math.cos((k * Math.PI) / 5) * r, Math.sin((k * Math.PI) / 5) * r, k % 2 ? a : -a));
  const kites: Vector3[][] = [];
  for (let j = 0; j < 5; j++) {
    kites.push([top, ring[(2 * j + 1) % 10], ring[(2 * j + 2) % 10], ring[(2 * j + 3) % 10]]);
    kites.push([bottom, ring[(2 * j + 2) % 10], ring[(2 * j + 1) % 10], ring[(2 * j) % 10]]);
  }
  const verts: number[] = [];
  const faces: Face[] = [];
  for (const k of kites) {
    // Two triangles per kite, wound outward.
    let [p0, p1, p2, p3] = k;
    let nrm = new Vector3().subVectors(p1, p0).cross(new Vector3().subVectors(p3, p0)).normalize();
    const mid = new Vector3().add(p0).add(p1).add(p2).add(p3).multiplyScalar(0.25);
    if (nrm.dot(mid) < 0) {
      [p1, p3] = [p3, p1];
      nrm = nrm.negate();
    }
    for (const p of [p0, p1, p2, p0, p2, p3]) verts.push(p.x, p.y, p.z);
    // The number sits nearer the wide end of the kite, upright toward its point.
    const f = face(nrm, [p0, p1, p2, p3], "vertex");
    f.center = p0.clone().lerp(p2, 0.58);
    f.inner *= 0.95;
    faces.push(f);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(verts, 3));
  geometry.computeVertexNormals();
  return { geometry, faces };
}

function face(normal: Vector3, pts: Vector3[], upBy: "vertex" | "edge"): Face {
  const center = pts.reduce((s, p) => s.add(p), new Vector3()).multiplyScalar(1 / pts.length);
  // Order the corners around the centre, to find edges.
  const t = new Vector3().subVectors(pts[0], center).normalize();
  const bt = new Vector3().crossVectors(normal, t);
  const ordered = [...pts].sort((p, q) => ang(p) - ang(q));
  function ang(p: Vector3) {
    const v = new Vector3().subVectors(p, center);
    return Math.atan2(v.dot(bt), v.dot(t));
  }
  let inner = Infinity;
  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i];
    const q = ordered[(i + 1) % ordered.length];
    const e = new Vector3().subVectors(q, p);
    const toC = new Vector3().subVectors(center, p);
    const dist = toC
      .clone()
      .sub(e.clone().multiplyScalar(toC.dot(e) / e.lengthSq()))
      .length();
    inner = Math.min(inner, dist);
  }
  const target = upBy === "edge" ? ordered[0].clone().add(ordered[1]).multiplyScalar(0.5) : ordered[0];
  const up = new Vector3().subVectors(target, center);
  up.sub(normal.clone().multiplyScalar(up.dot(normal))).normalize();
  return { center, normal: normal.clone(), up, inner: inner * 2 };
}

function numberTexture(text: string, ink: string): CanvasTexture {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const size = text.replace(".", "").length >= 3 ? 46 : text.replace(".", "").length === 2 ? 60 : 72;
  g.font = `700 ${size}px "EB Garamond", Georgia, serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = ink;
  g.shadowColor = "rgba(0,0,0,0.35)";
  g.shadowBlur = 3;
  g.fillText(text, S / 2, S / 2 + 4);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A small repeatable random generator. */
function seeded(seed: number) {
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
