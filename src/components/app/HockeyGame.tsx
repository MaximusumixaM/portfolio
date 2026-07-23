import { useEffect, useRef, useState } from "react";

/** Fixed logical play area (3:4). The canvas scales to fit; physics stays resolution-independent. */
const LOGICAL_W = 360;
const LOGICAL_H = 480;

/** Drag distance (logical px) for a full-power shot, and the resulting launch speed (px/s). */
const MAX_DRAG = 210;
const MAX_SPEED = 640;
/** Ignore micro-drags so a tap doesn't fire a stray shot. */
const MIN_DRAG = 10;

const COLORS = {
  ice: "#eaf1f7",
  crease: "#cfe0f2",
  red: "#c8102e",
  blue: "#00205b",
  green: "#00843d",
  net: "#b8c2cc",
  puck: "#141414",
};

interface Puck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}
interface Goalie {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number;
  speed: number;
}
interface Goal {
  left: number;
  right: number;
  lineY: number;
  topY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** True when the puck circle overlaps the (centre-anchored) goalie rectangle. */
function puckHitsGoalie(puck: Puck, goalie: Goalie): boolean {
  const nearestX = clamp(puck.x, goalie.x - goalie.w / 2, goalie.x + goalie.w / 2);
  const nearestY = clamp(puck.y, goalie.y - goalie.h / 2, goalie.y + goalie.h / 2);
  const dx = puck.x - nearestX;
  const dy = puck.y - nearestY;
  return dx * dx + dy * dy < puck.r * puck.r;
}

/**
 * A small Canucks shootout. Drag back from the puck and release to shoot it past the
 * oscillating goalie into the net. Pointer-events based, so it plays with mouse or touch.
 */
export function HockeyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [goals, setGoals] = useState(0);
  const [shots, setShots] = useState(0);

  useEffect(() => {
    const element = canvasRef.current;
    if (element === null) return;
    // Pin non-null declared types so the narrowing survives into the nested draw closures.
    const canvas: HTMLCanvasElement = element;
    const context = canvas.getContext("2d");
    if (context === null) return;
    const ctx: CanvasRenderingContext2D = context;

    const start = { x: LOGICAL_W / 2, y: LOGICAL_H - 56 };
    const puck: Puck = { x: start.x, y: start.y, vx: 0, vy: 0, r: 11 };
    const goal: Goal = {
      left: LOGICAL_W / 2 - 74,
      right: LOGICAL_W / 2 + 74,
      lineY: 74,
      topY: 34,
    };
    const goalie: Goalie = {
      x: LOGICAL_W / 2,
      y: 98,
      w: 78,
      h: 20,
      dir: 1,
      speed: 150,
    };

    let ready = true;
    let aiming = false;
    let scored = false;
    const aim = { x: 0, y: 0 };
    let resetTimer = -1;
    let flash = 0;

    function resetPuck() {
      puck.x = start.x;
      puck.y = start.y;
      puck.vx = 0;
      puck.vy = 0;
      ready = true;
      scored = false;
    }

    function toLocal(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * LOGICAL_W,
        y: ((clientY - rect.top) / rect.height) * LOGICAL_H,
      };
    }

    function handleDown(event: PointerEvent) {
      if (!ready) return;
      aiming = true;
      const point = toLocal(event.clientX, event.clientY);
      aim.x = point.x;
      aim.y = point.y;
      canvas.setPointerCapture(event.pointerId);
    }
    function handleMove(event: PointerEvent) {
      if (!aiming) return;
      const point = toLocal(event.clientX, event.clientY);
      aim.x = point.x;
      aim.y = point.y;
    }
    function handleUp() {
      if (!aiming) return;
      aiming = false;
      // Slingshot: shoot away from the drag (pull back to fire toward the net).
      const dx = puck.x - aim.x;
      const dy = puck.y - aim.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_DRAG) return;
      const power = (Math.min(dist, MAX_DRAG) / MAX_DRAG) * MAX_SPEED;
      puck.vx = (dx / dist) * power;
      puck.vy = (dy / dist) * power;
      ready = false;
      setShots((count) => count + 1);
    }

    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerup", handleUp);
    canvas.addEventListener("pointercancel", handleUp);

    let scale = 1;
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      scale = (cssW / LOGICAL_W) * dpr;
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    function update(dt: number) {
      // Goalie slides across the crease.
      goalie.x += goalie.dir * goalie.speed * dt;
      const min = goal.left + goalie.w / 2 + 4;
      const max = goal.right - goalie.w / 2 - 4;
      if (goalie.x <= min) {
        goalie.x = min;
        goalie.dir = 1;
      } else if (goalie.x >= max) {
        goalie.x = max;
        goalie.dir = -1;
      }

      if (flash > 0) flash -= dt;

      if (resetTimer >= 0) {
        resetTimer -= dt;
        if (resetTimer <= 0) {
          resetTimer = -1;
          resetPuck();
        }
      }

      if (ready) return;

      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;
      const damp = Math.exp(-0.55 * dt);
      puck.vx *= damp;
      puck.vy *= damp;

      // Side and bottom boards.
      if (puck.x < puck.r) {
        puck.x = puck.r;
        puck.vx = Math.abs(puck.vx) * 0.8;
      } else if (puck.x > LOGICAL_W - puck.r) {
        puck.x = LOGICAL_W - puck.r;
        puck.vx = -Math.abs(puck.vx) * 0.8;
      }
      if (puck.y > LOGICAL_H - puck.r) {
        puck.y = LOGICAL_H - puck.r;
        puck.vy = -Math.abs(puck.vy) * 0.8;
      }

      // Goalie save.
      if (!scored && puckHitsGoalie(puck, goalie)) {
        puck.y = goalie.y + goalie.h / 2 + puck.r + 1;
        puck.vy = Math.abs(puck.vy) * 0.55 + 40;
        puck.vx *= 0.7;
      }

      // Goal line: score if between the posts, otherwise bounce off the boards behind.
      if (!scored && puck.y - puck.r < goal.lineY) {
        if (puck.x > goal.left && puck.x < goal.right) {
          scored = true;
          flash = 1;
          puck.vx *= 0.3;
          puck.vy *= 0.3;
          resetTimer = 0.9;
          setGoals((count) => count + 1);
        } else {
          puck.y = goal.lineY + puck.r;
          puck.vy = Math.abs(puck.vy) * 0.7;
        }
      }

      // Come to rest → reload.
      if (resetTimer < 0 && Math.hypot(puck.vx, puck.vy) < 16) {
        resetTimer = 0.25;
      }
    }

    function drawRink() {
      ctx.fillStyle = COLORS.ice;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Goal crease.
      ctx.fillStyle = COLORS.crease;
      ctx.beginPath();
      ctx.moveTo(goal.left + 8, goal.lineY);
      ctx.arc(LOGICAL_W / 2, goal.lineY, 62, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      // Goal line.
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, goal.lineY);
      ctx.lineTo(LOGICAL_W, goal.lineY);
      ctx.stroke();

      // Faceoff spot near the shooter.
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(start.x, start.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawNet() {
      // Net mesh.
      ctx.strokeStyle = COLORS.net;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = goal.left; x <= goal.right; x += 10) {
        ctx.moveTo(x, goal.topY);
        ctx.lineTo(x, goal.lineY);
      }
      for (let y = goal.topY; y <= goal.lineY; y += 10) {
        ctx.moveTo(goal.left, y);
        ctx.lineTo(goal.right, y);
      }
      ctx.stroke();

      // Frame (posts + crossbar).
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(goal.left, goal.lineY);
      ctx.lineTo(goal.left, goal.topY);
      ctx.lineTo(goal.right, goal.topY);
      ctx.lineTo(goal.right, goal.lineY);
      ctx.stroke();
    }

    function drawGoalie() {
      const x = goalie.x - goalie.w / 2;
      const y = goalie.y - goalie.h / 2;
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.roundRect(x, y, goalie.w, goalie.h, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.roundRect(x, y + goalie.h - 6, goalie.w, 5, 3);
      ctx.fill();
    }

    function drawPuck() {
      ctx.fillStyle = COLORS.puck;
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawAim() {
      if (!aiming) return;
      const dx = puck.x - aim.x;
      const dy = puck.y - aim.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MIN_DRAG) return;
      const power = Math.min(dist, MAX_DRAG) / MAX_DRAG;
      const len = power * 84;
      const nx = dx / dist;
      const ny = dy / dist;

      ctx.strokeStyle = `rgb(${String(Math.round(60 + power * 180))}, ${String(Math.round(160 - power * 120))}, 90)`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(puck.x, puck.y);
      ctx.lineTo(puck.x + nx * len, puck.y + ny * len);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawFlash() {
      if (flash <= 0) return;
      ctx.fillStyle = `rgba(0, 132, 61, ${String(Math.min(flash, 1) * 0.9)})`;
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GOAL!", LOGICAL_W / 2, LOGICAL_H / 2);
    }

    function render() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      drawRink();
      drawNet();
      drawGoalie();
      drawAim();
      drawPuck();
      drawFlash();
    }

    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      update(dt);
      render();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-s">
      <div className="flex w-full max-w-sm items-center justify-between font-mono text-medium tabular-nums">
        <span>Goals {goals}</span>
        <span className="opacity-60">Shots {shots}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="aspect-[3/4] w-full max-w-sm touch-none rounded-large border border-border-default"
      />
      <p className="font-mono text-xs uppercase tracking-widest opacity-60">
        Drag back from the puck, release to shoot
      </p>
    </div>
  );
}
