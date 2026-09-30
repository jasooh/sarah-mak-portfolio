import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from 'three';

const FLOORS = 4;
const W = 2.2;
const D = 1.8;
const GRID = 4;

const ROUTES: Record<string, { gap: number; turn: number; rise: number }> = {
  home: { gap: 0.55, turn: 0, rise: 0 },
  work: { gap: 1.0, turn: -0.35, rise: -0.75 },
  about: { gap: 0.06, turn: 0.5, rise: 1.15 },
  cv: { gap: 0.32, turn: 0.2, rise: 0.45 },
};

function lines(points: number[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  return geometry;
}

function floorPoints(): number[] {
  const x = W / 2;
  const z = D / 2;
  const points: number[] = [
    -x, 0, -z, x, 0, -z,
    x, 0, -z, x, 0, z,
    x, 0, z, -x, 0, z,
    -x, 0, z, -x, 0, -z,
  ];
  for (let i = 1; i < GRID; i += 1) {
    const t = i / GRID;
    points.push(-x + W * t, 0, -z, -x + W * t, 0, z);
    points.push(-x, 0, -z + D * t, x, 0, -z + D * t);
  }
  return points;
}

function columnPoints(): number[] {
  const x = W / 2;
  const z = D / 2;
  return [
    -x, 0, -z, -x, 1, -z,
    x, 0, -z, x, 1, -z,
    x, 0, z, x, 1, z,
    -x, 0, z, -x, 1, z,
  ];
}

function roofPoints(): number[] {
  const x = W / 2 + 0.16;
  const z = D / 2 + 0.16;
  const apex = 0.55;
  return [
    -x, 0, -z, x, 0, -z,
    x, 0, -z, x, 0, z,
    x, 0, z, -x, 0, z,
    -x, 0, z, -x, 0, -z,
    -x, 0, -z, 0, apex, 0,
    x, 0, -z, 0, apex, 0,
    x, 0, z, 0, apex, 0,
    -x, 0, z, 0, apex, 0,
  ];
}

function inkColour(): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  return new Color(value || '#57544a');
}

export function startBackdrop(canvas: HTMLCanvasElement): ((route: string) => void) | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(7, 5.6, 7);

  const faint = new LineBasicMaterial({ transparent: true, opacity: 0.55 });
  const solid = new LineBasicMaterial({ transparent: true, opacity: 1 });

  const building = new Group();
  scene.add(building);

  const slabs: Group[] = [];
  for (let i = 0; i < FLOORS; i += 1) {
    const slab = new Group();
    slab.add(new LineSegments(lines(floorPoints().slice(0, 24)), solid));
    slab.add(new LineSegments(lines(floorPoints().slice(24)), faint));
    building.add(slab);
    slabs.push(slab);
  }

  const columns = new LineSegments(lines(columnPoints()), faint);
  building.add(columns);

  const roof = new LineSegments(lines(roofPoints()), solid);
  building.add(roof);

  function applyTheme() {
    const colour = inkColour();
    faint.color = colour;
    solid.color = colour;
  }
  applyTheme();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    const view = 7.5;
    const aspect = w / h;
    camera.left = (-view * aspect) / 2;
    camera.right = (view * aspect) / 2;
    camera.top = view / 2;
    camera.bottom = -view / 2;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 1.1, 0);
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  let gap = ROUTES.home.gap;
  let turn = 0;
  let rise = 0;
  let target = ROUTES.home;
  let impulse = 0;
  let spin = 0;
  let last = performance.now();
  let running = true;

  function setRoute(name: string) {
    const next = ROUTES[name] ?? ROUTES.home;
    if (next !== target) impulse = 1;
    target = next;
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const ease = Math.min(dt * 3.2, 1);
    gap += (target.gap - gap) * ease;
    turn += (target.turn - turn) * ease;
    rise += (target.rise - rise) * ease;

    impulse *= Math.exp(-dt * 3.4);
    spin += dt * 0.055 + impulse * dt * 1.6;

    const height = gap * (FLOORS - 1);
    slabs.forEach((slab, i) => {
      slab.position.y = i * gap;
    });
    columns.scale.y = Math.max(height, 0.001);
    roof.position.y = height + gap * 0.5;
    roof.visible = gap > 0.12;

    building.rotation.y = spin + turn;
    building.position.y = rise;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function pause() {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  }
  document.addEventListener('visibilitychange', pause);

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => setTimeout(applyTheme, 0));

  requestAnimationFrame(frame);
  return setRoute;
}

export { ROUTES };
