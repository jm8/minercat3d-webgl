import { mat4, vec3, vec4 } from 'gl-matrix';
import { eyeHeight, update } from './game';
import { generate } from './worldgen';

export const WORLD_SIZE = 24;
export const WORLD_DEPTH = 8250;
export const LAYER_SIZE = WORLD_SIZE * WORLD_SIZE;

function error(message: string): never {
  alert(message);
  throw new Error(message);
}

type ProgramInfo = {
  program: WebGLProgram,
  attribLocations: {
    vertexPosition: number,
    textureCoord: number,
    block: number,
  },
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation,
    modelViewMatrix: WebGLUniformLocation,
    sampler: WebGLUniformLocation,
    layerStart: WebGLUniformLocation,
    highlighted: WebGLUniformLocation,
  }
};

export class Blocks {
  array: Uint8Array

  constructor() {
    this.array = new Uint8Array(LAYER_SIZE * WORLD_DEPTH)
    generate(this);
  }

  gl: WebGL2RenderingContext | null = null
  buffer: WebGLBuffer | null = null

  getBlock([x, y, z]: vec3): number {
    if (x < 0 || x >= WORLD_SIZE) return 0;
    if (z < 0 || z >= WORLD_SIZE) return 0;
    if (y < 0 || y >= WORLD_DEPTH) return 0;
    return this.array[x + WORLD_SIZE * (z + WORLD_SIZE * y)]
  }
  
  setBlock([x, y, z]: vec3, block: number) {
    if (x < 0 || x >= WORLD_SIZE) return;
    if (z < 0 || z >= WORLD_SIZE) return;
    if (y < 0 || y >= WORLD_DEPTH) return;
    const i = x + WORLD_SIZE * (z + WORLD_SIZE * y);
    this.array[i] = block;
    this.gl?.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)
    this.gl?.bufferSubData(this.gl.ARRAY_BUFFER, i, this.array, i, 1);
   }
}

let gameData: GameData = {
  position: vec3.fromValues(WORLD_SIZE / 2, 10 + eyeHeight, WORLD_SIZE/2),
  // position: vec3.fromValues(WORLD_SIZE / 2, -6 + 4 + playerHeight, WORLD_SIZE/2),
  facing: vec3.fromValues(0, 0, 0),
  cameraUp: vec3.fromValues(0, 1, 0),

  pitch: 0,
  yaw: 0,
  
  highlighted: null,

  blocks: new Blocks(),
  
  velocity: vec3.create(),
  
  isOnGround: false,
};

export type GameData = {
  position: vec3,
  facing: vec3,
  cameraUp: vec3,

  pitch: number,
  yaw: number,
  highlighted: vec3 | null,
  blocks: Blocks
  
  velocity: vec3,
  
  isOnGround: boolean,
};

function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
  canvas.addEventListener('click', () => canvas.requestPointerLock());

  const gl = canvas.getContext('webgl2');

  if (!gl) error("Unable to initialize WebGL2");

  const vsSource = `#version 300 es

    // vertex attributes
    in vec4 aVertexPosition;
    in vec2 aTextureCoord;
  
    // instance attributes
    // don't understand why it's a float
    in float iBlock;
  
    out highp vec2 vTextureCoord;
    out float isAir;
    out float isHighlighted;
  
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform int layerStart;
    uniform vec3 highlighted; // index in array of highlighted block
    
    void main() {
      int x = gl_InstanceID % ${WORLD_SIZE};
      int zy = gl_InstanceID / ${WORLD_SIZE};
      int z = zy % ${WORLD_SIZE};
      int y = zy / ${WORLD_SIZE};
      
      vec3 blockPosition = vec3(x, -y-layerStart, z);
      vec3 highlightedPosition = vec3(highlighted.x, -highlighted.y, highlighted.z);
  
  
      // don't unedrstand why this works
      int blockId = int(iBlock);
      int textureNum;
  

      isAir = 0.0;
  

      if (gl_InstanceID == 0) {
        blockPosition = highlightedPosition;
        blockId = 40;
      }

      gl_Position = uProjectionMatrix * uModelViewMatrix * (aVertexPosition + vec4(blockPosition, 0.0));
  
      if (blockId == 0) { // air
        isAir = 1.0;
      } else if (blockId == 1) { // grass
        if (gl_VertexID >= 8 && gl_VertexID < 12) {
          // top
          textureNum = 0;
        } else if (gl_VertexID >= 12 && gl_VertexID < 16) {
          // bottom
          textureNum = 2;
        } else {
          textureNum = 1;
        }
      } else {
        textureNum = blockId + 0;
      }
  
      isHighlighted = blockPosition == highlightedPosition ? 1.0 : 0.0;
  
      vTextureCoord = (aTextureCoord + vec2(textureNum, 0.0)) / vec2(42.0, 1.0);
    }
  `;

  const fsSource = `#version 300 es
    precision mediump float;
    precision lowp sampler3D;    out vec4 fragColor;
  
    in highp vec2 vTextureCoord;
    in float isAir;
    in float isHighlighted;

    uniform sampler2D uSampler;
    
    void main() {
      if (isAir > 0.5) { discard; }
      
      fragColor = texture(uSampler, vTextureCoord);
 
      if (isHighlighted > 0.5) {
        vec2 uv = fract(vTextureCoord * vec2(42.0, 1.0));
        float pickerWidth =  1.0 / 16.0;
        if (uv.x < pickerWidth || uv.x > 1. - pickerWidth || uv.y < pickerWidth || uv.y > 1. - pickerWidth) {
          fragColor = vec4(1.0);
        }
      }
      
      // fragColor = vec4(vTextureCoord * vec2(42.0, 1.0), 0.0, 1.0);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo: ProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      block: gl.getAttribLocation(shaderProgram, 'iBlock'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix') ?? error("couldn't find uniform uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix') ?? error("couldn't find uniform uModelViewMatrix"),
      sampler: gl.getUniformLocation(shaderProgram, 'uSampler') ?? error("couldn't find uniform uSampler"),
      layerStart: gl.getUniformLocation(shaderProgram, 'layerStart') ?? error("couldn't find uniform layerStart"),
      highlighted: gl.getUniformLocation(shaderProgram, 'highlighted') ?? error("couldn't find uniform highlighted"),
    }
  };

  const buffers = initBuffers(gl);

  const blocksTexture = loadTexture(gl, 'blocks.png')

  let then = 0;

  function render(now: number) {
    now *= 0.001;
    const dt = now - then;
    then = now;

    update(gameData, dt);

    drawScene(gl!, blocksTexture, programInfo, buffers);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}

function initShaderProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) error("error creating shader program");

  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    error(`error linking shader program: ${gl.getProgramInfoLog(shaderProgram)}`)
  }

  return shaderProgram;
}


function loadShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) error("error creating shader");

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    error(`error compiling shader: ${log}`)
  }

  return shader;
}

type Buffers = {
  vertexPosition: WebGLBuffer,
  indices: WebGLBuffer,
  textureCoord: WebGLBuffer,
}

function loadTexture(gl: WebGL2RenderingContext, url: string): WebGLTexture {
  const texture = gl.createTexture()!;

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };
  image.src = url;

  return texture;
}

function initBuffers(gl: WebGL2RenderingContext): Buffers {

  const vertexPositionBuffer = gl.createBuffer()!;

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  const vertexPositions = [
    // Front face
    0.0, 0.0, 1.0,
    1.0, 0.0, 1.0,
    1.0, 1.0, 1.0,
    0.0, 1.0, 1.0,

    // Back face
    0.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    1.0, 0.0, 0.0,

    // Top face
    0.0, 1.0, 0.0,
    0.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 0.0,

    // Bottom face
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    // Right face
    1.0, 0.0, 0.0,
    1.0, 1.0, 0.0,
    1.0, 1.0, 1.0,
    1.0, 0.0, 1.0,

    // Left face
    0.0, 0.0, 0.0,
    0.0, 0.0, 1.0,
    0.0, 1.0, 1.0,
    0.0, 1.0, 0.0,
  ]

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  const indices = [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23,   // left
  ];

  Math.PI / 4
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


  const textureCoordBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,
    // Back
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,
    0.0, 1.0,
    // Top
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Bottom
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    // Right
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,
    0.0, 1.0,
    // Left
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

  const blocksBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, blocksBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, gameData.blocks.array, gl.DYNAMIC_DRAW);

  gameData.blocks.buffer = blocksBuffer;
  gameData.blocks.gl = gl;

  return {
    vertexPosition: vertexPositionBuffer,
    indices: indexBuffer,
    textureCoord: textureCoordBuffer,
  };
}

function drawScene(gl: WebGL2RenderingContext, texture: WebGLTexture, programInfo: ProgramInfo, buffers: Buffers) {
  const skyColor = vec3.fromValues(.40, 1, .996);
  const caveColor = vec3.fromValues(0, .192, .188);

  const mix = Math.max(0, Math.min(1, -gameData.position[1] / 10));
  const color = vec3.create();
  vec3.scale(color, skyColor, 1 - mix);
  vec3.scaleAndAdd(color, color, caveColor, mix);

  gl.clearColor(color[0], color[1], color[2], 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = Math.PI / 4;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  const lookAtPos = vec3.create();
  vec3.add(lookAtPos, gameData.position, gameData.facing);
  mat4.lookAt(modelViewMatrix, gameData.position, lookAtPos, gameData.cameraUp)

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexPosition);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  const playerLayer = -Math.floor(gameData.position[1]);
  const viewDistance = 100;

  const layerStart = Math.min(Math.max(0, playerLayer - viewDistance), WORLD_DEPTH - 1);
  const layerEnd = Math.max(0, Math.min(WORLD_DEPTH - 1, playerLayer + viewDistance));

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

  gl.bindBuffer(gl.ARRAY_BUFFER, gameData.blocks.buffer);
  gl.vertexAttribPointer(programInfo.attribLocations.block, 1, gl.UNSIGNED_BYTE, false, 0, layerStart * LAYER_SIZE);
  gl.vertexAttribDivisor(programInfo.attribLocations.block, 1);
  gl.enableVertexAttribArray(programInfo.attribLocations.block);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  gl.uniform1i(
    programInfo.uniformLocations.layerStart,
    layerStart,
  );
  
  gl.uniform3fv(
    programInfo.uniformLocations.highlighted,
    gameData.highlighted ?? [0, 0, 0],
  )

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(programInfo.uniformLocations.sampler, 0);

  {
    const offset = 0;
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const instanceCount = LAYER_SIZE * (layerEnd - layerStart);

    gl.drawElementsInstanced(gl.TRIANGLES, vertexCount, type, offset, instanceCount)
  }
}

window.onload = main;