import type { TrendResponse } from "../api";

// Gunluk harcama serisini, mevcut tasarimin SVG stilini koruyarak cizer.
// viewBox 0 0 320 124; taban y=104, tepe y=24 (marka rengi #1b5e45).
export function TrendChart({ points }: { points: TrendResponse["points"] }) {
  const n = points.length;
  const x0 = 10;
  const x1 = 310;
  const yBase = 104;
  const yTop = 24;
  const max = Math.max(...points.map((p) => p.amount), 1);

  const xAt = (i: number) => (n <= 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (n - 1));
  const yAt = (amt: number) => yBase - (amt / max) * (yBase - yTop);

  const linePts = points.map((p, i) => `${xAt(i).toFixed(1)} ${yAt(p.amount).toFixed(1)}`);
  const line = "M" + linePts.join(" L");
  const area = `${line} L${xAt(n - 1).toFixed(1)} ${yBase} L${xAt(0).toFixed(1)} ${yBase} Z`;

  // En yuksek gunu vurgula.
  let peak = 0;
  points.forEach((p, i) => {
    if (p.amount > points[peak].amount) peak = i;
  });
  const hasSpend = points.some((p) => p.amount > 0);

  // X ekseni icin ~5 esit araliklı gun etiketi.
  const tickCount = Math.min(5, n);
  const ticks = Array.from({ length: tickCount }, (_, k) =>
    Math.round((k * (n - 1)) / Math.max(tickCount - 1, 1)),
  );

  return (
    <>
      <svg
        className="chart"
        viewBox="0 0 320 124"
        preserveAspectRatio="none"
        role="img"
        aria-label="Günlük harcama eğrisi"
      >
        <line x1="10" y1="104" x2="310" y2="104" stroke="#e3e7e1" strokeWidth={1} />
        <line x1="10" y1="66" x2="310" y2="66" stroke="#eef1ee" strokeWidth={1} />
        <path d={area} fill="#1b5e45" fillOpacity={0.1} />
        <path
          d={line}
          fill="none"
          stroke="#1b5e45"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hasSpend && (
          <circle cx={xAt(peak)} cy={yAt(points[peak].amount)} r={3.5} fill="#1b5e45" />
        )}
      </svg>
      <div className="chart-x">
        {ticks.map((i) => (
          <span key={i}>{points[i]?.day}</span>
        ))}
      </div>
    </>
  );
}
