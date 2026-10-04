import { renderCard } from "./card";
import {
  ACCENT,
  bitsAt,
  CELL,
  COLORS,
  curAt,
  examples,
  H,
  prevAt,
  type View,
  W,
} from "./model";

// inferno-like ramp for the bits view
const STOPS: [number, number, number][] = [
  [0, 0, 4],
  [40, 11, 84],
  [101, 21, 110],
  [159, 42, 99],
  [212, 72, 66],
  [245, 125, 21],
  [252, 255, 164],
];

function heat(bits: number): string {
  const t = Math.min(1, bits / 8) ** 0.6;
  const x = t * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const [a, b] = [STOPS[i], STOPS[i + 1]];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const arrows: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/*
 * Wires up the markup that coder-explorer.astro rendered at build time. The
 * page already shows the starting state; this only draws the canvas and
 * reacts to the viewer.
 */
export function initCoderExplorer(root: HTMLElement) {
  const canvas = root.querySelector("canvas");
  const card = root.querySelector<HTMLElement>(".ce-card");
  if (!canvas || !card) return;

  const tabs = root.querySelectorAll<HTMLButtonElement>(".ce-tabs button");
  let view: View = "colors";
  let sel = examples.surprise;

  const draw = () => {
    const cx = sel % W;
    const cy = Math.floor(sel / W);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * CELL * dpr;
    canvas.height = H * CELL * dpr;
    const g = canvas.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#07070a";
    g.fillRect(0, 0, W * CELL, H * CELL);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = curAt(x, y, 0, 0);
        const moved = c !== prevAt(x, y, 0, 0);
        if (view === "colors") {
          g.fillStyle = COLORS[c];
        } else if (view === "bits") {
          g.fillStyle = heat(bitsAt(y * W + x));
        } else {
          g.fillStyle = COLORS[c];
          g.globalAlpha = moved ? 1 : 0.28;
        }
        g.fillRect(x * CELL, y * CELL, CELL, CELL);
        g.globalAlpha = 1;
        if (view === "changes" && moved) {
          g.fillStyle = "rgba(255,255,255,0.9)";
          g.fillRect(x * CELL + 4, y * CELL + 4, CELL - 8, CELL - 8);
        }
      }
    }
    // faint pixel grid
    g.strokeStyle = "rgba(0,0,0,0.18)";
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= W; x++) {
      g.moveTo(x * CELL + 0.5, 0);
      g.lineTo(x * CELL + 0.5, H * CELL);
    }
    for (let y = 0; y <= H; y++) {
      g.moveTo(0, y * CELL + 0.5);
      g.lineTo(W * CELL, y * CELL + 0.5);
    }
    g.stroke();
    // context cells (current frame) and the selected pixel
    const ctxCells: [number, number, string?][] = [
      [-1, 0, "1"],
      [0, -1, "2"],
      [-1, -1],
      [-1, 1],
      [-2, 0],
      [0, -2],
    ];
    g.lineWidth = 2;
    for (const [dx, dy, tag] of ctxCells) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      g.strokeStyle = ACCENT;
      g.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      if (tag) {
        g.fillStyle = "#fff";
        g.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(tag, x * CELL + CELL / 2, y * CELL + CELL / 2 + 0.5);
      }
    }
    g.strokeStyle = "#fff";
    g.lineWidth = 2.5;
    g.strokeRect(cx * CELL + 1, cy * CELL + 1, CELL - 2, CELL - 2);
  };

  const show = (next: View) => {
    if (next === view) return;
    view = next;
    for (const tab of tabs) {
      const on = tab.dataset.view === view;
      tab.className = on ? "on" : "";
      tab.setAttribute("aria-selected", String(on));
    }
    draw();
  };

  const select = (next: number) => {
    if (next === sel) return;
    sel = next;
    draw();
    card.innerHTML = renderCard(sel);
  };

  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * W);
    const y = Math.floor(((e.clientY - r.top) / r.height) * H);
    if (x >= 0 && y >= 0 && x < W && y < H) select(y * W + x);
  };

  const onKey = (e: KeyboardEvent) => {
    const move = arrows[e.key];
    if (!move) return;
    e.preventDefault();
    const x = Math.min(W - 1, Math.max(0, (sel % W) + move[0]));
    const y = Math.min(H - 1, Math.max(0, Math.floor(sel / W) + move[1]));
    select(y * W + x);
  };

  root.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const button = e.target.closest<HTMLElement>(
      "button[data-view], button[data-pick]",
    );
    if (!button) return;
    if (button.dataset.view) show(button.dataset.view as View);
    if (button.dataset.pick)
      select(examples[button.dataset.pick as keyof typeof examples]);
  });
  canvas.addEventListener("pointermove", pick);
  canvas.addEventListener("pointerdown", pick);
  canvas.addEventListener("keydown", onKey);

  draw();
}
