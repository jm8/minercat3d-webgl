import { LAYER_SIZE, Blocks, WORLD_DEPTH, WORLD_SIZE } from "./main"

type WorldGen = WorldGenSection[]

type WorldGenSection = { y: number, tries: Try[], cavechance: number } | ({ y: number, tries: Try[] })

type Try = { chance: number, do: Do } | { do: Do }

type Do =
  | number
  | { type: "firstlayer" }

const worldgen: WorldGen = [
  { y: 5, tries: [{ do: 0 }] },
  { y: 6, tries: [{ do: { type: "firstlayer" } }] },
  { y: 7, tries: [{ do: 2 }] },
  {
    y: 10,
    tries: [
      { chance: 10, do: 4 },
      { chance: 12, do: 5 },
      { chance: 14, do: 6 },
      { chance: 16, do: 7 },
      { do: 3 },
    ],
  },
  {
    y: 24,
    tries: [
      { chance: 10, do: 4 },
      { chance: 12, do: 5 },
      { chance: 14, do: 6 },
      { chance: 16, do: 7 },
      { do: 3 }
    ],
    cavechance: 63,
  }
]

// inclusive
const randint = (a: number, b: number) => Math.floor(Math.random() * (b + 1 - a) + a)

export function generate(blocks: Blocks) {
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
      }
    }
    const thesection = worldgen[section];
    if ("cavechance" in thesection) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
          if (Math.random() < 1 / thesection.cavechance) {
            cave(blocks, x, y, z);
          }
        }
      }
    }
  }
}


function cave(blocks: Blocks, x: number, y: number, z: number) {
  const width = randint(3, 7);
  const depth = randint(3, 7);

  console.log(width, depth);

  for (let dx = 0; dx < width; dx++) {
    for (let dz = 0; dz < depth; dz++) {
      for (let dy = 0; dy < 3; dy++) {
        blocks.setBlock([x + dz, y - dy, z + dz], 0);
      }
    }
  }

}