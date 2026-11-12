"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion";
import { Mic, Square } from "lucide-react";

export type ParticleConversationProps = {
  /** Optional sandboxed renderer document for a local preview. */
  particleDocument?: string;
  /** Optional same-origin audio track played on activation. */
  defaultAudioUrl?: string;
  /** Start position, in seconds, for the optional audio track. */
  defaultAudioStart?: number;
  /** Optional downbeat, in seconds, after the track's buildup. */
  defaultAudioClimax?: number;
  /** Fill the available screen when mounted inside a device frame. */
  fillScreen?: boolean;
};

type Pair = readonly [string, string];
type AudioMeter = { pulse: number; level: number; bass: number; air: number; phrase: number; beat: number };
const silentMeter: AudioMeter = { pulse: 0, level: 0, bass: 0, air: 0, phrase: 1, beat: 0 };
type AudioSession = {
  context: AudioContext;
  frame: number;
  stream?: MediaStream;
  player?: HTMLAudioElement;
  objectUrl?: string;
};

const pairs: readonly Pair[] = [
  ["leaf", "wind"],
  ["shadow", "light"],
  ["wave", "light"],
];

const controlClass = "absolute inset-y-0 left-[43px] grid size-[58px] place-items-center rounded-full text-[#e9f3ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a8d3ff]";
const joinedPath = "M56 12 C61 19 66 22 72 22 C78 22 83 19 88 12 A29 29 0 1 1 88 46 C83 39 78 36 72 36 C66 36 61 39 56 46 A29 29 0 1 1 56 12 Z";
const closedPath = "M72 0 C72 0 72 0 72 0 C72 0 72 0 72 0 A29 29 0 1 1 72 58 C72 58 72 58 72 58 C72 58 72 58 72 58 A29 29 0 1 1 72 0 Z";

const seeds = Array.from({ length: 280 }, (_, index) => {
  const sample = (offset: number) => {
    const value = Math.sin((index + 1) * 127.1 + offset * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  return [sample(0), sample(1), sample(2)] as const;
});

function LocalMotes({ pair, cycle, active, audio }: {
  pair: Pair; cycle: number; active: boolean; audio: MotionValue<AudioMeter>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    const context = node?.getContext("2d");
    if (!node || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lean = pair[0] === "wave" ? -0.22 : 0.22;
    const start = performance.now();
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastDraw = 0;
    function draw(now: number) {
      if (!context) return;
      if (!reduced && now - lastDraw < (active ? 32 : 50)) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      const elapsed = reduced ? 0 : (now - start) / 1000;
      const { level, pulse, bass, air, phrase, beat } = reduced ? silentMeter : audio.get();
      const swell = Math.min(1, phrase);
      const burst = Math.max(0, phrase - 1);
      const direction = beat % 2 === 0 ? 1 : -1;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      for (const [angle, radius, seed] of seeds) {
        if (!active) {
          const drift = Math.sin(elapsed * 0.82 + angle * 7 + seed * 3);
          const x = width * (0.08 + angle * 0.84 + drift * 0.026);
          const y = height * (0.95 - angle * 0.09 - radius * 0.06 + drift * 0.021);
          context.fillStyle = seed > 0.65 ? "#a8d7ff" : "#466cff";
          context.globalAlpha = Math.min(1, reduced ? 1 : elapsed / 1.35) * (0.07 + seed * 0.28);
          context.beginPath();
          context.arc(x, y, 0.38 + seed * 1.1, 0, 2 * Math.PI);
          context.fill();
          continue;
        }
        const travel = (radius + elapsed * (0.17 + seed * 0.11)) % 1;
        const ribbon = Math.sin(travel * 6.2 - elapsed * 1.3 + seed * 2.1);
        const reach = 0.15 + swell * 0.21 + bass * 0.1 + pulse * 0.19 + burst * 0.14;
        const branch = seed > 0.73 ? 0.13 : -0.04;
        const x = width * (0.5 + branch + (angle - 0.5) * reach + (travel - 0.5) * (lean + 0.36) + ribbon * 0.13 + direction * pulse * travel * 0.09);
        const y = height * (0.92 - travel * (0.18 + swell * 0.62) + ribbon * 0.028 - pulse * seed * 0.09);
        context.fillStyle = seed > 0.85 - pulse * 0.17 - air * 0.05 ? "#c2e4ff" : "#456dff";
        context.globalAlpha = Math.min(1, (0.12 + seed * 0.48) * (0.30 + swell * 0.3 + level * 0.16 + pulse * 0.62 + burst * 0.3));
        context.beginPath();
        context.arc(x, y, 0.36 + seed * 0.9, 0, 2 * Math.PI);
        context.fill();
      }
      context.globalAlpha = 1;
      if (!reduced) frame = requestAnimationFrame(draw);
    }
    function resizeCanvas() {
      if (!node || !context) return;
      cancelAnimationFrame(frame);
      width = node.clientWidth;
      height = node.clientHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      node.width = Math.round(width * ratio);
      node.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(performance.now());
    }
    resizeCanvas();
    const resize = new ResizeObserver(resizeCanvas);
    resize.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [active, audio, cycle, pair]);

  return <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />;
}

const particleVertex = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const particleFragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform vec4 motion;
uniform vec4 sound;
out vec4 color;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1137, .1379));
  q += dot(q, q.yzx + 19.19);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 id = floor(p);
  vec2 t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  return mix(mix(hash(id), hash(id + vec2(1, 0)), t.x),
    mix(hash(id + vec2(0, 1)), hash(id + vec2(1, 1)), t.x), t.y);
}

vec2 ribbon(vec2 p, float t, float lift, float branch) {
  float bend = sin(p.x * 2.6 - t * .75 + branch * 2.0);
  vec2 advected = p * vec2(3.9, 8.0) + vec2(t * (-.58 + branch * .22), -t * .31);
  float fold = noise(advected + vec2(noise(advected * .55) * 2.4, bend * .7));
  float height = mix(-.69 + branch * .10, -.16 + branch * .29, lift);
  float slope = mix(.14, .42 - branch * .72, lift);
  float center = height + slope * p.x + bend * (.065 + lift * .06) + (fold - .5) * (.11 + lift * .23);
  float distance = abs(p.y - center);
  float taper = (1.0 - smoothstep(.21, 1.2, abs(p.x - branch * .13 + .17 * sin(t * .4))));
  float grain = noise(advected * 3.9);
  float body = exp(-distance * (12.0 + branch * 5.0)) * taper * (.35 + .65 * fold);
  float filaments = exp(-distance * (44.0 + branch * 12.0)) * taper * pow(grain, 1.8);
  return vec2(body, filaments);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = uv * 2.0 - 1.0;
  float t = motion.x;
  float lift = motion.y * min(1.0, motion.z);
  float surge = max(0.0, motion.z - 1.0);
  float pulse = sound.x * lift;
  p.y -= (.11 * pulse + .18 * surge) * sin(p.x * 2.1 + t * .7);
  p.x -= (.11 * pulse + .11 * surge) * motion.w * smoothstep(-.88, .3, p.y);
  p *= 1.0 / (1.0 + .14 * sound.y * lift + .28 * surge);

  vec2 mainRibbon = ribbon(p, t, lift, 0.0);
  vec2 fineRibbon = ribbon(p + vec2(.08, -.024), t + 1.7, lift, 1.0);
  float body = mainRibbon.x + fineRibbon.x * mix(.3, .68, lift);
  float edge = mainRibbon.y + fineRibbon.y * .55;

  vec2 dustPosition = uv * vec2(132.0, 240.0) + vec2(-t * 4.1, -t * 5.9);
  vec2 cell = floor(dustPosition);
  vec2 offset = vec2(hash(cell), hash(cell + 17.0)) * .6 + .2;
  float dust = (1.0 - smoothstep(.02, .24, length(fract(dustPosition) - offset)));
  dust *= smoothstep(.42, .88, hash(cell + 5.0)) * smoothstep(.09, .38, body);
  float accent = smoothstep(.82, .96, hash(cell + 12.0)) * sound.z;
  vec3 ink = vec3(.035, .17, .63) * body * (.45 + sound.y * .31 + pulse * .67 + surge * .32);
  ink += vec3(.26, .60, 1.0) * edge * (.49 + pulse * .62);
  ink += mix(vec3(.21, .54, .96), vec3(.73, .88, 1.0), accent) * dust * (.16 + sound.z * .25 + pulse * .23);
  color = vec4(1.0 - exp(-ink * 2.25), 1.0);
}`;

function createParticleSurface(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return;
  const program = gl.createProgram();
  if (!program) return;
  for (const [type, source] of [[gl.VERTEX_SHADER, particleVertex], [gl.FRAGMENT_SHADER, particleFragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      gl.deleteProgram(program);
      return;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return;
  }
  const resolution = gl.getUniformLocation(program, "resolution");
  const motionUniform = gl.getUniformLocation(program, "motion");
  const soundUniform = gl.getUniformLocation(program, "sound");
  return {
    draw(time: number, lift: number, sample: AudioMeter) {
      gl.useProgram(program);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform4f(motionUniform, time, lift, sample.phrase, sample.beat % 2 === 0 ? 1 : -1);
      gl.uniform4f(soundUniform, sample.pulse, sample.bass, sample.air, sample.level);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    resize(width: number, height: number) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },
    dispose() {
      gl.deleteProgram(program);
    },
  };
}

function GpuMotes({ pair, cycle, active, audio }: {
  pair: Pair; cycle: number; active: boolean; audio: MotionValue<AudioMeter>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const surface = createParticleSurface(node);
    if (!surface) {
      const frame = requestAnimationFrame(() => setFallback(true));
      return () => cancelAnimationFrame(frame);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let lastDraw = -Infinity;
    let frame = 0;
    function draw(now: number) {
      if (!surface) return;
      if (!document.hidden && now - lastDraw >= (active ? 31 : 49)) {
        lastDraw = now;
        const elapsed = reduced ? 0 : (now - start) / 1000;
        const lift = active ? reduced ? 1 : Math.min(1, elapsed * 1.6) : 0;
        surface.draw(elapsed + (cycle % 3) * .42, lift, reduced ? silentMeter : audio.get());
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    }
    function resize() {
      if (!node || !surface) return;
      const bounds = node.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio, 1.45);
      surface.resize(Math.max(1, Math.round(bounds.width * density)), Math.max(1, Math.round(bounds.height * density)));
    }
    const lost = (event: Event) => {
      event.preventDefault();
      setFallback(true);
    };
    resize();
    draw(start);
    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) {
        lastDraw = -Infinity;
        draw(start);
      }
    });
    observer.observe(node);
    node.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      node.removeEventListener("webglcontextlost", lost);
      surface.dispose();
    };
  }, [active, audio, cycle, fallback]);

  return fallback
    ? <LocalMotes pair={pair} cycle={cycle} active={active} audio={audio} />
    : <canvas ref={canvas} data-particle-renderer="webgl" aria-hidden="true" className="absolute inset-0 size-full" />;
}

function ParticleScene({ pair, cycle, active, document, audio }: {
  pair: Pair; cycle: number; active: boolean; document?: string; audio: MotionValue<AudioMeter>;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ channel: "atomicmotion-particle-conversation", pair, cycle, active }, "*");
  }, [active, pair, cycle]);

  useMotionValueEvent(audio, "change", sample => {
    frame.current?.contentWindow?.postMessage({
      channel: "atomicmotion-particle-conversation",
      audio: sample,
    }, "*");
  });

  useEffect(() => {
    if (!document) return;
    const ready = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.channel === "atomicmotion-particle-conversation" && event.data.ready) send();
    };
    window.addEventListener("message", ready);
    send();
    return () => window.removeEventListener("message", ready);
  }, [document, send]);

  if (!document) return <GpuMotes pair={pair} cycle={cycle} active={active} audio={audio} />;
  return <iframe ref={frame} srcDoc={document} onLoad={send} title="Pairing particles" aria-hidden="true" tabIndex={-1}
    sandbox="allow-scripts" className="pointer-events-none absolute inset-0 size-full border-0" />;
}

export function ParticleConversation({ particleDocument, defaultAudioUrl, defaultAudioStart = 0, defaultAudioClimax, fillScreen = false }: ParticleConversationProps) {
  const instructionsId = useId();
  const [active, setActive] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [status, setStatus] = useState("");
  const speakButton = useRef<HTMLButtonElement>(null);
  const capture = useRef<AudioSession | null>(null);
  const music = useRef<File | null>(null);
  const reducedMotion = useReducedMotion();
  const pair = pairs[Math.max(0, cycle - 1) % pairs.length];
  const split = { duration: reducedMotion ? 0 : 0.46, ease: [0.22, 1, 0.36, 1] as const };
  const audio = useMotionValue<AudioMeter>(silentMeter);

  const releaseAudio = useCallback(() => {
    const current = capture.current;
    capture.current = null;
    if (current) {
      cancelAnimationFrame(current.frame);
      current.stream?.getTracks().forEach(track => track.stop());
      if (current.player) {
        current.player.onended = null;
        current.player.pause();
        current.player.removeAttribute("src");
        current.player.load();
      }
      if (current.objectUrl) URL.revokeObjectURL(current.objectUrl);
      void current.context.close();
    }
    audio.set(silentMeter);
  }, [audio]);

  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden) return;
      releaseAudio();
      setActive(false);
      setStatus("");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseAudio();
    };
  }, [releaseAudio]);

  async function startAudio(source: File | string | undefined) {
    releaseAudio();
    const climax = typeof source === "string" && defaultAudioClimax !== undefined && defaultAudioClimax > defaultAudioStart
      ? defaultAudioClimax
      : undefined;
    if (climax !== undefined) audio.set({ ...silentMeter, phrase: 0.24 });
    let recording: AudioSession | undefined;
    try {
      const context = new AudioContext();
      const session: AudioSession = { context, frame: 0 };
      recording = session;
      capture.current = recording;
      const resumed = context.resume().then(() => true, () => false);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -8;
      analyser.smoothingTimeConstant = 0.2;

      if (source) {
        const player = new Audio();
        if (typeof source === "string") {
          player.src = source;
          player.currentTime = defaultAudioStart;
        } else {
          session.objectUrl = URL.createObjectURL(source);
          player.src = session.objectUrl;
        }
        session.player = player;
        context.createMediaElementSource(player).connect(analyser);
        analyser.connect(context.destination);
        player.onended = () => {
          if (capture.current !== session) return;
          releaseAudio();
          setStatus("Music finished");
          setActive(false);
        };
        await player.play();
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (capture.current !== session) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        session.stream = stream;
        context.createMediaStreamSource(stream).connect(analyser);
      }
      const running = await resumed;
      if (capture.current !== session) return;
      if (!running) throw new Error("Audio could not start");

      const signal = new Float32Array(analyser.fftSize);
      const spectrum = new Uint8Array(analyser.frequencyBinCount);
      const binHz = context.sampleRate / analyser.fftSize;
      const bassEnd = Math.max(2, Math.round(165 / binHz));
      const airStart = Math.ceil(2200 / binHz);
      const airEnd = Math.min(spectrum.length, Math.floor(7600 / binHz));
      let last = performance.now();
      let level = 0;
      let bass = 0;
      let bassFloor = 0;
      let airFloor = 0;
      let air = 0;
      let hit = 0;
      let pulse = 0;
      let lastHit = -Infinity;
      let beat = 0;
      const meter = (now: number) => {
        if (now - last >= 22) {
          const dt = Math.min(0.1, (now - last) / 1000);
          last = now;
          analyser.getFloatTimeDomainData(signal);
          analyser.getByteFrequencyData(spectrum);
          const rms = Math.sqrt(signal.reduce((sum, sample) => sum + sample * sample, 0) / signal.length);
          const decibels = 20 * Math.log10(Math.max(rms, 0.0001));
          const loudness = Math.max(0, Math.min(1, source ? (decibels + 42) / 43 : (decibels + 52) / 40));
          let bassSum = 0;
          for (let bin = 1; bin <= bassEnd; bin += 1) bassSum += spectrum[bin];
          const bassSample = (bassSum / (bassEnd * 255)) ** 2;
          let airSum = 0;
          for (let bin = airStart; bin < airEnd; bin += 1) airSum += spectrum[bin];
          const airSample = (airSum / (Math.max(1, airEnd - airStart) * 255)) ** 2;
          const previousBass = bass;
          bass += (bassSample - bass) * (1 - Math.exp(-dt / 0.055));
          bassFloor += (bass - bassFloor) * (1 - Math.exp(-dt / 0.48));
          airFloor += (airSample - airFloor) * (1 - Math.exp(-dt / 0.35));
          const shimmer = Math.min(1, Math.max(0, airSample - airFloor) * 7);
          air += (shimmer - air) * (1 - Math.exp(-dt / (shimmer > air ? 0.028 : 0.14)));
          const onset = Math.max(0, bass - previousBass) * 7
            + Math.max(0, bass - bassFloor) * 1.2
            + Math.max(0, loudness - level) * 0.42;
          hit *= Math.exp(-dt / 0.115);
          if (onset > 0.14 && now - lastHit >= 140 && bass > previousBass) {
            hit = Math.max(hit, Math.min(1, onset * 1.16));
            lastHit = now;
            beat += 1;
          }
          pulse += (hit - pulse) * (1 - Math.exp(-dt / 0.023));
          level += (loudness - level) * (1 - Math.exp(-dt / (loudness > level ? 0.11 : 0.28)));
          let phrase = 1;
          if (climax !== undefined && session.player) {
            const songTime = session.player.currentTime;
            const untilClimax = climax - songTime;
            phrase = untilClimax > 0
              ? 0.24 + 0.31 * Math.max(0, 1 - untilClimax / (climax - defaultAudioStart))
              : 1 + Math.exp(untilClimax / 0.61);
          }
          audio.set({ level, pulse, bass, air, phrase, beat });
        }
        session.frame = requestAnimationFrame(meter);
      };
      setStatus(source ? "Music active" : "Microphone active");
      session.frame = requestAnimationFrame(meter);
    } catch {
      if (recording && capture.current !== recording) return;
      releaseAudio();
      setStatus(source ? "This audio file could not play." : "Microphone unavailable. The particle preview is still running.");
    }
  }

  return (
    <article data-particle-conversation data-controls={active ? "split" : "merged"} aria-label="Particle Conversation"
      aria-describedby={instructionsId}
      onDragOver={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
      onDrop={event => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file || !(file.type.startsWith("audio/") || /\.(mp3|m4a|wav|flac|ogg|aac|opus|aiff)$/i.test(file.name))) return;
        music.current = file;
        setCycle(value => value + 1);
        setActive(true);
        void startAudio(file);
      }}
      className={`isolate overflow-clip bg-black ${fillScreen ? "absolute inset-0" : "relative mx-auto my-4 aspect-[388/620] w-full max-w-[388px] self-center rounded-[32px]"}`}>
      <div data-conversation-pair={active ? pair.join("+") : "idle"}
        className="pointer-events-none absolute inset-0">
        <ParticleScene pair={pair} cycle={cycle} active={active} document={particleDocument} audio={audio} />
      </div>
      <span id={instructionsId} className="sr-only">
        {defaultAudioUrl ? "Play the demo track or drop a local audio file to drive the particles." : "Use the microphone or drop a local audio file to drive the particles."}
      </span>
      <span role="status" className="sr-only">{status}</span>
      <div className="absolute bottom-8 left-1/2 z-10 h-[58px] w-36 -translate-x-1/2">
        <svg viewBox="0 0 144 58" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <motion.path data-liquid-controls fill="rgb(214 233 255 / .12)" initial={false}
            animate={{ d: active ? joinedPath : closedPath, opacity: active ? 1 : 0 }} transition={split} />
        </svg>
        <motion.button ref={speakButton} type="button" aria-label={active ? "Replay particles" : defaultAudioUrl ? "Play music" : "Speak"} initial={false}
          animate={{ x: active ? -39 : 0 }} transition={split}
          onClick={() => {
            setCycle(value => value + 1);
            if (active) return;
            setActive(true);
            void startAudio(music.current ?? defaultAudioUrl);
          }}
          className={`${controlClass} z-10`}>
          <Mic size={22} strokeWidth={1.8} />
        </motion.button>
        <motion.button type="button" aria-label="Stop" aria-hidden={!active} disabled={!active} initial={false}
          animate={{ x: active ? 39 : 0, scale: active ? 1 : 0.72, opacity: active ? 1 : 0 }} transition={split}
          onClick={() => {
            releaseAudio();
            setActive(false);
            setStatus("");
            speakButton.current?.focus({ preventScroll: true });
          }}
          className={`${controlClass} disabled:pointer-events-none`}>
          <Square size={14} fill="currentColor" />
        </motion.button>
      </div>
    </article>
  );
}
