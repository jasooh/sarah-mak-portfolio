export type Kind =
  | 'stilt'
  | 'slab'
  | 'wall'
  | 'stair'
  | 'roof'
  | 'eave'
  | 'tile'
  | 'mullion'
  | 'tread';

export type Vec = [number, number, number];

export interface Member {
  a: Vec;
  b: Vec;
  kind: Kind;
  /* 0 stilts and ground rooms, 1-2 the floor plates over them, 3 the roof. */
  tier: number;
}

export interface Panel {
  y: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  tier: number;
  /* 0..1. Boards lay in this order as a deck fills in. */
  order: number;
}

/** Leader lines: `a` rides with the roof, `b` stays on the top plate. */
export interface Guide {
  a: Vec;
  b: Vec;
}

export const HW = 16;
export const HD = 11;
export const STILT = 9;
export const STOREY = 16;
export const SLAB = 1;
export const LEVELS = [0, STOREY, STOREY * 2];
export const ROOF_Y = LEVELS[2] + 13;
export const RIDGE_RISE = 8;
export const BOTTOM = -STILT;
export const TOP = ROOF_Y + RIDGE_RISE + 3;

/* How far each tier rides up when the drawing pulls apart. */
export const TIER_LIFT = [0, 13, 26, 50];

/* Drawn as hairlines; everything else takes the heavier weight. */
export const FINE: ReadonlySet<Kind> = new Set<Kind>(['eave', 'tile', 'mullion', 'tread']);

const INSET = 1.5;
const TERRACE_X = 6;
const WALL_H = 10;
const EAVE_OUT = 7;
const EAVE_DROP = 7;
const RW = HW + 3;
const RD = HD + 1;
const RIDGE_X = RW - 7;
/* Upper slope steeper than the chord: the concave sweep of a tiled hip roof. */
const ROOF_SAG = 2.2;

const members: Member[] = [];
const add = (a: Vec, b: Vec, kind: Kind, tier: number) => {
  members.push({ a, b, kind, tier });
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function slab(y: number, tier: number) {
  const corners: [number, number][] = [
    [-HW, -HD],
    [HW, -HD],
    [HW, HD],
    [-HW, HD],
  ];
  for (let i = 0; i < 4; i += 1) {
    const [x0, z0] = corners[i];
    const [x1, z1] = corners[(i + 1) % 4];
    add([x0, y, z0], [x1, y, z1], 'slab', tier);
    add([x0, y - SLAB, z0], [x1, y - SLAB, z1], 'slab', tier);
    add([x0, y, z0], [x0, y - SLAB, z0], 'slab', tier);
  }
}

function wallRun(y: number, tier: number, x0: number, z0: number, x1: number, z1: number, h: number) {
  add([x0, y, z0], [x1, y, z1], 'wall', tier);
  add([x0, y + h, z0], [x1, y + h, z1], 'wall', tier);
  add([x0, y, z0], [x0, y + h, z0], 'wall', tier);
  add([x1, y, z1], [x1, y + h, z1], 'wall', tier);

  const bays = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 3));
  for (let i = 1; i < bays; i += 1) {
    const t = i / bays;
    const x = mix(x0, x1, t);
    const z = mix(z0, z1, t);
    add([x, y, z], [x, y + h, z], 'mullion', tier);
  }
  add([x0, y + h * 0.62, z0], [x1, y + h * 0.62, z1], 'mullion', tier);
}

function roomBox(y: number, tier: number, x0: number, z0: number, x1: number, z1: number, h: number) {
  wallRun(y, tier, x0, z0, x1, z0, h);
  wallRun(y, tier, x1, z0, x1, z1, h);
  wallRun(y, tier, x1, z1, x0, z1, h);
  wallRun(y, tier, x0, z1, x0, z0, h);
  add([x0, y + h, z0], [x1, y + h, z1], 'mullion', tier);
}

/* The tiled skirt hanging under a floor plate: ribs over two longitudinals. */
function eaveRun(y: number, tier: number, p0: [number, number], p1: [number, number], n: [number, number]) {
  const steps = Math.max(4, Math.round(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2));
  const knee: Vec[] = [];
  const lip: Vec[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = mix(p0[0], p1[0], t);
    const z = mix(p0[1], p1[1], t);
    const a: Vec = [x, y - SLAB, z];
    const b: Vec = [x + n[0] * EAVE_OUT * 0.5, y - SLAB - EAVE_DROP * 0.25, z + n[1] * EAVE_OUT * 0.5];
    const c: Vec = [x + n[0] * EAVE_OUT, y - SLAB - EAVE_DROP, z + n[1] * EAVE_OUT];
    knee.push(b);
    lip.push(c);
    add(a, b, 'tile', tier);
    add(b, c, 'tile', tier);
  }

  for (let i = 0; i < steps; i += 1) {
    add(knee[i], knee[i + 1], 'eave', tier);
    add(lip[i], lip[i + 1], 'eave', tier);
  }
}

/* One flight of the stair that zigzags up the open side, reversing each storey. */
function flight(tier: number, y0: number, y1: number) {
  const inner = HW + 1;
  const outer = HW + 5;
  const zA = HD - 1;
  const zB = -(HD - 1);
  const rail = 3.2;
  const steps = 12;

  add([inner, y0, zA], [inner, y1, zB], 'stair', tier);
  add([outer, y0, zA], [outer, y1, zB], 'stair', tier);
  add([outer, y0 + rail, zA], [outer, y1 + rail, zB], 'stair', tier);

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = mix(y0, y1, t);
    const z = mix(zA, zB, t);
    add([inner, y, z], [outer, y, z], 'tread', tier);
    if (i % 3 === 0) add([outer, y, z], [outer, y + rail, z], 'tread', tier);
  }

  add([HW, y1, zB], [outer, y1, zB], 'stair', tier);
  add([HW, y1 - SLAB, zB], [outer, y1 - SLAB, zB], 'stair', tier);
}

function roof() {
  const eaveY = ROOF_Y;
  const top = eaveY + RIDGE_RISE;

  /* t runs 0 at the ridge to 1 at the eave, sagging away from the chord. */
  const slope = (t: number, sx: number, sz: number): Vec => [
    mix(sx * RIDGE_X, sx * RW, t),
    mix(top, eaveY, t) - ROOF_SAG * Math.sin(Math.PI * t),
    sz * RD * t,
  ];
  const rafter = (x: number, sz: number): Vec[] =>
    [0, 0.5, 1].map((t) => [x, mix(top, eaveY, t) - ROOF_SAG * Math.sin(Math.PI * t), sz * RD * t]);

  add([-RIDGE_X, top, 0], [RIDGE_X, top, 0], 'roof', 3);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      /* Hip, drawn through the same sag. */
      let prev = slope(0, sx, sz);
      for (let i = 1; i <= 4; i += 1) {
        const next = slope(i / 4, sx, sz);
        add(prev, next, 'roof', 3);
        prev = next;
      }
      /* The flying corner the eave finishes on. */
      const curl: Vec = [sx * (RW + 1.2), eaveY + 0.5, sz * (RD + 0.8)];
      add(prev, curl, 'roof', 3);
      add(curl, [sx * (RW + 1.8), eaveY + 1.8, sz * (RD + 1.2)], 'roof', 3);
    }
  }

  for (const sz of [-1, 1]) {
    add([-RW, eaveY, sz * RD], [RW, eaveY, sz * RD], 'roof', 3);
  }
  for (const sx of [-1, 1]) {
    add([sx * RW, eaveY, -RD], [sx * RW, eaveY, RD], 'roof', 3);
  }

  const rafters = 9;
  for (let i = 1; i < rafters; i += 1) {
    const x = mix(-RIDGE_X, RIDGE_X, i / rafters);
    for (const sz of [-1, 1]) {
      const pts = rafter(x, sz);
      add(pts[0], pts[1], 'tile', 3);
      add(pts[1], pts[2], 'tile', 3);
    }
  }

  const courses = 4;
  for (let j = 1; j < courses; j += 1) {
    const t = j / courses;
    for (const sz of [-1, 1]) {
      const end = slope(t, 1, sz);
      add([-end[0], end[1], end[2]], end, 'tile', 3);
    }
  }
}

for (const x of [-HW + 2.5, 0, HW - 2.5]) {
  for (const z of [-HD + 2.5, HD - 2.5]) {
    add([x, BOTTOM, z], [x, 0, z], 'stilt', 0);
  }
}

/* Each storey is laid out differently, as the thesis plans are. */
const PLANS: { walls: [number, number, number, number][]; room: [number, number, number, number] }[] = [
  {
    walls: [
      [-HW + INSET, -HD + INSET, TERRACE_X, -HD + INSET],
      [-HW + INSET, -HD + INSET, -HW + INSET, 2],
    ],
    room: [-4, -2, TERRACE_X - 1, HD - INSET],
  },
  {
    walls: [
      [-HW + INSET, -HD + INSET, 0, -HD + INSET],
      [-HW + INSET, -HD + INSET, -HW + INSET, HD - 4],
    ],
    room: [-6, 0, TERRACE_X - 2, HD - INSET],
  },
  {
    walls: [
      [-HW + INSET, -HD + INSET, TERRACE_X, -HD + INSET],
      [TERRACE_X, -HD + INSET, TERRACE_X, 1],
    ],
    room: [-8, -4, -1, 4],
  },
];

PLANS.forEach((plan, tier) => {
  const y = LEVELS[tier];
  slab(y, tier);
  for (const [x0, z0, x1, z1] of plan.walls) wallRun(y, tier, x0, z0, x1, z1, WALL_H);
  roomBox(y, tier, plan.room[0], plan.room[1], plan.room[2], plan.room[3], WALL_H * 0.8);
});

for (const tier of [1, 2]) {
  const y = LEVELS[tier];
  eaveRun(y, tier, [-HW, -HD], [HW, -HD], [0, -1]);
  eaveRun(y, tier, [-HW, -HD], [-HW, HD], [-1, 0]);
  eaveRun(y, tier, [-HW, HD], [HW, HD], [0, 1]);
  flight(tier, LEVELS[tier - 1], y);
}

roof();

export const MEMBERS: readonly Member[] = members;

export const GUIDES: readonly Guide[] = [
  { a: [-RW, ROOF_Y, -RD], b: [-HW, LEVELS[2], -HD] },
  { a: [RW, ROOF_Y, RD], b: [HW, LEVELS[2], HD] },
];

const BOARD = 5.5;
const raw: Omit<Panel, 'order'>[] = [];
for (let tier = 0; tier < LEVELS.length; tier += 1) {
  const y = LEVELS[tier] + 0.02;
  for (let x = -HW; x < HW - 0.1; x += BOARD) {
    for (let z = -HD; z < HD - 0.1; z += BOARD) {
      raw.push({ y, x0: x, x1: Math.min(x + BOARD, HW), z0: z, z1: Math.min(z + BOARD, HD), tier });
    }
  }
}

/* Deterministic scatter within a storey, so a partial deck looks laid rather
   than sliced; storeys still fill from the bottom up. */
const byTier = LEVELS.map((_, tier) =>
  raw
    .map((panel, i) => ({ panel, key: Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) }))
    .filter(({ panel }) => panel.tier === tier)
    .sort((a, b) => a.key - b.key),
);

export const PANELS: Panel[] = byTier.flatMap((group, tier) =>
  group.map(({ panel }, i) => ({
    ...panel,
    /* Strictly below 1, so an easing curve that only approaches its target
       still reaches the last board. */
    order: (tier + i / group.length) / LEVELS.length,
  })),
);

const C = Math.cos(Math.PI / 6);

/** Isometric projection, used for the static SVG. */
export function iso(x: number, y: number, z: number): [number, number] {
  return [(x - z) * C, (x + z) * 0.5 - y];
}
