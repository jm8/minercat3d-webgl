import {LAYER_SIZE, Blocks } from "./main"

export function generateLayer(blocks: Blocks, y: number) {
  if (y == 0) {
    
  }
  for (let i = 0; i < LAYER_SIZE; i++) {
    blocks.array[y*LAYER_SIZE + i ] = 2;
  }
  blocks.sendLayer(y);
}
