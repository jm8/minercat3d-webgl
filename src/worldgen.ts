import {LAYER_SIZE, Blocks } from "./main"

export function generateLayer(blocks: Blocks, y: number) {
  for (let i = 0; i < LAYER_SIZE; i++) {
    blocks.array[y*LAYER_SIZE + i ] = y % 41;
  }
  blocks.sendLayer(y);
}
