import { GameData } from "./main"
import { vec2, vec3 } from "gl-matrix"
import { debug } from "./debug";

let pressedKeys = Object.create(null);
let justPressedKeys = Object.create(null);
window.onkeydown = e => {
  if (!pressedKeys[e.code]) justPressedKeys[e.code] = true;
  pressedKeys[e.code] = true;
}
window.onkeyup = e => pressedKeys[e.code] = false;

let justPressedMouseButtons = Object.create(null);
window.onmousedown = e => {
  justPressedMouseButtons[e.button] = true;
}

// mouseDelta is reset every update
let mouseDelta = vec2.create();
window.addEventListener('mousemove', e => {
  if (!document.pointerLockElement) return;
  if (e.movementX !== -2) mouseDelta[0] += e.movementX;
  mouseDelta[1] += e.movementY;
});

export const eyeHeight = 3.0;
export const foreheadHeight = 0;
export const playerWidth = .2;

const fly = false;

export function update(gameData: GameData, dt: number) {
  mouse(dt, gameData);
  if (!fly) gameData.velocity[1] -= 16*dt;
  keyboard(dt, gameData);
  move(gameData, dt);
  
  if (justPressedMouseButtons[0] && gameData.highlighted) {
    gameData.blocks.setBlock(gameData.highlighted, 0)
  }
  
  gameData.highlighted = raycast(gameData);
  
  debug("is on ground", gameData.isOnGround)
  
  // debug("gameData", gameData)
  // debug("gameData", {})
  // debug("position", gameData.position)
  // debug("facing", gameData.facing)
  // debug("cameraUp", gameData.cameraUp)
  // debug("pitch", gameData.pitch)
  // debug("yaw", gameData.yaw)
  // debug("highlighted", gameData.highlighted)
  // debug("blocks", gameData.blocks)
  // debug("velocity", gameData.velocity)
  // debug("isOnGround", gameData.isOnGround)
  justPressedKeys = Object.create(null);
  justPressedMouseButtons = Object.create(null);
}


function raycast(gameData: GameData) {
  const highlightDist = 100;
  
  const curr = vec3.create();

  for (let i = 0; i < highlightDist; i += 0.5) {
    vec3.scaleAndAdd(curr, gameData.position, gameData.facing, i);
    vec3.floor(curr, curr);
    curr[1] *= -1;
    if (gameData.blocks.getBlock(curr)) {
      return curr;
    }
  }

  return null;

}

function mouse(_dt: number, gameData: GameData) {
  let keyboardSpeed = 5;
  if (pressedKeys.ArrowRight) mouseDelta[0] += keyboardSpeed;
  if (pressedKeys.ArrowLeft) mouseDelta[0] -= keyboardSpeed;
  if (pressedKeys.ArrowUp) mouseDelta[1] -= keyboardSpeed;
  if (pressedKeys.ArrowDown) mouseDelta[1] += keyboardSpeed;


  const sensitivity = 0.15;
  vec2.scale(mouseDelta, mouseDelta, sensitivity);

  gameData.yaw += mouseDelta[0];
  gameData.pitch -= mouseDelta[1];

  if (gameData.pitch > 89.0) {
    gameData.pitch = 89.0;
  }
  if (gameData.pitch < -89.0) {
    gameData.pitch = -89.0
  }

  updateCameraFront(gameData);

  vec2.zero(mouseDelta);
}

function updateCameraFront(gameData: GameData) {
  const direction = vec3.create();
  const rad = (x: number) => x / 180 * Math.PI;
  direction[0] = Math.cos(rad(gameData.yaw)) * Math.cos(rad(gameData.pitch));
  direction[1] = Math.sin(rad(gameData.pitch));
  direction[2] = Math.sin(rad(gameData.yaw)) * Math.cos(rad(gameData.pitch));
  vec3.normalize(gameData.facing, direction);
}

function keyboard(_dt: number, gameData: GameData) {
  const speed = 8;
  const forward = vec3.copy(vec3.create(), gameData.facing);
  forward[1] = 0;
  vec3.normalize(forward, forward);
  
  const right = vec3.cross(vec3.create(), forward, [0, 1, 0]);
  
  gameData.velocity[0] = 0;
  if (fly) gameData.velocity[1] = 0;
  gameData.velocity[2] = 0;

  if (pressedKeys.KeyW) {
    vec3.scaleAndAdd(gameData.velocity, gameData.velocity, forward, speed);
  }
  if (pressedKeys.KeyS) {
    vec3.scaleAndAdd(gameData.velocity, gameData.velocity, forward, -speed);
  }
  if (pressedKeys.Space) {
    if (fly) gameData.velocity[1] = speed;
    else if (gameData.isOnGround) gameData.velocity[1] = 10;
  }
  if (pressedKeys.ShiftLeft) {
    if (fly) gameData.velocity[1] = -speed;
  }
  if (pressedKeys.KeyA) {
    vec3.scaleAndAdd(gameData.velocity, gameData.velocity, right, -speed);
  }
  if (pressedKeys.KeyD) {
    vec3.scaleAndAdd(gameData.velocity, gameData.velocity, right, speed);
  }
}

function toBlockCoords(result: vec3, position: vec3): vec3 {
  vec3.copy(result, position);
  result[1] *= -1;
  vec3.floor(result, result);
  return result;
}

function move(gameData: GameData, dt: number) {
  const vdt = vec3.scale(vec3.create(), gameData.velocity, dt);
  if (moveAxis(gameData, vec3.fromValues(vdt[0], 0, 0))) gameData.velocity[0] = 0;
  if (moveAxis(gameData, vec3.fromValues(0, vdt[1], 0))) {
    gameData.velocity[1] = 0;
    if (vdt[1] <= 0) gameData.isOnGround = true;
  } else {
    gameData.isOnGround = false;
  }
  if (moveAxis(gameData, vec3.fromValues(0, 0, vdt[2]))) gameData.velocity[2] = 0;
}

function moveAxis(gameData: GameData, movement: vec3): boolean {
  vec3.add(gameData.position, gameData.position, movement);
  if (isColliding(gameData)) {
    vec3.sub(gameData.position, gameData.position, movement);
    return true;
  }
  return false;
}

// TODO: only check needed corners
const corners = [
  vec3.fromValues(-playerWidth, -eyeHeight, -playerWidth),
  vec3.fromValues(-playerWidth, -eyeHeight, playerWidth),
  vec3.fromValues(playerWidth, -eyeHeight, -playerWidth),
  vec3.fromValues(playerWidth, -eyeHeight, playerWidth),
  vec3.fromValues(-playerWidth, foreheadHeight, -playerWidth),
  vec3.fromValues(-playerWidth, foreheadHeight, playerWidth),
  vec3.fromValues(playerWidth, foreheadHeight, -playerWidth),
  vec3.fromValues(playerWidth, foreheadHeight, playerWidth),
  // vec3.fromValues(-playerWidth, -foreheadHeight, -playerWidth),
  // vec3.fromValues(-playerWidth, -foreheadHeight, playerWidth),
  // vec3.fromValues(playerWidth, -foreheadHeight, -playerWidth),
  // vec3.fromValues(playerWidth, -foreheadHeight, playerWidth),
];

function isColliding(gameData: GameData): boolean {
  const block = vec3.create();
  const point = vec3.create();
  for (const corner of corners) {
    vec3.add(point, gameData.position, corner);
    toBlockCoords(block, point)
    if (gameData.blocks.getBlock(block)) return true;
  }
  return false;
}
