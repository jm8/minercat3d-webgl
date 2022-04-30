import { GameData } from "./main"
import { vec2, vec3 } from "gl-matrix"
import { generateLayer } from "./worldgen";

let pressedKeys = Object.create(null);
let justPressedKeys = Object.create(null);
window.onkeydown = e => {
  if (!pressedKeys[e.code]) justPressedKeys[e.code] = true;
  pressedKeys[e.code] = true;
}
window.onkeyup = e => pressedKeys[e.code] = false;

// mouseDelta is reset every update
let mouseDelta = vec2.create();
window.addEventListener('mousemove', e => {
  if (!document.pointerLockElement) return;
  if (e.movementX !== -2) mouseDelta[0] += e.movementX;
  mouseDelta[1] += e.movementY;
});

export function update(gameData: GameData, dt: number) {
  mouse(dt, gameData);
  keyboard(dt, gameData);  
  justPressedKeys = Object.create(null);
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
    vec3.normalize(gameData.cameraFront, direction);
}

function keyboard(dt: number, gameData: GameData) {
  const speed = 8 * dt;
  if (pressedKeys.KeyW) {
    vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, gameData.cameraFront, speed);
  }
  if (pressedKeys.KeyS) {
    vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, gameData.cameraFront, -speed);
  }
  if (pressedKeys.Space) {
    vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, gameData.cameraUp, speed);
  }
  if (pressedKeys.ShiftLeft) {
    vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, gameData.cameraUp, -speed);
  }
  if (pressedKeys.KeyA) {
    const right = vec3.create();
    vec3.cross(right, gameData.cameraFront, gameData.cameraUp);
    vec3.normalize(right, right);
    vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, right, -speed);
  }
  if (pressedKeys.KeyD) {
    const right = vec3.create();
    vec3.cross(right, gameData.cameraFront, gameData.cameraUp);
    vec3.normalize(right, right);
    vec3.scaleAndAdd(gameData.cameraPos, gameData.cameraPos, right, speed);
  }
}
