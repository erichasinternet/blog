import React from "react";

/*
 * Small presentational components for long-form posts. All props are plain
 * strings so they can be used from MDX, which blocks JS expressions in props.
 */

const fmt = (n: number) => n.toLocaleString("en-US");

type ElementWithProps<P> = React.ReactElement<P>;

function propsOf<P>(children: React.ReactNode): P[] {
  return React.Children.toArray(children)
    .filter((c): c is ElementWithProps<P> => React.isValidElement(c))
    .map((c) => c.props);
}

/* ---------- image panels ---------- */

export function Panels({
  cols = "2",
  children,
}: {
  cols?: string;
  children: React.ReactNode;
}) {
  return <div className={`post-panels cols-${cols}`}>{children}</div>;
}

export function Panel({
  src,
  alt,
  label,
  pixelated,
  top,
  bottom,
}: {
  src: string;
  alt: string;
  label?: string;
  pixelated?: string;
  top?: string;
  bottom?: string;
}) {
  return (
    <figure>
      <div className="panel-wrap">
        {/* biome-ignore lint/performance/noImgElement: static, pre-sized post images */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={pixelated ? { imageRendering: "pixelated" } : undefined}
        />
        {top ? <span className="panel-tag top">{top}</span> : null}
        {bottom ? <span className="panel-tag bottom">{bottom}</span> : null}
      </div>
      {label ? <figcaption>{label}</figcaption> : null}
    </figure>
  );
}

/* ---------- looping clip ---------- */

export function Clip({
  src,
  poster,
  caption,
  loop,
}: {
  src: string;
  poster?: string;
  caption?: string;
  loop?: string;
}) {
  const auto = loop === "true";
  return (
    <figure>
      <video
        controls
        muted
        playsInline
        preload="metadata"
        poster={poster}
        loop={auto}
        autoPlay={auto}
      >
        <source src={src} type="video/mp4" />
      </video>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/* ---------- aside ---------- */

export function Aside({
  title = "Aside",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="post-aside">
      <div className="post-aside-title">{title}</div>
      {children}
    </aside>
  );
}

/* ---------- horizontal bars ---------- */

type BarProps = { label: string; value: string; note?: string; emph?: string };

export function Bar(_props: BarProps) {
  return null;
}

export function Bars({
  max,
  unit,
  tight,
  scale,
  children,
}: {
  max?: string;
  unit?: string;
  tight?: string;
  scale?: string;
  children: React.ReactNode;
}) {
  const rows = propsOf<BarProps>(children);
  const top = max ? Number(max) : Math.max(...rows.map((r) => Number(r.value)));
  return (
    <div className="post-bars">
      {rows.map((r) => {
        const v = Number(r.value);
        const width =
          scale === "log"
            ? Math.max(2, (Math.log10(Math.max(v, 1)) / Math.log10(top)) * 100)
            : (v / top) * 100;
        return (
          <div key={r.label} className={`row${r.emph === "true" ? " emph" : ""}`}>
            <div className="label">{r.label}</div>
            <div className="track">
              <div className="fill" style={{ width: `${width}%` }} />
            </div>
            <div className="value">
              {fmt(v)}
              {unit ? <span className="unit">{tight === "true" ? "" : " "}{unit}</span> : null}
              {r.note ? <span className="note">{r.note}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- one stacked bar ---------- */

type SegProps = { label: string; value: string; tone?: string };

export function Seg(_props: SegProps) {
  return null;
}

export function Stack({ children }: { children: React.ReactNode }) {
  const segs = propsOf<SegProps>(children);
  const total = segs.reduce((a, s) => a + Number(s.value), 0);
  return (
    <div className="post-stack">
      <div className="bar" role="img" aria-label={`Total ${fmt(total)} bytes`}>
        {segs.map((s) => (
          <div
            key={s.label}
            className={`seg tone-${s.tone ?? "mid"}`}
            style={{ flexGrow: Number(s.value), flexBasis: 0 }}
          />
        ))}
      </div>
      <div className="legend">
        {segs.map((s) => (
          <div key={s.label} className="item">
            <span className={`swatch tone-${s.tone ?? "mid"}`} />
            <span className="name">{s.label}</span>
            <span className="num">
              {fmt(Number(s.value))}
              <span className="pct"> {((Number(s.value) / total) * 100).toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- paired bars on a log scale ---------- */

type PairProps = { label: string; a: string; b: string };

export function Pair(_props: PairProps) {
  return null;
}

export function Duo({
  a,
  b,
  max,
  children,
}: {
  a: string;
  b: string;
  max?: string;
  children: React.ReactNode;
}) {
  const rows = propsOf<PairProps>(children);
  const top = max ? Number(max) : Math.max(...rows.flatMap((r) => [Number(r.a), Number(r.b)]));
  const w = (v: number) => Math.max(2, (Math.log10(Math.max(v, 1)) / Math.log10(top)) * 100);
  return (
    <div className="post-duo">
      <div className="legend">
        <span>
          <i className="a" />
          {a}
        </span>
        <span>
          <i className="b" />
          {b}
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="row">
          <div className="label">{r.label}</div>
          <div className="lines">
            {([
              ["a", Number(r.a)],
              ["b", Number(r.b)],
            ] as const).map(([k, v]) => (
              <div key={k} className="line">
                <div className="track">
                  <div className={`fill ${k}`} style={{ width: `${w(v)}%` }} />
                </div>
                <span className="value">{fmt(v)}×</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

