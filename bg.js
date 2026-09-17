/* =========================================================
   Live background. A domain warped, kaleidoscope folded
   plasma running in WebGL behind the whole invitation.
   Reacts to scroll position and to the kick drum.
   Falls back to an animated CSS gradient if WebGL is gone.
   ========================================================= */

(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "bgfx";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  if (reduce) { document.body.classList.add("bg-fallback"); return; }

  const gl =
    canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }) ||
    canvas.getContext("experimental-webgl");

  if (!gl) { document.body.classList.add("bg-fallback"); return; }

  const VERT = `
    attribute vec2 a;
    void main() { gl_Position = vec4(a, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform float u_scroll;
    uniform float u_pulse;
    uniform float u_rave;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.03;
        a *= 0.5;
      }
      return v;
    }

    // cosine gradient palette
    vec3 pal(float t, vec3 d) {
      return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + d));
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
      p *= 1.55;

      float t = u_time * 0.055 + u_scroll * 0.9;
      float beat = u_pulse;

      // breathing zoom on the kick
      p *= 1.0 - beat * 0.10;

      // kaleidoscope fold, 6 way, slowly rotating
      float ang = atan(p.y, p.x) + u_time * 0.045;
      float rad = length(p);
      float seg = 3.14159265 / 3.0;
      ang = mod(ang, seg);
      ang = abs(ang - seg * 0.5);
      p = vec2(cos(ang), sin(ang)) * rad;

      // domain warp
      vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.7));
      vec2 s = vec2(
        fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.6),
        fbm(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.45)
      );
      float f = fbm(p + 3.8 * s + beat * 0.35);

      float shift = u_time * 0.035 + u_scroll * 1.6 + u_rave * u_time * 0.5;
      vec3 phase = mix(vec3(0.02, 0.32, 0.62), vec3(0.65, 0.12, 0.42), u_rave);
      vec3 col = pal(f * 1.5 + shift, phase);

      // push saturation into the ridges so it reads as liquid, not soup
      float ridge = smoothstep(0.32, 0.86, f);
      col = mix(col * 0.35, col, ridge);
      col += vec3(1.0, 0.23, 0.12) * pow(ridge, 3.0) * (0.45 + beat * 1.1);

      // vignette so the copy on top stays readable
      float vig = 1.0 - smoothstep(0.35, 1.25, rad);
      col *= 0.30 + 0.70 * vig;
      col *= 0.62 + 0.55 * u_rave;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { document.body.classList.add("bg-fallback"); return; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    document.body.classList.add("bg-fallback");
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {
    res:    gl.getUniformLocation(prog, "u_res"),
    time:   gl.getUniformLocation(prog, "u_time"),
    scroll: gl.getUniformLocation(prog, "u_scroll"),
    pulse:  gl.getUniformLocation(prog, "u_pulse"),
    rave:   gl.getUniformLocation(prog, "u_rave")
  };

  // render at a fraction of device pixels, this is a background not a photo
  const SCALE = 0.42;
  function resize() {
    const w = Math.max(1, Math.floor(window.innerWidth * SCALE));
    const h = Math.max(1, Math.floor(window.innerHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // kick drum hook, app.js calls this
  let pulse = 0;
  window.__bgKick = function (amount) {
    pulse = Math.min(1.4, pulse + (amount || 0.9));
  };

  let raveTarget = 0, rave = 0;
  let running = true;
  const start = performance.now();

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  function frame(now) {
    if (!running) return;

    const time = (now - start) / 1000;

    // read scroll inside the render loop, no scroll event listener
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const scroll = max > 0 ? window.scrollY / max : 0;

    pulse *= 0.86;
    raveTarget = document.body.classList.contains("rave") ? 1 : 0;
    rave += (raveTarget - rave) * 0.04;

    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, time);
    gl.uniform1f(U.scroll, scroll);
    gl.uniform1f(U.pulse, pulse);
    gl.uniform1f(U.rave, rave);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
