export type Kind = 'post' | 'beam' | 'joist' | 'mullion';

export interface Member {
  a: [number, number, number];
  b: [number, number, number];
  kind: Kind;
}

export interface Panel {
  y: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  level: 'floor' | 'platform';
  /* 0..1. Boards lay in this order as the deck fades in. */
  order: number;
}

/* Dimensions from the thesis drawings: a 36in cube on 6in legs. */
export const HALF = 18;
export const TOP = 42;
export const SILL = 6;
export const MID = 24;
export const SECTION = 1.5;

const E = HALF - SECTION / 2;
const POSTS = [-E, 0, E];
const JOISTS = [-12, -6, 0, 6, 12];
const PLATFORM_X = 4;

const members: Member[] = [];
const add = (a: Member['a'], b: Member['b'], kind: Kind) => members.push({ a, b, kind });

for (const x of POSTS) {
  for (const z of POSTS) {
    add([x, SILL, z], [x, TOP, z], 'post');
    const edge = Math.abs(x) === E || Math.abs(z) === E;
    if (edge) add([x, 0, z], [x, SILL, z], 'post');
  }
}

for (const y of [SILL, MID, TOP]) {
  for (const z of POSTS) add([-E, y, z], [E, y, z], 'beam');
  for (const x of POSTS) add([x, y, -E], [x, y, E], 'beam');
}

for (const z of JOISTS) add([-E, SILL, z], [E, SILL, z], 'joist');
for (const x of JOISTS) add([x, SILL, -E], [x, SILL, E], 'joist');

for (const z of JOISTS) add([PLATFORM_X, MID, z], [E, MID, z], 'joist');

for (const x of [-9, 9]) {
  for (const z of [-E, E]) add([x, MID, z], [x, TOP, z], 'mullion');
}
for (const z of [-9, 9]) {
  for (const x of [-E, E]) add([x, MID, z], [x, TOP, z], 'mullion');
}

export const MEMBERS = members;

const raw: Omit<Panel, 'order'>[] = [];
for (let x = -E; x < PLATFORM_X - 0.1; x += 6) {
  for (let z = -E; z < E - 0.1; z += 6) {
    raw.push({ y: SILL + SECTION / 2, x0: x, x1: Math.min(x + 6, PLATFORM_X), z0: z, z1: Math.min(z + 6, E), level: 'floor' });
  }
}
for (let x = PLATFORM_X; x < E - 0.1; x += 6) {
  for (let z = -E; z < E - 0.1; z += 6) {
    raw.push({ y: MID + SECTION / 2, x0: x, x1: Math.min(x + 6, E), z0: z, z1: Math.min(z + 6, E), level: 'platform' });
  }
}

/* Deterministic scatter, so a partial deck looks laid rather than sliced. */
const shuffled = raw
  .map((panel, i) => ({ panel, key: Math.sin(i * 12.9898) * 43758.5453 % 1 }))
  .sort((a, b) => Math.abs(a.key) - Math.abs(b.key));

export const PANELS: Panel[] = shuffled.map(({ panel }, i) => ({
  ...panel,
  order: shuffled.length === 1 ? 0 : i / (shuffled.length - 1),
}));


const C = Math.cos(Math.PI / 6);

/** Isometric projection, used for the static SVG. */
export function iso(x: number, y: number, z: number): [number, number] {
  return [(x - z) * C, (x + z) * 0.5 - y];
}
