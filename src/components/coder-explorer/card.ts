import {
  bitsAt,
  bitsText,
  COLORS,
  curAt,
  NAMES,
  pct,
  prevAt,
  steps,
  W,
  X0,
  Y0,
} from "./model";

/*
 * The inside of the card under the canvas. The page renders it once at build
 * time, and the browser swaps it in whenever the selected pixel changes.
 */

function cell(c: number | null, used: boolean, label?: string) {
  const color =
    c === null
      ? ""
      : ` style="background:${COLORS[c]};opacity:1" title="${NAMES[c]}"`;
  const classes = `ce-cell${used ? " used" : ""}${c === null ? " none" : ""}`;
  return `<div class="${classes}"${color}>${label ? `<span>${label}</span>` : ""}</div>`;
}

// The six pixels of this frame the coder has already seen.
const seenNow = (dx: number, dy: number) =>
  (dx === -1 && dy === 0) ||
  (dx === 0 && dy === -1) ||
  (dx === -1 && dy === -1) ||
  (dx === -1 && dy === 1) ||
  (dx === -2 && dy === 0) ||
  (dx === 0 && dy === -2);

// The three pixels of the previous frame it looks at.
const seenBefore = (dx: number, dy: number) =>
  (dx === 0 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 0);

export function renderCard(sel: number): string {
  const cx = sel % W;
  const cy = Math.floor(sel / W);
  const target = curAt(cx, cy, 0, 0);

  let now = "";
  for (let dy = -2; dy <= 1; dy++) {
    for (let dx = -2; dx <= 0; dx++) {
      if (dx === 0 && dy === 0) {
        now += `<div class="ce-cell target"><span>?</span></div>`;
      } else if (dx === 0 && dy === 1) {
        now += `<div class="ce-cell hatch" title="not decoded yet"></div>`;
      } else {
        const used = seenNow(dx, dy);
        const label =
          dx === -1 && dy === 0 ? "1" : dx === 0 && dy === -1 ? "2" : undefined;
        now += cell(used ? curAt(cx, cy, dx, dy) : null, used, label);
      }
    }
  }

  let before = "";
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const used = seenBefore(dx, dy);
      before += cell(used ? prevAt(cx, cy, dx, dy) : null, used);
    }
  }

  const asked = steps(cx, cy, sel)
    .map((s) => {
      const answer =
        s.answer === "which"
          ? `Gave ${NAMES[target]} a ${pct(s.p)} chance. Cost ${bitsText(s.bits)}.`
          : s.ruledOut
            ? `Ruled out. ${s.ruledOut} Cost ${bitsText(s.bits)}.`
            : `Gave “yes” ${pct(s.p)}. The answer was <b>${s.answer}</b>. Cost ${bitsText(s.bits)}.`;
      return `<li><div class="q">${s.n}. ${s.question}</div><div class="a">${answer}</div></li>`;
    })
    .join("");

  const grid = `style="grid-template-columns:repeat(3, 1.5rem)"`;
  return (
    `<div class="ce-seen">` +
    `<div class="ce-title">Pixel (${X0 + cx}, ${Y0 + cy}) is <b>${NAMES[target]}</b></div>` +
    `<div class="ce-minis">` +
    `<div><div class="ce-mini-label">this frame</div><div class="ce-mini" ${grid}>${now}</div></div>` +
    `<div><div class="ce-mini-label">previous frame</div><div class="ce-mini" ${grid}>${before}</div></div>` +
    `</div>` +
    `<div class="ce-note">The coder reads down each column, left to right. Outlined squares show the nine pixels it looks at. It ignores the rest.</div>` +
    `</div>` +
    `<div class="ce-asked">` +
    `<div class="ce-title">What the coder did</div>` +
    `<ol>${asked}</ol>` +
    `<div class="ce-sum">This pixel cost <b>${bitsText(bitsAt(sel))}</b>.</div>` +
    `</div>`
  );
}
