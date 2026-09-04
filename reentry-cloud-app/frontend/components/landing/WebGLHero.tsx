"use client";

import { useEffect, useRef } from "react";

const MESH_COLUMNS = 64;
const MESH_ROWS = 48;

const vertexShaderSource = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_time;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;

    vec2 pointer = u_pointer / u_resolution * 2.0 - 1.0;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 distanceVector = a_position - pointer;
    distanceVector.x *= aspect;
    float distanceToPointer = length(distanceVector);
    vec2 direction = distanceVector / max(distanceToPointer, 0.0001);
    direction.x /= aspect;
    float influence = exp(-distanceToPointer * 2.6);
    float ripple = sin(distanceToPointer * 28.0 - u_time * 3.5) * 0.032 * influence;

    vec2 meshPosition = a_position;
    meshPosition += direction * ripple;
    meshPosition -= direction * influence * 0.018;
    meshPosition += vec2(-direction.y, direction.x)
      * cos(distanceToPointer * 18.0 - u_time * 2.0)
      * 0.014
      * influence;

    gl_Position = vec4(meshPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_time;
  varying vec2 v_uv;

  #define PI 3.14159265359

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float bottom = mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x);
    float top = mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), local.x);
    return mix(bottom, top, local.y);
  }

  void main() {
    vec2 pixel = v_uv * u_resolution;
    float scale = min(u_resolution.x, u_resolution.y);
    vec2 uv = (pixel - 0.5 * u_resolution) / scale;
    vec2 pointer = (u_pointer - 0.5 * u_resolution) / scale;
    float time = u_time * 0.22;

    uv -= pointer * 0.07;
    float radius = length(uv);
    float pointerTwist = (pointer.x * 0.16 - pointer.y * 0.10) * smoothstep(0.9, 0.05, radius);
    float angle = atan(uv.y, uv.x) + pointerTwist;
    float atmosphere = noise(uv * 3.2 + vec2(time, -time));
    vec2 warped = uv + 0.035 * vec2(
      noise(uv * 4.0 + time),
      noise(uv * 4.0 - time)
    );
    float warpedRadius = length(warped);

    vec3 color = vec3(0.018, 0.035, 0.028);
    color += vec3(0.08, 0.23, 0.12) * exp(-radius * 3.2);
    color += vec3(0.02, 0.19, 0.17) * exp(-length(uv - pointer * 0.42) * 7.0);

    for (int index = 0; index < 3; index += 1) {
      float phase = float(index) * (PI * 2.0 / 3.0);
      float orbit = 0.34 + sin(angle * 2.0 + time * 2.0 + phase) * 0.045;
      float ribbon = exp(-abs(warpedRadius - orbit) * 90.0);
      float shimmer = 0.65 + 0.35 * sin(angle * 5.0 - time * 4.0 + phase);
      vec3 ribbonColor = mix(
        vec3(0.60, 0.98, 0.34),
        vec3(0.17, 0.84, 0.76),
        0.5 + 0.5 * sin(angle + phase)
      );
      color += ribbonColor * ribbon * shimmer * 0.32;
    }

    float halo = exp(-abs(warpedRadius - 0.43) * 45.0);
    color += vec3(0.36, 0.84, 0.43) * halo * 0.18;

    float core = exp(-pow(radius / 0.22, 2.0) * 2.2);
    float coreLight = 0.7 + 0.3 * sin(time * 6.0);
    color += mix(vec3(0.48, 0.98, 0.34), vec3(0.18, 0.72, 0.63), atmosphere) * core * coreLight;

    float pulse = exp(-abs(radius - (0.16 + 0.025 * sin(time * 4.0))) * 95.0);
    color += vec3(0.72, 1.0, 0.56) * pulse * 0.3;

    vec2 starsCell = floor((uv + 1.0) * 18.0);
    float star = step(0.992, hash(starsCell));
    float starFade = smoothstep(0.85, 0.15, radius) * (0.5 + 0.5 * sin(time * 5.0 + hash(starsCell) * 12.0));
    color += vec3(0.64, 0.95, 0.68) * star * starFade * 0.8;

    float grid = smoothstep(0.97, 1.0, sin(uv.x * 90.0) * sin(uv.y * 90.0));
    color += vec3(0.12, 0.35, 0.18) * grid * 0.025;

    float vignette = smoothstep(0.92, 0.18, radius);
    color *= vignette;
    color = pow(max(color, 0.0), vec3(0.92));
    gl_FragColor = vec4(color, 0.98);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program error";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function createMesh(columns: number, rows: number) {
  const vertices = new Float32Array((columns + 1) * (rows + 1) * 2);
  const indices = new Uint16Array(columns * rows * 6);

  let vertexOffset = 0;
  for (let row = 0; row <= rows; row += 1) {
    const y = row / rows * 2 - 1;
    for (let column = 0; column <= columns; column += 1) {
      const x = column / columns * 2 - 1;
      vertices[vertexOffset] = x;
      vertices[vertexOffset + 1] = y;
      vertexOffset += 2;
    }
  }

  let indexOffset = 0;
  const rowWidth = columns + 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * rowWidth + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + rowWidth;
      const bottomRight = bottomLeft + 1;

      indices[indexOffset] = topLeft;
      indices[indexOffset + 1] = bottomLeft;
      indices[indexOffset + 2] = topRight;
      indices[indexOffset + 3] = topRight;
      indices[indexOffset + 4] = bottomLeft;
      indices[indexOffset + 5] = bottomRight;
      indexOffset += 6;
    }
  }

  return { vertices, indices };
}

export default function WebGLHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;
    const interactionRegion = hero;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.warn("Re-entry WebGL hero unavailable", error);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const mesh = createMesh(MESH_COLUMNS, MESH_ROWS);

    if (
      positionLocation < 0 ||
      !resolutionLocation ||
      !pointerLocation ||
      !timeLocation ||
      !vertexBuffer ||
      !indexBuffer
    ) {
      gl.deleteProgram(program);
      return;
    }

    const surface: HTMLCanvasElement = canvas;
    const context: WebGLRenderingContext = gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    context.clearColor(0, 0, 0, 0);

    let width = 1;
    let height = 1;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let targetPointerX = 0.5;
    let targetPointerY = 0.5;
    let animationFrame = 0;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;

    function clamp(value: number) {
      return Math.min(1, Math.max(0, value));
    }

    function scheduleRender() {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function resize() {
      const bounds = surface.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(bounds.width * pixelRatio));
      height = Math.max(1, Math.round(bounds.height * pixelRatio));
      if (surface.width !== width || surface.height !== height) {
        surface.width = width;
        surface.height = height;
        context.viewport(0, 0, width, height);
      }
    }

    function updatePointer(event: PointerEvent) {
      const bounds = interactionRegion.getBoundingClientRect();
      const insideHero =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      if (!insideHero) {
        resetPointer();
        return;
      }

      const nextPointerX = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1));
      const nextPointerY = clamp(1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1));
      if (nextPointerX === targetPointerX && nextPointerY === targetPointerY) return;

      targetPointerX = nextPointerX;
      targetPointerY = nextPointerY;
      scheduleRender();
    }

    function resetPointer() {
      if (targetPointerX === 0.5 && targetPointerY === 0.5) return;
      targetPointerX = 0.5;
      targetPointerY = 0.5;
      scheduleRender();
    }

    function render(now: number) {
      animationFrame = 0;
      resize();
      const easing = prefersReducedMotion ? 1 : 0.1;
      pointerX += (targetPointerX - pointerX) * easing;
      pointerY += (targetPointerY - pointerY) * easing;
      context.uniform2f(resolutionLocation, width, height);
      context.uniform2f(pointerLocation, pointerX * width, pointerY * height);
      context.uniform1f(timeLocation, prefersReducedMotion ? 0 : now * 0.001);
      context.clear(context.COLOR_BUFFER_BIT);
      context.drawElements(context.TRIANGLES, mesh.indices.length, context.UNSIGNED_SHORT, 0);

      const pointerIsSettled =
        Math.abs(targetPointerX - pointerX) < 0.001 && Math.abs(targetPointerY - pointerY) < 0.001;
      if (!prefersReducedMotion || !pointerIsSettled) scheduleRender();
    }

    function updateMotionPreference(event: MediaQueryListEvent) {
      prefersReducedMotion = event.matches;
      scheduleRender();
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      scheduleRender();
    });
    resizeObserver.observe(surface);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("blur", resetPointer);
    reducedMotionQuery.addEventListener("change", updateMotionPreference);
    resize();
    scheduleRender();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("blur", resetPointer);
      reducedMotionQuery.removeEventListener("change", updateMotionPreference);
      context.deleteBuffer(vertexBuffer);
      context.deleteBuffer(indexBuffer);
      context.deleteProgram(program);
    };
  }, []);

  return (
    <div ref={heroRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(159,232,112,0.17),transparent_22%),radial-gradient(circle_at_18%_65%,rgba(24,119,93,0.16),transparent_30%),linear-gradient(135deg,#09110c_0%,#07100d_48%,#09140c_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(7,16,11,0.1)_55%,rgba(7,16,11,0.86)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08110b] to-transparent" />
    </div>
  );
}
