import { GameData } from "./main"
import { vec2, vec3 } from "gl-matrix"

let pressedKeys = Object.create(null);
window.onkeydown = e => pressedKeys[e.code] = true;
window.onkeyup = e => pressedKeys[e.code] = false;

// mouseDelta is reset every update
let mouseDelta = vec2.create();
window.addEventListener('mousemove', e => {
  mouseDelta[0] += e.movementX;
  mouseDelta[1] += e.movementY;
});

export function update(gameData: GameData, dt: number) {
  keyboard(dt, gameData);
  mouse(dt, gameData);
}

function mouse(dt: number, gameData: GameData) {
  if (mouseDelta[0] == 0 && mouseDelta[1] == 0) {
    return;
  }
  
  const sensitivity = 0.2;
  vec2.scale(mouseDelta, mouseDelta, sensitivity);
  
  gameData.yaw += mouseDelta[0];
  gameData.pitch -= mouseDelta[1];  
  
  if (gameData.pitch > 89.0) {
    gameData.pitch = 89.0;
  }
  if (gameData.pitch < -89.0) {
    gameData.pitch = -89.0
  }
  
  const direction = vec3.create();
  const rad = (x: number) => x / 180 * Math.PI;
  direction[0] = Math.cos(rad(gameData.yaw) * Math.cos(rad(gameData.pitch)));
  direction[1] = Math.sin(rad(gameData.pitch));
  direction[2] = Math.sin(rad(gameData.yaw)) * Math.cos(rad(gameData.pitch));
  vec3.normalize(gameData.cameraFront, direction);
  
  vec2.zero(mouseDelta);
}

function keyboard(dt: number, gameData: GameData) {
  const speed = 4 * dt;
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
