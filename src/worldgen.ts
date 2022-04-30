import { LAYER_SIZE, Blocks, WORLD_DEPTH } from "./main"

type WorldGen = { y: number, tries: Try[] }[]

type Try = { chance: number, do: Do } | { do: Do }

type Do = number | "firstlayer"

const worldgen: WorldGen = [
  { y: 5, tries: [{ do: 0 }] },
  { y: 6, tries: [{ do: "firstlayer" }] },
]



export function generate(blocks: Blocks) {
  let section = 0;
  for (let y = 0; y < WORLD_DEPTH; y++) {
    if (y > worldgen[section].y) section++;
    if (section >= worldgen.length) break;
    for (let i = 0; i < LAYER_SIZE; i++) {
      for (const tri of worldgen[section].tries) {
        if ("chance" in tri) {
          if (Math.random() < tri.chance) continue;
        }

        if (typeof tri.do == "number") {
          blocks.array[y * LAYER_SIZE + i] = tri.do;
        } else if (tri.do == "firstlayer") {
          blocks.array[y * LAYER_SIZE + i] = 1;
        }

        break;
      }
    }
  }

}
