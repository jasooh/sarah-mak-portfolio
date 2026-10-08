import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import {
  BOTTOM,
  FINE,
  GUIDES,
  MEMBERS,
  PANELS,
  TIER_LIFT,
  TOP,
  type Member,
} from './frame';

interface State {
  /* 0 assembled, 1 pulled fully apart. */
  explode: number;
  /* How much of the decking is laid. */
  build: number;
  turn: number;
  tilt: number;
  zoom: number;
}

const ROUTES: Record<string, State> = {
  home: { explode: 0.34, build: 1, turn: 0, tilt: 1, zoom: 1.05 },
  work: { explode: 1, build: 1, turn: -0.38, tilt: 1, zoom: 0.74 },
  project: { explode: 0.62, build: 1, turn: 0.22, tilt: 0.92, zoom: 0.86 },
  about: { explode: 0.12, build: 1, turn: 0.46, tilt: 1, zoom: 1.12 },
  cv: { explode: 0.85, build: 0.34, turn: -0.1, tilt: 0.06, zoom: 0.85 },
};

const VIEW = 120;
const ROOF_TIER = TIER_LIFT.length - 1;

function segments(list: Member[]): BufferGeometry {
  const position: number[] = [];
  for (const m of list) position.push(...m.a, ...m.b);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  return geometry;
}

function cssColour(name: string, fallback: string): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new Color(value || fallback);
}

export function startBackdrop(canvas: HTMLCanvasElement): ((route: string) => void) | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

  const heavy = new LineBasicMaterial({ transparent: true, opacity: 0.88 });
  const hairline = new LineBasicMaterial({ transparent: true, opacity: 0.42 });
  const leader = new LineDashedMaterial({ transparent: true, opacity: 0, dashSize: 2.2, gapSize: 2.2 });
  const deck = new MeshBasicMaterial({ transparent: true, opacity: 0.4, side: DoubleSide });

  const frame = new Group();
  scene.add(frame);

  const tiers = TIER_LIFT.map(() => {
    const group = new Group();
    frame.add(group);
    return group;
  });

  tiers.forEach((group, tier) => {
    const mine = MEMBERS.filter((m) => m.tier === tier);
    for (const [material, list] of [
      [heavy, mine.filter((m) => !FINE.has(m.kind))],
      [hairline, mine.filter((m) => FINE.has(m.kind))],
    ] as const) {
      if (list.length > 0) group.add(new LineSegments(segments(list), material));
    }
  });

  const guideGeometry = new BufferGeometry();
  guideGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(GUIDES.length * 6), 3));
  const guideLines = new LineSegments(guideGeometry, leader);
  guideLines.frustumCulled = false;
  frame.add(guideLines);

  const boards = PANELS.map((panel) => {
    const geometry = new PlaneGeometry(panel.x1 - panel.x0, panel.z1 - panel.z0);
    const mesh = new Mesh(geometry, deck);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((panel.x0 + panel.x1) / 2, panel.y, (panel.z0 + panel.z1) / 2);
    tiers[panel.tier].add(mesh);
    return mesh;
  });

  function applyTheme() {
    const ink = cssColour('--ink', '#57544a');
    heavy.color = ink;
    hairline.color = ink;
    leader.color = ink;
    deck.color = cssColour('--panel', '#b3a79f');
  }
  applyTheme();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    const view = VIEW / zoom;
    const aspect = w / h;
    camera.left = (-view * aspect) / 2;
    camera.right = (view * aspect) / 2;
    camera.top = view / 2;
    camera.bottom = -view / 2;
    camera.updateProjectionMatrix();
  }

  let explode = 0;
  let build = 0;
  let turn = 0;
  let tilt = 1;
  let zoom = 1;
  let target = ROUTES.home;
  let impulse = 0;
  let spin = 0;
  let last = performance.now();
  let running = true;

  resize();
  new ResizeObserver(resize).observe(canvas);

  function setRoute(name: string) {
    const next = ROUTES[name] ?? ROUTES.home;
    if (next !== target) impulse = 1;
    target = next;
  }

  function frameLoop(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const ease = Math.min(dt * 2.6, 1);
    /* Snap once close: these curves only approach their target, and a value
       left just short of 1 leaves the last board unlaid. */
    const step = (value: number, to: number) => {
      const next = value + (to - value) * ease;
      return Math.abs(to - next) < 0.0005 ? to : next;
    };

    explode = step(explode, target.explode);
    build = step(build, target.build);
    turn = step(turn, target.turn);
    tilt = step(tilt, target.tilt);
    const previousZoom = zoom;
    zoom = step(zoom, target.zoom);
    if (Math.abs(zoom - previousZoom) > 0.0002) resize();

    impulse *= Math.exp(-dt * 3);
    spin += dt * 0.05 + impulse * dt * 1.1;

    const lift = (tier: number) => TIER_LIFT[tier] * explode;
    tiers.forEach((group, tier) => {
      group.position.y = lift(tier);
    });
    /* Recentre as the stack grows, so it never drifts out of the view. */
    frame.position.y = -(BOTTOM + TOP + lift(ROOF_TIER)) / 2;

    const guidePos = guideGeometry.getAttribute('position');
    GUIDES.forEach((guide, i) => {
      guidePos.setXYZ(i * 2, guide.a[0], guide.a[1] + lift(ROOF_TIER), guide.a[2]);
      guidePos.setXYZ(i * 2 + 1, guide.b[0], guide.b[1] + lift(ROOF_TIER - 1), guide.b[2]);
    });
    guidePos.needsUpdate = true;
    guideLines.computeLineDistances();
    leader.opacity = 0.3 * Math.min(1, Math.max(0, (explode - 0.08) * 4));

    const laid = (i: number) => build > 0.01 && PANELS[i].order <= build;
    boards.forEach((mesh, i) => {
      mesh.visible = laid(i);
    });

    /* tan(35.26deg): the true isometric elevation her drawings are set at. */
    const radius = 120;
    const elevation = radius * 0.7071 * tilt;
    const angle = spin + turn;
    camera.position.set(Math.sin(angle) * radius, elevation, Math.cos(angle) * radius);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frameLoop);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frameLoop);
    }
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(applyTheme, 0));

  requestAnimationFrame(frameLoop);
  return setRoute;
}
