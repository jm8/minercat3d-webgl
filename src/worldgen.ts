import SimplexNoise from "simplex-noise"
import { LAYER_SIZE, Blocks, WORLD_DEPTH, WORLD_SIZE } from "./main"

type WorldGen = WorldGenSection[]

type WorldGenSection = ({ y: number, tries: Try[] })

type Try = { chance: number, do: Do } | { do: Do }

type Do =
  | number
  | { type: "firstlayer" }

const worldgen: WorldGen = [
  { y: 5, tries: [{ do: 0 }] },
  { y: 6, tries: [{ do: { type: "firstlayer" } }] },
  { y: 7, tries: [{ do: 2 }] },
  {
    y: 24,
    tries: [
      { chance: 10, do: 4 },
      { chance: 12, do: 5 },
      { chance: 14, do: 6 },
      { chance: 16, do: 7 },
      { do: 3 }
    ],
  },
  {
    y: 60,
    tries: [
      { chance: 10, do: 9 },
      { chance: 12, do: 10 },
      { chance: 14, do: 11 },
      // lava 75
      { do: 8 }
    ]
  },
  {
    y: 110,
    tries: [
      { chance: 10, do: 13 },
      { chance: 12, do: 14 },
      { chance: 14, do: 15 },
      { do: 12 }
    ]
  },
  {
    y: 160,
    tries: [
      { chance: 10, do: 17 },
      { chance: 12, do: 18 },
      { chance: 14, do: 19 },
      { do: 16 }
      // lava 35

    ]
  },
  {
    y: 225,
    tries: [
      { chance: 10, do: 21 },
      { chance: 12, do: 22 },
      { chance: 14, do: 23 },
      { do: 20 },
    ]
  },
  {
    y: 300,
    tries: [
      { chance: 10, do: 25 },
      { chance: 12, do: 26 },
      { chance: 14, do: 27 },
      { do: 24 },
    ]
  },
  {
    y: 375,
    tries: [
      { chance: 10, do: 29 },
      { chance: 12, do: 30 },
      { chance: 14, do: 31 },
      { do: 28 },
    ]
  },
  {
    y: 500,
    tries: [
      { chance: 10, do: 33 },
      { chance: 12, do: 34 },
      { chance: 14, do: 35 },
      { do: 32 },
    ]
  },
  {
    y: 8250,
    tries: [
      { chance: 10, do: 37 },
      { chance: 12, do: 38 },
      { chance: 14, do: 39 },
      { do: 36 },
      // lava 12
      // cave 10
    ],
  },
]

export function generate(blocks: Blocks) {
  makeBlocks(blocks);
  makeCaves(blocks);
}

function makeBlocks(blocks: Blocks) {
  let section = 0;
  for (let y = 0; y < WORLD_DEPTH; y++) {
    if (y > worldgen[section].y) section++;
    if (section >= worldgen.length) break;
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        for (const tri of worldgen[section].tries) {
          if ("chance" in tri) {
            if (Math.random() >= 1 / tri.chance) continue;
          }

          if (typeof tri.do == "number") {
            blocks.setBlock([x, y, z], tri.do);
          } else if (tri.do.type == "firstlayer") {
            const center = Math.floor(WORLD_SIZE / 2);
            if ((x == center || x == center - 1) && (z == center || z == center - 1)) {
              blocks.setBlock([x, y, z], 41);
            }
            else {
              blocks.setBlock([x, y, z], 1);
            }
          }
          break;
        }
        blocks.setBlockHealth([x, y, z], Math.floor(Math.random() * 1024))
      }
    }
  }
}
const showCaves = false;
let simplex = new SimplexNoise();
function makeCaves(blocks: Blocks) {
  for (let y = 0; y < WORLD_DEPTH; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        let fade = Math.max(0, Math.min(1, (y - 5) / 5))
        fade *= Math.min(8, Math.min(x, WORLD_SIZE-x))/8
        fade *= Math.min(8, Math.min(z, WORLD_SIZE-z))/8
        const mult = .08;
        const threshold = 0.45;
        const isCave = simplex.noise3D(x * mult, y * mult, z * mult) * fade > threshold;
        if (showCaves) {
          blocks.setBlock([x, y, z], isCave ? 2 : 0);
        } else {
          if (isCave) blocks.setBlock([x, y, z], 0)
        }
      }
    }
  }
}