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

export const eyeHeight = 3.5;
export const foreheadHeight = 0;

export function update(gameData: GameData, dt: number) {
  mouse(dt, gameData);
  gameData.velocity[1] -= 16*dt;
  keyboard(dt, gameData);
   
  moveAndSlide(gameData, dt);

  
  if (justPressedMouseButtons[0] && gameData.highlighted) {
    gameData.blocks.setBlock(gameData.highlighted, 0)
  }
  
  gameData.highlighted = raycast(gameData);
  
  
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

function mouse(dt: number, gameData: GameData) {
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

function keyboard(dt: number, gameData: GameData) {
  const speed = 8;
  const forward = vec3.copy(vec3.create(), gameData.facing);
  forward[1] = 0;
  vec3.normalize(forward, forward);
  
  const right = vec3.cross(vec3.create(), forward, [0, 1, 0]);

  if (pressedKeys.KeyW) {
    vec3.scaleAndAdd(gameData.position, gameData.position, forward, speed*dt);
  }
  if (pressedKeys.KeyS) {
    vec3.scaleAndAdd(gameData.position, gameData.position, forward, -speed*dt);
  }
  if (pressedKeys.Space && gameData.isOnGround) {
    gameData.velocity[1] = 10;
    // vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, gameData.cameraUp, speed*dt);
  }
  if (pressedKeys.ShiftLeft) {
    // vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, gameData.cameraUp, -speed*dt);
  }
  if (pressedKeys.KeyA) {
    vec3.scaleAndAdd(gameData.position, gameData.position, right, -speed*dt);
  }
  if (pressedKeys.KeyD) {
    vec3.scaleAndAdd(gameData.position, gameData.position, right, speed*dt);
  }
}

function toBlockCoords(result: vec3, position: vec3): vec3 {
  vec3.copy(result, position);
  result[1] *= -1;
  vec3.floor(result, result);
  return result;
}

function moveAndSlide(gameData: GameData, dt: number) {
  const vdt = vec3.scale(vec3.create(), gameData.velocity, dt);
  moveYDown(gameData, vdt[1]);
  
}

function moveYDown(gameData: GameData, dy: numbe) {
  const ySteps = 6; // should be >= terminal velocity
  let pointOffset;
  if (dy > 0) {
    pointOffset = foreheadHeight;
    gameData.isOnGround = false;
  } else {
    pointOffset = -eyeHeight;
  }
  for (let i = 0; i < ySteps; i++) {
    gameData.position[1] += dy / ySteps;
    debug("position", gameData.position);

    const point = vec3.copy(vec3.create(), gameData.position);
    point[1] += pointOffset;
    
    const pointBlock = toBlockCoords(vec3.create(), point);
    if (dy < 0) debug("feet block", pointBlock)

    if (gameData.blocks.getBlock(pointBlock)) {
      if (dy < 0) {
        gameData.position[1] = -pointBlock[1] - pointOffset
        gameData.isOnGround = true;
      } else {
        gameData.position[1] = -pointBlock[1] - pointOffset - 1;
      }
      gameData.velocity[1] = 0;
      break;
    } else {
      if (dy < 0) {
        gameData.isOnGround = false;
      }
    }
  }
}

