import patch from "./patch.json";

/*
 * An explorable patch of the real class map, with the real per-pixel numbers
 * from the context coder (probabilities, answers and bits, exactly as the
 * shipped decoder's model computes them for frame 200).
 */

export const COLORS = ["#12151c", "#4f8976", "#4887d6", "#e9b140", "#d74e56"];
export const NAMES = ["road", "lane marking", "sky", "vehicle", "hood"];
export const CELL = 12;
export const ACCENT = "#47a3f3";

export type View = "colors" | "bits" | "changes";

export const W = patch.w;
export const H = patch.h;
export const X0 = patch.x0;
export const Y0 = patch.y0;
const PW = W + 3; // padded width: 2 columns left, 1 right
const PAD = patch.pad;

export const bitsAt = (i: number) => patch.bits[i];

export const curAt = (cx: number, cy: number, dx: number, dy: number) =>
  patch.cur[(cy + PAD + dy) * PW + (cx + PAD + dx)];
export const prevAt = (cx: number, cy: number, dx: number, dy: number) =>
  patch.prev[(cy + PAD + dy) * PW + (cx + PAD + dx)];

export function pct(p: number): string {
  const v = p * 100;
  if (v > 99 || v < 1) return `${parseFloat(v.toFixed(3))}%`;
  return `${v.toFixed(1)}%`;
}

export function bitsText(b: number): string {
  if (b < 0.001) return "under 0.001 bits";
  return `${b < 0.1 ? b.toFixed(3) : b.toFixed(2)} bits`;
}

export type Step = {
  n: number;
  question: string;
  p: number;
  answer: "yes" | "no" | "which";
  ruledOut?: string;
  bits: number;
};

export function steps(cx: number, cy: number, idx: number): Step[] {
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
      ruledOut:
        A === L
          ? "The pixel above is the same color as the one to the left, which already failed."
          : undefined,
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

// Example pixels, found from the data.
function findExamples() {
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
    if (
      curAt(cx, cy, 0, 0) !== prevAt(cx, cy, 0, 0) &&
      patch.ev[i] === 0 &&
      patch.bits[i] < 0.3 &&
      patch.bits[i] > 0.02
    ) {
      edge = i;
      break;
    }
  }
  return { free, surprise, edge: edge >= 0 ? edge : free };
}

export const examples = findExamples();
