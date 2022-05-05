import { defaultPosition, GameData } from "./main"
import { vec2, vec3 } from "gl-matrix"
import { debug } from "./debug";
import { backpackSpace, blockTypeCash, blockTypeHealth, pickaxeCost, pickaxeName, pickaxeSpeed, backpackName, backpackCost, armorHealth, armorName, armorCost } from "./content";

let pressedKeys = Object.create(null);
let justPressedKeys = Object.create(null);
window.onkeydown = e => {
  if (!pressedKeys[e.code]) justPressedKeys[e.code] = true;
  pressedKeys[e.code] = true;
}
window.onkeyup = e => pressedKeys[e.code] = false;

let pressedMouseButtons = Object.create(null);
let justPressedMouseButtons = Object.create(null);
window.onmousedown = e => {
  justPressedMouseButtons[e.button] = true;
  pressedMouseButtons[e.button] = true;
}

window.onmouseup = e => {
  pressedMouseButtons[e.button] = false;
}

// mouseDelta is reset every update
let mouseDelta = vec2.create();
window.addEventListener('mousemove', e => {
  if (paused) return;
  if (!document.pointerLockElement) return;
  if (e.movementX !== -2) mouseDelta[0] += e.movementX;
  mouseDelta[1] += e.movementY;
});

export const tall = true;
export const eyeHeight = tall ? 1.75 : 2.75;
export const foreheadHeight = 0;
export const playerWidth = 0.1875;

const fly = false;

const backpackSpan = document.getElementById("backpack")!;
const shopButton = document.getElementById("shop")!;
const sellAllButton = document.getElementById("sellall")!;
const buyButton = document.getElementById("buy")!;
const layerSpan = document.getElementById("layer")!;
const cashSpan = document.getElementById("cash")!;
const hpSpan = document.getElementById("hp")!;
const shopInfoName = document.getElementById("shopinfoname")!;
const shopInfoNumber = document.getElementById("shopinfonumber")!;
const shopmenu = document.getElementById("shopmenu")!;
const shopTabs = document.getElementById("shoptabs")!;
const shopIcon = (document.getElementById("shopicon") as HTMLImageElement)!;
const shopPrice = document.getElementById("shopprice")!;
const shopMax = document.getElementById("shopmax")!;
const shopNotMax = document.getElementById("shopnotmax")!;

let sellAllClicked = false;

sellAllButton.addEventListener('click', () => {
  document.getElementById("canvas")!.requestPointerLock();
  sellAllClicked = true;
})

// jank
let paused = false;

let shopButtonClicked = false;
shopButton.addEventListener('click', () => {
  if (paused) document.getElementById("canvas")!.requestPointerLock();
  shopButtonClicked = true;
})

let buyButtonClicked = false;
buyButton.addEventListener('click', () => {
  buyButtonClicked = true;
})

let tabClicked: number | null = null;

for (let i = 0; i < shopTabs.children.length; i++) {
  shopTabs.children[i].addEventListener('click', () => {
    tabClicked = i;
  });
}

export function update(gameData: GameData, dt: number) {
  paused = gameData.shop.open;

  if (!paused) {
    controls(gameData, dt);
  }

  processButtons(gameData);

  layerSpan.textContent = (gameData.position[1] - eyeHeight).toFixed();
  cashSpan.textContent = toNumberString(gameData.cash) + "$";
  hpSpan.textContent = "hp:" + gameData.hp.toString();
  backpackSpan.textContent = `${gameData.backpackContents.length}/${backpackSpace[gameData.backpack]}`


  debug("position", gameData.position)
  debug("facing", gameData.facing)
  debug("pitch", gameData.pitch)
  debug("yaw", gameData.yaw)
  debug("highlighted position", gameData.highlighted)
  const blockType = gameData.blocks.getBlock(gameData.highlighted ?? [0, 0, 0]);
  debug("highlighted block id", blockType)
  debug("highlighted block health", gameData.blocks.getBlockHealth(gameData.highlighted ?? [0, 0, 0]))
  debug("highlighted block max health", blockTypeHealth[blockType])
  debug("highlighted block cash", blockTypeCash[blockType])
  debug("velocity", gameData.velocity)
  debug("isOnGround", gameData.isOnGround)
  debug("pickaxe", gameData.pickaxe)
  debug("pickaxe speed", pickaxeSpeed[gameData.pickaxe]);
  debug("backpack", gameData.backpackContents);
  debug("feetpos", gameData.position[1] - eyeHeight);

  justPressedKeys = Object.create(null);
  justPressedMouseButtons = Object.create(null);
}

function controls(gameData: GameData, dt: number) {
  mouse(dt, gameData);
  if (!fly) {
    gameData.velocity[1] -= 16 * dt;
    if (gameData.velocity[1] < -30) {
      gameData.velocity[1] = -30;
    }
  }

  keyboard(dt, gameData);
  move(gameData, dt);

  if (pressedMouseButtons[0] && gameData.highlighted) {
    gameData.blocks.damage(gameData.highlighted, pickaxeSpeed[gameData.pickaxe] * dt);
  }

  gameData.highlighted = raycast(gameData);
}

function processButtons(gameData: GameData) {
  if (buyButtonClicked) {
    if (gameData.shop.tab === 0 && gameData.pickaxe+1 < pickaxeCost.length && gameData.cash >= pickaxeCost[gameData.pickaxe+1]) {
      gameData.cash -= pickaxeCost[gameData.pickaxe+1]
      gameData.pickaxe++;
    }
    if (gameData.shop.tab === 1 && gameData.backpack+1 < backpackCost.length && gameData.cash >= backpackCost[gameData.backpack+1]) {
      gameData.cash -= backpackCost[gameData.backpack+1]
      gameData.backpack++;
    }
    if (gameData.shop.tab === 2 && gameData.armor+1 < armorCost.length && gameData.cash >= armorCost[gameData.armor+1]) {
      gameData.cash -= armorCost[gameData.armor+1]
      gameData.armor++;
    }
    showShopData(gameData.shop.tab, gameData);
    buyButtonClicked = false;
  }
  if (sellAllClicked) {
    vec3.zero(gameData.velocity);
    vec3.copy(gameData.position, defaultPosition);

    for (const block of gameData.backpackContents) {
      gameData.cash += blockTypeCash[block];
    }
    gameData.backpackContents.length = 0;

    sellAllClicked = false;
  }

  if (shopButtonClicked) {
    if (gameData.shop.open) {
      gameData.shop.open = false;
      shopButton.textContent = "shop";
      shopmenu.classList.remove("visible");
    } else {
      showShopData(gameData.shop.tab, gameData);
      gameData.shop.open = true;
      shopButton.textContent = "back";
      shopmenu.classList.add("visible");
    }

    shopButtonClicked = false;
  }

  if (tabClicked !== null) {
    for (let i = 0; i < shopTabs.children.length; i++) {
      if (i == tabClicked)
        shopTabs.children[i].classList.add("selected");
      else
        shopTabs.children[i].classList.remove("selected");
    }
    gameData.shop.tab = tabClicked;

    showShopData(gameData.shop.tab, gameData);

    tabClicked = null;
  }
}

function showShopData(tab: number, gameData: GameData) {
  if (tab === 0) {
    if (gameData.pickaxe + 1 < pickaxeCost.length) {
      shopNotMax.classList.add("visible");
      shopMax.classList.remove("visible");
      shopIcon.src = `/minercat3d/pickaxe/pickaxe${gameData.pickaxe + 2}.png`;
      shopPrice.textContent = pickaxeCost[gameData.pickaxe + 1] + "$";
      shopInfoName.textContent = pickaxeName[gameData.pickaxe + 1].toLowerCase();
      shopInfoNumber.textContent = "speed: " + pickaxeSpeed[gameData.pickaxe + 1];
    } else {
      shopNotMax.classList.remove("visible");
      shopMax.classList.add("visible");
    }
  } else if (tab === 1) {
    if (gameData.backpack + 1 < backpackCost.length) {
      shopNotMax.classList.add("visible");
      shopMax.classList.remove("visible");
    shopIcon.src = `/minercat3d/backpack/backpack${gameData.backpack + 2}.png`;
    shopPrice.textContent = backpackCost[gameData.backpack + 1] + "$";
    shopInfoName.textContent = backpackName[gameData.backpack + 1].toLowerCase();
    shopInfoNumber.textContent = "space: " + backpackSpace[gameData.backpack + 1];
    } else {
      shopNotMax.classList.remove("visible");
      shopMax.classList.add("visible");
    }
  } else if (tab === 2) {
    if (gameData.armor + 1 < armorCost.length) {
      shopNotMax.classList.add("visible");
      shopMax.classList.remove("visible");
    shopIcon.src = `/minercat3d/armor/armor${gameData.armor + 2}.png`;
    shopPrice.textContent = armorCost[gameData.armor + 1] + "$";
    shopInfoName.textContent = armorName[gameData.armor + 1].toLowerCase();
    shopInfoNumber.textContent = "health: " + armorHealth[gameData.armor + 1];
    } else {
      shopNotMax.classList.remove("visible");
      shopMax.classList.add("visible");
    }
  }
}

function toNumberString(x: number) {
  return x.toFixed();
}

function raycast(gameData: GameData) {
  const highlightDist = 5;

  const curr = vec3.create();
  const currBlock = vec3.create();

  let i = 0;
  while (i < highlightDist) {
    vec3.scaleAndAdd(curr, gameData.position, gameData.facing, i);
    toBlockCoords(currBlock, curr);
    if (gameData.blocks.getBlock(currBlock)) {
      return currBlock;
    }

    i += .01;
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
    else if (gameData.isOnGround) gameData.velocity[1] = 9;
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
  vec3.floor(result, result);
  result[1] *= -1;
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
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    vec3.scaleAndAdd(gameData.position, gameData.position, movement, 1 / steps);
    if (isColliding(gameData)) {
      vec3.scaleAndAdd(gameData.position, gameData.position, movement, -1 / steps);
      return true;
    }
  }
  return false;
}

const corners = [
  vec3.fromValues(-playerWidth, -eyeHeight, -playerWidth),
  vec3.fromValues(-playerWidth, -eyeHeight, playerWidth),
  vec3.fromValues(playerWidth, -eyeHeight, -playerWidth),
  vec3.fromValues(playerWidth, -eyeHeight, playerWidth),
  vec3.fromValues(-playerWidth, foreheadHeight, -playerWidth),
  vec3.fromValues(-playerWidth, foreheadHeight, playerWidth),
  vec3.fromValues(playerWidth, foreheadHeight, -playerWidth),
  vec3.fromValues(playerWidth, foreheadHeight, playerWidth),
  vec3.fromValues(-playerWidth, (foreheadHeight - eyeHeight) / 2, -playerWidth),
  vec3.fromValues(-playerWidth, (foreheadHeight - eyeHeight) / 2, playerWidth),
  vec3.fromValues(playerWidth, (foreheadHeight - eyeHeight) / 2, -playerWidth),
  vec3.fromValues(playerWidth, (foreheadHeight - eyeHeight) / 2, playerWidth),
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
