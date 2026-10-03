"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import patch from "./coder-patch.json";

/*
 * An explorable patch of the real class map, with the real per-pixel numbers
 * from the context coder (probabilities, answers and bits, exactly as the
 * shipped decoder's model computes them for frame 200).
 */

const COLORS = ["#12151c", "#4f8976", "#4887d6", "#e9b140", "#d74e56"];
const NAMES = ["road", "lane marking", "sky", "vehicle", "hood"];
const CELL = 12;
const ACCENT = "#47a3f3";

type View = "colors" | "bits" | "changes";

const W = patch.w;
const H = patch.h;
const PW = W + 3; // padded width: 2 columns left, 1 right
const PAD = patch.pad;

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

const curAt = (cx: number, cy: number, dx: number, dy: number) =>
  patch.cur[(cy + PAD + dy) * PW + (cx + PAD + dx)];
const prevAt = (cx: number, cy: number, dx: number, dy: number) =>
  patch.prev[(cy + PAD + dy) * PW + (cx + PAD + dx)];

function pct(p: number): string {
  const v = p * 100;
  if (v > 99 || v < 1) return `${parseFloat(v.toFixed(3))}%`;
  return `${v.toFixed(1)}%`;
}
function bitsText(b: number): string {
  if (b < 0.001) return "under 0.001 bits";
  return `${b < 0.1 ? b.toFixed(3) : b.toFixed(2)} bits`;
}

type Step = {
  n: number;
  question: string;
  p: number | null;
  answer: "yes" | "no" | "which";
  ruledOut?: string;
  bits: number;
};

function steps(cx: number, cy: number, idx: number): Step[] {
  const ev = patch.ev[idx];
  const L = curAt(cx, cy, -1, 0);
  const A = curAt(cx, cy, 0, -1);
  const P0 = prevAt(cx, cy, 0, 0);
  const out: Step[] = [];
  const q1 = patch.q1[idx] as number;
  out.push({
    n: 1,
    question: "Same color as the pixel to its left?",
    p: q1,
    answer: ev === 0 ? "yes" : "no",
    bits: -Math.log2(ev === 0 ? q1 : 1 - q1),
  });
  if (ev >= 1) {
    const q2 = patch.q2[idx] as number;
    out.push({
      n: 2,
      question: "Same color as the pixel above it?",
      p: q2,
      answer: ev === 1 ? "yes" : "no",
      ruledOut: A === L ? "The pixel above is the same color as the one to the left, which already failed." : undefined,
      bits: -Math.log2(ev === 1 ? q2 : 1 - q2),
    });
  }
  if (ev >= 2) {
    const q3 = patch.q3[idx] as number;
    out.push({
      n: 3,
      question: "Same color as this spot in the previous frame?",
      p: q3,
      answer: ev === 2 ? "yes" : "no",
      ruledOut:
        P0 === L || P0 === A
          ? "Last frame's color here matches a neighbor that already failed."
          : undefined,
      bits: -Math.log2(ev === 2 ? q3 : 1 - q3),
    });
  }
  if (ev === 3) {
    const q4 = patch.q4[idx] as number;
    out.push({
      n: 4,
      question: "Then which color is it?",
      p: q4,
      answer: "which",
      bits: -Math.log2(q4),
    });
  }
  return out;
}

function Swatch({ c, dim, label, used }: { c: number | null; dim?: boolean; label?: string; used?: boolean }) {
  return (
    <div
      className={`ce-cell${used ? " used" : ""}${c === null ? " none" : ""}`}
      style={c === null ? undefined : { background: COLORS[c], opacity: dim ? 0.35 : 1 }}
      title={c === null ? undefined : NAMES[c]}
    >
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export default function CoderExplorer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>("colors");

  // example pixels, found from the data
  const examples = useMemo(() => {
    let free = 0;
    let surprise = 0;
    let edge = -1;
    for (let i = 0; i < patch.bits.length; i++) {
      if (patch.bits[i] < patch.bits[free]) free = i;
      if (patch.bits[i] > patch.bits[surprise]) surprise = i;
    }
    // an ordinary edge pixel that moved since the last frame and was cheap
    for (let i = 0; i < patch.bits.length; i++) {
      const cx = i % W;
      const cy = Math.floor(i / W);
      if (curAt(cx, cy, 0, 0) !== prevAt(cx, cy, 0, 0) && patch.ev[i] === 0 && patch.bits[i] < 0.3 && patch.bits[i] > 0.02) {
        edge = i;
        break;
      }
    }
    return { free, surprise, edge: edge >= 0 ? edge : free };
  }, []);

  const [sel, setSel] = useState<number>(examples.surprise);
  const cx = sel % W;
  const cy = Math.floor(sel / W);

  const total = useMemo(() => patch.bits.reduce((a, b) => a + b, 0), []);
  const costly = useMemo(() => patch.bits.filter((b) => b >= 4).length, []);
  const changed = useMemo(() => {
    let n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (curAt(x, y, 0, 0) !== prevAt(x, y, 0, 0)) n++;
    return n;
  }, []);

  const draw = useCallback(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = W * CELL * dpr;
    el.height = H * CELL * dpr;
    const g = el.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#07070a";
    g.fillRect(0, 0, W * CELL, H * CELL);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const c = curAt(x, y, 0, 0);
        const moved = c !== prevAt(x, y, 0, 0);
        if (view === "colors") {
          g.fillStyle = COLORS[c];
        } else if (view === "bits") {
          g.fillStyle = heat(patch.bits[i]);
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
  }, [view, cx, cy]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * W);
    const y = Math.floor(((e.clientY - r.top) / r.height) * H);
    if (x >= 0 && y >= 0 && x < W && y < H) setSel(y * W + x);
  };

  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    const x = Math.min(W - 1, Math.max(0, cx + m[0]));
    const y = Math.min(H - 1, Math.max(0, cy + m[1]));
    setSel(y * W + x);
  };

  const list = steps(cx, cy, sel);
  const T = curAt(cx, cy, 0, 0);
  const sumBits = patch.bits[sel];

  const neighborsNow: { dx: number; dy: number; label?: string; used: boolean }[] = [];
  for (let dy = -2; dy <= 1; dy++) {
    for (let dx = -2; dx <= 0; dx++) {
      const used =
        (dx === -1 && dy === 0) || (dx === 0 && dy === -1) || (dx === -1 && dy === -1) || (dx === -1 && dy === 1) || (dx === -2 && dy === 0) || (dx === 0 && dy === -2);
      neighborsNow.push({ dx, dy, used, label: dx === -1 && dy === 0 ? "1" : dx === 0 && dy === -1 ? "2" : undefined });
    }
  }

  return (
    <figure className="coder-explorer">
      <div className="ce-bar">
        <div className="ce-tabs" role="tablist" aria-label="View">
          {(
            [
              ["colors", "Colors"],
              ["bits", "Bits spent"],
              ["changes", "Changed since last frame"],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={view === v ? "on" : ""}
              onClick={() => setView(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ce-examples">
          <span>Try:</span>
          <button type="button" onClick={() => setSel(examples.free)}>a free pixel</button>
          <button type="button" onClick={() => setSel(examples.edge)}>an edge that moved</button>
          <button type="button" onClick={() => setSel(examples.surprise)}>the biggest surprise</button>
        </div>
      </div>

      <canvas
        ref={canvas}
        className="ce-canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        tabIndex={0}
        role="img"
        aria-label="A 56 by 36 pixel patch of the class map. Hover, tap, or use arrow keys to inspect a pixel."
        onPointerMove={pick}
        onPointerDown={pick}
        onKeyDown={onKey}
      />

      <div className="ce-legend">
        {NAMES.map((n, i) => (
          <span key={n}>
            <i style={{ background: COLORS[i] }} />
            {n}
          </span>
        ))}
        <span className="ce-total">
          Whole patch: {(W * H).toLocaleString("en-US")} pixels, {Math.round(total / 8)} bytes. {changed} pixels changed since the last frame, {costly} cost 4 bits or more.
        </span>
      </div>

      <div className="ce-card">
        <div className="ce-seen">
          <div className="ce-title">
            Pixel ({patch.x0 + cx}, {patch.y0 + cy}) is <b>{NAMES[T]}</b>
          </div>
          <div className="ce-minis">
            <div>
              <div className="ce-mini-label">this frame</div>
              <div className="ce-mini" style={{ gridTemplateColumns: "repeat(3, 1.5rem)" }}>
                {neighborsNow.map((n) =>
                  n.dx === 0 && n.dy === 0 ? (
                    <div key="t" className="ce-cell target"><span>?</span></div>
                  ) : n.dx === 0 && n.dy === 1 ? (
                    <div key="u" className="ce-cell hatch" title="not decoded yet" />
                  ) : (
                    <Swatch key={`${n.dx},${n.dy}`} c={n.used ? curAt(cx, cy, n.dx, n.dy) : null} used={n.used} label={n.label} />
                  ),
                )}
              </div>
            </div>
            <div>
              <div className="ce-mini-label">previous frame</div>
              <div className="ce-mini" style={{ gridTemplateColumns: "repeat(3, 1.5rem)" }}>
                {[-1, 0, 1].flatMap((dy) =>
                  [-1, 0, 1].map((dx) => {
                    const used = (dx === 0 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 0);
                    return <Swatch key={`p${dx},${dy}`} c={used ? prevAt(cx, cy, dx, dy) : null} used={used} />;
                  }),
                )}
              </div>
            </div>
          </div>
          <div className="ce-note">The coder reads down each column, left to right. Outlined squares show the nine pixels it looks at. It ignores the rest.</div>
        </div>

        <div className="ce-asked">
          <div className="ce-title">What the coder did</div>
          <ol>
            {list.map((s) => (
              <li key={s.n}>
                <div className="q">{s.n}. {s.question}</div>
                <div className="a">
                  {s.answer === "which" ? (
                    <>Gave {NAMES[T]} a {pct(s.p as number)} chance. Cost {bitsText(s.bits)}.</>
                  ) : s.ruledOut ? (
                    <>Ruled out. {s.ruledOut} Cost {bitsText(s.bits)}.</>
                  ) : (
                    <>
                      Gave &ldquo;yes&rdquo; {pct(s.p as number)}. The answer was <b>{s.answer}</b>. Cost {bitsText(s.bits)}.
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="ce-sum">
            This pixel cost <b>{bitsText(sumBits)}</b>.
          </div>
        </div>
      </div>
      <figcaption>
        A 56 by 36 patch of the map from frame 200, around the horizon, two vehicles and a lane marking. Hover or tap a pixel, or use the arrow keys. The numbers are the real ones from the shipped coder.
      </figcaption>
    </figure>
  );
}
