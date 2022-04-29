import './style.css'
import { mat4 } from 'gl-matrix';

function error(message: string): never {
  alert(message);
  throw new Error(message);
}

type ProgramInfo = {
  program: WebGLProgram,
  attribLocations: {
    vertexPosition: number,
    blockPosition: number,
  },
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation,
    modelViewMatrix: WebGLUniformLocation,
  }
};

function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

  const gl = canvas.getContext('webgl2');

  if (!gl) error("Unable to initialize WebGL2");

  const vsSource = `
    attribute vec4 aVertexPosition;
  
    attribute vec3 aBlockPosition;
  
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * (aVertexPosition - vec4(aBlockPosition, 0.0));
    }
  `;

  const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo: ProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      blockPosition: gl.getAttribLocation(shaderProgram, 'aBlockPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix') ?? error("couldn't find uniform uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix') ?? error("couldn't find uniform uModelViewMatrix"),
    }
  };

  console.log(programInfo.attribLocations)

  const buffers = initBuffers(gl);

  let then = 0;

  function render(now: number) {
    now *= 0.001;
    const dt = now - then;
    then = now;

    drawScene(gl!, programInfo, buffers, dt);

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
  blockPosition: WebGLBuffer,
  indices: WebGLBuffer,
}

function initBuffers(gl: WebGL2RenderingContext): Buffers {
  const vertexPositionBuffer = gl.createBuffer();
  if (!vertexPositionBuffer) error("error creating buffer");

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
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
  
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];
  
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


  const blockPositionBuffer = gl.createBuffer();
  if (!blockPositionBuffer) error("error creating buffer")

  gl.bindBuffer(gl.ARRAY_BUFFER, blockPositionBuffer);

  const blockPositions = [
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    -1.0, 0.0, 0.0,
    0.0, -1.0, 0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blockPositions), gl.STATIC_DRAW);

  return {
    vertexPosition: vertexPositionBuffer,
    indices: indexBuffer,
    blockPosition: blockPositionBuffer,
  };
}

let rotation = 0.0;
function drawScene(gl: WebGL2RenderingContext, programInfo: ProgramInfo, buffers: Buffers, dt: number) {
  rotation += dt;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
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
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])
  mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);

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

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.blockPosition);
    gl.vertexAttribPointer(
      programInfo.attribLocations.blockPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset,
    )
    gl.vertexAttribDivisor(programInfo.attribLocations.blockPosition, 1)
    gl.enableVertexAttribArray(programInfo.attribLocations.blockPosition);
  }
  
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

  {
    const offset = 0;
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const instanceCount = 5;

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, offset, vertexCount, 5);
    gl.drawElementsInstanced(gl.TRIANGLE_STRIP, vertexCount, type, offset, instanceCount)
  }
}

window.onload = main;