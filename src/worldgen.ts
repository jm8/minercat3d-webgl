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
          
          if (isCave(x, y, z)) {
            // blocks.setBlock([x, y, z], 3)
            continue;
          } else {
            // continue;
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
  }
}

let simplex = new SimplexNoise();
function isCave(x: number, y: number, z: number): boolean {
  let fade = Math.max(0, Math.min(1, (y-5)/5));
  
  return simplex.noise3D(x * .08, y * .08, z * .08)*fade > 0.8;
}