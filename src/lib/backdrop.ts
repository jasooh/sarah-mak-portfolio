import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { MEMBERS, PANELS, SECTION, TOP } from './frame';

interface State {
  burst: number;
  panels: number;
  turn: number;
  tilt: number;
  zoom: number;
}

const ROUTES: Record<string, State> = {
  home: { burst: 0, panels: 1, turn: 0, tilt: 1, zoom: 1 },
  work: { burst: 1.9, panels: 1, turn: -0.4, tilt: 1, zoom: 0.62 },
  about: { burst: 0, panels: 1, turn: 0.45, tilt: 1, zoom: 1.05 },
  cv: { burst: 0, panels: 1, turn: 0, tilt: 0, zoom: 0.92 },
};

function memberMesh(member: (typeof MEMBERS)[number]): {
  edges: LineSegments;
  home: Vector3;
  push: Vector3;
} {
  const a = new Vector3(...member.a);
  const b = new Vector3(...member.b);
  const span = new Vector3().subVectors(b, a);
  const length = span.length() + SECTION;
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);

  const axis = span.clone().normalize();
  const size = new Vector3(
    Math.abs(axis.x) > 0.5 ? length : SECTION,
    Math.abs(axis.y) > 0.5 ? length : SECTION,
    Math.abs(axis.z) > 0.5 ? length : SECTION,
  );

  const box = new BoxGeometry(size.x, size.y, size.z);
  const edges = new LineSegments(new EdgesGeometry(box), new LineBasicMaterial());
  edges.position.copy(mid);
  box.dispose();

  /* Proportional to distance from the centre, so the parts stay in formation
     the way an exploded axonometric does. */
  const push = mid.clone().sub(new Vector3(0, TOP / 2, 0)).multiplyScalar(0.5);
  if (member.kind === 'joist') push.y -= 5;
  if (member.kind === 'mullion') push.multiplyScalar(1.3);

  return { edges, home: mid.clone(), push };
}

function inkColour(): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  return new Color(value || '#57544a');
}

/* The thesis drawings infill the decks in a muted taupe, not the accent. */
function panelColour(): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim();
  return new Color(value || '#b3a79f');
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

  const lineMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.85 });
  const secondaryMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.4 });
  const panelMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0, side: DoubleSide });

  const frame = new Group();
  frame.position.y = -TOP / 2;
  scene.add(frame);

  const parts = MEMBERS.map((member) => {
    const part = memberMesh(member);
    const primary = member.kind === 'post' || member.kind === 'beam';
    part.edges.material = primary ? lineMaterial : secondaryMaterial;
    frame.add(part.edges);
    return part;
  });

  const panels = PANELS.map((panel) => {
    const geometry = new PlaneGeometry(panel.x1 - panel.x0, panel.z1 - panel.z0);
    const mesh = new Mesh(geometry, panelMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((panel.x0 + panel.x1) / 2, panel.y, (panel.z0 + panel.z1) / 2);
    frame.add(mesh);
    return mesh;
  });

  const outlines = PANELS.map((panel) => {
    const w = panel.x1 - panel.x0;
    const d = panel.z1 - panel.z0;
    const y = panel.y;
    const x = (panel.x0 + panel.x1) / 2;
    const z = (panel.z0 + panel.z1) / 2;
    const p = [
      -w / 2, 0, -d / 2, w / 2, 0, -d / 2,
      w / 2, 0, -d / 2, w / 2, 0, d / 2,
      w / 2, 0, d / 2, -w / 2, 0, d / 2,
      -w / 2, 0, d / 2, -w / 2, 0, -d / 2,
    ];
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(p, 3));
    const line = new LineSegments(geometry, secondaryMaterial);
    line.position.set(x, y, z);
    frame.add(line);
    return line;
  });

  function applyTheme() {
    const ink = inkColour();
    lineMaterial.color = ink;
    secondaryMaterial.color = ink;
    panelMaterial.color = panelColour();
  }
  applyTheme();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    const view = 104 / zoom;
    const aspect = w / h;
    camera.left = (-view * aspect) / 2;
    camera.right = (view * aspect) / 2;
    camera.top = view / 2;
    camera.bottom = -view / 2;
    camera.updateProjectionMatrix();
  }

  let burst = 0;
  let panelFade = 0;
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

    burst = step(burst, target.burst);
    panelFade = step(panelFade, target.panels);
    turn = step(turn, target.turn);
    tilt = step(tilt, target.tilt);
    const previousZoom = zoom;
    zoom = step(zoom, target.zoom);
    if (Math.abs(zoom - previousZoom) > 0.0002) resize();

    impulse *= Math.exp(-dt * 3);
    spin += dt * 0.05 + impulse * dt * 1.1;

    parts.forEach((part) => {
      part.edges.position.set(
        part.home.x + part.push.x * burst,
        part.home.y + part.push.y * burst,
        part.home.z + part.push.z * burst,
      );
    });

    panelMaterial.opacity = 0.42;
    const laid = (i: number) => panelFade > 0.01 && PANELS[i].order <= panelFade;
    panels.forEach((mesh, i) => {
      mesh.visible = laid(i);
    });
    outlines.forEach((line, i) => {
      line.visible = laid(i);
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
